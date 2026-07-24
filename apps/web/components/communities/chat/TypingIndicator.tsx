"use client";

import type { TypingUser } from "./useTypingPresence";
import { ChatAvatar } from "./ChatAvatar";

function typingLabel(users: TypingUser[]) {
  if (users.length === 1) return users[0].name;
  if (users.length === 2) return `${users[0].name} & ${users[1].name}`;
  return `${users[0].name} & ${users.length - 1} others`;
}

export function TypingIndicator({ users }: { users: TypingUser[] }) {
  if (users.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="flex items-end gap-2 px-5 mt-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {/* Avatar */}
      <div className="w-7 shrink-0">
        <ChatAvatar name={users[0].name} url={null} size={7} />
      </div>

      <div>
        {/* Sender name */}
        <p className="font-body text-[11px] font-medium text-foreground-muted mb-0.5 ml-0.5">
          {typingLabel(users)}
        </p>

        {/* Bubble with bouncing dots */}
        <div className="inline-flex items-center gap-1.5 bg-surface-raised rounded-2xl px-4 py-3 shadow-sm">
          <span className="h-2 w-2 animate-bounce rounded-full bg-foreground-muted/70 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-foreground-muted/70 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-foreground-muted/70" />
        </div>
      </div>
    </div>
  );
}
