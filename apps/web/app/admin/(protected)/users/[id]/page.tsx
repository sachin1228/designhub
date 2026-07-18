"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ShieldOff, ShieldCheck, Trash2, ExternalLink, Pencil, X, Check } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface Profile {
  experience_level: string;
  company_id: string | null;
  city_id: string | null;
  sector_id: string | null;
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

interface DropdownOption {
  id: string;
  name: string;
}

interface EditForm {
  name: string;
  email: string;
  company_id: string;
  city_id: string;
  sector_id: string;
  experience_level: string;
  linkedin_url: string;
  portfolio_url: string;
}

const EXPERIENCE_OPTIONS = [
  { value: "junior", label: "Junior (0–2 yrs)" },
  { value: "mid",    label: "Mid Level (2–5 yrs)" },
  { value: "senior", label: "Senior (5–10 yrs)" },
  { value: "lead",   label: "Lead / Principal" },
];

const EXPERIENCE_LABELS: Record<string, string> = Object.fromEntries(
  EXPERIENCE_OPTIONS.map((o) => [o.value, o.label])
);

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3.5 border-b border-border last:border-0">
      <span className="w-44 shrink-0 font-body text-sm text-foreground-muted">{label}</span>
      <span className="font-body text-sm text-foreground break-all">{value}</span>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-1.5 font-body text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/20";

const selectCls =
  "w-full rounded-md border border-border bg-background px-3 py-1.5 font-body text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/20";

function EditRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-2.5 border-b border-border last:border-0">
      <span className="w-44 shrink-0 font-body text-sm text-foreground-muted">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Dropdown data
  const [companies, setCompanies] = useState<DropdownOption[]>([]);
  const [cities, setCities] = useState<DropdownOption[]>([]);
  const [sectors, setSectors] = useState<DropdownOption[]>([]);
  const [dropdownsLoaded, setDropdownsLoaded] = useState(false);

  async function loadUser() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (!res.ok) { setError("User not found."); return; }
      const data = await res.json();
      setUser(data.user);
      setApplication(data.application ?? null);
    } catch {
      setError("Failed to load user.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUser(); }, [id]);

  useEffect(() => {
    if (dropdownsLoaded) return;
    Promise.all([
      fetch("/api/data/companies").then((r) => r.json()),
      fetch("/api/data/cities").then((r) => r.json()),
      fetch("/api/data/sectors").then((r) => r.json()),
    ]).then(([c, ci, s]) => {
      setCompanies(c.companies ?? []);
      setCities(ci.cities ?? []);
      setSectors(s.sectors ?? []);
      setDropdownsLoaded(true);
    });
  }, [dropdownsLoaded]);

  function startEditing() {
    if (!user) return;
    const p = user.designer_profiles;
    setEditForm({
      name: user.name,
      email: user.email,
      company_id: p?.company_id ?? "",
      city_id: p?.city_id ?? "",
      sector_id: p?.sector_id ?? "",
      experience_level: p?.experience_level ?? "",
      linkedin_url: application?.linkedin_url ?? "",
      portfolio_url: application?.portfolio_url ?? "",
    });
    setSaveError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setEditForm(null);
    setSaveError(null);
  }

  async function handleSave() {
    if (!user || !editForm) return;
    setActionLoading("save");
    setSaveError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          company_id: editForm.company_id || null,
          city_id: editForm.city_id || null,
          sector_id: editForm.sector_id || null,
          experience_level: editForm.experience_level || null,
          linkedin_url: editForm.linkedin_url || null,
          portfolio_url: editForm.portfolio_url || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.error ?? "Failed to save.");
        return;
      }
      setEditing(false);
      setEditForm(null);
      await loadUser();
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBlock() {
    if (!user) return;
    setActionLoading("block");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_blocked: !user.is_blocked }),
      });
      const data = await res.json();
      setUser((u) => u ? { ...u, is_blocked: data.user.is_blocked } : u);
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

  if (error || !user) {
    return (
      <div className="py-16 text-center font-body text-sm text-foreground-muted">
        {error ?? "User not found."}
      </div>
    );
  }

  const profile = user.designer_profiles;

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <button
        onClick={() => router.push("/admin/users")}
        className="mb-6 flex items-center gap-1.5 font-body text-sm text-foreground-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        Back to users
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">{user.name}</h1>
          <span className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[11px] font-medium ${
            user.is_blocked ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
          }`}>
            {user.is_blocked ? "Blocked" : "Active"}
          </span>
        </div>

        <div className="flex gap-2">
          {!editing ? (
            <>
              <button
                onClick={startEditing}
                disabled={!!actionLoading}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 font-body text-sm text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-colors disabled:opacity-50"
              >
                <Pencil size={13} />
                Edit
              </button>
              <button
                onClick={handleBlock}
                disabled={!!actionLoading}
                className={`flex items-center gap-2 rounded-md border px-3 py-1.5 font-body text-sm transition-colors disabled:opacity-50 ${
                  user.is_blocked
                    ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
                    : "border-border text-foreground-muted hover:text-red-400 hover:border-red-400/30"
                }`}
              >
                {actionLoading === "block" ? (
                  <Spinner className="h-3.5 w-3.5" />
                ) : user.is_blocked ? (
                  <ShieldCheck size={14} />
                ) : (
                  <ShieldOff size={14} />
                )}
                {user.is_blocked ? "Unblock" : "Block"}
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={!!actionLoading}
                className="flex items-center gap-2 rounded-md border border-red-500/30 px-3 py-1.5 font-body text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={cancelEditing}
                disabled={actionLoading === "save"}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 font-body text-sm text-foreground-muted hover:bg-surface-raised transition-colors disabled:opacity-50"
              >
                <X size={13} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={actionLoading === "save"}
                className="flex items-center gap-2 rounded-md bg-accent px-3 py-1.5 font-body text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {actionLoading === "save" ? <Spinner className="h-3.5 w-3.5" /> : <Check size={13} />}
                Save
              </button>
            </>
          )}
        </div>
      </div>

      {/* Save error */}
      {saveError && (
        <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2 font-body text-sm text-red-400">
          {saveError}
        </p>
      )}

      {/* Details card */}
      <div className="rounded-xl border border-border bg-surface px-6 py-1">
        {!editing ? (
          <>
            <InfoRow label="Name" value={user.name} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow
              label="Joined"
              value={new Date(user.created_at).toLocaleDateString("en-GB", {
                day: "numeric", month: "long", year: "numeric",
              })}
            />
            <InfoRow label="Company" value={profile?.companies?.name ?? "—"} />
            <InfoRow label="City" value={profile?.cities?.name ?? "—"} />
            <InfoRow label="Industry Sector" value={profile?.design_sectors?.name ?? "—"} />
            <InfoRow
              label="Experience Level"
              value={EXPERIENCE_LABELS[profile?.experience_level ?? ""] ?? profile?.experience_level ?? "—"}
            />
            <InfoRow
              label="LinkedIn"
              value={
                application?.linkedin_url ? (
                  <a href={application.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-accent hover:underline">
                    {application.linkedin_url}
                    <ExternalLink size={11} className="shrink-0" />
                  </a>
                ) : "—"
              }
            />
            <InfoRow
              label="Portfolio"
              value={
                application?.portfolio_url ? (
                  <a href={application.portfolio_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-accent hover:underline">
                    {application.portfolio_url}
                    <ExternalLink size={11} className="shrink-0" />
                  </a>
                ) : "—"
              }
            />
          </>
        ) : editForm ? (
          <>
            <EditRow label="Name">
              <input className={inputCls} value={editForm.name}
                onChange={(e) => setEditForm((f) => f ? { ...f, name: e.target.value } : f)} />
            </EditRow>
            <EditRow label="Email">
              <input type="email" className={inputCls} value={editForm.email}
                onChange={(e) => setEditForm((f) => f ? { ...f, email: e.target.value } : f)} />
            </EditRow>
            <EditRow label="Joined">
              <span className="font-mono text-[11px] text-foreground-muted">
                {new Date(user.created_at).toLocaleDateString("en-GB", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </span>
            </EditRow>
            <EditRow label="Company">
              <select className={selectCls} value={editForm.company_id}
                onChange={(e) => setEditForm((f) => f ? { ...f, company_id: e.target.value } : f)}>
                <option value="">— None —</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </EditRow>
            <EditRow label="City">
              <select className={selectCls} value={editForm.city_id}
                onChange={(e) => setEditForm((f) => f ? { ...f, city_id: e.target.value } : f)}>
                <option value="">— None —</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </EditRow>
            <EditRow label="Industry Sector">
              <select className={selectCls} value={editForm.sector_id}
                onChange={(e) => setEditForm((f) => f ? { ...f, sector_id: e.target.value } : f)}>
                <option value="">— None —</option>
                {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </EditRow>
            <EditRow label="Experience Level">
              <select className={selectCls} value={editForm.experience_level}
                onChange={(e) => setEditForm((f) => f ? { ...f, experience_level: e.target.value } : f)}>
                <option value="">— None —</option>
                {EXPERIENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </EditRow>
            <EditRow label="LinkedIn">
              <input type="url" className={inputCls} placeholder="https://linkedin.com/in/..."
                value={editForm.linkedin_url}
                onChange={(e) => setEditForm((f) => f ? { ...f, linkedin_url: e.target.value } : f)} />
            </EditRow>
            <EditRow label="Portfolio">
              <input type="url" className={inputCls} placeholder="https://..."
                value={editForm.portfolio_url}
                onChange={(e) => setEditForm((f) => f ? { ...f, portfolio_url: e.target.value } : f)} />
            </EditRow>
          </>
        ) : null}
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl">
            <h2 className="font-display text-lg font-semibold text-foreground mb-1">Delete account?</h2>
            <p className="font-body text-sm text-foreground-muted mb-6">
              This will permanently remove{" "}
              <span className="text-foreground font-medium">{user.name}</span>{" "}
              ({user.email}) and all their data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-md border border-border py-2 font-body text-sm text-foreground-muted hover:bg-surface-raised transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={!!actionLoading}
                className="flex-1 flex items-center justify-center gap-2 rounded-md bg-red-600 py-2 font-body text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-60">
                {actionLoading === "delete" ? <Spinner className="h-4 w-4" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
