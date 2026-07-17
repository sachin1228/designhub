"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutList, Building2, MapPin, Layers } from "lucide-react";

const NAV = [
  { href: "/admin",          label: "Applications",  icon: LayoutList },
  { href: "/admin/companies", label: "Companies",     icon: Building2  },
  { href: "/admin/cities",    label: "Cities",        icon: MapPin     },
  { href: "/admin/sectors",   label: "Design Sectors",icon: Layers     },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 flex-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            prefetch={false}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 font-body text-sm transition-colors ${
              active
                ? "bg-overlay-elevated text-overlay-foreground"
                : "text-overlay-muted hover:text-overlay-foreground hover:bg-overlay-elevated/50"
            }`}
          >
            <Icon size={16} className={active ? "text-accent" : ""} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
