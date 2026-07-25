"use client";

import {
  BookOpen,
  CalendarDays,
  Images,
  MessageCircle,
  MessagesSquare,
  Users,
} from "lucide-react";
import { TYPE_EMOJI } from "./chatUtils";

interface Community {
  id: string;
  name: string;
  type: string;
  member_count: number;
  image_url: string | null;
}

interface ChatHeaderProps {
  community: Community | null;
  activeTab: ChatTab;
  onTabChange: (tab: ChatTab) => void;
}

export type ChatTab = "chat" | "threads" | "events" | "showcase" | "resources";

const TABS: Array<{ id: ChatTab; label: string; icon: typeof MessageCircle }> = [
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "threads", label: "Threads", icon: MessagesSquare },
  { id: "events", label: "Events", icon: CalendarDays },
  { id: "showcase", label: "Showcase", icon: Images },
  { id: "resources", label: "Resources", icon: BookOpen },
];

export function ChatHeader({ community, activeTab, onTabChange }: ChatHeaderProps) {
  return (
    <header className="border-b border-border shrink-0">
      <div className="flex items-center justify-between px-5 py-3">
      {community ? (
        <>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-surface-raised flex items-center justify-center text-sm shrink-0 overflow-hidden">
              {community.image_url ? (
                <img
                  src={community.image_url}
                  alt={community.name}
                  className="h-9 w-9 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement!.textContent =
                      TYPE_EMOJI[community.type] ?? "💬";
                  }}
                />
              ) : (
                TYPE_EMOJI[community.type] ?? "💬"
              )}
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold text-foreground leading-none">
                {community.name}
              </h3>
              <p className="font-body text-[11px] text-foreground-muted mt-0.5 flex items-center gap-1">
                <Users size={10} /> {community.member_count} member
                {community.member_count !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users size={14} className="text-foreground-muted" />
            <span className="font-body text-xs text-foreground-muted">
              {community.member_count} member
              {community.member_count !== 1 ? "s" : ""}
            </span>
          </div>
        </>
      ) : (
        /* Skeleton header while loading */
        <div className="h-5 w-48 rounded bg-surface-raised animate-pulse" />
      )}
      </div>

      {community && (
        <nav
          aria-label="Community views"
          role="tablist"
          className="flex items-center gap-1 overflow-x-auto px-5"
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(id)}
                className={[
                  "relative flex items-center gap-2 px-3 py-2.5 font-body text-xs font-medium transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-foreground-muted hover:text-foreground",
                ].join(" ")}
              >
                <Icon size={14} strokeWidth={isActive ? 2.2 : 1.8} />
                {label}
                {isActive && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}
