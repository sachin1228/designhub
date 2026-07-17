import Link from "next/link";
import { APP_NAME } from "@draft/shared";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="font-display text-2xl font-semibold text-foreground">
            {APP_NAME}
            <span className="text-accent">/</span>
          </span>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-surface p-8 shadow-card">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Welcome back
          </h2>
          <p className="mt-1 font-body text-sm text-foreground-muted">
            Log in to keep working on your portfolio.
          </p>

          <form className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-body text-xs font-medium text-foreground">
                Email address
              </span>
              <input
                type="email"
                placeholder="you@studio.com"
                className="rounded-lg border border-border-subtle bg-background px-3.5 py-2.5 font-body text-sm text-foreground outline-none transition-colors placeholder:text-foreground-subtle focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-body text-xs font-medium text-foreground">
                  Password
                </span>
                <Link
                  href="#"
                  className="font-body text-xs text-accent transition-colors hover:text-accent-hover"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className="rounded-lg border border-border-subtle bg-background px-3.5 py-2.5 font-body text-sm text-foreground outline-none transition-colors placeholder:text-foreground-subtle focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <button
              type="button"
              className="mt-1 rounded-lg bg-accent py-2.5 font-body text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
            >
              Log in
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border-subtle" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-foreground-subtle">
              or continue with
            </span>
            <span className="h-px flex-1 bg-border-subtle" />
          </div>

          {/* Social auth */}
          <div className="flex gap-3">
            <button
              type="button"
              className="flex-1 rounded-lg border border-border-subtle bg-background py-2.5 font-body text-sm text-foreground transition-colors hover:bg-surface-raised"
            >
              Google
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg border border-border-subtle bg-background py-2.5 font-body text-sm text-foreground transition-colors hover:bg-surface-raised"
            >
              Apple
            </button>
          </div>
        </div>

        <p className="mt-5 text-center font-body text-sm text-foreground-muted">
          New to {APP_NAME}?{" "}
          <Link
            href="#"
            className="font-medium text-accent transition-colors hover:text-accent-hover"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
