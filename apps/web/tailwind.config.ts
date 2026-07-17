import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#15151F",
        "ink-soft": "#201F2E",
        paper: "#F5F4F0",
        accent: "#5B4FE8",
        "accent-hover": "#4B3FD6",
        "accent-soft": "#EDEBFC",
        signal: "#C8FF5B",
        muted: "#6B6975",
        "muted-dark": "#9A97A8",
        hairline: "#E4E2DC",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
