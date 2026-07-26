"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Calendar, Clock, ExternalLink, Loader2,
  MapPin, MoreHorizontal, Pencil, Trash2, Users, Video,
} from "lucide-react";
import type { CommunityEvent, EventRsvp } from "./types";
import { EditEventModal } from "./EditEventModal";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
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

  const isOwner = event.user_id === currentUserId;
  const past = isPast(event.end_date ?? event.event_date);
  const full = event.max_attendees !== null && event.rsvp_count >= event.max_attendees && !event.user_rsvped;

  async function handleRsvp() {
    if (rsvpPending || past) return;
    setRsvpPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/communities/${communityId}/events/${event.id}/rsvp`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to RSVP."); return; }
      setEvent((e) => ({ ...e, user_rsvped: data.rsvped, rsvp_count: data.rsvp_count }));
      // Refresh RSVP list
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

        {/* Event card */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          {/* Date banner */}
          <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-raised px-5 py-3">
            <Calendar size={14} className="shrink-0 text-accent" />
            <span className="font-body text-sm font-medium text-foreground">{fmtDate(event.event_date)}</span>
            <span className="font-body text-sm text-foreground-muted flex items-center gap-1">
              <Clock size={12} /> {fmtTime(event.event_date)}
              {event.end_date && ` – ${fmtTime(event.end_date)}`}
            </span>
            {past && (
              <span className="ml-auto rounded-full border border-border px-2.5 py-0.5 font-body text-xs text-foreground-subtle">Past</span>
            )}
          </div>

          <div className="px-5 py-5">
            {/* Title + menu */}
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-display text-2xl font-bold leading-tight text-foreground">{event.title}</h1>
              {isOwner && (
                <div className="relative shrink-0">
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

            {/* Description */}
            {event.description && (
              <p className="mt-4 font-body text-sm leading-relaxed text-foreground-muted whitespace-pre-wrap">
                {event.description}
              </p>
            )}

            {/* Details grid */}
            <div className="mt-5 space-y-3">
              {/* Location / Online */}
              {event.is_online ? (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-raised">
                    <Video size={14} className="text-foreground-muted" />
                  </div>
                  <div>
                    <p className="font-body text-xs font-medium text-foreground">Online Event</p>
                    {event.meet_link && (
                      <a href={event.meet_link} target="_blank" rel="noopener noreferrer"
                        className="mt-0.5 inline-flex items-center gap-1 font-body text-xs text-accent hover:underline">
                        Join meeting <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ) : event.location ? (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-raised">
                    <MapPin size={14} className="text-foreground-muted" />
                  </div>
                  <div>
                    <p className="font-body text-xs font-medium text-foreground">Location</p>
                    <p className="mt-0.5 font-body text-xs text-foreground-muted">{event.location}</p>
                  </div>
                </div>
              ) : null}

              {/* Capacity */}
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-raised">
                  <Users size={14} className="text-foreground-muted" />
                </div>
                <div>
                  <p className="font-body text-xs font-medium text-foreground">Attendees</p>
                  <p className="mt-0.5 font-body text-xs text-foreground-muted">
                    {event.rsvp_count} going
                    {event.max_attendees ? ` · ${event.max_attendees - event.rsvp_count} spots left` : ""}
                  </p>
                </div>
              </div>

              {/* Organizer */}
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-raised">
                  <Avatar name={event.users?.name ?? "M"} avatarUrl={event.users?.avatar_url ?? null} size="sm" />
                </div>
                <div>
                  <p className="font-body text-xs font-medium text-foreground">Organized by</p>
                  <p className="mt-0.5 font-body text-xs text-foreground-muted">{event.users?.name ?? "Community member"}</p>
                </div>
              </div>
            </div>

            {/* RSVP button */}
            {!past && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleRsvp}
                  disabled={rsvpPending || (full && !event.user_rsvped)}
                  className={`w-full rounded-xl py-3 font-body text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    event.user_rsvped
                      ? "bg-accent/15 text-accent hover:bg-accent/25"
                      : full
                      ? "border border-border text-foreground-subtle"
                      : "bg-accent text-accent-foreground hover:bg-accent-hover"
                  }`}
                >
                  {rsvpPending
                    ? "Updating…"
                    : event.user_rsvped
                    ? "You're going ✓  (click to cancel)"
                    : full
                    ? "Event is full"
                    : "RSVP — I'm going"}
                </button>
                {error && <p className="mt-2 font-body text-xs text-red-400 text-center">{error}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Attendees */}
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
