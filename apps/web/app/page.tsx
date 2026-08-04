import Link from "next/link";
import { APP_NAME } from "@draft/shared";

/* ─── Reusable corner brackets ─────────────────────────────────── */
function CornerBrackets({
  variant = "accent",
  size = "sm",
}: {
  variant?: "accent" | "signal" | "muted";
  size?: "sm" | "md";
}) {
  const color =
    variant === "signal"
      ? "border-signal"
      : variant === "muted"
      ? "border-border"
      : "border-accent";
  const inset = size === "md" ? "-left-3 -top-3 h-5 w-5" : "-left-2 -top-2 h-4 w-4";
  const insetR = size === "md" ? "-right-3 -top-3 h-5 w-5" : "-right-2 -top-2 h-4 w-4";
  const insetBL = size === "md" ? "-bottom-3 -left-3 h-5 w-5" : "-bottom-2 -left-2 h-4 w-4";
  const insetBR = size === "md" ? "-bottom-3 -right-3 h-5 w-5" : "-bottom-2 -right-2 h-4 w-4";
  return (
    <>
      <span className={`pointer-events-none absolute ${inset} border-l-2 border-t-2 ${color}`} aria-hidden="true" />
      <span className={`pointer-events-none absolute ${insetR} border-r-2 border-t-2 ${color}`} aria-hidden="true" />
      <span className={`pointer-events-none absolute ${insetBL} border-b-2 border-l-2 ${color}`} aria-hidden="true" />
      <span className={`pointer-events-none absolute ${insetBR} border-b-2 border-r-2 ${color}`} aria-hidden="true" />
    </>
  );
}

/* ─── Floating avatar cluster (static) ─────────────────────────── */
const AVATAR_SEEDS = [
  { seed: "Sunny",  size: "h-16 w-16", offset: "bottom-0 left-[5%]" },
  { seed: "Mila",   size: "h-20 w-20", offset: "bottom-0 left-[18%]" },
  { seed: "Theo",   size: "h-24 w-24", offset: "bottom-0 left-[35%]" },
  { seed: "Priya",  size: "h-20 w-20", offset: "bottom-0 left-[55%]" },
  { seed: "Juno",   size: "h-16 w-16", offset: "bottom-0 left-[70%]" },
  { seed: "Kai",    size: "h-14 w-14", offset: "bottom-0 left-[83%]" },
];
const HAPPY_PARAMS =
  "mouth[]=smile&mouth[]=twinkle&eyes[]=happy&eyes[]=wink&backgroundColor=transparent";

/* ─── Sample community data ─────────────────────────────────────── */
const COMMUNITIES = [
  { name: "Design Systems",        emoji: "🧱", members: 24, city: "Global",    tags: ["Figma", "Tokens"]         },
  { name: "Product Designers",     emoji: "🎯", members: 41, city: "Bangalore", tags: ["UX", "Strategy"]          },
  { name: "AI & ML Community",     emoji: "🤖", members: 18, city: "Global",    tags: ["Generative", "Tools"]     },
  { name: "Visual Design",         emoji: "🎨", members: 33, city: "Mumbai",    tags: ["Brand", "Illustration"]   },
  { name: "Hyderabad Designers",   emoji: "🏙️", members: 15, city: "Hyderabad", tags: ["Local", "Networking"]     },
  { name: "Motion & Interaction",  emoji: "✨", members: 22, city: "Global",    tags: ["Animation", "Prototyping"] },
];

const STEPS = [
  {
    n: "01",
    title: "Apply",
    body: "Fill in a short form — your name, portfolio, and what kind of design work you do. We review every application by hand.",
  },
  {
    n: "02",
    title: "Get invited",
    body: "If you're a good fit, you'll receive an invite link by email. No algorithm, no waiting list numbers — just a real review.",
  },
  {
    n: "03",
    title: "Join & connect",
    body: "Complete your profile, choose your communities, and start connecting with designers who care about the craft.",
  },
];

const FEATURES = [
  {
    icon: "💬",
    title: "Real-time communities",
    body: "Jump into focused design communities — Design Systems, Motion, AI Tools, local city groups, and more. Real conversations, not broadcast feeds.",
  },
  {
    icon: "📌",
    title: "Threads & resources",
    body: "Share articles, Figma files, case studies. Ask for feedback. Get actual answers from people who've shipped the same kind of work.",
  },
  {
    icon: "📅",
    title: "Events & meetups",
    body: "Stay plugged into design events around you — IRL meetups, online workshops, critique sessions — all surfaced inside your communities.",
  },
  {
    icon: "🌐",
    title: "Global & local",
    body: "City-based rooms alongside global ones. Find your Bangalore product design crew or the worldwide Figma nerds — your call.",
  },
  {
    icon: "✅",
    title: "Curated membership",
    body: "Applications are reviewed manually. That keeps the signal high and the noise low. Everyone in drafthub is actually a designer.",
  },
  {
    icon: "🔒",
    title: "No algorithm",
    body: "No engagement bait. No ranking. Just the communities you join and the people in them — in reverse-chronological order, like it should be.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Nav ───────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-sm md:px-10">
        <Link href="/" className="flex items-center gap-0.5 font-display text-base font-semibold text-foreground">
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
            className="rounded-md bg-accent px-3.5 py-1.5 font-body text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            Apply to join
          </Link>
        </nav>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20 md:px-10 md:pt-28">
        <div className="pointer-events-none absolute inset-0 grid-dots opacity-60" aria-hidden="true" />

        {/* Glow blob */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[900px] rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse at 50% 0%, #0070F3 0%, transparent 70%)" }}
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Eyebrow pill */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-soft px-3.5 py-1.5 shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-accent">
              Designer community · Invite only
            </span>
          </div>

          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-6xl" style={{ letterSpacing: "-0.03em" }}>
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
              className="relative inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 font-body text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover"
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

            {/* Avatar strip */}
            <div className="relative h-36 overflow-hidden rounded-lg" style={{ background: "linear-gradient(135deg, #0057b7 0%, #000b1f 100%)" }}>
              <div className="pointer-events-none absolute inset-0 grid-dots opacity-20" aria-hidden="true" />
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-0.5 px-4">
                {AVATAR_SEEDS.map(({ seed, size, offset: _o }) => (
                  <img
                    key={seed}
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&${HAPPY_PARAMS}`}
                    className={`${size} flex-shrink-0`}
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
                <span className="font-body text-xs text-foreground-muted">
                  +120 designers
                </span>
              </div>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-foreground-subtle">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                12 online
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────── */}
      <section className="border-y border-border bg-surface-raised">
        <div className="mx-auto grid max-w-4xl grid-cols-3 divide-x divide-border">
          {[
            { value: "150+",  label: "Designers" },
            { value: "20+",   label: "Communities" },
            { value: "12+",   label: "Cities" },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center py-8">
              <span className="font-display text-3xl font-semibold text-foreground" style={{ letterSpacing: "-0.03em" }}>
                {value}
              </span>
              <span className="mt-1 font-body text-xs text-foreground-muted">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ─────────────────────────────────────────── */}
      <section className="relative px-6 py-24 md:px-10">
        <div className="pointer-events-none absolute inset-0 grid-dots opacity-30" aria-hidden="true" />

        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <span className="font-mono text-[11px] uppercase tracking-widest text-foreground-subtle">
              What you get
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold text-foreground" style={{ letterSpacing: "-0.025em" }}>
              Built around how designers{" "}
              <span className="text-accent">actually work</span>
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon, title, body }) => (
              <div
                key={title}
                className="relative rounded-xl bg-surface p-6 shadow-sm"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-xl shadow-xs">
                  {icon}
                </div>
                <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-foreground-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Community preview ─────────────────────────────────────── */}
      <section className="bg-background-subtle px-6 py-24 md:px-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-widest text-foreground-subtle">
                Inside drafthub
              </span>
              <h2 className="mt-3 font-display text-2xl font-semibold text-foreground" style={{ letterSpacing: "-0.025em" }}>
                Find your community
              </h2>
            </div>
            <Link href="/apply" className="hidden font-body text-xs text-accent hover:text-accent-hover sm:block">
              See all →
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COMMUNITIES.map(({ name, emoji, members, city, tags }) => (
              <div
                key={name}
                className="group relative flex flex-col gap-3 rounded-xl bg-surface p-4 transition-shadow hover:shadow-md"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                {/* Community icon */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-surface-raised text-lg shadow-xs">
                    {emoji}
                  </div>
                  <div>
                    <p className="font-body text-sm font-medium text-foreground">{name}</p>
                    <p className="font-mono text-[10px] text-foreground-subtle">{members} members · {city}</p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-accent-soft px-2.5 py-0.5 font-mono text-[10px] font-medium text-accent shadow-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <section className="relative px-6 py-24 md:px-10">
        <div className="pointer-events-none absolute inset-0 grid-dots opacity-30" aria-hidden="true" />

        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <span className="font-mono text-[11px] uppercase tracking-widest text-foreground-subtle">
              The process
            </span>
            <h2 className="mt-3 font-display text-2xl font-semibold text-foreground" style={{ letterSpacing: "-0.025em" }}>
              How to get in
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map(({ n, title, body }) => (
              <div key={n} className="relative flex flex-col gap-4">
                {/* Step number */}
                <div className="relative inline-block w-fit">
                  <span
                    className="relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface font-mono text-sm font-semibold text-accent"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    {n}
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-foreground-muted">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial / quote ───────────────────────────────────── */}
      <section className="px-6 pb-24 md:px-10">
        <div className="mx-auto max-w-2xl">
          <div
            className="relative rounded-2xl bg-surface p-8 text-center"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <CornerBrackets variant="accent" size="md" />
            <p className="font-display text-lg font-medium leading-relaxed text-foreground" style={{ letterSpacing: "-0.01em" }}>
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

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-24 md:px-10">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(0,112,243,0.12) 0%, transparent 70%)" }} aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 grid-dots opacity-40" aria-hidden="true" />

        <div className="relative z-10 mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl" style={{ letterSpacing: "-0.03em" }}>
            Ready to join?
          </h2>
          <p className="mx-auto mt-4 max-w-sm font-body text-sm leading-relaxed text-foreground-muted">
            We review every application by hand. If you're a designer who cares about the
            craft, we'd love to have you.
          </p>

          <div className="mt-8">
            <Link
              href="/apply"
              className="relative inline-flex items-center gap-2 rounded-md bg-accent px-8 py-3.5 font-body text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover"
            >
              <CornerBrackets variant="signal" />
              Apply for access
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-80">
                <path d="M2.5 7h9M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          <p className="mt-5 font-mono text-[11px] uppercase tracking-wider text-foreground-subtle">
            Free · Curated · No algorithm
          </p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-border px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="flex items-center gap-0.5 font-display text-sm font-semibold text-foreground-muted">
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
