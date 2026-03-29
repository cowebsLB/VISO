import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fff4f0",
          100: "#ffe4d9",
          200: "#ffc9b0",
          300: "#ffa080",
          400: "#ff6b40",
          500: "#ff4610",
          600: "#ed3508",
          700: "#c4280a",
          800: "#9c2210",
          900: "#7e210f",
          950: "#440c04",
        },
        surface: "#d4eaea",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "var(--font-sans-ar)",
          "var(--font-sans-hy)",
          "system-ui",
          "sans-serif",
        ],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgb(255 70 16 / 0.12)",
        card: "0 8px 24px -8px rgb(0 0 0 / 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
