import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { APP_NAME } from "@draft/shared";
import { LogoutButton } from "@/app/admin/(protected)/LogoutButton";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-overlay text-overlay-foreground">
      {/* Top nav */}
      <nav className="border-b border-overlay-elevated bg-overlay-raised px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="font-display text-base font-semibold text-overlay-foreground">
            {APP_NAME}
            <span className="text-accent mx-1">/</span>
            <span className="text-overlay-muted font-body text-sm font-normal">admin</span>
          </span>

          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/admin"
              className="rounded-md px-3 py-1.5 font-body text-sm text-overlay-muted hover:text-overlay-foreground hover:bg-overlay-elevated transition-colors"
            >
              Applications
            </Link>
            <Link
              href="/admin/companies"
              className="rounded-md px-3 py-1.5 font-body text-sm text-overlay-muted hover:text-overlay-foreground hover:bg-overlay-elevated transition-colors"
            >
              Companies
            </Link>
            <Link
              href="/admin/cities"
              className="rounded-md px-3 py-1.5 font-body text-sm text-overlay-muted hover:text-overlay-foreground hover:bg-overlay-elevated transition-colors"
            >
              Cities
            </Link>
            <Link
              href="/admin/sectors"
              className="rounded-md px-3 py-1.5 font-body text-sm text-overlay-muted hover:text-overlay-foreground hover:bg-overlay-elevated transition-colors"
            >
              Design Sectors
            </Link>
          </div>
        </div>

        <LogoutButton />
      </nav>

      <main className="px-6 py-8 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
