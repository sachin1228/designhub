"use client";

import { useState } from "react";
import { X, Flag } from "lucide-react";

const REASONS = [
  { value: "spam",       label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "hate",       label: "Hate speech" },
  { value: "violence",   label: "Violence" },
  { value: "nudity",     label: "Nudity" },
  { value: "scam",       label: "Scam / Phishing" },
  { value: "copyright",  label: "Copyright" },
  { value: "other",      label: "Other" },
] as const;

interface ReportModalProps {
  messageId: string;
  communityId: string;
  onClose: () => void;
}

export function ReportModal({ messageId, communityId, onClose }: ReportModalProps) {
  const [reason, setReason]           = useState<string>("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [done, setDone]               = useState(false);
  const [error, setError]             = useState<string | null>(null);

  async function submit() {
    if (!reason) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_type: "message",
          content_id:   messageId,
          community_id: communityId,
          reason,
          description: description.trim() || undefined,
        }),
      });
      if (res.status === 409) {
        setError("You have already reported this message.");
        return;
      }
      if (!res.ok) throw new Error("Failed");
      setDone(true);
    } catch {
      setError("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm mx-4 mb-4 sm:mb-0 bg-surface border border-border rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flag size={16} className="text-accent" />
            <h2 className="font-display text-sm font-semibold text-foreground">Report Message</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-foreground-muted hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {done ? (
          <div className="text-center py-6">
            <p className="font-body text-sm text-foreground font-medium">Report submitted</p>
            <p className="font-body text-xs text-foreground-muted mt-1">
              Our moderation team will review it shortly.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 rounded-xl bg-surface-raised text-foreground font-body text-sm hover:bg-border transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-1.5 mb-4">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className={`px-3 py-2 rounded-xl font-body text-xs text-left transition-colors border ${
                    reason === r.value
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border text-foreground-muted hover:text-foreground hover:border-border/80"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional: add more details…"
              rows={2}
              maxLength={500}
              className="w-full px-3 py-2 rounded-xl bg-surface-raised border border-border font-body text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-accent transition-colors resize-none mb-3"
            />

            {error && (
              <p className="font-body text-xs text-red-400 mb-3">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-xl bg-surface-raised text-foreground-muted font-body text-sm hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!reason || submitting}
                className="flex-1 py-2 rounded-xl bg-accent text-accent-foreground font-body text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Reporting…" : "Report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
