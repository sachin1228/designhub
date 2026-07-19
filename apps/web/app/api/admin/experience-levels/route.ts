import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSession } from "@/lib/auth/session";

export async function GET() {
  try { await requireSession("admin"); } catch (e) { return e as Response; }
  const db = createServiceClient();
  const { data, error } = await db
    .from("experience_levels")
    .select("id, slug, name, image_url, created_at")
    .order("name");
  if (error) return NextResponse.json({ error: "Failed to fetch experience levels." }, { status: 500 });
  // Wrap with is_active: true so MasterDataPage renders correctly (experience levels are always active)
  return NextResponse.json({ experience_levels: (data ?? []).map((r) => ({ ...r, is_active: true, updated_at: r.created_at })) });
}
