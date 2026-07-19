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
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Topbar — full width */}
      <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between h-[57px] bg-surface shadow-sm px-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
            <span className="font-display text-xs font-bold text-accent">
              {APP_NAME.charAt(0)}
            </span>
          </div>
          <span className="font-display text-sm font-semibold text-foreground tracking-tight">
            {APP_NAME}
          </span>
        </div>

        {/* Right: profile + sign out */}
        <div className="flex items-center gap-3">
          <DashboardLogoutButton />
          {/* Profile circle */}
          <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0 select-none">
            <span className="font-display text-xs font-semibold text-accent">
              {initial}
            </span>
          </div>
        </div>
      </header>

      {/* Below topbar */}
      <div className="flex flex-1 pt-[57px]">
        {/* Compact icon sidebar */}
        <aside className="fixed left-0 top-[57px] bottom-0 z-10 flex w-16 flex-col items-center bg-surface shadow-sm">
          <div className="flex-1 overflow-y-auto w-full py-2">
            <DashboardSidebar />
          </div>
        </aside>

        {/* Main content */}
        <main className="ml-16 flex flex-1 flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
