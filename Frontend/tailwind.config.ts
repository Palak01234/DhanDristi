import type { Config } from "tailwindcss";

const scale = (role: string) => ({
  50: `oklch(var(--${role}-50) / <alpha-value>)`,
  100: `oklch(var(--${role}-100) / <alpha-value>)`,
  200: `oklch(var(--${role}-200) / <alpha-value>)`,
  300: `oklch(var(--${role}-300) / <alpha-value>)`,
  400: `oklch(var(--${role}-400) / <alpha-value>)`,
  500: `oklch(var(--${role}-500) / <alpha-value>)`,
  600: `oklch(var(--${role}-600) / <alpha-value>)`,
  700: `oklch(var(--${role}-700) / <alpha-value>)`,
  800: `oklch(var(--${role}-800) / <alpha-value>)`,
  900: `oklch(var(--${role}-900) / <alpha-value>)`,
  950: `oklch(var(--${role}-950) / <alpha-value>)`,
});

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        display: ["var(--font-heading)", "system-ui", "sans-serif"],
        label: ["var(--font-label)", "system-ui", "sans-serif"],
      },
      colors: {
        background: scale("background"),
        primary: scale("primary"),
        accent: scale("accent"),
        secondary: scale("secondary"),
        foreground: scale("foreground"),
      },
      boxShadow: {
        soft: "0 1px 3px oklch(var(--foreground-950) / 0.06)",
        glow: "0 0 0 1.5px oklch(var(--primary-500) / 0.5)",
      },
      minHeight: ({ theme }) => ({ ...theme("spacing") }),
      minWidth: ({ theme }) => ({ ...theme("spacing") }),
      animation: {
        "scan-line": "scan-line 2.8s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.2,0.6,0.4,1) infinite",
        "fade-up": "fade-up 0.5s cubic-bezier(0.2,0.7,0.2,1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;