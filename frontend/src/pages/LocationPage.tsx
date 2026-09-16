import { useState } from 'react'
import { reverseGeocode } from '../services/api'
import type { LocationResult } from '../utils/types'
import MapView from '../components/LazyMapView'
import ErrorBanner from '../components/ErrorBanner'
import OptionRow from '../components/OptionRow'
import PageHeading from '../components/PageHeading'
import WizardNav from '../components/WizardNav'
import { formatLat, formatLon } from '../utils/place'

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
    if (
      manualLat.trim() === '' ||
      manualLon.trim() === '' ||
      Number.isNaN(lat) ||
      Number.isNaN(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
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
    <div>
      <PageHeading eyebrow="Step 1 of 3" title="Where is your home?">
        We use it to look up the sunlight at your exact location. It's only used for this estimate.
      </PageHeading>

      <div className="border-y border-dossier-border divide-y divide-dossier-border">
        <OptionRow
          icon="my_location"
          title={gpsLoading ? 'Finding your location…' : 'Use my current location'}
          description="Fastest — uses your browser's location."
          onClick={useCurrentLocation}
          disabled={gpsLoading}
          trailing={gpsLoading ? <span className="w-1.5 h-1.5 rounded-full bg-dossier-ochre animate-pulse shrink-0" /> : undefined}
        />
        <OptionRow
          icon="edit"
          title="Enter coordinates"
          description="Copy them from any map app."
          onClick={() => setManualOpen((v) => !v)}
          expanded={manualOpen}
        >
          <div className="space-y-4">
            {manualError && <ErrorBanner message={manualError} />}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-sm text-dossier-secondary mb-1.5">Latitude</span>
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  className="input-field tabular"
                  placeholder="12.9716"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="block text-sm text-dossier-secondary mb-1.5">Longitude</span>
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  className="input-field tabular"
                  placeholder="77.5946"
                  value={manualLon}
                  onChange={(e) => setManualLon(e.target.value)}
                />
              </label>
            </div>
            <button type="button" className="btn-secondary" onClick={useManualCoordinates}>
              Use these coordinates
            </button>
          </div>
        </OptionRow>
      </div>

      {gpsError && (
        <div className="mt-6">
          <ErrorBanner message={gpsError} />
        </div>
      )}

      {selected && (
        <div className="mt-10 animate-fade-in">
          <div className="border border-dossier-border">
            <MapView lat={selected.lat} lon={selected.lon} heightClass="h-64" zoom={15} />
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-4">
            <p className="text-sm text-dossier-charcoal">{selected.display_name}</p>
            <p className="hidden sm:block text-xs font-mono text-dossier-tertiary whitespace-nowrap">
              {formatLat(selected.lat)}, {formatLon(selected.lon)}
            </p>
          </div>
        </div>
      )}

      <WizardNav onBack={onBack} onNext={onNext} nextDisabled={!selected} />
    </div>
  )
}
