"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Pencil, Plus, ToggleLeft, ToggleRight, Check, X, Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

export interface MasterItem {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

interface MasterDataPageProps {
  title: string;
  /** e.g. "company", "city", "sector" */
  entity: string;
  apiBase: string; // e.g. /api/admin/companies
}

export function MasterDataPage({ title, entity, apiBase }: MasterDataPageProps) {
  const [items, setItems] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const modalInputRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}?all=${showAll}`);
      if (!res.ok) { setItems([]); return; }
      const data = await res.json();
      const rows: MasterItem[] = data.companies ?? data.cities ?? data.sectors ?? [];
      setItems(rows);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [apiBase, showAll]);

  useEffect(() => { load(); }, [load]);

  // Focus input when modal opens
  useEffect(() => {
    if (modalOpen) {
      setTimeout(() => modalInputRef.current?.focus(), 50);
    }
  }, [modalOpen]);

  function openModal() {
    setAddName("");
    setAddError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setAddName("");
    setAddError(null);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = addName.trim();
    if (!trimmed) {
      setAddError("Name cannot be empty.");
      return;
    }
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error ?? "Failed to add.");
        return;
      }
      closeModal();
      load();
    } catch {
      setAddError("Network error. Please try again.");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleEditSave(id: string) {
    const trimmed = editName.trim();
    if (!trimmed) return;
    setEditLoading(true);
    try {
      const res = await fetch(`${apiBase}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) { setEditingId(null); load(); }
    } finally {
      setEditLoading(false);
    }
  }

  async function handleToggle(item: MasterItem) {
    await fetch(`${apiBase}/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !item.is_active }),
    });
    load();
  }

  async function handleDelete(item: MasterItem) {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${apiBase}/${item.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error ?? "Failed to delete.");
        setDeletingId(null);
      } else {
        setDeletingId(null);
        load();
      }
    } catch {
      setDeleteError("Network error. Please try again.");
      setDeletingId(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2.5 font-body text-sm text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">{title}</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 font-body text-sm text-foreground-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="accent-accent"
            />
            Show inactive
          </label>
          <button
            onClick={openModal}
            className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 font-body text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            <Plus size={16} />
            Add {entity}
          </button>
        </div>
      </div>

      {/* Delete error banner */}
      {deleteError && (
        <div className="mb-4 flex items-start gap-3 rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="font-body text-sm text-red-400 flex-1">{deleteError}</p>
          <button onClick={() => setDeleteError(null)} className="text-red-400 hover:text-red-300 mt-0.5">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-5 w-5 text-foreground-muted" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="font-body text-sm text-foreground-muted">No {entity.toLowerCase()}s yet.</p>
            <button
              onClick={openModal}
              className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 font-body text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
            >
              <Plus size={15} />
              Add your first {entity.toLowerCase()}
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left font-body text-xs font-medium text-foreground-muted uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-left font-body text-xs font-medium text-foreground-muted uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right font-body text-xs font-medium text-foreground-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`${idx < items.length - 1 ? "border-b border-white/5" : ""} hover:bg-surface-raised transition-colors`}
                >
                  <td className="px-5 py-3.5">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 flex-1"
                          autoFocus
                        />
                        <button
                          onClick={() => handleEditSave(item.id)}
                          disabled={editLoading}
                          className="text-green-400 hover:text-green-300 transition-colors"
                          aria-label="Save"
                        >
                          {editLoading ? <Spinner className="h-4 w-4" /> : <Check size={16} />}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-foreground-muted hover:text-foreground transition-colors"
                          aria-label="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className={`font-body text-sm ${item.is_active ? "text-foreground" : "text-foreground-muted line-through"}`}>
                        {item.name}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[11px] font-medium ${item.is_active ? "bg-green-500/10 text-green-400" : "bg-surface-raised text-foreground-muted"}`}>
                      {item.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-3">
                      {deletingId === item.id ? (
                        <div className="flex items-center gap-2">
                          <span className="font-body text-xs text-foreground-muted whitespace-nowrap">Delete &quot;{item.name}&quot;?</span>
                          <button
                            onClick={() => handleDelete(item)}
                            disabled={deleteLoading}
                            className="rounded px-2 py-0.5 font-body text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60 whitespace-nowrap"
                          >
                            {deleteLoading ? "Deleting…" : "Yes, delete"}
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="text-foreground-muted hover:text-foreground transition-colors"
                            aria-label="Cancel delete"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ) : editingId !== item.id && (
                        <>
                          <button
                            onClick={() => { setEditingId(item.id); setEditName(item.name); }}
                            className="text-foreground-muted hover:text-foreground transition-colors"
                            aria-label="Edit"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleToggle(item)}
                            className={`transition-colors ${item.is_active ? "text-foreground-muted hover:text-yellow-400" : "text-foreground-muted hover:text-green-400"}`}
                            aria-label={item.is_active ? "Deactivate" : "Activate"}
                            title={item.is_active ? "Deactivate" : "Activate"}
                          >
                            {item.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          </button>
                          <button
                            onClick={() => setDeletingId(item.id)}
                            className="text-foreground-muted hover:text-red-400 transition-colors"
                            aria-label="Delete"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Dialog */}
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Add {entity}
              </h2>
              <button
                onClick={closeModal}
                className="text-foreground-muted hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAdd}>
              <label className="block font-body text-sm font-medium text-foreground-muted mb-1.5">
                {entity} name
              </label>
              <input
                ref={modalInputRef}
                type="text"
                value={addName}
                onChange={(e) => { setAddName(e.target.value); setAddError(null); }}
                placeholder={`e.g. ${entity === "Company" ? "Figma" : entity === "City" ? "Pune" : "SaaS & Software"}`}
                className={inputClass}
              />
              {addError && (
                <p className="mt-2 font-body text-sm text-red-400">{addError}</p>
              )}

              <div className="mt-5 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-border px-4 py-2 font-body text-sm text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 font-body text-sm font-medium text-accent-foreground hover:bg-accent-hover transition-colors disabled:opacity-60"
                >
                  {addLoading ? <Spinner className="h-4 w-4 text-white" /> : <Plus size={15} />}
                  Add {entity}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
