"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, Search } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { createBrowserClient } from "@/lib/supabase/browser";
import {
  sidebarStore,
  SIDEBAR_STALE_MS,
  initUserCache,
  lastReadAtOnOpen,
  type CachedSidebarCommunity,
} from "@/lib/communities/cache";
import { CommunityRow } from "./panel/CommunityRow";
import { usePrefetch } from "./panel/usePrefetch";

type Community = CachedSidebarCommunity;

/**
 * Mark a community as read on the server.
 *
 * The PATCH endpoint returns `previousLastReadAt` — the last_read_at value
 * BEFORE it was overwritten.  We store it in `lastReadAtOnOpen` so that
 * CommunityChat can position the unread divider by timestamp comparison even
 * when sidebarStore.data was null and the synchronous snapshot couldn't be taken.
 */
async function markReadOnServer(communityId: string) {
  const newLastReadAt = new Date().toISOString();
  try {
    const res = await fetch(`/api/communities/${communityId}/read`, { method: "PATCH" });
    if (res.ok) {
      const data = await res.json();
      if (!lastReadAtOnOpen.has(communityId) && "previousLastReadAt" in data) {
        lastReadAtOnOpen.set(communityId, data.previousLastReadAt ?? null);
      }
      if (sidebarStore.data) {
        sidebarStore.data = {
          ...sidebarStore.data,
          communities: sidebarStore.data.communities.map((c) =>
            c.id === communityId ? { ...c, last_read_at: newLastReadAt } : c
          ),
        };
      }
    }
  } catch {}
}

export function CommunitiesPanel({ userId }: { userId: string }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { onEnter, onLeave } = usePrefetch();

  const activeCommunityId = pathname.match(
    /\/dashboard\/communities\/([^/]+)/
  )?.[1];

  const [communities, setCommunities] = useState<Community[]>(() => {
    initUserCache(userId);
    return sidebarStore.data?.communities ?? [];
  });
  const [loading, setLoading] = useState(() => sidebarStore.data === null);

  // ── Stale-while-revalidate load ─────────────────────────────────────────
  const load = useCallback(() => {
    if (sidebarStore.data && Date.now() - sidebarStore.data.fetchedAt < SIDEBAR_STALE_MS) {
      setLoading(false);
      return;
    }
    if (sidebarStore.inflight) {
      sidebarStore.inflight.then(() => {
        if (sidebarStore.data) setCommunities(sidebarStore.data.communities);
        setLoading(false);
      });
      if (sidebarStore.data) setLoading(false);
      return;
    }
    const p: Promise<void> = fetch("/api/communities")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (!d) return;
        const fresh = d.communities ?? [];
        sidebarStore.data = { communities: fresh, fetchedAt: Date.now() };
        setCommunities(fresh);
      })
      .catch(() => {})
      .finally(() => { sidebarStore.inflight = null; setLoading(false); });
    sidebarStore.inflight = p;
    if (sidebarStore.data) setLoading(false);
  }, []);

  // ── Background unread-count reconciliation ──────────────────────────────
  const revalidateInFlight = useRef(false);
  const activeCommunityIdRef = useRef(activeCommunityId);

  const revalidateUnreadCounts = useCallback(() => {
    if (revalidateInFlight.current) return;
    revalidateInFlight.current = true;
    fetch("/api/communities")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (!d?.communities) return;
        const fresh: CachedSidebarCommunity[] = d.communities;
        setCommunities((prev) => {
          const prevMap  = new Map(prev.map((c) => [c.id, c]));
          const storeById = new Map((sidebarStore.data?.communities ?? []).map((c) => [c.id, c]));
          const currentActiveId = activeCommunityIdRef.current;
          const merged = fresh.map((server) => {
            const local  = prevMap.get(server.id);
            const stored = storeById.get(server.id);
            const serverMs = server.last_read_at ? new Date(server.last_read_at).getTime() : -Infinity;
            const storedMs = stored?.last_read_at ? new Date(stored.last_read_at).getTime() : -Infinity;
            const bestLastReadAt =
              !stored?.last_read_at || serverMs >= storedMs ? server.last_read_at : stored.last_read_at;
            return {
              ...server,
              last_read_at: bestLastReadAt,
              message_count:
                server.id === currentActiveId
                  ? 0
                  : Math.max(server.message_count, local?.message_count ?? 0),
            };
          });
          if (sidebarStore.data) {
            sidebarStore.data = { ...sidebarStore.data, communities: merged, fetchedAt: Date.now() };
          }
          return merged;
        });
      })
      .catch(() => {})
      .finally(() => { revalidateInFlight.current = false; });
  }, []);

  useEffect(() => {
    const cacheWasFresh =
      !!sidebarStore.data && Date.now() - sidebarStore.data.fetchedAt < SIDEBAR_STALE_MS;
    load();
    if (cacheWasFresh) revalidateUnreadCounts();
  }, [load, revalidateUnreadCounts]);

  // ── Active community change: clear badge + mark read ───────────────────
  useEffect(() => {
    activeCommunityIdRef.current = activeCommunityId;
    if (!activeCommunityId) return;

    if (!lastReadAtOnOpen.has(activeCommunityId)) {
      const snapshot = sidebarStore.data?.communities.find((c) => c.id === activeCommunityId);
      if (snapshot) {
        lastReadAtOnOpen.set(activeCommunityId, snapshot.last_read_at ?? null);
        const optimisticReadAt = new Date().toISOString();
        if (sidebarStore.data) {
          sidebarStore.data = {
            ...sidebarStore.data,
            communities: sidebarStore.data.communities.map((c) =>
              c.id === activeCommunityId ? { ...c, last_read_at: optimisticReadAt } : c
            ),
          };
        }
      }
      markReadOnServer(activeCommunityId);
    }

    setCommunities((prev) => {
      const updated = prev.map((c) =>
        c.id === activeCommunityId ? { ...c, message_count: 0 } : c
      );
      if (sidebarStore.data) {
        const storeById = new Map(sidebarStore.data.communities.map((c) => [c.id, c]));
        sidebarStore.data = {
          ...sidebarStore.data,
          communities: updated.map((c) => ({
            ...c,
            last_read_at: storeById.get(c.id)?.last_read_at ?? c.last_read_at,
          })),
        };
      }
      return updated;
    });
  }, [activeCommunityId]);

  // ── Realtime subscriptions — one channel per joined community ──────────
  const communityIds = [...communities].map((c) => c.id).sort().join(",");
  useEffect(() => {
    if (!communities.length) return;
    let supabase: ReturnType<typeof createBrowserClient>;
    try { supabase = createBrowserClient(); } catch { return; }

    const channels = communities.map((comm) =>
      supabase
        .channel(`panel:${comm.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "community_messages", filter: `community_id=eq.${comm.id}` },
          (payload) => {
            const row = payload.new as {
              id: string; community_id: string; content: string;
              created_at: string; user_id: string;
            };
            const isOwn    = row.user_id === userId;
            const isActive = row.community_id === activeCommunityIdRef.current;

            setCommunities((prev) => {
              const updated = prev.map((c) =>
                c.id === row.community_id
                  ? {
                      ...c,
                      last_message: { content: row.content, created_at: row.created_at, user: c.last_message?.user ?? null },
                      message_count: !isOwn && !isActive ? c.message_count + 1 : c.message_count,
                    }
                  : c
              );
              if (sidebarStore.data) {
                const storeById = new Map(sidebarStore.data.communities.map((c) => [c.id, c]));
                sidebarStore.data = {
                  ...sidebarStore.data,
                  communities: updated.map((c) => ({
                    ...c,
                    last_read_at: storeById.get(c.id)?.last_read_at ?? c.last_read_at,
                  })),
                };
              }
              return updated;
            });
          }
        )
        .subscribe()
    );

    return () => { channels.forEach((ch) => supabase.removeChannel(ch)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityIds, userId]);

  // ── Navigation handler ─────────────────────────────────────────────────
  function handleNavigate(id: string) {
    if (!lastReadAtOnOpen.has(id)) {
      const snapshot = sidebarStore.data?.communities.find((c) => c.id === id);
      if (snapshot) {
        lastReadAtOnOpen.set(id, snapshot.last_read_at ?? null);
        const optimisticReadAt = new Date().toISOString();
        if (sidebarStore.data) {
          sidebarStore.data = {
            ...sidebarStore.data,
            communities: sidebarStore.data.communities.map((c) =>
              c.id === id ? { ...c, last_read_at: optimisticReadAt } : c
            ),
          };
        }
      }
    }

    setCommunities((prev) => {
      const updated = prev.map((c) => c.id === id ? { ...c, message_count: 0 } : c);
      if (sidebarStore.data) {
        const storeById = new Map(sidebarStore.data.communities.map((c) => [c.id, c]));
        sidebarStore.data = {
          ...sidebarStore.data,
          communities: updated.map((c) => ({
            ...c,
            last_read_at: storeById.get(c.id)?.last_read_at ?? c.last_read_at,
          })),
        };
      }
      return updated;
    });

    router.push(`/dashboard/communities/${id}`);
    void markReadOnServer(id);
  }

  return (
    <div className="flex flex-col h-full w-72 shrink-0 border-r border-border bg-surface">
      <button
        onClick={() => router.push("/dashboard/communities")}
        className={`flex items-center gap-2 mx-3 mt-3 mb-1 px-3 py-2 rounded-lg font-body text-xs font-medium transition-colors text-left ${
          pathname === "/dashboard/communities"
            ? "bg-accent/10 text-accent"
            : "text-foreground-muted hover:text-foreground hover:bg-surface-raised"
        }`}
      >
        <Search size={13} />
        Explore Communities
      </button>

      <div className="mx-2 mb-0.5" />

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-4 w-4 text-foreground-muted" />
          </div>
        ) : communities.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <MessageSquare size={24} className="mx-auto text-foreground-muted mb-2 opacity-40" />
            <p className="font-body text-xs text-foreground-muted">No communities yet</p>
          </div>
        ) : (
          <div className="py-0.5">
            <div className="px-3 pt-2 pb-0.5">
              <span className="font-body text-[8px] font-semibold uppercase tracking-widest text-foreground-muted">
                All
              </span>
            </div>
            <ul className="space-y-px">
              {[...communities]
                .sort((a, b) => {
                  const ta = a.last_message?.created_at ?? "";
                  const tb = b.last_message?.created_at ?? "";
                  if (tb > ta) return 1;
                  if (ta > tb) return -1;
                  return a.name.localeCompare(b.name);
                })
                .map((c) => (
                  <CommunityRow
                    key={c.id}
                    c={c}
                    active={c.id === activeCommunityId}
                    onClick={() => handleNavigate(c.id)}
                    onMouseEnter={() => onEnter(c.id)}
                    onMouseLeave={onLeave}
                  />
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
