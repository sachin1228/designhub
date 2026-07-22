import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try { await requireSession("admin"); } catch (e) { return e as Response; }

  const db = createServiceClient();
  const { searchParams } = req.nextUrl;
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const status = searchParams.get("status") ?? "pending";

  const from = (page - 1) * PAGE_SIZE;

  const { data, count, error } = await db
    .from("content_reports")
    .select(`
      id, content_type, content_id, community_id, reason, description,
      status, resolved_by, resolved_at, created_at,
      reporter:reporter_id ( name, email )
    `, { count: "exact" })
    .eq("status", status)
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (error) {
    console.error("[admin reports]", error);
    return NextResponse.json({ error: "Failed to fetch reports." }, { status: 500 });
  }

  return NextResponse.json({ reports: data ?? [], total: count ?? 0, page, page_size: PAGE_SIZE });
}
