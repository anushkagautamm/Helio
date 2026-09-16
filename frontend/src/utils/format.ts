export function formatInr(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

/** Tariffs need paise precision — ₹8.13, not a rounded ₹8. */
export function formatTariff(value: number): string {
  return `₹${value.toFixed(2)}`
}

/** Explicit sign for ledger/projection figures: +₹58,420 / −₹7,776 (true minus sign). */
export function formatInrSigned(value: number): string {
  const rounded = Math.round(value)
  if (rounded === 0) return formatInr(0)
  return `${rounded > 0 ? '+' : '−'}${formatInr(Math.abs(rounded))}`
}

/** Short axis labels in the Indian system: ₹40k, ₹1.5L, ₹12L. */
export function formatInrShort(value: number): string {
  const abs = Math.abs(value)
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  if (abs >= 100000) {
    const lakh = abs / 100000
    return `${sign}₹${lakh >= 10 ? Math.round(lakh) : Number(lakh.toFixed(1))}L`
  }
  if (abs >= 1000) return `${sign}₹${Math.round(abs / 1000)}k`
  return `${sign}₹${Math.round(abs)}`
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

export function formatReportDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}
