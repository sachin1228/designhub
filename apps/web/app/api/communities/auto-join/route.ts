import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSession } from "@/lib/auth/session";

export async function POST() {
  let session;
  try { session = await requireSession("user"); } catch (e) { return e as Response; }
  const userId = session.userId!;

  const db = createServiceClient();

  // ── 1. Load profile (city + sector) ─────────────────────────
  const { data: profile } = await db
    .from("designer_profiles")
    .select("city_id, sector_id, cities(name), design_sectors(name)")
    .eq("user_id", userId)
    .maybeSingle();

  // ── 2. Load interests ────────────────────────────────────────
  const { data: interests } = await db
    .from("user_interests")
    .select("interest_id, design_interests(name)")
    .eq("user_id", userId);

  // Build list of communities to find-or-create
  type CommunitySpec = { type: "city" | "sector" | "interest"; reference_id: string; name: string };
  const specs: CommunitySpec[] = [];

  if (profile?.city_id) {
    const cityName = (profile.cities as { name: string } | null)?.name ?? "Unknown City";
    specs.push({ type: "city", reference_id: profile.city_id, name: `${cityName} Designers` });
  }

  if (profile?.sector_id) {
    const sectorName = (profile.design_sectors as { name: string } | null)?.name ?? "Unknown Sector";
    specs.push({ type: "sector", reference_id: profile.sector_id, name: `${sectorName} Community` });
  }

  for (const row of interests ?? []) {
    const interestName = (row.design_interests as { name: string } | null)?.name;
    if (row.interest_id && interestName) {
      specs.push({ type: "interest", reference_id: row.interest_id, name: interestName });
    }
  }

  if (!specs.length) return NextResponse.json({ joined: [] });

  // ── 3. Upsert each community ─────────────────────────────────
  const joinedCommunities: string[] = [];

  for (const spec of specs) {
    const { data: community, error } = await db
      .from("communities")
      .upsert(
        { type: spec.type, reference_id: spec.reference_id, name: spec.name },
        { onConflict: "type,reference_id", ignoreDuplicates: false }
      )
      .select("id")
      .single();

    if (error || !community) continue;

    // Add user as member (idempotent)
    await db
      .from("community_members")
      .upsert(
        { community_id: community.id, user_id: userId },
        { onConflict: "community_id,user_id", ignoreDuplicates: true }
      );

    joinedCommunities.push(community.id);
  }

  return NextResponse.json({ joined: joinedCommunities });
}
