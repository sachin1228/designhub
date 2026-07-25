import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSession } from "@/lib/auth/session";
import { masterDataSchema } from "@/lib/validations";

const DEFAULT_LEVELS = [
  { slug: "student",        name: "Students" },
  { slug: "fresher",        name: "Freshers" },
  { slug: "junior",         name: "Junior Developers" },
  { slug: "mid_level",      name: "Mid-Level Developers" },
  { slug: "senior",         name: "Senior Developers" },
  { slug: "lead",           name: "Lead Developers" },
  { slug: "principal",      name: "Principal Developers" },
  { slug: "staff",          name: "Staff Developers" },
  { slug: "design_manager", name: "Engineering Managers" },
  { slug: "head_of_design", name: "Heads of Engineering" },
  { slug: "director",       name: "Engineering Directors" },
  { slug: "vp",             name: "VP of Engineering" },
  { slug: "consultant",     name: "Developer Consultants" },
  { slug: "freelancer",     name: "Freelancers" },
];

export async function GET(_request: NextRequest) {
  try { await requireSession("admin"); } catch (e) { return e as Response; }
  const db = createServiceClient();

  let { data, error } = await db
    .from("experience_levels")
    .select("id, slug, name, image_url, is_active, created_at, updated_at")
    .order("name")
    .limit(500); // safety cap — prevents unbounded scans as data grows

  if (error) return NextResponse.json({ error: "Failed to fetch experience levels." }, { status: 500 });

  // Auto-seed: if the table is empty, insert the default levels and re-fetch
  if (!data || data.length === 0) {
    await db.from("experience_levels").upsert(
      DEFAULT_LEVELS,
      { onConflict: "slug", ignoreDuplicates: true }
    );
    const refetch = await db
      .from("experience_levels")
      .select("id, slug, name, image_url, is_active, created_at, updated_at")
      .order("name")
      .limit(500);
    data = refetch.data ?? [];
  }

  return NextResponse.json({
    experience_levels: (data ?? []).map((r) => ({
      ...r,
      // Graceful fallback if migration hasn't been applied yet
      is_active: r.is_active ?? true,
      updated_at: r.updated_at ?? r.created_at,
    })),
  });
}

/** Converts a display name to a URL-safe slug. */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function POST(request: NextRequest) {
  try { await requireSession("admin"); } catch (e) { return e as Response; }

  const parsed = masterDataSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("experience_levels")
    .insert({
      name:      parsed.data.name,
      slug:      toSlug(parsed.data.name),
      image_url: parsed.data.image_url ?? null,
    })
    .select("id, slug, name, image_url, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "An experience level with this name already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create experience level." }, { status: 500 });
  }

  revalidateTag("master-images", {});
  return NextResponse.json({
    experience_level: { ...data, is_active: true, updated_at: data.created_at },
  }, { status: 201 });
}
