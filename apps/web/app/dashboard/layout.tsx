import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { APP_NAME } from "@draft/shared";
import { DashboardSidebar } from "@/app/dashboard/DashboardSidebar";
import { DashboardLogoutButton } from "@/app/dashboard/DashboardLogoutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "user") {
    redirect("/login");
  }

  const initial = (session.email ?? "?").charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Compact icon sidebar — full height, left edge */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-16 flex-col items-center border-r border-border bg-surface">
        {/* Brand dot */}
        <div className="flex h-[57px] w-full shrink-0 items-center justify-center border-b border-border">
          <div className="h-7 w-7 rounded-lg bg-accent/20 flex items-center justify-center">
            <span className="font-display text-xs font-bold text-accent">
              {APP_NAME.charAt(0)}
            </span>
          </div>
        </div>

        {/* Nav icons */}
        <div className="flex-1 overflow-y-auto w-full py-2">
          <DashboardSidebar />
        </div>
      </aside>

      {/* Everything to the right of the sidebar */}
      <div className="ml-16 flex flex-1 flex-col min-h-screen">
        {/* Topbar — starts after sidebar */}
        <header className="sticky top-0 z-10 flex h-[57px] items-center justify-between border-b border-border bg-surface px-5 shrink-0">
          <span className="font-display text-sm font-semibold text-foreground tracking-tight">
            {APP_NAME}
          </span>
          <div className="flex items-center gap-3">
            <DashboardLogoutButton />
            {/* Profile circle */}
            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0 select-none">
              <span className="font-display text-xs font-semibold text-accent-foreground">
                {initial}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
