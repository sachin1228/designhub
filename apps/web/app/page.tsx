import Link from "next/link";
import { APP_NAME } from "@draft/shared";

const inputBase = {
  display: "block",
  width: "100%",
  background: "var(--background-higher)",
  border: "1px solid rgba(255, 255, 255, 0.10)",
  borderRadius: "6px",
  padding: "7px 10px",
  fontSize: "14px",
  lineHeight: "20px",
  color: "var(--foreground-default)",
  outline: "none",
  transition: "border-color 120ms ease, box-shadow 120ms ease",
} as const;

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background-root)] px-4">
      <div className="w-full max-w-[360px]">

        {/* Wordmark */}
        <div className="mb-7 text-center">
          <span className="text-2xl font-semibold tracking-tight text-[var(--foreground-default)]">
            {APP_NAME}
            <span style={{ color: "var(--accent-primary-default)" }}>/</span>
          </span>
        </div>

        {/* Card — 8px radius, Replit shadow-2 */}
        <div style={{
          background: "var(--background-default)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "8px",
          boxShadow: "var(--shadow-2)",
          padding: "24px",
        }}>
          <h2 className="text-[22px] font-semibold leading-snug text-[var(--foreground-default)]">
            Welcome back
          </h2>
          <p className="mt-1 text-[13px] text-[var(--foreground-dimmer)]">
            Log in to keep working on your portfolio.
          </p>

          <form className="mt-5 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-[12px] font-medium text-[var(--foreground-default)]">
                Email address
              </label>
              <input id="email" type="email" autoComplete="email"
                placeholder="you@studio.com" style={inputBase} />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-[12px] font-medium text-[var(--foreground-default)]">
                  Password
                </label>
                <Link href="#" className="text-[12px]"
                  style={{ color: "var(--accent-primary-default)" }}>
                  Forgot password?
                </Link>
              </div>
              <input id="password" type="password" autoComplete="current-password"
                placeholder="••••••••" style={inputBase} />
            </div>

            <button type="button" className="mt-0.5 w-full py-[7px] text-[14px] font-medium"
              style={{
                background: "var(--accent-primary-default)",
                color: "var(--accent-primary-foreground)",
                borderRadius: "6px",
                border: "none",
              }}>
              Log in
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
            <span className="text-[11px] uppercase tracking-widest font-mono text-[var(--foreground-dimmest)]">
              or continue with
            </span>
            <span className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>

          <div className="flex gap-2">
            {["Google", "Apple"].map(p => (
              <button key={p} type="button"
                className="flex-1 py-[7px] text-[13px] text-[var(--foreground-default)]"
                style={{
                  background: "var(--background-higher)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: "6px",
                }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-center text-[13px] text-[var(--foreground-dimmer)]">
          New to {APP_NAME}?{" "}
          <Link href="#" className="font-medium"
            style={{ color: "var(--accent-primary-default)" }}>
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
