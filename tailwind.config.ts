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
        seday: {
          dark: "#1a3a6b",
          DEFAULT: "#2554a0",
          light: "#4a7fd4",
        },
      },
    },
  },
  plugins: [],
};

export default config;
