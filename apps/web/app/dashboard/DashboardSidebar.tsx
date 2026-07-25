"use client";

import { House, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CommunitiesPanel } from "@/components/communities/CommunitiesPanel";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/dashboard/communities", label: "Communities", icon: UsersRound },
];

function isActive(href: string, pathname: string) {
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardSidebar({ userId }: { userId: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-72 min-h-0 shrink-0 flex-col border-r border-border bg-background px-4 py-5">
      <div className="px-3 pb-7">
        <span className="font-display text-lg font-semibold tracking-tight text-foreground">
          drafthub <span className="text-accent">/</span>
        </span>
      </div>

      <div className="px-3 pb-2 font-body text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
        Workspace
      </div>

      <nav aria-label="Dashboard navigation" className="space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href, pathname);

          return (
            <Link
              key={href}
              href={href}
              prefetch
              aria-current={active ? "page" : undefined}
              className={[
                "group flex items-center gap-3 rounded-xl px-3 py-3 font-body text-sm font-medium transition-colors",
                active
                  ? "bg-surface-raised text-foreground shadow-sm"
                  : "text-foreground-muted hover:bg-surface-raised/70 hover:text-foreground",
              ].join(" ")}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.2 : 1.8}
                className={active ? "text-accent" : "text-foreground-subtle group-hover:text-foreground"}
              />
              <span>{label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 flex min-h-0 flex-1 flex-col border-t border-border pt-4">
        <CommunitiesPanel userId={userId} embedded />
      </div>
    </aside>
  );
}