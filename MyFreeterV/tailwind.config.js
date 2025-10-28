// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#2c3e50",
          dark: "#1a2332",
        },
        orange: {
          DEFAULT: "#c67236",
          light: "#d68347",
        },
        dark: {
          primary: "#1a1a1a",
          secondary: "#252525",
          tertiary: "#2f2f2f",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
