"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface Settings {
  openai_enabled: string;
  nudenet_enabled: string;
  nudenet_url: string;
  auto_reject_threshold: string;
  review_threshold: string;
  max_image_size_mb: string;
  allowed_image_formats: string;
}

export default function ModerationSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    fetch("/api/admin/moderation/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    try {
      await fetch("/api/admin/moderation/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function update(key: keyof Settings, value: string) {
    setSettings((s) => s ? { ...s, [key]: value } : s);
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (!settings) return null;

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h1 className="font-display text-xl font-semibold text-foreground">Moderation Settings</h1>
        <p className="font-body text-xs text-foreground-muted mt-0.5">Configure AI moderation behaviour</p>
      </div>

      {/* Providers */}
      <section className="flex flex-col gap-4 p-5 rounded-xl bg-surface border border-border">
        <h2 className="font-body text-sm font-semibold text-foreground">Providers</h2>

        <label className="flex items-center justify-between">
          <div>
            <p className="font-body text-sm text-foreground">OpenAI Moderation</p>
            <p className="font-body text-xs text-foreground-muted">Uses omni-moderation-latest for text and images</p>
          </div>
          <input
            type="checkbox"
            checked={settings.openai_enabled === "true"}
            onChange={(e) => update("openai_enabled", e.target.checked ? "true" : "false")}
            className="w-4 h-4 accent-accent"
          />
        </label>

        <label className="flex items-center justify-between">
          <div>
            <p className="font-body text-sm text-foreground">NudeNet</p>
            <p className="font-body text-xs text-foreground-muted">Python FastAPI microservice for explicit image detection</p>
          </div>
          <input
            type="checkbox"
            checked={settings.nudenet_enabled === "true"}
            onChange={(e) => update("nudenet_enabled", e.target.checked ? "true" : "false")}
            className="w-4 h-4 accent-accent"
          />
        </label>

        {settings.nudenet_enabled === "true" && (
          <div className="flex flex-col gap-1">
            <label className="font-body text-xs text-foreground-muted">NudeNet Service URL</label>
            <input
              value={settings.nudenet_url}
              onChange={(e) => update("nudenet_url", e.target.value)}
              placeholder="https://nudenet.internal"
              className="px-3 py-2 rounded-xl bg-surface-raised border border-border font-body text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-accent transition-colors"
            />
          </div>
        )}
      </section>

      {/* Thresholds */}
      <section className="flex flex-col gap-4 p-5 rounded-xl bg-surface border border-border">
        <h2 className="font-body text-sm font-semibold text-foreground">Thresholds</h2>

        <div className="flex flex-col gap-1">
          <label className="font-body text-xs text-foreground-muted">
            Auto-Reject Threshold (0.0 – 1.0)
          </label>
          <input
            type="number"
            min={0} max={1} step={0.05}
            value={settings.auto_reject_threshold}
            onChange={(e) => update("auto_reject_threshold", e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface-raised border border-border font-body text-sm text-foreground outline-none focus:border-accent transition-colors"
          />
          <p className="font-body text-[11px] text-foreground-muted">Content scoring above this is immediately rejected</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-body text-xs text-foreground-muted">
            Manual Review Threshold (0.0 – 1.0)
          </label>
          <input
            type="number"
            min={0} max={1} step={0.05}
            value={settings.review_threshold}
            onChange={(e) => update("review_threshold", e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface-raised border border-border font-body text-sm text-foreground outline-none focus:border-accent transition-colors"
          />
          <p className="font-body text-[11px] text-foreground-muted">Content scoring above this is flagged for manual review</p>
        </div>
      </section>

      {/* Images */}
      <section className="flex flex-col gap-4 p-5 rounded-xl bg-surface border border-border">
        <h2 className="font-body text-sm font-semibold text-foreground">Image Uploads</h2>

        <div className="flex flex-col gap-1">
          <label className="font-body text-xs text-foreground-muted">Maximum Image Size (MB)</label>
          <input
            type="number"
            min={1} max={100}
            value={settings.max_image_size_mb}
            onChange={(e) => update("max_image_size_mb", e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface-raised border border-border font-body text-sm text-foreground outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-body text-xs text-foreground-muted">Allowed Formats (comma-separated)</label>
          <input
            value={settings.allowed_image_formats}
            onChange={(e) => update("allowed_image_formats", e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface-raised border border-border font-body text-sm text-foreground outline-none focus:border-accent transition-colors"
          />
        </div>
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground font-body text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 w-fit"
      >
        <Save size={15} />
        {saving ? "Saving…" : saved ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}
