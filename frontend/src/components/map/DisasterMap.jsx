import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Badge from '../common/Badge';

// Helper to create customized styled marker pins
function createMarkerIcon(colorHex, symbol) {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${colorHex};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 13px;
        box-shadow: 0 0 10px ${colorHex}88, 0 4px 6px rgba(0,0,0,0.4);
        border: 2px solid #ffffff;
      ">
        ${symbol}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
}

const icons = {
  INCIDENT: createMarkerIcon('#ef4444', '🔥'),
  REQUEST: createMarkerIcon('#f59e0b', '⚠️'),
  SHELTER: createMarkerIcon('#3b82f6', '🏠'),
  WAREHOUSE: createMarkerIcon('#a855f7', '📦'),
  RESPONDER: createMarkerIcon('#10b981', '🚑'),
  VEHICLE: createMarkerIcon('#06b6d4', '🚛')
};

export default function DisasterMap({ markers = {}, center = [13.05, 77.60], zoom = 12 }) {
  const [layers, setLayers] = useState({
    incidents: true,
    requests: true,
    shelters: true,
    warehouses: true,
    responders: true,
    vehicles: true
  });

  const toggleLayer = (layer) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const {
    incidents = [],
    requests = [],
    shelters = [],
    warehouses = [],
    responders = [],
    vehicles = []
  } = markers;

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
      {/* Map Layer Filter Controls */}
      <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3 rounded-lg shadow-lg flex flex-wrap gap-2 text-xs">
        <button
          onClick={() => toggleLayer('incidents')}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            layers.incidents ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-500'
          }`}
        >
          🔥 Incidents ({incidents.length})
        </button>
        <button
          onClick={() => toggleLayer('requests')}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            layers.requests ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-500'
          }`}
        >
          ⚠️ Requests ({requests.length})
        </button>
        <button
          onClick={() => toggleLayer('shelters')}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            layers.shelters ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'bg-slate-800 text-slate-500'
          }`}
        >
          🏠 Shelters ({shelters.length})
        </button>
        <button
          onClick={() => toggleLayer('warehouses')}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            layers.warehouses ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-slate-800 text-slate-500'
          }`}
        >
          📦 Warehouses ({warehouses.length})
        </button>
        <button
          onClick={() => toggleLayer('responders')}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            layers.responders ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'
          }`}
        >
          🚑 Responders ({responders.length})
        </button>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 1. Incidents */}
        {layers.incidents && incidents.map((m) => (
          m.lat && m.lng ? (
            <Marker key={`inc-${m.id}`} position={[m.lat, m.lng]} icon={icons.INCIDENT}>
              <Popup>
                <div className="p-1 font-sans text-slate-900">
                  <div className="text-[10px] font-bold text-rose-600 uppercase">INCIDENT #{m.id}</div>
                  <h4 className="font-bold text-sm text-slate-900 mt-0.5">{m.title}</h4>
                  <p className="text-xs text-slate-600 mt-1">{m.location}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Badge text={m.severity} />
                    <Badge text={m.status} />
                  </div>
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}

        {/* 2. Requests */}
        {layers.requests && requests.map((m) => (
          m.lat && m.lng ? (
            <Marker key={`req-${m.id}`} position={[m.lat, m.lng]} icon={icons.REQUEST}>
              <Popup>
                <div className="p-1 font-sans text-slate-900">
                  <div className="text-[10px] font-bold text-amber-600 uppercase">EMERGENCY REQUEST #{m.id}</div>
                  <h4 className="font-bold text-sm text-slate-900 mt-0.5">{m.title}</h4>
                  <p className="text-xs text-slate-600 mt-1">{m.location}</p>
                  <p className="text-xs font-semibold text-slate-700 mt-1">Affected: {m.peopleAffected || 1} people</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Badge text={m.severity} />
                    <Badge text={m.status} />
                  </div>
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}

        {/* 3. Shelters */}
        {layers.shelters && shelters.map((m) => (
          m.lat && m.lng ? (
            <Marker key={`sh-${m.id}`} position={[m.lat, m.lng]} icon={icons.SHELTER}>
              <Popup>
                <div className="p-1 font-sans text-slate-900">
                  <div className="text-[10px] font-bold text-blue-600 uppercase">RELIEF SHELTER</div>
                  <h4 className="font-bold text-sm text-slate-900 mt-0.5">{m.title}</h4>
                  <p className="text-xs text-slate-600 mt-1">{m.location}</p>
                  <p className="text-xs text-slate-700 mt-1">
                    Occupancy: <span className="font-bold">{m.occupancy}</span> / {m.capacity}
                  </p>
                  <div className="mt-2">
                    <Badge text={m.status} />
                  </div>
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}

        {/* 4. Warehouses */}
        {layers.warehouses && warehouses.map((m) => (
          m.lat && m.lng ? (
            <Marker key={`wh-${m.id}`} position={[m.lat, m.lng]} icon={icons.WAREHOUSE}>
              <Popup>
                <div className="p-1 font-sans text-slate-900">
                  <div className="text-[10px] font-bold text-purple-600 uppercase">DISASTER DEPOT</div>
                  <h4 className="font-bold text-sm text-slate-900 mt-0.5">{m.title}</h4>
                  <p className="text-xs text-slate-600 mt-1">{m.location}</p>
                  <p className="text-xs text-slate-700 mt-1">Capacity: {m.capacity} pallets</p>
                  <div className="mt-2">
                    <Badge text={m.status} />
                  </div>
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}

        {/* 5. Responders */}
        {layers.responders && responders.map((m) => (
          m.lat && m.lng ? (
            <Marker key={`resp-${m.id}`} position={[m.lat, m.lng]} icon={icons.RESPONDER}>
              <Popup>
                <div className="p-1 font-sans text-slate-900">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase">TACTICAL RESPONDER</div>
                  <h4 className="font-bold text-sm text-slate-900 mt-0.5">{m.title}</h4>
                  <p className="text-xs text-slate-600 mt-1">{m.specialization}</p>
                  <div className="mt-2">
                    <Badge text={m.status} />
                  </div>
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>
    </div>
  );
}
