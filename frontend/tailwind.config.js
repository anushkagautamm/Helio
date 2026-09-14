/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--c-bg) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        surface2: 'rgb(var(--c-surface-2) / <alpha-value>)',
        edge: 'rgb(var(--c-border) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--c-text) / <alpha-value>)',
          muted: 'rgb(var(--c-text-muted) / <alpha-value>)',
          faint: 'rgb(var(--c-text-faint) / <alpha-value>)',
        },
        helio: {
          DEFAULT: 'rgb(var(--c-green) / <alpha-value>)',
          dark: 'rgb(var(--c-green-dark) / <alpha-value>)',
          light: 'rgb(var(--c-green-light) / <alpha-value>)',
          contrast: 'rgb(var(--c-green-contrast) / <alpha-value>)',
        },
        sun: {
          DEFAULT: 'rgb(var(--c-sun) / <alpha-value>)',
          light: 'rgb(var(--c-sun-light) / <alpha-value>)',
          contrast: 'rgb(var(--c-sun-contrast) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['Manrope', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -8px rgb(0 0 0 / 0.08)',
        'card-dark': '0 1px 2px rgb(0 0 0 / 0.3), 0 12px 32px -12px rgb(0 0 0 / 0.5)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'sun-pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.65 } },
        'ray-spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.45s ease-out both',
        'sun-pulse': 'sun-pulse 3.5s ease-in-out infinite',
        'ray-spin': 'ray-spin 60s linear infinite',
      },
    },
  },
  plugins: [],
}
