"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare } from "lucide-react";

interface Community {
  id: string;
  name: string;
  type: "city" | "sector" | "interest" | "company" | "experience_level";
}

const SECTIONS: { label: string; type: Community["type"] }[] = [
  { label: "Company",    type: "company"          },
  { label: "Industry",   type: "sector"            },
  { label: "Interest",   type: "interest"          },
  { label: "Experience", type: "experience_level"  },
  { label: "City",       type: "city"              },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [communities, setCommunities] = useState<Community[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/communities");
      if (!res.ok) return;
      const data = await res.json();
      setCommunities(data.communities ?? []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const homeActive = pathname === "/dashboard";
  const communitiesActive = pathname.startsWith("/dashboard/communities");
  const activeCommunityId = pathname.match(/\/dashboard\/communities\/([^/]+)/)?.[1];

  return (
    <nav className="flex flex-col gap-0.5">
      {/* Home */}
      <Link
        href="/dashboard"
        prefetch={false}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 font-body text-sm transition-colors ${
          homeActive
            ? "bg-surface-raised text-foreground"
            : "text-foreground-muted hover:text-foreground hover:bg-surface-raised"
        }`}
      >
        <Home size={16} className={homeActive ? "text-accent" : ""} />
        Home
      </Link>

      {/* Communities parent */}
      <Link
        href="/dashboard/communities"
        prefetch={false}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 font-body text-sm transition-colors ${
          communitiesActive
            ? "bg-surface-raised text-foreground"
            : "text-foreground-muted hover:text-foreground hover:bg-surface-raised"
        }`}
      >
        <MessageSquare size={16} className={communitiesActive ? "text-accent" : ""} />
        Communities
      </Link>

      {/* Branch tree — always visible when communities exist */}
      {communities.length > 0 && (
        <div className="ml-[23px] border-l border-white/10">
          {SECTIONS.map((section) => {
            const group = communities.filter((c) => c.type === section.type);
            if (group.length === 0) return null;
            return (
              <div key={section.type}>
                {/* Section label */}
                <div className="relative flex items-center pl-4 pt-3 pb-1">
                  {/* horizontal tick */}
                  <div className="absolute left-0 top-1/2 w-3 h-px bg-white/10" />
                  <span className="font-body text-[9px] font-semibold uppercase tracking-widest text-foreground-muted/50">
                    {section.label}
                  </span>
                </div>

                {/* Individual communities */}
                {group.map((c) => {
                  const active = c.id === activeCommunityId;
                  return (
                    <Link
                      key={c.id}
                      href={`/dashboard/communities/${c.id}`}
                      prefetch={false}
                      className={`relative flex items-center pl-4 pr-3 py-1.5 transition-colors rounded-r-lg ${
                        active
                          ? "text-accent bg-accent/10"
                          : "text-foreground-muted hover:text-foreground hover:bg-surface-raised"
                      }`}
                    >
                      {/* horizontal tick */}
                      <div className="absolute left-0 top-1/2 w-3 h-px bg-white/10" />
                      <span className={`font-body text-xs truncate ${active ? "font-medium" : ""}`}>
                        {c.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </nav>
  );
}
