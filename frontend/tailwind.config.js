/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "#000000",
        surface: "#101116",
        surfaceHover: "#181922",
        border: "rgba(255, 255, 255, 0.08)",
        apple: {
          bg: "#000000",
          card: "#12131A",
          cardHover: "#1A1C26",
          tertiary: "#222533",
          border: "rgba(255, 255, 255, 0.09)",
          borderLight: "rgba(255, 255, 255, 0.16)",
          blue: "#0A84FF",
          blueHover: "#0071E3",
          green: "#30D158",
          indigo: "#5E5CE6",
          purple: "#BF5AF2",
          orange: "#FF9F0A",
          red: "#FF453A",
          textPrimary: "#F5F5F7",
          textSecondary: "#86868B",
          textTertiary: "#6E6E73",
        },
      },
      borderRadius: {
        'squircle-sm': '10px',
        'squircle': '16px',
        'squircle-lg': '22px',
        'squircle-xl': '28px',
        'squircle-2xl': '36px',
      },
      boxShadow: {
        'apple-subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'apple-card': '0 8px 32px 0 rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'apple-card-hover': '0 16px 48px -4px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.16)',
        'apple-glow': '0 0 30px -4px rgba(48, 209, 88, 0.3)',
        'apple-blue-glow': '0 0 30px -4px rgba(10, 132, 255, 0.35)',
        'apple-purple-glow': '0 0 30px -4px rgba(191, 90, 242, 0.35)',
      }
    },
  },
  plugins: [],
}
