/**
 * Raw color palette — all primitive values.
 * These are the foundation of the design system; do not use them directly
 * in UI code. Reference semantic tokens from `themes/` instead.
 *
 * Scales follow the Geist / Vercel convention:
 * lower numbers = lighter shades, higher numbers = darker shades.
 */

/** Geist Blue — primary brand accent (replaces orange) */
export const blue = {
  50:  "#eff6ff",
  100: "#dbeafe",
  200: "#bfdbfe",
  300: "#93c5fd",
  400: "#60a5fa",
  500: "#0070f3", // primary brand accent (light mode) — Vercel signature blue
  600: "#0060df", // hover
  700: "#004bad",
  800: "#003082",
  900: "#001a57",
} as const;

/** Geist Neutral — clean, cool-neutral grays */
export const neutral = {
  0:    "#FFFFFF",
  50:   "#FAFAFA",
  100:  "#F5F5F5",
  200:  "#EAEAEA",
  300:  "#E0E0E0",
  400:  "#A8A8A8",
  500:  "#737373",
  600:  "#525252",
  700:  "#404040",
  800:  "#262626",
  900:  "#171717",
  1000: "#0A0A0A",
} as const;

/** Geist Dark — near-black backgrounds for dark mode */
export const dark = {
  900: "#0A0A0A", // deepest dark (page bg)
  800: "#111111", // surface
  700: "#1A1A1A", // surface raised / cards
  600: "#2E2E2E", // border on dark
  500: "#3E3E3E", // input border on dark
  400: "#737373", // muted text
  100: "#EDEDED", // foreground on dark
} as const;

/** Brand signal — vivid blue, stays consistent in both modes */
export const signal = "#0070f3" as const;

export const colors = {
  blue,
  neutral,
  dark,
  signal,
} as const;

export type Colors = typeof colors;
