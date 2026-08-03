"use client";

import { useEffect, useState } from "react";
import { Globe, MessageSquare, Calendar, ExternalLink, ThumbsUp, Loader2, Hash } from "lucide-react";
import Link from "next/link";

type FeedItem = {
  _type: "thread" | "event" | "resource";
  id: string;
  community_id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  community_name: string | null;
  users: { name: string; avatar_url: string | null } | null;
  comment_count: number;
  // thread
  category?: string;
  vote_count?: number;
  user_voted?: boolean;
  // event
  event_date?: string;
  is_online?: boolean;
  cover_image_url?: string | null;
  // resource
  resource_type?: string;
  url?: string;
  tags?: string[];
};

const TYPE_STYLE = {
  thread:   "text-violet-400 bg-violet-500/10 border-violet-500/20",
  event:    "text-blue-400 bg-blue-500/10 border-blue-500/20",
  resource: "text-amber-400 bg-amber-500/10 border-amber-500/20",
} as const;

const TYPE_LABEL = { thread: "Thread", event: "Event", resource: "Resource" } as const;

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function itemHref(item: FeedItem) {
  const seg = item._type === "thread" ? "threads" : item._type === "event" ? "events" : "resources";
  return `/dashboard/communities/${item.community_id}/${seg}/${item.id}`;
}

function HostnameLink({ url }: { url: string }) {
  try {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-2 inline-flex items-center gap-1 font-body text-xs text-accent hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink size={11} />
        {new URL(url).hostname.replace(/^www\./, "")}
      </a>
    );
  } catch { return null; }
}

export function HomeFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/home/feed")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.items) setItems(d.items); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={18} className="animate-spin text-foreground-muted" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Globe size={32} className="mb-3 text-foreground-subtle" />
        <p className="font-body text-sm font-medium text-foreground-muted">Nothing public yet</p>
        <p className="mt-1 max-w-xs font-body text-xs text-foreground-subtle">
          When community members share threads, events, or resources publicly, they&apos;ll appear here.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const href = itemHref(item);
        return (
          <li key={`${item._type}-${item.id}`}>
            <div className="group rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-hover">
              {/* Header */}
              <div className="mb-2.5 flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-body text-[11px] font-medium ${TYPE_STYLE[item._type]}`}
                >
                  {TYPE_LABEL[item._type]}
                </span>
                {item.community_name && (
                  <span className="font-body text-xs text-foreground-subtle">
                    in <span className="text-foreground-muted">{item.community_name}</span>
                  </span>
                )}
                <span className="ml-auto font-mono text-[11px] text-foreground-subtle">
                  {timeAgo(item.created_at)}
                </span>
              </div>

              {/* Event cover */}
              {item._type === "event" && item.cover_image_url && (
                <div className="mb-3 h-28 w-full overflow-hidden rounded-lg border border-border">
                  <img src={item.cover_image_url} alt="" className="h-full w-full object-cover" />
                </div>
              )}

              {/* Title */}
              <Link href={href} className="block">
                <h3 className="font-body text-sm font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2 mb-1">
                  {item.title}
                </h3>
              </Link>

              {/* Description */}
              {item.description && (
                <p className="font-body text-xs text-foreground-muted line-clamp-2 mb-2">
                  {item.description}
                </p>
              )}

              {/* Resource URL */}
              {item._type === "resource" && item.url && (
                <HostnameLink url={item.url} />
              )}

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {item.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-0.5 rounded-full bg-surface-raised px-2 py-0.5 font-body text-[11px] text-foreground-subtle">
                      <Hash size={9} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="mt-2 flex items-center gap-3 border-t border-border pt-2.5">
                <span className="font-body text-xs text-foreground-muted truncate">
                  {item.users?.name ?? "Unknown"}
                </span>
                <div className="ml-auto flex items-center gap-3 shrink-0">
                  {item._type === "thread" && (
                    <span className="inline-flex items-center gap-1 font-body text-xs text-foreground-subtle">
                      <ThumbsUp size={11} />
                      {item.vote_count ?? 0}
                    </span>
                  )}
                  <Link
                    href={href}
                    className="inline-flex items-center gap-1 font-body text-xs text-foreground-subtle hover:text-foreground transition-colors"
                  >
                    <MessageSquare size={11} />
                    {item.comment_count}
                  </Link>
                  {item._type === "event" && item.event_date && (
                    <span className="inline-flex items-center gap-1 font-body text-xs text-foreground-subtle">
                      <Calendar size={11} />
                      {new Date(item.event_date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
