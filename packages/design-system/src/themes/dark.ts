import { neutral, blue, signal, dark } from "../tokens/colors";

/**
 * Dark theme — semantic color mappings.
 * Geist / Vercel dark: true near-black backgrounds (not warm charcoal),
 * cool neutral surfaces, Vercel blue accent brightened for dark-mode legibility.
 */
export const darkTheme = {
  /** Page and panel backgrounds */
  background:        dark[900],     // #0A0A0A — near-black page bg
  backgroundSubtle:  dark[800],     // #111111

  /** Card / elevated surfaces */
  surface:           dark[800],     // #111111
  surfaceRaised:     dark[700],     // #1A1A1A — cards, panels

  /** Text */
  foreground:        dark[100],     // #EDEDED — primary text
  foregroundMuted:   dark[400],     // #737373 — secondary text
  foregroundSubtle:  neutral[500],  // #737373 — tertiary

  /** Accent — slightly lighter blue for dark-mode legibility */
  accent:            blue[400],     // #60a5fa — brighter on dark bg
  accentHover:       blue[300],     // #93c5fd — hover on dark
  accentSoft:        dark[700],     // #1A1A1A — subtle tinted bg on dark
  accentForeground:  neutral[0],    // #FFFFFF — white text on accent bg

  /** Borders */
  border:            dark[600],     // #2E2E2E — Geist dark border
  borderSubtle:      dark[700],     // #1A1A1A — subtle dividers

  /** Brand signal — stays vivid in both modes */
  signal,                           // #0070f3

  /** Always-dark overlay panel */
  overlay:           dark[900],     // #0A0A0A
  overlayRaised:     dark[800],     // #111111
  overlayElevated:   dark[700],     // #1A1A1A
  overlayForeground: dark[100],     // #EDEDED
  overlayMuted:      dark[400],     // #737373
} as const;

export type DarkTheme = typeof darkTheme;
