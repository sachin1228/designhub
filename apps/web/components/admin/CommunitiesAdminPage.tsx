"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, X, ChevronRight, Users, MessageSquare, Globe, Lock } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { useRouter } from "next/navigation";

const TYPE_LABELS: Record<string, string> = {
  city:             "City",
  sector:           "Industry",
  interest:         "Interest",
  company:          "Company",
  experience_level: "Experience",
};

const TYPE_COLORS: Record<string, string> = {
  city:             "bg-blue-500/10 text-blue-400",
  sector:           "bg-purple-500/10 text-purple-400",
  interest:         "bg-orange-500/10 text-orange-400",
  company:          "bg-teal-500/10 text-teal-400",
  experience_level: "bg-pink-500/10 text-pink-400",
};

interface AdminCommunity {
  id: string;
  name: string;
  type: string;
  image_url: string | null;
  is_public: boolean;
  member_count: number;
  message_count: number;
  created_at: string;
}

const ALL_TYPES = ["all", "city", "sector", "interest", "company", "experience_level"] as const;
type TypeFilter = typeof ALL_TYPES[number];

export function CommunitiesAdminPage() {
  const router = useRouter();
  const [communities, setCommunities] = useState<AdminCommunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [visFilter, setVisFilter] = useState<"all" | "public" | "private">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/communities");
      if (!res.ok) return;
      const data = await res.json();
      setCommunities(data.communities ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = communities;
    if (typeFilter !== "all") list = list.filter((c) => c.type === typeFilter);
    if (visFilter === "public")  list = list.filter((c) =>  c.is_public);
    if (visFilter === "private") list = list.filter((c) => !c.is_public);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((c) => c.name.toLowerCase().includes(q));
    return list;
  }, [communities, typeFilter, visFilter, search]);

  // Counts per type for tab badges
  const typeCounts = useMemo(() => {
    const map: Record<string, number> = { all: communities.length };
    for (const c of communities) map[c.type] = (map[c.type] ?? 0) + 1;
    return map;
  }, [communities]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">Communities</h1>
          <p className="font-body text-xs text-foreground-muted mt-0.5">
            All communities auto-generated from master data. Manage visibility and settings.
          </p>
        </div>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1 mb-3 border-b border-border overflow-x-auto">
        {ALL_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => { setTypeFilter(t); setSearch(""); }}
            className={`shrink-0 px-3 py-2 font-body text-xs font-medium capitalize transition-colors border-b-2 -mb-px whitespace-nowrap ${
              typeFilter === t
                ? "border-accent text-accent"
                : "border-transparent text-foreground-muted hover:text-foreground"
            }`}
          >
            {t === "all" ? "All" : TYPE_LABELS[t] ?? t}
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
              typeFilter === t ? "bg-accent/15 text-accent" : "bg-surface-raised text-foreground-muted"
            }`}>
              {typeCounts[t] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex gap-2 mb-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search communities…"
            className="w-full rounded-lg border border-border bg-surface pl-8 pr-8 py-2 font-body text-xs text-foreground placeholder:text-foreground-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Visibility filter */}
        <select
          value={visFilter}
          onChange={(e) => setVisFilter(e.target.value as typeof visFilter)}
          className="rounded-lg border border-border bg-surface px-3 py-2 font-body text-xs text-foreground outline-none focus:border-accent transition-colors"
        >
          <option value="all">All visibility</option>
          <option value="public">Public only</option>
          <option value="private">Private only</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-4 w-4 text-foreground-muted" />
          </div>
        ) : communities.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-body text-xs text-foreground-muted">No communities yet. They are created automatically when users join.</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center font-body text-xs text-foreground-muted">No results for &ldquo;{search}&rdquo;</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 w-8" />
                <th className="px-4 py-2 text-left font-body text-[10px] font-medium text-foreground-muted uppercase tracking-wider">Name</th>
                <th className="px-4 py-2 text-left font-body text-[10px] font-medium text-foreground-muted uppercase tracking-wider">Type</th>
                <th className="px-4 py-2 text-left font-body text-[10px] font-medium text-foreground-muted uppercase tracking-wider">Visibility</th>
                <th className="px-4 py-2 text-left font-body text-[10px] font-medium text-foreground-muted uppercase tracking-wider">Members</th>
                <th className="px-4 py-2 text-left font-body text-[10px] font-medium text-foreground-muted uppercase tracking-wider">Messages</th>
                <th className="px-4 py-2 w-6" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/admin/communities/${c.id}`)}
                  className={`cursor-pointer ${idx < filtered.length - 1 ? "border-b border-white/5" : ""} hover:bg-surface-raised transition-colors`}
                >
                  {/* Avatar */}
                  <td className="px-4 py-2.5">
                    {c.image_url ? (
                      <img src={c.image_url} alt={c.name} className="h-6 w-6 rounded object-cover" />
                    ) : (
                      <div className="h-6 w-6 rounded bg-surface-raised flex items-center justify-center">
                        <Users size={11} className="text-foreground-muted" />
                      </div>
                    )}
                  </td>
                  {/* Name */}
                  <td className="px-4 py-2.5">
                    <span className="font-body text-xs text-foreground">{c.name}</span>
                  </td>
                  {/* Type badge */}
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 font-mono text-[10px] font-medium ${TYPE_COLORS[c.type] ?? "bg-surface-raised text-foreground-muted"}`}>
                      {TYPE_LABELS[c.type] ?? c.type}
                    </span>
                  </td>
                  {/* Visibility */}
                  <td className="px-4 py-2.5">
                    {c.is_public ? (
                      <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-medium bg-green-500/10 text-green-400">
                        <Globe size={9} />Public
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-medium bg-surface-raised text-foreground-muted">
                        <Lock size={9} />Private
                      </span>
                    )}
                  </td>
                  {/* Members */}
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1 font-body text-xs text-foreground-muted">
                      <Users size={11} />{c.member_count}
                    </span>
                  </td>
                  {/* Messages */}
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1 font-body text-xs text-foreground-muted">
                      <MessageSquare size={11} />{c.message_count}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <ChevronRight size={13} className="text-foreground-muted" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Row count */}
      {!loading && filtered.length > 0 && (
        <p className="mt-2 text-right font-body text-[10px] text-foreground-muted">
          {search || typeFilter !== "all" || visFilter !== "all"
            ? `${filtered.length} of ${communities.length}`
            : communities.length}{" "}
          {communities.length === 1 ? "community" : "communities"}
        </p>
      )}
    </div>
  );
}
