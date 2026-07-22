import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";
import { writeAuditLog } from "@/lib/moderation/logger";
import { z } from "zod";

const ActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("warn"),
    reason: z.string().min(1).max(500),
    note:   z.string().max(500).optional(),
  }),
  z.object({
    action:     z.literal("mute"),
    reason:     z.string().min(1).max(500),
    expires_at: z.string().datetime(),
    note:       z.string().max(500).optional(),
  }),
  z.object({
    action:     z.literal("temp_ban"),
    reason:     z.string().min(1).max(500),
    expires_at: z.string().datetime(),
    note:       z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal("perm_ban"),
    reason: z.string().min(1).max(500),
    note:   z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal("unban"),
    reason: z.string().max(500).optional(),
  }),
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  let session;
  try { session = await requireSession("admin"); } catch (e) { return e as Response; }
  const { userId } = await params;
  const moderatorEmail = (session as any).email ?? "admin";

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action.", details: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;
  const db = createServiceClient();

  // Verify user exists
  const { data: user } = await db.from("users").select("id").eq("id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  if (data.action === "unban") {
    // Revoke all active bans
    await db
      .from("user_punishments")
      .update({ revoked_at: new Date().toISOString(), revoked_by: moderatorEmail })
      .eq("user_id", userId)
      .in("type", ["temp_ban", "perm_ban"])
      .is("revoked_at", null);

    // Unblock in users table
    await db.from("users").update({ is_blocked: false }).eq("id", userId);
  } else {
    const isPermanentBlock = data.action === "perm_ban";
    const expiresAt = "expires_at" in data ? data.expires_at : null;
    const note = "note" in data ? data.note : undefined;

    await db.from("user_punishments").insert({
      user_id:        userId,
      type:           data.action,
      reason:         data.reason,
      expires_at:     expiresAt ?? null,
      moderator_note: note ?? null,
      created_by:     moderatorEmail,
    });

    if (isPermanentBlock) {
      await db.from("users").update({ is_blocked: true }).eq("id", userId);
    }
  }

  await writeAuditLog({
    moderatorEmail,
    action:        data.action,
    targetUserId:  userId,
    reason:        "reason" in data ? data.reason : undefined,
  });

  return NextResponse.json({ success: true });
}
