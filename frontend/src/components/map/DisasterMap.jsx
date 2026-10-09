import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Badge from '../common/Badge';

// Helper to create customized styled marker pins
function createMarkerIcon(colorHex, symbol) {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${colorHex};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 0 12px ${colorHex}99, 0 4px 6px rgba(0,0,0,0.5);
        border: 2px solid #ffffff;
      ">
        ${symbol}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
}

const zoneColorMap = {
  CRITICAL: {
    color: '#ef4444',
    fillColor: '#ef4444',
    fillOpacity: 0.22,
    radius: 1200,
    label: 'Critical Hazard Zone'
  },
  HIGH: {
    color: '#f97316',
    fillColor: '#f97316',
    fillOpacity: 0.18,
    radius: 950,
    label: 'High Risk Sector'
  },
  MODERATE: {
    color: '#eab308',
    fillColor: '#eab308',
    fillOpacity: 0.15,
    radius: 750,
    label: 'Moderate Warning Zone'
  },
  LOW: {
    color: '#10b981',
    fillColor: '#10b981',
    fillOpacity: 0.12,
    radius: 650,
    label: 'Low Vulnerability Sector'
  },
  SAFE: {
    color: '#06b6d4',
    fillColor: '#06b6d4',
    fillOpacity: 0.12,
    radius: 650,
    label: 'Safe Assembly Sector'
  }
};

const icons = {
  INCIDENT: createMarkerIcon('#ef4444', '🔥'),
  REPORT: createMarkerIcon('#f43f5e', '📢'),
  REQUEST: createMarkerIcon('#f59e0b', '⚠️'),
  SHELTER: createMarkerIcon('#3b82f6', '🏠'),
  HOSPITAL: createMarkerIcon('#06b6d4', '🏥'),
  WAREHOUSE: createMarkerIcon('#a855f7', '📦'),
  RESPONDER: createMarkerIcon('#10b981', '🚑'),
  VEHICLE: createMarkerIcon('#14b8a6', '🚛')
};

// Normalize coordinate & record attributes across varying schema conventions
function normalizeMarker(m, defaultType = 'INCIDENT') {
  if (!m) return null;
  const lat = Number(m.lat ?? m.latitude ?? m.LATITUDE);
  const lng = Number(m.lng ?? m.longitude ?? m.LONGITUDE);
  
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  return {
    id: m.id ?? m.INCIDENTID ?? m.disaster_id ?? m.report_id ?? m.SHELTERID ?? m.WAREHOUSEID ?? m.RESPONDERID ?? m.VEHICLEID ?? m.hospital_id ?? Math.floor(Math.random() * 10000),
    title: m.title ?? m.name ?? m.INCIDENTNAME ?? m.SHELTERNAME ?? m.WAREHOUSENAME ?? m.TEAMNAME ?? m.VEHICLENAME ?? m.disaster_name ?? m.hospital_name ?? m.report_reference_id ?? 'Operational Node',
    ref: m.report_reference_id ?? m.incident_code ?? m.code ?? null,
    type: m.type ?? m.disaster_type ?? m.INCIDENTTYPE ?? m.REQUESTTYPE ?? defaultType,
    severity: (m.severity ?? m.SEVERITY ?? m.severity_level ?? m.priority ?? m.PRIORITY ?? 'MODERATE').toUpperCase(),
    status: (m.status ?? m.STATUS ?? 'ACTIVE').toUpperCase(),
    location: m.location ?? m.location_name ?? m.LOCATIONNAME ?? m.address ?? m.ADDRESS ?? 'Bangalore Sector',
    peopleAffected: m.peopleAffected ?? m.people_affected ?? m.PEOPLEAFFECTED ?? 0,
    capacity: m.capacity ?? m.CAPACITY ?? null,
    occupancy: m.occupancy ?? m.CURRENTOCCUPANCY ?? m.current_occupancy ?? null,
    specialization: m.specialization ?? m.SPECIALIZATION ?? null,
    description: m.description ?? m.DESCRIPTION ?? null,
    submittedAt: m.submittedAt ?? m.submitted_at ?? m.STARTTIME ?? null,
    lat,
    lng
  };
}

export default function DisasterMap({ markers = {}, center = [13.05, 77.60], zoom = 12 }) {
  const [layers, setLayers] = useState({
    zones: true,
    incidents: true,
    reports: true,
    requests: true,
    shelters: true,
    hospitals: true,
    warehouses: true,
    responders: true,
    vehicles: true
  });

  const toggleLayer = (layer) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Safe normalized datasets
  const safeData = useMemo(() => {
    const rawZones = markers?.zones || [];
    const rawIncidents = markers?.incidents || [];
    const rawReports = markers?.reports || markers?.citizenReports || [];
    const rawRequests = markers?.requests || [];
    const rawShelters = markers?.shelters || [];
    const rawHospitals = markers?.hospitals || [];
    const rawWarehouses = markers?.warehouses || [];
    const rawResponders = markers?.responders || [];
    const rawVehicles = markers?.vehicles || [];

    return {
      zones: rawZones.map(z => {
        const lat = Number(z.lat ?? z.latitude ?? z.LATITUDE);
        const lng = Number(z.lng ?? z.longitude ?? z.LONGITUDE);
        if (isNaN(lat) || isNaN(lng)) return null;
        return {
          id: z.id ?? z.LOCATIONID ?? z.location_id,
          name: z.name ?? z.LOCATIONNAME ?? z.location_name ?? 'Municipal Sector',
          riskZone: (z.riskZone ?? z.RISKZONE ?? z.risk_zone ?? 'MODERATE').toUpperCase(),
          zone: z.zone ?? z.ZONE ?? z.ward_name ?? 'Urban Ward',
          address: z.address ?? z.ADDRESS ?? '',
          lat,
          lng
        };
      }).filter(Boolean),
      incidents: rawIncidents.map(m => normalizeMarker(m, 'INCIDENT')).filter(Boolean),
      reports: rawReports.map(m => normalizeMarker(m, 'REPORT')).filter(Boolean),
      requests: rawRequests.map(m => normalizeMarker(m, 'REQUEST')).filter(Boolean),
      shelters: rawShelters.map(m => normalizeMarker(m, 'SHELTER')).filter(Boolean),
      hospitals: rawHospitals.map(m => normalizeMarker(m, 'HOSPITAL')).filter(Boolean),
      warehouses: rawWarehouses.map(m => normalizeMarker(m, 'WAREHOUSE')).filter(Boolean),
      responders: rawResponders.map(m => normalizeMarker(m, 'RESPONDER')).filter(Boolean),
      vehicles: rawVehicles.map(m => normalizeMarker(m, 'VEHICLE')).filter(Boolean)
    };
  }, [markers]);

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
      {/* Map Layer Filter Controls */}
      <div className="absolute top-4 right-4 z-[1000] bg-slate-900/95 backdrop-blur-md border border-slate-800 p-2.5 rounded-lg shadow-lg flex flex-wrap gap-1.5 text-xs max-w-xl justify-end">
        <button
          type="button"
          onClick={() => toggleLayer('zones')}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            layers.zones ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800 text-slate-500'
          }`}
        >
          🛡️ Risk Zones ({safeData.zones.length})
        </button>
        <button
          type="button"
          onClick={() => toggleLayer('incidents')}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            layers.incidents ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-500'
          }`}
        >
          🔥 Incidents ({safeData.incidents.length})
        </button>
        <button
          type="button"
          onClick={() => toggleLayer('reports')}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            layers.reports ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40' : 'bg-slate-800 text-slate-500'
          }`}
        >
          📢 Citizen Reports ({safeData.reports.length})
        </button>
        <button
          type="button"
          onClick={() => toggleLayer('requests')}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            layers.requests ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-500'
          }`}
        >
          ⚠️ Distress Calls ({safeData.requests.length})
        </button>
        <button
          type="button"
          onClick={() => toggleLayer('shelters')}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            layers.shelters ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'bg-slate-800 text-slate-500'
          }`}
        >
          🏠 Shelters ({safeData.shelters.length})
        </button>
        <button
          type="button"
          onClick={() => toggleLayer('hospitals')}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            layers.hospitals ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-500'
          }`}
        >
          🏥 Hospitals ({safeData.hospitals.length})
        </button>
        <button
          type="button"
          onClick={() => toggleLayer('warehouses')}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            layers.warehouses ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-slate-800 text-slate-500'
          }`}
        >
          📦 Depots ({safeData.warehouses.length})
        </button>
        <button
          type="button"
          onClick={() => toggleLayer('responders')}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            layers.responders ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'
          }`}
        >
          🚑 Responders ({safeData.responders.length})
        </button>
      </div>

      {/* Floating Risk Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/95 backdrop-blur-md border border-slate-800 p-2.5 rounded-lg shadow-xl text-[11px] pointer-events-auto">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between gap-4">
          <span>Bangalore Spatial Risk Matrix</span>
          <span className="text-emerald-400 font-mono">Live GIS Layer</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div className="flex items-center gap-1.5 text-rose-300">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/30"></span>
            <span>Critical Flood (1.2km)</span>
          </div>
          <div className="flex items-center gap-1.5 text-orange-300">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-orange-500/30"></span>
            <span>High Risk (950m)</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/30"></span>
            <span>Moderate (750m)</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30"></span>
            <span>Low / Safe (650m)</span>
          </div>
        </div>
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

        {/* 0. Municipal Risk Zones & Affected Radii */}
        {layers.zones && safeData.zones.map((z) => {
          const style = zoneColorMap[z.riskZone] || zoneColorMap.MODERATE;
          return (
            <Circle
              key={`zone-${z.id}`}
              center={[z.lat, z.lng]}
              radius={style.radius}
              pathOptions={{
                color: style.color,
                fillColor: style.fillColor,
                fillOpacity: style.fillOpacity,
                weight: 2,
                dashArray: z.riskZone === 'CRITICAL' ? '4, 4' : undefined
              }}
            >
              <Popup>
                <div className="p-1 font-sans text-slate-900">
                  <div className="text-[10px] font-bold uppercase" style={{ color: style.color }}>
                    {style.label} #{z.id}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-0.5">{z.name}</h4>
                  <p className="text-xs text-slate-600 mt-1">{z.address || z.zone}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Badge text={z.riskZone} />
                    <span className="text-[11px] font-mono text-slate-500">{z.zone}</span>
                  </div>
                </div>
              </Popup>
            </Circle>
          );
        })}

        {/* 1. Incidents */}
        {layers.incidents && safeData.incidents.map((m) => (
          <Marker key={`inc-${m.id}`} position={[m.lat, m.lng]} icon={icons.INCIDENT}>
            <Popup>
              <div className="p-1 font-sans text-slate-900">
                <div className="text-[10px] font-bold text-rose-600 uppercase">
                  INCIDENT #{m.id} {m.ref && `(${m.ref})`}
                </div>
                <h4 className="font-bold text-sm text-slate-900 mt-0.5">{m.title}</h4>
                <p className="text-xs text-slate-600 mt-1">{m.location}</p>
                {m.description && <p className="text-[11px] text-slate-500 mt-1 italic">{m.description}</p>}
                <div className="mt-2 flex items-center gap-1.5">
                  <Badge text={m.severity} />
                  <Badge text={m.status} />
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 2. Citizen Disaster Reports */}
        {layers.reports && safeData.reports.map((m) => (
          <Marker key={`rpt-${m.id}`} position={[m.lat, m.lng]} icon={icons.REPORT}>
            <Popup>
              <div className="p-1 font-sans text-slate-900">
                <div className="text-[10px] font-bold text-pink-600 uppercase">
                  CITIZEN REPORT {m.ref ? `#${m.ref}` : `#${m.id}`}
                </div>
                <h4 className="font-bold text-sm text-slate-900 mt-0.5">{m.type} Emergency</h4>
                <p className="text-xs text-slate-600 mt-1 font-medium">{m.location}</p>
                <p className="text-xs text-slate-700 mt-1">{m.description || m.title}</p>
                {m.peopleAffected > 0 && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1">
                    Affected: {m.peopleAffected} souls reported
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1.5">
                  <Badge text={m.status} />
                  <span className="text-[10px] font-mono text-slate-400">Stage 1</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 3. Distress Requests */}
        {layers.requests && safeData.requests.map((m) => (
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
        ))}

        {/* 4. Relief Shelters */}
        {layers.shelters && safeData.shelters.map((m) => (
          <Marker key={`sh-${m.id}`} position={[m.lat, m.lng]} icon={icons.SHELTER}>
            <Popup>
              <div className="p-1 font-sans text-slate-900">
                <div className="text-[10px] font-bold text-blue-600 uppercase">RELIEF SHELTER</div>
                <h4 className="font-bold text-sm text-slate-900 mt-0.5">{m.title}</h4>
                <p className="text-xs text-slate-600 mt-1">{m.location}</p>
                {m.capacity && (
                  <p className="text-xs text-slate-700 mt-1">
                    Occupancy: <span className="font-bold">{m.occupancy || 0}</span> / {m.capacity}
                  </p>
                )}
                <div className="mt-2">
                  <Badge text={m.status} />
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 5. Medical Facilities / Hospitals */}
        {layers.hospitals && safeData.hospitals.map((m) => (
          <Marker key={`hosp-${m.id}`} position={[m.lat, m.lng]} icon={icons.HOSPITAL}>
            <Popup>
              <div className="p-1 font-sans text-slate-900">
                <div className="text-[10px] font-bold text-cyan-600 uppercase">TERTIARY CARE HOSPITAL</div>
                <h4 className="font-bold text-sm text-slate-900 mt-0.5">{m.title}</h4>
                <p className="text-xs text-slate-600 mt-1">{m.location}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <Badge text="TRAUMA CENTER" />
                  <span className="text-[10px] text-emerald-600 font-bold">24/7 OPEN</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 6. Warehouses */}
        {layers.warehouses && safeData.warehouses.map((m) => (
          <Marker key={`wh-${m.id}`} position={[m.lat, m.lng]} icon={icons.WAREHOUSE}>
            <Popup>
              <div className="p-1 font-sans text-slate-900">
                <div className="text-[10px] font-bold text-purple-600 uppercase">DISASTER DEPOT</div>
                <h4 className="font-bold text-sm text-slate-900 mt-0.5">{m.title}</h4>
                <p className="text-xs text-slate-600 mt-1">{m.location}</p>
                {m.capacity && <p className="text-xs text-slate-700 mt-1">Capacity: {m.capacity} pallets</p>}
                <div className="mt-2">
                  <Badge text={m.status} />
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 7. Responders */}
        {layers.responders && safeData.responders.map((m) => (
          <Marker key={`resp-${m.id}`} position={[m.lat, m.lng]} icon={icons.RESPONDER}>
            <Popup>
              <div className="p-1 font-sans text-slate-900">
                <div className="text-[10px] font-bold text-emerald-600 uppercase">TACTICAL RESPONDER</div>
                <h4 className="font-bold text-sm text-slate-900 mt-0.5">{m.title}</h4>
                <p className="text-xs text-slate-600 mt-1">{m.specialization || 'Search & Rescue'}</p>
                <div className="mt-2">
                  <Badge text={m.status} />
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 8. Fleet Vehicles */}
        {layers.vehicles && safeData.vehicles.map((m) => (
          <Marker key={`veh-${m.id}`} position={[m.lat, m.lng]} icon={icons.VEHICLE}>
            <Popup>
              <div className="p-1 font-sans text-slate-900">
                <div className="text-[10px] font-bold text-teal-600 uppercase">EMERGENCY VEHICLE</div>
                <h4 className="font-bold text-sm text-slate-900 mt-0.5">{m.title}</h4>
                <p className="text-xs text-slate-600 mt-1">{m.location}</p>
                <div className="mt-2">
                  <Badge text={m.status} />
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
