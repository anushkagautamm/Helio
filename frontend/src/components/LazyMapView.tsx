import { lazy, Suspense } from 'react'
import SectionLoader from './SectionLoader'

// leaflet/react-leaflet are heavy and not needed to render the landing page
// or boot the app — deferring them to an on-demand chunk keeps the initial
// bundle lean without changing what's on screen once a map is actually shown.
const MapViewImpl = lazy(() => import('./MapView'))

interface LazyMapViewProps {
  lat: number
  lon: number
  label?: string
  zoom?: number
  heightClass?: string
  polygonPoints?: { lat: number; lon: number }[]
  hideMarker?: boolean
}

export default function LazyMapView({ heightClass = 'h-64', ...props }: LazyMapViewProps) {
  return (
    <Suspense fallback={<SectionLoader heightClass={heightClass} label="Loading map…" />}>
      <MapViewImpl heightClass={heightClass} {...props} />
    </Suspense>
  )
}
