import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";
import { writeAuditLog } from "@/lib/moderation/logger";
import { z } from "zod";

const ActionSchema = z.object({
  action: z.enum(["approve", "reject", "delete"]),
  reason: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try { session = await requireSession("admin"); } catch (e) { return e as Response; }
  const { id: messageId } = await params;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action." }, { status: 422 });
  }

  const { action, reason } = parsed.data;
  const db = createServiceClient();

  // Fetch message to confirm it exists
  const { data: msg } = await db
    .from("community_messages")
    .select("id, user_id, content, image_url")
    .eq("id", messageId)
    .maybeSingle();

  if (!msg) return NextResponse.json({ error: "Message not found." }, { status: 404 });

  if (action === "delete") {
    await db.from("community_messages").delete().eq("id", messageId);
  } else {
    const newStatus = action === "approve" ? "approved" : "rejected";
    await db
      .from("community_messages")
      .update({ moderation_status: newStatus })
      .eq("id", messageId);

    // Update the moderation log if one exists
    if ((msg as any).moderation_log_id) {
      await db
        .from("moderation_logs")
        .update({ status: newStatus })
        .eq("id", (msg as any).moderation_log_id);
    }
  }

  await writeAuditLog({
    moderatorEmail:     (session as any).email ?? "admin",
    action,
    targetUserId:       msg.user_id,
    targetContentType:  "message",
    targetContentId:    messageId,
    reason,
  });

  return NextResponse.json({ success: true });
}
