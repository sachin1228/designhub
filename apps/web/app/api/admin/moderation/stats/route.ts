import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(_req: NextRequest) {
  try { await requireSession("admin"); } catch (e) { return e as Response; }

  const db = createServiceClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const [
    { count: totalUsers },
    { count: messagesToday },
    { count: imagesUploaded },
    { count: approvedContent },
    { count: rejectedContent },
    { count: reviewContent },
    { count: warnedUsers },
    { count: bannedUsers },
    { count: pendingReports },
  ] = await Promise.all([
    db.from("users").select("*", { count: "exact", head: true }),
    db.from("community_messages").select("*", { count: "exact", head: true }).gte("created_at", todayIso),
    db.from("moderation_logs").select("*", { count: "exact", head: true }).eq("content_type", "image"),
    db.from("moderation_logs").select("*", { count: "exact", head: true }).eq("status", "approved"),
    db.from("moderation_logs").select("*", { count: "exact", head: true }).eq("status", "rejected"),
    db.from("moderation_logs").select("*", { count: "exact", head: true }).eq("status", "review"),
    db.from("user_punishments").select("*", { count: "exact", head: true }).eq("type", "warning"),
    db.from("user_punishments").select("*", { count: "exact", head: true }).in("type", ["temp_ban", "perm_ban"]).is("revoked_at", null),
    db.from("content_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return NextResponse.json({
    total_users:      totalUsers ?? 0,
    messages_today:   messagesToday ?? 0,
    images_uploaded:  imagesUploaded ?? 0,
    approved_content: approvedContent ?? 0,
    rejected_content: rejectedContent ?? 0,
    review_content:   reviewContent ?? 0,
    warned_users:     warnedUsers ?? 0,
    banned_users:     bannedUsers ?? 0,
    pending_reports:  pendingReports ?? 0,
  });
}
