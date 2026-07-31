/**
 * Fetches the user's communities list and keeps it live via Supabase realtime.
 * Mirrors the web app's useSidebarCommunities + useSidebarRealtime + useSidebarTyping.
 *
 * Key behaviours mirrored from web:
 * - Unread increment is skipped for own messages AND for the currently-open community.
 * - markCommunityRead zeroes locally AND persists to server via PATCH /api/communities/:id/read.
 * - Subscriptions are keyed on sorted community IDs (not just length) to avoid stale channels.
 * - Background reconciliation on AppState 'active': refetches server counts and preserves
 *   max(server, local) for inactive communities; forces active community count to 0.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/lib/supabase';
import { getCommunities, markRead, Community, LastMessage, LastReaction } from '@/lib/communities';
import { communityStore } from '@/lib/communityStore';
import { useAuth } from '@/context/AuthContext';

// ---------------------------------------------------------------------------
// Typing state
// ---------------------------------------------------------------------------

export interface TypingEntry {
  user_id: string;
  name: string;
  ts: number;
}

type TypingMap = Record<string, TypingEntry[]>;

const TYPING_EXPIRY_MS = 3500;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCommunities() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typing, setTyping] = useState<TypingMap>({});

  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ---------------------------------------------------------------------------
  // Load
  // ---------------------------------------------------------------------------

  const load = useCallback(async () => {
    try {
      const data = await getCommunities();
      setCommunities(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load communities');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Background reconciliation — mirrors web's revalidation logic.
  // On AppState active: refetch server counts, preserve max(server, local) for
  // inactive communities, force active community count to 0.
  // ---------------------------------------------------------------------------

  const reconcile = useCallback(async () => {
    try {
      const fresh = await getCommunities();
      setCommunities((prev) => {
        const prevMap = new Map(prev.map((c) => [c.id, c]));
        return fresh.map((serverComm) => {
          const local = prevMap.get(serverComm.id);
          if (!local) return serverComm;

          const isActive = communityStore.activeCommunityId === serverComm.id;

          // Active community: always 0 unread
          if (isActive) return { ...serverComm, unread_count: 0 };

          // Inactive: preserve whichever count is larger (local may have
          // incremented from realtime events since the server last computed it)
          const unread_count = Math.max(serverComm.unread_count, local.unread_count);
          return { ...serverComm, unread_count };
        });
      });
    } catch {
      // silent — stale local state is fine
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Realtime subscriptions — keyed on sorted community IDs
  // ---------------------------------------------------------------------------

  const subscribeAll = useCallback(
    (communityIds: string[]) => {
      // Clean up existing subscriptions
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];

      communityIds.forEach((cid) => {
        // ── postgres_changes: panel:${communityId} ──────────────────────────
        const panelChannel = supabase
          .channel(`panel:${cid}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'community_messages',
              filter: `community_id=eq.${cid}`,
            },
            (payload) => {
              const row = payload.new as {
                id: string;
                community_id: string;
                content: string | null;
                created_at: string;
                user_id: string;
                reply_to_id?: string | null;
                image_url?: string | null;
              };

              setCommunities((prev) =>
                prev.map((c) => {
                  if (c.id !== cid) return c;

                  const isOwnMessage = row.user_id === user?.id;
                  // Mirror web: do NOT increment if this is the currently-open community
                  const isActive = communityStore.activeCommunityId === cid;

                  const newLastMessage: LastMessage = {
                    id: row.id,
                    content: row.content,
                    created_at: row.created_at,
                    user: { name: isOwnMessage ? 'You' : '' },
                    is_reply: !!row.reply_to_id,
                    reply_to_user: null,
                  };

                  return {
                    ...c,
                    last_message: newLastMessage,
                    lastReaction: null,
                    // Only increment for messages from others, and only when not looking at that chat
                    unread_count:
                      isOwnMessage || isActive ? c.unread_count : c.unread_count + 1,
                  };
                })
              );
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'community_messages',
              filter: `community_id=eq.${cid}`,
            },
            (payload) => {
              const row = payload.new as { id: string; community_id: string; deleted_at: string | null };
              if (!row.deleted_at) return;
              setCommunities((prev) =>
                prev.map((c) => {
                  if (c.id !== cid) return c;
                  if (c.last_message?.id === row.id) {
                    return { ...c, last_message: null };
                  }
                  return c;
                })
              );
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'message_reactions',
              filter: `community_id=eq.${cid}`,
            },
            (payload) => {
              const row = (payload.new ?? payload.old) as {
                community_id: string;
                message_id: string;
                user_id: string;
                emoji: string;
                created_at?: string;
              };
              const isOwn = row.user_id === user?.id;

              if (payload.eventType === 'DELETE') {
                setCommunities((prev) =>
                  prev.map((c) => {
                    if (c.id !== cid) return c;
                    if (c.lastReaction?.messageId === row.message_id) {
                      return { ...c, lastReaction: null };
                    }
                    return c;
                  })
                );
              } else {
                const reaction: LastReaction = {
                  messageId: row.message_id,
                  emoji: row.emoji,
                  createdAt: row.created_at ?? new Date().toISOString(),
                  firstName: isOwn ? 'You' : '',
                  isOwn,
                  messagePreview: null,
                };
                setCommunities((prev) =>
                  prev.map((c) => (c.id !== cid ? c : { ...c, lastReaction: reaction }))
                );
              }
            }
          )
          .subscribe();

        // ── Typing broadcast ────────────────────────────────────────────────
        const typingChannel = supabase
          .channel(`community-typing:${cid}`, {
            config: { broadcast: { ack: false, self: false } },
          })
          .on('broadcast', { event: 'typing' }, ({ payload }) => {
            const { user_id, name, typing: isTyping, ts } = payload as {
              user_id: string;
              name: string;
              typing: boolean;
              ts: number;
            };
            if (user_id === user?.id) return;

            setTyping((prev) => {
              const existing = prev[cid] ?? [];
              const updated: TypingEntry[] = isTyping
                ? [...existing.filter((e) => e.user_id !== user_id), { user_id, name, ts }]
                : existing.filter((e) => e.user_id !== user_id);
              return { ...prev, [cid]: updated };
            });

            const timerKey = `${cid}:${user_id}`;
            clearTimeout(typingTimers.current[timerKey]);
            if (isTyping) {
              typingTimers.current[timerKey] = setTimeout(() => {
                setTyping((prev) => ({
                  ...prev,
                  [cid]: (prev[cid] ?? []).filter((e) => e.user_id !== user_id),
                }));
              }, TYPING_EXPIRY_MS);
            }
          })
          .subscribe();

        channelsRef.current.push(panelChannel, typingChannel);
      });
    },
    [user?.id]
  );

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Initial load
  useEffect(() => {
    load();
  }, [load]);

  // Subscriptions — re-run when the SET of community IDs changes (not just length)
  useEffect(() => {
    if (communities.length === 0) return;
    const ids = communities.map((c) => c.id).sort();
    subscribeAll(ids);
    return () => {
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communities.map((c) => c.id).sort().join(','), subscribeAll]);

  // Background reconciliation: refetch when app comes back to foreground
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        reconcile();
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [reconcile]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Call when entering a community chat.
   * Zeros the local unread count, persists the read state to the server,
   * and marks this community as "active" so incoming realtime messages
   * don't increment the badge while the chat is open.
   */
  const markCommunityRead = useCallback((communityId: string) => {
    // 1. Mark active immediately so realtime guard kicks in
    communityStore.activeCommunityId = communityId;

    // 2. Zero local count optimistically
    setCommunities((prev) =>
      prev.map((c) => (c.id === communityId ? { ...c, unread_count: 0 } : c))
    );

    // 3. Persist to server (fire-and-forget, mirrors web's markReadOnServer)
    markRead(communityId).catch(() => {});
  }, []);

  /**
   * Call when leaving a community chat (screen unmount).
   * Clears the active-community guard so other communities resume incrementing.
   */
  const clearActiveCommunity = useCallback(() => {
    communityStore.activeCommunityId = null;
  }, []);

  /** Typing label for a community (mirrors web logic). */
  const getTypingLabel = useCallback(
    (communityId: string): string | null => {
      const typists = (typing[communityId] ?? []).filter(
        (e) => Date.now() - e.ts < TYPING_EXPIRY_MS
      );
      if (typists.length === 0) return null;
      if (typists.length === 1) return `${typists[0].name} is typing…`;
      if (typists.length === 2) return `${typists[0].name} & ${typists[1].name} are typing…`;
      return 'Several people are typing…';
    },
    [typing]
  );

  return {
    communities,
    isLoading,
    error,
    reload: load,
    markCommunityRead,
    clearActiveCommunity,
    getTypingLabel,
  };
}
