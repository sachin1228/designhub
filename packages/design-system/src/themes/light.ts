import { neutral, blue, signal, dark } from "../tokens/colors";

/**
 * Light theme — semantic color mappings.
 * Geist design language with blue-700 as primary accent.
 */
export const lightTheme = {
  /** Page and panel backgrounds */
  background:        neutral[50],   // #FAFAFA
  backgroundSubtle:  neutral[100],  // #F5F5F5

  /** Card / elevated surfaces */
  surface:           neutral[0],    // #FFFFFF
  surfaceRaised:     neutral[100],  // #F5F5F5

  /** Text */
  foreground:        neutral[1000], // #0A0A0A
  foregroundMuted:   neutral[600],  // #525252
  foregroundSubtle:  neutral[500],  // #737373

  /** Accent — Geist blue-700 */
  accent:            blue[700],     // #0057b7
  accentHover:       blue[800],     // #004494 — darker shade on hover
  accentSoft:        blue[100],     // #cce7ff — tinted bg
  accentForeground:  neutral[0],    // #FFFFFF

  /** Borders */
  border:            neutral[200],  // #EAEAEA
  borderSubtle:      neutral[100],  // #F5F5F5

  /** Brand signal */
  signal,                           // #0057b7

  /** Always-dark overlay panel */
  overlay:           dark[900],     // #0A0A0A
  overlayRaised:     dark[800],     // #111111
  overlayElevated:   dark[700],     // #1A1A1A
  overlayForeground: dark[100],     // #EDEDED
  overlayMuted:      dark[400],     // #737373
} as const;

export type LightTheme = typeof lightTheme;
