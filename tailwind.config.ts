import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#08090F",
          900: "#0B0F1A",
          800: "#11162A",
          700: "#1A1A2E",
          600: "#22253D",
          500: "#2D3150",
        },
        sakura: {
          50: "#FFF1F5",
          100: "#FFE4EC",
          200: "#FFC9DC",
          300: "#FF9DBE",
          400: "#FF6FA3",
          500: "#F0467F",
          600: "#D02A66",
        },
        brand: {
          400: "#7C7BFF",
          500: "#4F46E5",
          600: "#4338CA",
          700: "#3730A3",
        },
        gold: {
          400: "#F5C97B",
          500: "#E8A93C",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        jp: ["var(--font-jp)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "serif"],
      },
      letterSpacing: {
        tightish: "-0.012em",
        tighter2: "-0.025em",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,123,255,0.25), 0 8px 40px -12px rgba(79,70,229,0.55)",
        soft: "0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 40px -20px rgba(0,0,0,0.6)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.95)", opacity: "0.7" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        "float-slow": {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        shimmer: "shimmer 1.6s linear infinite",
        "pulse-ring": "pulse-ring 1.6s ease-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
