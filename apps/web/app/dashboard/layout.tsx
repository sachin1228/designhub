import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { APP_NAME } from "@draft/shared";
import { createServiceClient } from "@/lib/supabase/service";
import { DashboardTopNav } from "@/app/dashboard/DashboardTopNav";
import { ProfileDropdown } from "@/app/dashboard/ProfileDropdown";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "user") {
    redirect("/login");
  }

  // Fetch name + avatar from DB — run both queries in parallel
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
  const avatarUrl = (profile as { avatar_url?: string | null } | null)?.avatar_url ?? null;
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Topbar — full width, contains logo + nav + profile */}
      <header className="sticky top-0 z-20 flex h-[52px] shrink-0 items-center justify-between border-b border-border bg-surface px-4">
        {/* Left: brand + nav buttons */}
        <div className="flex items-center gap-3">
          <span className="font-display text-xl font-semibold text-foreground select-none">
            d<span className="text-accent mx-0.5">/</span>
          </span>
          {/* Divider */}
          <span className="w-px h-5 bg-border" />
          <DashboardTopNav />
        </div>

        {/* Right: profile dropdown */}
        <ProfileDropdown
          name={name}
          email={email}
          avatarUrl={avatarUrl}
          initial={initial}
        />
      </header>

      {/* Page content */}
      <main className="flex flex-1 flex-col px-8 py-8">
        {children}
      </main>
    </div>
  );
}
