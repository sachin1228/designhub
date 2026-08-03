import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSession } from "@/lib/auth/session";

const PAGE_SIZE = 30;

export async function GET(req: NextRequest) {
  let session;
  try { session = await requireSession("user"); } catch (e) { return e as Response; }
  const userId = session.userId!;
  const db = createServiceClient();

  const before = req.nextUrl.searchParams.get("before") ?? null;

  let threadsQ = db
    .from("community_threads")
    .select("id, community_id, user_id, title, description, category, tags, allow_replies, is_public, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  let eventsQ = db
    .from("community_events")
    .select("id, community_id, user_id, title, description, event_date, is_online, location, cover_image_url, is_public, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  let resourcesQ = db
    .from("community_resources")
    .select("id, community_id, user_id, title, description, resource_type, url, tags, is_public, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (before) {
    threadsQ   = threadsQ.lt("created_at", before);
    eventsQ    = eventsQ.lt("created_at", before);
    resourcesQ = resourcesQ.lt("created_at", before);
  }

  const [{ data: threads }, { data: events }, { data: resources }] = await Promise.all([
    threadsQ, eventsQ, resourcesQ,
  ]);

  // Merge and sort newest-first, take top PAGE_SIZE
  const all = [
    ...(threads   ?? []).map((t) => ({ ...t, _type: "thread"   as const })),
    ...(events    ?? []).map((e) => ({ ...e, _type: "event"    as const })),
    ...(resources ?? []).map((r) => ({ ...r, _type: "resource" as const })),
  ]
    .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
    .slice(0, PAGE_SIZE);

  if (!all.length) return NextResponse.json({ items: [] });

  // Collect IDs for batch enrichment
  const userIds      = [...new Set(all.map((i) => i.user_id))];
  const communityIds = [...new Set(all.map((i) => i.community_id))];
  const threadIds    = all.filter((i) => i._type === "thread").map((i) => i.id);
  const eventIds     = all.filter((i) => i._type === "event").map((i) => i.id);
  const resourceIds  = all.filter((i) => i._type === "resource").map((i) => i.id);

  const [
    { data: users },
    { data: profiles },
    { data: communities },
    { data: threadComments },
    { data: eventComments },
    { data: resourceComments },
    { data: threadVotes },
    { data: myThreadVotes },
  ] = await Promise.all([
    db.from("users").select("id, name").in("id", userIds),
    db.from("designer_profiles").select("user_id, avatar_url").in("user_id", userIds),
    db.from("communities").select("id, name").in("id", communityIds),
    threadIds.length
      ? db.from("thread_comments").select("thread_id").in("thread_id", threadIds)
      : Promise.resolve({ data: [] as { thread_id: string }[] }),
    eventIds.length
      ? db.from("event_comments").select("event_id").in("event_id", eventIds)
      : Promise.resolve({ data: [] as { event_id: string }[] }),
    resourceIds.length
      ? db.from("resource_comments").select("resource_id").in("resource_id", resourceIds)
      : Promise.resolve({ data: [] as { resource_id: string }[] }),
    threadIds.length
      ? db.from("thread_votes").select("thread_id").in("thread_id", threadIds)
      : Promise.resolve({ data: [] as { thread_id: string }[] }),
    threadIds.length
      ? db.from("thread_votes").select("thread_id").in("thread_id", threadIds).eq("user_id", userId)
      : Promise.resolve({ data: [] as { thread_id: string }[] }),
  ]);

  const userMap      = Object.fromEntries((users      ?? []).map((u) => [u.id,      u.name]));
  const avatarMap    = Object.fromEntries((profiles   ?? []).map((p) => [p.user_id, p.avatar_url]));
  const communityMap = Object.fromEntries((communities ?? []).map((c) => [c.id,     c.name]));

  const threadCmtCount: Record<string, number>   = {};
  for (const c of (threadComments ?? []))   threadCmtCount[c.thread_id]   = (threadCmtCount[c.thread_id]   ?? 0) + 1;

  const eventCmtCount: Record<string, number>    = {};
  for (const c of (eventComments ?? []))    eventCmtCount[c.event_id]     = (eventCmtCount[c.event_id]     ?? 0) + 1;

  const resourceCmtCount: Record<string, number> = {};
  for (const c of (resourceComments ?? [])) resourceCmtCount[c.resource_id] = (resourceCmtCount[c.resource_id] ?? 0) + 1;

  const voteCount: Record<string, number> = {};
  for (const v of (threadVotes ?? [])) voteCount[v.thread_id] = (voteCount[v.thread_id] ?? 0) + 1;
  const myVoteSet = new Set((myThreadVotes ?? []).map((v) => v.thread_id));

  const items = all.map((item) => {
    const base = {
      ...item,
      community_name: communityMap[item.community_id] ?? null,
      users: userMap[item.user_id]
        ? { name: userMap[item.user_id], avatar_url: avatarMap[item.user_id] ?? null }
        : null,
    };

    if (item._type === "thread") {
      return { ...base, comment_count: threadCmtCount[item.id] ?? 0, vote_count: voteCount[item.id] ?? 0, user_voted: myVoteSet.has(item.id) };
    }
    if (item._type === "event") {
      return { ...base, comment_count: eventCmtCount[item.id] ?? 0 };
    }
    return { ...base, comment_count: resourceCmtCount[item.id] ?? 0 };
  });

  return NextResponse.json({ items });
}
