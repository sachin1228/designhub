import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";
import { z } from "zod";

const VALID_REASONS = ["spam", "harassment", "hate", "violence", "nudity", "scam", "copyright", "other"] as const;

const ReportSchema = z.object({
  content_type: z.enum(["message", "image"]),
  content_id:   z.string().uuid(),
  community_id: z.string().uuid().optional(),
  reason:       z.enum(VALID_REASONS),
  description:  z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  let session;
  try { session = await requireSession("user"); } catch (e) { return e as Response; }
  const userId = session.userId!;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = ReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid report data.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { content_type, content_id, community_id, reason, description } = parsed.data;

  const db = createServiceClient();

  // Verify the content exists
  if (content_type === "message") {
    const { data } = await db
      .from("community_messages")
      .select("id")
      .eq("id", content_id)
      .maybeSingle();
    if (!data) return NextResponse.json({ error: "Content not found." }, { status: 404 });
  }

  // Prevent duplicate reports
  const { error: insertError } = await db
    .from("content_reports")
    .insert({
      reporter_id:  userId,
      content_type,
      content_id,
      community_id: community_id ?? null,
      reason,
      description:  description ?? null,
    });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "You have already reported this content." }, { status: 409 });
    }
    console.error("[POST /api/reports]", insertError);
    return NextResponse.json({ error: "Failed to submit report." }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
