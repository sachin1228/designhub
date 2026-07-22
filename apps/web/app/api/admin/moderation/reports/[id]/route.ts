import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";
import { writeAuditLog } from "@/lib/moderation/logger";
import { z } from "zod";

const ResolveSchema = z.object({
  action: z.enum(["resolved_approve", "resolved_reject"]),
  reason: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try { session = await requireSession("admin"); } catch (e) { return e as Response; }
  const { id: reportId } = await params;
  const moderatorEmail = (session as any).email ?? "admin";

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = ResolveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid action." }, { status: 422 });

  const { action, reason } = parsed.data;
  const db = createServiceClient();

  const { data: report } = await db
    .from("content_reports")
    .select("id, content_type, content_id")
    .eq("id", reportId)
    .maybeSingle();

  if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });

  await db
    .from("content_reports")
    .update({
      status:      action,
      resolved_by: moderatorEmail,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  await writeAuditLog({
    moderatorEmail,
    action: "resolve_report",
    targetContentType: report.content_type,
    targetContentId:   report.content_id,
    reason,
    metadata: { resolution: action },
  });

  return NextResponse.json({ success: true });
}
