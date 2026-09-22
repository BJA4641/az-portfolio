import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f3f6fb",
          100: "#e3e9f5",
          200: "#c3d0e8",
          300: "#9ab0d6",
          400: "#6a89bd",
          500: "#4a6aa0",
          600: "#385482",
          700: "#2d4267",
          800: "#263654",
          900: "#212e46",
          950: "#141a2b"
        }
      }
    }
  },
  plugins: []
};

export default config;
