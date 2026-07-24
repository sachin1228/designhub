"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, MessagesSquare, UserCircle } from "lucide-react";

const NAV = [
  { href: "/dashboard",             label: "Home",        icon: Home           },
  { href: "/dashboard/communities", label: "Communities", icon: MessagesSquare  },
  { href: "/dashboard/profile",     label: "Profile",     icon: UserCircle     },
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

  return (
    <nav className="flex items-center gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pendingHref ? pendingHref === href : isMatch(href, pathname);
        return (
          <Link
            key={href}
            href={href}
            prefetch={true}
            onClick={() => setPendingHref(href)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
              active
                ? "bg-surface-raised text-accent"
                : "text-foreground-muted hover:text-foreground hover:bg-surface-raised"
            }`}
          >
            <Icon size={15} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
