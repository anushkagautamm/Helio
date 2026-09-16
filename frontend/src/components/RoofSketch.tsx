/**
 * Isometric line drawing of a flat-terrace home with a panel array and the
 * sun's path — drafted in the report's hairline style, purely decorative.
 */
const CX = 220
const CY = 176
const A = 170 // depth along x
const B = 124 // width along y
const H = 92 // wall height

function p(x: number, y: number, z: number): string {
  return `${(CX + (x - y) * 0.866).toFixed(1)},${(CY + (x + y) * 0.5 - z).toFixed(1)}`
}

const poly = (...pts: [number, number, number][]) => pts.map(([x, y, z]) => p(x, y, z)).join(' ')

const PANEL_W = 26
const PANEL_D = 20
const GAP = 5
const panels: string[] = []
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 4; col++) {
    const x = 24 + col * (PANEL_W + GAP)
    const y = 20 + row * (PANEL_D + GAP)
    panels.push(poly([x, y, H + 4], [x + PANEL_W, y, H + 4], [x + PANEL_W, y + PANEL_D, H + 4], [x, y + PANEL_D, H + 4]))
  }
}

export default function RoofSketch({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 440 360" className={className} aria-hidden="true">
      {/* Sun path */}
      <path d="M 24 150 Q 220 -76 416 150" fill="none" stroke="#948E82" strokeWidth="1" strokeDasharray="2 5" />
      <circle cx="318" cy="60" r="26" fill="#B45309" fillOpacity="0.08" />
      <circle cx="318" cy="60" r="13" fill="#B45309" />
      <text x="24" y="172" fontFamily="JetBrains Mono" fontSize="10" letterSpacing="1" fill="#948E82">
        SUN PATH
      </text>

      {/* Ground shadow */}
      <polygon points={poly([0, B, 0], [A, B, 0], [A + 34, B + 20, 0], [34, B + 20, 0])} fill="#171717" fillOpacity="0.025" />

      {/* Walls and terrace */}
      <g stroke="#171717" strokeOpacity="0.85" strokeWidth="1" strokeLinejoin="round">
        <polygon points={poly([0, B, H], [A, B, H], [A, B, 0], [0, B, 0])} fill="#F4F1EA" />
        <polygon points={poly([A, 0, H], [A, B, H], [A, B, 0], [A, 0, 0])} fill="#EAE5DA" />
        <polygon points={poly([0, 0, H], [A, 0, H], [A, B, H], [0, B, H])} fill="#FFFFFF" />
        {/* Parapet lip */}
        <polyline points={poly([0, B, H + 7], [A, B, H + 7], [A, 0, H + 7])} fill="none" strokeOpacity="0.35" />
      </g>

      {/* Window and door on the long face */}
      <g stroke="#171717" strokeOpacity="0.5" strokeWidth="1" fill="none">
        <polygon points={poly([26, B, 58], [62, B, 58], [62, B, 30], [26, B, 30])} />
        <polygon points={poly([104, B, 64], [132, B, 64], [132, B, 0], [104, B, 0])} />
      </g>

      {/* Panel array */}
      <g fill="#1E3A2F" stroke="#FFFFFF" strokeWidth="0.75">
        {panels.map((points, i) => (
          <polygon key={i} points={points} fillOpacity={0.9} />
        ))}
      </g>
    </svg>
  )
}
