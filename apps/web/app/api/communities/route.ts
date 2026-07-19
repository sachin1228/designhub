import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSession } from "@/lib/auth/session";

export async function GET() {
  let session;
  try { session = await requireSession("user"); } catch (e) { return e as Response; }
  const userId = session.userId!;

  const db = createServiceClient();

  // 1. Community IDs this user belongs to
  const { data: memberships, error: mErr } = await db
    .from("community_members")
    .select("community_id")
    .eq("user_id", userId);

  if (mErr) return NextResponse.json({ error: "Failed to fetch communities." }, { status: 500 });
  if (!memberships?.length) return NextResponse.json({ communities: [] });

  const ids = memberships.map((m) => m.community_id);

  // 2. Community rows
  const { data: communities, error: cErr } = await db
    .from("communities")
    .select("id, name, type, image_url, reference_id")
    .in("id", ids);

  if (cErr) return NextResponse.json({ error: "Failed to fetch communities." }, { status: 500 });

  // 3. Member counts (one query per community — PostgREST count)
  const countResults = await Promise.all(
    ids.map((id) =>
      db
        .from("community_members")
        .select("*", { count: "exact", head: true })
        .eq("community_id", id)
        .then(({ count }) => ({ id, count: count ?? 0 }))
    )
  );
  const countMap = Object.fromEntries(countResults.map((r) => [r.id, r.count]));

  // 4. Last message per community
  const lastMsgResults = await Promise.all(
    ids.map((id) =>
      db
        .from("community_messages")
        .select("content, created_at, user:users!inner(name)")
        .eq("community_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => ({ id, last: data }))
    )
  );
  const lastMsgMap = Object.fromEntries(lastMsgResults.map((r) => [r.id, r.last]));

  // 5. Assemble + sort by last message recency
  const result = (communities ?? [])
    .map((c) => ({
      ...c,
      member_count: countMap[c.id] ?? 0,
      last_message: lastMsgMap[c.id] ?? null,
    }))
    .sort((a, b) => {
      const ta = a.last_message?.created_at ?? a.reference_id;
      const tb = b.last_message?.created_at ?? b.reference_id;
      return tb > ta ? 1 : -1;
    });

  return NextResponse.json({ communities: result });
}
