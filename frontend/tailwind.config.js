/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dossier: {
          bg: '#FAF8F5',
          surface: '#FFFFFF',
          muted: '#F4F1EA',
          border: '#E7E2D8',
          'border-subtle': '#EFECE6',
          charcoal: '#171717',
          ink: '#1F2421',
          secondary: '#666158',
          tertiary: '#948E82',
          ochre: '#B45309',
          'ochre-light': '#FDF8F0',
          forest: '#1E3A2F',
          sage: '#2C5E43',
          loss: '#991B1B',
          leaf: '#7CC3A3',
        },
      },
      fontFamily: {
        serif: ['Georgia', '"Noto Serif"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        float: '0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        modal: '0 20px 30px -10px rgba(15, 23, 42, 0.12), 0 0 1px rgba(15, 23, 42, 0.2)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
      },
    },
  },
  plugins: [],
}
