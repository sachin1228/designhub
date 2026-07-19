import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSession } from "@/lib/auth/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try { session = await requireSession("user"); } catch (e) { return e as Response; }
  const userId = session.userId!;
  const { id } = await params;

  const db = createServiceClient();

  // Verify user is a member
  const { data: membership } = await db
    .from("community_members")
    .select("joined_at")
    .eq("community_id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this community." }, { status: 403 });
  }

  const { data: community, error } = await db
    .from("communities")
    .select("id, name, type, image_url, reference_id, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !community) {
    return NextResponse.json({ error: "Community not found." }, { status: 404 });
  }

  // Member count
  const { count: member_count } = await db
    .from("community_members")
    .select("*", { count: "exact", head: true })
    .eq("community_id", id);

  // Recent members — fetch user info separately to avoid !inner join issues
  const { data: memberRows } = await db
    .from("community_members")
    .select("user_id, joined_at")
    .eq("community_id", id)
    .order("joined_at", { ascending: false })
    .limit(10);

  const members = await Promise.all(
    (memberRows ?? []).map(async (m) => {
      const { data: user } = await db
        .from("users")
        .select("name, avatar_url")
        .eq("id", m.user_id)
        .single();
      return { ...m, users: user ?? null };
    })
  );

  return NextResponse.json({
    community: { ...community, member_count: member_count ?? 0 },
    members,
  });
}
