/** @type {import('tailwindcss').Config} */
export default {
  content: ["./*.html", "./src/**/*.{js,ts}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff5f2",
          100: "#ffe8e0",
          200: "#ffc9b8",
          300: "#ff9f7d",
          400: "#ff6b3d",
          500: "#ff4610",
          600: "#e03a0d",
          700: "#b82e0f",
          800: "#942a0f",
          900: "#7a260f",
          DEFAULT: "#ff4610",
        },
        surface: {
          DEFAULT: "#d4eaea",
          muted: "#c5dede",
          deep: "#a8d4d4",
        },
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgba(255, 70, 16, 0.15)",
        lift: "0 12px 40px -8px rgba(255, 70, 16, 0.22)",
      },
      animation: {
        "fade-up": "fadeUp 0.55s ease-out forwards",
        float: "float 5s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
