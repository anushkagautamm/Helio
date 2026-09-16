import { CircleMarker, MapContainer, Marker, Polygon, Popup, TileLayer, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'

// A drafted site-pin (charcoal disc, white ring, ochre centre) instead of
// Leaflet's stock blue marker, so the map reads as part of the report.
const siteIcon = L.divIcon({
  className: '',
  html:
    '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#171717;box-shadow:0 0 0 3px #fff,0 1px 4px rgba(15,23,42,.35);position:relative">' +
    '<span style="position:absolute;inset:6px;border-radius:9999px;background:#B45309"></span></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -12],
})

function Recenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lon], map.getZoom())
  }, [lat, lon, map])
  return null
}

interface MapViewProps {
  lat: number
  lon: number
  label?: string
  zoom?: number
  heightClass?: string
  /** Live polygon overlay (e.g. GPS roof-walk points) drawn on top of the base marker. */
  polygonPoints?: { lat: number; lon: number }[]
  /** Hides the primary marker — used when the polygon points are the real focus. */
  hideMarker?: boolean
  /** Static presentation (no zoom buttons or scroll-zoom) for report views. */
  quiet?: boolean
}

export default function MapView({
  lat,
  lon,
  label,
  zoom = 16,
  heightClass = 'h-64',
  polygonPoints,
  hideMarker = false,
  quiet = false,
}: MapViewProps) {
  return (
    <div className={`${heightClass} w-full overflow-hidden`}>
      <MapContainer center={[lat, lon]} zoom={zoom} className="leaflet-container" zoomControl={!quiet} scrollWheelZoom={!quiet}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!hideMarker && (
          <Marker position={[lat, lon]} icon={siteIcon}>
            {label && <Popup>{label}</Popup>}
          </Marker>
        )}
        {polygonPoints?.map((p, i) => (
          <CircleMarker
            key={i}
            center={[p.lat, p.lon]}
            radius={5}
            pathOptions={{ color: '#FFFFFF', weight: 2, fillColor: '#B45309', fillOpacity: 1 }}
          />
        ))}
        {polygonPoints && polygonPoints.length >= 3 && (
          <Polygon
            positions={polygonPoints.map((p) => [p.lat, p.lon])}
            pathOptions={{ color: '#1E3A2F', fillColor: '#1E3A2F', fillOpacity: 0.12, weight: 2, dashArray: '4 3' }}
          />
        )}
        <Recenter lat={lat} lon={lon} />
      </MapContainer>
    </div>
  )
}
