import { useState } from 'react'
import { reverseGeocode } from '../services/api'
import type { LocationResult } from '../utils/types'
import MapView from '../components/LazyMapView'
import ErrorBanner from '../components/ErrorBanner'
import ExpandableSection from '../components/ExpandableSection'

interface LocationPageProps {
  selected: LocationResult | null
  onSelect: (location: LocationResult) => void
  onNext: () => void
  onBack: () => void
}

export default function LocationPage({ selected, onSelect, onNext, onBack }: LocationPageProps) {
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)

  const [manualOpen, setManualOpen] = useState(false)
  const [manualLat, setManualLat] = useState('')
  const [manualLon, setManualLon] = useState('')
  const [manualError, setManualError] = useState<string | null>(null)

  async function useCurrentLocation() {
    setGpsError(null)
    if (!navigator.geolocation) {
      setGpsError('Your browser does not support location access. You can enter coordinates manually instead.')
      setManualOpen(true)
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lon = position.coords.longitude
        try {
          const place = await reverseGeocode(lat, lon)
          onSelect(place)
        } catch {
          onSelect({ lat, lon, display_name: `${lat.toFixed(5)}, ${lon.toFixed(5)}`, attribution: 'Your device location' })
        } finally {
          setGpsLoading(false)
        }
      },
      (err) => {
        setGpsLoading(false)
        setManualOpen(true)
        setGpsError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied. No problem — enter your home's coordinates manually below."
            : "Couldn't get your current location. No problem — enter your home's coordinates manually below.",
        )
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  function useManualCoordinates() {
    const lat = Number(manualLat)
    const lon = Number(manualLon)
    if (Number.isNaN(lat) || Number.isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setManualError('Please enter a valid latitude (-90 to 90) and longitude (-180 to 180).')
      return
    }
    onSelect({
      lat,
      lon,
      display_name: `Manual coordinates (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
      attribution: 'Manually entered coordinates',
    })
    setManualError(null)
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <h2 className="font-display text-2xl font-bold text-ink mb-1">Where is your home?</h2>
      <p className="text-ink-muted mb-6 text-sm">
        Helio uses this to look up your local solar resource and map your roof.
      </p>

      <button
        type="button"
        onClick={useCurrentLocation}
        disabled={gpsLoading}
        className="w-full choice-card flex items-center gap-4"
        aria-pressed={!!selected && !manualOpen}
      >
        <span className="text-2xl shrink-0" aria-hidden="true">📍</span>
        <span className="flex-1">
          <span className="font-display font-semibold text-ink block text-base">
            {gpsLoading ? 'Getting your location…' : 'Use My Current Location'}
          </span>
          <span className="text-xs text-ink-muted">The fastest way — uses your browser's location</span>
        </span>
        {gpsLoading && (
          <span className="w-5 h-5 border-2 border-helio-light border-t-helio rounded-full animate-spin shrink-0" />
        )}
      </button>

      {gpsError && (
        <div className="mt-3">
          <ErrorBanner title="Couldn't use your location" message={gpsError} />
        </div>
      )}

      {/* Selected confirmation */}
      {selected && (
        <div className="card mt-4 border-helio/30 bg-helio-light/40">
          <p className="text-xs font-semibold text-helio uppercase tracking-wide mb-2">Location selected</p>
          <p className="text-sm font-medium text-ink mb-3">{selected.display_name}</p>
          <div className="mb-3">
            <MapView lat={selected.lat} lon={selected.lon} heightClass="h-40" zoom={14} />
          </div>
          <p className="text-xs text-ink-muted">
            Lat {selected.lat.toFixed(5)}, Lon {selected.lon.toFixed(5)} — {selected.attribution}
          </p>
          <p className="text-xs text-ink-faint mt-2">
            Helio only uses your location to estimate solar resource and map your roof. Your
            location is not permanently stored.
          </p>
        </div>
      )}

      {/* Manual fallback */}
      <div className="mt-4">
        <ExpandableSection title="Enter coordinates manually" defaultOpen={manualOpen}>
          <p className="text-xs text-ink-muted mb-3">
            You can find latitude/longitude from any map app — long-press a location to see its
            coordinates.
          </p>
          {manualError && <div className="mb-3"><ErrorBanner message={manualError} /></div>}
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <input
              type="number"
              step="any"
              className="input-field"
              placeholder="Latitude e.g. 12.9716"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              aria-label="Latitude"
            />
            <input
              type="number"
              step="any"
              className="input-field"
              placeholder="Longitude e.g. 77.5946"
              value={manualLon}
              onChange={(e) => setManualLon(e.target.value)}
              aria-label="Longitude"
            />
          </div>
          <button type="button" className="btn-secondary" onClick={useManualCoordinates}>
            Use these coordinates
          </button>
        </ExpandableSection>
      </div>

      <div className="flex justify-between mt-7">
        <button className="btn-secondary" onClick={onBack}>
          Back
        </button>
        <button className="btn-primary" onClick={onNext} disabled={!selected}>
          Continue
        </button>
      </div>
    </div>
  )
}
