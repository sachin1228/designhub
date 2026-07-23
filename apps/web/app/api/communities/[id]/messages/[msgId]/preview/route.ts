import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSession } from "@/lib/auth/session";

// ── GET /api/communities/[id]/messages/[msgId]/preview ───────────────────────
// Returns minimal preview data for a single message (used by the realtime
// handler to lazy-load reply_to previews when the parent isn't in local state).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; msgId: string }> }
) {
  try { await requireSession("user"); } catch (e) { return e as Response; }
  const { id: communityId, msgId } = await params;
  const db = createServiceClient();

  const { data: msg } = await db
    .from("community_messages")
    .select("id, content, user_id")
    .eq("id", msgId)
    .eq("community_id", communityId)
    .maybeSingle();

  if (!msg) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { data: user } = await db
    .from("users")
    .select("name")
    .eq("id", msg.user_id)
    .maybeSingle();

  return NextResponse.json({
    id: msg.id,
    content: msg.content,
    user_name: user?.name ?? "Unknown",
  });
}
