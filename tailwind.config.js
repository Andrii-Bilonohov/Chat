/** @type {import('tailwindcss').Config} */
module.exports = {
  // Сканувати ВСІ директорії з компонентами, а не тільки app-роути
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6",
        primaryDark: "#1D4ED8",
        secondary: "#1E293B",
        background: "#0A0F1D",
        surface: "#0F172A",
        surfaceLight: "#334155",
        textMuted: "#94A3B8",
        grey: "#94A3B8",
        danger: "#EF4444",
      },
    },
  },
  plugins: [],
};