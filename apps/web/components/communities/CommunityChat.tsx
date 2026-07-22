"use client";

import {
  Fragment,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { ChevronDown } from "lucide-react";
import { LottieLoader } from "@/components/ui/LottieLoader";
import { createBrowserClient } from "@/lib/supabase/browser";
import {
  msgCache,
  metaCache,
  msgFetchedAt,
  inFlightMsgFetch,
  evictIfNeeded,
  META_STALE_MS,
  MSG_STALE_MS,
  sidebarStore,
  lastReadAtOnOpen,
  type CachedMessage,
  type CachedMeta,
} from "@/lib/communities/cache";
import { ChatHeader } from "./chat/ChatHeader";
import { MessageBubble } from "./chat/MessageBubble";
import { UnreadDivider } from "./chat/UnreadDivider";
import { ChatInput } from "./chat/ChatInput";
import { MembersPanel } from "./chat/MembersPanel";
import { fmtDate, TYPE_EMOJI } from "./chat/chatUtils";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Message = CachedMessage;

interface Community {
  id: string;
  name: string;
  type: string;
  member_count: number;
  image_url: string | null;
}

interface Member {
  user_id: string;
  users: { name: string; avatar_url: string | null } | null;
}

export function CommunityChat({
  communityId,
  currentUserId,
  initialMeta,
  initialMessages,
  initialLastReadAt,
}: {
  communityId: string;
  currentUserId: string;
  initialMeta?: CachedMeta;
  initialMessages?: CachedMessage[];
  initialLastReadAt?: string | null;
}) {
  const [hasMounted,               setHasMounted]               = useState(false);
  const [community,                setCommunity]                = useState<Community | null>(null);
  const [members,                  setMembers]                  = useState<Member[]>([]);
  const [messages,                 setMessages]                 = useState<Message[]>([]);
  const [loading,                  setLoading]                  = useState(true);
  const [input,                    setInput]                    = useState("");
  const [sending,                  setSending]                  = useState(false);
  const [error,                    setError]                    = useState<string | null>(null);
  const [showScrollToBottom,       setShowScrollToBottom]       = useState(false);
  const [hideUnreadDivider,        setHideUnreadDivider]        = useState(false);
  const [lastReadAt,               setLastReadAt]               = useState<string | null | undefined>(undefined);
  const [snapshotReady,            setSnapshotReady]            = useState(false);
  const [initialMessagesReady,     setInitialMessagesReady]     = useState(false);
  const [initialPositionResolved,  setInitialPositionResolved]  = useState(false);

  const bottomRef              = useRef<HTMLDivElement>(null);
  const inputRef               = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef     = useRef<HTMLDivElement>(null);
  const initialScrollDoneRef   = useRef(false);
  const unreadDividerRef       = useRef<HTMLDivElement>(null);
  const unreadAtOpenRef        = useRef<{ firstMsgId: string | null; count: number } | null>(null);
  const realtimeInsertPendingRef   = useRef(false);
  const realtimeWasNearBottomRef   = useRef(false);
  const communityIdRef             = useRef(communityId);
  const membersRef                 = useRef(members);
  const pendingProfileFetchRef     = useRef<Map<string, Promise<void>>>(new Map());

  useEffect(() => { membersRef.current = members; }, [members]);

  // ── Seed state from cache or SSR props before first paint ────────────────
  useIsomorphicLayoutEffect(() => {
    setHasMounted(true);
    const cachedMeta = metaCache.get(communityId);
    const cachedMsgs = msgCache.get(communityId);
    if (cachedMeta) {
      setCommunity(cachedMeta.community);
      setMembers(cachedMeta.members);
    } else if (initialMeta) {
      metaCache.set(communityId, { ...initialMeta, fetchedAt: Date.now() });
      setCommunity(initialMeta.community);
      setMembers(initialMeta.members);
    }
    if (cachedMsgs?.length) {
      setMessages(cachedMsgs);
    } else if (initialMessages?.length) {
      msgCache.set(communityId, initialMessages);
      msgFetchedAt.set(communityId, Date.now());
      evictIfNeeded();
      setMessages(initialMessages);
    }
    if (cachedMeta || initialMeta) setLoading(false);
    if (!cachedMsgs?.length && initialLastReadAt !== undefined) {
      setLastReadAt(initialLastReadAt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fast-path: compute unread snapshot from cache before first paint ─────
  useIsomorphicLayoutEffect(() => {
    initialScrollDoneRef.current = false;
    unreadAtOpenRef.current = null;
    setHideUnreadDivider(false);
    setSnapshotReady(false);
    setInitialPositionResolved(false);

    const cachedMsgs = msgCache.get(communityId);
    const hasOpeningLastReadAt = lastReadAtOnOpen.has(communityId);
    if (!cachedMsgs?.length || !hasOpeningLastReadAt) return;

    const openingLastReadAt = lastReadAtOnOpen.get(communityId) ?? null;
    lastReadAtOnOpen.delete(communityId);
    setLastReadAt(openingLastReadAt);

    const sidebarEntry_ = sidebarStore.data?.communities.find((c) => c.id === communityId);
    const sidebarUnreadCount = sidebarEntry_?.message_count ?? 0;
    const lastReadTime = openingLastReadAt === null ? -Infinity : new Date(openingLastReadAt).getTime();
    const unreadMsgs = cachedMsgs.filter(
      (m) => !m.id.startsWith("temp-") && m.user_id !== currentUserId &&
        new Date(m.created_at).getTime() > lastReadTime
    );
    if (sidebarUnreadCount > 0 && unreadMsgs.length === 0) return;
    if (unreadMsgs.length === 0) return;

    unreadAtOpenRef.current = { firstMsgId: unreadMsgs[0]?.id ?? null, count: unreadMsgs.length };
    setSnapshotReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const el = e.target as Node;
      if (!(el instanceof Element)) return;
      // handled by MembersPanel itself
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Fetch community metadata ─────────────────────────────────────────────
  const fetchMeta = useCallback(async () => {
    const targetId = communityId;
    const res = await fetch(`/api/communities/${targetId}`);
    if (!res.ok) return;
    const d = await res.json();
    if (communityIdRef.current !== targetId) return;
    const cached: CachedMeta = { community: d.community, members: d.members ?? [], fetchedAt: Date.now() };
    metaCache.set(targetId, cached);
    setCommunity(d.community);
    setMembers(d.members ?? []);
  }, [communityId]);

  // ── Fetch messages (full or incremental via ?after=ISO) ──────────────────
  const fetchMessages = useCallback(
    (after?: string): Promise<void> => {
      const targetId = communityId;
      if (!after) {
        const inflight = inFlightMsgFetch.get(targetId);
        if (inflight) {
          return inflight.then(() => {
            const cached = msgCache.get(targetId);
            if (communityIdRef.current === targetId && cached?.length) setMessages(cached);
          });
        }
      }
      const url = after
        ? `/api/communities/${targetId}/messages?after=${encodeURIComponent(after)}`
        : `/api/communities/${targetId}/messages`;

      const p: Promise<void> = fetch(url)
        .then((res) => (res.ok ? res.json() : undefined))
        .then((d) => {
          if (!d) return;
          const incoming: Message[] = d.messages ?? [];
          if (after) {
            const existing  = msgCache.get(targetId) ?? [];
            const existingIds = new Set(existing.map((m) => m.id));
            const toAdd = incoming.filter((m) => !existingIds.has(m.id));
            if (toAdd.length > 0) {
              const cacheSnapshot = [
                ...existing.filter((m) => !m.id.startsWith("temp-")),
                ...toAdd,
              ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
              msgCache.set(targetId, cacheSnapshot);
            }
            setMessages((prev) => {
              if (communityIdRef.current !== targetId) return prev;
              const prevIds = new Set(prev.map((m) => m.id));
              const toAddToPrev = incoming.filter((m) => !prevIds.has(m.id));
              if (toAddToPrev.length === 0) return prev;
              const merged = [
                ...prev.filter((m) => !m.id.startsWith("temp-")),
                ...toAddToPrev,
              ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
              msgCache.set(targetId, merged);
              return merged;
            });
          } else {
            msgCache.set(targetId, incoming);
            msgFetchedAt.set(targetId, Date.now());
            evictIfNeeded();
            if (communityIdRef.current === targetId) setMessages(incoming);
          }
        })
        .catch(() => {})
        .finally(() => { if (!after) inFlightMsgFetch.delete(targetId); });

      if (!after) inFlightMsgFetch.set(targetId, p);
      return p;
    },
    [communityId]
  );

  // ── On communityId change: show cache instantly, catch up ────────────────
  useEffect(() => {
    communityIdRef.current = communityId;
    setShowScrollToBottom(false);
    setInitialMessagesReady(false);
    let cancelled = false;
    const cachedMsgs = msgCache.get(communityId);
    const cachedMeta = metaCache.get(communityId);
    setMessages(cachedMsgs ?? []);
    if (cachedMeta) {
      setCommunity(cachedMeta.community);
      setMembers(cachedMeta.members);
      setLoading(false);
    } else {
      setLoading(true);
    }
    const metaIsStale = !cachedMeta || Date.now() - cachedMeta.fetchedAt > META_STALE_MS;
    const msgPromise = (() => {
      if (cachedMsgs?.length) {
        const lastReal = cachedMsgs.filter((m) => !m.id.startsWith("temp-")).at(-1);
        return fetchMessages(lastReal?.created_at);
      }
      return fetchMessages();
    })();
    (async () => {
      await Promise.all([msgPromise, metaIsStale ? fetchMeta() : Promise.resolve()]);
      if (!cancelled) { setLoading(false); setInitialMessagesReady(true); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  // ── Effect 1: Unread boundary snapshot ──────────────────────────────────
  useEffect(() => {
    if (!initialMessagesReady) return;
    if (snapshotReady) return;
    if (lastReadAt === undefined) {
      if (lastReadAtOnOpen.has(communityId)) {
        setLastReadAt(lastReadAtOnOpen.get(communityId) ?? null);
        lastReadAtOnOpen.delete(communityId);
        return;
      }
      const timer = setTimeout(() => {
        if (communityIdRef.current !== communityId) return;
        if (lastReadAtOnOpen.has(communityId)) {
          setLastReadAt(lastReadAtOnOpen.get(communityId) ?? null);
          lastReadAtOnOpen.delete(communityId);
        } else {
          setLastReadAt(null);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
    const realMsgs = messages.filter((m) => !m.id.startsWith("temp-"));
    const lastReadTime = lastReadAt === null ? -Infinity : new Date(lastReadAt).getTime();
    const unreadMsgs = realMsgs.filter(
      (m) => m.user_id !== currentUserId && new Date(m.created_at).getTime() > lastReadTime
    );
    unreadAtOpenRef.current = { firstMsgId: unreadMsgs[0]?.id ?? null, count: unreadMsgs.length };
    setSnapshotReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessagesReady, lastReadAt, communityId, snapshotReady]);

  // ── Effect 2: Initial scroll to unread boundary ──────────────────────────
  useIsomorphicLayoutEffect(() => {
    if (!snapshotReady) return;
    if (loading) return;
    if (initialScrollDoneRef.current) return;
    initialScrollDoneRef.current = true;
    const container = scrollContainerRef.current;
    if (!container) { setInitialPositionResolved(true); return; }
    const isOverflowing = container.scrollHeight > container.clientHeight;
    if (!isOverflowing) { setInitialPositionResolved(true); return; }
    const divider = unreadDividerRef.current;
    if (divider && unreadAtOpenRef.current?.firstMsgId) {
      const dividerRect   = divider.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const dividerTop    = dividerRect.top - containerRect.top + container.scrollTop;
      container.scrollTop = Math.max(0, dividerTop - 80);
    } else {
      container.scrollTop = container.scrollHeight - container.clientHeight;
    }
    setInitialPositionResolved(true);
  }, [snapshotReady, loading, communityId]);

  // ── Effect 3: Realtime auto-scroll ──────────────────────────────────────
  useEffect(() => {
    if (!initialScrollDoneRef.current) return;
    if (!realtimeInsertPendingRef.current) return;
    realtimeInsertPendingRef.current = false;
    if (realtimeWasNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      setShowScrollToBottom(true);
    }
  }, [messages]);

  // ── Show/hide scroll-to-bottom button ────────────────────────────────────
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const onScroll = () => {
      const dist = container.scrollHeight - container.scrollTop - container.clientHeight;
      setShowScrollToBottom(dist > 80);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  // ── Auto-focus input when chat opens ────────────────────────────────────
  useEffect(() => { inputRef.current?.focus(); }, [communityId]);

  // ── Redirect typing to input ─────────────────────────────────────────────
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === inputRef.current) return;
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (document.activeElement as HTMLElement)?.isContentEditable) return;
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [communityId]);

  // ── Supabase Realtime ─────────────────────────────────────────────────────
  useEffect(() => {
    let supabase: ReturnType<typeof createBrowserClient>;
    try { supabase = createBrowserClient(); } catch { return; }

    const hasSubscribedRef = { current: false };
    const channel = supabase
      .channel(`community:${communityId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_messages", filter: `community_id=eq.${communityId}` },
        (payload) => {
          const newRow = payload.new as { id: string; community_id: string; user_id: string; content: string; created_at: string };
          if (initialScrollDoneRef.current) {
            const container = scrollContainerRef.current;
            if (container) {
              const dist = container.scrollHeight - container.scrollTop - container.clientHeight;
              realtimeWasNearBottomRef.current = dist < 100;
            } else {
              realtimeWasNearBottomRef.current = false;
            }
            realtimeInsertPendingRef.current = true;
          }
          setMessages((prev) => {
            if (prev.some((m) => m.id === newRow.id)) return prev;
            const withoutTemp = prev.filter((m) => !(m.id.startsWith("temp-") && m.user_id === newRow.user_id));
            const senderMember = membersRef.current.find((m) => m.user_id === newRow.user_id);
            const users = senderMember?.users ?? null;
            const incoming: Message = { id: newRow.id, content: newRow.content, created_at: newRow.created_at, user_id: newRow.user_id, users, status: "sent" };
            const next = [...withoutTemp, incoming].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            msgCache.set(communityId, next);

            if (!senderMember && !pendingProfileFetchRef.current.has(newRow.user_id)) {
              const targetCommunityId = communityId;
              const targetUserId = newRow.user_id;
              const targetMsgId = newRow.id;
              const p: Promise<void> = fetch(`/api/communities/${targetCommunityId}/members/${targetUserId}`)
                .then((r) => (r.ok ? r.json() : null))
                .then((profile: { name: string; avatar_url: string | null } | null) => {
                  if (!profile) return;
                  const resolvedUsers = { name: profile.name, avatar_url: profile.avatar_url };
                  membersRef.current = [...membersRef.current, { user_id: targetUserId, users: resolvedUsers }];
                  setMessages((prev) => {
                    const next = prev.map((m) => m.id === targetMsgId && m.users === null ? { ...m, users: resolvedUsers } : m);
                    msgCache.set(targetCommunityId, next);
                    return next;
                  });
                })
                .catch(() => {})
                .finally(() => { pendingProfileFetchRef.current.delete(targetUserId); });
              pendingProfileFetchRef.current.set(targetUserId, p);
            }
            return next;
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          if (!hasSubscribedRef.current) {
            hasSubscribedRef.current = true;
          } else {
            const cached = msgCache.get(communityId) ?? [];
            const lastReal = cached.filter((m) => !m.id.startsWith("temp-")).at(-1);
            fetchMessages(lastReal?.created_at ?? undefined);
          }
        }
      });

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId, fetchMessages]);

  // ── Polling disabled — keeping hook for easy re-enable ───────────────────
  useEffect(() => {
    const id = 0 as unknown as ReturnType<typeof setInterval>;
    return () => clearInterval(id);
  }, [communityId, fetchMessages]);

  // ── Tab visibility / focus catch-up ──────────────────────────────────────
  useEffect(() => {
    const handleCatchUp = () => {
      if (document.visibilityState !== "visible") return;
      const cached = msgCache.get(communityId) ?? [];
      const lastReal = cached.filter((m) => !m.id.startsWith("temp-")).at(-1);
      fetchMessages(lastReal?.created_at ?? undefined);
    };
    document.addEventListener("visibilitychange", handleCatchUp);
    window.addEventListener("focus", handleCatchUp);
    return () => {
      document.removeEventListener("visibilitychange", handleCatchUp);
      window.removeEventListener("focus", handleCatchUp);
    };
  }, [communityId, fetchMessages]);

  // ── Send message ─────────────────────────────────────────────────────────
  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = { id: tempId, content, created_at: new Date().toISOString(), user_id: currentUserId, users: null, status: "sending" };
    setMessages((prev) => { const next = [...prev, optimistic]; msgCache.set(communityId, next); return next; });
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "24px";
    inputRef.current?.focus();
    try {
      const res = await fetch(`/api/communities/${communityId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setHideUnreadDivider(true);
        const { message } = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) {
            const next = prev.filter((m) => m.id !== tempId);
            msgCache.set(communityId, next);
            return next;
          }
          const next = prev.map((m) => m.id === tempId ? { ...message, status: "sent" as const } : m);
          msgCache.set(communityId, next);
          return next;
        });
      } else {
        const d = await res.json();
        setMessages((prev) => {
          const next = prev.map((m) => m.id === tempId ? { ...m, status: "failed" as const } : m);
          msgCache.set(communityId, next);
          return next;
        });
        setError(d.error ?? "Failed to send.");
      }
    } catch {
      setMessages((prev) => {
        const next = prev.map((m) => m.id === tempId ? { ...m, status: "failed" as const } : m);
        msgCache.set(communityId, next);
        return next;
      });
      setError("Network error.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  // ── Group messages by date ───────────────────────────────────────────────
  type Group = { date: string; messages: Message[] };
  const grouped = useMemo(() => messages.reduce<Group[]>((acc, msg) => {
    const date = fmtDate(msg.created_at);
    const last = acc[acc.length - 1];
    if (last?.date === date) last.messages.push(msg);
    else acc.push({ date, messages: [msg] });
    return acc;
  }, []), [messages]);

  // ── Unread divider ───────────────────────────────────────────────────────
  const realMessages = useMemo(() => messages.filter((m) => !m.id.startsWith("temp-")), [messages]);
  const firstUnreadMsgId: string | null =
    snapshotReady && !hideUnreadDivider
      ? (unreadAtOpenRef.current?.firstMsgId ?? null)
      : null;
  const unreadDisplayCount = useMemo(() => {
    if (!snapshotReady || lastReadAt === undefined) return 0;
    return realMessages.filter(
      (m) => m.user_id !== currentUserId &&
        (lastReadAt === null || new Date(m.created_at).getTime() > new Date(lastReadAt).getTime())
    ).length;
  }, [snapshotReady, lastReadAt, realMessages, currentUserId]);

  // ── Display community (live state or sidebar fallback) ───────────────────
  const sidebarEntry = hasMounted
    ? sidebarStore.data?.communities.find((c) => c.id === communityId)
    : undefined;
  const displayCommunity = community ?? (sidebarEntry
    ? { id: communityId, name: sidebarEntry.name, type: sidebarEntry.type, member_count: sidebarEntry.member_count, image_url: sidebarEntry.image_url }
    : null);
  const sidebarType = displayCommunity?.type ?? "";

  if (!loading && !displayCommunity) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="font-body text-sm text-foreground-muted">Community not found.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ChatHeader community={displayCommunity} />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto"
            style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "24px 24px" }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <LottieLoader communityId={communityId} communityType={sidebarType} size={200} spinnerClassName="h-5 w-5 text-foreground-muted" />
              </div>
            ) : (
              <div
                className="min-h-full flex flex-col justify-end px-5 py-4 space-y-1"
                style={{ visibility: initialPositionResolved ? "visible" : "hidden" }}
              >
                {grouped.length === 0 && (
                  <div className="flex flex-col items-center justify-center flex-1 gap-3 py-16">
                    <div className="h-12 w-12 rounded-full bg-surface-raised flex items-center justify-center text-2xl overflow-hidden shrink-0">
                      {displayCommunity?.image_url ? (
                        <img src={displayCommunity.image_url} alt={displayCommunity.name} className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        TYPE_EMOJI[displayCommunity?.type ?? ""] ?? "💬"
                      )}
                    </div>
                    <p className="font-body text-sm text-foreground-muted text-center">
                      Welcome to{" "}
                      <span className="font-medium text-foreground">{displayCommunity?.name ?? ""}</span>!
                      <br />
                      <span className="text-xs">Be the first to say something.</span>
                    </p>
                  </div>
                )}

                {grouped.map((group) => (
                  <div key={group.date}>
                    <div className="flex items-center justify-center py-3">
                      <span className="font-body text-[11px] text-foreground-muted bg-surface-raised rounded-full px-3 py-0.5 shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
                        {group.date}
                      </span>
                    </div>
                    {group.messages.map((msg, i) => {
                      const isMe          = msg.user_id === currentUserId;
                      const prev          = group.messages[i - 1];
                      const isSameAuthor  = prev?.user_id === msg.user_id;
                      const isFirstUnread = firstUnreadMsgId !== null && msg.id === firstUnreadMsgId;
                      const dividerNode   = isFirstUnread ? (
                        <UnreadDivider ref={unreadDividerRef} count={unreadDisplayCount} />
                      ) : null;

                      return (
                        <MessageBubble
                          key={msg.id}
                          msg={msg}
                          isMe={isMe}
                          isSameAuthor={isSameAuthor}
                          isFirstUnread={isFirstUnread}
                          unreadDivider={dividerNode}
                        />
                      );
                    })}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {showScrollToBottom && (
            <button
              onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="absolute bottom-[72px] right-4 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-surface-raised shadow-lg border border-border text-foreground-muted hover:text-foreground transition-colors"
              aria-label="Scroll to bottom"
            >
              <ChevronDown size={16} />
            </button>
          )}

          <ChatInput
            ref={inputRef}
            input={input}
            sending={sending}
            error={error}
            placeholder={`Message ${displayCommunity?.name ?? ""}…`}
            onChange={setInput}
            onKeyDown={handleKeyDown}
            onSend={handleSend}
          />
        </div>

        <MembersPanel members={members} />
      </div>
    </div>
  );
}
