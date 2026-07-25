"use client";

import { CalendarDays, Clock3, MessageSquare, Users } from "lucide-react";
import type { ChatTab } from "./ChatHeader";

const STATIC_THREADS = [
  {
    title: "Design critique — Mobile onboarding",
    category: "Feedback",
    replies: 8,
    activity: "12m ago",
    preview: "Would love a second pair of eyes on the new first-run flow.",
    initials: "SP",
  },
  {
    title: "Portfolio review Friday",
    category: "Community",
    replies: 14,
    activity: "34m ago",
    preview: "Drop a link to your latest case study and we’ll review it together.",
    initials: "AR",
  },
  {
    title: "Share your latest case study",
    category: "Showcase",
    replies: 21,
    activity: "1h ago",
    preview: "The new accessibility section in this one was a fun challenge.",
    initials: "NK",
  },
];

const STATIC_EVENTS = [
  {
    month: "JUL",
    day: "26",
    title: "Pune Designers Meetup",
    date: "26 Jul, 2025 · 4:00 PM",
    location: "Mariplex, Pune",
    going: "32 going",
    color: "bg-accent",
  },
  {
    month: "AUG",
    day: "02",
    title: "Design systems roundtable",
    date: "02 Aug, 2025 · 6:30 PM",
    location: "Online event",
    going: "18 going",
    color: "bg-violet-500",
  },
];

function TabIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <p className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-1.5 max-w-xl font-body text-sm leading-relaxed text-foreground-muted">
        {description}
      </p>
    </div>
  );
}

function ThreadsView() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <TabIntro
        eyebrow="Community conversations"
        title="Keep the good conversations going"
        description="Threads make it easy to follow a focused discussion without losing the flow of the main chat."
      />

      <div className="space-y-3">
        {STATIC_THREADS.map((thread) => (
          <article
            key={thread.title}
            className="rounded-xl border border-border bg-surface/60 p-4 transition-colors hover:border-foreground-subtle/40"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft font-body text-[11px] font-semibold text-accent">
                {thread.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-body text-sm font-semibold text-foreground">
                    {thread.title}
                  </h3>
                  <span className="rounded-full border border-border px-2 py-0.5 font-body text-[10px] text-foreground-muted">
                    {thread.category}
                  </span>
                </div>
                <p className="mt-1.5 font-body text-xs leading-relaxed text-foreground-muted">
                  {thread.preview}
                </p>
                <div className="mt-3 flex items-center gap-4 font-body text-[11px] text-foreground-subtle">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare size={12} />
                    {thread.replies} replies
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock3 size={12} />
                    Active {thread.activity}
                  </span>
                </div>
              </div>
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" title="Active thread" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function EventsView() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <TabIntro
        eyebrow="Meet the community"
        title="Events worth showing up for"
        description="A quick look at what’s happening next. Save a spot and bring your latest work to share."
      />

      <div className="space-y-3">
        {STATIC_EVENTS.map((event) => (
          <article
            key={event.title}
            className="flex flex-col gap-4 rounded-xl border border-border bg-surface/60 p-4 sm:flex-row sm:items-center"
          >
            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-surface-raised">
              <span className="font-body text-[10px] font-semibold tracking-wider text-foreground-muted">
                {event.month}
              </span>
              <span className="font-display text-2xl font-bold leading-none text-foreground">
                {event.day}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-body text-sm font-semibold text-foreground">{event.title}</h3>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-body text-xs text-foreground-muted">
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={12} />
                  {event.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={12} />
                  {event.going}
                </span>
              </div>
              <p className="mt-1 font-body text-xs text-foreground-subtle">{event.location}</p>
            </div>
            <button
              type="button"
              className={`shrink-0 rounded-lg px-4 py-2 font-body text-xs font-semibold text-white transition-opacity hover:opacity-90 ${event.color}`}
            >
              View event
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ChatTabContent({ tab }: { tab: Exclude<ChatTab, "chat"> }) {
  return (
    <div className="absolute inset-0 overflow-y-auto">
      {tab === "threads" ? <ThreadsView /> : <EventsView />}
    </div>
  );
}