/**
 * Module-level caches for community data.
 * These persist across client-side navigations (SPA) without needing
 * React context, Redux, or external libraries.
 */

export interface CachedMessage {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  users: { name: string; avatar_url: string | null } | null;
  status?: "sending" | "sent" | "failed";
}

export interface CachedMeta {
  community: {
    id: string;
    name: string;
    type: string;
    member_count: number;
    image_url: string | null;
  };
  members: {
    user_id: string;
    users: { name: string; avatar_url: string | null } | null;
  }[];
  fetchedAt: number;
}

/** Messages keyed by communityId */
export const msgCache = new Map<string, CachedMessage[]>();

/** Community metadata (header + members panel) keyed by communityId */
export const metaCache = new Map<string, CachedMeta>();

/** How long before community metadata is considered stale (ms) */
export const META_STALE_MS = 60_000;
