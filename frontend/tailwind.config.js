/** @type {import('tailwindcss').Config} */
module.exports = {
  important: "#admin-root",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        card: "var(--card)",
        tint: "var(--tint)",
        text: "var(--text)",
        heading: "var(--heading)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primaryHover)",
        },
        border: "var(--border)",
      },
      boxShadow: {
        shadow: "var(--shadow)",
        shadowHover: "var(--shadowHover)",
      },
      ringColor: {
        focus: "var(--focus)",
      },
      ringOffsetColor: {
        bg: "var(--bg)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Poppins", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
