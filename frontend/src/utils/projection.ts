import type { PanelResult } from './types'

/** Tariff-rise scenarios offered on the results page. 0% is the backend's own flat model. */
export const TARIFF_RISE_OPTIONS = [0, 3, 5] as const
export type TariffRise = (typeof TARIFF_RISE_OPTIONS)[number]

export interface ProjectionYear {
  year: number
  /** What the same electricity would have cost from the grid, cumulative (positive number). */
  gridSpend: number
  /** Cumulative savings minus the net system cost — negative until breakeven. */
  netPosition: number
}

export interface Projection {
  years: ProjectionYear[]
  lifetimeYears: number
  /** Fractional year at which netPosition crosses zero, or null if it never does within the lifetime. */
  breakevenYear: number | null
  lifetimeGridSpend: number
  lifetimeNet: number
  /** Net cost spread over every unit generated in the lifetime (₹/kWh). */
  costPerKwh: number | null
}

/**
 * Cumulative position over the system lifetime, derived only from numbers the
 * backend already returned (net cost, annual savings, annual generation).
 * Generation is held flat — no degradation — to stay on the same basis as the
 * backend's payback period. With tariffRisePercent = 0 the breakeven year
 * equals panel.payback_years exactly; a positive rise only scales what each
 * avoided grid unit would have cost in later years.
 */
export function projectLifetime(panel: PanelResult, lifetimeYears: number, tariffRisePercent: number): Projection {
  const growth = 1 + tariffRisePercent / 100
  const years: ProjectionYear[] = [{ year: 0, gridSpend: 0, netPosition: -panel.net_cost_inr }]
  let breakevenYear: number | null = panel.net_cost_inr <= 0 ? 0 : null

  let gridSpend = 0
  for (let year = 1; year <= lifetimeYears; year++) {
    const yearSavings = panel.annual_savings_inr * growth ** (year - 1)
    const previousNet = years[year - 1].netPosition
    gridSpend += yearSavings
    const netPosition = gridSpend - panel.net_cost_inr
    if (breakevenYear === null && previousNet < 0 && netPosition >= 0 && yearSavings > 0) {
      breakevenYear = year - 1 + -previousNet / yearSavings
    }
    years.push({ year, gridSpend, netPosition })
  }

  const totalGeneration = panel.annual_generation_kwh * lifetimeYears
  return {
    years,
    lifetimeYears,
    breakevenYear,
    lifetimeGridSpend: gridSpend,
    lifetimeNet: gridSpend - panel.net_cost_inr,
    costPerKwh: totalGeneration > 0 ? panel.net_cost_inr / totalGeneration : null,
  }
}

/** Lifetime implied by the backend's own CO₂ figures (lifetime ÷ annual), defaulting to 25 years. */
export function lifetimeYearsFor(panel: PanelResult): number {
  return panel.co2_avoided_kg_per_year > 0
    ? Math.round(panel.lifetime_co2_avoided_kg / panel.co2_avoided_kg_per_year)
    : 25
}
