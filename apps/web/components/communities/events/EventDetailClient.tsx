"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Calendar, Clock, ExternalLink, Loader2,
  MapPin, MoreHorizontal, Pencil, Share2, Trash2, Users, Video,
} from "lucide-react";
import type { CommunityEvent, EventRsvp } from "./types";
import { EditEventModal } from "./EditEventModal";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
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
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center">
        {visible.map((r, i) => (
          <div
            key={r.user_id}
            style={{ marginLeft: i === 0 ? 0 : "-8px", zIndex: 10 - i }}
            className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-surface bg-accent/15 flex items-center justify-center"
          >
            {r.users?.avatar_url
              ? <img src={r.users.avatar_url} alt={r.users.name} className="h-full w-full object-cover" />
              : <span className="font-display text-[10px] font-bold text-accent">{(r.users?.name ?? "M").charAt(0).toUpperCase()}</span>}
          </div>
        ))}
      </div>
      <span className="font-body text-sm text-foreground-muted">
        {extra > 0 ? `+${extra} going` : count > 0 ? `${count} going` : "0 going"}
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

  const isOwner = event.user_id === currentUserId;
  const past = isPast(event.end_date ?? event.event_date);
  const full = event.max_attendees !== null && event.rsvp_count >= event.max_attendees && !event.user_rsvped;

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

        {/* Hero card */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          {/* Cover image / gradient */}
          <div className="relative h-56 w-full overflow-hidden border-b border-border">
            {event.cover_image_url ? (
              <img src={event.cover_image_url} alt={event.title} className="h-full w-full object-cover" />
            ) : (
              <div className={`h-full w-full bg-gradient-to-br ${gradients[gradientIndex]}`} />
            )}
          </div>

          <div className="px-6 py-5">
            {/* Badge + action buttons row */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-body text-[11px] font-medium ${
                past ? "border-border text-foreground-subtle" : "border-accent/50 text-accent"
              }`}>
                {past ? "Past Event" : "Upcoming Event"}
              </span>

              <div className="flex items-center gap-2">
                {!past && (
                  <button
                    type="button"
                    onClick={handleJoin}
                    disabled={rsvpPending || (full && !event.user_rsvped)}
                    className={`rounded-lg px-4 py-2 font-body text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
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
                  className="rounded-lg border border-border px-4 py-2 font-body text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground"
                >
                  {shared ? "Copied!" : "Share"}
                </button>

                {isOwner && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMenuOpen((p) => !p)}
                      aria-label="Event options"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground-muted hover:bg-surface-raised hover:text-foreground"
                    >
                      <MoreHorizontal size={15} />
                    </button>
                    {menuOpen && (
                      <div className="absolute right-0 top-10 z-20 min-w-[140px] rounded-lg border border-border bg-surface py-1 shadow-lg">
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
            <h1 className="mt-3 font-display text-2xl font-bold leading-tight text-foreground">
              {event.title}
            </h1>

            {/* Description */}
            {event.description && (
              <p className="mt-2 font-body text-sm leading-relaxed text-foreground-muted whitespace-pre-wrap">
                {event.description}
              </p>
            )}

            {/* Date + Location row */}
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="inline-flex items-center gap-2 font-body text-sm text-foreground-muted">
                <Calendar size={14} className="shrink-0 text-accent" />
                {fmtDate(event.event_date)} • {fmtTime(event.event_date)}
                {event.end_date && ` – ${fmtTime(event.end_date)}`}
              </span>

              {event.is_online ? (
                <span className="inline-flex items-center gap-2 font-body text-sm text-foreground-muted">
                  <Video size={14} className="shrink-0" />
                  {event.meet_link ? (
                    <a href={event.meet_link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-accent hover:underline">
                      Online (Google Meet) <ExternalLink size={11} />
                    </a>
                  ) : "Online"}
                </span>
              ) : event.location ? (
                <span className="inline-flex items-center gap-2 font-body text-sm text-foreground-muted">
                  <MapPin size={14} className="shrink-0" />
                  {event.location}
                </span>
              ) : null}
            </div>

            {/* Hosted by */}
            <p className="mt-4 font-body text-sm text-foreground-muted">
              Hosted by{" "}
              <span className="font-medium text-foreground">
                {event.users?.name ?? "Community member"}
              </span>
            </p>

            {/* Attendee avatar stack */}
            {event.rsvp_count > 0 && (
              <div className="mt-3">
                <AvatarStack rsvps={rsvps} count={event.rsvp_count} />
              </div>
            )}

            {error && <p className="mt-3 font-body text-xs text-red-400">{error}</p>}

            {/* Capacity note */}
            {event.max_attendees && (
              <p className="mt-2 font-body text-xs text-foreground-subtle">
                {event.max_attendees - event.rsvp_count > 0
                  ? `${event.max_attendees - event.rsvp_count} spots remaining`
                  : "No spots remaining"}
              </p>
            )}
          </div>
        </div>

        {/* Attendees grid */}
        {rsvps.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 font-body text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
              Going ({rsvps.length})
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {rsvps.map((r) => (
                <div key={r.user_id} className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2">
                  <Avatar name={r.users?.name ?? "M"} avatarUrl={r.users?.avatar_url ?? null} size="sm" />
                  <span className="truncate font-body text-xs text-foreground">{r.users?.name ?? "Member"}</span>
                </div>
              ))}
            </div>
          </section>
        )}
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
