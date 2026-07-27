"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Calendar, ChevronDown, Loader2, MessageCircle, MessagesSquare, MoreHorizontal, Users } from "lucide-react";
import { invalidateOnArchive, invalidateOnLeave, msgCache, metaCache } from "@/lib/communities/cache";
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
  onlineCount?: number;
}

export type ChatTab = "chat" | "threads" | "events" | "members";

export function ChatHeader({
  community,
  activeTab,
  onTabChange,
  onlineCount = 0,
}: ChatHeaderProps) {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<"joined" | "more" | null>(null);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    const closeOnOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openMenu]);

  async function leaveCommunity() {
    if (!community || busy) return;
    if (!window.confirm("Leave this community? You will no longer be able to view or send messages here.")) return;
    setBusy(true);
    const response = await fetch(`/api/communities/${community.id}/members`, { method: "DELETE" });
    if (!response.ok) {
      setBusy(false);
      return;
    }
    invalidateOnLeave(community.id);
    setOpenMenu(null);
    router.push("/dashboard");
  }

  async function archiveCommunity() {
    if (!community || busy) return;
    if (!window.confirm("Delete this community from your sidebar? It will stay available to other members and return when a new message arrives.")) return;
    setBusy(true);
    const response = await fetch(`/api/communities/${community.id}/archive`, { method: "POST" });
    if (!response.ok) {
      setBusy(false);
      return;
    }
    invalidateOnArchive(community.id);
    msgCache.delete(community.id);
    metaCache.delete(community.id);
    setOpenMenu(null);
    router.push("/dashboard");
  }

  return (
    <div className="px-5 pt-4 border-b border-border shrink-0">
      {community ? (
        <>
           <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-surface-raised flex items-center justify-center text-sm shrink-0 overflow-hidden">
                {community.image_url ? (
                  <img
                    src={community.image_url}
                    alt={community.name}
                    className="h-11 w-11 rounded-full object-cover"
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
                <h3 className="font-display text-base font-semibold text-foreground leading-none">
                  {community.name}
                </h3>
                <p className="font-body text-[11px] text-foreground-muted mt-0.5 flex items-center gap-1">
                  <Users size={10} /> {community.member_count} member
                  {community.member_count !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
             <div ref={menuRef} className="relative flex items-center gap-2">
               <button
                 type="button"
                 aria-label="Notifications"
                 className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-colors"
               >
                 <Bell size={15} strokeWidth={1.8} />
               </button>
               <div className="relative">
                 <button
                   type="button"
                   aria-haspopup="menu"
                   aria-expanded={openMenu === "joined"}
                   onClick={() => setOpenMenu(openMenu === "joined" ? null : "joined")}
                   className="h-8 flex items-center gap-1.5 rounded-lg border border-border px-3 font-body text-xs text-foreground hover:bg-surface-raised transition-colors"
                 >
                   Joined <ChevronDown size={13} className={`transition-transform ${openMenu === "joined" ? "rotate-180" : ""}`} />
                 </button>
                 {openMenu === "joined" && (
                   <div role="menu" className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-40 rounded-xl border border-white/[0.08] bg-surface-raised p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                     <button
                       type="button"
                       role="menuitem"
                       disabled={busy}
                       onClick={leaveCommunity}
                       className="flex w-full items-center rounded-lg px-3 py-2 text-left font-body text-xs text-red-400 hover:bg-red-400/10 disabled:opacity-50 transition-colors"
                     >
                       {busy ? <Loader2 size={12} className="mr-2 animate-spin" /> : null}
                       Leave community
                     </button>
                   </div>
                 )}
               </div>
               <div className="relative">
                 <button
                   type="button"
                   aria-label="Community options"
                   aria-haspopup="menu"
                   aria-expanded={openMenu === "more"}
                   onClick={() => setOpenMenu(openMenu === "more" ? null : "more")}
                   className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-colors"
                 >
                   <MoreHorizontal size={16} />
                 </button>
                 {openMenu === "more" && (
                   <div role="menu" className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-44 rounded-xl border border-white/[0.08] bg-surface-raised p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                     <button
                       type="button"
                       role="menuitem"
                       disabled={busy}
                       onClick={archiveCommunity}
                       className="flex w-full items-center rounded-lg px-3 py-2 text-left font-body text-xs text-red-400 hover:bg-red-400/10 disabled:opacity-50 transition-colors"
                     >
                       {busy ? <Loader2 size={12} className="mr-2 animate-spin" /> : null}
                       Delete community
                     </button>
                   </div>
                 )}
               </div>
            </div>
          </div>
          <nav className="flex items-center gap-5" aria-label="Community views">
            {([
              ["chat",    "Chat",    MessageCircle],
              ["threads", "Threads", MessagesSquare],
              ["events",  "Events",  Calendar],
              ["members", "Members", Users],
            ] as const).map(([tab, label, Icon]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => onTabChange(tab)}
                className={`border-b-2 px-3 py-2.5 font-body text-xs transition-colors ${
                  activeTab === tab
                    ? "border-accent text-foreground"
                    : "border-transparent text-foreground-muted hover:text-foreground"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Icon size={14} aria-hidden="true" />
                  {label}
                </span>
              </button>
            ))}
          </nav>
        </>
      ) : (
        /* Skeleton header while loading */
        <div className="h-5 w-48 rounded bg-surface-raised animate-pulse" />
      )}
    </div>
  );
}
