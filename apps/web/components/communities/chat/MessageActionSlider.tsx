"use client";

import { useEffect, useRef } from "react";
import { Reply, Copy } from "lucide-react";
import type { CachedMessage } from "@/lib/communities/cache";

interface MessageActionSliderProps {
  message: CachedMessage | null;
  isMe: boolean;
  onClose: () => void;
  onReply: (msg: CachedMessage) => void;
  onCopy: (msg: CachedMessage) => void;
}

const REACTIONS = [
  { emoji: "❤️", label: "Love",    bg: "bg-red-500" },
  { emoji: "👍", label: "Like",    bg: "bg-green-500" },
  { emoji: "👎", label: "Dislike", bg: "bg-orange-500" },
  { emoji: "😮", label: "Wow",     bg: "bg-purple-500" },
  { emoji: "🔥", label: "Fire",    bg: "bg-blue-500" },
];

export function MessageActionSlider({
  message,
  isMe,
  onClose,
  onReply,
  onCopy,
}: MessageActionSliderProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (message) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [message]);

  const isOpen = !!message;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 z-40 transition-all duration-300 ${
          isOpen
            ? "bg-black/50 backdrop-blur-[2px] pointer-events-auto"
            : "bg-transparent pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`absolute inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Message actions"
      >
        <div className="bg-[#111113] rounded-t-3xl border-t border-white/10 shadow-2xl pb-safe">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Message preview */}
          {message && (
            <div className="px-5 py-3 border-b border-white/[0.06]">
              <p className="font-body text-xs text-foreground-muted line-clamp-2">
                {message.content}
              </p>
            </div>
          )}

          {/* Emoji reactions */}
          <div className="flex items-center justify-around px-6 py-5">
            {REACTIONS.map(({ emoji, label, bg }) => (
              <button
                key={label}
                onClick={() => {
                  // Reaction handler — will be wired dynamically later
                  onClose();
                }}
                className={`${bg} w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg
                  active:scale-90 hover:scale-110 transition-transform duration-150`}
                aria-label={label}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Action rows */}
          <div className="mx-4 mb-4 rounded-2xl bg-white/[0.06] overflow-hidden divide-y divide-white/[0.06]">
            {/* Reply */}
            <button
              className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-white/[0.05] active:bg-white/10 transition-colors"
              onClick={() => {
                if (message) onReply(message);
                onClose();
              }}
            >
              <Reply size={18} className="text-foreground-muted shrink-0" />
              <span className="font-body text-sm text-foreground">Reply</span>
            </button>

            {/* Copy */}
            <button
              className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-white/[0.05] active:bg-white/10 transition-colors"
              onClick={() => {
                if (message) onCopy(message);
                onClose();
              }}
            >
              <Copy size={18} className="text-foreground-muted shrink-0" />
              <span className="font-body text-sm text-foreground">Copy</span>
            </button>
          </div>

          {/* Safe-area spacer for mobile */}
          <div className="h-2" />
        </div>
      </div>
    </>
  );
}
