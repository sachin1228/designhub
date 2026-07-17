import Link from "next/link";
import { Eye, Heart } from "lucide-react";
import { APP_NAME } from "@draft/shared";

function CornerBrackets({ variant = "accent" }: { variant?: "accent" | "signal" }) {
  const color = variant === "signal" ? "border-signal" : "border-accent";
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
    <main className="flex min-h-screen bg-paper">
      {/* Brand / canvas panel */}
      <section className="relative hidden w-[55%] flex-col justify-between overflow-hidden bg-ink px-14 py-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10">
          <span className="font-display text-xl font-semibold text-white">
            {APP_NAME}
            <span className="text-accent">/</span>
          </span>
        </div>

        <div className="relative z-10 flex flex-1 items-center">
          <div className="relative w-[300px] -rotate-3 rounded-xl bg-ink-soft p-4 shadow-2xl">
            <CornerBrackets variant="signal" />
            <div className="h-32 w-full rounded-md bg-gradient-to-br from-accent to-signal/40" />
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft font-body text-xs font-semibold text-accent">
                JL
              </div>
              <div>
                <p className="font-body text-sm font-medium text-white">
                  Jordan Lee
                </p>
                <p className="font-mono text-[11px] text-muted-dark">
                  Product Designer
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 font-mono text-[11px] text-muted-dark">
              <span className="flex items-center gap-1">
                <Eye size={12} /> 2.4k
              </span>
              <span className="flex items-center gap-1">
                <Heart size={12} /> 312
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-sm">
          <h1 className="font-display text-3xl font-semibold leading-tight text-white">
            Where design work finds its audience.
          </h1>
          <p className="mt-3 font-body text-sm text-muted-dark">
            Portfolios, feedback, and real opportunities — for UI/UX,
            product, and social media designers.
          </p>
        </div>
      </section>

      {/* Login panel */}
      <section className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-[45%]">
        <div className="mb-8 flex flex-col items-center gap-2 lg:hidden">
          <span className="font-display text-xl font-semibold text-ink">
            {APP_NAME}
            <span className="text-accent">/</span>
          </span>
          <p className="font-body text-sm text-muted">
            For UI/UX, product &amp; social designers
          </p>
        </div>

        <div className="w-full max-w-sm">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted">
            auth / login
          </p>

          <div className="relative rounded-2xl border border-hairline bg-white p-8 shadow-sm">
            <CornerBrackets />
            <span className="absolute -top-3 right-6 flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 font-mono text-[10px] text-signal">
              <span className="h-1.5 w-1.5 rounded-full bg-signal" />
              editing
            </span>

            <h2 className="font-display text-2xl font-semibold text-ink">
              Welcome back
            </h2>
            <p className="mt-1 font-body text-sm text-muted">
              Log in to keep working on your portfolio.
            </p>

            <form className="mt-7 flex flex-col gap-5">
              <label className="flex flex-col gap-1.5">
                <span className="font-body text-xs font-medium text-ink">
                  Email address
                </span>
                <input
                  type="email"
                  placeholder="you@studio.com"
                  className="rounded-lg border border-hairline bg-paper px-3.5 py-2.5 font-body text-sm text-ink outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-body text-xs font-medium text-ink">
                    Password
                  </span>
                  <Link
                    href="#"
                    className="font-body text-xs text-accent hover:text-accent-hover"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="rounded-lg border border-hairline bg-paper px-3.5 py-2.5 font-body text-sm text-ink outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>

              <button
                type="button"
                className="mt-1 rounded-lg bg-accent py-2.5 font-body text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Log in
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-hairline" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                or continue with
              </span>
              <span className="h-px flex-1 bg-hairline" />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-lg border border-hairline py-2.5 font-body text-sm text-ink transition-colors hover:bg-paper"
              >
                Google
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg border border-hairline py-2.5 font-body text-sm text-ink transition-colors hover:bg-paper"
              >
                Apple
              </button>
            </div>
          </div>

          <p className="mt-5 text-right font-mono text-[10px] text-muted">
            400 × 560
          </p>

          <p className="mt-6 text-center font-body text-sm text-muted">
            New to {APP_NAME}?{" "}
            <Link
              href="#"
              className="font-medium text-accent hover:text-accent-hover"
            >
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
