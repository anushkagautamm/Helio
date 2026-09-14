import { CircleMarker, MapContainer, Marker, Polygon, Popup, TileLayer, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
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
}

export default function MapView({
  lat,
  lon,
  label,
  zoom = 16,
  heightClass = 'h-64',
  polygonPoints,
  hideMarker = false,
}: MapViewProps) {
  return (
    <div className={`${heightClass} w-full rounded-2xl overflow-hidden border border-edge`}>
      <MapContainer center={[lat, lon]} zoom={zoom} className="leaflet-container">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!hideMarker && (
          <Marker position={[lat, lon]} icon={defaultIcon}>
            {label && <Popup>{label}</Popup>}
          </Marker>
        )}
        {polygonPoints?.map((p, i) => (
          <CircleMarker
            key={i}
            center={[p.lat, p.lon]}
            radius={6}
            pathOptions={{ color: '#1B6E46', fillColor: '#1B6E46', fillOpacity: 0.9 }}
          />
        ))}
        {polygonPoints && polygonPoints.length >= 3 && (
          <Polygon
            positions={polygonPoints.map((p) => [p.lat, p.lon])}
            pathOptions={{ color: '#1B6E46', fillColor: '#5CD196', fillOpacity: 0.25, weight: 2 }}
          />
        )}
        <Recenter lat={lat} lon={lon} />
      </MapContainer>
    </div>
  )
}
