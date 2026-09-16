import { useState } from 'react'
import type { PanelResult } from '../utils/types'
import { formatNumber, MONTH_LABELS } from '../utils/format'
import { niceStep, useElementWidth } from '../utils/useElementWidth'

const HEIGHT = 220
const PAD = { top: 20, right: 4, bottom: 26, left: 40 }

function GenerationBars({ values }: { values: number[] }) {
  const { ref, width } = useElementWidth<HTMLDivElement>()
  const [hovered, setHovered] = useState<number | null>(null)

  const max = Math.max(...values, 0)
  const step = niceStep(max / 3)
  const top = Math.max(Math.ceil(max / step) * step, step)

  const x0 = PAD.left
  const x1 = Math.max(width - PAD.right, x0 + 1)
  const y0 = PAD.top
  const y1 = HEIGHT - PAD.bottom
  const band = (x1 - x0) / values.length
  const barWidth = Math.max(Math.min(band * 0.46, 22), 4)
  const y = (v: number) => y1 - (v / top) * (y1 - y0)
  const narrow = width < 440

  const ticks: number[] = []
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(v)

  return (
    <div ref={ref} className="w-full" style={{ height: HEIGHT }} onMouseLeave={() => setHovered(null)}>
      <svg
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        className="block overflow-visible"
        role="img"
        aria-label={`Estimated monthly generation: ${values.map((v, i) => `${MONTH_LABELS[i]} ${Math.round(v)} kWh`).join(', ')}`}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line x1={x0} x2={x1} y1={y(v)} y2={y(v)} stroke={v === 0 ? '#171717' : '#EFECE6'} strokeOpacity={v === 0 ? 0.5 : 1} />
            <text x={x0 - 10} y={y(v) + 3.5} textAnchor="end" fontFamily="JetBrains Mono" fontSize="10" fill="#948E82">
              {formatNumber(v)}
            </text>
          </g>
        ))}

        {values.map((v, i) => {
          const cx = x0 + band * i + band / 2
          const dim = hovered !== null && hovered !== i
          return (
            <g key={MONTH_LABELS[i]} onMouseEnter={() => setHovered(i)}>
              <rect x={x0 + band * i} y={y0} width={band} height={y1 - y0} fill="transparent" />
              <rect
                x={cx - barWidth / 2}
                y={y(v)}
                width={barWidth}
                height={Math.max(y1 - y(v), 0)}
                fill="#1E3A2F"
                fillOpacity={dim ? 0.3 : 0.9}
                className="transition-[fill-opacity] duration-150"
              />
              <text x={cx} y={HEIGHT - 8} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="10" fill={hovered === i ? '#171717' : '#948E82'}>
                {narrow ? MONTH_LABELS[i][0] : MONTH_LABELS[i]}
              </text>
              {hovered === i && (
                <text x={cx} y={y(v) - 7} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="10" fontWeight="600" fill="#171717">
                  {formatNumber(v)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default function GenerationProfile({ panel, isFallback }: { panel: PanelResult; isFallback: boolean }) {
  const values = MONTH_LABELS.map((_, i) => panel.monthly_generation_series_kwh[i] ?? panel.monthly_generation_kwh)
  const peak = values.indexOf(Math.max(...values))
  const low = values.indexOf(Math.min(...values))

  return (
    <div>
      <p className="text-dossier-secondary">
        <span className="font-serif text-3xl text-dossier-charcoal tabular">{formatNumber(panel.annual_generation_kwh)}</span>{' '}
        kWh generated a year
      </p>
      <div className="mt-8">
        <GenerationBars values={values} />
      </div>
      <p className="mt-4 text-sm text-dossier-tertiary">
        {isFallback
          ? 'Seasonal data was unavailable, so a flat average was used.'
          : `Strongest in ${MONTH_LABELS[peak]}, lowest in ${MONTH_LABELS[low]} — from NASA POWER monthly averages.`}
      </p>
    </div>
  )
}
