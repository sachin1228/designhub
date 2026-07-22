import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";

const PAGE_SIZE = 30;

export async function GET(req: NextRequest) {
  try { await requireSession("admin"); } catch (e) { return e as Response; }

  const db = createServiceClient();
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;

  const { data, count, error } = await db
    .from("moderation_audit_log")
    .select(`
      id, moderator_email, action, target_content_type, target_content_id, reason, metadata, created_at,
      target_user:target_user_id ( name, email )
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (error) {
    console.error("[audit log]", error);
    return NextResponse.json({ error: "Failed to fetch audit log." }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [], total: count ?? 0, page, page_size: PAGE_SIZE });
}
