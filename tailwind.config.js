/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"Segoe UI"', "system-ui", "-apple-system", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
        display: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a5f",
        },
        surface: "#f1f5f9",
        "surface-card": "#ffffff",
        border: "#e2e8f0",
        "border-strong": "#cbd5e1",
        text: "#1e293b",
        "text-muted": "#64748b",
        success: "#059669",
      },
      fontSize: {
        "3.5xl": ["2rem", { lineHeight: "2.25rem" }],
      },
    },
  },
  plugins: [],
};
