import { neutral, blue, signal, dark } from "../tokens/colors";

/**
 * Light theme — Geist blue-700 (#52a8ff) as primary accent,
 * blue-800 (#adcfff) as hover shade.
 */
export const lightTheme = {
  background:        neutral[50],
  backgroundSubtle:  neutral[100],

  surface:           neutral[0],
  surfaceRaised:     neutral[100],

  foreground:        neutral[1000],
  foregroundMuted:   neutral[600],
  foregroundSubtle:  neutral[500],

  accent:            blue[700],     // #52a8ff — Geist blue-700
  accentHover:       blue[800],     // #adcfff — hover shade
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
