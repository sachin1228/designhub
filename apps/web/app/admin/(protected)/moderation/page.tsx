"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, ShieldX, Clock, Users, AlertTriangle, Ban,
  MessageSquare, ImageIcon, Flag, ScrollText, Settings,
} from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface Stats {
  total_users: number;
  messages_today: number;
  images_uploaded: number;
  approved_content: number;
  rejected_content: number;
  review_content: number;
  warned_users: number;
  banned_users: number;
  pending_reports: number;
}

function StatCard({
  label, value, icon: Icon, href, accent,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  href?: string;
  accent?: string;
}) {
  const inner = (
    <div className="flex items-start justify-between p-4 rounded-xl bg-surface border border-border hover:border-accent/40 transition-colors">
      <div>
        <p className="font-body text-xs text-foreground-muted">{label}</p>
        <p className={`font-display text-2xl font-semibold mt-1 ${accent ?? "text-foreground"}`}>
          {value}
        </p>
      </div>
      <span className={`p-2 rounded-lg bg-surface-raised ${accent ? "text-accent" : "text-foreground-muted"}`}>
        <Icon size={18} />
      </span>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

const QUICK_LINKS = [
  { href: "/admin/moderation/queue",     icon: Clock,        label: "Review Queue",    desc: "Messages & images awaiting review" },
  { href: "/admin/moderation/users",     icon: Users,        label: "User Moderation", desc: "Warn, mute, or ban users" },
  { href: "/admin/moderation/reports",   icon: Flag,         label: "Reports",         desc: "User-submitted content reports" },
  { href: "/admin/moderation/audit-log", icon: ScrollText,   label: "Audit Log",       desc: "All moderator actions" },
  { href: "/admin/moderation/settings",  icon: Settings,     label: "Settings",        desc: "Configure moderation thresholds" },
];

export default function ModerationDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/moderation/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-foreground">Moderation</h1>
        <p className="font-body text-xs text-foreground-muted mt-0.5">
          AI-powered content moderation dashboard
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label="Total Users"       value={stats?.total_users ?? 0}      icon={Users}        />
            <StatCard label="Messages Today"    value={stats?.messages_today ?? 0}    icon={MessageSquare} />
            <StatCard label="Images Uploaded"   value={stats?.images_uploaded ?? 0}   icon={ImageIcon}    />
            <StatCard label="Approved"          value={stats?.approved_content ?? 0}  icon={ShieldCheck}  accent="text-green-400" />
            <StatCard label="Rejected"          value={stats?.rejected_content ?? 0}  icon={ShieldX}      accent="text-red-400"   />
            <StatCard label="Under Review"      value={stats?.review_content ?? 0}    icon={Clock}        href="/admin/moderation/queue" accent="text-yellow-400" />
            <StatCard label="Warned Users"      value={stats?.warned_users ?? 0}      icon={AlertTriangle} href="/admin/moderation/users" />
            <StatCard label="Banned Users"      value={stats?.banned_users ?? 0}      icon={Ban}          href="/admin/moderation/users" accent="text-red-400" />
            <StatCard label="Pending Reports"   value={stats?.pending_reports ?? 0}   icon={Flag}         href="/admin/moderation/reports" accent={stats?.pending_reports ? "text-yellow-400" : undefined} />
          </div>

          {/* Quick nav */}
          <div>
            <h2 className="font-body text-xs font-semibold text-foreground-muted uppercase tracking-wide mb-3">
              Quick Access
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_LINKS.map(({ href, icon: Icon, label, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border hover:border-accent/40 transition-colors group"
                >
                  <span className="p-2 rounded-lg bg-surface-raised text-foreground-muted group-hover:text-accent transition-colors">
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className="font-body text-sm font-medium text-foreground">{label}</p>
                    <p className="font-body text-xs text-foreground-muted">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
