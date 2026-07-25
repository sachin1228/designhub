"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, MessageSquare } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { CommunityRow } from "@/components/communities/panel/CommunityRow";
import { useSidebarCommunities } from "@/components/communities/panel/useSidebarCommunities";

interface Props {
  userId: string;
}

function isMatch(href: string, pathname: string) {
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");
}

export function GlobalSidebar({ userId }: Props) {
  const pathname = usePathname();

  const {
    communities,
    loading,
    activeCommunityId,
    typingMap,
    handleNavigate,
    onEnter,
    onLeave,
  } = useSidebarCommunities(userId);

  const sorted = [...communities].sort((a, b) => {
    const ta = a.last_message?.created_at ?? "";
    const tb = b.last_message?.created_at ?? "";
    if (tb > ta) return 1;
    if (ta > tb) return -1;
    return a.name.localeCompare(b.name);
  });

  const homeActive =
    isMatch("/dashboard", pathname) && !isMatch("/dashboard/communities", pathname);
  const exploreActive = pathname === "/dashboard/communities";

  return (
    <aside className="flex flex-col h-full w-56 shrink-0 border-r border-border bg-background overflow-hidden">
      {/* WORKSPACE nav */}
      <div className="px-3 pt-2 pb-2 shrink-0">
        <p className="px-2 mb-1.5 font-body text-[10px] font-semibold uppercase tracking-widest text-foreground-muted">
          Workspace
        </p>
        <ul className="space-y-0.5">
          <li>
            <Link
              href="/dashboard"
              className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg font-body text-sm font-medium transition-colors ${
                homeActive
                  ? "bg-surface-raised text-foreground"
                  : "text-foreground-muted hover:text-foreground hover:bg-surface-raised"
              }`}
            >
              <Home size={15} className="shrink-0" />
              <span className="flex-1 truncate">Home</span>
              {homeActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
              )}
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/communities"
              className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg font-body text-sm font-medium transition-colors ${
                exploreActive
                  ? "bg-surface-raised text-foreground"
                  : "text-foreground-muted hover:text-foreground hover:bg-surface-raised"
              }`}
            >
              <Users size={15} className="shrink-0" />
              <span className="flex-1 truncate">Explore Communities</span>
            </Link>
          </li>
        </ul>
      </div>

      {/* Separator */}
      <div className="mx-3 h-px bg-border shrink-0" />

      {/* ALL — community list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-4 w-4 text-foreground-muted" />
          </div>
        ) : communities.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <MessageSquare
              size={24}
              className="mx-auto text-foreground-muted mb-2 opacity-40"
            />
            <p className="font-body text-xs text-foreground-muted">No communities yet</p>
          </div>
        ) : (
          <div className="py-0.5">
            <div className="px-3 pt-3 pb-0.5">
              <span className="font-body text-[10px] font-semibold uppercase tracking-widest text-foreground-muted">
                All
              </span>
            </div>
            <ul className="space-y-0.5">
              {sorted.map((c) => (
                <CommunityRow
                  key={c.id}
                  c={c}
                  active={c.id === activeCommunityId}
                  typingText={typingMap.get(c.id)}
                  onClick={() => handleNavigate(c.id)}
                  onMouseEnter={() => onEnter(c.id)}
                  onMouseLeave={onLeave}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
