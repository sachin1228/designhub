"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { APP_NAME } from "@draft/shared";
import { Spinner } from "@/components/ui/Spinner";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

// ─── Constants ───────────────────────────────────────────────

const EXPERIENCE_LEVELS = [
  { value: "student", label: "Student" },
  { value: "fresher", label: "Fresher (0–1 Years)" },
  { value: "junior", label: "Junior Designer (1–3 Years)" },
  { value: "mid_level", label: "Mid-Level Designer (3–5 Years)" },
  { value: "senior", label: "Senior Designer (5–8 Years)" },
  { value: "lead", label: "Lead Designer (8–12 Years)" },
  { value: "principal", label: "Principal Designer" },
  { value: "staff", label: "Staff Designer" },
  { value: "design_manager", label: "Design Manager" },
  { value: "head_of_design", label: "Head of Design" },
  { value: "director", label: "Director of Design" },
  { value: "vp", label: "VP of Design" },
  { value: "consultant", label: "Design Consultant" },
  { value: "freelancer", label: "Freelancer" },
] as const;

const DICEBEAR_STYLES = [
  "avataaars",
  "bottts",
  "fun-emoji",
  "lorelei",
  "micah",
  "notionists",
  "pixel-art",
  "thumbs",
];

const BORING_STYLES = ["beam", "marble", "ring", "sunset", "pixel"];

// ─── Types ───────────────────────────────────────────────────

type AvatarSource = "dicebear" | "boring-avatars";
interface AvatarOption {
  url: string;
  source: AvatarSource;
  label: string;
}

interface MasterItem {
  id: string;
  name: string;
}

interface TokenState {
  status: "loading" | "valid" | "invalid";
  error?: string;
  applicationId?: string;
  applicantEmail?: string;
}

type Step = 1 | 2 | 3 | "done";

// ─── Helpers ─────────────────────────────────────────────────

function getAvatarOptions(name: string): AvatarOption[] {
  const seed = encodeURIComponent(name || "designer");
  return [
    ...DICEBEAR_STYLES.map((style) => ({
      url: `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`,
      source: "dicebear" as AvatarSource,
      label: style,
    })),
    ...BORING_STYLES.map((style) => ({
      url: `https://source.boringavatars.com/${style}/120/${seed}?colors=FF5E1F,1B1918,262220,F5F2F0,7B7B7B`,
      source: "boring-avatars" as AvatarSource,
      label: style,
    })),
  ];
}

/** Compress + center-crop an image to 300×300 JPEG via Canvas. */
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const SIZE = 300;
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      // Center-crop to square
      const min = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - min) / 2;
      const sy = (img.naturalHeight - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Compression failed"));
        },
        "image/jpeg",
        0.78
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };
    img.src = objectUrl;
  });
}

// ─── Component ───────────────────────────────────────────────

function SignupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tokenState, setTokenState] = useState<TokenState>({ status: "loading" });

  // Step 1
  const [step1, setStep1] = useState({
    name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [step1Loading, setStep1Loading] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [step1FieldErrors, setStep1FieldErrors] = useState<Record<string, string[]>>({});

  // Step 2
  const [step, setStep] = useState<Step>(1);
  const [companies, setCompanies] = useState<MasterItem[]>([]);
  const [cities, setCities] = useState<MasterItem[]>([]);
  const [sectors, setSectors] = useState<MasterItem[]>([]);
  const [step2, setStep2] = useState({
    company_id: "",
    city_id: "",
    sector_id: "",
    experience_level: "",
  });
  const [step2Loading, setStep2Loading] = useState(false);
  const [step2Error, setStep2Error] = useState<string | null>(null);

  // Step 3
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarOption | null>(null);
  const [uploadedBlob, setUploadedBlob] = useState<Blob | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [step3Loading, setStep3Loading] = useState(false);
  const [step3Error, setStep3Error] = useState<string | null>(null);

  // ── Validate token ──────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setTokenState({ status: "invalid", error: "No invitation token found in the URL." });
      return;
    }
    fetch(`/api/signup/validate?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valid) {
          setTokenState({
            status: "valid",
            applicationId: d.applicationId,
            applicantEmail: d.applicantEmail,
          });
          setStep1((prev) => ({ ...prev, email: d.applicantEmail ?? "" }));
        } else {
          setTokenState({ status: "invalid", error: d.error ?? "Invalid invitation link." });
        }
      })
      .catch(() =>
        setTokenState({
          status: "invalid",
          error: "Failed to validate invitation. Please try again.",
        })
      );
  }, [token]);

  // ── Load dropdowns for step 2 ───────────────────────────────
  useEffect(() => {
    if (step !== 2) return;
    Promise.all([
      fetch("/api/data/companies")
        .then((r) => r.json())
        .then((d) => setCompanies(d.companies ?? [])),
      fetch("/api/data/cities")
        .then((r) => r.json())
        .then((d) => setCities(d.cities ?? [])),
      fetch("/api/data/sectors")
        .then((r) => r.json())
        .then((d) => setSectors(d.sectors ?? [])),
    ]).catch(() => {});
  }, [step]);

  // ── Auto-select first avatar when entering step 3 ──────────
  useEffect(() => {
    if (step !== 3) return;
    const opts = getAvatarOptions(step1.name);
    setSelectedAvatar(opts[0] ?? null);
    setUploadedBlob(null);
    if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
    setUploadPreviewUrl(null);
    setStep3Error(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ── Handlers ────────────────────────────────────────────────

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setStep1Loading(true);
    setStep1Error(null);
    setStep1FieldErrors({});
    try {
      const res = await fetch("/api/signup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...step1, token }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.issues) setStep1FieldErrors(data.issues);
        else setStep1Error(data.error ?? "Failed to create account.");
        return;
      }
      setStep(2);
    } catch {
      setStep1Error("Network error. Please try again.");
    } finally {
      setStep1Loading(false);
    }
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setStep2Loading(true);
    setStep2Error(null);

    if (!step2.company_id) {
      setStep2Error("Please select a company.");
      setStep2Loading(false);
      return;
    }
    if (!step2.city_id) {
      setStep2Error("Please select a city.");
      setStep2Loading(false);
      return;
    }
    if (!step2.sector_id) {
      setStep2Error("Please select an industry sector.");
      setStep2Loading(false);
      return;
    }
    if (!step2.experience_level) {
      setStep2Error("Please select your experience level.");
      setStep2Loading(false);
      return;
    }

    try {
      const res = await fetch("/api/signup/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: step2.company_id,
          city_id: step2.city_id,
          sector_id: step2.sector_id,
          experience_level: step2.experience_level,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStep2Error(data.error ?? "Failed to save profile.");
        return;
      }
      setStep(3);
    } catch {
      setStep2Error("Network error. Please try again.");
    } finally {
      setStep2Loading(false);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // allow re-selecting same file
    setStep3Error(null);
    try {
      const compressed = await compressImage(file);
      if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
      const preview = URL.createObjectURL(compressed);
      setUploadedBlob(compressed);
      setUploadPreviewUrl(preview);
      setSelectedAvatar(null);
    } catch {
      setStep3Error("Failed to process image. Please try a different file.");
    }
  }

  async function handleStep3() {
    setStep3Loading(true);
    setStep3Error(null);
    try {
      if (uploadedBlob) {
        const formData = new FormData();
        formData.append("file", uploadedBlob, "avatar.jpg");
        const res = await fetch("/api/signup/avatar", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          setStep3Error(data.error ?? "Upload failed. Please try again.");
          return;
        }
      } else if (selectedAvatar) {
        const res = await fetch("/api/signup/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            avatar_url: selectedAvatar.url,
            avatar_source: selectedAvatar.source,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStep3Error(data.error ?? "Failed to save avatar.");
          return;
        }
      }
      router.push("/dashboard");
    } catch {
      setStep3Error("Network error. Please try again.");
    } finally {
      setStep3Loading(false);
    }
  }

  // ── Styles ──────────────────────────────────────────────────

  const inputClass =
    "rounded-md border border-overlay-elevated bg-overlay px-3.5 py-2.5 font-body text-sm text-overlay-foreground outline-none transition-colors placeholder:text-overlay-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 w-full";

  const fieldError = (errors: Record<string, string[]>, key: string) =>
    errors[key]?.length ? (
      <p className="mt-1 font-body text-xs text-red-400">{errors[key][0]}</p>
    ) : null;

  const avatarOptions = getAvatarOptions(step1.name);

  // ── Render ──────────────────────────────────────────────────

  return (
    <main className="flex min-h-screen items-center justify-center bg-overlay px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="font-display text-xl font-semibold text-overlay-foreground">
            {APP_NAME}
            <span className="text-accent mx-1">/</span>
          </span>
        </div>

        {/* Loading */}
        {tokenState.status === "loading" && (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6 text-overlay-muted" />
          </div>
        )}

        {/* Invalid token */}
        {tokenState.status === "invalid" && (
          <div className="rounded-xl border border-overlay-elevated bg-overlay-raised p-8 text-center">
            <p className="font-display text-lg font-semibold text-overlay-foreground mb-2">
              Invalid link
            </p>
            <p className="font-body text-sm text-overlay-muted">{tokenState.error}</p>
          </div>
        )}

        {/* ── Step 1 ── */}
        {tokenState.status === "valid" && step === 1 && (
          <div className="rounded-xl border border-overlay-elevated bg-overlay-raised p-8 shadow-xl">
            <h2 className="font-display text-2xl font-semibold text-overlay-foreground mb-1">
              Create your account
            </h2>
            <p className="font-body text-sm text-overlay-muted mb-7">Step 1 of 3</p>

            <form onSubmit={handleStep1} className="flex flex-col gap-4">
              {step1Error && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3">
                  <p className="font-body text-sm text-red-400">{step1Error}</p>
                </div>
              )}

              <label className="flex flex-col gap-1.5">
                <span className="font-body text-xs font-medium text-overlay-foreground">Full Name</span>
                <input
                  type="text"
                  value={step1.name}
                  onChange={(e) => setStep1((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Jordan Lee"
                  className={inputClass}
                  autoComplete="name"
                  required
                />
                {fieldError(step1FieldErrors, "name")}
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-body text-xs font-medium text-overlay-foreground">Email</span>
                <input
                  type="email"
                  value={step1.email}
                  onChange={(e) => setStep1((p) => ({ ...p, email: e.target.value }))}
                  placeholder="you@studio.com"
                  className={inputClass}
                  autoComplete="email"
                  required
                />
                {fieldError(step1FieldErrors, "email")}
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-body text-xs font-medium text-overlay-foreground">Password</span>
                <input
                  type="password"
                  value={step1.password}
                  onChange={(e) => setStep1((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  className={inputClass}
                  autoComplete="new-password"
                  required
                />
                {fieldError(step1FieldErrors, "password")}
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-body text-xs font-medium text-overlay-foreground">
                  Confirm Password
                </span>
                <input
                  type="password"
                  value={step1.confirm_password}
                  onChange={(e) => setStep1((p) => ({ ...p, confirm_password: e.target.value }))}
                  placeholder="••••••••"
                  className={inputClass}
                  autoComplete="new-password"
                  required
                />
                {fieldError(step1FieldErrors, "confirm_password")}
              </label>

              <button
                type="submit"
                disabled={step1Loading}
                className="mt-2 flex items-center justify-center gap-2 rounded-md bg-accent py-2.5 font-body text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {step1Loading && <Spinner className="h-4 w-4 text-white" />}
                {step1Loading ? "Creating account…" : "Continue →"}
              </button>
            </form>
          </div>
        )}

        {/* ── Step 2 ── */}
        {tokenState.status === "valid" && step === 2 && (
          <div className="rounded-xl border border-overlay-elevated bg-overlay-raised p-8 shadow-xl">
            <h2 className="font-display text-2xl font-semibold text-overlay-foreground mb-1">
              Complete your profile
            </h2>
            <p className="font-body text-sm text-overlay-muted mb-7">Step 2 of 3</p>

            <form onSubmit={handleStep2} className="flex flex-col gap-4">
              {step2Error && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3">
                  <p className="font-body text-sm text-red-400">{step2Error}</p>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <span className="font-body text-xs font-medium text-overlay-foreground">
                  Company <span className="text-red-400">*</span>
                </span>
                <SearchableSelect
                  options={companies.map((c) => ({ value: c.id, label: c.name }))}
                  value={step2.company_id}
                  onChange={(v) => setStep2((p) => ({ ...p, company_id: v }))}
                  placeholder="Select a company"
                  allowOther
                  otherLabel="Other"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-body text-xs font-medium text-overlay-foreground">
                  City <span className="text-red-400">*</span>
                </span>
                <SearchableSelect
                  options={cities.map((c) => ({ value: c.id, label: c.name }))}
                  value={step2.city_id}
                  onChange={(v) => setStep2((p) => ({ ...p, city_id: v }))}
                  placeholder="Select a city"
                  allowOther
                  otherLabel="Other"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-body text-xs font-medium text-overlay-foreground">
                  Industry Sector <span className="text-red-400">*</span>
                </span>
                <SearchableSelect
                  options={sectors.map((s) => ({ value: s.id, label: s.name }))}
                  value={step2.sector_id}
                  onChange={(v) => setStep2((p) => ({ ...p, sector_id: v }))}
                  placeholder="Select a sector"
                  allowOther
                  otherLabel="Other"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-body text-xs font-medium text-overlay-foreground">
                  Experience Level <span className="text-red-400">*</span>
                </span>
                <SearchableSelect
                  options={EXPERIENCE_LEVELS.map((l) => ({ value: l.value, label: l.label }))}
                  value={step2.experience_level}
                  onChange={(v) => setStep2((p) => ({ ...p, experience_level: v }))}
                  placeholder="Select your level"
                />
              </div>

              <button
                type="submit"
                disabled={step2Loading}
                className="mt-2 flex items-center justify-center gap-2 rounded-md bg-accent py-2.5 font-body text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {step2Loading && <Spinner className="h-4 w-4 text-white" />}
                {step2Loading ? "Saving…" : "Continue →"}
              </button>
            </form>
          </div>
        )}

        {/* ── Step 3: Avatar ── */}
        {tokenState.status === "valid" && step === 3 && (
          <div className="rounded-xl border border-overlay-elevated bg-overlay-raised p-8 shadow-xl">
            <h2 className="font-display text-2xl font-semibold text-overlay-foreground mb-1">
              Choose your avatar
            </h2>
            <p className="font-body text-sm text-overlay-muted mb-6">Step 3 of 3</p>

            {step3Error && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 mb-5">
                <p className="font-body text-sm text-red-400">{step3Error}</p>
              </div>
            )}

            {/* Avatar grid */}
            <div className="grid grid-cols-4 gap-2.5 mb-5">
              {avatarOptions.map((option, i) => {
                const isSelected = selectedAvatar?.url === option.url && !uploadPreviewUrl;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSelectedAvatar(option);
                      setUploadedBlob(null);
                      if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
                      setUploadPreviewUrl(null);
                    }}
                    title={option.label}
                    className={`relative flex items-center justify-center rounded-xl p-1.5 transition-all focus:outline-none ${
                      isSelected
                        ? "ring-2 ring-accent bg-accent/10"
                        : "hover:bg-overlay-elevated"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={option.url}
                      alt={`Avatar style: ${option.label}`}
                      width={64}
                      height={64}
                      className="w-14 h-14 rounded-full object-cover bg-overlay-elevated"
                      loading="lazy"
                    />
                    {isSelected && (
                      <span className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent">
                        <svg
                          className="h-2.5 w-2.5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Source labels */}
            <div className="flex items-center gap-3 mb-5">
              <span className="font-body text-[11px] text-overlay-muted flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-overlay-muted" />
                First 8 from DiceBear
              </span>
              <span className="font-body text-[11px] text-overlay-muted flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-overlay-muted" />
                Last 5 from Boring Avatars
              </span>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-overlay-elevated" />
              <span className="font-body text-xs text-overlay-muted">or upload your own</span>
              <div className="flex-1 h-px bg-overlay-elevated" />
            </div>

            {/* Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
            {uploadPreviewUrl ? (
              <div className="flex items-center gap-4 mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uploadPreviewUrl}
                  alt="Your uploaded photo"
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-accent"
                />
                <div>
                  <p className="font-body text-sm font-medium text-overlay-foreground">
                    Photo ready
                  </p>
                  <p className="font-body text-xs text-overlay-muted mt-0.5">
                    Compressed &amp; cropped to 300×300
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
                      setUploadPreviewUrl(null);
                      setUploadedBlob(null);
                      const opts = getAvatarOptions(step1.name);
                      setSelectedAvatar(opts[0] ?? null);
                    }}
                    className="mt-1 font-body text-xs text-overlay-muted hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mb-5 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-overlay-elevated px-4 py-3 font-body text-sm text-overlay-muted hover:border-accent hover:text-overlay-foreground transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
                  <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                </svg>
                Upload photo (JPEG / PNG / WebP)
              </button>
            )}

            {/* Save */}
            <button
              type="button"
              onClick={handleStep3}
              disabled={step3Loading || (!selectedAvatar && !uploadedBlob)}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-accent py-2.5 font-body text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {step3Loading && <Spinner className="h-4 w-4 text-white" />}
              {step3Loading ? "Saving…" : "Save & go to dashboard →"}
            </button>

            {/* Skip */}
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="mt-3 w-full text-center font-body text-sm text-overlay-muted hover:text-overlay-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* ── Done ── */}
        {step === "done" && (
          <div className="rounded-xl border border-overlay-elevated bg-overlay-raised p-8 text-center shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-overlay-foreground mb-2">
              You're in!
            </h2>
            <p className="font-body text-sm text-overlay-muted mb-6">
              Your account is ready. Start sharing work, connecting with creatives, and
              discovering new opportunities.
            </p>
            <a
              href="/"
              className="inline-block rounded-md bg-accent px-6 py-2.5 font-body text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
            >
              Go to {APP_NAME}
            </a>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-overlay">
          <Spinner className="h-6 w-6 text-overlay-muted" />
        </main>
      }
    >
      <SignupInner />
    </Suspense>
  );
}
