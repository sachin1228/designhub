"use client";

import { useEffect, useState } from "react";
import { MessageSquareText } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/browser";
import type { ProfileThread } from "@/components/communities/threads/types";
import { THREAD_CATEGORIES } from "@/components/communities/threads/types";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ProfileThreads({ initialThreads }: { initialThreads: ProfileThread[] }) {
  const [threads, setThreads] = useState(initialThreads);

  useEffect(() => {
    let supabase: ReturnType<typeof createBrowserClient>;
    try {
      supabase = createBrowserClient();
    } catch {
      return;
    }

    const channel = supabase
      .channel("profile-threads")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "community_threads",
        },
        async () => {
          try {
            const response = await fetch("/api/profile/threads", { cache: "no-store" });
            if (!response.ok) return;
            const data = await response.json();
            setThreads(data.threads as ProfileThread[]);
          } catch {
            // The next profile refresh will reconcile the list if this request fails.
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="mb-8 rounded-2xl border border-border bg-surface p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="rounded bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-bold text-accent">
          04
        </span>
        <span className="font-display text-xs font-semibold uppercase tracking-widest text-foreground-muted">
          Your Threads
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {threads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center">
          <MessageSquareText size={24} className="mx-auto text-foreground-subtle" />
          <p className="mt-2 font-body text-sm text-foreground-muted">
            Threads you create will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => {
            const category = THREAD_CATEGORIES.find((item) => item.value === thread.category);
            return (
              <div key={thread.id} className="rounded-xl border border-border bg-surface-raised p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-semibold text-foreground">
                      {thread.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 font-body text-sm text-foreground-muted">
                      {thread.description}
                    </p>
                  </div>
                  {category && (
                    <span className="shrink-0 rounded-full border border-accent/25 bg-accent/10 px-2 py-1 font-body text-[11px] text-accent">
                      {category.emoji} {category.label}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 font-body text-xs text-foreground-subtle">
                  <span>{thread.community?.name ?? "Community"}</span>
                  <span>·</span>
                  <span>{formatDate(thread.created_at)}</span>
                  {thread.tags.length > 0 && (
                    <>
                      <span>·</span>
                      <span>{thread.tags.map((tag) => `#${tag}`).join(" ")}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}