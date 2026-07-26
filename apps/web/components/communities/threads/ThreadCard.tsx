"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronUp, MessageSquare, MoreHorizontal, Pencil } from "lucide-react";
import type { CommunityThread } from "./types";
import { THREAD_CATEGORIES } from "./types";
import { EditThreadModal } from "./EditThreadModal";

function formatRelativeDate(value: string) {
  const elapsed = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(elapsed / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface ThreadCardProps {
  thread: CommunityThread;
  currentUserId: string;
  communityId: string;
  onUpdated: (thread: CommunityThread) => void;
  onVoteChanged: (threadId: string, voted: boolean, newCount: number) => void;
}

export function ThreadCard({
  thread,
  currentUserId,
  communityId,
  onUpdated,
  onVoteChanged,
}: ThreadCardProps) {
  const category = THREAD_CATEGORIES.find((item) => item.value === thread.category);
  const isOwner = thread.user_id === currentUserId;

  const [votePending, setVotePending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  async function handleVote() {
    if (votePending) return;
    // Optimistic update
    const newVoted = !thread.user_voted;
    const newCount = thread.vote_count + (newVoted ? 1 : -1);
    onVoteChanged(thread.id, newVoted, newCount);
    setVotePending(true);
    try {
      const response = await fetch(
        `/api/communities/${communityId}/threads/${thread.id}/vote`,
        { method: "POST" },
      );
      if (!response.ok) {
        // Revert on failure
        onVoteChanged(thread.id, thread.user_voted, thread.vote_count);
      }
    } catch {
      onVoteChanged(thread.id, thread.user_voted, thread.vote_count);
    } finally {
      setVotePending(false);
    }
  }

  const authorName = thread.users?.name ?? "Member";
  const authorInitial = authorName.charAt(0).toUpperCase();

  return (
    <>
      <article className="group rounded-2xl border border-border bg-surface">
        <div className="flex items-stretch">
          {/* Left — upvote column */}
          <div className="flex w-14 shrink-0 flex-col items-center justify-start gap-1 pt-5 pb-5 pl-3 pr-1">
            <button
              type="button"
              onClick={handleVote}
              disabled={votePending}
              aria-label={thread.user_voted ? "Remove upvote" : "Upvote"}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-60 ${
                thread.user_voted
                  ? "bg-accent/20 text-accent"
                  : "text-foreground-subtle hover:bg-accent/10 hover:text-accent"
              }`}
            >
              <ChevronUp size={18} strokeWidth={thread.user_voted ? 2.5 : 2} />
            </button>
            <span
              className={`font-mono text-xs font-semibold tabular-nums ${
                thread.user_voted ? "text-accent" : "text-foreground-muted"
              }`}
            >
              {thread.vote_count}
            </span>
          </div>

          {/* Divider */}
          <div className="my-4 w-px bg-border" />

          {/* Main content */}
          <div className="min-w-0 flex-1 px-4 py-4 sm:px-5">
            {/* Top row: category + menu */}
            <div className="flex items-center justify-between gap-2">
              {category && (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 font-body text-[11px] text-foreground-muted">
                  <span>{category.emoji}</span>
                  {category.label}
                </span>
              )}
              <div className="relative ml-auto" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  aria-label="Thread options"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-subtle opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface-raised hover:text-foreground focus:opacity-100"
                >
                  <MoreHorizontal size={15} />
                </button>
                {menuOpen && isOwner && (
                  <div className="absolute right-0 top-8 z-20 min-w-[130px] rounded-xl border border-border bg-surface py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); setShowEditModal(true); }}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2 font-body text-sm text-foreground-muted hover:bg-surface-raised hover:text-foreground"
                    >
                      <Pencil size={13} />
                      Edit thread
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <h3 className="mt-2.5 font-display text-base font-semibold leading-snug text-foreground">
              {thread.title}
            </h3>

            {/* Description */}
            <p className="mt-1.5 line-clamp-2 font-body text-sm text-foreground-muted">
              {thread.description}
            </p>

            {/* Tags */}
            {thread.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {thread.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-border px-2 py-0.5 font-body text-[11px] text-foreground-subtle"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer: author + meta */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              {/* Author avatar */}
              <div className="h-5 w-5 shrink-0 overflow-hidden rounded-full bg-accent/15 flex items-center justify-center">
                {thread.users?.avatar_url ? (
                  <img
                    src={thread.users.avatar_url}
                    alt={authorName}
                    className="h-5 w-5 object-cover"
                  />
                ) : (
                  <span className="font-display text-[9px] font-bold text-accent">{authorInitial}</span>
                )}
              </div>
              <span className="font-body text-xs text-foreground-muted">{authorName}</span>
              <span className="font-body text-xs text-foreground-subtle">·</span>
              <span className="font-body text-xs text-foreground-subtle">
                {formatRelativeDate(thread.updated_at || thread.created_at)}
              </span>
              {thread.allow_replies && (
                <>
                  <span className="font-body text-xs text-foreground-subtle">·</span>
                  <span className="inline-flex items-center gap-1 font-body text-xs text-foreground-subtle">
                    <MessageSquare size={11} />
                    Replies open
                  </span>
                </>
              )}
            </div>
          </div>

        </div>
      </article>

      {showEditModal && (
        <EditThreadModal
          thread={thread}
          communityId={communityId}
          onClose={() => setShowEditModal(false)}
          onUpdated={onUpdated}
        />
      )}
    </>
  );
}
