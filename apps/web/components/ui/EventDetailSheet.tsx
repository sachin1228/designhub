"use client";

import { useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";
import { X, ArrowUpRight } from "lucide-react";
import type { CommunityEvent, EventRsvp } from "@/components/communities/events/types";
import { EventDetailClient } from "@/components/communities/events/EventDetailClient";

interface EventDetailSheetProps {
  event: CommunityEvent;
  initialRsvps: EventRsvp[];
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string | null;
  communityId: string;
  communityName: string;
}

export function EventDetailSheet(props: EventDetailSheetProps) {
  const router = useRouter();

  const close = useCallback(() => {
    router.back();
  }, [router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [close]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={close}
        aria-hidden="true"
      />

      {/* Sheet panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-border bg-background shadow-2xl animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Sheet header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
          <span className="font-body text-sm text-foreground-muted">Event</span>
          <div className="flex items-center gap-1">
            {/* Open full page */}
            <a
              href={`/dashboard/events/${props.event.id}`}
              className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-subtle transition-colors hover:bg-surface-raised hover:text-foreground"
              title="Open full page"
              onClick={(e) => e.stopPropagation()}
            >
              <ArrowUpRight size={15} />
            </a>
            {/* Close */}
            <button
              type="button"
              onClick={close}
              className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-subtle transition-colors hover:bg-surface-raised hover:text-foreground"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable event detail */}
        <div className="flex-1 overflow-y-auto">
          <EventDetailClient {...props} />
        </div>
      </div>
    </>
  );
}
