import Link from "next/link";
import { ArrowLeft, Code2 } from "lucide-react";
import { APP_NAME } from "@draft/shared";

export default function ApplyPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="pointer-events-none fixed inset-0 grid-dots opacity-40" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-1.5 font-body text-sm text-foreground-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Back to login
        </Link>

        <p className="mb-1 font-display text-xl font-semibold text-foreground">
          {APP_NAME}<span className="text-accent mx-1">/</span>
        </p>

        <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Code2 size={22} />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Join the developer community
          </h1>
          <p className="mt-2 font-body text-sm leading-relaxed text-foreground-muted">
            {APP_NAME} is open to developers at every level. Create your account,
            share what you&apos;re building, and connect with people across the stack.
          </p>
          <Link
            href="/signup"
            className="mt-7 flex items-center justify-center rounded-md bg-accent py-2.5 font-body text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            Create your account →
          </Link>
        </div>

        <p className="mt-6 text-center font-body text-sm text-foreground-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}