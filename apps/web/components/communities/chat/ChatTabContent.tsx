"use client";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Images,
  MapPin,
  MessageSquare,
  MessagesSquare,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import type { ChatTab } from "./ChatHeader";

type DetailKind = "thread" | "event" | "showcase";

interface DemoComment {
  author: string;
  initials: string;
  time: string;
  text: string;
}

interface DetailData {
  id: string;
  kind: DetailKind;
  title: string;
  label: string;
  summary: string;
  body: string[];
  metadata: Array<{ label: string; value: string }>;
  comments: DemoComment[];
  color: string;
  visualLabel?: string;
}

const STATIC_THREADS: DetailData[] = [
  {
    id: "mobile-onboarding",
    kind: "thread",
    title: "Design critique — Mobile onboarding",
    label: "Feedback thread",
    summary: "Would love a second pair of eyes on the new first-run flow.",
    body: [
      "I’m exploring a shorter onboarding flow for the mobile app. The goal is to help new users reach their first useful moment without making the experience feel rushed.",
      "The current direction uses three screens: a quick value proposition, a preference picker, and a lightweight checklist. I’m especially unsure about the transition between the picker and the checklist.",
    ],
    metadata: [
      { label: "Started by", value: "Sachin Patil" },
      { label: "Category", value: "Feedback" },
      { label: "Replies", value: "8 replies" },
      { label: "Activity", value: "12m ago" },
    ],
    comments: [
      {
        author: "Ananya Rao",
        initials: "AR",
        time: "8m ago",
        text: "The three-step structure feels right. I’d try showing the checklist preview one screen earlier so the payoff is clearer.",
      },
      {
        author: "Neha Kulkarni",
        initials: "NK",
        time: "5m ago",
        text: "Could the preference picker be skippable? That might keep the first session feeling more welcoming.",
      },
      {
        author: "Sachin Patil",
        initials: "SP",
        time: "2m ago",
        text: "Great call. I’ll test a skippable version and share the updated flow here.",
      },
    ],
    color: "bg-accent",
  },
  {
    id: "portfolio-review",
    kind: "thread",
    title: "Portfolio review Friday",
    label: "Community thread",
    summary: "Drop a link to your latest case study and we’ll review it together.",
    body: [
      "This Friday’s portfolio review is an informal space to share work in progress, ask a specific question, and get thoughtful feedback from other designers.",
      "If you’re joining, add one case study link and one thing you want feedback on. Keeping the prompt focused helps everyone give more useful notes.",
    ],
    metadata: [
      { label: "Started by", value: "Ananya Rao" },
      { label: "Category", value: "Community" },
      { label: "Replies", value: "14 replies" },
      { label: "Activity", value: "34m ago" },
    ],
    comments: [
      {
        author: "Rohan Mehta",
        initials: "RM",
        time: "28m ago",
        text: "I’ll bring my payments redesign. I’m mainly looking for feedback on the storytelling order.",
      },
      {
        author: "Priya Shah",
        initials: "PS",
        time: "19m ago",
        text: "Happy to review the narrative. I can also share how I structure my project introductions.",
      },
      {
        author: "Ananya Rao",
        initials: "AR",
        time: "11m ago",
        text: "Perfect — this is exactly the kind of focused feedback we’re hoping for.",
      },
    ],
    color: "bg-violet-500",
  },
  {
    id: "accessibility-case-study",
    kind: "thread",
    title: "Share your latest case study",
    label: "Showcase discussion",
    summary: "The new accessibility section in this one was a fun challenge.",
    body: [
      "I added an accessibility section to my latest case study to show the decisions behind the final design, not just the polished screens.",
      "Would love to hear how everyone balances documenting constraints with keeping a portfolio story easy to scan.",
    ],
    metadata: [
      { label: "Started by", value: "Neha Kulkarni" },
      { label: "Category", value: "Showcase" },
      { label: "Replies", value: "21 replies" },
      { label: "Activity", value: "1h ago" },
    ],
    comments: [
      {
        author: "Aarav Singh",
        initials: "AS",
        time: "54m ago",
        text: "I like when constraints are shown beside the decision they shaped. It makes the case study feel much more credible.",
      },
      {
        author: "Maya Joshi",
        initials: "MJ",
        time: "42m ago",
        text: "A small before-and-after block could make the accessibility improvements even easier to understand.",
      },
      {
        author: "Neha Kulkarni",
        initials: "NK",
        time: "31m ago",
        text: "That’s a helpful idea. I’ll add one to the next version.",
      },
    ],
    color: "bg-emerald-500",
  },
];

const STATIC_EVENTS: DetailData[] = [
  {
    id: "pune-meetup",
    kind: "event",
    title: "Pune Designers Meetup",
    label: "Upcoming event",
    summary: "An evening of design stories, practical feedback, and new connections.",
    body: [
      "Join designers from across Pune for a relaxed evening of conversation and portfolio stories. Bring one project you’re proud of and one question you’re currently working through.",
      "The format is intentionally casual: a short welcome, two lightning talks, and plenty of time for small-group conversations.",
    ],
    metadata: [
      { label: "Date", value: "26 Jul, 2025 · 4:00 PM" },
      { label: "Location", value: "Mariplex, Pune" },
      { label: "Attending", value: "32 going" },
      { label: "Host", value: "DraftHub Pune" },
    ],
    comments: [
      {
        author: "Rohan Mehta",
        initials: "RM",
        time: "1h ago",
        text: "Is there anything specific we should bring for the portfolio review portion?",
      },
      {
        author: "Ananya Rao",
        initials: "AR",
        time: "48m ago",
        text: "One project link is perfect. A laptop is helpful but not required.",
      },
      {
        author: "Priya Shah",
        initials: "PS",
        time: "22m ago",
        text: "Looking forward to this — the small-group format sounds great.",
      },
    ],
    color: "bg-accent",
  },
  {
    id: "systems-roundtable",
    kind: "event",
    title: "Design systems roundtable",
    label: "Online event",
    summary: "A practical conversation about keeping design systems useful as teams grow.",
    body: [
      "We’ll compare the small decisions that make a design system easier to adopt: naming conventions, contribution rituals, documentation, and the balance between flexibility and consistency.",
      "Come with one system question or an example of a pattern that has worked well for your team.",
    ],
    metadata: [
      { label: "Date", value: "02 Aug, 2025 · 6:30 PM" },
      { label: "Location", value: "Online event" },
      { label: "Attending", value: "18 going" },
      { label: "Host", value: "DraftHub Community" },
    ],
    comments: [
      {
        author: "Maya Joshi",
        initials: "MJ",
        time: "2h ago",
        text: "Will there be a recording for people who can’t make the live session?",
      },
      {
        author: "Sachin Patil",
        initials: "SP",
        time: "1h ago",
        text: "Yes, we’ll share the recording and notes in this event page afterward.",
      },
      {
        author: "Aarav Singh",
        initials: "AS",
        time: "36m ago",
        text: "I have a great example of contribution guidelines to bring along.",
      },
    ],
    color: "bg-violet-500",
  },
];

const STATIC_SHOWCASES: DetailData[] = [
  {
    id: "fintech-rebrand",
    kind: "showcase",
    title: "Fintech, made more human",
    label: "Case study · Product design",
    summary: "A calmer investing experience that helps first-time investors feel confident.",
    body: [
      "This project rethought the first-time investing journey around clarity and reassurance. Instead of leading with charts and jargon, the new experience starts with small, understandable choices.",
      "The result is a simpler onboarding flow, a more approachable visual language, and a clear path from learning to taking action.",
    ],
    metadata: [
      { label: "Created by", value: "Maya Joshi" },
      { label: "Role", value: "Lead product designer" },
      { label: "Tools", value: "Figma · Protopie" },
      { label: "Likes", value: "128 likes" },
    ],
    comments: [
      {
        author: "Neha Kulkarni",
        initials: "NK",
        time: "16m ago",
        text: "The way you’ve connected the visual tone to the product promise is excellent.",
      },
      {
        author: "Rohan Mehta",
        initials: "RM",
        time: "9m ago",
        text: "Would love to see the earlier explorations for the onboarding illustration style.",
      },
      {
        author: "Maya Joshi",
        initials: "MJ",
        time: "4m ago",
        text: "I’ll add those next — the early versions were surprisingly different.",
      },
    ],
    color: "bg-pink-500",
    visualLabel: "CALM / CLEAR / CONFIDENT",
  },
  {
    id: "design-system",
    kind: "showcase",
    title: "Northstar design system",
    label: "System · UI foundations",
    summary: "A flexible component language for a growing product team.",
    body: [
      "Northstar gives a growing product team a shared vocabulary for building consistent experiences without slowing down exploration.",
      "The system pairs a practical component library with contribution guidelines that make it easy for designers and engineers to improve the foundation together.",
    ],
    metadata: [
      { label: "Created by", value: "Aarav Singh" },
      { label: "Role", value: "Design systems lead" },
      { label: "Tools", value: "Figma · Storybook" },
      { label: "Likes", value: "96 likes" },
    ],
    comments: [
      {
        author: "Priya Shah",
        initials: "PS",
        time: "41m ago",
        text: "The contribution workflow is the part I’d love to learn more about.",
      },
      {
        author: "Ananya Rao",
        initials: "AR",
        time: "27m ago",
        text: "The examples make this feel approachable even for teams starting from scratch.",
      },
      {
        author: "Aarav Singh",
        initials: "AS",
        time: "13m ago",
        text: "Thanks! We learned a lot by documenting the small decisions, not only the final components.",
      },
    ],
    color: "bg-cyan-500",
    visualLabel: "ONE LANGUAGE / MANY PRODUCTS",
  },
  {
    id: "inclusive-learning",
    kind: "showcase",
    title: "Learning for everyone",
    label: "Case study · UX research",
    summary: "Making a learning platform feel more supportive for people with different needs.",
    body: [
      "This research-led redesign explored how learners with different access needs move through lessons, recover from interruptions, and ask for help.",
      "The new experience makes progress visible without pressure, adds flexible reading modes, and gives every lesson a clearer sense of next step.",
    ],
    metadata: [
      { label: "Created by", value: "Neha Kulkarni" },
      { label: "Role", value: "UX designer & researcher" },
      { label: "Tools", value: "Figma · Maze" },
      { label: "Likes", value: "74 likes" },
    ],
    comments: [
      {
        author: "Maya Joshi",
        initials: "MJ",
        time: "1h ago",
        text: "The recovery moments are such an important detail. They make the whole experience feel more considerate.",
      },
      {
        author: "Sachin Patil",
        initials: "SP",
        time: "45m ago",
        text: "I’m curious how you tested the reading modes with real learners.",
      },
      {
        author: "Neha Kulkarni",
        initials: "NK",
        time: "23m ago",
        text: "We used short moderated sessions and let people choose their own pace. It changed the prototype quite a bit.",
      },
    ],
    color: "bg-emerald-500",
    visualLabel: "LEARN / PAUSE / RETURN",
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

function KindIcon({ kind, size = 16 }: { kind: DetailKind; size?: number }) {
  if (kind === "thread") return <MessagesSquare size={size} />;
  if (kind === "event") return <CalendarDays size={size} />;
  return <Images size={size} />;
}

function ThreadsView({ onOpen }: { onOpen: (item: DetailData) => void }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <TabIntro
        eyebrow="Community conversations"
        title="Keep the good conversations going"
        description="Threads make it easy to follow a focused discussion without losing the flow of the main chat."
      />

      <div className="space-y-3">
        {STATIC_THREADS.map((thread) => (
          <button
            key={thread.id}
            type="button"
            onClick={() => onOpen(thread)}
            className="block w-full rounded-xl border border-border bg-surface/60 p-4 text-left transition-colors hover:border-foreground-subtle/40"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft font-body text-[11px] font-semibold text-accent">
                {thread.metadata[0].value
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-body text-sm font-semibold text-foreground">{thread.title}</h3>
                  <span className="rounded-full border border-border px-2 py-0.5 font-body text-[10px] text-foreground-muted">
                    {thread.metadata[1].value}
                  </span>
                </div>
                <p className="mt-1.5 font-body text-xs leading-relaxed text-foreground-muted">
                  {thread.summary}
                </p>
                <div className="mt-3 flex items-center gap-4 font-body text-[11px] text-foreground-subtle">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare size={12} />
                    {thread.metadata[2].value}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock3 size={12} />
                    Active {thread.metadata[3].value}
                  </span>
                </div>
              </div>
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" title="Active thread" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function EventsView({ onOpen }: { onOpen: (item: DetailData) => void }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <TabIntro
        eyebrow="Meet the community"
        title="Events worth showing up for"
        description="A quick look at what’s happening next. Save a spot and bring your latest work to share."
      />

      <div className="space-y-3">
        {STATIC_EVENTS.map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => onOpen(event)}
            className="flex w-full flex-col gap-4 rounded-xl border border-border bg-surface/60 p-4 text-left transition-colors hover:border-foreground-subtle/40 sm:flex-row sm:items-center"
          >
            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-surface-raised">
              <span className="font-body text-[10px] font-semibold tracking-wider text-foreground-muted">
                {event.metadata[0].value.split(" ")[1]?.replace(",", "") ?? "JUL"}
              </span>
              <span className="font-display text-2xl font-bold leading-none text-foreground">
                {event.metadata[0].value.split(" ")[0]}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-body text-sm font-semibold text-foreground">{event.title}</h3>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-body text-xs text-foreground-muted">
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={12} />
                  {event.metadata[0].value}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={12} />
                  {event.metadata[2].value}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 font-body text-xs text-foreground-subtle">
                <MapPin size={12} />
                {event.metadata[1].value}
              </p>
            </div>
            <span className={`shrink-0 rounded-lg px-4 py-2 font-body text-xs font-semibold text-white ${event.color}`}>
              View event
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ShowcaseView({ onOpen }: { onOpen: (item: DetailData) => void }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <TabIntro
        eyebrow="Work from the community"
        title="Ideas worth sharing"
        description="Browse the latest case studies, experiments, and systems created by people in this community."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {STATIC_SHOWCASES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpen(item)}
            className="overflow-hidden rounded-xl border border-border bg-surface/60 text-left transition-colors hover:border-foreground-subtle/40"
          >
            <div className={`relative flex h-36 items-end overflow-hidden p-4 ${item.color}`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.38),transparent_42%)]" />
              <div className="relative">
                <span className="font-body text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
                  {item.label.split(" · ")[0]}
                </span>
                <p className="mt-1 max-w-[14rem] font-display text-lg font-semibold leading-tight text-white">
                  {item.visualLabel}
                </p>
              </div>
            </div>
            <div className="p-4">
              <p className="font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
                {item.label}
              </p>
              <h3 className="mt-1.5 font-body text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1.5 line-clamp-2 font-body text-xs leading-relaxed text-foreground-muted">
                {item.summary}
              </p>
              <div className="mt-4 flex items-center justify-between font-body text-[11px] text-foreground-subtle">
                <span>{item.metadata[0].value}</span>
                <span>{item.metadata[3].value}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function DetailView({ item, onBack }: { item: DetailData; onBack: () => void }) {
  const [isInterested, setIsInterested] = useState(false);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 flex items-center gap-2 font-body text-xs font-medium text-foreground-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Back to {item.kind === "thread" ? "threads" : item.kind === "event" ? "events" : "showcase"}
      </button>

      <article>
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${item.color}`}>
            <KindIcon kind={item.kind} />
          </div>
          <div className="min-w-0">
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              {item.label}
            </p>
            <h2 className="mt-1.5 font-display text-2xl font-semibold text-foreground">{item.title}</h2>
            <p className="mt-2 font-body text-sm leading-relaxed text-foreground-muted">{item.summary}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {item.metadata.map((meta) => (
            <div key={meta.label} className="rounded-lg border border-border bg-surface/60 px-3 py-2">
              <p className="font-body text-[10px] uppercase tracking-wider text-foreground-subtle">{meta.label}</p>
              <p className="mt-0.5 font-body text-xs font-medium text-foreground">{meta.value}</p>
            </div>
          ))}
        </div>

        {item.kind === "showcase" && (
          <div className={`relative mt-6 flex h-44 items-end overflow-hidden rounded-xl p-6 ${item.color}`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.38),transparent_42%)]" />
            <div className="relative flex items-center gap-2 text-white">
              <Sparkles size={16} />
              <span className="font-display text-xl font-semibold">{item.visualLabel}</span>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface/40 p-5">
          {item.body.map((paragraph) => (
            <p key={paragraph} className="font-body text-sm leading-7 text-foreground-muted">
              {paragraph}
            </p>
          ))}
        </div>

        {item.kind === "event" && (
          <button
            type="button"
            onClick={() => setIsInterested((value) => !value)}
            className={`mt-4 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-body text-sm font-semibold transition-colors ${
              isInterested
                ? "border border-accent bg-accent-soft text-accent"
                : `${item.color} text-white hover:opacity-90`
            }`}
          >
            {isInterested && <CheckCircle2 size={15} />}
            {isInterested ? "You’re going" : "I’m interested"}
          </button>
        )}
      </article>

      <section className="mt-8 border-t border-border pt-6" aria-labelledby="demo-comments-heading">
        <div className="flex items-center justify-between">
          <div>
            <h3 id="demo-comments-heading" className="font-display text-base font-semibold text-foreground">
              Comments
            </h3>
            <p className="mt-1 font-body text-xs text-foreground-muted">
              A few thoughts from the community
            </p>
          </div>
          <span className="rounded-full bg-surface-raised px-2.5 py-1 font-body text-[11px] text-foreground-muted">
            {item.comments.length}
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {item.comments.map((comment) => (
            <article key={`${comment.author}-${comment.time}`} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft font-body text-[10px] font-semibold text-accent">
                {comment.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-body text-xs font-semibold text-foreground">{comment.author}</span>
                  <span className="font-body text-[11px] text-foreground-subtle">{comment.time}</span>
                </div>
                <p className="mt-1 font-body text-xs leading-relaxed text-foreground-muted">{comment.text}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-border bg-surface/40 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent font-body text-[10px] font-semibold text-white">
              SP
            </div>
            <span className="font-body text-xs font-medium text-foreground">Add your perspective</span>
          </div>
          <textarea
            aria-label="Write a comment"
            placeholder="Share a thought..."
            className="mt-3 min-h-20 w-full resize-none rounded-lg border border-border bg-surface-raised px-3 py-2 font-body text-xs text-foreground placeholder:text-foreground-subtle"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              className="rounded-lg bg-accent px-3 py-2 font-body text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Post comment
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function ChatTabContent({ tab }: { tab: Exclude<ChatTab, "chat"> }) {
  const [selectedItem, setSelectedItem] = useState<DetailData | null>(null);

  if (selectedItem) {
    return (
      <div className="absolute inset-0 overflow-y-auto">
        <DetailView item={selectedItem} onBack={() => setSelectedItem(null)} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto">
      {tab === "threads" && <ThreadsView onOpen={setSelectedItem} />}
      {tab === "events" && <EventsView onOpen={setSelectedItem} />}
      {tab === "showcase" && <ShowcaseView onOpen={setSelectedItem} />}
    </div>
  );
}