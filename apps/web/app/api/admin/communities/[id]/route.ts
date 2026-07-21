import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSession } from "@/lib/auth/session";
import { z } from "zod";

const patchSchema = z.object({
  name:      z.string().min(1).max(200).optional(),
  is_public: z.boolean().optional(),
  image_url: z.string().url().nullable().optional(),
}).partial();

/** GET /api/admin/communities/[id] — fetch a single community with stats */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireSession("admin"); } catch (e) { return e as Response; }
  const { id } = await params;
  const db = createServiceClient();

  const { data: community, error } = await db
    .from("communities")
    .select("id, name, type, image_url, is_public, reference_id, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Failed to fetch community." }, { status: 500 });
  if (!community) return NextResponse.json({ error: "Community not found." }, { status: 404 });

  // Stats in parallel
  const [{ count: memberCount }, { count: messageCount }] = await Promise.all([
    db.from("community_members").select("*", { count: "exact", head: true }).eq("community_id", id),
    db.from("community_messages").select("*", { count: "exact", head: true }).eq("community_id", id),
  ]);

  return NextResponse.json({
    community: {
      ...community,
      member_count:  memberCount  ?? 0,
      message_count: messageCount ?? 0,
    },
  });
}

/** PATCH /api/admin/communities/[id] — update name, is_public, or image_url */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireSession("admin"); } catch (e) { return e as Response; }
  const { id } = await params;

  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("communities")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, name, type, image_url, is_public, reference_id, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A community with this name already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update community." }, { status: 500 });
  }

  return NextResponse.json({ community: data });
}

/** DELETE /api/admin/communities/[id] — remove community + cascade members/messages */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireSession("admin"); } catch (e) { return e as Response; }
  const { id } = await params;
  const db = createServiceClient();

  const { error } = await db.from("communities").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Failed to delete community." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
