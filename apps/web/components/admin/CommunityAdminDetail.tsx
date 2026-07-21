"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Pencil, Check, X, Globe, Lock, Trash2,
  Users, MessageSquare, Upload, ImagePlus,
} from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface AdminCommunity {
  id: string;
  name: string;
  type: string;
  image_url: string | null;
  is_public: boolean;
  member_count: number;
  message_count: number;
  reference_id: string;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  city:             "City",
  sector:           "Industry Sector",
  interest:         "Interest",
  company:          "Company",
  experience_level: "Experience Level",
};

const TYPE_COLORS: Record<string, string> = {
  city:             "bg-blue-500/10 text-blue-400",
  sector:           "bg-purple-500/10 text-purple-400",
  interest:         "bg-orange-500/10 text-orange-400",
  company:          "bg-teal-500/10 text-teal-400",
  experience_level: "bg-pink-500/10 text-pink-400",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-border last:border-0">
      <span className="w-36 shrink-0 font-body text-xs text-foreground-muted">{label}</span>
      <span className="font-body text-xs text-foreground break-all">{value}</span>
    </div>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/** Compress + center-crop a raster image to 300×300 JPEG */
function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const SIZE = 300;
      const canvas = document.createElement("canvas");
      canvas.width = SIZE; canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error("No canvas")); return; }
      const min = Math.min(img.naturalWidth, img.naturalHeight);
      ctx.drawImage(img, (img.naturalWidth - min) / 2, (img.naturalHeight - min) / 2, min, min, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Blob failed")), "image/jpeg", 0.78);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Load failed")); };
    img.src = url;
  });
}

export function CommunityAdminDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [community, setCommunity] = useState<AdminCommunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rename
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Visibility toggle
  const [visLoading, setVisLoading] = useState(false);

  // Image
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Delete
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/communities/${id}`);
        if (!res.ok) { setError("Community not found."); return; }
        const data = await res.json();
        setCommunity(data.community);
      } catch {
        setError("Failed to load.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/communities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Update failed.");
    // Merge stats that PATCH doesn't return
    setCommunity((prev) => prev ? { ...prev, ...data.community } : data.community);
    return data.community;
  }

  async function handleRenameSave() {
    const trimmed = editName.trim();
    if (!trimmed) { setEditError("Name cannot be empty."); return; }
    setEditLoading(true); setEditError(null);
    try {
      await patch({ name: trimmed });
      setEditing(false);
    } catch (e: any) {
      setEditError(e.message);
    } finally {
      setEditLoading(false);
    }
  }

  async function handleToggleVisibility() {
    if (!community) return;
    setVisLoading(true);
    try { await patch({ is_public: !community.is_public }); }
    catch { /* ignore */ }
    finally { setVisLoading(false); }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true); setImageError(null);
    try {
      let uploadFile: File | Blob = file;
      if (file.type !== "image/svg+xml") {
        try { uploadFile = await compressImage(file); } catch { /* use original */ }
      }
      const fd = new FormData();
      fd.append("file", uploadFile, file.name);
      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) { setImageError(uploadData.error ?? "Upload failed."); return; }
      await patch({ image_url: uploadData.url });
    } catch (e: any) {
      setImageError(e.message);
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  async function handleRemoveImage() {
    setImageUploading(true); setImageError(null);
    try { await patch({ image_url: null }); }
    catch (e: any) { setImageError(e.message); }
    finally { setImageUploading(false); }
  }

  async function handleDelete() {
    setDeleteLoading(true); setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/communities/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.error ?? "Failed to delete."); return; }
      router.push("/admin/communities");
    } catch {
      setDeleteError("Network error.");
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) return <div className="flex justify-center py-24"><Spinner className="h-5 w-5 text-foreground-muted" /></div>;
  if (error || !community) return <div className="py-16 text-center font-body text-sm text-foreground-muted">{error ?? "Community not found."}</div>;

  return (
    <div className="max-w-xl">
      {/* Back */}
      <button
        onClick={() => router.push("/admin/communities")}
        className="mb-6 flex items-center gap-1.5 font-body text-xs text-foreground-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft size={13} />
        Back to communities
      </button>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="shrink-0">
          {community.image_url ? (
            <img src={community.image_url} alt={community.name} className="h-16 w-16 rounded-xl object-cover border border-border" />
          ) : (
            <div className="h-16 w-16 rounded-xl border border-dashed border-border bg-surface-raised flex items-center justify-center">
              <Users size={22} className="text-foreground-muted" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => { setEditName(e.target.value); setEditError(null); }}
                autoFocus
                className="rounded-lg border border-accent bg-surface px-3 py-2 font-display text-xl font-semibold text-foreground outline-none focus:ring-1 focus:ring-accent/30 flex-1 min-w-0"
              />
              <button onClick={handleRenameSave} disabled={editLoading} className="text-green-400 hover:text-green-300 transition-colors shrink-0">
                {editLoading ? <Spinner className="h-4 w-4" /> : <Check size={18} />}
              </button>
              <button onClick={() => { setEditing(false); setEditError(null); }} className="text-foreground-muted hover:text-foreground transition-colors shrink-0">
                <X size={18} />
              </button>
            </div>
          ) : (
            <h1 className="font-display text-2xl font-semibold text-foreground truncate">{community.name}</h1>
          )}

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ${TYPE_COLORS[community.type] ?? "bg-surface-raised text-foreground-muted"}`}>
              {TYPE_LABELS[community.type] ?? community.type}
            </span>
            {community.is_public ? (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium bg-green-500/10 text-green-400">
                <Globe size={9} />Public
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium bg-surface-raised text-foreground-muted">
                <Lock size={9} />Private
              </span>
            )}
          </div>
        </div>
      </div>

      {editError && (
        <p className="mb-4 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 font-body text-xs text-red-400">{editError}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-surface px-4 py-3 flex items-center gap-3">
          <Users size={16} className="text-foreground-muted shrink-0" />
          <div>
            <p className="font-display text-lg font-semibold text-foreground leading-none">{community.member_count}</p>
            <p className="font-body text-[10px] text-foreground-muted mt-0.5">Members</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-3 flex items-center gap-3">
          <MessageSquare size={16} className="text-foreground-muted shrink-0" />
          <div>
            <p className="font-display text-lg font-semibold text-foreground leading-none">{community.message_count}</p>
            <p className="font-body text-[10px] text-foreground-muted mt-0.5">Messages</p>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-border bg-surface px-5 mb-6">
        <InfoRow label="Name" value={community.name} />
        <InfoRow label="Type" value={
          <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 font-mono text-[10px] font-medium ${TYPE_COLORS[community.type] ?? ""}`}>
            {TYPE_LABELS[community.type] ?? community.type}
          </span>
        } />
        <InfoRow label="Visibility" value={
          community.is_public
            ? <span className="text-green-400 flex items-center gap-1"><Globe size={11} />Public — appears in Explore Communities</span>
            : <span className="text-foreground-muted flex items-center gap-1"><Lock size={11} />Private — hidden from Explore Communities</span>
        } />
        <InfoRow label="Image" value={
          community.image_url
            ? <a href={community.image_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline truncate block max-w-xs">View image ↗</a>
            : <span className="text-foreground-muted">No image</span>
        } />
        <InfoRow label="Reference ID" value={
          <span className="font-mono text-[10px] text-foreground-muted">{community.reference_id}</span>
        } />
        <InfoRow label="Community ID" value={
          <span className="font-mono text-[10px] text-foreground-muted">{community.id}</span>
        } />
        <InfoRow label="Created" value={fmt(community.created_at)} />
      </div>

      {/* Actions */}
      <div className="rounded-xl border border-border bg-surface divide-y divide-border">

        {/* Rename */}
        <div className="flex items-center justify-between px-5 py-3.5">
          <div>
            <p className="font-body text-xs font-medium text-foreground">Rename community</p>
            <p className="font-body text-[11px] text-foreground-muted mt-0.5">Update the display name shown to members</p>
          </div>
          <button
            onClick={() => { setEditing(true); setEditName(community.name); }}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-body text-xs text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-colors"
          >
            <Pencil size={12} /> Edit
          </button>
        </div>

        {/* Public / Private toggle */}
        <div className="flex items-center justify-between px-5 py-3.5">
          <div>
            <p className="font-body text-xs font-medium text-foreground">
              {community.is_public ? "Make private" : "Make public"}
            </p>
            <p className="font-body text-[11px] text-foreground-muted mt-0.5">
              {community.is_public
                ? "Hide from Explore Communities — only auto-joined members can see it"
                : "Show in Explore Communities — any member can discover and join"}
            </p>
          </div>
          <button
            onClick={handleToggleVisibility}
            disabled={visLoading}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-body text-xs font-medium transition-colors disabled:opacity-60 ${
              community.is_public
                ? "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                : "border-green-500/30 text-green-400 hover:bg-green-500/10"
            }`}
          >
            {visLoading ? (
              <Spinner className="h-3 w-3" />
            ) : community.is_public ? (
              <Lock size={12} />
            ) : (
              <Globe size={12} />
            )}
            {community.is_public ? "Make private" : "Make public"}
          </button>
        </div>

        {/* Image */}
        <div className="flex items-center justify-between px-5 py-3.5">
          <div>
            <p className="font-body text-xs font-medium text-foreground">Community image</p>
            <p className="font-body text-[11px] text-foreground-muted mt-0.5">
              {community.image_url ? "Replace or remove the current image" : "Upload an image for this community"}
            </p>
            {imageError && <p className="font-body text-[11px] text-red-400 mt-1">{imageError}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {imageUploading ? (
              <Spinner className="h-3.5 w-3.5 text-foreground-muted" />
            ) : (
              <>
                <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" onChange={handleImageChange} className="hidden" />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-body text-xs text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-colors"
                >
                  <Upload size={12} />
                  {community.image_url ? "Replace" : "Upload"}
                </button>
                {community.image_url && (
                  <button
                    onClick={handleRemoveImage}
                    className="rounded-md border border-border px-3 py-1.5 font-body text-xs text-foreground-muted hover:text-red-400 hover:border-red-500/30 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Delete */}
        <div className="flex items-center justify-between px-5 py-3.5">
          <div>
            <p className="font-body text-xs font-medium text-red-400">Delete community</p>
            <p className="font-body text-[11px] text-foreground-muted mt-0.5">
              Permanently removes the community, all {community.member_count} members, and {community.message_count} messages.
            </p>
          </div>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 rounded-md border border-red-500/30 px-3 py-1.5 font-body text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <h2 className="font-display text-base font-semibold text-foreground mb-1">Delete &ldquo;{community.name}&rdquo;?</h2>
            <p className="font-body text-xs text-foreground-muted mb-5">
              This will permanently remove the community along with <strong className="text-foreground">{community.member_count} member{community.member_count !== 1 ? "s" : ""}</strong> and <strong className="text-foreground">{community.message_count} message{community.message_count !== 1 ? "s" : ""}</strong>. This cannot be undone.
            </p>
            {deleteError && (
              <p className="mb-4 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 font-body text-xs text-red-400">{deleteError}</p>
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
