"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, XCircle, Trash2, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface QueueItem {
  id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  community_id: string;
  user_id: string;
  moderation_status: string;
  users: { name: string } | null;
  moderation_logs: {
    provider: string;
    confidence: number | null;
    reason: string | null;
    status: string;
  } | null;
}

const STATUS_TABS = [
  { value: "review",   label: "Under Review" },
  { value: "rejected", label: "Rejected" },
  { value: "approved", label: "Approved"  },
];

const TYPE_FILTERS = [
  { value: "",      label: "All" },
  { value: "text",  label: "Text" },
  { value: "image", label: "Images" },
];

export default function ModerationQueuePage() {
  const [items, setItems]   = useState<QueueItem[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus]   = useState("review");
  const [type, setType]       = useState("");
  const [acting, setActing]   = useState<string | null>(null);

  const PAGE_SIZE = 20;

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), status, type });
    fetch(`/api/admin/moderation/queue?${qs}`)
      .then((r) => r.json())
      .then((d) => { setItems(d.items ?? []); setTotal(d.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, status, type]);

  useEffect(() => { load(); }, [load]);

  async function act(id: string, action: "approve" | "reject" | "delete") {
    setActing(id);
    try {
      await fetch(`/api/admin/moderation/queue/${id}/action`, {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">Moderation Queue</h1>
          <p className="font-body text-xs text-foreground-muted mt-0.5">{total} item{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Type filter */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-foreground-muted" />
        <div className="flex gap-1">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setType(f.value); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg font-body text-xs transition-colors border ${
                type === f.value
                  ? "border-accent text-accent bg-accent/10"
                  : "border-border text-foreground-muted hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-foreground-muted">
          <p className="font-body text-sm">No items in this queue.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl bg-surface border border-border"
            >
              {/* Content preview */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-body text-xs font-medium text-foreground">
                    {item.users?.name ?? "Unknown user"}
                  </span>
                  <span className="font-mono text-[10px] text-foreground-muted">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>

                {item.content && (
                  <p className="font-body text-sm text-foreground whitespace-pre-wrap break-words line-clamp-4">
                    {item.content}
                  </p>
                )}

                {item.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image_url}
                    alt="Flagged image"
                    className="mt-2 max-h-40 rounded-lg object-cover border border-border"
                  />
                )}

                {/* AI info */}
                {item.moderation_logs && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-full bg-surface-raised font-mono text-[10px] text-foreground-muted">
                      {item.moderation_logs.provider}
                    </span>
                    {item.moderation_logs.confidence != null && (
                      <span className="px-2 py-0.5 rounded-full bg-surface-raised font-mono text-[10px] text-foreground-muted">
                        {(item.moderation_logs.confidence * 100).toFixed(0)}% confidence
                      </span>
                    )}
                    {item.moderation_logs.reason && (
                      <span className="font-body text-[11px] text-foreground-muted italic">
                        {item.moderation_logs.reason}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              {status !== "approved" && (
                <div className="flex sm:flex-col gap-2 shrink-0">
                  <button
                    onClick={() => act(item.id, "approve")}
                    disabled={acting === item.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 font-body text-xs transition-colors disabled:opacity-40"
                  >
                    <CheckCircle size={13} /> Approve
                  </button>
                  {status !== "rejected" && (
                    <button
                      onClick={() => act(item.id, "reject")}
                      disabled={acting === item.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 font-body text-xs transition-colors disabled:opacity-40"
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  )}
                  <button
                    onClick={() => act(item.id, "delete")}
                    disabled={acting === item.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised text-foreground-muted hover:text-foreground font-body text-xs transition-colors disabled:opacity-40"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-body text-xs text-foreground-muted">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
