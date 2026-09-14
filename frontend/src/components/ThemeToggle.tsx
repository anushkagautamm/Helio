import type { Theme } from '../utils/useTheme'

export default function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative inline-flex items-center w-14 h-8 rounded-full border border-edge bg-surface2 transition-colors shrink-0"
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-surface shadow flex items-center justify-center text-[13px] transition-transform ${
          isDark ? 'translate-x-6' : 'translate-x-0'
        }`}
      >
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  )
}
