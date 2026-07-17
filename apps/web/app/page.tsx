import Link from "next/link";
import { APP_NAME } from "@draft/shared";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background-root)] px-4">
      <div className="w-full max-w-sm">

        {/* Wordmark */}
        <div className="mb-8 text-center">
          <span className="font-display text-2xl font-semibold text-[var(--foreground-default)] tracking-tight">
            {APP_NAME}
            <span className="text-[var(--accent-primary-default)]">/</span>
          </span>
        </div>

        {/* Card — Replit shadow-2 with inset top-edge highlight */}
        <div
          className="rounded-xl bg-[var(--background-default)] px-8 py-8"
          style={{
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "var(--shadow-2)",
          }}
        >
          <h2 className="font-display text-[1.125rem] font-semibold text-[var(--foreground-default)] leading-snug">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-[var(--foreground-dimmer)]">
            Log in to keep working on your portfolio.
          </p>

          <form className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[var(--foreground-default)]">
                Email address
              </span>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@studio.com"
                className="rounded-lg px-3.5 py-2.5 text-sm text-[var(--foreground-default)] outline-none transition-all
                           placeholder:text-[var(--foreground-dimmest)]
                           focus:ring-2 focus:ring-[var(--accent-primary-default)]/30 focus:border-[var(--accent-primary-default)]/60"
                style={{
                  background: "var(--background-higher)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--foreground-default)]">
                  Password
                </span>
                <Link
                  href="#"
                  className="text-xs text-[var(--accent-primary-default)] hover:text-[var(--accent-primary-stronger)] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="rounded-lg px-3.5 py-2.5 text-sm text-[var(--foreground-default)] outline-none transition-all
                           placeholder:text-[var(--foreground-dimmest)]
                           focus:ring-2 focus:ring-[var(--accent-primary-default)]/30 focus:border-[var(--accent-primary-default)]/60"
                style={{
                  background: "var(--background-higher)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              />
            </label>

            <button
              type="button"
              className="mt-1 rounded-lg py-2.5 text-sm font-medium transition-colors"
              style={{
                background: "var(--accent-primary-default)",
                color: "var(--accent-primary-foreground)",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--accent-primary-stronger)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--accent-primary-default)")}
            >
              Log in
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--foreground-dimmest)]">
              or continue with
            </span>
            <span className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>

          <div className="flex gap-3">
            {["Google", "Apple"].map(provider => (
              <button
                key={provider}
                type="button"
                className="flex-1 rounded-lg py-2.5 text-sm text-[var(--foreground-default)] transition-colors"
                style={{
                  background: "var(--background-higher)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                {provider}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-[var(--foreground-dimmer)]">
          New to {APP_NAME}?{" "}
          <Link
            href="#"
            className="font-medium text-[var(--accent-primary-default)] hover:text-[var(--accent-primary-stronger)] transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
