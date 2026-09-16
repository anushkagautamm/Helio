/** First two parts of a Nominatim display name — "Koramangala, Bengaluru" rather than the full admin chain. */
export function shortPlaceName(displayName: string): string {
  const parts = displayName.split(',').map((p) => p.trim()).filter(Boolean)
  return parts.slice(0, 2).join(', ') || displayName
}

export function formatLat(lat: number): string {
  return `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`
}

export function formatLon(lon: number): string {
  return `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}`
}
