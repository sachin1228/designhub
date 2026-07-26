"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquarePlus, RefreshCw } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/browser";
import type { CommunityThread } from "./types";
import { CreateThreadModal } from "./CreateThreadModal";
import { ThreadCard } from "./ThreadCard";

export function ThreadsView({
  communityId,
  currentUserId,
}: {
  communityId: string;
  currentUserId: string;
}) {
  const [threads, setThreads] = useState<CommunityThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = useCallback(async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await fetch(`/api/communities/${communityId}/threads`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to load threads.");
      setThreads(data.threads as CommunityThread[]);
      setError(null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load threads.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [communityId]);

  useEffect(() => {
    void fetchThreads();
    let supabase: ReturnType<typeof createBrowserClient>;
    try {
      supabase = createBrowserClient();
    } catch {
      return;
    }

    // Subscribe to thread changes
    const threadChannel = supabase
      .channel(`community-threads:${communityId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "community_threads",
          filter: `community_id=eq.${communityId}`,
        },
        () => void fetchThreads(true),
      )
      .subscribe();

    // Subscribe to vote changes for realtime vote counts
    const voteChannel = supabase
      .channel(`thread-votes:${communityId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "thread_votes",
        },
        (payload) => {
          // Update vote count optimistically in state using the realtime event
          const record = (payload.new ?? payload.old) as { thread_id?: string; user_id?: string } | null;
          if (!record?.thread_id) return;
          const threadId = record.thread_id;

          setThreads((current) =>
            current.map((thread) => {
              if (thread.id !== threadId) return thread;
              if (payload.eventType === "INSERT") {
                const voted = record.user_id === currentUserId;
                return {
                  ...thread,
                  vote_count: thread.vote_count + 1,
                  user_voted: voted ? true : thread.user_voted,
                };
              }
              if (payload.eventType === "DELETE") {
                const wasMe = (payload.old as { user_id?: string })?.user_id === currentUserId;
                return {
                  ...thread,
                  vote_count: Math.max(0, thread.vote_count - 1),
                  user_voted: wasMe ? false : thread.user_voted,
                };
              }
              return thread;
            }),
          );
        },
      )
      .subscribe();

    const handleFocus = () => {
      if (document.visibilityState === "visible") void fetchThreads(true);
    };
    document.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("focus", handleFocus);

    return () => {
      supabase.removeChannel(threadChannel);
      supabase.removeChannel(voteChannel);
      document.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener("focus", handleFocus);
    };
  }, [communityId, currentUserId, fetchThreads]);

  function handleCreated(thread: CommunityThread) {
    setThreads((current) => [thread, ...current.filter((item) => item.id !== thread.id)]);
  }

  function handleUpdated(updated: CommunityThread) {
    setThreads((current) =>
      current.map((thread) => (thread.id === updated.id ? { ...thread, ...updated } : thread)),
    );
  }

  function handleVoteChanged(threadId: string, voted: boolean, newCount: number) {
    setThreads((current) =>
      current.map((thread) =>
        thread.id === threadId
          ? { ...thread, user_voted: voted, vote_count: newCount }
          : thread,
      ),
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-6 py-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Threads</h2>
            <p className="mt-1 font-body text-sm text-foreground-muted">
              Start a discussion, share an idea, or ask your community a question.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchThreads(true)}
              disabled={refreshing}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground-muted hover:border-accent/40 hover:text-foreground disabled:opacity-50"
              aria-label="Refresh threads"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 font-body text-sm font-medium text-accent-foreground hover:bg-accent-hover"
            >
              <MessageSquarePlus size={16} />
              Create Thread
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="font-body text-sm text-red-400">{error}</p>
            <button type="button" onClick={() => void fetchThreads()} className="font-body text-xs text-red-300 underline">
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((item) => (
              <div key={item} className="h-40 animate-pulse rounded-2xl border border-border bg-surface" />
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <MessageSquarePlus size={28} className="mx-auto text-foreground-subtle" />
            <h3 className="mt-3 font-display text-base font-semibold text-foreground">No threads yet</h3>
            <p className="mt-1 font-body text-sm text-foreground-muted">Be the first person to start a discussion.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {threads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                currentUserId={currentUserId}
                communityId={communityId}
                onUpdated={handleUpdated}
                onVoteChanged={handleVoteChanged}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateThreadModal
          communityId={communityId}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
