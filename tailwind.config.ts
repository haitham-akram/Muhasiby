import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        card: "var(--color-card)",
        border: "var(--color-border)",
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
        },
        status: {
          confirmed: "var(--color-status-confirmed)",
          pending: "var(--color-status-pending)",
          cancelled: "var(--color-status-cancelled)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        arabic: ["Cairo", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
