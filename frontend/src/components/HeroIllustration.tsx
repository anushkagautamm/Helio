export default function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 400 340"
      className="w-full h-full"
      role="img"
      aria-label="Abstract illustration of a rooftop with solar panels under the sun"
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--c-sun-light))" stopOpacity="0.55" />
          <stop offset="100%" stopColor="rgb(var(--c-sun-light))" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="roofGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgb(var(--c-green))" />
          <stop offset="100%" stopColor="rgb(var(--c-green-dark))" />
        </linearGradient>
      </defs>

      <circle cx="200" cy="170" r="150" fill="url(#skyGrad)" />

      {/* Sun rays */}
      <g className="animate-ray-spin" style={{ transformOrigin: '300px 90px' }} opacity="0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <rect
            key={i}
            x="298"
            y="30"
            width="4"
            height="22"
            rx="2"
            fill="rgb(var(--c-sun))"
            transform={`rotate(${i * 36} 300 90)`}
          />
        ))}
      </g>
      {/* Sun */}
      <circle cx="300" cy="90" r="34" fill="rgb(var(--c-sun))" className="animate-sun-pulse" />

      {/* Roof */}
      <path d="M40 230 L200 120 L360 230 L340 230 L200 145 L60 230 Z" fill="url(#roofGrad)" />
      <rect x="60" y="230" width="280" height="70" rx="6" fill="rgb(var(--c-surface-2))" stroke="rgb(var(--c-border))" />

      {/* Solar panel grid on roof slope */}
      <g stroke="rgb(var(--c-green-dark))" strokeWidth="1.5" opacity="0.9">
        {[0, 1, 2, 3].map((col) => (
          <rect
            key={col}
            x={92 + col * 40}
            y={165 - col * 4}
            width="34"
            height="46"
            rx="2"
            fill="rgb(var(--c-green))"
            opacity="0.85"
            transform={`skewY(${-8 + col * 0}) `}
          />
        ))}
      </g>

      {/* Ground line */}
      <line x1="20" y1="300" x2="380" y2="300" stroke="rgb(var(--c-border))" strokeWidth="2" />
    </svg>
  )
}
