/**
 * Raw color palette — all primitive values.
 * These are the foundation of the design system; do not use them directly
 * in UI code. Reference semantic tokens from `themes/` instead.
 *
 * Scales follow the Geist / Vercel convention:
 * lower numbers = lighter shades, higher numbers = darker shades.
 */

/**
 * Geist Blue — official Vercel / Geist blue palette.
 * Primary accent is blue-700.
 */
export const blue = {
  100: "#cce7ff",
  200: "#99ceff",
  300: "#66b5ff",
  400: "#339dff",
  500: "#0084ff",
  600: "#006bdb",
  700: "#0057b7", // ← primary brand accent (light mode)
  800: "#004494", // ← hover (darker shade of 700)
  900: "#003070",
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
  900: "#0A0A0A",
  800: "#111111",
  700: "#1A1A1A",
  600: "#2E2E2E",
  500: "#3E3E3E",
  400: "#737373",
  100: "#EDEDED",
} as const;

/** Brand signal */
export const signal = blue[700] as const;

export const colors = {
  blue,
  neutral,
  dark,
  signal,
} as const;

export type Colors = typeof colors;
