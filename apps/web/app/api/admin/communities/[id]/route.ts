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

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try { await requireSession("admin"); } catch (e) { return e as Response; }

  const db = createServiceClient();
  const { id } = params;

  // Community base info
  const { data: community, error } = await db
    .from("communities")
    .select("id, name, type, image_url, description, reference_id, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !community) {
    return NextResponse.json({ error: "Community not found." }, { status: 404 });
  }

  // ── Resolve reference entity: name + image_url from master table ────────────
  let reference_name: string | null = null;
  let resolved_image_url: string | null = community.image_url ?? null;

  const lookup = TABLE_LOOKUP[community.type];
  if (lookup && community.reference_id) {
    const { data: refRow } = await db
      .from(lookup.table as any)
      .select("name, image_url")
      .eq(lookup.idCol, community.reference_id)
      .single();

    if (refRow) {
      reference_name    = (refRow as any).name      ?? null;
      resolved_image_url = (refRow as any).image_url ?? community.image_url ?? null;
    }
  }

  // ── Counts + members + messages (parallel) ──────────────────────────────────
  const [
    { count: member_count },
    { count: message_count },
    { data: memberRows },
    { data: msgRows },
  ] = await Promise.all([
    db.from("community_members").select("*", { count: "exact", head: true }).eq("community_id", id),
    db.from("community_messages").select("*", { count: "exact", head: true }).eq("community_id", id),
    db
      .from("community_members")
      .select("user_id, joined_at")
      .eq("community_id", id)
      .order("joined_at", { ascending: false })
      .limit(20),
    db
      .from("community_messages")
      .select("id, content, created_at, user_id")
      .eq("community_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // Resolve member user details
  let members: { id: string; name: string; email: string; joined_at: string }[] = [];
  if (memberRows?.length) {
    const userIds = memberRows.map((m) => m.user_id);
    const { data: userRows } = await db
      .from("users")
      .select("id, name, email")
      .in("id", userIds);
    const userMap = Object.fromEntries((userRows ?? []).map((u) => [u.id, u]));
    members = memberRows.map((m) => ({
      id:        m.user_id,
      name:      userMap[m.user_id]?.name  ?? "Unknown",
      email:     userMap[m.user_id]?.email ?? "",
      joined_at: m.joined_at,
    }));
  }

  // Resolve message sender names
  let messages: { id: string; content: string; created_at: string; user_name: string }[] = [];
  if (msgRows?.length) {
    const senderIds = [...new Set(msgRows.map((m) => m.user_id))];
    const { data: senderRows } = await db
      .from("users")
      .select("id, name")
      .in("id", senderIds);
    const senderMap = Object.fromEntries((senderRows ?? []).map((u) => [u.id, u.name]));
    messages = msgRows.map((m) => ({
      id:         m.id,
      content:    m.content,
      created_at: m.created_at,
      user_name:  senderMap[m.user_id] ?? "Unknown",
    }));
  }

  return NextResponse.json({
    community: {
      ...community,
      image_url:      resolved_image_url,
      reference_name,
      member_count:   member_count  ?? 0,
      message_count:  message_count ?? 0,
      members,
      messages,
    },
  });
}
