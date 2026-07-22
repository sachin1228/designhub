"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, AlertTriangle, Ban, ShieldOff } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface Punishment {
  type: string;
  reason: string;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  is_blocked: boolean;
  created_at: string;
  warning_count: number;
  active_ban: Punishment | null;
  punishments: Punishment[];
}

const FILTERS = [
  { value: "all",    label: "All Users" },
  { value: "warned", label: "Warned" },
  { value: "banned", label: "Banned" },
];

const ACTION_LABELS: Record<string, string> = {
  warn:     "Warn",
  mute:     "Mute 24h",
  temp_ban: "Ban 7 days",
  perm_ban: "Perm Ban",
  unban:    "Unban",
};

export default function ModerationUsersPage() {
  const [users, setUsers]   = useState<User[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [acting, setActing]     = useState<string | null>(null);

  const PAGE_SIZE = 20;

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), search, filter });
    fetch(`/api/admin/moderation/users?${qs}`)
      .then((r) => r.json())
      .then((d) => { setUsers(d.users ?? []); setTotal(d.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, filter]);

  useEffect(() => { load(); }, [load]);

  async function punish(userId: string, action: string) {
    setActing(userId);

    const body: Record<string, unknown> = { action, reason: `Admin action: ${action}` };
    if (action === "temp_ban") body.expires_at = new Date(Date.now() + 7 * 86400_000).toISOString();
    if (action === "mute")     body.expires_at = new Date(Date.now() + 86400_000).toISOString();

    try {
      await fetch(`/api/admin/moderation/users/${userId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      load();
    } finally {
      setActing(null);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-foreground">User Moderation</h1>
        <p className="font-body text-xs text-foreground-muted mt-0.5">{total} user{total !== 1 ? "s" : ""}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name…"
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-surface border border-border font-body text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Filter */}
        <div className="flex gap-1 p-1 bg-surface rounded-xl w-fit">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-body text-xs transition-colors ${
                filter === f.value
                  ? "bg-surface-raised text-foreground shadow-sm"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : users.length === 0 ? (
        <div className="flex justify-center py-16 text-foreground-muted">
          <p className="font-body text-sm">No users found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((user) => (
            <div key={user.id} className="rounded-xl bg-surface border border-border overflow-hidden">
              <div
                className="flex items-center justify-between gap-4 p-4 cursor-pointer"
                onClick={() => setExpanded(expanded === user.id ? null : user.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-surface-raised flex items-center justify-center shrink-0">
                    <span className="font-body text-xs font-semibold text-foreground-muted">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-sm font-medium text-foreground truncate">{user.name}</p>
                    <p className="font-body text-[11px] text-foreground-muted truncate">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {user.warning_count > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 font-body text-[11px]">
                      <AlertTriangle size={11} /> {user.warning_count}
                    </span>
                  )}
                  {user.active_ban && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-body text-[11px]">
                      <Ban size={11} /> Banned
                    </span>
                  )}
                  {user.is_blocked && !user.active_ban && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-body text-[11px]">
                      <ShieldOff size={11} /> Blocked
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-foreground-muted">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {expanded === user.id && (
                <div className="border-t border-border p-4 flex flex-col gap-4">
                  {/* Punishment history */}
                  {user.punishments.length > 0 && (
                    <div>
                      <p className="font-body text-xs font-semibold text-foreground-muted uppercase tracking-wide mb-2">History</p>
                      <div className="flex flex-col gap-1.5">
                        {user.punishments.slice(0, 5).map((p, i) => (
                          <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-surface-raised">
                            <span className={`font-body text-[11px] font-semibold capitalize px-2 py-0.5 rounded-full ${
                              p.type === "warning"  ? "bg-yellow-500/10 text-yellow-400" :
                              p.type === "perm_ban" ? "bg-red-500/10 text-red-400"      :
                              p.type === "temp_ban" ? "bg-orange-500/10 text-orange-400" :
                              "bg-surface text-foreground-muted"
                            }`}>
                              {p.type.replace("_", " ")}
                            </span>
                            <p className="font-body text-[11px] text-foreground-muted flex-1">{p.reason}</p>
                            <span className="font-mono text-[10px] text-foreground-muted shrink-0">
                              {new Date(p.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div>
                    <p className="font-body text-xs font-semibold text-foreground-muted uppercase tracking-wide mb-2">Actions</p>
                    <div className="flex flex-wrap gap-2">
                      {["warn", "mute", "temp_ban", "perm_ban"].map((action) => (
                        <button
                          key={action}
                          disabled={acting === user.id}
                          onClick={() => punish(user.id, action)}
                          className={`px-3 py-1.5 rounded-lg font-body text-xs transition-colors disabled:opacity-40 ${
                            action === "perm_ban"
                              ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              : action === "temp_ban"
                              ? "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                              : action === "warn"
                              ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                              : "bg-surface-raised text-foreground-muted hover:text-foreground"
                          }`}
                        >
                          {ACTION_LABELS[action]}
                        </button>
                      ))}
                      {(user.active_ban || user.is_blocked) && (
                        <button
                          disabled={acting === user.id}
                          onClick={() => punish(user.id, "unban")}
                          className="px-3 py-1.5 rounded-lg font-body text-xs bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-40"
                        >
                          Unban
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground disabled:opacity-40 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="font-body text-xs text-foreground-muted">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground disabled:opacity-40 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
