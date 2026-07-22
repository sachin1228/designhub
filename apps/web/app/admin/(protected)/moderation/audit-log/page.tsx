"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface AuditEntry {
  id: string;
  moderator_email: string;
  action: string;
  target_content_type: string | null;
  target_content_id: string | null;
  reason: string | null;
  created_at: string;
  target_user: { name: string; email: string } | null;
}

const ACTION_STYLES: Record<string, string> = {
  approve:        "bg-green-500/10 text-green-400",
  reject:         "bg-red-500/10 text-red-400",
  delete:         "bg-red-500/10 text-red-400",
  warn:           "bg-yellow-500/10 text-yellow-400",
  temp_ban:       "bg-orange-500/10 text-orange-400",
  perm_ban:       "bg-red-600/10 text-red-500",
  unban:          "bg-green-500/10 text-green-400",
  resolve_report: "bg-blue-500/10 text-blue-400",
};

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 30;

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/moderation/audit-log?page=${page}`)
      .then((r) => r.json())
      .then((d) => { setEntries(d.entries ?? []); setTotal(d.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-foreground">Audit Log</h1>
        <p className="font-body text-xs text-foreground-muted mt-0.5">
          Complete record of all moderator actions
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : entries.length === 0 ? (
        <div className="flex justify-center py-16 text-foreground-muted">
          <p className="font-body text-sm">No audit entries yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-4 p-3.5 rounded-xl bg-surface border border-border">
              <span className={`shrink-0 px-2 py-0.5 rounded-full font-body text-[11px] font-semibold capitalize mt-0.5 ${
                ACTION_STYLES[entry.action] ?? "bg-surface-raised text-foreground-muted"
              }`}>
                {entry.action.replace("_", " ")}
              </span>

              <div className="flex-1 min-w-0">
                <p className="font-body text-xs text-foreground">
                  <span className="font-medium">{entry.moderator_email}</span>
                  {entry.target_user && (
                    <> → <span className="font-medium">{entry.target_user.name}</span></>
                  )}
                  {entry.target_content_type && !entry.target_user && (
                    <> on {entry.target_content_type}</>
                  )}
                </p>
                {entry.reason && (
                  <p className="font-body text-[11px] text-foreground-muted mt-0.5 italic">{entry.reason}</p>
                )}
              </div>

              <span className="font-mono text-[10px] text-foreground-muted shrink-0">
                {new Date(entry.created_at).toLocaleString()}
              </span>
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
