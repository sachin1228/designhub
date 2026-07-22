import { neutral, blue, signal, dark } from "../tokens/colors";

/**
 * Light theme — Geist blue-600 (#0070f3) as primary accent,
 * blue-500 (#006bdb) as hover (darker shade).
 */
export const lightTheme = {
  background:        neutral[50],
  backgroundSubtle:  neutral[100],

  surface:           neutral[0],
  surfaceRaised:     neutral[100],

  foreground:        neutral[1000],
  foregroundMuted:   neutral[600],
  foregroundSubtle:  neutral[500],

  accent:            blue[600],     // #0070f3 — Geist blue-600
  accentHover:       blue[500],     // #006bdb — darker shade on hover
  accentSoft:        blue[1000],    // #f0f8ff — tinted bg
  accentForeground:  neutral[0],

  border:            neutral[200],
  borderSubtle:      neutral[100],

  signal,

  overlay:           dark[900],
  overlayRaised:     dark[800],
  overlayElevated:   dark[700],
  overlayForeground: dark[100],
  overlayMuted:      dark[400],
} as const;

export type LightTheme = typeof lightTheme;
