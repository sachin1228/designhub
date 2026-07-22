import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(_req: NextRequest) {
  try { await requireSession("admin"); } catch (e) { return e as Response; }

  const db = createServiceClient();
  const { data, error } = await db.from("moderation_settings").select("key, value");

  if (error) return NextResponse.json({ error: "Failed to fetch settings." }, { status: 500 });

  const settings: Record<string, string> = {};
  for (const row of data ?? []) settings[row.key] = row.value;

  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  try { await requireSession("admin"); } catch (e) { return e as Response; }

  let body: Record<string, string>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const db = createServiceClient();

  const upserts = Object.entries(body).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }));

  const { error } = await db
    .from("moderation_settings")
    .upsert(upserts, { onConflict: "key" });

  if (error) {
    console.error("[moderation settings PATCH]", error);
    return NextResponse.json({ error: "Failed to save settings." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
