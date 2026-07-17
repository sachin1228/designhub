import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@draft/shared";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="font-display text-2xl font-semibold text-ink">
        {APP_NAME}
        <span className="text-accent">/</span>
      </span>
      <p className="max-w-md font-body text-muted">{APP_TAGLINE}</p>
      <Link
        href="/login"
        className="rounded-full bg-accent px-6 py-3 font-body text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Go to login
      </Link>
    </main>
  );
}
