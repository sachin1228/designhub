import { neutral, blue, signal, dark } from "../tokens/colors";

/**
 * Dark theme — semantic color mappings.
 * Geist near-black backgrounds, #1289ff brand blue (bright enough for dark bg).
 */
export const darkTheme = {
  /** Page and panel backgrounds */
  background:        dark[900],     // #0A0A0A
  backgroundSubtle:  dark[800],     // #111111

  /** Card / elevated surfaces */
  surface:           dark[800],     // #111111
  surfaceRaised:     dark[700],     // #1A1A1A

  /** Text */
  foreground:        dark[100],     // #EDEDED
  foregroundMuted:   dark[400],     // #737373
  foregroundSubtle:  neutral[500],  // #737373

  /** Accent — blue[400] slightly lighter for dark-mode legibility */
  accent:            blue[400],     // #4fa3ff — vivid on dark bg
  accentHover:       blue[300],     // #8bbeff — hover on dark
  accentSoft:        dark[700],     // #1A1A1A — subtle tinted bg on dark
  accentForeground:  neutral[0],    // #FFFFFF

  /** Borders */
  border:            dark[600],     // #2E2E2E
  borderSubtle:      dark[700],     // #1A1A1A

  /** Brand signal */
  signal,                           // #1289ff

  /** Always-dark overlay panel */
  overlay:           dark[900],     // #0A0A0A
  overlayRaised:     dark[800],     // #111111
  overlayElevated:   dark[700],     // #1A1A1A
  overlayForeground: dark[100],     // #EDEDED
  overlayMuted:      dark[400],     // #737373
} as const;

export type DarkTheme = typeof darkTheme;
