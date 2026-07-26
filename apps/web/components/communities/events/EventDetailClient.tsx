"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Calendar, ExternalLink, Loader2,
  MapPin, MessageSquare, MoreHorizontal, Pencil, Send, Trash2, Users, Video,
} from "lucide-react";
import type { CommunityEvent, EventComment, EventRsvp } from "./types";
import { EditEventModal } from "./EditEventModal";

function fmtEventDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
  return `${date} • ${time}`;
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
}
function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
function isPast(iso: string) { return new Date(iso) < new Date(); }

function Avatar({ name, avatarUrl, size = "md" }: { name: string; avatarUrl: string | null; size?: "sm" | "md" | "lg" }) {
  const initial = name.charAt(0).toUpperCase();
  const dim = size === "sm" ? "h-6 w-6 text-[9px]" : size === "lg" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs";
  return (
    <div className={`${dim} shrink-0 overflow-hidden rounded-full bg-accent/15 flex items-center justify-center`}>
      {avatarUrl
        ? <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
        : <span className="font-display font-bold text-accent">{initial}</span>}
    </div>
  );
}

function AvatarStack({ rsvps, count }: { rsvps: EventRsvp[]; count: number }) {
  const visible = rsvps.slice(0, 5);
  const extra = count - visible.length;
  if (count === 0) return <span className="font-body text-sm text-foreground-subtle">0 going</span>;
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center">
        {visible.map((r, i) => (
          <div
            key={r.user_id}
            style={{ marginLeft: i === 0 ? 0 : "-8px", zIndex: 10 - i }}
            className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border-2 border-surface bg-accent/15 flex items-center justify-center"
          >
            {r.users?.avatar_url
              ? <img src={r.users.avatar_url} alt={r.users.name} className="h-full w-full object-cover" />
              : <span className="font-display text-[10px] font-bold text-accent">{(r.users?.name ?? "M").charAt(0).toUpperCase()}</span>}
          </div>
        ))}
      </div>
      <span className="font-body text-sm text-foreground-muted">
        {extra > 0 ? `+${extra} going` : `${count} going`}
      </span>
    </div>
  );
}

interface Props {
  event: CommunityEvent;
  initialRsvps: EventRsvp[];
  currentUserId: string;
  communityId: string;
  communityName: string;
}

export function EventDetailClient({ event: initialEvent, initialRsvps, currentUserId, communityId, communityName }: Props) {
  const router = useRouter();
  const [event, setEvent] = useState(initialEvent);
  const [rsvps, setRsvps] = useState<EventRsvp[]>(initialRsvps);
  const [rsvpPending, setRsvpPending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const [activeTab, setActiveTab] = useState<"discussion" | "attendees">("discussion");

  // Comments state
  const [comments, setComments] = useState<EventComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isOwner = event.user_id === currentUserId;
  const past = isPast(event.end_date ?? event.event_date);
  const full = event.max_attendees !== null && event.rsvp_count >= event.max_attendees && !event.user_rsvped;

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/communities/${communityId}/events/${event.id}/comments`);
      if (res.ok) {
        const d = await res.json();
        setComments(d.comments ?? []);
      }
    } finally {
      setCommentsLoading(false);
    }
  }, [communityId, event.id]);

  useEffect(() => { void fetchComments(); }, [fetchComments]);

  async function handleJoin() {
    if (rsvpPending || past) return;
    setRsvpPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/communities/${communityId}/events/${event.id}/rsvp`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to RSVP."); return; }
      setEvent((e) => ({ ...e, user_rsvped: data.rsvped, rsvp_count: data.rsvp_count }));
      const listRes = await fetch(`/api/communities/${communityId}/events/${event.id}/rsvp/list`);
      if (listRes.ok) { const d = await listRes.json(); setRsvps(d.rsvps ?? []); }
    } finally {
      setRsvpPending(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/events/${event.id}`, { method: "DELETE" });
      if (res.ok) router.push(`/dashboard/communities/${communityId}`);
    } finally {
      setDeleting(false);
    }
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: event.title, url }); } catch { /* dismissed */ }
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || posting) return;
    setPosting(true);
    setCommentError(null);
    try {
      const res = await fetch(`/api/communities/${communityId}/events/${event.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) { setCommentError(data.error ?? "Failed to post comment."); return; }
      setComments((prev) => [...prev, data.comment]);
      setCommentText("");
      textareaRef.current?.focus();
    } finally {
      setPosting(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    setDeletingCommentId(commentId);
    try {
      const res = await fetch(`/api/communities/${communityId}/events/${event.id}/comments/${commentId}`, { method: "DELETE" });
      if (res.ok) setComments((prev) => prev.filter((c) => c.id !== commentId));
    } finally {
      setDeletingCommentId(null);
    }
  }

  // Gradient placeholder
  const gradients = [
    "from-violet-500/80 to-pink-500/80",
    "from-blue-500/80 to-cyan-400/80",
    "from-orange-400/80 to-rose-500/80",
    "from-emerald-400/80 to-teal-500/80",
  ];
  const gradientIndex = event.id.charCodeAt(0) % gradients.length;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        {/* Back link */}
        <Link
          href={`/dashboard/communities/${communityId}`}
          className="mb-5 inline-flex items-center gap-1.5 font-body text-xs text-foreground-muted hover:text-foreground"
        >
          <ArrowLeft size={13} /> Back to {communityName}
        </Link>

        {/* Main card — horizontal layout */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="flex min-h-[200px]">
            {/* Cover image / gradient — left panel */}
            <div className="relative w-56 shrink-0 overflow-hidden">
              {event.cover_image_url ? (
                <img src={event.cover_image_url} alt={event.title} className="h-full w-full object-cover" />
              ) : (
                <div className={`h-full w-full bg-gradient-to-br ${gradients[gradientIndex]}`} />
              )}
            </div>

            {/* Content — right panel */}
            <div className="flex flex-1 flex-col gap-3 px-6 py-5 min-w-0">
              {/* Badge + action buttons */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 font-body text-[11px] font-medium ${
                  past ? "border-border text-foreground-subtle" : "border-accent/50 text-accent"
                }`}>
                  {past ? "Past Event" : "Upcoming Event"}
                </span>

                <div className="flex shrink-0 items-center gap-2">
                  {!past && (
                    <button
                      type="button"
                      onClick={handleJoin}
                      disabled={rsvpPending || (full && !event.user_rsvped)}
                      className={`rounded-lg px-4 py-1.5 font-body text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                        event.user_rsvped
                          ? "bg-accent/15 text-accent hover:bg-accent/25"
                          : full
                          ? "border border-border text-foreground-subtle"
                          : "bg-accent text-accent-foreground hover:bg-accent-hover"
                      }`}
                    >
                      {rsvpPending ? "Updating…" : event.user_rsvped ? "Going ✓" : full ? "Event Full" : "Join Event"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleShare}
                    className="rounded-lg border border-border px-4 py-1.5 font-body text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground"
                  >
                    {shared ? "Copied!" : "Share"}
                  </button>

                  {isOwner && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setMenuOpen((p) => !p)}
                        aria-label="Event options"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground-muted hover:bg-surface-raised hover:text-foreground"
                      >
                        <MoreHorizontal size={15} />
                      </button>
                      {menuOpen && (
                        <div className="absolute right-0 top-9 z-20 min-w-[140px] rounded-lg border border-border bg-surface py-1 shadow-lg">
                          <button type="button"
                            onClick={() => { setMenuOpen(false); setShowEditModal(true); }}
                            className="flex w-full items-center gap-2 px-3 py-2 font-body text-xs text-foreground-muted hover:bg-surface-raised hover:text-foreground">
                            <Pencil size={12} /> Edit event
                          </button>
                          <button type="button" onClick={handleDelete} disabled={deleting}
                            className="flex w-full items-center gap-2 px-3 py-2 font-body text-xs text-red-400 hover:bg-surface-raised disabled:opacity-50">
                            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            {deleting ? "Deleting…" : "Delete event"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <h1 className="font-display text-2xl font-bold leading-tight text-foreground">
                {event.title}
              </h1>

              {/* Description */}
              {event.description && (
                <p className="font-body text-sm leading-relaxed text-foreground-muted">
                  {event.description}
                </p>
              )}

              {/* Date + location */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                <span className="inline-flex items-center gap-1.5 font-body text-sm text-foreground-muted">
                  <Calendar size={13} className="shrink-0 text-accent" />
                  {fmtEventDateTime(event.event_date)}
                  {event.end_date && ` – ${fmtTime(event.end_date)}`}
                </span>
                {event.is_online ? (
                  <span className="inline-flex items-center gap-1.5 font-body text-sm text-foreground-muted">
                    <Video size={13} className="shrink-0" />
                    {event.meet_link ? (
                      <a href={event.meet_link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-accent hover:underline">
                        Online (Google Meet) <ExternalLink size={10} />
                      </a>
                    ) : "Online"}
                  </span>
                ) : event.location ? (
                  <span className="inline-flex items-center gap-1.5 font-body text-sm text-foreground-muted">
                    <MapPin size={13} className="shrink-0" />
                    {event.location}
                  </span>
                ) : null}
              </div>

              {/* Hosted by */}
              <p className="font-body text-sm text-foreground-muted">
                Hosted by{" "}
                <span className="font-semibold text-foreground">
                  {event.users?.name ?? "Community member"}
                </span>
              </p>

              {/* Avatar stack */}
              <AvatarStack rsvps={rsvps} count={event.rsvp_count} />

              {event.max_attendees && (
                <p className="font-body text-xs text-foreground-subtle">
                  {event.max_attendees - event.rsvp_count > 0
                    ? `${event.max_attendees - event.rsvp_count} spots remaining`
                    : "No spots remaining"}
                </p>
              )}

              {error && <p className="font-body text-xs text-red-400">{error}</p>}
            </div>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <div className="mt-6">
          {/* Tab bar */}
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => setActiveTab("discussion")}
              className={`inline-flex items-center gap-2 px-4 pb-3 font-body text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === "discussion"
                  ? "border-accent text-foreground"
                  : "border-transparent text-foreground-muted hover:text-foreground"
              }`}
            >
              <MessageSquare size={14} />
              Discussion
              {comments.length > 0 && (
                <span className="rounded-full bg-surface-raised px-1.5 py-0.5 font-body text-[10px] text-foreground-subtle">
                  {comments.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("attendees")}
              className={`inline-flex items-center gap-2 px-4 pb-3 font-body text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === "attendees"
                  ? "border-accent text-foreground"
                  : "border-transparent text-foreground-muted hover:text-foreground"
              }`}
            >
              <Users size={14} />
              Attendees
              {event.rsvp_count > 0 && (
                <span className="rounded-full bg-surface-raised px-1.5 py-0.5 font-body text-[10px] text-foreground-subtle">
                  {event.rsvp_count}
                </span>
              )}
            </button>
          </div>

          {/* ── Discussion tab ──────────────────────────────────── */}
          {activeTab === "discussion" && (
            <div className="mt-5 space-y-5">
              {/* Comment input */}
              <form onSubmit={handlePostComment} className="flex gap-3">
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        void handlePostComment(e as unknown as React.FormEvent);
                      }
                    }}
                    placeholder="Share your thoughts about this event…"
                    rows={3}
                    maxLength={2000}
                    className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 font-body text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                  />
                  {commentError && (
                    <p className="mt-1 font-body text-xs text-red-400">{commentError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={posting || !commentText.trim()}
                  className="self-end flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Post comment"
                >
                  {posting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                </button>
              </form>

              {/* Comments list */}
              {commentsLoading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-surface-raised shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-24 rounded bg-surface-raised" />
                        <div className="h-4 w-full rounded bg-surface-raised" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
                  <MessageSquare size={22} className="mx-auto text-foreground-subtle" />
                  <p className="mt-2 font-body text-sm text-foreground-muted">No comments yet. Be the first to start the discussion!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((c) => (
                    <div key={c.id} className="group flex gap-3">
                      <Avatar name={c.users?.name ?? "M"} avatarUrl={c.users?.avatar_url ?? null} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-body text-sm font-semibold text-foreground">
                            {c.users?.name ?? "Member"}
                          </span>
                          <span className="font-body text-[11px] text-foreground-subtle">
                            {fmtRelative(c.created_at)}
                          </span>
                          {c.user_id === currentUserId && (
                            <button
                              type="button"
                              onClick={() => void handleDeleteComment(c.id)}
                              disabled={deletingCommentId === c.id}
                              className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity font-body text-[11px] text-red-400 hover:text-red-300 disabled:opacity-50"
                            >
                              {deletingCommentId === c.id ? "Deleting…" : "Delete"}
                            </button>
                          )}
                        </div>
                        <p className="mt-1 font-body text-sm text-foreground-muted leading-relaxed whitespace-pre-wrap break-words">
                          {c.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Attendees tab ───────────────────────────────────── */}
          {activeTab === "attendees" && (
            <div className="mt-5">
              {rsvps.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
                  <Users size={22} className="mx-auto text-foreground-subtle" />
                  <p className="mt-2 font-body text-sm text-foreground-muted">
                    No attendees yet. Be the first to join!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {rsvps.map((r) => (
                    <div key={r.user_id} className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5">
                      <Avatar name={r.users?.name ?? "M"} avatarUrl={r.users?.avatar_url ?? null} size="sm" />
                      <span className="truncate font-body text-xs text-foreground">{r.users?.name ?? "Member"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <EditEventModal
          event={event}
          communityId={communityId}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updated) => { setEvent(updated); setShowEditModal(false); }}
        />
      )}
    </div>
  );
}
