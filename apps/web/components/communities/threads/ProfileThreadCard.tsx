"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronUp, MessageSquare, MoreHorizontal, Pencil } from "lucide-react";
import type { ProfileThread } from "./types";
import { THREAD_CATEGORIES } from "./types";
import type { CommunityThread } from "./types";
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

interface ProfileThreadCardProps {
  thread: ProfileThread;
  onUpdated: (thread: ProfileThread) => void;
  onVoteChanged: (threadId: string, voted: boolean, newCount: number) => void;
}

export function ProfileThreadCard({ thread, onUpdated, onVoteChanged }: ProfileThreadCardProps) {
  const category = THREAD_CATEGORIES.find((item) => item.value === thread.category);
  const [votePending, setVotePending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    const newVoted = !thread.user_voted;
    const newCount = thread.vote_count + (newVoted ? 1 : -1);
    onVoteChanged(thread.id, newVoted, newCount);
    setVotePending(true);
    try {
      const response = await fetch(
        `/api/communities/${thread.community_id}/threads/${thread.id}/vote`,
        { method: "POST" },
      );
      if (!response.ok) {
        onVoteChanged(thread.id, thread.user_voted, thread.vote_count);
      }
    } catch {
      onVoteChanged(thread.id, thread.user_voted, thread.vote_count);
    } finally {
      setVotePending(false);
    }
  }

  return (
    <>
      <article className="group rounded-2xl border border-border bg-surface-raised">
        <div className="flex items-stretch">
          {/* Left — upvote column */}
          <div className="flex w-12 shrink-0 flex-col items-center justify-start gap-1 pt-4 pb-4 pl-2 pr-1">
            <button
              type="button"
              onClick={handleVote}
              disabled={votePending}
              aria-label={thread.user_voted ? "Remove upvote" : "Upvote"}
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-60 ${
                thread.user_voted
                  ? "bg-accent/20 text-accent"
                  : "text-foreground-subtle hover:bg-accent/10 hover:text-accent"
              }`}
            >
              <ChevronUp size={16} strokeWidth={thread.user_voted ? 2.5 : 2} />
            </button>
            <span
              className={`font-mono text-[11px] font-semibold tabular-nums ${
                thread.user_voted ? "text-accent" : "text-foreground-muted"
              }`}
            >
              {thread.vote_count}
            </span>
          </div>

          {/* Divider */}
          <div className="my-3.5 w-px bg-border" />

          {/* Main content */}
          <div className="min-w-0 flex-1 px-4 py-3.5">
            {/* Top row: category + community + menu */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {category && (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2 py-0.5 font-body text-[11px] text-foreground-muted">
                    <span>{category.emoji}</span>
                    {category.label}
                  </span>
                )}
                {thread.community?.name && (
                  <span className="truncate font-body text-[11px] text-foreground-subtle">
                    in {thread.community.name}
                  </span>
                )}
              </div>
              {/* Three-dots menu — always shown since profile threads are always the user's own */}
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  aria-label="Thread options"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-subtle opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface hover:text-foreground focus:opacity-100"
                >
                  <MoreHorizontal size={15} />
                </button>
                {menuOpen && (
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
            <h3 className="mt-2 font-display text-sm font-semibold leading-snug text-foreground">
              {thread.title}
            </h3>

            {/* Description */}
            <p className="mt-1 line-clamp-2 font-body text-sm text-foreground-muted">
              {thread.description}
            </p>

            {/* Tags */}
            {thread.tags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
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

            {/* Footer */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
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
          thread={thread as CommunityThread}
          communityId={thread.community_id}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updated) => onUpdated({ ...thread, ...updated })}
        />
      )}
    </>
  );
}
