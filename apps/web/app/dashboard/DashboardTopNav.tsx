"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MessagesSquare } from "lucide-react";

const NAV = [
  { href: "/dashboard/communities", label: "Communities", icon: MessagesSquare },
];

function isMatch(href: string, pathname: string) {
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");
}

export function DashboardTopNav() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (pendingHref && isMatch(pendingHref, pathname)) {
      setPendingHref(null);
    }
  }, [pathname, pendingHref]);

  const homeActive = pendingHref ? pendingHref === "/dashboard" : isMatch("/dashboard", pathname);

  return (
    <nav className="flex h-full items-center gap-1">
      {/* Standalone brand mark */}
      <Link
        href="/dashboard"
        prefetch={true}
        onClick={() => setPendingHref("/dashboard")}
        aria-label="drafthub home"
        className="mr-1 flex h-7 w-7 items-center justify-center rounded-md text-[13px] font-semibold leading-none transition-colors hover:bg-surface-raised"
      >
        <span className="text-foreground">d</span><span className="text-accent">/</span>
      </Link>

      {/* Home */}
      <Link
        href="/dashboard"
        prefetch={true}
        onClick={() => setPendingHref("/dashboard")}
        className={`flex h-7 items-center rounded-md px-3 text-[12px] font-medium transition-all ${
          homeActive
            ? "bg-surface-raised text-accent"
            : "text-foreground-muted hover:text-foreground hover:bg-surface-raised"
        }`}
      >
        <span>Home</span>
      </Link>

      {/* Other nav items */}
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pendingHref ? pendingHref === href : isMatch(href, pathname);
        return (
          <Link
            key={href}
            href={href}
            prefetch={true}
            onClick={() => setPendingHref(href)}
            className={`flex h-7 items-center gap-2 rounded-md px-3 text-[12px] transition-colors ${
              active
                ? "bg-surface-raised text-accent"
                : "text-foreground-muted hover:text-foreground hover:bg-surface-raised"
            }`}
          >
            <Icon size={16} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
