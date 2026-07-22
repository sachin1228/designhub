/**
 * Raw color palette — all primitive values.
 * These are the foundation of the design system; do not use them directly
 * in UI code. Reference semantic tokens from `themes/` instead.
 *
 * Scales follow the Geist / Vercel convention:
 * lower numbers = lighter shades, higher numbers = darker shades.
 */

/**
 * Brand Blue — palette built around #1289ff (primary brand blue).
 * HSL ≈ 214°, 100%, 54%
 */
export const blue = {
  50:  "#eef5ff",  // barely-there tint — soft backgrounds, hover fills
  100: "#d9eaff",  // light tint — badge/pill backgrounds
  200: "#bcd8ff",  // medium-light — input focus rings, outlined borders
  300: "#8bbeff",  // medium — disabled states, decorative accents
  400: "#4fa3ff",  // vivid light — dark-mode primary, hover on dark
  500: "#1289ff",  // ← PRIMARY BRAND BLUE (light mode accent)
  600: "#0070e6",  // hover — buttons, links on hover
  700: "#0056b3",  // pressed / active state
  800: "#003d80",  // deep blue — gradients, illustration elements
  900: "#00264d",  // darkest — gradient endpoints, overlays
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

/** Brand signal — same as primary blue, stays consistent in both modes */
export const signal = "#1289ff" as const;

export const colors = {
  blue,
  neutral,
  dark,
  signal,
} as const;

export type Colors = typeof colors;
