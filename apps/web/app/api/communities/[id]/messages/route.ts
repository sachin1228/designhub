import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSession } from "@/lib/auth/session";

const PAGE_SIZE = 50;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try { session = await requireSession("user"); } catch (e) { return e as Response; }
  const userId = session.userId!;
  const { id: communityId } = await params;

  const db = createServiceClient();

  // Verify membership
  const { data: membership } = await db
    .from("community_members")
    .select("joined_at")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this community." }, { status: 403 });
  }

  // Optional cursor for older messages
  const before = req.nextUrl.searchParams.get("before");

  let query = db
    .from("community_messages")
    .select("id, content, created_at, user_id, users!inner(name, avatar_url)")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (before) query = query.lt("created_at", before);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: "Failed to fetch messages." }, { status: 500 });

  // Return oldest-first for display
  const messages = (data ?? []).reverse();

  return NextResponse.json({ messages });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try { session = await requireSession("user"); } catch (e) { return e as Response; }
  const userId = session.userId!;
  const { id: communityId } = await params;

  const db = createServiceClient();

  // Verify membership
  const { data: membership } = await db
    .from("community_members")
    .select("joined_at")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this community." }, { status: 403 });
  }

  let content: string;
  try {
    const body = await req.json();
    content = (body.content ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!content) return NextResponse.json({ error: "Message cannot be empty." }, { status: 422 });
  if (content.length > 2000) return NextResponse.json({ error: "Message too long." }, { status: 422 });

  const { data: message, error } = await db
    .from("community_messages")
    .insert({ community_id: communityId, user_id: userId, content })
    .select("id, content, created_at, user_id, users!inner(name, avatar_url)")
    .single();

  if (error) return NextResponse.json({ error: "Failed to send message." }, { status: 500 });

  return NextResponse.json({ message }, { status: 201 });
}
