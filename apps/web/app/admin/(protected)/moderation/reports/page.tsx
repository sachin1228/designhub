"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface Report {
  id: string;
  content_type: string;
  content_id: string;
  community_id: string | null;
  reason: string;
  description: string | null;
  status: string;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  reporter: { name: string; email: string } | null;
}

const STATUS_TABS = [
  { value: "pending",          label: "Pending" },
  { value: "resolved_approve", label: "Approved" },
  { value: "resolved_reject",  label: "Rejected" },
];

const REASON_COLORS: Record<string, string> = {
  spam:       "bg-yellow-500/10 text-yellow-400",
  harassment: "bg-orange-500/10 text-orange-400",
  hate:       "bg-red-500/10 text-red-400",
  violence:   "bg-red-500/10 text-red-400",
  nudity:     "bg-pink-500/10 text-pink-400",
  scam:       "bg-purple-500/10 text-purple-400",
  copyright:  "bg-blue-500/10 text-blue-400",
  other:      "bg-surface-raised text-foreground-muted",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [status, setStatus]   = useState("pending");
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState<string | null>(null);

  const PAGE_SIZE = 20;

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), status });
    fetch(`/api/admin/moderation/reports?${qs}`)
      .then((r) => r.json())
      .then((d) => { setReports(d.reports ?? []); setTotal(d.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  async function resolve(id: string, action: "resolved_approve" | "resolved_reject") {
    setActing(id);
    try {
      await fetch(`/api/admin/moderation/reports/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
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
        <h1 className="font-display text-xl font-semibold text-foreground">User Reports</h1>
        <p className="font-body text-xs text-foreground-muted mt-0.5">{total} report{total !== 1 ? "s" : ""}</p>
      </div>

      <div className="flex gap-1 p-1 bg-surface rounded-xl w-fit">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => { setStatus(t.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg font-body text-xs transition-colors ${
              status === t.value
                ? "bg-surface-raised text-foreground shadow-sm"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : reports.length === 0 ? (
        <div className="flex justify-center py-16 text-foreground-muted">
          <p className="font-body text-sm">No reports in this category.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {reports.map((report) => (
            <div key={report.id} className="flex items-start gap-4 p-4 rounded-xl bg-surface border border-border">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`px-2 py-0.5 rounded-full font-body text-[11px] font-semibold capitalize ${
                    REASON_COLORS[report.reason] ?? REASON_COLORS.other
                  }`}>
                    {report.reason}
                  </span>
                  <span className="font-mono text-[10px] text-foreground-muted">{report.content_type}</span>
                </div>

                <p className="font-body text-sm text-foreground">
                  Reported by <strong>{report.reporter?.name ?? "Unknown"}</strong>
                </p>

                {report.description && (
                  <p className="font-body text-xs text-foreground-muted mt-1 italic">{report.description}</p>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <span className="font-mono text-[10px] text-foreground-muted">
                    {new Date(report.created_at).toLocaleString()}
                  </span>
                  {report.resolved_by && (
                    <span className="font-body text-[11px] text-foreground-muted">
                      · Resolved by {report.resolved_by}
                    </span>
                  )}
                </div>
              </div>

              {status === "pending" && (
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => resolve(report.id, "resolved_approve")}
                    disabled={acting === report.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 font-body text-xs transition-colors disabled:opacity-40"
                  >
                    <CheckCircle size={13} /> Approve
                  </button>
                  <button
                    onClick={() => resolve(report.id, "resolved_reject")}
                    disabled={acting === report.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 font-body text-xs transition-colors disabled:opacity-40"
                  >
                    <XCircle size={13} /> Dismiss
                  </button>
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
