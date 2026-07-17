import { Eye, Heart } from "lucide-react";

const APP_NAME = "draft";

/** Corner-bracket decoration applied to cards */
function CornerBrackets({
  variant = "primary",
}: {
  variant?: "primary" | "signal";
}) {
  const color =
    variant === "signal" ? "border-signal" : "border-primary";
  return (
    <>
      <span
        className={`pointer-events-none absolute -left-2 -top-2 h-4 w-4 border-l-2 border-t-2 ${color}`}
        aria-hidden="true"
      />
      <span
        className={`pointer-events-none absolute -right-2 -top-2 h-4 w-4 border-r-2 border-t-2 ${color}`}
        aria-hidden="true"
      />
      <span
        className={`pointer-events-none absolute -bottom-2 -left-2 h-4 w-4 border-b-2 border-l-2 ${color}`}
        aria-hidden="true"
      />
      <span
        className={`pointer-events-none absolute -bottom-2 -right-2 h-4 w-4 border-b-2 border-r-2 ${color}`}
        aria-hidden="true"
      />
    </>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen bg-background">

      {/* ── Brand / canvas panel ─────────────────────────────────────── */}
      <section className="relative hidden w-[55%] flex-col justify-between overflow-hidden bg-overlay px-14 py-12 lg:flex">

        {/* Grid dot texture */}
        <div className="pointer-events-none absolute inset-0 grid-dots" aria-hidden="true" />

        {/* Radial vignette over the grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 30% 50%, transparent 30%, rgba(22,20,19,0.7) 100%)",
          }}
          aria-hidden="true"
        />

        {/* Orange accent glow */}
        <div
          className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #FF5E1F 0%, transparent 70%)" }}
          aria-hidden="true"
        />

        {/* Logo */}
        <div className="relative z-10">
          <span className="font-display text-xl font-semibold text-overlay-foreground">
            {APP_NAME}
            <span className="text-primary">/</span>
          </span>
        </div>

        {/* Designer profile card */}
        <div className="relative z-10 flex flex-1 items-center">
          <div className="relative w-[300px] -rotate-2 rounded-xl border border-overlay-elevated bg-overlay-raised p-4 shadow-xl">
            <CornerBrackets variant="signal" />

            {/* Card grid background */}
            <div className="pointer-events-none absolute inset-0 rounded-xl overflow-hidden grid-cross opacity-40" aria-hidden="true" />

            {/* Preview image area */}
            <div className="relative h-32 w-full overflow-hidden rounded-md bg-gradient-to-br from-primary to-orange-800">
              <div className="absolute inset-0 grid-lines opacity-30" />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft font-body text-xs font-semibold text-primary">
                JL
              </div>
              <div>
                <p className="font-body text-sm font-medium text-overlay-foreground">
                  Jordan Lee
                </p>
                <p className="font-mono text-[11px] text-overlay-muted">
                  Product Designer
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 font-mono text-[11px] text-overlay-muted">
              <span className="flex items-center gap-1">
                <Eye size={12} /> 2.4k
              </span>
              <span className="flex items-center gap-1">
                <Heart size={12} /> 312
              </span>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10 max-w-sm">
          <h1 className="font-display text-3xl font-semibold leading-tight text-overlay-foreground">
            Where design work finds its audience.
          </h1>
          <p className="mt-3 font-body text-sm text-overlay-muted">
            Portfolios, feedback, and real opportunities — for UI/UX,
            product, and social media designers.
          </p>
        </div>
      </section>

      {/* ── Login panel ──────────────────────────────────────────────── */}
      <section className="relative flex w-full flex-col items-center justify-center px-6 py-12 lg:w-[45%]">

        {/* Subtle grid background on login side */}
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-60" aria-hidden="true" />
        {/* Fade edges */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(255,255,255,0.92) 40%, rgba(255,255,255,1) 80%)",
          }}
          aria-hidden="true"
        />

        {/* Mobile logo */}
        <div className="relative z-10 mb-8 flex flex-col items-center gap-2 lg:hidden">
          <span className="font-display text-xl font-semibold text-foreground">
            {APP_NAME}
            <span className="text-primary">/</span>
          </span>
          <p className="font-body text-sm text-foreground-muted">
            For UI/UX, product &amp; social designers
          </p>
        </div>

        <div className="relative z-10 w-full max-w-sm">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-foreground-subtle">
            auth / login
          </p>

          {/* Card */}
          <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-8 shadow-card">
            <CornerBrackets />

            {/* Very faint grid inside card */}
            <div className="pointer-events-none absolute inset-0 grid-dots opacity-50" aria-hidden="true" />

            {/* Status badge */}
            <span className="absolute -top-3 right-6 z-10 flex items-center gap-1.5 rounded-full bg-overlay px-3 py-1 font-mono text-[10px] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              editing
            </span>

            <h2 className="relative font-display text-2xl font-semibold text-foreground">
              Welcome back
            </h2>
            <p className="relative mt-1 font-body text-sm text-foreground-muted">
              Log in to keep working on your portfolio.
            </p>

            <form className="relative mt-7 flex flex-col gap-5">
              <label className="flex flex-col gap-1.5">
                <span className="font-body text-xs font-medium text-foreground">
                  Email address
                </span>
                <input
                  type="email"
                  placeholder="you@studio.com"
                  className="rounded-md border border-input bg-background-subtle px-3.5 py-2.5 font-body text-sm text-foreground outline-none transition-colors placeholder:text-foreground-subtle focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-body text-xs font-medium text-foreground">
                    Password
                  </span>
                  <a
                    href="#"
                    className="font-body text-xs text-primary transition-colors hover:text-primary-hover"
                  >
                    Forgot password?
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="rounded-md border border-input bg-background-subtle px-3.5 py-2.5 font-body text-sm text-foreground outline-none transition-colors placeholder:text-foreground-subtle focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <button
                type="button"
                className="mt-1 rounded-md bg-primary py-2.5 font-body text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                Log in
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-foreground-subtle">
                or continue with
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            {/* Social auth */}
            <div className="relative flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-md border border-border bg-surface py-2.5 font-body text-sm text-foreground transition-colors hover:bg-secondary"
              >
                Google
              </button>
              <button
                type="button"
                className="flex-1 rounded-md border border-border bg-surface py-2.5 font-body text-sm text-foreground transition-colors hover:bg-secondary"
              >
                Apple
              </button>
            </div>
          </div>

          <p className="mt-6 text-center font-body text-sm text-foreground-muted">
            New to {APP_NAME}?{" "}
            <a
              href="#"
              className="font-medium text-primary transition-colors hover:text-primary-hover"
            >
              Create an account
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
