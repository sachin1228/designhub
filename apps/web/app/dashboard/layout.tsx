import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";
import { GlobalSidebar } from "@/components/sidebar/GlobalSidebar";
import { ProfileDropdown } from "@/app/dashboard/ProfileDropdown";
import { Bell, MessageCircle } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "user") {
    redirect("/login");
  }

  const db = createServiceClient();
  const [{ data: user }, { data: profile }] = await Promise.all([
    db
      .from("users")
      .select("name, email")
      .eq("id", session.userId!)
      .maybeSingle(),
    db
      .from("designer_profiles")
      .select("avatar_url")
      .eq("user_id", session.userId!)
      .maybeSingle(),
  ]);

  const name = user?.name ?? session.email ?? "User";
  const email = user?.email ?? session.email ?? "";
  const avatarUrl =
    (profile as { avatar_url?: string | null } | null)?.avatar_url ?? null;
  const initial = name.charAt(0).toUpperCase();
  const userId = session.userId!;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Global sidebar */}
      <GlobalSidebar userId={userId} />

      {/* Right pane: topbar + page content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar — icons only, no nav links */}
        <header className="sticky top-0 z-20 flex h-12 items-center justify-end border-b border-border px-4 shrink-0">
          <div className="flex items-center gap-0.5">
            <button
              className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-colors"
              aria-label="Direct messages"
            >
              <MessageCircle size={16} />
            </button>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-colors"
              aria-label="Notifications"
            >
              <Bell size={16} />
            </button>
            <div className="mx-1 h-4 w-px bg-border shrink-0" />
            <ProfileDropdown
              name={name}
              email={email}
              avatarUrl={avatarUrl}
              initial={initial}
            />
          </div>
        </header>

        {/* Page content — no global padding; each page owns its own spacing */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
