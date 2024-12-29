/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/views/**/*.ejs"],

  safelist: ["text-primary", "bg-background", "text-text"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      colors: {
        primary: "#BC9618", // Gold
        // secondary: "",
        text: "#15161D", // Eigengrau
        background: "#F1F1F1", // Soft White
      },
    },
  },
  plugins: [],
};
