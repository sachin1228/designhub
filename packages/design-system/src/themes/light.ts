import { neutral, blue, signal, dark } from "../tokens/colors";

/**
 * Light theme — semantic color mappings.
 * Geist / Vercel design language:
 * off-white page background, pure white surfaces, near-black foreground,
 * crisp 1px borders, #1289ff brand blue accent.
 */
export const lightTheme = {
  /** Page and panel backgrounds */
  background:        neutral[50],   // #FAFAFA — off-white canvas
  backgroundSubtle:  neutral[100],  // #F5F5F5

  /** Card / elevated surfaces */
  surface:           neutral[0],    // #FFFFFF — white surfaces pop on off-white bg
  surfaceRaised:     neutral[100],  // #F5F5F5

  /** Text */
  foreground:        neutral[1000], // #0A0A0A — near-black primary text
  foregroundMuted:   neutral[600],  // #525252
  foregroundSubtle:  neutral[500],  // #737373

  /** Accent — #1289ff brand blue */
  accent:            blue[500],     // #1289ff
  accentHover:       blue[600],     // #0070e6 — hover
  accentSoft:        blue[50],      // #eef5ff — soft tinted bg
  accentForeground:  neutral[0],    // #FFFFFF — white text on blue

  /** Borders */
  border:            neutral[200],  // #EAEAEA
  borderSubtle:      neutral[100],  // #F5F5F5

  /** Brand signal */
  signal,                           // #1289ff

  /** Always-dark overlay panel */
  overlay:           dark[900],     // #0A0A0A
  overlayRaised:     dark[800],     // #111111
  overlayElevated:   dark[700],     // #1A1A1A
  overlayForeground: dark[100],     // #EDEDED
  overlayMuted:      dark[400],     // #737373
} as const;

export type LightTheme = typeof lightTheme;
