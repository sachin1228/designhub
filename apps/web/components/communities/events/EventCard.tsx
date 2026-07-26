"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Calendar, Clock, MapPin, MoreHorizontal, Pencil, Trash2, Users, Video } from "lucide-react";
import type { CommunityEvent } from "./types";
import { EditEventModal } from "./EditEventModal";

function fmtEventDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
function fmtEventTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function isPast(iso: string) {
  return new Date(iso) < new Date();
}

interface EventCardProps {
  event: CommunityEvent;
  currentUserId: string;
  communityId: string;
  onUpdated: (event: CommunityEvent) => void;
  onDeleted: (eventId: string) => void;
  onRsvpChanged: (eventId: string, rsvped: boolean, count: number) => void;
}

export function EventCard({ event, currentUserId, communityId, onUpdated, onDeleted, onRsvpChanged }: EventCardProps) {
  const isOwner = event.user_id === currentUserId;
  const past = isPast(event.end_date ?? event.event_date);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [rsvpPending, setRsvpPending] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm("Delete this event? This cannot be undone.")) return;
    setDeleting(true);
    setMenuOpen(false);
    try {
      const res = await fetch(`/api/communities/${communityId}/events/${event.id}`, { method: "DELETE" });
      if (res.ok) onDeleted(event.id);
    } finally {
      setDeleting(false);
    }
  }

  async function handleRsvp(e: React.MouseEvent) {
    e.preventDefault();
    if (rsvpPending || past) return;
    const newRsvped = !event.user_rsvped;
    const newCount = event.rsvp_count + (newRsvped ? 1 : -1);
    onRsvpChanged(event.id, newRsvped, newCount);
    setRsvpPending(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/events/${event.id}/rsvp`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        onRsvpChanged(event.id, data.rsvped, data.rsvp_count);
      } else {
        // rollback
        onRsvpChanged(event.id, event.user_rsvped, event.rsvp_count);
      }
    } catch {
      onRsvpChanged(event.id, event.user_rsvped, event.rsvp_count);
    } finally {
      setRsvpPending(false);
    }
  }

  const authorName = event.users?.name ?? "Member";
  const authorInitial = authorName.charAt(0).toUpperCase();
  const eventHref = `/dashboard/communities/${communityId}/events/${event.id}`;
  const full = event.max_attendees !== null && event.rsvp_count >= event.max_attendees && !event.user_rsvped;

  return (
    <>
      <article className="group rounded-xl border border-border bg-surface overflow-hidden">
        <Link href={eventHref} className="block">
          {/* Cover image */}
          {event.cover_image_url && (
            <div className="h-36 w-full overflow-hidden border-b border-border">
              <img src={event.cover_image_url} alt={event.title} className="h-full w-full object-cover" />
            </div>
          )}
          {/* Date banner */}
          <div className="flex items-center gap-3 border-b border-border bg-surface-raised px-4 py-2.5">
            <Calendar size={13} className="shrink-0 text-accent" />
            <span className="font-body text-xs font-medium text-foreground">
              {fmtEventDate(event.event_date)}
            </span>
            <span className="font-body text-xs text-foreground-muted flex items-center gap-1">
              <Clock size={11} /> {fmtEventTime(event.event_date)}
              {event.end_date && ` – ${fmtEventTime(event.end_date)}`}
            </span>
            {past && (
              <span className="ml-auto rounded-full border border-border px-2 py-0.5 font-body text-[10px] text-foreground-subtle">
                Past
              </span>
            )}
          </div>

          {/* Body */}
          <div className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-sm font-semibold leading-snug text-foreground">
                {event.title}
              </h3>
              {/* Owner menu */}
              {isOwner && (
                <div
                  ref={menuRef}
                  className="relative shrink-0"
                  onClick={(e) => e.preventDefault()}
                >
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setMenuOpen((p) => !p); }}
                    aria-label="Event options"
                    className="flex h-6 w-6 items-center justify-center rounded-md text-foreground-subtle opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface-raised hover:text-foreground focus:opacity-100"
                  >
                    <MoreHorizontal size={13} />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-7 z-20 min-w-[130px] rounded-lg border border-border bg-surface py-1 shadow-lg">
                      <button type="button"
                        onClick={(e) => { e.preventDefault(); setMenuOpen(false); setShowEditModal(true); }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 font-body text-xs text-foreground-muted hover:bg-surface-raised hover:text-foreground">
                        <Pencil size={11} /> Edit event
                      </button>
                      <button type="button" onClick={handleDelete} disabled={deleting}
                        className="flex w-full items-center gap-2 px-3 py-1.5 font-body text-xs text-red-400 hover:bg-surface-raised disabled:opacity-50">
                        <Trash2 size={11} /> {deleting ? "Deleting…" : "Delete event"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {event.description && (
              <p className="mt-1 line-clamp-2 font-body text-xs text-foreground-muted">{event.description}</p>
            )}

            {/* Location / online */}
            <div className="mt-2 flex items-center gap-1.5">
              {event.is_online ? (
                <span className="inline-flex items-center gap-1 font-body text-[11px] text-foreground-muted">
                  <Video size={11} /> Online
                </span>
              ) : event.location ? (
                <span className="inline-flex items-center gap-1 font-body text-[11px] text-foreground-muted">
                  <MapPin size={11} /> {event.location}
                </span>
              ) : null}
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/15">
                  {event.users?.avatar_url ? (
                    <img src={event.users.avatar_url} alt={authorName} className="h-4 w-4 object-cover" />
                  ) : (
                    <span className="font-display text-[8px] font-bold text-accent">{authorInitial}</span>
                  )}
                </div>
                <span className="font-body text-[11px] text-foreground-muted">{authorName}</span>
                <span className="font-body text-[11px] text-foreground-subtle">·</span>
                <span className="inline-flex items-center gap-1 font-body text-[11px] text-foreground-subtle">
                  <Users size={10} /> {event.rsvp_count} going
                  {event.max_attendees ? ` / ${event.max_attendees}` : ""}
                </span>
              </div>

              {/* RSVP button */}
              <button
                type="button"
                onClick={handleRsvp}
                disabled={rsvpPending || (full && !event.user_rsvped) || past}
                className={`rounded-lg px-3 py-1.5 font-body text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  event.user_rsvped
                    ? "bg-accent/15 text-accent hover:bg-accent/25"
                    : full || past
                    ? "border border-border text-foreground-subtle"
                    : "bg-accent text-accent-foreground hover:bg-accent-hover"
                }`}
              >
                {past ? "Ended" : event.user_rsvped ? "Going ✓" : full ? "Full" : "RSVP"}
              </button>
            </div>
          </div>
        </Link>
      </article>

      {showEditModal && (
        <EditEventModal
          event={event}
          communityId={communityId}
          onClose={() => setShowEditModal(false)}
          onUpdated={onUpdated}
        />
      )}
    </>
  );
}
