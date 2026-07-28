"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock, Users } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import {
  exploreStore,
  EXPLORE_STALE_MS,
  invalidateOnJoin,
  type CachedExploreCommunity,
} from "@/lib/communities/cache";

type Community = CachedExploreCommunity;

// ── Labels & colours per community type ─────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  city:             "City",
  sector:           "Industry",
  interest:         "Interest",
  company:          "Company",
  experience_level: "Experience",
  general:          "General",
  user:             "Community",
};

const TYPE_COLORS: Record<string, { border: string; text: string; bg: string }> = {
  interest:         { border: "#7C3AED", text: "#A78BFA", bg: "rgba(124,58,237,0.10)" },
  city:             { border: "#0891B2", text: "#67E8F9", bg: "rgba(8,145,178,0.10)"  },
  sector:           { border: "#0070F3", text: "#60A5FA", bg: "rgba(0,112,243,0.10)"  },
  company:          { border: "#EA580C", text: "#FB923C", bg: "rgba(234,88,12,0.10)"  },
  experience_level: { border: "#16A34A", text: "#4ADE80", bg: "rgba(22,163,74,0.10)"  },
  general:          { border: "#525252", text: "#A3A3A3", bg: "rgba(82,82,82,0.10)"   },
  user:             { border: "#D97706", text: "#FCD34D", bg: "rgba(217,119,6,0.10)"  },
};

const TYPE_EMOJI: Record<string, string> = {
  city:             "📍",
  sector:           "🏢",
  interest:         "✦",
  company:          "🏬",
  experience_level: "🎯",
  general:          "💬",
  user:             "👥",
};

const LOCK_REASON: Record<string, string> = {
  company:          "Update your company in your profile to join",
  sector:           "Update your industry in your profile to join",
  city:             "Update your city in your profile to join",
  experience_level: "Update your experience level in your profile to join",
};

const TABS = [
  { label: "All",        value: "all"              },
  { label: "Company",    value: "company"          },
  { label: "Industry",   value: "sector"            },
  { label: "Interest",   value: "interest"          },
  { label: "Experience", value: "experience_level"  },
  { label: "City",       value: "city"              },
] as const;

type TabValue = typeof TABS[number]["value"];

// ── CommunityCard ────────────────────────────────────────────────────────────

function CommunityCard({
  c,
  onJoin,
  joining,
}: {
  c: Community;
  onJoin: (id: string) => void;
  joining: boolean;
}) {
  const router   = useRouter();
  const [imgErr, setImgErr] = useState(false);
  const typeColor = TYPE_COLORS[c.type] ?? TYPE_COLORS["general"];
  const locked    = !c.can_join && !c.joined;

  return (
    <div
      onClick={() => { if (c.joined) router.push(`/dashboard/communities/${c.id}`); }}
      className={`flex flex-col rounded-2xl border bg-surface p-4 transition-colors ${
        c.joined
          ? "border-border hover:border-border-strong cursor-pointer"
          : locked
          ? "border-border opacity-60"
          : "border-border hover:border-border-strong"
      }`}
    >
      {/* Avatar + type pill */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-surface-raised flex items-center justify-center text-lg select-none">
          {c.image_url && !imgErr ? (
            <img
              src={c.image_url}
              alt={c.name}
              className="h-11 w-11 object-cover"
              onError={() => setImgErr(true)}
            />
          ) : (
            TYPE_EMOJI[c.type] ?? "💬"
          )}
        </div>
        <span
          className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 font-body text-[10px] font-medium"
          style={{
            border:     `1px solid ${typeColor.border}`,
            color:      typeColor.text,
            background: typeColor.bg,
          }}
        >
          {TYPE_LABELS[c.type] ?? c.type}
        </span>
      </div>

      {/* Name */}
      <p className="font-display text-sm font-semibold text-foreground leading-snug mb-1">
        {c.name}
      </p>

      {/* Member count */}
      <div className="flex items-center gap-1 mb-4">
        <Users size={10} className="text-foreground-muted" />
        <span className="font-body text-[11px] text-foreground-muted">
          {c.member_count} member{c.member_count !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Action — stops card-level click propagation */}
      <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
        {c.joined ? (
          <button
            onClick={() => router.push(`/dashboard/communities/${c.id}`)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 font-body text-xs font-medium text-accent hover:bg-accent/15 transition-colors"
          >
            <Check size={11} strokeWidth={2.5} />
            Joined
          </button>
        ) : locked ? (
          <div className="relative group/lock">
            <button
              disabled
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-body text-xs font-medium text-foreground-subtle cursor-not-allowed"
            >
              <Lock size={11} />
              Profile required
            </button>
            {/* Tooltip */}
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/lock:block z-20 w-52 rounded-lg border border-border bg-surface px-3 py-2 shadow-xl">
              <p className="font-body text-[11px] text-foreground-muted text-center leading-relaxed">
                {LOCK_REASON[c.type] ?? "Update your profile to join"}
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onJoin(c.id)}
            disabled={joining}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 font-body text-xs font-semibold text-white hover:bg-accent/90 transition-colors disabled:opacity-60"
          >
            {joining ? "Joining…" : "+ Join"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="font-display text-sm font-semibold text-foreground mb-3">
      {title}
    </h2>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CommunitiesIndexPage() {
  const [communities, setCommunities] = useState<Community[]>(
    () => exploreStore.data?.communities ?? [],
  );
  const [loading, setLoading]     = useState(() => exploreStore.data === null);
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [search, setSearch]       = useState("");
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);

  const load = useCallback(() => {
    if (exploreStore.data && Date.now() - exploreStore.data.fetchedAt < EXPLORE_STALE_MS) {
      setLoading(false);
      return;
    }
    if (exploreStore.inflight) {
      exploreStore.inflight.then(() => {
        if (exploreStore.data) setCommunities(exploreStore.data.communities);
        setLoading(false);
      });
      if (exploreStore.data) setLoading(false);
      return;
    }
    const p: Promise<void> = fetch("/api/communities/all")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (!d) return;
        const fresh = d.communities ?? [];
        exploreStore.data = { communities: fresh, fetchedAt: Date.now() };
        setCommunities(fresh);
      })
      .catch(() => {})
      .finally(() => {
        exploreStore.inflight = null;
        setLoading(false);
      });
    exploreStore.inflight = p;
    if (exploreStore.data) setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleJoin(communityId: string) {
    if (joiningId) return;
    setJoiningId(communityId);
    setErrorMsg(null);

    // Optimistic update
    setCommunities((prev) =>
      prev.map((c) => c.id === communityId ? { ...c, joined: true } : c),
    );
    // Also update the module-level store so the sidebar refreshes
    invalidateOnJoin(communityId);

    try {
      const res  = await fetch(`/api/communities/${communityId}/join`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Rollback
        setCommunities((prev) =>
          prev.map((c) => c.id === communityId ? { ...c, joined: false } : c),
        );
        if (exploreStore.data) {
          exploreStore.data = {
            ...exploreStore.data,
            communities: exploreStore.data.communities.map((c) =>
              c.id === communityId ? { ...c, joined: false } : c,
            ),
          };
        }
        setErrorMsg(data.error ?? "Failed to join. Please try again.");
        setTimeout(() => setErrorMsg(null), 4000);
      }
    } catch {
      setCommunities((prev) =>
        prev.map((c) => c.id === communityId ? { ...c, joined: false } : c),
      );
      setErrorMsg("Network error. Please try again.");
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setJoiningId(null);
    }
  }

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = communities.filter((c) => {
    const matchesTab    = activeTab === "all" || c.type === activeTab;
    const matchesSearch = c.name.toLowerCase().includes(search.trim().toLowerCase());
    return matchesTab && matchesSearch;
  });

  // On "All" tab split into "Recommended" (open, unjoined) and everything else
  const isAllTab    = activeTab === "all";
  const recommended = isAllTab
    ? filtered.filter((c) => c.can_join && !c.joined)
    : [];
  const rest = isAllTab
    ? filtered.filter((c) => c.joined || !c.can_join)
    : filtered;

  return (
    <div className="flex flex-col h-full">
      {/* ── Top area: title · search · tabs ─────────────────────────────── */}
      <div className="px-6 pt-6 pb-0 shrink-0">
        <h1 className="font-display text-xl font-semibold text-foreground mb-4">
          Explore Communities
        </h1>

        {/* Search bar */}
        <div className="relative mb-4">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none"
            width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search communities…"
            className="w-full rounded-lg border border-border bg-surface pl-8 pr-4 py-2 font-body text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
          />
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-0 overflow-x-auto border-b border-border">
          {TABS.map((tab) => {
            const count =
              tab.value === "all"
                ? communities.length
                : communities.filter((c) => c.type === tab.value).length;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`relative shrink-0 flex items-center gap-2 px-4 py-2.5 font-body text-xs font-normal transition-colors ${
                  isActive
                    ? "text-accent"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                {tab.label}
                <span
                  className={`font-mono text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-accent/15 text-accent"
                      : "bg-surface-raised text-foreground-muted"
                  }`}
                >
                  {count}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {errorMsg && (
        <div className="mx-6 mt-3 shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 font-body text-xs text-red-400">
          {errorMsg}
        </div>
      )}

      {/* ── Community grid ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-5 w-5 text-foreground-muted" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="font-body text-sm text-foreground-muted">No communities found</p>
          </div>
        ) : (
          <>
            {/* Recommended for you — only on All tab when there are joinable ones */}
            {recommended.length > 0 && (
              <section>
                <SectionHeader title="Recommended for you" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recommended.map((c) => (
                    <CommunityCard
                      key={c.id}
                      c={c}
                      onJoin={handleJoin}
                      joining={joiningId === c.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Everything else (joined + locked on All tab; all filtered on specific tabs) */}
            {rest.length > 0 && (
              <section>
                {/* Only show "All communities" header on All tab when there's also a Recommended section */}
                {isAllTab && recommended.length > 0 && (
                  <SectionHeader title="All communities" />
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {rest.map((c) => (
                    <CommunityCard
                      key={c.id}
                      c={c}
                      onJoin={handleJoin}
                      joining={joiningId === c.id}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
