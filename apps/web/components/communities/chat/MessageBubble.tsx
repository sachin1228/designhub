"use client";

import { Fragment } from "react";
import { Clock, CheckCheck } from "lucide-react";
import { ChatAvatar } from "./ChatAvatar";
import { fmtTime } from "./chatUtils";
import type { CachedMessage } from "@/lib/communities/cache";

interface MessageBubbleProps {
  msg: CachedMessage;
  isMe: boolean;
  isSameAuthor: boolean;
  isFirstUnread: boolean;
  unreadDivider: React.ReactNode;
}

export function MessageBubble({
  msg,
  isMe,
  isSameAuthor,
  isFirstUnread,
  unreadDivider,
}: MessageBubbleProps) {
  const sender = msg.users;

  if (isMe) {
    return (
      <Fragment>
        {unreadDivider}
        <div
          className={`flex justify-end ${
            isSameAuthor && !isFirstUnread ? "mt-0.5" : "mt-3"
          }`}
        >
          <div className="max-w-[65%]">
            <div
              className={`relative rounded-2xl rounded-tr-sm px-3 py-2 transition-opacity ${
                msg.status === "sending"
                  ? "bg-accent opacity-70"
                  : msg.status === "failed"
                  ? "bg-red-500/80"
                  : "bg-accent"
              }`}
            >
              {/*
                Invisible spacer at the end of the text reserves space for the
                timestamp row so it never overlaps the text (WhatsApp technique).
                w-14 = ~56px covers time + check icon + gap.
              */}
              <p className="font-body text-sm text-accent-foreground whitespace-pre-wrap break-words">
                {msg.content}
                <span className="inline-block w-14" aria-hidden="true" />
              </p>

              {/* timestamp + status — sits bottom-right inside the bubble */}
              <div className="absolute bottom-1.5 right-2.5 flex items-center gap-0.5">
                <span className="font-mono text-[10px] text-accent-foreground/60">
                  {fmtTime(msg.created_at)}
                </span>
                {msg.status === "sending" && (
                  <Clock size={10} className="text-accent-foreground/60 animate-pulse" />
                )}
                {(msg.status === "sent" || !msg.status) && (
                  <CheckCheck size={11} className="text-accent-foreground/70" />
                )}
                {msg.status === "failed" && (
                  <span className="text-[10px] text-red-200">!</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }

  return (
    <Fragment>
      {unreadDivider}
      <div
        className={`flex items-start gap-2 ${
          isSameAuthor && !isFirstUnread ? "mt-0.5" : "mt-3"
        }`}
      >
        <div className="w-7 shrink-0">
          {!isSameAuthor && sender && (
            <ChatAvatar name={sender.name} url={sender.avatar_url} size={7} />
          )}
        </div>
        <div className="max-w-[65%]">
          {!isSameAuthor && sender && (
            <p className="font-body text-[11px] font-medium text-foreground-muted mb-0.5 ml-0.5">
              {sender.name}
            </p>
          )}
          {/*
            Same spacer technique for received bubbles.
            w-10 = ~40px covers the time text only.
          */}
          <div className="relative rounded-2xl rounded-tl-sm bg-surface-raised shadow-sm px-3 py-2">
            <p className="font-body text-sm text-foreground whitespace-pre-wrap break-words">
              {msg.content}
              <span className="inline-block w-10" aria-hidden="true" />
            </p>
            <span className="absolute bottom-1.5 right-2.5 font-mono text-[10px] text-foreground-muted">
              {fmtTime(msg.created_at)}
            </span>
          </div>
        </div>
      </div>
    </Fragment>
  );
}
