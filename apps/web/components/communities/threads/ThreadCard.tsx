"use client";

import { ExternalLink, Link as LinkIcon, Paperclip, MessageSquare } from "lucide-react";
import type { CommunityThread } from "./types";
import { THREAD_CATEGORIES } from "./types";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ThreadCard({ thread }: { thread: CommunityThread }) {
  const category = THREAD_CATEGORIES.find((item) => item.value === thread.category);

  return (
    <article className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent/30">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-accent/15 flex items-center justify-center">
          {thread.users?.avatar_url ? (
            <img
              src={thread.users.avatar_url}
              alt={thread.users.name}
              className="h-9 w-9 object-cover"
            />
          ) : (
            <span className="font-display text-sm font-semibold text-accent">
              {(thread.users?.name ?? "?").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
            <span className="font-medium text-foreground">{thread.users?.name ?? "Community member"}</span>
            <span>·</span>
            <span>{formatDate(thread.created_at)}</span>
          </div>
          <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-foreground">
            {thread.title}
          </h3>
        </div>
        {category && (
          <span className="shrink-0 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 font-body text-[11px] text-accent">
            {category.emoji} {category.label}
          </span>
        )}
      </div>

      <p className="mt-4 whitespace-pre-wrap font-body text-sm leading-relaxed text-foreground-muted">
        {thread.description}
      </p>

      {thread.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {thread.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-surface-raised px-2.5 py-1 font-body text-xs text-foreground-muted"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {(thread.attachments.length > 0 || thread.links.length > 0 || thread.allow_replies) && (
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-3 font-body text-xs text-foreground-subtle">
          {thread.attachments.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Paperclip size={13} /> {thread.attachments.length} attachment
              {thread.attachments.length !== 1 ? "s" : ""}
            </span>
          )}
          {thread.links.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <LinkIcon size={13} /> {thread.links.length} link
              {thread.links.length !== 1 ? "s" : ""}
            </span>
          )}
          {thread.allow_replies && (
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare size={13} /> Replies allowed
            </span>
          )}
        </div>
      )}

      {(thread.attachments.length > 0 || thread.links.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {thread.attachments.map((attachment) => (
            <a
              key={attachment.url}
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 font-body text-xs text-foreground-muted hover:border-accent/40 hover:text-accent transition-colors"
            >
              <Paperclip size={12} />
              <span className="truncate">{attachment.name}</span>
            </a>
          ))}
          {thread.links.map((link) => (
            <a
              key={link}
              href={link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 font-body text-xs text-foreground-muted hover:border-accent/40 hover:text-accent transition-colors"
            >
              <ExternalLink size={12} />
              <span className="max-w-[260px] truncate">{link}</span>
            </a>
          ))}
        </div>
      )}
    </article>
  );
}