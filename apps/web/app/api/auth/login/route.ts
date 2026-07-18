import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServiceClient } from "@/lib/supabase/service";
import { loginSchema } from "@/lib/validations";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/rate-limit";

/**
 * Resolve the admin bcrypt hash from environment variables.
 *
 * Next.js runs dotenv-expand after dotenv, which expands $VAR references even
 * inside single-quoted strings.  Bcrypt hashes start with $2a$/$2b$/$2y$ and
 * are therefore mangled before they reach the application.  Vercel bypasses
 * dotenv entirely, so production is unaffected.
 *
 * To sidestep this completely, store the hash base64-encoded in
 * ADMIN_PASSWORD_HASH — base64 contains no $ signs, so dotenv-expand leaves
 * it alone.  The raw ADMIN_PASSWORD fallback is kept for environments (e.g.
 * Vercel, Docker) that inject env vars without dotenv parsing.
 */
function resolveAdminHash(): string | undefined {
  // Preferred: base64-encoded hash — immune to dotenv-expand interpolation.
  const b64 = process.env.ADMIN_PASSWORD_HASH;
  if (b64) {
    return Buffer.from(b64, "base64").toString("utf-8");
  }

  // Fallback: raw hash — works on Vercel/Docker; broken in local .env files.
  const raw = process.env.ADMIN_PASSWORD;
  if (raw?.startsWith("$2")) return raw;

  if (raw) {
    console.error(
      "[auth] ADMIN_PASSWORD is malformed (dollar signs expanded by dotenv). " +
      "Switch to ADMIN_PASSWORD_HASH instead — store the base64-encoded hash:\n" +
      "  node -e \"console.log(Buffer.from(require('fs').readFileSync('/dev/stdin','utf8').trim()).toString('base64'))\" <<< '$2a$12$...'\n" +
      "Or use the one-liner in .env.example."
    );
  }

  return undefined;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`login:${ip}`, 10, 900); // 10 per 15 min
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { email, password } = parsed.data;

  // ── Admin short-circuit ──────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswordHash = resolveAdminHash();

  if (adminEmail && adminPasswordHash) {
    if (
      email.toLowerCase() === adminEmail.toLowerCase() &&
      (await bcrypt.compare(password, adminPasswordHash))
    ) {
      const token = await createSession({ email: adminEmail, role: "admin" });
      const response = NextResponse.json({ success: true, redirect: "/admin" });
      setSessionCookie(response, token);
      return response;
    }
  }

  const db = createServiceClient();

  // Look up user
  const { data: user } = await db
    .from("users")
    .select("id, name, email, password_hash, application_id, is_blocked")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (!user) {
    // Check if there's a pending or rejected application to give a useful message
    const { data: app } = await db
      .from("applications")
      .select("status")
      .eq("applicant_email", email.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (app?.status === "pending") {
      return NextResponse.json(
        { error: "Your application is still under review." },
        { status: 403 }
      );
    }
    if (app?.status === "rejected") {
      return NextResponse.json(
        {
          error:
            "Your application wasn't approved this time. You're welcome to improve your portfolio and apply again.",
          showApplyLink: true,
        },
        { status: 403 }
      );
    }

    // Generic error to avoid user enumeration
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  if (user.is_blocked) {
    return NextResponse.json(
      { error: "Your account has been suspended. Please contact support." },
      { status: 403 }
    );
  }

  const token = await createSession({
    userId: user.id,
    email: user.email,
    role: "user",
  });

  const response = NextResponse.json({ success: true, name: user.name });
  setSessionCookie(response, token);
  return response;
}
