"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Users } from "lucide-react";

interface LastMessage {
  content: string;
  created_at: string;
  user: { name: string } | null;
}

interface Community {
  id: string;
  name: string;
  type: "city" | "sector" | "interest" | "company" | "experience_level";
  image_url: string | null;
  member_count: number;
  last_message: LastMessage | null;
}

const TYPE_EMOJI: Record<string, string> = {
  city:             "📍",
  sector:           "🏢",
  interest:         "✦",
  company:          "🏬",
  experience_level: "🎯",
};

const SECTIONS: { label: string; type: Community["type"] }[] = [
  { label: "Company",    type: "company"          },
  { label: "Industry",   type: "sector"            },
  { label: "Interest",   type: "interest"          },
  { label: "Experience", type: "experience_level"  },
  { label: "City",       type: "city"              },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function CommunityAvatar({
  imageUrl,
  name,
  type,
  active,
}: {
  imageUrl: string | null;
  name: string;
  type: string;
  active: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const fallback = TYPE_EMOJI[type] ?? "💬";
  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="h-8 w-8 rounded-full object-cover shrink-0"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-sm select-none ${
      active ? "bg-accent/20" : "bg-surface-raised"
    }`}>
      {fallback}
    </div>
  );
}

function CommunityItem({ c, active }: { c: Community; active: boolean }) {
  return (
    <Link
      href={`/dashboard/communities/${c.id}`}
      prefetch={false}
      className={`relative flex items-center gap-2.5 pl-4 pr-3 py-2 transition-colors ${
        active
          ? "bg-accent/10 border-l-2 border-l-accent"
          : "hover:bg-surface-raised border-l-2 border-l-transparent"
      }`}
    >
      {/* horizontal tick from branch line */}
      <div className="absolute left-[-1px] top-1/2 w-3 h-px bg-white/10 -translate-y-1/2" />

      <CommunityAvatar
        imageUrl={c.image_url}
        name={c.name}
        type={c.type}
        active={active}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={`font-body text-xs font-medium truncate ${active ? "text-accent" : "text-foreground"}`}>
            {c.name}
          </span>
          {c.last_message && (
            <span className="font-mono text-[10px] text-foreground-muted shrink-0">
              {timeAgo(c.last_message.created_at)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {c.last_message ? (
            <p className="font-body text-[10px] text-foreground-muted truncate flex-1">
              {c.last_message.content}
            </p>
          ) : (
            <p className="font-body text-[10px] text-foreground-muted/50 italic truncate flex-1">No messages yet</p>
          )}
          <span className="flex items-center gap-0.5 text-foreground-muted shrink-0">
            <Users size={9} />
            <span className="font-mono text-[10px]">{c.member_count}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

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

      {/* Branch tree */}
      {communities.length > 0 && (
        <div className="ml-[23px] border-l border-white/10">
          {SECTIONS.map((section) => {
            const group = communities.filter((c) => c.type === section.type);
            if (group.length === 0) return null;
            return (
              <div key={section.type}>
                {/* Section label with tick */}
                <div className="relative flex items-center pl-4 pt-3 pb-1">
                  <div className="absolute left-0 top-1/2 w-3 h-px bg-white/10" />
                  <span className="font-body text-[9px] font-semibold uppercase tracking-widest text-foreground-muted/50">
                    {section.label}
                  </span>
                </div>

                {/* Community rows */}
                {group.map((c) => (
                  <CommunityItem
                    key={c.id}
                    c={c}
                    active={c.id === activeCommunityId}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </nav>
  );
}
