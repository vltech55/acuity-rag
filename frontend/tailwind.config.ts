import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        paper: "var(--paper)",
        "paper-ink": "var(--paper-ink)",
        muted: "var(--muted)",
        subtle: "var(--subtle)",
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          soft: "var(--accent-soft)",
        },
        sienna: { 400: "#db8b5f", 500: "#c97a4e", 600: "#a85f37" },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Charter', 'Georgia', '"Iowan Old Style"', 'Palatino', 'ui-serif', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: { '2xs': ['0.6875rem', { lineHeight: '1rem' }] },
      boxShadow: {
        glow: '0 0 0 1px rgba(245,222,179,0.06), 0 8px 24px -8px rgba(0,0,0,0.5)',
      },
      animation: {
        'pulse-dot': 'pulseDot 1.6s ease-in-out infinite',
        'slide-up': 'slideUp 240ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        pulseDot: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
export default config;
