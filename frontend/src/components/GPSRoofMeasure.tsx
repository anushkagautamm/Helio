import { useState } from 'react'
import type { GPSPoint } from '../utils/types'
import { estimateGpsRoofArea } from '../services/api'
import ErrorBanner from './ErrorBanner'
import MapView from './LazyMapView'

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
        setPoints((prev) => [
          ...prev,
          { lat: position.coords.latitude, lon: position.coords.longitude },
        ])
        setCapturing(false)
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was denied. Please allow location access to use GPS measurement, or use manual entry instead.'
            : 'Could not get your current location. Please try again or use manual entry.',
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
      const response = await estimateGpsRoofArea(points)
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not calculate area from these points.')
    } finally {
      setCalculating(false)
    }
  }

  if (!started) {
    return (
      <div className="card mt-4">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl shrink-0" aria-hidden="true">🚶</span>
          <div>
            <h4 className="font-display font-semibold text-ink mb-1">Walk My Roof</h4>
            <p className="text-sm text-ink-muted">
              Walk around the roof boundary while Helio records GPS points, then we'll estimate
              the enclosed area.
            </p>
          </div>
        </div>
        <p className="note-box mb-3">
          GPS-assisted estimate — not a precise architectural measurement. Ordinary phone/browser
          GPS can be off by several metres per point, so treat results as a rough planning
          figure.
        </p>
        <button type="button" className="btn-primary" onClick={startMeasurement}>
          Start Measurement
        </button>
      </div>
    )
  }

  return (
    <div className="card mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-display font-semibold text-ink">Walk My Roof</h4>
        <button type="button" className="text-xs text-ink-muted underline" onClick={() => setStarted(false)}>
          Cancel
        </button>
      </div>

      {error && <div className="mb-3"><ErrorBanner message={error} /></div>}

      <div className="mb-3">
        <MapView
          lat={mapCenter.lat}
          lon={mapCenter.lon}
          heightClass="h-64"
          zoom={19}
          polygonPoints={points}
          hideMarker
        />
      </div>

      <div className="flex items-center justify-between mb-3 text-sm">
        <span className="text-ink-muted">
          <strong className="text-ink">{points.length}</strong> of 8 points recorded
          {points.length < 3 && ` (need ${3 - points.length} more)`}
        </span>
        {points.length > 0 && (
          <button type="button" className="text-xs text-ink-muted underline" onClick={undoLastPoint}>
            Undo last point
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          type="button"
          className="btn-secondary"
          onClick={capturePoint}
          disabled={capturing || points.length >= 8}
        >
          {capturing ? 'Getting location…' : '📍 Record Point'}
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={finishMeasurement}
          disabled={points.length < 3 || calculating}
        >
          {calculating ? 'Calculating…' : 'Finish Measurement'}
        </button>
      </div>

      {result && (
        <div className="rounded-xl p-4 border border-helio/30 bg-helio-light/50">
          <p className="font-display font-semibold text-helio-dark">
            Estimated area: {result.area_sqft.toFixed(0)} sq ft ({result.area_sqm.toFixed(1)} m²)
          </p>
          <p className="text-xs text-ink-muted mt-1">{result.warning}</p>
          <button type="button" className="btn-primary mt-3" onClick={() => onEstimated(result.area_sqft)}>
            Confirm This Area
          </button>
        </div>
      )}
    </div>
  )
}
