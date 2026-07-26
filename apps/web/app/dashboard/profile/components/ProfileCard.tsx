"use client";

import { useRef, useState } from "react";
import {
  Camera, Mail, Calendar,
  MapPin, Building2, Layers, Star, Lock,
  Linkedin, Globe,
  Pencil, ChevronDown, X, Check,
} from "lucide-react";
import { AvatarImg } from "@/components/ui/AvatarImg";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { INTEREST_EMOJIS } from "@/lib/interests";

// ── Shared helpers ────────────────────────────────────────────────────────────

function Divider() {
  return <div className="h-px bg-border my-6" />;
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="font-display text-[11px] font-semibold text-foreground-muted uppercase tracking-widest mb-4">
      {label}
    </p>
  );
}

const fieldCls =
  "bg-transparent border-b border-border focus:border-accent outline-none text-foreground font-body text-sm transition-colors w-full pb-0.5 placeholder:text-foreground-subtle";

// ── Polaroid paperclip decoration ────────────────────────────────────────────

function PaperClip() {
  return (
    <svg
      viewBox="0 0 32 72"
      className="w-6 h-14 text-foreground-muted/60 drop-shadow-sm"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M16 68 C5 68 2 60 2 52 L2 20 C2 10 8 4 16 4 C24 4 30 10 30 20 L30 52 C30 58 26 64 20 64 C14 64 10 59 10 53 L10 22 C10 17 13 14 16 14 C19 14 22 17 22 22 L22 52" />
    </svg>
  );
}

// ── Interest chip types ───────────────────────────────────────────────────────

interface Interest {
  id: string;
  name: string;
  image_url?: string | null;
}

// ── Main combined card ────────────────────────────────────────────────────────

interface ProfileCardProps {
  // Hero
  name: string;
  email: string;
  avatarUrl: string | null;
  memberSince: string | null;
  bio: string;
  onNameChange: (v: string) => void;
  onBioChange: (v: string) => void;
  onOpenAvatarPicker: () => void;
  // Identity
  city: string | null;
  company: string | null;
  sector: string | null;
  experienceLevel: string | null;
  // Links
  linkedin: string;
  portfolio: string;
  onLinkedinChange: (v: string) => void;
  onPortfolioChange: (v: string) => void;
  // Interests
  allInterests: Interest[];
  interestIds: string[];
  onInterestsChange: (ids: string[]) => void;
}

export function ProfileCard({
  name, email, avatarUrl, memberSince, bio,
  onNameChange, onBioChange, onOpenAvatarPicker,
  city, company, sector, experienceLevel,
  linkedin, portfolio, onLinkedinChange, onPortfolioChange,
  allInterests, interestIds, onInterestsChange,
}: ProfileCardProps) {
  // Interests dropdown state
  const [interestsOpen, setInterestsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedInterests = allInterests.filter((i) => interestIds.includes(i.id));

  function toggleInterest(id: string) {
    onInterestsChange(
      interestIds.includes(id)
        ? interestIds.filter((x) => x !== id)
        : [...interestIds, id]
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-7 mb-6 relative overflow-hidden">
      {/* Subtle dot grid decoration */}
      <div
        className="absolute top-0 right-0 w-48 h-48 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />

      {/* ── Hero: avatar + fields + bio ──────────────────────────────────── */}
      <div className="flex gap-8 items-start relative">
        {/* Polaroid avatar */}
        <div className="shrink-0 flex flex-col items-center gap-3">
          <div className="relative" style={{ transform: "rotate(-3deg)" }}>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10">
              <PaperClip />
            </div>
            <div
              className="bg-white p-2 pb-3 shadow-xl rounded-sm mt-4"
              style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)" }}
            >
              <div className="w-28 h-28 overflow-hidden rounded-sm bg-overlay-elevated">
                {avatarUrl ? (
                  <AvatarImg url={avatarUrl} name={name} size={112} className="w-28 h-28 object-cover" />
                ) : (
                  <div className="w-28 h-28 flex items-center justify-center bg-accent/20">
                    <span className="font-display text-4xl font-bold text-accent">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onOpenAvatarPicker}
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3 py-1.5 font-body text-xs text-foreground-muted hover:text-accent hover:border-accent/40 transition-all mt-2"
          >
            <Camera size={11} />
            Change photo
          </button>
        </div>

        {/* Name / email / member since */}
        <div className="flex-1 grid grid-cols-1 gap-5 pt-1">
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Your name"
              className={fieldCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-[11px] font-medium text-foreground-muted uppercase tracking-wider flex items-center gap-1.5">
              <Mail size={11} /> Email
            </label>
            <p className="font-body text-sm text-foreground-subtle pb-0.5 border-b border-border/40">{email}</p>
          </div>
          {memberSince && (
            <div className="flex flex-col gap-1.5">
              <label className="font-body text-[11px] font-medium text-foreground-muted uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={11} /> Member Since
              </label>
              <p className="font-body text-sm text-foreground-subtle pb-0.5 border-b border-border/40">{memberSince}</p>
            </div>
          )}
        </div>

        {/* Bio */}
        <div className="w-56 pt-1">
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => onBioChange(e.target.value)}
              placeholder="A short note about yourself — what you design, love, or believe in…"
              rows={3}
              className={fieldCls + " resize-none leading-relaxed"}
            />
          </div>
        </div>
      </div>

      <Divider />

      {/* ── Professional Identity ─────────────────────────────────────────── */}
      <SectionLabel label="Professional Identity" />
      <div className="flex flex-wrap gap-3 mb-3">
        {city && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-raised px-3.5 py-2">
            <MapPin size={13} className="text-accent shrink-0" />
            <span className="font-body text-sm text-foreground">{city}</span>
          </div>
        )}
        {company && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-raised px-3.5 py-2">
            <Building2 size={13} className="text-accent shrink-0" />
            <span className="font-body text-sm text-foreground">{company}</span>
          </div>
        )}
        {sector && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-raised px-3.5 py-2">
            <Layers size={13} className="text-accent shrink-0" />
            <span className="font-body text-sm text-foreground">{sector}</span>
          </div>
        )}
        {experienceLevel && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-raised px-3.5 py-2">
            <Star size={13} className="text-accent shrink-0" />
            <span className="font-body text-sm text-foreground capitalize">
              {experienceLevel.replace(/_/g, " ")}
            </span>
          </div>
        )}
      </div>
      <p className="flex items-center gap-1.5 font-body text-[11px] text-foreground-subtle">
        <Lock size={10} />
        These are linked to your community membership and can&apos;t be changed here.
      </p>

      <Divider />

      {/* ── Links ────────────────────────────────────────────────────────── */}
      <SectionLabel label="Links" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-[11px] font-medium text-foreground-muted uppercase tracking-wider flex items-center gap-1.5">
            <Linkedin size={11} /> LinkedIn
          </label>
          <input
            type="url"
            value={linkedin}
            onChange={(e) => onLinkedinChange(e.target.value)}
            placeholder="https://linkedin.com/in/yourname"
            className={fieldCls}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-[11px] font-medium text-foreground-muted uppercase tracking-wider flex items-center gap-1.5">
            <Globe size={11} /> Portfolio
          </label>
          <input
            type="url"
            value={portfolio}
            onChange={(e) => onPortfolioChange(e.target.value)}
            placeholder="https://yourportfolio.com"
            className={fieldCls}
          />
        </div>
      </div>

      <Divider />

      {/* ── Design Interests ─────────────────────────────────────────────── */}
      <SectionLabel label="Design Interests" />
      <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
        {selectedInterests.length === 0 ? (
          <span className="font-body text-sm text-foreground-subtle">No interests selected yet</span>
        ) : (
          selectedInterests.map((interest) => (
            <button
              key={interest.id}
              type="button"
              onClick={() => toggleInterest(interest.id)}
              className="group flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-body text-xs text-foreground hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition-all"
            >
              <span>{INTEREST_EMOJIS[interest.name] ?? "🎨"}</span>
              {interest.name}
              <X size={10} className="opacity-50 group-hover:opacity-100" />
            </button>
          ))
        )}
      </div>

      <div className="relative inline-block">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setInterestsOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-dashed border-border hover:border-accent/40 bg-surface-raised px-4 py-2 font-body text-sm text-foreground-muted hover:text-foreground transition-all"
        >
          <Pencil size={12} />
          Edit interests
          <ChevronDown size={12} className={`transition-transform ${interestsOpen ? "rotate-180" : ""}`} />
        </button>

        <DropdownMenu
          triggerRef={triggerRef}
          open={interestsOpen}
          onClose={() => setInterestsOpen(false)}
          align="left"
          className="w-72"
        >
          <div className="max-h-72 overflow-y-auto">
            {allInterests.map((interest) => {
              const selected = interestIds.includes(interest.id);
              return (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => toggleInterest(interest.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.08] transition-colors"
                >
                  <span className="text-base leading-none shrink-0">
                    {INTEREST_EMOJIS[interest.name] ?? "🎨"}
                  </span>
                  <span className="flex-1 font-body text-sm text-foreground">{interest.name}</span>
                  <span
                    className={`h-4 w-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                      selected ? "bg-accent" : "border border-border"
                    }`}
                  >
                    {selected && <Check size={10} className="text-white" />}
                  </span>
                </button>
              );
            })}
          </div>
        </DropdownMenu>
      </div>
    </div>
  );
}
