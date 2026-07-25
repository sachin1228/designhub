import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession, clearSessionCookie } from "@/lib/auth/session";

/** Lightweight Supabase REST check — Edge-compatible, no SDK needed. */
async function fetchUserStatus(
  userId: string
): Promise<{ exists: boolean; is_blocked: boolean }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { exists: true, is_blocked: false }; // fail open if env missing

  try {
    const res = await fetch(
      `${url}/rest/v1/users?select=id,is_blocked&id=eq.${encodeURIComponent(userId)}&limit=1`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return { exists: true, is_blocked: false };
    const rows = (await res.json()) as { id: string; is_blocked: boolean }[];
    if (!rows || rows.length === 0) return { exists: false, is_blocked: false };
    return { exists: true, is_blocked: rows[0].is_blocked };
  } catch {
    return { exists: true, is_blocked: false };
  }
}

// Uses * because the mobile app authenticates via Bearer token, not cookies.
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };
}

// Next.js 16: export named `proxy` (middleware.ts is deprecated).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── CORS pre-flight ───────────────────────────────────────────────────────
  // Respond to OPTIONS before the request reaches any route handler.
  // next.config.js headers() adds CORS headers to all non-OPTIONS responses,
  // so we only need to handle OPTIONS here — no duplication.
  if (pathname.startsWith("/api/") && request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  // ── Mobile / Bearer-token support ────────────────────────────────────────
  // Inject the Bearer token as a session cookie so route handlers that read
  // from cookies work without modification.
  if (pathname.startsWith("/api/")) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const bearerToken = authHeader.slice(7);
      const requestHeaders = new Headers(request.headers);
      const existingCookies = request.headers.get("cookie") ?? "";
      const cookieSep = existingCookies ? "; " : "";
      requestHeaders.set(
        "cookie",
        `${existingCookies}${cookieSep}${SESSION_COOKIE}=${bearerToken}`
      );
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    // No Bearer token — let next.config.js headers() handle CORS on the response.
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  // Redirect already-authenticated users away from / and /login.
  if (pathname === "/" || pathname === "/login") {
    if (session) {
      const url = request.nextUrl.clone();
      url.pathname = session.role === "admin" ? "/admin" : "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Protect /admin/* — must be admin role.
  if (pathname.startsWith("/admin")) {
    if (!session || session.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // Protect /dashboard/* — must be authenticated (any role).
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (session.role === "user" && session.userId) {
      const { exists, is_blocked } = await fetchUserStatus(session.userId);
      if (!exists || is_blocked) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        const response = NextResponse.redirect(url);
        clearSessionCookie(response);
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/dashboard/:path*", "/api/:path*"],
};
