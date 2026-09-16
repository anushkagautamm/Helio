import { useState } from 'react'
import type { GPSPoint } from '../utils/types'
import { estimateGpsRoofArea } from '../services/api'
import { formatNumber } from '../utils/format'
import ErrorBanner from './ErrorBanner'
import MapView from './LazyMapView'

const MAX_POINTS = 8

interface GPSRoofMeasureProps {
  onEstimated: (sqft: number) => void
}

export default function GPSRoofMeasure({ onEstimated }: GPSRoofMeasureProps) {
  const [started, setStarted] = useState(false)
  const [points, setPoints] = useState<GPSPoint[]>([])
  const [error, setError] = useState<string | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [result, setResult] = useState<{ area_sqft: number; area_sqm: number; warning: string } | null>(null)

  const lastPoint = points[points.length - 1]
  const mapCenter = lastPoint ?? { lat: 20.5937, lon: 78.9629 }

  function startMeasurement() {
    setStarted(true)
    setPoints([])
    setResult(null)
    setError(null)
  }

  function capturePoint() {
    if (!navigator.geolocation) {
      setError('Your browser does not support GPS location access.')
      return
    }
    setCapturing(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPoints((prev) => [...prev, { lat: position.coords.latitude, lon: position.coords.longitude }])
        setCapturing(false)
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was denied. Please allow location access to use GPS measurement, or enter the area instead.'
            : 'Could not get your current location. Please try again or enter the area instead.',
        )
        setCapturing(false)
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  function undoLastPoint() {
    setPoints((prev) => prev.slice(0, -1))
    setResult(null)
  }

  async function finishMeasurement() {
    if (points.length < 3) {
      setError('Please record at least 3 points around your roof perimeter.')
      return
    }
    setCalculating(true)
    setError(null)
    try {
      setResult(await estimateGpsRoofArea(points))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not calculate area from these points.')
    } finally {
      setCalculating(false)
    }
  }

  if (!started) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-dossier-secondary leading-relaxed">
          Stand at each corner of your roof and record a point. Phone GPS can be off by a few metres, so treat the result
          as a rough figure.
        </p>
        <button type="button" className="btn-secondary" onClick={startMeasurement}>
          Start measuring
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <ErrorBanner message={error} />}

      <div className="border border-dossier-border">
        <MapView lat={mapCenter.lat} lon={mapCenter.lon} heightClass="h-60" zoom={19} polygonPoints={points} hideMarker />
      </div>

      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-dossier-secondary tabular">
          {points.length} of {MAX_POINTS} points{points.length < 3 && ` · ${3 - points.length} more needed`}
        </span>
        <span className="flex gap-5">
          {points.length > 0 && (
            <button type="button" className="text-dossier-secondary hover:text-dossier-charcoal" onClick={undoLastPoint}>
              Undo
            </button>
          )}
          <button type="button" className="text-dossier-secondary hover:text-dossier-charcoal" onClick={() => setStarted(false)}>
            Cancel
          </button>
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-secondary" onClick={capturePoint} disabled={capturing || points.length >= MAX_POINTS}>
          {capturing ? 'Locating…' : 'Record point'}
        </button>
        <button type="button" className="btn-primary" onClick={finishMeasurement} disabled={points.length < 3 || calculating}>
          {calculating ? 'Calculating…' : 'Finish'}
        </button>
      </div>

      {result && (
        <div className="pt-4 border-t border-dossier-border-subtle animate-fade-in">
          <p className="text-sm text-dossier-secondary">Estimated roof area</p>
          <p className="font-serif text-3xl text-dossier-charcoal tabular mt-1">
            {formatNumber(result.area_sqft)} <span className="font-sans text-sm text-dossier-tertiary">sq ft · {formatNumber(result.area_sqm, 1)} m²</span>
          </p>
          <p className="text-xs text-dossier-tertiary mt-2">{result.warning}</p>
          <button type="button" className="btn-primary mt-4" onClick={() => onEstimated(result.area_sqft)}>
            Use this area
          </button>
        </div>
      )}
    </div>
  )
}
