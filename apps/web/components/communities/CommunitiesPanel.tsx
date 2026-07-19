"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, Users, MessageSquare, X } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

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
        className="h-10 w-10 rounded-full object-cover shrink-0"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-base font-medium select-none ${
      active ? "bg-accent/20" : "bg-surface-raised"
    }`}>
      {fallback}
    </div>
  );
}

export function CommunitiesPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/communities");
      if (!res.ok) return;
      const data = await res.json();
      setCommunities(data.communities ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = search.trim()
    ? communities.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : communities;

  const activeCommunityId = pathname.match(/\/dashboard\/communities\/([^/]+)/)?.[1];

  return (
    <div className="flex flex-col h-full w-72 shrink-0 border-r border-border bg-surface">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <h2 className="font-display text-base font-semibold text-foreground mb-3">Communities</h2>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search communities…"
            className="w-full rounded-lg border border-border bg-surface-raised pl-8 pr-7 py-1.5 font-body text-xs text-foreground placeholder:text-foreground-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-4 w-4 text-foreground-muted" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <MessageSquare size={24} className="mx-auto text-foreground-muted mb-2 opacity-40" />
            <p className="font-body text-xs text-foreground-muted">
              {search ? "No results" : "No communities yet"}
            </p>
          </div>
        ) : (
          <ul>
            {filtered.map((c) => {
              const active = c.id === activeCommunityId;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => router.push(`/dashboard/communities/${c.id}`)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-white/5 last:border-0 ${
                      active
                        ? "bg-accent/10 border-l-2 border-l-accent"
                        : "hover:bg-surface-raised border-l-2 border-l-transparent"
                    }`}
                  >
                    {/* Avatar / icon */}
                    <CommunityAvatar
                      imageUrl={c.image_url}
                      name={c.name}
                      type={c.type}
                      active={active}
                    />

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`font-body text-xs font-medium truncate ${active ? "text-foreground" : "text-foreground"}`}>
                          {c.name}
                        </span>
                        {c.last_message && (
                          <span className="font-mono text-[10px] text-foreground-muted shrink-0">
                            {timeAgo(c.last_message.created_at)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {c.last_message ? (
                          <p className="font-body text-[11px] text-foreground-muted truncate flex-1">
                            <span className="font-medium">{c.last_message.user?.name?.split(" ")[0]}:</span>{" "}
                            {c.last_message.content}
                          </p>
                        ) : (
                          <p className="font-body text-[11px] text-foreground-muted/60 italic flex-1">No messages yet</p>
                        )}
                        <span className="flex items-center gap-0.5 text-foreground-muted shrink-0">
                          <Users size={10} />
                          <span className="font-mono text-[10px]">{c.member_count}</span>
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
