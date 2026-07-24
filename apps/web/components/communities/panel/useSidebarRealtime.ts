"use client";

import { useEffect, MutableRefObject } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";
import { sidebarStore, type CachedSidebarCommunity } from "@/lib/communities/cache";

interface Options {
  communities: CachedSidebarCommunity[];
  userId: string;
  activeCommunityIdRef: MutableRefObject<string | undefined>;
  setCommunities: React.Dispatch<React.SetStateAction<CachedSidebarCommunity[]>>;
}

/**
 * Applies a patch to one community in React state and mirrors it into
 * sidebarStore, preserving last_read_at from the store so we never
 * accidentally overwrite it with a stale value.
 */
function applyUpdate(
  prev: CachedSidebarCommunity[],
  communityId: string,
  patch: (c: CachedSidebarCommunity) => CachedSidebarCommunity,
): CachedSidebarCommunity[] {
  const updated = prev.map((c) => (c.id === communityId ? patch(c) : c));
  if (sidebarStore.data) {
    const storeById = new Map(
      sidebarStore.data.communities.map((c) => [c.id, c]),
    );
    sidebarStore.data = {
      ...sidebarStore.data,
      communities: updated.map((c) => ({
        ...c,
        last_read_at: storeById.get(c.id)?.last_read_at ?? c.last_read_at,
      })),
    };
  }
  return updated;
}

/**
 * Subscribes to community_messages changes (INSERT + UPDATE) for every
 * joined community and keeps the sidebar last-message preview in sync.
 *
 * Handles:
 *  - New messages (text, image-only, replies)
 *  - Async sender-name resolution for unknown senders
 *  - Soft-deleted messages (deleted_at set via UPDATE)
 */
export function useSidebarRealtime({
  communities,
  userId,
  activeCommunityIdRef,
  setCommunities,
}: Options) {
  // Re-subscribe whenever the set of joined communities changes.
  const communityIds = [...communities].map((c) => c.id).sort().join(",");

  useEffect(() => {
    if (!communities.length) return;

    let supabase: ReturnType<typeof createBrowserClient>;
    try {
      supabase = createBrowserClient();
    } catch {
      return;
    }

    // Local cache of resolved sender names so we only fetch each user once
    // per subscription lifetime.
    const resolvedNames = new Map<string, string>();

    const channels = communities.map((comm) =>
      supabase
        .channel(`panel:${comm.id}`)

        // ── New message ────────────────────────────────────────────────────
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "community_messages",
            filter: `community_id=eq.${comm.id}`,
          },
          (payload) => {
            const row = payload.new as {
              id: string;
              community_id: string;
              content: string;
              created_at: string;
              user_id: string;
              reply_to_id?: string | null;
              image_url?: string | null;
            };

            const isOwn    = row.user_id === userId;
            const isActive = row.community_id === activeCommunityIdRef.current;
            const knownName = resolvedNames.get(row.user_id) ?? null;

            setCommunities((prev) =>
              applyUpdate(prev, row.community_id, (c) => ({
                ...c,
                last_message: {
                  id:          row.id,
                  content:     row.content,
                  created_at:  row.created_at,
                  user:        knownName ? { name: knownName } : (isOwn ? c.last_message?.user ?? null : null),
                  has_image:   !row.content && !!row.image_url,
                  is_reply:    !!row.reply_to_id,
                  is_deleted:  false,
                  reactions:   [],
                },
                message_count:
                  !isOwn && !isActive
                    ? c.message_count + 1
                    : c.message_count,
              })),
            );

            // Async: resolve sender name if we don't already know it.
            if (!isOwn && !resolvedNames.has(row.user_id)) {
              const commId  = row.community_id;
              const msgAt   = row.created_at;
              const senderId = row.user_id;

              fetch(`/api/communities/${commId}/members/${senderId}`)
                .then((r) => (r.ok ? r.json() : null))
                .then((profile: { name: string } | null) => {
                  if (!profile?.name) return;
                  resolvedNames.set(senderId, profile.name);
                  setCommunities((prev) =>
                    applyUpdate(prev, commId, (c) => {
                      // Only patch if this message is still the latest preview.
                      if (c.last_message?.created_at !== msgAt) return c;
                      return {
                        ...c,
                        last_message: {
                          ...c.last_message!,
                          user: { name: profile.name },
                        },
                      };
                    }),
                  );
                })
                .catch(() => {});
            }
          },
        )

        // ── Soft-delete (UPDATE with deleted_at) ──────────────────────────
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "community_messages",
            filter: `community_id=eq.${comm.id}`,
          },
          (payload) => {
            const updated = payload.new as {
              community_id: string;
              created_at: string;
              deleted_at: string | null;
            };
            if (!updated.deleted_at) return;

            setCommunities((prev) =>
              applyUpdate(prev, updated.community_id, (c) => {
                // Only update the preview if this is still the last message.
                if (c.last_message?.created_at !== updated.created_at) return c;
                return {
                  ...c,
                  last_message: {
                    ...c.last_message!,
                    content:    "",
                    is_deleted: true,
                    has_image:  false,
                    is_reply:   false,
                  },
                };
              }),
            );
          },
        )

        // ── Reaction added ────────────────────────────────────────────────
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "message_reactions",
            filter: `community_id=eq.${comm.id}`,
          },
          (payload) => {
            const r = payload.new as { message_id: string; emoji: string };
            setCommunities((prev) =>
              applyUpdate(prev, comm.id, (c) => {
                if (!c.last_message || c.last_message.id !== r.message_id) return c;
                const existing = c.last_message.reactions ?? [];
                if (existing.includes(r.emoji)) return c;
                return {
                  ...c,
                  last_message: {
                    ...c.last_message,
                    reactions: [...existing, r.emoji],
                  },
                };
              }),
            );
          },
        )

        // ── Reaction removed ──────────────────────────────────────────────
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "message_reactions",
            filter: `community_id=eq.${comm.id}`,
          },
          (payload) => {
            const r = payload.old as { message_id?: string; emoji?: string };
            if (!r.message_id || !r.emoji) return;
            setCommunities((prev) =>
              applyUpdate(prev, comm.id, (c) => {
                if (!c.last_message || c.last_message.id !== r.message_id) return c;
                const next = (c.last_message.reactions ?? []).filter(
                  (e) => e !== r.emoji,
                );
                return { ...c, last_message: { ...c.last_message, reactions: next } };
              }),
            );
          },
        )

        .subscribe(),
    );

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityIds, userId]);
}
