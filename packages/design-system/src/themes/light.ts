import { neutral, blue, signal, dark } from "../tokens/colors";

/**
 * Light theme — semantic color mappings.
 * Geist / Vercel design language:
 * off-white page background, pure white surfaces, near-black foreground,
 * crisp 1px borders, Vercel blue accent.
 */
export const lightTheme = {
  /** Page and panel backgrounds */
  background:        neutral[50],   // #FAFAFA — off-white canvas (Geist standard)
  backgroundSubtle:  neutral[100],  // #F5F5F5 — alternate section bg

  /** Card / elevated surfaces */
  surface:           neutral[0],    // #FFFFFF — white surfaces pop on off-white bg
  surfaceRaised:     neutral[100],  // #F5F5F5 — slightly elevated

  /** Text */
  foreground:        neutral[1000], // #0A0A0A — near-black primary text
  foregroundMuted:   neutral[600],  // #525252 — secondary text
  foregroundSubtle:  neutral[500],  // #737373 — placeholder / tertiary

  /** Accent — Geist blue */
  accent:            blue[500],     // #0070f3 — Vercel signature blue
  accentHover:       blue[600],     // #0060df — hover state
  accentSoft:        blue[50],      // #eff6ff — tinted bg for badges/pills
  accentForeground:  neutral[0],    // #FFFFFF — white text on blue bg

  /** Borders */
  border:            neutral[200],  // #EAEAEA — Geist standard border
  borderSubtle:      neutral[100],  // #F5F5F5 — subtle dividers

  /** Brand signal */
  signal,                           // #0070f3

  /** Always-dark overlay panel (brand canvas, code blocks, etc.) */
  overlay:           dark[900],     // #0A0A0A
  overlayRaised:     dark[800],     // #111111
  overlayElevated:   dark[700],     // #1A1A1A
  overlayForeground: dark[100],     // #EDEDED
  overlayMuted:      dark[400],     // #737373
} as const;

export type LightTheme = typeof lightTheme;
