import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ valid: false, error: "Token is required" }, { status: 400 });
  }

  const db = createServiceClient();
  const { data: invitation } = await db
    .from("invitations")
    .select("id, expires_at, used_at, application_id, applications(name, email)")
    .eq("token", token)
    .maybeSingle();

  if (!invitation) {
    return NextResponse.json({ valid: false, error: "Invalid invitation link." }, { status: 404 });
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json(
      { valid: false, error: "This invitation link has expired. Please contact us." },
      { status: 410 }
    );
  }

  // If the invitation is marked used, check whether signup was actually completed.
  // If a user exists for this application but hasn't finished all 3 steps,
  // allow them to resume rather than showing "link already used".
  if (invitation.used_at) {
    const { data: user } = await db
      .from("users")
      .select("id")
      .eq("application_id", invitation.application_id)
      .maybeSingle();

    if (user) {
      const { data: profile } = await db
        .from("designer_profiles")
        .select("id, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) {
        // User created (step 1 done) but profile not saved yet — resume at step 2
        const appsRaw = invitation.applications as unknown;
        const app = (Array.isArray(appsRaw) ? appsRaw[0] : appsRaw) as
          | { name: string; email: string }
          | null;
        return NextResponse.json({
          valid: true,
          resumeStep: 2,
          applicationId: invitation.application_id,
          applicantName: app?.name ?? "",
          applicantEmail: app?.email ?? "",
        });
      }

      if (!profile.avatar_url) {
        // Profile saved (step 2 done) but avatar not set yet — resume at step 3
        const appsRaw = invitation.applications as unknown;
        const app = (Array.isArray(appsRaw) ? appsRaw[0] : appsRaw) as
          | { name: string; email: string }
          | null;
        return NextResponse.json({
          valid: true,
          resumeStep: 3,
          applicationId: invitation.application_id,
          applicantName: app?.name ?? "",
          applicantEmail: app?.email ?? "",
        });
      }
    }

    // Signup fully completed — link is truly used
    return NextResponse.json(
      { valid: false, error: "This invitation link has already been used." },
      { status: 410 }
    );
  }

  const appsRaw = invitation.applications as unknown;
  const app = (Array.isArray(appsRaw) ? appsRaw[0] : appsRaw) as
    | { name: string; email: string }
    | null;

  return NextResponse.json({
    valid: true,
    applicationId: invitation.application_id,
    applicantName: app?.name ?? "",
    applicantEmail: app?.email ?? "",
  });
}
