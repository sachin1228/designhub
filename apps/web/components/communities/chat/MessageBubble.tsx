"use client";

import { Fragment } from "react";
import { Clock, CheckCheck } from "lucide-react";
import { ChatAvatar } from "./ChatAvatar";
import { fmtTime } from "./chatUtils";
import type { CachedMessage, MessageReaction } from "@/lib/communities/cache";

interface MessageBubbleProps {
  msg: CachedMessage;
  isMe: boolean;
  isSameAuthor: boolean;
  isFirstUnread: boolean;
  unreadDivider: React.ReactNode;
  currentUserId: string;
  onPress: (msg: CachedMessage) => void;
}

function ReactionPills({
  reactions,
  currentUserId,
  isMe,
}: {
  reactions: MessageReaction[];
  currentUserId: string;
  isMe: boolean;
}) {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
      {reactions.map(({ emoji, user_ids }) => {
        const iMine = user_ids.includes(currentUserId);
        return (
          <span
            key={emoji}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-medium select-none
              ${iMine
                ? "bg-accent/30 border border-accent/60 text-accent-foreground"
                : "bg-surface-raised border border-white/10 text-foreground"
              }`}
          >
            {emoji}
            {user_ids.length > 1 && (
              <span className="text-[10px] opacity-70">{user_ids.length}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export function MessageBubble({
  msg,
  isMe,
  isSameAuthor,
  isFirstUnread,
  unreadDivider,
  currentUserId,
  onPress,
}: MessageBubbleProps) {
  const sender    = msg.users;
  const reactions = msg.reactions ?? [];

  if (isMe) {
    return (
      <Fragment>
        {unreadDivider}
        <div
          className={`flex flex-col items-end ${
            isSameAuthor && !isFirstUnread ? "mt-0.5" : "mt-3"
          }`}
        >
          <div className="max-w-[65%]">
            <div
              onClick={() => onPress(msg)}
              className={`rounded-2xl rounded-tr-sm px-3 pt-2 pb-1.5 cursor-pointer select-none
                active:scale-[0.97] transition-transform ${
                msg.status === "sending"
                  ? "bg-accent opacity-70"
                  : msg.status === "failed"
                  ? "bg-red-500/80"
                  : "bg-accent"
              }`}
            >
              <p className="font-body text-sm text-accent-foreground whitespace-pre-wrap break-words">
                {msg.content}
              </p>
              <div className="flex items-center justify-end gap-1 mt-1">
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
            <ReactionPills reactions={reactions} currentUserId={currentUserId} isMe />
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
          <div
            onClick={() => onPress(msg)}
            className="rounded-2xl rounded-tl-sm bg-surface-raised shadow-sm px-3 pt-2 pb-1.5 cursor-pointer select-none active:scale-[0.97] transition-transform"
          >
            <p className="font-body text-sm text-foreground whitespace-pre-wrap break-words">
              {msg.content}
            </p>
            <p className="font-mono text-[10px] text-foreground-muted text-right mt-1">
              {fmtTime(msg.created_at)}
            </p>
          </div>
          <ReactionPills reactions={reactions} currentUserId={currentUserId} isMe={false} />
        </div>
      </div>
    </Fragment>
  );
}
