import { NextResponse } from "next/server";
import { getSession, clearSessionCookie } from "@/lib/auth/session";

export async function POST() {
  const session = await getSession();
  const response = NextResponse.json({ success: true });
  // Only clear the cookie when a valid session exists.
  // This acts as a lightweight guard: a cross-site POST cannot carry the
  // httpOnly cookie (sameSite: lax), so session will be null and the cookie
  // won't be cleared by a CSRF-forced logout attempt.
  if (session) {
    clearSessionCookie(response);
  }
  return response;
}
