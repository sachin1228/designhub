"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Search, X } from "lucide-react";
import type { EmojiClickData } from "emoji-picker-react";
import { Theme } from "emoji-picker-react";

// Dynamically load the heavy emoji picker — avoids SSR issues and reduces initial bundle
const EmojiPickerReact = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center" style={{ height: 340 }}>
      <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
    </div>
  ),
});

type Tab = "emoji" | "gif" | "sticker";

interface GifItem {
  id: string;
  title: string;
  previewUrl: string;
  sendUrl: string;
  aspectRatio: number;
}

interface EmojiGifPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onGifSelect: (url: string) => void;
}

// ─── GIF / Sticker grid ──────────────────────────────────────────────────────

function GifGrid({
  type,
  onSelect,
}: {
  type: "gif" | "sticker";
  onSelect: (url: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notConfigured, setNotConfigured] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchGifs = useCallback(
    async (q: string, offset = 0) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          type,
          limit: "20",
          offset: String(offset),
        });
        if (q) params.set("q", q);
        const res = await fetch(`/api/giphy?${params}`);
        if (res.status === 503) {
          setNotConfigured(true);
          return;
        }
        if (!res.ok) throw new Error("Failed");
        const data = await res.json() as { results: GifItem[] };
        if (offset === 0) setResults(data.results ?? []);
        else setResults((prev) => [...prev, ...(data.results ?? [])]);
      } catch {
        // keep existing results on error
      } finally {
        setLoading(false);
      }
    },
    [type],
  );

  useEffect(() => {
    fetchGifs("");
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [fetchGifs]);

  const handleQueryChange = (q: string) => {
    setQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => fetchGifs(q), 380);
  };

  if (notConfigured) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
        <span className="text-3xl">{type === "gif" ? "🎬" : "🎭"}</span>
        <p className="text-sm font-semibold text-foreground">
          {type === "gif" ? "GIF search" : "Sticker search"} not configured
        </p>
        <p className="text-xs text-foreground-muted leading-relaxed">
          Add a <code className="bg-white/10 px-1 rounded">GIPHY_API_KEY</code> environment
          variable to enable {type === "gif" ? "GIF" : "sticker"} search.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-3 pt-2.5 pb-2 shrink-0">
        <div className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.06] rounded-xl px-3 py-2">
          <Search size={13} className="text-foreground-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={type === "gif" ? "Search GIFs…" : "Search stickers…"}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground-muted outline-none font-body min-w-0"
          />
          {query && (
            <button
              onClick={() => { handleQueryChange(""); inputRef.current?.focus(); }}
              className="shrink-0 text-foreground-muted hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Section label */}
      <p className="px-3 pb-1.5 text-[10px] font-semibold text-foreground-muted uppercase tracking-wider shrink-0">
        {query ? "Results" : "Trending"}
      </p>

      {/* Masonry grid */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {loading && results.length === 0 ? (
          <div className="flex items-center justify-center h-28">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-28 gap-1.5">
            <span className="text-xl">🔍</span>
            <p className="text-xs text-foreground-muted">No results found</p>
          </div>
        ) : (
          <div className="columns-2 gap-1.5 space-y-1.5">
            {results.map((gif) => (
              <div
                key={gif.id}
                className="break-inside-avoid cursor-pointer rounded-xl overflow-hidden
                  hover:opacity-90 hover:ring-2 hover:ring-accent/50
                  active:scale-95 transition-all duration-100"
                onClick={() => onSelect(gif.sendUrl)}
                title={gif.title}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gif.previewUrl}
                  alt={gif.title}
                  loading="lazy"
                  className="w-full h-auto block bg-white/[0.04]"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GIPHY attribution */}
      <div className="shrink-0 px-3 py-1.5 border-t border-white/[0.05] flex justify-end">
        <span className="text-[10px] text-foreground-muted/50">Powered by GIPHY</span>
      </div>
    </div>
  );
}

// ─── Main picker ──────────────────────────────────────────────────────────────

export function EmojiGifPicker({ onEmojiSelect, onGifSelect }: EmojiGifPickerProps) {
  const [tab, setTab] = useState<Tab>("emoji");

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: "emoji", icon: "😊", label: "Emoji" },
    { id: "gif",   icon: "GIF", label: "GIF"   },
    { id: "sticker", icon: "🎭", label: "Sticker" },
  ];

  return (
    <div
      className="flex flex-col bg-[#1c1c1e] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
      style={{ width: 336, height: 420 }}
    >
      {/* Tab bar */}
      <div className="flex shrink-0 border-b border-white/[0.07]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5
              text-xs font-semibold font-body transition-colors duration-150
              ${tab === t.id ? "text-foreground" : "text-foreground-muted hover:text-foreground/70"}`}
          >
            {t.id === "gif" ? (
              <span className="text-[11px] font-black tracking-tight text-accent">GIF</span>
            ) : (
              <span className="text-base leading-none">{t.icon}</span>
            )}
            {t.id !== "gif" && (
              <span className="hidden sm:inline">{t.label}</span>
            )}
            {tab === t.id && (
              <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-accent" />
            )}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 min-h-0">
        {tab === "emoji" && (
          <EmojiPickerReact
            onEmojiClick={(data: EmojiClickData) => onEmojiSelect(data.emoji)}
            theme={Theme.DARK}
            searchPlaceholder="Search emoji…"
            width="100%"
            height="100%"
            previewConfig={{ showPreview: false }}
            lazyLoadEmojis
            skinTonesDisabled
          />
        )}
        {tab === "gif"     && <GifGrid type="gif"     onSelect={onGifSelect} />}
        {tab === "sticker" && <GifGrid type="sticker" onSelect={onGifSelect} />}
      </div>
    </div>
  );
}
