"use client";

import {
  Camera, Mail, Calendar,
  MapPin, Building2, Layers, Star, Lock,
  Linkedin, Globe,
} from "lucide-react";
import { AvatarImg } from "@/components/ui/AvatarImg";

const fieldCls =
  "bg-transparent border-b border-border focus:border-accent outline-none text-foreground font-body text-sm transition-colors w-full pb-0.5 placeholder:text-foreground-subtle";

interface ProfileCardProps {
  name: string;
  email: string;
  avatarUrl: string | null;
  memberSince: string | null;
  onNameChange: (v: string) => void;
  onOpenAvatarPicker: () => void;
  city: string | null;
  company: string | null;
  sector: string | null;
  experienceLevel: string | null;
  linkedin: string;
  portfolio: string;
  onLinkedinChange: (v: string) => void;
  onPortfolioChange: (v: string) => void;
}

export function ProfileCard({
  name, email, avatarUrl, memberSince,
  onNameChange, onOpenAvatarPicker,
  city, company, sector, experienceLevel,
  linkedin, portfolio, onLinkedinChange, onPortfolioChange,
}: ProfileCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface mb-6 overflow-hidden">

      {/* ── Top row: avatar · name / email / since ── */}
      <div className="flex items-stretch divide-x divide-border">

        {/* Avatar */}
        <div className="flex flex-col items-center justify-center gap-2.5 px-6 py-5 shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-border bg-accent/20">
            {avatarUrl ? (
              <AvatarImg url={avatarUrl} name={name} size={64} className="w-16 h-16 object-cover" />
            ) : (
              <div className="w-16 h-16 flex items-center justify-center">
                <span className="font-display text-2xl font-bold text-accent">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onOpenAvatarPicker}
            className="flex items-center gap-1 rounded-full border border-border bg-surface-raised px-2.5 py-1 font-body text-[11px] text-foreground-muted hover:text-accent hover:border-accent/40 transition-all whitespace-nowrap"
          >
            <Camera size={10} />
            Change photo
          </button>
        </div>

        {/* Name / email / since */}
        <div className="flex flex-col justify-center gap-3 px-6 py-5 flex-1 min-w-0">
          <div className="flex flex-col gap-1">
            <label className="font-body text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Your name"
              className={fieldCls + " text-base font-medium"}
            />
          </div>
          <div className="flex gap-6">
            <div className="flex flex-col gap-0.5 min-w-0">
              <label className="font-body text-[10px] font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-1">
                <Mail size={9} /> Email
              </label>
              <p className="font-body text-xs text-foreground-subtle truncate">{email}</p>
            </div>
            {memberSince && (
              <div className="flex flex-col gap-0.5 shrink-0">
                <label className="font-body text-[10px] font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={9} /> Since
                </label>
                <p className="font-body text-xs text-foreground-subtle">{memberSince}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom row: identity · links ── */}
      <div className="flex items-stretch divide-x divide-border border-t border-border">

        {/* Professional Identity */}
        <div className="flex flex-col justify-center px-6 py-4 flex-1 min-w-0">
          <p className="font-body text-[10px] font-semibold text-foreground-muted uppercase tracking-wider mb-2.5">
            Professional Identity
          </p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {city && (
              <span className="flex items-center gap-1 rounded-lg border border-border bg-surface-raised px-2.5 py-1 font-body text-xs text-foreground">
                <MapPin size={10} className="text-accent shrink-0" />{city}
              </span>
            )}
            {company && (
              <span className="flex items-center gap-1 rounded-lg border border-border bg-surface-raised px-2.5 py-1 font-body text-xs text-foreground">
                <Building2 size={10} className="text-accent shrink-0" />{company}
              </span>
            )}
            {sector && (
              <span className="flex items-center gap-1 rounded-lg border border-border bg-surface-raised px-2.5 py-1 font-body text-xs text-foreground">
                <Layers size={10} className="text-accent shrink-0" />{sector}
              </span>
            )}
            {experienceLevel && (
              <span className="flex items-center gap-1 rounded-lg border border-border bg-surface-raised px-2.5 py-1 font-body text-xs text-foreground capitalize">
                <Star size={10} className="text-accent shrink-0" />{experienceLevel.replace(/_/g, " ")}
              </span>
            )}
          </div>
          <p className="flex items-center gap-1 font-body text-[10px] text-foreground-subtle">
            <Lock size={9} /> Linked to community membership — not editable here
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col justify-center px-6 py-4 w-72 shrink-0">
          <p className="font-body text-[10px] font-semibold text-foreground-muted uppercase tracking-wider mb-2.5">
            Links
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="font-body text-[10px] font-medium text-foreground-muted flex items-center gap-1 mb-1">
                <Linkedin size={9} /> LinkedIn
              </label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => onLinkedinChange(e.target.value)}
                placeholder="https://linkedin.com/in/yourname"
                className={fieldCls + " text-xs"}
              />
            </div>
            <div>
              <label className="font-body text-[10px] font-medium text-foreground-muted flex items-center gap-1 mb-1">
                <Globe size={9} /> Portfolio
              </label>
              <input
                type="url"
                value={portfolio}
                onChange={(e) => onPortfolioChange(e.target.value)}
                placeholder="https://yourportfolio.com"
                className={fieldCls + " text-xs"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
