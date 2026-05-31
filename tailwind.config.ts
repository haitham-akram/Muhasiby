import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F6F6F6",
        card: "#FFFFFF",
        border: "#E5E5E5",
        accent: {
          DEFAULT: "#000000",
          hover: "#1A1A1A",
        },
        text: {
          primary: "#000000",
          secondary: "#6B6B6B",
        },
        status: {
          confirmed: "#00A651",
          pending: "#F5A623",
          cancelled: "#E74C3C",
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
