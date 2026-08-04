import Link from "next/link";
import {
  MessageSquare,
  BookOpen,
  Calendar,
  Globe,
  UserCheck,
  Lock,
  Layers,
  Target,
  Bot,
  Palette,
  MapPin,
  Sparkles,
} from "lucide-react";
import { APP_NAME } from "@draft/shared";
import type { LucideIcon } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────
   Palette constants — drawn directly from the design system blue scale
   blue[100]=#000b1f  blue[200]=#00254d  blue[300]=#003c85
   blue[400]=#0057b7  blue[500]=#006bdb  blue[600]=#0070F3  (PRIMARY)
   blue[700]=#52a8ff  blue[800]=#adcfff  blue[900]=#d9ecff
   blue[1000]=#f0f8ff (accent-soft)
───────────────────────────────────────────────────────────────────── */

/* ─── Three-tone icon style system ─────────────────────────────── */
// soft  = light blue tint (accent-soft)
// slate = cool neutral gray
// navy  = deep navy with light blue icon
type IconTone = "soft" | "slate" | "navy";

function iconStyle(tone: IconTone): { wrapper: string; icon: string } {
  switch (tone) {
    case "soft":  return { wrapper: "bg-[#f0f8ff]",  icon: "text-[#0057b7]" };
    case "slate": return { wrapper: "bg-[#EAEAEA]",  icon: "text-[#404040]" };
    case "navy":  return { wrapper: "bg-[#000b1f]",  icon: "text-[#52a8ff]" };
  }
}

const ICON_TONES: IconTone[] = ["soft", "slate", "navy"];

/* ─── Corner brackets ───────────────────────────────────────────── */
function CornerBrackets({
  variant = "accent",
  size = "sm",
}: {
  variant?: "accent" | "signal" | "muted" | "light";
  size?: "sm" | "md";
}) {
  const color =
    variant === "signal" ? "border-signal"
    : variant === "muted" ? "border-border"
    : variant === "light" ? "border-[#52a8ff]"
    : "border-accent";
  const tl = size === "md" ? "-left-3 -top-3 h-5 w-5" : "-left-2 -top-2 h-4 w-4";
  const tr = size === "md" ? "-right-3 -top-3 h-5 w-5" : "-right-2 -top-2 h-4 w-4";
  const bl = size === "md" ? "-bottom-3 -left-3 h-5 w-5" : "-bottom-2 -left-2 h-4 w-4";
  const br = size === "md" ? "-bottom-3 -right-3 h-5 w-5" : "-bottom-2 -right-2 h-4 w-4";
  return (
    <>
      <span className={`pointer-events-none absolute ${tl} border-l-2 border-t-2 ${color}`} aria-hidden="true" />
      <span className={`pointer-events-none absolute ${tr} border-r-2 border-t-2 ${color}`} aria-hidden="true" />
      <span className={`pointer-events-none absolute ${bl} border-b-2 border-l-2 ${color}`} aria-hidden="true" />
      <span className={`pointer-events-none absolute ${br} border-b-2 border-r-2 ${color}`} aria-hidden="true" />
    </>
  );
}

/* ─── Avatar seeds ───────────────────────────────────────────────── */
const AVATAR_SEEDS = ["Sunny", "Mila", "Theo", "Priya", "Juno", "Kai"];
const HAPPY_PARAMS =
  "mouth[]=smile&mouth[]=twinkle&eyes[]=happy&eyes[]=wink&backgroundColor=transparent";

/* ─── Data ───────────────────────────────────────────────────────── */
const FEATURES: { Icon: LucideIcon; title: string; body: string }[] = [
  {
    Icon: MessageSquare,
    title: "Real-time communities",
    body: "Jump into focused design communities — Design Systems, Motion, AI Tools, local city groups, and more. Real conversations, not broadcast feeds.",
  },
  {
    Icon: BookOpen,
    title: "Threads & resources",
    body: "Share articles, Figma files, case studies. Ask for feedback. Get actual answers from people who've shipped the same kind of work.",
  },
  {
    Icon: Calendar,
    title: "Events & meetups",
    body: "Stay plugged into design events around you — IRL meetups, online workshops, critique sessions — all surfaced inside your communities.",
  },
  {
    Icon: Globe,
    title: "Global & local",
    body: "City-based rooms alongside global ones. Find your Bangalore product design crew or the worldwide Figma nerds — your call.",
  },
  {
    Icon: UserCheck,
    title: "Curated membership",
    body: "Applications are reviewed manually. That keeps the signal high and the noise low. Everyone in drafthub is actually a designer.",
  },
  {
    Icon: Lock,
    title: "No algorithm",
    body: "No engagement bait. No ranking. Just the communities you join and the people in them — in reverse-chronological order, like it should be.",
  },
];

const COMMUNITIES: { name: string; Icon: LucideIcon; members: number; city: string; tags: string[] }[] = [
  { name: "Design Systems",       Icon: Layers,   members: 24, city: "Global",    tags: ["Figma", "Tokens"]          },
  { name: "Product Designers",    Icon: Target,   members: 41, city: "Bangalore", tags: ["UX", "Strategy"]           },
  { name: "AI & ML Community",    Icon: Bot,      members: 18, city: "Global",    tags: ["Generative", "Tools"]      },
  { name: "Visual Design",        Icon: Palette,  members: 33, city: "Mumbai",    tags: ["Brand", "Illustration"]    },
  { name: "Hyderabad Designers",  Icon: MapPin,   members: 15, city: "Hyderabad", tags: ["Local", "Networking"]      },
  { name: "Motion & Interaction", Icon: Sparkles, members: 22, city: "Global",    tags: ["Animation", "Prototyping"] },
];

// Tag tone: alternate between blue-soft and neutral-gray
const TAG_TONES = [
  { bg: "bg-[#f0f8ff]", text: "text-[#0057b7]" },
  { bg: "bg-[#EAEAEA]", text: "text-[#525252]" },
];

// Step number palette — each step a different blue-scale depth
const STEP_STYLES = [
  { bg: "bg-[#f0f8ff]",  text: "text-[#0057b7]", border: "border-[#d9ecff]" },  // light blue
  { bg: "bg-[#003c85]",  text: "text-[#adcfff]", border: "border-[#0057b7]" },  // mid navy
  { bg: "bg-[#EAEAEA]",  text: "text-[#262626]", border: "border-[#E0E0E0]" },  // neutral
];

const STEPS = [
  { n: "01", title: "Apply",         body: "Fill in a short form — your name, portfolio, and what kind of design work you do. We review every application by hand." },
  { n: "02", title: "Get invited",   body: "If you're a good fit, you'll receive an invite link by email. No algorithm, no waiting list numbers — just a real review." },
  { n: "03", title: "Join & connect", body: "Complete your profile, choose your communities, and start connecting with designers who care about the craft." },
];

/* ─── Page ───────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-sm md:px-10">
        <Link href="/" className="flex items-center font-display text-base font-semibold text-foreground">
          {APP_NAME}
          <span className="text-accent mx-0.5">/</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-md px-3.5 py-1.5 font-body text-sm text-foreground-muted transition-colors hover:text-foreground"
          >
            Log in
          </Link>
          <Link
            href="/apply"
            className="rounded-md bg-accent px-3.5 py-1.5 font-body text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Apply to join
          </Link>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20 md:px-10 md:pt-28">
        <div className="pointer-events-none absolute inset-0 grid-dots opacity-60" aria-hidden="true" />
        {/* Soft blue glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[900px]"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,112,243,0.10) 0%, transparent 70%)" }}
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Eyebrow — neutral pill, not blue */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0070F3]" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-foreground-muted">
              Designer community · Invite only
            </span>
          </div>

          <h1
            className="font-display text-4xl font-semibold leading-tight text-foreground md:text-6xl"
            style={{ letterSpacing: "-0.03em" }}
          >
            Where designers{" "}
            <span className="text-accent">connect</span>,{" "}
            share<span className="text-foreground-muted">,</span>{" "}
            and grow.
          </h1>

          <p className="mx-auto mt-6 max-w-xl font-body text-base leading-relaxed text-foreground-muted md:text-lg">
            Showcase your work, get meaningful feedback, join communities, and discover real
            opportunities — built for UI/UX, product, and visual designers.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/apply"
              className="relative inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 font-body text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-hover"
            >
              <CornerBrackets variant="signal" />
              Apply to join
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-80">
                <path d="M2.5 7h9M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-6 py-3 font-body text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-surface-raised"
            >
              Already a member? Log in
            </Link>
          </div>
        </div>

        {/* Avatar cluster card */}
        <div className="relative z-10 mx-auto mt-16 max-w-lg">
          <div className="relative rounded-xl border border-border bg-surface p-4 shadow-md">
            <CornerBrackets variant="accent" size="md" />
            {/* Avatar strip — deep navy gradient from blue scale */}
            <div
              className="relative h-36 overflow-hidden rounded-lg"
              style={{ background: "linear-gradient(135deg, #003c85 0%, #000b1f 100%)" }}
            >
              <div className="pointer-events-none absolute inset-0 grid-dots opacity-20" aria-hidden="true" />
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-0.5 px-4">
                {AVATAR_SEEDS.map((seed) => (
                  <img
                    key={seed}
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&${HAPPY_PARAMS}`}
                    className="h-16 w-16 flex-shrink-0 last:h-14 last:w-14 [&:nth-child(3)]:h-24 [&:nth-child(3)]:w-24 [&:nth-child(2)]:h-20 [&:nth-child(2)]:w-20 [&:nth-child(4)]:h-20 [&:nth-child(4)]:w-20"
                    alt=""
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
            {/* Card footer */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {["Sunny", "Mila", "Theo"].map((s) => (
                    <img
                      key={s}
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s}&${HAPPY_PARAMS}&backgroundColor=b6e3f4`}
                      className="h-6 w-6 rounded-full ring-2 ring-surface"
                      alt=""
                    />
                  ))}
                </div>
                <span className="font-body text-xs text-foreground-muted">+120 designers</span>
              </div>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-foreground-subtle">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                12 online
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats — deep navy band ───────────────────────────────── */}
      <section style={{ background: "linear-gradient(90deg, #000b1f 0%, #003c85 50%, #000b1f 100%)" }}>
        <div className="mx-auto grid max-w-4xl grid-cols-3">
          {[
            { value: "150+", label: "Designers" },
            { value: "20+",  label: "Communities" },
            { value: "12+",  label: "Cities" },
          ].map(({ value, label }, i) => (
            <div
              key={label}
              className="flex flex-col items-center py-10"
              style={{ borderRight: i < 2 ? "1px solid rgba(82,168,255,0.15)" : undefined }}
            >
              <span
                className="font-display text-3xl font-semibold"
                style={{ color: "#adcfff", letterSpacing: "-0.03em" }}
              >
                {value}
              </span>
              <span className="mt-1 font-body text-xs" style={{ color: "#52a8ff" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ───────────────────────────────────────── */}
      <section className="relative px-6 py-24 md:px-10">
        <div className="pointer-events-none absolute inset-0 grid-dots opacity-30" aria-hidden="true" />

        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <span className="font-mono text-[11px] uppercase tracking-widest text-foreground-subtle">
              What you get
            </span>
            <h2
              className="mt-3 font-display text-3xl font-semibold text-foreground"
              style={{ letterSpacing: "-0.025em" }}
            >
              Built around how designers{" "}
              <span className="text-accent">actually work</span>
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ Icon, title, body }, i) => {
              const tone = ICON_TONES[i % 3];
              const { wrapper, icon } = iconStyle(tone);
              return (
                <div
                  key={title}
                  className="relative rounded-xl bg-surface p-6"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${wrapper} shadow-xs`}>
                    <Icon size={18} className={icon} />
                  </div>
                  <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-foreground-muted">{body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PRODUCT SPOTLIGHTS  (single column: text then screenshot)
      ══════════════════════════════════════════════════════════ */}

      {/* ── Spotlight 1: Threads & discussions ──────────────────── */}
      <section className="border-t border-border px-6 py-20 md:px-10">
        <div className="mx-auto max-w-3xl">
          <span className="font-mono text-[11px] uppercase tracking-widest text-foreground-subtle">
            Discussions
          </span>
          <h2 className="mt-3 font-display text-2xl font-semibold text-foreground" style={{ letterSpacing: "-0.025em" }}>
            Ask questions, share ideas,{" "}
            <span className="text-accent">get real answers</span>
          </h2>
          <p className="mt-4 font-body text-sm leading-relaxed text-foreground-muted">
            Post a question, drop an article, share a case study. Every thread lives inside
            a community so feedback comes from designers who actually do that kind of work.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {[
              { tone: "soft" as IconTone,  label: "Tag posts as Question, Article, or Resource" },
              { tone: "slate" as IconTone, label: "Upvote, comment, bookmark — no algorithmic ranking" },
              { tone: "soft" as IconTone,  label: "Link previews auto-generated from shared URLs" },
            ].map(({ tone, label }, i) => {
              const { wrapper, icon } = iconStyle(tone);
              return (
                <li key={i} className="flex items-start gap-3">
                  <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded ${wrapper}`}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={icon} />
                    </svg>
                  </span>
                  <span className="font-body text-sm text-foreground-muted">{label}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-10 overflow-hidden rounded-2xl border border-border shadow-lg">
            <img
              src="/screenshots/threads.png"
              alt="drafthub threads and discussions feed"
              className="w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── Spotlight 2: Real-time chat ──────────────────────────── */}
      <section className="border-t border-border bg-background-subtle px-6 py-20 md:px-10">
        <div className="mx-auto max-w-3xl">
          <span className="font-mono text-[11px] uppercase tracking-widest text-foreground-subtle">
            Real-time chat
          </span>
          <h2 className="mt-3 font-display text-2xl font-semibold text-foreground" style={{ letterSpacing: "-0.025em" }}>
            Communities that actually{" "}
            <span className="text-accent">talk to each other</span>
          </h2>
          <p className="mt-4 font-body text-sm leading-relaxed text-foreground-muted">
            Each community has a live chat room. Ask questions, share what you're working on,
            or just say hi. Conversations happen in real time, across cities and timezones.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {[
              { tone: "soft" as IconTone,  label: "Real-time messaging powered by Supabase Realtime" },
              { tone: "slate" as IconTone, label: "Member roles, badges, and verified company profiles" },
              { tone: "soft" as IconTone,  label: "Separate Chat, Threads, Events, and Resources tabs per community" },
            ].map(({ tone, label }, i) => {
              const { wrapper, icon } = iconStyle(tone);
              return (
                <li key={i} className="flex items-start gap-3">
                  <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded ${wrapper}`}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={icon} />
                    </svg>
                  </span>
                  <span className="font-body text-sm text-foreground-muted">{label}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-10 overflow-hidden rounded-2xl border border-border shadow-lg">
            <img
              src="/screenshots/chat.png"
              alt="drafthub real-time community chat"
              className="w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── Spotlight 3: Events ──────────────────────────────────── */}
      <section className="border-t border-border px-6 py-20 md:px-10">
        <div className="mx-auto max-w-3xl">
          <span className="font-mono text-[11px] uppercase tracking-widest text-foreground-subtle">
            Events
          </span>
          <h2 className="mt-3 font-display text-2xl font-semibold text-foreground" style={{ letterSpacing: "-0.025em" }}>
            IRL meetups, workshops,{" "}
            <span className="text-accent">and get-togethers</span>
          </h2>
          <p className="mt-4 font-body text-sm leading-relaxed text-foreground-muted">
            Each community has its own events calendar. Members can create, RSVP, and share
            design meetups — from Hyderabad UX nights to online Figma critique sessions.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {[
              { tone: "soft" as IconTone,  label: "RSVP directly inside the community" },
              { tone: "slate" as IconTone, label: "See who's going and how many are attending" },
              { tone: "soft" as IconTone,  label: "Upcoming events surfaced in the community sidebar" },
            ].map(({ tone, label }, i) => {
              const { wrapper, icon } = iconStyle(tone);
              return (
                <li key={i} className="flex items-start gap-3">
                  <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded ${wrapper}`}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={icon} />
                    </svg>
                  </span>
                  <span className="font-body text-sm text-foreground-muted">{label}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-10 overflow-hidden rounded-2xl border border-border shadow-lg">
            <img
              src="/screenshots/events.png"
              alt="drafthub community events"
              className="w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── Community preview ───────────────────────────────────── */}
      <section className="bg-background-subtle px-6 py-24 md:px-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-widest text-foreground-subtle">
                Inside drafthub
              </span>
              <h2
                className="mt-3 font-display text-2xl font-semibold text-foreground"
                style={{ letterSpacing: "-0.025em" }}
              >
                Find your community
              </h2>
            </div>
            <Link href="/apply" className="hidden font-body text-xs text-accent hover:text-accent-hover sm:block">
              See all →
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COMMUNITIES.map(({ name, Icon, members, city, tags }, i) => {
              const tone = ICON_TONES[i % 3];
              const { wrapper, icon } = iconStyle(tone);
              return (
                <div
                  key={name}
                  className="group relative flex flex-col gap-3 rounded-xl bg-surface p-4 transition-shadow hover:shadow-md"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${wrapper} shadow-xs`}>
                      <Icon size={18} className={icon} />
                    </div>
                    <div>
                      <p className="font-body text-sm font-medium text-foreground">{name}</p>
                      <p className="font-mono text-[10px] text-foreground-subtle">{members} members · {city}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag, ti) => {
                      const tt = TAG_TONES[(i + ti) % 2];
                      return (
                        <span
                          key={tag}
                          className={`rounded-full ${tt.bg} ${tt.text} px-2.5 py-0.5 font-mono text-[10px] font-medium shadow-xs`}
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section className="relative px-6 py-24 md:px-10">
        <div className="pointer-events-none absolute inset-0 grid-dots opacity-30" aria-hidden="true" />

        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <span className="font-mono text-[11px] uppercase tracking-widest text-foreground-subtle">
              The process
            </span>
            <h2
              className="mt-3 font-display text-2xl font-semibold text-foreground"
              style={{ letterSpacing: "-0.025em" }}
            >
              How to get in
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {STEPS.map(({ n, title, body }, i) => {
              const s = STEP_STYLES[i];
              return (
                <div key={n} className="flex flex-col gap-4">
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${s.border} ${s.bg} font-mono text-sm font-semibold ${s.text}`}
                  >
                    {n}
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
                    <p className="mt-2 font-body text-sm leading-relaxed text-foreground-muted">{body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonial ─────────────────────────────────────────── */}
      <section className="px-6 pb-24 md:px-10">
        <div className="mx-auto max-w-2xl">
          <div
            className="relative rounded-2xl bg-surface p-8 text-center"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <CornerBrackets variant="accent" size="md" />
            <p
              className="font-display text-lg font-medium leading-relaxed text-foreground"
              style={{ letterSpacing: "-0.01em" }}
            >
              "I've been working on a landing page for a productivity app. Users say it looks
              clean, but conversions are lower than expected. Brutal honesty is welcome."
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=sachin&${HAPPY_PARAMS}&backgroundColor=b6e3f4`}
                className="h-8 w-8 rounded-full ring-1 ring-border"
                alt=""
              />
              <div className="text-left">
                <p className="font-body text-sm font-medium text-foreground">Sachin Patil</p>
                <p className="font-mono text-[10px] text-foreground-subtle">Product Designer · Pune</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA — full deep navy block ───────────────────────────── */}
      <section
        className="relative overflow-hidden px-6 py-28 md:px-10"
        style={{ background: "linear-gradient(160deg, #000b1f 0%, #003c85 60%, #000b1f 100%)" }}
      >
        {/* Grid dots in navy */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(82,168,255,0.18) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
          aria-hidden="true"
        />
        {/* Subtle radial highlight */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,112,243,0.25) 0%, transparent 60%)" }}
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto max-w-xl text-center">
          <h2
            className="font-display text-3xl font-semibold md:text-4xl"
            style={{ color: "#EDEDED", letterSpacing: "-0.03em" }}
          >
            Ready to join?
          </h2>
          <p className="mx-auto mt-4 max-w-sm font-body text-sm leading-relaxed" style={{ color: "#52a8ff" }}>
            We review every application by hand. If you're a designer who cares about the
            craft, we'd love to have you.
          </p>

          <div className="mt-8">
            <Link
              href="/apply"
              className="relative inline-flex items-center gap-2 rounded-md bg-accent px-8 py-3.5 font-body text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-hover"
            >
              <CornerBrackets variant="light" />
              Apply for access
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-80">
                <path d="M2.5 7h9M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          <p className="mt-5 font-mono text-[11px] uppercase tracking-wider" style={{ color: "#adcfff", opacity: 0.6 }}>
            Free · Curated · No algorithm
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-border px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="flex items-center font-display text-sm font-semibold text-foreground-muted">
            {APP_NAME}
            <span className="text-accent mx-0.5">/</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/apply" className="font-body text-xs text-foreground-subtle transition-colors hover:text-foreground">
              Apply
            </Link>
            <Link href="/login" className="font-body text-xs text-foreground-subtle transition-colors hover:text-foreground">
              Log in
            </Link>
          </div>
          <p className="font-mono text-[10px] text-foreground-subtle">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
