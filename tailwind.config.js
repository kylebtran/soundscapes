/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/views/**/*.ejs"],

  safelist: ["text-primary", "bg-background", "text-text", "text-muted"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        mono: ["DM Mono", "monospace"],
        serif: ["Anton", "serif"],
      },
      colors: {
        primary: "#BC9618", // Gold
        // secondary: "",
        text: "#15161D", // Eigengrau
        muted: "#6B7280", // Blue Gray
        background: "#F1F1F1", // Soft White
      },
      fontSize: {
        // "dynamic-h1": "clamp(140px,15cqw,240px)",
        // "dynamic-h2": "clamp(56px,6cqw,96px)",
      },
    },
  },
  plugins: [],
};
