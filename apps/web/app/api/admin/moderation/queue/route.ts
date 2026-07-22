import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try { await requireSession("admin"); } catch (e) { return e as Response; }

  const db = createServiceClient();
  const { searchParams } = req.nextUrl;
  const page       = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const status     = searchParams.get("status") ?? "review";   // review | rejected | approved
  const type       = searchParams.get("type") ?? "";            // message | image | ""

  const from = (page - 1) * PAGE_SIZE;

  let q = db
    .from("community_messages")
    .select(`
      id, content, image_url, created_at, community_id, user_id,
      moderation_status, moderation_log_id,
      users:user_id ( name ),
      moderation_logs:moderation_log_id ( provider, confidence, reason, status )
    `, { count: "exact" })
    .eq("moderation_status", status)
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (type === "image") q = q.not("image_url", "is", null);
  if (type === "text")  q = q.is("image_url", null);

  const { data, count, error } = await q;

  if (error) {
    console.error("[moderation queue]", error);
    return NextResponse.json({ error: "Failed to fetch queue." }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [], total: count ?? 0, page, page_size: PAGE_SIZE });
}
