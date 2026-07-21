import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSession } from "@/lib/auth/session";

/** Admin-only: returns all communities with member/message counts */
export async function GET() {
  try { await requireSession("admin"); } catch (e) { return e as Response; }

  const db = createServiceClient();

  const { data: communities, error } = await db
    .from("communities")
    .select("id, name, type, image_url, is_public, reference_id, created_at")
    .order("type")
    .order("name");

  if (error) {
    return NextResponse.json({ error: "Failed to fetch communities." }, { status: 500 });
  }
  if (!communities?.length) return NextResponse.json({ communities: [] });

  // Member counts — one query, aggregate in JS
  const ids = communities.map((c) => c.id);
  const [{ data: memberRows }, { data: messageRows }] = await Promise.all([
    db.from("community_members").select("community_id").in("community_id", ids),
    db.from("community_messages").select("community_id").in("community_id", ids),
  ]);

  const memberCount: Record<string, number> = {};
  const messageCount: Record<string, number> = {};
  for (const r of memberRows ?? [])  memberCount[r.community_id]  = (memberCount[r.community_id]  ?? 0) + 1;
  for (const r of messageRows ?? []) messageCount[r.community_id] = (messageCount[r.community_id] ?? 0) + 1;

  const result = communities.map((c) => ({
    ...c,
    member_count:  memberCount[c.id]  ?? 0,
    message_count: messageCount[c.id] ?? 0,
  }));

  return NextResponse.json({ communities: result });
}
