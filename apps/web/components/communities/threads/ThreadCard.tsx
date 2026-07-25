"use client";

import { Clock3, MessageSquare } from "lucide-react";
import type { CommunityThread } from "./types";
import { THREAD_CATEGORIES } from "./types";

function formatRelativeDate(value: string) {
  const elapsed = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(elapsed / 60_000));
  if (minutes < 60) return `Active ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Active ${days}d ago`;
}

export function ThreadCard({ thread }: { thread: CommunityThread }) {
  const category = THREAD_CATEGORIES.find((item) => item.value === thread.category);

  return (
    <article className="rounded-2xl border border-border bg-surface px-5 py-5 transition-colors hover:border-accent/30 sm:px-6">
      <div className="flex items-start gap-4">
        <div className="mt-0.5 h-10 w-10 shrink-0 overflow-hidden rounded-full bg-accent/15 flex items-center justify-center">
          {thread.users?.avatar_url ? (
            <img
              src={thread.users.avatar_url}
              alt={thread.users.name}
              className="h-10 w-10 object-cover"
            />
          ) : (
            <span className="font-display text-sm font-semibold text-accent">
              {(thread.users?.name ?? "?").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="min-w-0 truncate font-display text-base font-semibold leading-tight text-foreground">
              {thread.title}
            </h3>
            {category && (
              <span className="shrink-0 rounded-full border border-border px-2.5 py-1 font-body text-[11px] text-foreground-muted">
                {category.label}
              </span>
            )}
          </div>
          <p className="mt-2 truncate font-body text-sm text-foreground-muted">
            {thread.description}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 font-body text-xs text-foreground-subtle">
            {thread.allow_replies && (
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare size={14} />
                Replies open
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={14} />
              {formatRelativeDate(thread.updated_at || thread.created_at)}
            </span>
          </div>
        </div>
        <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" aria-label="Thread activity" />
      </div>
    </article>
  );
}
