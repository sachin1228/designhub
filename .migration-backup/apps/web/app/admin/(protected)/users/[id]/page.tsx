"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Building2,
  MapPin,
  Layers,
  BarChart2,
  Calendar,
  Linkedin,
  Globe,
  ShieldOff,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface Profile {
  id: string;
  experience_level: string;
  companies: { name: string } | null;
  cities: { name: string } | null;
  design_sectors: { name: string } | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  is_blocked: boolean;
  created_at: string;
  application_id: string | null;
  designer_profiles: Profile | null;
}

interface Application {
  linkedin_url: string | null;
  portfolio_url: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatExperienceLevel(level: string) {
  return level
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${params.id}`);
      if (!res.ok) {
        router.push("/admin/users");
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setApplication(data.application ?? null);
    } catch {
      router.push("/admin/users");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  async function handleBlock() {
    if (!user) return;
    setActionLoading("block");
    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_blocked: !user.is_blocked }),
      });
      await fetchUser();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete() {
    if (!user) return;
    setActionLoading("delete");
    try {
      await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      router.push("/admin/users");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-5 w-5 text-foreground-muted" />
      </div>
    );
  }

  if (!user) return null;

  const profile = user.designer_profiles;

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <button
        onClick={() => router.push("/admin/users")}
        className="flex items-center gap-1.5 font-body text-sm text-foreground-muted hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        Back to Users
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            {user.name}
          </h1>
          <p className="font-body text-sm text-foreground-muted mt-0.5">
            {user.email}
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-body text-xs font-medium ${
            user.is_blocked
              ? "bg-red-500/10 text-red-400"
              : "bg-green-500/10 text-green-400"
          }`}
        >
          {user.is_blocked ? "Blocked" : "Active"}
        </span>
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-border bg-surface divide-y divide-border mb-6">
        <InfoRow icon={<Mail size={15} />} label="Email" value={user.email} />
        <InfoRow
          icon={<Calendar size={15} />}
          label="Joined"
          value={formatDate(user.created_at)}
        />
        <InfoRow
          icon={<Building2 size={15} />}
          label="Company"
          value={profile?.companies?.name ?? "—"}
        />
        <InfoRow
          icon={<MapPin size={15} />}
          label="City"
          value={profile?.cities?.name ?? "—"}
        />
        <InfoRow
          icon={<Layers size={15} />}
          label="Industry Sector"
          value={profile?.design_sectors?.name ?? "—"}
        />
        <InfoRow
          icon={<BarChart2 size={15} />}
          label="Experience Level"
          value={
            profile?.experience_level
              ? formatExperienceLevel(profile.experience_level)
              : "—"
          }
        />
        {application?.linkedin_url && (
          <InfoRow
            icon={<Linkedin size={15} />}
            label="LinkedIn"
            value={
              <a
                href={application.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline break-all"
              >
                {application.linkedin_url}
              </a>
            }
          />
        )}
        {application?.portfolio_url && (
          <InfoRow
            icon={<Globe size={15} />}
            label="Portfolio"
            value={
              <a
                href={application.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline break-all"
              >
                {application.portfolio_url}
              </a>
            }
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleBlock}
          disabled={!!actionLoading}
          className="flex items-center gap-2 rounded-md border border-border px-4 py-2 font-body text-sm text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-colors disabled:opacity-60"
        >
          {actionLoading === "block" ? (
            <Spinner className="h-4 w-4" />
          ) : user.is_blocked ? (
            <ShieldCheck size={15} />
          ) : (
            <ShieldOff size={15} />
          )}
          {user.is_blocked ? "Unblock User" : "Block User"}
        </button>

        <button
          onClick={() => setConfirmDelete(true)}
          disabled={!!actionLoading}
          className="flex items-center gap-2 rounded-md border border-red-800/40 px-4 py-2 font-body text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-60"
        >
          <Trash2 size={15} />
          Delete Account
        </button>
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl">
            <h2 className="font-display text-lg font-semibold text-foreground mb-1">
              Delete account?
            </h2>
            <p className="font-body text-sm text-foreground-muted mb-6">
              This will permanently remove{" "}
              <span className="font-medium text-foreground">{user.name}</span>{" "}
              ({user.email}) and all their data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-md border border-border py-2 font-body text-sm text-foreground-muted hover:bg-surface-raised transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!!actionLoading}
                className="flex-1 flex items-center justify-center gap-2 rounded-md bg-red-600 py-2 font-body text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {actionLoading === "delete" ? (
                  <Spinner className="h-4 w-4" />
                ) : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <span className="mt-0.5 text-foreground-muted shrink-0">{icon}</span>
      <span className="font-body text-sm text-foreground-muted w-36 shrink-0">
        {label}
      </span>
      <span className="font-body text-sm text-foreground">{value}</span>
    </div>
  );
}
