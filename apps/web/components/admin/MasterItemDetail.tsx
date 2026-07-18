"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Check, X, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface MasterItem {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface MasterItemDetailProps {
  /** e.g. "Company" */
  entity: string;
  /** e.g. /api/admin/companies */
  apiBase: string;
  /** e.g. /admin/companies */
  listPath: string;
  /** Key in the API response, e.g. "company" */
  responseKey: string;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-border last:border-0">
      <span className="w-36 shrink-0 font-body text-xs text-foreground-muted">{label}</span>
      <span className="font-body text-xs text-foreground">{value}</span>
    </div>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function MasterItemDetail({ entity, apiBase, listPath, responseKey }: MasterItemDetailProps) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [item, setItem] = useState<MasterItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Toggle
  const [toggleLoading, setToggleLoading] = useState(false);

  // Delete
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/${id}`);
        if (!res.ok) { setError(`${entity} not found.`); return; }
        const data = await res.json();
        setItem(data[responseKey]);
      } catch {
        setError("Failed to load.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, apiBase, entity, responseKey]);

  async function handleEditSave() {
    const trimmed = editName.trim();
    if (!trimmed) { setEditError("Name cannot be empty."); return; }
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await fetch(`${apiBase}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error ?? "Failed to save."); return; }
      setItem(data[responseKey]);
      setEditing(false);
    } catch {
      setEditError("Network error.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleToggle() {
    if (!item) return;
    setToggleLoading(true);
    try {
      const res = await fetch(`${apiBase}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !item.is_active }),
      });
      const data = await res.json();
      if (res.ok) setItem(data[responseKey]);
    } finally {
      setToggleLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${apiBase}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.error ?? "Failed to delete."); setDeleteLoading(false); return; }
      router.push(listPath);
    } catch {
      setDeleteError("Network error.");
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-24"><Spinner className="h-5 w-5 text-foreground-muted" /></div>;
  }

  if (error || !item) {
    return <div className="py-16 text-center font-body text-sm text-foreground-muted">{error ?? `${entity} not found.`}</div>;
  }

  return (
    <div className="max-w-xl">
      {/* Back */}
      <button
        onClick={() => router.push(listPath)}
        className="mb-6 flex items-center gap-1.5 font-body text-xs text-foreground-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft size={13} />
        Back to {entity.toLowerCase()}s
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={editName}
                onChange={(e) => { setEditName(e.target.value); setEditError(null); }}
                autoFocus
                className="rounded-lg border border-accent bg-surface px-3 py-2 font-display text-xl font-semibold text-foreground outline-none focus:ring-1 focus:ring-accent/30 flex-1 min-w-0"
              />
              <button
                onClick={handleEditSave}
                disabled={editLoading}
                className="text-green-400 hover:text-green-300 transition-colors shrink-0"
                aria-label="Save"
              >
                {editLoading ? <Spinner className="h-4 w-4" /> : <Check size={18} />}
              </button>
              <button
                onClick={() => { setEditing(false); setEditError(null); }}
                className="text-foreground-muted hover:text-foreground transition-colors shrink-0"
                aria-label="Cancel"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <h1 className="font-display text-2xl font-semibold text-foreground truncate">{item.name}</h1>
          )}
        </div>

        {/* Status badge */}
        {!editing && (
          <span className={`ml-3 shrink-0 inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ${
            item.is_active ? "bg-green-500/10 text-green-400" : "bg-surface-raised text-foreground-muted"
          }`}>
            {item.is_active ? "Active" : "Inactive"}
          </span>
        )}
      </div>

      {editError && (
        <p className="mb-4 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 font-body text-xs text-red-400">
          {editError}
        </p>
      )}

      {/* Info card */}
      <div className="rounded-xl border border-border bg-surface px-5 mb-6">
        <InfoRow label="Name" value={item.name} />
        <InfoRow label="Status" value={
          <span className={`font-medium ${item.is_active ? "text-green-400" : "text-foreground-muted"}`}>
            {item.is_active ? "Active" : "Inactive"}
          </span>
        } />
        <InfoRow label="Created" value={fmt(item.created_at)} />
        <InfoRow label="Last updated" value={fmt(item.updated_at)} />
      </div>

      {/* Actions */}
      <div className="rounded-xl border border-border bg-surface divide-y divide-border">
        {/* Edit */}
        <div className="flex items-center justify-between px-5 py-3.5">
          <div>
            <p className="font-body text-xs font-medium text-foreground">Rename {entity}</p>
            <p className="font-body text-[11px] text-foreground-muted mt-0.5">Update the display name</p>
          </div>
          <button
            onClick={() => { setEditing(true); setEditName(item.name); }}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-body text-xs text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-colors"
          >
            <Pencil size={12} />
            Edit
          </button>
        </div>

        {/* Toggle active */}
        <div className="flex items-center justify-between px-5 py-3.5">
          <div>
            <p className="font-body text-xs font-medium text-foreground">
              {item.is_active ? `Deactivate ${entity}` : `Activate ${entity}`}
            </p>
            <p className="font-body text-[11px] text-foreground-muted mt-0.5">
              {item.is_active
                ? "Hide from dropdowns — existing profiles keep their reference"
                : "Make available again in dropdowns"}
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={toggleLoading}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-body text-xs font-medium transition-colors disabled:opacity-60 ${
              item.is_active
                ? "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                : "border-green-500/30 text-green-400 hover:bg-green-500/10"
            }`}
          >
            {toggleLoading
              ? <Spinner className="h-3 w-3" />
              : item.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            {item.is_active ? "Deactivate" : "Activate"}
          </button>
        </div>

        {/* Delete */}
        <div className="flex items-center justify-between px-5 py-3.5">
          <div>
            <p className="font-body text-xs font-medium text-red-400">Delete {entity}</p>
            <p className="font-body text-[11px] text-foreground-muted mt-0.5">
              Permanently removed. Blocked if linked to a designer profile.
            </p>
          </div>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 rounded-md border border-red-500/30 px-3 py-1.5 font-body text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <h2 className="font-display text-base font-semibold text-foreground mb-1">
              Delete &ldquo;{item.name}&rdquo;?
            </h2>
            <p className="font-body text-xs text-foreground-muted mb-5">
              This is permanent and cannot be undone. If any designer profile references this{" "}
              {entity.toLowerCase()}, the delete will be blocked — deactivate it instead.
            </p>
            {deleteError && (
              <p className="mb-4 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 font-body text-xs text-red-400">
                {deleteError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setConfirmDelete(false); setDeleteError(null); }}
                className="flex-1 rounded-md border border-border py-2 font-body text-xs text-foreground-muted hover:bg-surface-raised transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-red-600 py-2 font-body text-xs font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {deleteLoading ? <Spinner className="h-3 w-3" /> : <Trash2 size={12} />}
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
