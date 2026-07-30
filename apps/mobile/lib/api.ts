const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export interface LoginResponse {
  success: boolean;
  name?: string;
  redirect?: string;
  error?: string;
  incompleteSignup?: boolean;
}

/**
 * POST /api/auth/login
 *
 * Returns { token, name } on success — the raw JWT is extracted from the
 * Set-Cookie header so we can store it in SecureStore and replay it as a
 * Cookie on subsequent requests.
 */
export async function loginRequest(
  email: string,
  password: string
): Promise<{ token: string; name: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data: LoginResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error ?? "Login failed. Please try again.");
  }

  // Extract the session token from the Set-Cookie header.
  // The cookie is named "draft_session" (see web/lib/auth/session.ts).
  const rawCookie = response.headers.get("set-cookie") ?? "";
  const match = rawCookie.match(/draft_session=([^;]+)/);
  const token = match?.[1];

  if (!token) {
    throw new Error("Authentication succeeded but no session token was returned.");
  }

  return { token, name: data.name ?? "" };
}
