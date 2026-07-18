"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Pencil, Plus, ToggleLeft, ToggleRight, Check, X, Trash2, Search } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

export interface MasterItem {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

interface MasterDataPageProps {
  title: string;
  entity: string;
  apiBase: string;
}

export function MasterDataPage({ title, entity, apiBase }: MasterDataPageProps) {
  const [items, setItems] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");
  const [search, setSearch] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const modalInputRef = useRef<HTMLInputElement>(null);

  // Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Always fetch all so tab switching doesn't need a refetch
      const res = await fetch(`${apiBase}?all=true`);
      if (!res.ok) { setItems([]); return; }
      const data = await res.json();
      const rows: MasterItem[] = data.companies ?? data.cities ?? data.sectors ?? [];
      setItems(rows);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (modalOpen) setTimeout(() => modalInputRef.current?.focus(), 50);
  }, [modalOpen]);

  const tabItems = useMemo(() =>
    items.filter((i) => (activeTab === "active" ? i.is_active : !i.is_active)),
    [items, activeTab]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tabItems;
    return tabItems.filter((i) => i.name.toLowerCase().includes(q));
  }, [tabItems, search]);

  function openModal() { setAddName(""); setAddError(null); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setAddName(""); setAddError(null); }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = addName.trim();
    if (!trimmed) { setAddError("Name cannot be empty."); return; }
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error ?? "Failed to add."); return; }
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-xl font-semibold text-foreground">{title}</h1>
        <button
          onClick={openModal}
          className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 font-body text-xs font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          <Plus size={13} />
          Add {entity}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 border-b border-border">
        {(["active", "inactive"] as const).map((tab) => {
          const count = items.filter((i) => (tab === "active" ? i.is_active : !i.is_active)).length;
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearch(""); }}
              className={`px-4 py-2 font-body text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-accent text-accent"
                  : "border-transparent text-foreground-muted hover:text-foreground"
              }`}
            >
              {tab}
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                activeTab === tab ? "bg-accent/15 text-accent" : "bg-surface-raised text-foreground-muted"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Delete error */}
      {deleteError && (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2">
          <p className="font-body text-xs text-red-400 flex-1">{deleteError}</p>
          <button onClick={() => setDeleteError(null)} className="text-red-400 hover:text-red-300">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-3">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${title.toLowerCase()}…`}
          className="w-full rounded-lg border border-border bg-surface pl-8 pr-3 py-2 font-body text-xs text-foreground placeholder:text-foreground-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-4 w-4 text-foreground-muted" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <p className="font-body text-xs text-foreground-muted">No {entity.toLowerCase()}s yet.</p>
            <button
              onClick={openModal}
              className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 font-body text-xs font-medium text-accent-foreground hover:bg-accent-hover transition-colors"
            >
              <Plus size={13} />
              Add your first {entity.toLowerCase()}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center font-body text-xs text-foreground-muted">
            No results for &quot;{search}&quot;
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-body text-[10px] font-medium text-foreground-muted uppercase tracking-wider">Name</th>
                <th className="px-4 py-2 text-left font-body text-[10px] font-medium text-foreground-muted uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-right font-body text-[10px] font-medium text-foreground-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`${idx < filtered.length - 1 ? "border-b border-white/5" : ""} hover:bg-surface-raised transition-colors`}
                >
                  {/* Name */}
                  <td className="px-4 py-2">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="rounded border border-border bg-surface px-2 py-1 font-body text-xs text-foreground outline-none focus:border-accent flex-1"
                          autoFocus
                        />
                        <button onClick={() => handleEditSave(item.id)} disabled={editLoading} className="text-green-400 hover:text-green-300 transition-colors" aria-label="Save">
                          {editLoading ? <Spinner className="h-3 w-3" /> : <Check size={13} />}
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-foreground-muted hover:text-foreground transition-colors" aria-label="Cancel">
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <span className={`font-body text-xs ${item.is_active ? "text-foreground" : "text-foreground-muted line-through"}`}>
                        {item.name}
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 font-mono text-[10px] font-medium ${item.is_active ? "bg-green-500/10 text-green-400" : "bg-surface-raised text-foreground-muted"}`}>
                      {item.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-2.5">
                      {deletingId === item.id ? (
                        <div className="flex items-center gap-2">
                          <span className="font-body text-[10px] text-foreground-muted whitespace-nowrap">Delete &quot;{item.name}&quot;?</span>
                          <button
                            onClick={() => handleDelete(item)}
                            disabled={deleteLoading}
                            className="rounded px-1.5 py-0.5 font-body text-[10px] font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60 whitespace-nowrap"
                          >
                            {deleteLoading ? "…" : "Yes, delete"}
                          </button>
                          <button onClick={() => setDeletingId(null)} className="text-foreground-muted hover:text-foreground" aria-label="Cancel">
                            <X size={12} />
                          </button>
                        </div>
                      ) : editingId !== item.id && (
                        <>
                          <button onClick={() => { setEditingId(item.id); setEditName(item.name); }} className="text-foreground-muted hover:text-foreground transition-colors" title="Edit">
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => handleToggle(item)}
                            className={`transition-colors ${item.is_active ? "text-foreground-muted hover:text-yellow-400" : "text-foreground-muted hover:text-green-400"}`}
                            title={item.is_active ? "Deactivate" : "Activate"}
                          >
                            {item.is_active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                          </button>
                          <button onClick={() => setDeletingId(item.id)} className="text-foreground-muted hover:text-red-400 transition-colors" title="Delete">
                            <Trash2 size={12} />
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

      {/* Row count */}
      {!loading && tabItems.length > 0 && (
        <p className="mt-2 text-right font-body text-[10px] text-foreground-muted">
          {search ? `${filtered.length} of ${tabItems.length}` : tabItems.length} {entity.toLowerCase()}{tabItems.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Add Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-base font-semibold text-foreground">Add {entity}</h2>
              <button onClick={closeModal} className="text-foreground-muted hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <label className="block font-body text-xs font-medium text-foreground-muted mb-1.5">
                {entity} name
              </label>
              <input
                ref={modalInputRef}
                type="text"
                value={addName}
                onChange={(e) => { setAddName(e.target.value); setAddError(null); }}
                placeholder={`e.g. ${entity === "Company" ? "Figma" : entity === "City" ? "Pune" : "SaaS & Software"}`}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 font-body text-sm text-foreground outline-none placeholder:text-foreground-muted focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
              />
              {addError && (
                <p className="mt-1.5 font-body text-xs text-red-400">{addError}</p>
              )}
              <div className="mt-5 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-border px-3 py-2 font-body text-xs text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 font-body text-xs font-medium text-accent-foreground hover:bg-accent-hover transition-colors disabled:opacity-60"
                >
                  {addLoading ? <Spinner className="h-3 w-3 text-white" /> : <Plus size={13} />}
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
