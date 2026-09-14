export function formatInr(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value)
}

export function formatPayback(years: number | null, yearsInt: number | null, months: number | null): string {
  if (years === null || yearsInt === null || months === null) {
    return 'Not applicable'
  }
  if (yearsInt === 0) return `${months} month${months === 1 ? '' : 's'}`
  if (months === 0) return `${yearsInt} year${yearsInt === 1 ? '' : 's'}`
  return `${yearsInt} yr ${months} mo`
}

export function formatTonnes(kg: number, decimals = 2): string {
  return `${formatNumber(kg / 1000, decimals)} t`
}

export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Friendly, plain-language bucketing of a real irradiance value — never fabricates the number itself. */
export function describeSunlight(irradianceKwhPerM2Day: number): string {
  if (irradianceKwhPerM2Day >= 5.5) return 'Your location receives strong sunlight'
  if (irradianceKwhPerM2Day >= 4.5) return 'Your location receives good sunlight'
  return 'Your location receives moderate sunlight'
}
