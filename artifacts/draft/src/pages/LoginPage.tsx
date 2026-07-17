import { APP_NAME } from "@/lib/constants";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">

        {/* Wordmark */}
        <div className="mb-8 text-center">
          <span className="font-display text-2xl font-semibold text-foreground tracking-tight">
            {APP_NAME}
            <span className="text-accent">/</span>
          </span>
        </div>

        {/* Card — Replit shadow-2 with inset top-edge highlight */}
        <div
          className="rounded-xl bg-surface px-8 py-8"
          style={{
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow:
              "0px 8px 32px rgba(0,0,0,0.40), 0px 1px 0px rgba(255,255,255,0.04) inset",
          }}
        >
          <h2 className="font-display text-[1.125rem] font-semibold text-foreground leading-snug">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">
            Log in to keep working on your portfolio.
          </p>

          <form className="mt-6 flex flex-col gap-4">
            {/* Email */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-foreground">
                Email address
              </span>
              <input
                type="email"
                placeholder="you@studio.com"
                className="rounded-lg px-3.5 py-2.5 text-sm text-foreground outline-none transition-all"
                style={{
                  background: "var(--d-bg-higher)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = "rgba(59,130,246,0.6)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)";
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </label>

            {/* Password */}
            <label className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">
                  Password
                </span>
                <a
                  href="#"
                  className="text-xs text-accent transition-colors hover:text-accent-hover"
                >
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className="rounded-lg px-3.5 py-2.5 text-sm text-foreground outline-none transition-all"
                style={{
                  background: "var(--d-bg-higher)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = "rgba(59,130,246,0.6)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)";
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </label>

            {/* Primary CTA */}
            <button
              type="button"
              className="mt-1 rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
            >
              Log in
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
            <span className="font-mono text-[10px] uppercase tracking-widest text-foreground-subtle">
              or continue with
            </span>
            <span className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* OAuth buttons */}
          <div className="flex gap-3">
            {["Google", "Apple"].map(provider => (
              <button
                key={provider}
                type="button"
                className="flex-1 rounded-lg py-2.5 text-sm text-foreground transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.10)", background: "var(--d-bg-higher)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--d-bg-highest)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--d-bg-higher)")}
              >
                {provider}
              </button>
            ))}
          </div>
        </div>

        {/* Sign-up link */}
        <p className="mt-5 text-center text-sm text-foreground-muted">
          New to {APP_NAME}?{" "}
          <a
            href="#"
            className="font-medium text-accent transition-colors hover:text-accent-hover"
          >
            Create an account
          </a>
        </p>
      </div>
    </main>
  );
}
