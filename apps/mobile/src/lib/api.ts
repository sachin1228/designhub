import { API_BASE_URL } from "../config";
import { getToken } from "./auth";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = (body as any)?.error ?? `HTTP ${res.status}`;
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function apiLogin(
  email: string,
  password: string
): Promise<{ token: string; name: string }> {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function apiLogout(): Promise<void> {
  await request("/api/auth/logout", { method: "POST" });
}

export async function apiMe(): Promise<{
  user: { id: string; name: string; email: string; role: string } | null;
}> {
  return request("/api/auth/me");
}

// ─── Communities ──────────────────────────────────────────────────────────────

export interface Community {
  id: string;
  name: string;
  type: string;
  image_url: string | null;
  member_count: number;
  message_count: number;
  last_message: {
    content: string;
    created_at: string;
    user: { name: string };
  } | null;
}

export async function apiGetCommunities(): Promise<{ communities: Community[] }> {
  return request("/api/communities");
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  image_url: string | null;
  reply_to_id: string | null;
  user: { name: string; avatar_url: string | null };
  reactions: { emoji: string; user_ids: string[] }[];
  reply_preview: {
    content: string;
    user: { name: string };
  } | null;
}

export async function apiGetMessages(
  communityId: string,
  before?: string
): Promise<{ messages: Message[]; hasMore: boolean }> {
  const params = before ? `?before=${encodeURIComponent(before)}` : "";
  return request(`/api/communities/${communityId}/messages${params}`);
}

export async function apiSendMessage(
  communityId: string,
  content: string,
  replyToId?: string
): Promise<{ success: boolean; message: Message }> {
  return request(`/api/communities/${communityId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content, reply_to_id: replyToId ?? null }),
  });
}

export async function apiMarkRead(communityId: string): Promise<void> {
  await request(`/api/communities/${communityId}/read`, { method: "PATCH" });
}

export async function apiAddReaction(
  communityId: string,
  messageId: string,
  emoji: string
): Promise<void> {
  await request(
    `/api/communities/${communityId}/messages/${messageId}/reactions`,
    { method: "POST", body: JSON.stringify({ emoji }) }
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface Profile {
  user: { name: string; email: string; created_at: string };
  profile: {
    avatar_url: string | null;
    bio: string | null;
    experience_level: string | null;
  };
  userInterests: { id: string; name: string }[];
}

export async function apiGetProfile(): Promise<Profile> {
  return request("/api/profile");
}

export async function apiUpdateProfile(data: {
  name?: string;
  bio?: string;
}): Promise<void> {
  await request("/api/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
