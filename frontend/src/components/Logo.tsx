interface LogoProps {
  className?: string
}

/**
 * Inline (not <img>) so the H/LIO wordmark can use currentColor and stay
 * legible in both themes automatically — an external .svg referenced via
 * <img src> can't inherit page CSS/color. The static asset at
 * public/helio-logo.svg (fixed brand colors) stays the canonical export for
 * anywhere outside the app — e.g. favicon, PDF, sharing.
 */
export default function Logo({ className = 'h-10' }: LogoProps) {
  return (
    <svg viewBox="-30 70 415 115" className={`w-auto text-ink ${className}`} role="img" aria-label="Helio">
      <defs>
        <linearGradient id="helio-logo-panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3A4550" />
          <stop offset="100%" stopColor="#1B2228" />
        </linearGradient>
        <radialGradient id="helio-logo-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD98A" />
          <stop offset="45%" stopColor="#FFA733" />
          <stop offset="100%" stopColor="#E8600C" />
        </radialGradient>
      </defs>

      <g transform="translate(60,110)">
        <circle cx="30" cy="20" r="26" fill="url(#helio-logo-sun)" />

        <g stroke="#FF8A2B" strokeWidth="4" strokeLinecap="round">
          <line x1="30" y1="-8" x2="30" y2="-24" />
          <line x1="51.89" y1="2.54" x2="64.40" y2="-7.43" />
          <line x1="57.31" y1="26.23" x2="72.92" y2="29.79" />
          <line x1="42.15" y1="45.23" x2="49.09" y2="59.64" />
          <line x1="17.85" y1="45.23" x2="10.91" y2="59.64" />
          <line x1="2.69" y1="26.23" x2="-12.92" y2="29.79" />
          <line x1="8.11" y1="2.54" x2="-4.40" y2="-7.43" />
        </g>

        <polygon points="-70,20 30,20 55,55 -45,55" fill="url(#helio-logo-panel)" stroke="#8A94A0" strokeWidth="2" />

        <g stroke="#5A6572" strokeWidth="1.2" opacity="0.8">
          <line x1="-57.5" y1="20" x2="-32.5" y2="55" />
          <line x1="-45" y1="20" x2="-20" y2="55" />
          <line x1="-32.5" y1="20" x2="-7.5" y2="55" />
          <line x1="-20" y1="20" x2="5" y2="55" />
          <line x1="-7.5" y1="20" x2="17.5" y2="55" />
          <line x1="5" y1="20" x2="30" y2="55" />
          <line x1="17.5" y1="20" x2="42.5" y2="55" />
          <line x1="-61.67" y1="31.67" x2="38.33" y2="31.67" />
          <line x1="-53.33" y1="43.33" x2="46.67" y2="43.33" />
        </g>
      </g>

      <g transform="translate(147,150)" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="72" letterSpacing="1">
        <text x="0" y="0" fill="currentColor">H</text>
        <text x="52" y="0" fill="#FF7A1A">E</text>
        <text x="100" y="0" fill="currentColor">LIO</text>
      </g>
    </svg>
  )
}
