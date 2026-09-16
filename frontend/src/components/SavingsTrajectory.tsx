import { useId } from 'react'
import { formatInrShort, formatInrSigned } from '../utils/format'
import { TARIFF_RISE_OPTIONS, type Projection, type TariffRise } from '../utils/projection'
import { niceStep, useElementWidth } from '../utils/useElementWidth'

const HEIGHT = 260
const PAD = { top: 12, right: 8, bottom: 28, left: 48 }

const C = {
  forest: '#1E3A2F',
  loss: '#991B1B',
  ochre: '#B45309',
  charcoal: '#171717',
  grid: '#EFECE6',
  tertiary: '#948E82',
  bg: '#FAF8F5',
}

function TrajectoryChart({ projection }: { projection: Projection }) {
  const { ref, width } = useElementWidth<HTMLDivElement>()
  const uid = useId().replace(/:/g, '')
  const { years, lifetimeYears: n, breakevenYear, lifetimeNet, lifetimeGridSpend } = projection

  const x0 = PAD.left
  const x1 = Math.max(width - PAD.right, x0 + 1)
  const y0 = PAD.top
  const y1 = HEIGHT - PAD.bottom

  const rawMax = Math.max(lifetimeNet, 0)
  const rawMin = Math.min(-lifetimeGridSpend, years[0].netPosition, 0)
  const step = niceStep((rawMax - rawMin) / 3)
  const top = Math.max(Math.ceil(rawMax / step) * step, step)
  const bottom = Math.min(Math.floor(rawMin / step) * step, -step)

  const x = (year: number) => x0 + (year / n) * (x1 - x0)
  const y = (value: number) => y0 + ((top - value) / (top - bottom)) * (y1 - y0)
  const zeroY = y(0)

  const ticks: number[] = []
  for (let v = bottom; v <= top + step / 2; v += step) ticks.push(Math.round(v))

  const path = (pick: (p: (typeof years)[number]) => number) =>
    years.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.year).toFixed(1)} ${y(pick(p)).toFixed(1)}`).join(' ')
  const netLine = path((p) => p.netPosition)
  const gridLine = path((p) => -p.gridSpend)

  const showBreakeven = breakevenYear !== null && breakevenYear > 0 && breakevenYear <= n
  const bx = showBreakeven ? x(breakevenYear) : 0

  // Keep axis labels at least ~44px apart (and clear of the breakeven label) so
  // they never collide on narrow screens. The first and last ticks always stay.
  const MIN_GAP = 54
  const showBreakevenLabel = showBreakeven && bx - x0 >= 64
  // Visual centre of each label — the first is left-anchored and the last right-anchored.
  const labelCentre = (v: number) => (v === 0 ? x0 + 15 : v === n ? x1 - 18 : x(v))
  const candidates = [0, 5, 10, 15, 20, n].filter((v, i, arr) => v <= n && arr.indexOf(v) === i)
  const yearTicks: number[] = []
  for (const v of candidates) {
    const px = labelCentre(v)
    const isEdge = v === 0 || v === n
    const clearsBreakeven = !showBreakevenLabel || Math.abs(px - bx) >= MIN_GAP
    const clearsPrevious = yearTicks.length === 0 || px - labelCentre(yearTicks[yearTicks.length - 1]) >= MIN_GAP
    if (v === n) {
      while (yearTicks.length > 1 && px - labelCentre(yearTicks[yearTicks.length - 1]) < MIN_GAP) yearTicks.pop()
      yearTicks.push(v)
    } else if ((isEdge || clearsPrevious) && clearsBreakeven) {
      yearTicks.push(v)
    }
  }

  return (
    <div ref={ref} className="w-full" style={{ height: HEIGHT }}>
      <svg
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        className="block overflow-visible"
        role="img"
        aria-label={`Net savings reach ${formatInrSigned(lifetimeNet)} after ${n} years${
          showBreakeven ? `, breaking even in year ${breakevenYear.toFixed(1)}` : ''
        }.`}
      >
        <defs>
          <linearGradient id={`fill-${uid}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={C.forest} stopOpacity="0.12" />
            <stop offset="100%" stopColor={C.forest} stopOpacity="0" />
          </linearGradient>
          <clipPath id={`above-${uid}`}>
            <rect x={x0} y={0} width={Math.max(x1 - x0, 0)} height={Math.max(zeroY, 0)} />
          </clipPath>
        </defs>

        {ticks.map((v) => (
          <g key={v}>
            {v !== 0 && <line x1={x0} x2={x1} y1={y(v)} y2={y(v)} stroke={C.grid} strokeWidth="1" />}
            <text x={x0 - 10} y={y(v) + 3.5} textAnchor="end" fontFamily="JetBrains Mono" fontSize="10" fill={C.tertiary}>
              {v === 0 ? '₹0' : formatInrShort(v)}
            </text>
          </g>
        ))}
        <line x1={x0} x2={x1} y1={zeroY} y2={zeroY} stroke={C.charcoal} strokeOpacity="0.5" strokeWidth="1" />

        <path d={gridLine} fill="none" stroke={C.loss} strokeOpacity="0.7" strokeDasharray="4 4" strokeWidth="1.5" />
        <path
          d={`${netLine} L ${x(n).toFixed(1)} ${zeroY.toFixed(1)} L ${x(0).toFixed(1)} ${zeroY.toFixed(1)} Z`}
          fill={`url(#fill-${uid})`}
          clipPath={`url(#above-${uid})`}
        />
        <path d={netLine} fill="none" stroke={C.forest} strokeWidth="2.5" strokeLinejoin="round" />

        {showBreakeven && (
          <>
            <line x1={bx} x2={bx} y1={zeroY} y2={y1} stroke={C.ochre} strokeOpacity="0.6" strokeDasharray="2 3" />
            <circle cx={bx} cy={zeroY} r="4" fill={C.bg} stroke={C.ochre} strokeWidth="2" />
          </>
        )}
        <circle cx={x(n)} cy={y(lifetimeNet)} r="3.5" fill={C.forest} />

        {yearTicks.map((v) => (
          <text
            key={v}
            x={x(v)}
            y={HEIGHT - 8}
            textAnchor={v === 0 ? 'start' : v === n ? 'end' : 'middle'}
            fontFamily="JetBrains Mono"
            fontSize="10"
            fill={C.tertiary}
          >
            {v === 0 ? 'Today' : `${v} yrs`}
          </text>
        ))}
        {showBreakevenLabel && (
          <text x={bx} y={HEIGHT - 8} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="10" fontWeight="600" fill={C.ochre}>
            {breakevenYear.toFixed(1)} yrs
          </text>
        )}
      </svg>
    </div>
  )
}

export default function SavingsTrajectory({
  projection,
  tariffRise,
  onTariffRiseChange,
}: {
  projection: Projection
  tariffRise: TariffRise
  onTariffRiseChange: (rise: TariffRise) => void
}) {
  return (
    <div>
      <TrajectoryChart projection={projection} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-xs text-dossier-secondary">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="flex items-center gap-2">
            <span className="inline-block w-4 h-[2.5px] bg-dossier-forest" /> Your savings, after paying for the system
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-4 border-t-[1.5px] border-dashed border-dossier-loss/70" /> Grid bills avoided
          </span>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Yearly tariff rise">
          <span className="text-dossier-tertiary">Tariff rise / yr</span>
          <div className="flex border border-dossier-border">
            {TARIFF_RISE_OPTIONS.map((rise) => (
              <button
                key={rise}
                type="button"
                aria-pressed={rise === tariffRise}
                onClick={() => onTariffRiseChange(rise)}
                className={`px-2.5 py-1 font-mono transition-colors ${
                  rise === tariffRise ? 'bg-dossier-charcoal text-white' : 'text-dossier-secondary hover:text-dossier-charcoal'
                }`}
              >
                {rise}%
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
