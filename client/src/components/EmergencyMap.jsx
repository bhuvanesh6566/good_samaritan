import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix default leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// Smoothly re-fit map when bounds change (e.g. volunteer moves)
function AutoFitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      try {
        const leafletBounds = L.latLngBounds(bounds);
        map.fitBounds(leafletBounds, { padding: [50, 50], maxZoom: 16 });
      } catch (e) { /* ignore invalid bounds */ }
    }
  }, [map, JSON.stringify(bounds)]);
  return null;
}

export default function EmergencyMap({ lat, lng, volunteersNearby = [], emergencyId }) {
  // Build bounds from accident + all volunteer positions
  const bounds = [[lat, lng]];
  volunteersNearby.forEach(v => {
    if (v.lat && v.lng) bounds.push([v.lat, v.lng]);
  });

  return (
    <div className="w-full rounded-xl overflow-hidden shadow-lg border-2 border-gray-700" style={{ height: '380px' }}>
      <MapContainer center={[lat, lng]} zoom={15} className="w-full h-full" zoomControl={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Accident / reporter marker */}
        <Marker position={[lat, lng]} icon={redIcon}>
          <Popup>
            <div className="text-center">
              <strong style={{ color: '#dc2626' }}>🚨 Accident Location</strong><br />
              <small>Reporter's live position</small>
            </div>
          </Popup>
        </Marker>

        {/* 2 km radius circle */}
        <Circle
          center={[lat, lng]}
          radius={2000}
          pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.06, weight: 1.5, dashArray: '6 4' }}
        />

        {/* Volunteer markers — update position in real time as props change */}
        {volunteersNearby.map((v, i) =>
          v.lat && v.lng ? (
            <Marker key={i} position={[v.lat, v.lng]} icon={greenIcon}>
              <Popup>
                <div className="text-center">
                  <strong style={{ color: '#16a34a' }}>🟢 {v.name || 'Volunteer'}</strong><br />
                  <small>Heading to accident</small>
                </div>
              </Popup>
            </Marker>
          ) : null
        )}

        {/* Auto-fit to show both reporter and volunteer */}
        <AutoFitBounds bounds={bounds} />
      </MapContainer>
    </div>
  );
}
