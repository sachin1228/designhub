import { APP_NAME } from "@/lib/constants";

/* Replit-matched input style */
const inputBase: React.CSSProperties = {
  display: "block",
  width: "100%",
  background: "var(--d-bg-higher)",
  border: "1px solid rgba(255, 255, 255, 0.10)",
  borderRadius: "6px",
  padding: "7px 10px",
  fontSize: "14px",
  lineHeight: "20px",
  color: "var(--d-fg-default)",
  outline: "none",
  transition: "border-color 120ms ease, box-shadow 120ms ease",
};

function ReplitInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={inputBase}
      onFocus={e => {
        e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.70)";
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.15)";
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[360px]">

        {/* Wordmark */}
        <div className="mb-7 text-center">
          <span className="text-2xl font-semibold tracking-tight text-foreground">
            {APP_NAME}
            <span style={{ color: "var(--d-accent)" }}>/</span>
          </span>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--d-bg-default)",
            border: "1px solid rgba(255, 255, 255, 0.10)",
            borderRadius: "8px",
            boxShadow: "var(--d-shadow-2)",
            padding: "24px",
          }}
        >
          <h2 className="text-[22px] font-semibold leading-snug text-foreground">
            Welcome back
          </h2>
          <p className="mt-1 text-[13px] text-foreground-muted">
            Log in to keep working on your portfolio.
          </p>

          <form className="mt-5 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-[12px] font-medium text-foreground">
                Email address
              </label>
              <ReplitInput
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@studio.com"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-[12px] font-medium text-foreground">
                  Password
                </label>
                <a
                  href="#"
                  className="text-[12px] transition-colors"
                  style={{ color: "var(--d-accent)" }}
                >
                  Forgot password?
                </a>
              </div>
              <ReplitInput
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            <button
              type="button"
              className="mt-0.5 w-full py-[7px] text-[14px] font-medium transition-colors"
              style={{
                background: "var(--d-accent)",
                color: "var(--d-accent-foreground)",
                borderRadius: "6px",
                border: "none",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--d-accent-hover)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--d-accent)")}
            >
              Log in
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
            <span
              className="text-[11px] uppercase tracking-widest"
              style={{ fontFamily: "var(--font-mono)", color: "var(--d-fg-dimmest)" }}
            >
              or continue with
            </span>
            <span className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>

          <div className="flex gap-2">
            {["Google", "Apple"].map(provider => (
              <button
                key={provider}
                type="button"
                className="flex-1 py-[7px] text-[13px] text-foreground transition-colors"
                style={{
                  background: "var(--d-bg-higher)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: "6px",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--d-bg-highest)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--d-bg-higher)")}
              >
                {provider}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-center text-[13px] text-foreground-muted">
          New to {APP_NAME}?{" "}
          <a
            href="#"
            className="font-medium transition-colors"
            style={{ color: "var(--d-accent)" }}
          >
            Create an account
          </a>
        </p>
      </div>
    </main>
  );
}
