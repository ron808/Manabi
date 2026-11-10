import type { Config } from "tailwindcss";

// Every colour is an RGB-channel CSS variable (see app/globals.css) so that
// opacity modifiers like `text-ink/60` work and both themes swap in one place.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ground: token("ground"),
        surface: token("surface"),
        sunken: token("sunken"),
        ink: token("ink"),
        accent: token("accent"),
        "accent-ink": token("accent-ink"),
        "on-accent": token("on-accent"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "var(--font-jp-sans)"],
        serif: ["var(--font-serif)", "var(--font-jp-serif)", "serif"],
        jp: ["var(--font-jp-serif)", "serif"],
        "jp-sans": ["var(--font-jp-sans)"],
      },
      borderRadius: {
        sm: "6px",
        md: "12px",
        lg: "20px",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      maxWidth: {
        page: "72rem",
        read: "42rem",
      },
      spacing: {
        gutter: "clamp(1rem, 3.2vw, 2rem)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "stamp-in": {
          "0%": { opacity: "0", transform: "scale(1.35) rotate(-14deg)" },
          "60%": { opacity: "1", transform: "scale(0.96) rotate(-7deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(-8deg)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        "stamp-in": "stamp-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};
export default config;
