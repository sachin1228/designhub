import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSession } from "@/lib/auth/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession("admin");
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const db = createServiceClient();

  const { data: user, error } = await db
    .from("users")
    .select(`
      id, name, email, is_blocked, created_at, application_id,
      designer_profiles (
        experience_level,
        company_id,
        city_id,
        sector_id,
        companies ( name ),
        cities ( name ),
        design_sectors ( name )
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin/users] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch user." }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // Fetch application URLs if linked
  let application: { linkedin_url: string | null; portfolio_url: string | null } | null = null;
  if (user.application_id) {
    const { data: app } = await db
      .from("applications")
      .select("linkedin_url, portfolio_url")
      .eq("id", user.application_id)
      .maybeSingle();
    application = app ?? null;
  }

  return NextResponse.json({ user, application });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession("admin");
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const db = createServiceClient();

  // --- Block / Unblock ---
  if ("is_blocked" in body) {
    const { is_blocked } = body as { is_blocked?: boolean };
    if (typeof is_blocked !== "boolean") {
      return NextResponse.json({ error: "is_blocked must be a boolean." }, { status: 422 });
    }
    const { data, error } = await db
      .from("users")
      .update({ is_blocked })
      .eq("id", id)
      .select("id, name, email, is_blocked")
      .single();
    if (error) {
      console.error("[admin/users] PATCH block error:", error);
      return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
    }
    return NextResponse.json({ user: data });
  }

  // --- Edit profile ---
  const { name, email, company_id, city_id, sector_id, experience_level, linkedin_url, portfolio_url } =
    body as {
      name?: string;
      email?: string;
      company_id?: string | null;
      city_id?: string | null;
      sector_id?: string | null;
      experience_level?: string;
      linkedin_url?: string | null;
      portfolio_url?: string | null;
    };

  // 1. Update users table
  if (name !== undefined || email !== undefined) {
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (email !== undefined) updates.email = email.trim().toLowerCase();

    const { error } = await db.from("users").update(updates).eq("id", id);
    if (error) {
      console.error("[admin/users] PATCH users error:", error);
      return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
    }
  }

  // 2. Update designer_profiles table
  if (company_id !== undefined || city_id !== undefined || sector_id !== undefined || experience_level !== undefined) {
    const profileUpdates: Record<string, unknown> = {};
    if (company_id !== undefined) profileUpdates.company_id = company_id || null;
    if (city_id !== undefined) profileUpdates.city_id = city_id || null;
    if (sector_id !== undefined) profileUpdates.sector_id = sector_id || null;
    if (experience_level !== undefined) profileUpdates.experience_level = experience_level;

    const { error } = await db.from("designer_profiles").update(profileUpdates).eq("user_id", id);
    if (error) {
      console.error("[admin/users] PATCH profile error:", error);
      return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
    }
  }

  // 3. Update applications table
  if (linkedin_url !== undefined || portfolio_url !== undefined) {
    // Fetch application_id first
    const { data: userRow } = await db
      .from("users")
      .select("application_id")
      .eq("id", id)
      .maybeSingle();

    if (userRow?.application_id) {
      const appUpdates: Record<string, unknown> = {};
      if (linkedin_url !== undefined) appUpdates.linkedin_url = linkedin_url || null;
      if (portfolio_url !== undefined) appUpdates.portfolio_url = portfolio_url || null;

      const { error } = await db
        .from("applications")
        .update(appUpdates)
        .eq("id", userRow.application_id);
      if (error) {
        console.error("[admin/users] PATCH application error:", error);
        return NextResponse.json({ error: "Failed to update application." }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession("admin");
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const db = createServiceClient();

  // Fetch application_id before deleting — we hard-delete it last.
  const { data: user } = await db
    .from("users")
    .select("application_id")
    .eq("id", id)
    .maybeSingle();

  // 1. Delete designer profile
  await db.from("designer_profiles").delete().eq("user_id", id);

  // 2. Delete user (must come before application due to FK ON DELETE RESTRICT)
  const { error } = await db.from("users").delete().eq("id", id);

  if (error) {
    console.error("[admin/users] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }

  // 3. Hard-delete the application so the email is completely free to reapply
  if (user?.application_id) {
    await db.from("applications").delete().eq("id", user.application_id);
  }

  return NextResponse.json({ success: true });
}
