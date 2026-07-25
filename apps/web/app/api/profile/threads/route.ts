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

  const db = createServiceClient();
  const { data, error } = await db
    .from("community_threads")
    .select(
      "id, community_id, user_id, title, description, category, tags, attachments, links, allow_replies, created_at, updated_at, communities(name)",
    )
    .eq("user_id", session.userId!)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[GET profile threads]", error);
    return NextResponse.json({ error: "Failed to fetch your threads." }, { status: 500 });
  }

  return NextResponse.json({
    threads: (data ?? []).map((thread) => ({
      ...thread,
      users: null,
      community: (thread as { communities?: { name: string } | null }).communities ?? null,
      communities: undefined,
    })),
  });
}