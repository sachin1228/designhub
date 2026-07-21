"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, MessageSquare, ExternalLink } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface Member {
  id: string;
  name: string;
  email: string;
  joined_at: string;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_name: string;
}

interface Community {
  id: string;
  name: string;
  type: string;
  image_url: string | null;
  description: string | null;
  reference_id: string;
  reference_name: string | null;
  member_count: number;
  message_count: number;
  created_at: string;
  updated_at: string;
  members: Member[];
  messages: Message[];
}

const TYPE_LABELS: Record<string, string> = {
  city:             "City",
  sector:           "Industry",
  interest:         "Interest",
  company:          "Company",
  experience_level: "Experience",
};

const TYPE_EMOJI: Record<string, string> = {
  city:             "📍",
  sector:           "🏢",
  interest:         "✦",
  company:          "🏬",
  experience_level: "🎯",
};

const TYPE_COLORS: Record<string, string> = {
  city:             "bg-blue-500/10 text-blue-400 border-blue-500/20",
  sector:           "bg-purple-500/10 text-purple-400 border-purple-500/20",
  interest:         "bg-pink-500/10 text-pink-400 border-pink-500/20",
  company:          "bg-amber-500/10 text-amber-400 border-amber-500/20",
  experience_level: "bg-green-500/10 text-green-400 border-green-500/20",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3.5 border-b border-border last:border-0">
      <span className="w-40 shrink-0 font-body text-xs text-foreground-muted">{label}</span>
      <span className="font-body text-xs text-foreground">{value ?? "—"}</span>
    </div>
  );
}

export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/communities/${id}`)
      .then(async (r) => {
        if (!r.ok) { setError("Community not found."); return; }
        const d = await r.json();
        setCommunity(d.community);
      })
      .catch(() => setError("Failed to load community."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-5 w-5 text-foreground-muted" />
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="font-body text-sm text-foreground-muted">{error ?? "Community not found."}</p>
        <button
          onClick={() => router.push("/admin/communities")}
          className="font-body text-xs text-accent hover:underline"
        >
          Back to Communities
        </button>
      </div>
    );
  }

  const fallback = TYPE_EMOJI[community.type] ?? "💬";

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Back */}
      <button
        onClick={() => router.push("/admin/communities")}
        className="flex items-center gap-1.5 font-body text-xs text-foreground-muted hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft size={13} />
        Communities
      </button>

      {/* Header card */}
      <div className="rounded-xl border border-border bg-surface p-5 flex items-center gap-4">
        {community.image_url && !imgFailed ? (
          <img
            src={community.image_url}
            alt={community.name}
            className="h-16 w-16 rounded-full object-cover shrink-0"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-surface-raised flex items-center justify-center shrink-0 text-2xl select-none">
            {fallback}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-lg font-semibold text-foreground">{community.name}</h1>
          {community.description && (
            <p className="font-body text-xs text-foreground-muted mt-0.5 line-clamp-2">{community.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-body text-[11px] font-medium border ${
              TYPE_COLORS[community.type] ?? "bg-surface-raised text-foreground-muted border-border"
            }`}>
              {fallback} {TYPE_LABELS[community.type] ?? community.type}
            </span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-foreground-muted">
              <Users size={11} />
              {community.member_count.toLocaleString()} member{community.member_count !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-foreground-muted">
              <MessageSquare size={11} />
              {community.message_count.toLocaleString()} message{community.message_count !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="rounded-xl border border-border bg-surface px-5 py-1">
        <InfoRow label="Community ID"    value={<span className="font-mono text-[11px] text-foreground-muted">{community.id}</span>} />
        <InfoRow label="Type"            value={TYPE_LABELS[community.type] ?? community.type} />
        <InfoRow label="Linked to"       value={community.reference_name ?? <span className="text-foreground-muted">—</span>} />
        <InfoRow label="Members"         value={community.member_count.toLocaleString()} />
        <InfoRow label="Total messages"  value={community.message_count.toLocaleString()} />
        <InfoRow label="Created"         value={fmt(community.created_at)} />
        <InfoRow label="Last updated"    value={fmt(community.updated_at)} />
      </div>

      {/* Members */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="font-body text-xs font-semibold text-foreground">
            Members
            <span className="ml-2 font-mono text-[11px] text-foreground-muted font-normal">
              {community.member_count > 20
                ? `Showing 20 of ${community.member_count.toLocaleString()}`
                : `${community.member_count}`}
            </span>
          </h2>
        </div>

        {community.members.length === 0 ? (
          <p className="px-5 py-6 font-body text-xs text-foreground-muted">No members yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {community.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-5 py-3 hover:bg-surface-raised transition-colors">
                <div>
                  <button
                    onClick={() => router.push(`/admin/users/${m.id}`)}
                    className="font-body text-xs font-medium text-foreground hover:text-accent transition-colors flex items-center gap-1"
                  >
                    {m.name}
                    <ExternalLink size={10} className="text-foreground-muted" />
                  </button>
                  <p className="font-body text-[11px] text-foreground-muted">{m.email}</p>
                </div>
                <span className="font-body text-[11px] text-foreground-muted">
                  Joined {fmtDate(m.joined_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent messages */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="font-body text-xs font-semibold text-foreground">
            Recent Messages
            <span className="ml-2 font-mono text-[11px] text-foreground-muted font-normal">
              {community.message_count > 10
                ? `Showing last 10 of ${community.message_count.toLocaleString()}`
                : `${community.message_count}`}
            </span>
          </h2>
        </div>

        {community.messages.length === 0 ? (
          <p className="px-5 py-6 font-body text-xs text-foreground-muted">No messages yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {community.messages.map((msg) => (
              <div key={msg.id} className="px-5 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-body text-[11px] font-medium text-foreground">{msg.user_name}</span>
                  <span className="font-body text-[11px] text-foreground-muted">{fmt(msg.created_at)}</span>
                </div>
                <p className="font-body text-xs text-foreground-muted line-clamp-2">{msg.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
