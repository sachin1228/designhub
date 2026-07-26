import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSession } from "@/lib/auth/session";

export async function GET() {
  let session;
  try {
    session = await requireSession("user");
  } catch (error) {
    return error as Response;
  }

  const userId = session.userId!;
  const db = createServiceClient();

  const { data, error } = await db
    .from("community_threads")
    .select(
      "id, community_id, user_id, title, description, category, tags, attachments, links, allow_replies, created_at, updated_at, communities(name)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[GET profile threads]", error);
    return NextResponse.json({ error: "Failed to fetch your threads." }, { status: 500 });
  }

  const threads = (data ?? []).map((thread) => ({
    ...thread,
    users: null,
    community: (thread as { communities?: { name: string } | null }).communities ?? null,
    communities: undefined,
  }));

  if (!threads.length) {
    return NextResponse.json({ threads: [] });
  }

  // Fetch vote counts and user's votes
  const threadIds = threads.map((t) => t.id);
  const [{ data: allVotes }, { data: myVotes }] = await Promise.all([
    db.from("thread_votes").select("thread_id").in("thread_id", threadIds),
    db.from("thread_votes").select("thread_id").in("thread_id", threadIds).eq("user_id", userId),
  ]);

  const voteCountMap: Record<string, number> = {};
  for (const vote of allVotes ?? []) {
    voteCountMap[vote.thread_id] = (voteCountMap[vote.thread_id] ?? 0) + 1;
  }
  const myVoteSet = new Set((myVotes ?? []).map((v) => v.thread_id));

  return NextResponse.json({
    threads: threads.map((thread) => ({
      ...thread,
      vote_count: voteCountMap[thread.id] ?? 0,
      user_voted: myVoteSet.has(thread.id),
    })),
  });
}
