import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSession } from "@/lib/auth/session";

const TABLE_LOOKUP: Record<string, { table: string; idCol: string }> = {
  city:             { table: "cities",            idCol: "id" },
  sector:           { table: "design_sectors",    idCol: "id" },
  interest:         { table: "design_interests",  idCol: "id" },
  company:          { table: "companies",         idCol: "id" },
  experience_level: { table: "experience_levels", idCol: "id" },
};

/** Admin-only: returns all communities with resolved images + member/message counts */
export async function GET() {
  try { await requireSession("admin"); } catch (e) { return e as Response; }

  const db = createServiceClient();

  const { data: communities, error } = await db
    .from("communities")
    .select("id, name, type, image_url, reference_id, created_at")
    .order("type")
    .order("name");

  if (error) {
    return NextResponse.json({ error: "Failed to fetch communities." }, { status: 500 });
  }
  if (!communities?.length) return NextResponse.json({ communities: [] });

  // ── Resolve image_url from master tables (same logic as user-facing /api/communities/all) ──
  const byType: Record<string, { id: string; reference_id: string }[]> = {};
  for (const c of communities) {
    if (!byType[c.type]) byType[c.type] = [];
    byType[c.type].push({ id: c.id, reference_id: c.reference_id });
  }

  const masterImageMap: Record<string, string | null> = {};

  await Promise.all(
    Object.entries(byType).map(async ([type, items]) => {
      const lookup = TABLE_LOOKUP[type];
      if (!lookup) return;

      const { data: rows } = await db
        .from(lookup.table as any)
        .select(`${lookup.idCol}, image_url`)
        .in(lookup.idCol, items.map((i) => i.reference_id));

      const imgMap = Object.fromEntries(
        (rows ?? []).map((r: any) => [r[lookup.idCol], r.image_url ?? null])
      );
      for (const item of items) {
        masterImageMap[item.id] = imgMap[item.reference_id] ?? null;
      }
    })
  );

  // ── Member + message counts (parallel) ──────────────────────────────────────
  const [memberCounts, messageCounts] = await Promise.all([
    Promise.all(
      communities.map((c) =>
        db
          .from("community_members")
          .select("*", { count: "exact", head: true })
          .eq("community_id", c.id)
          .then(({ count }) => ({ id: c.id, count: count ?? 0 }))
      )
    ),
    Promise.all(
      communities.map((c) =>
        db
          .from("community_messages")
          .select("*", { count: "exact", head: true })
          .eq("community_id", c.id)
          .then(({ count }) => ({ id: c.id, count: count ?? 0 }))
      )
    ),
  ]);

  const memberCountMap  = Object.fromEntries(memberCounts.map((r)  => [r.id, r.count]));
  const messageCountMap = Object.fromEntries(messageCounts.map((r) => [r.id, r.count]));

  const result = communities.map((c) => ({
    id:            c.id,
    name:          c.name,
    type:          c.type,
    // prefer master-table image, fall back to communities.image_url
    image_url:     masterImageMap[c.id] ?? c.image_url ?? null,
    reference_id:  c.reference_id,
    created_at:    c.created_at,
    member_count:  memberCountMap[c.id]  ?? 0,
    message_count: messageCountMap[c.id] ?? 0,
  }));

  return NextResponse.json({ communities: result });
}
