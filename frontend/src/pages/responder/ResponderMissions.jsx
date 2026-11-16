import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  MapPin, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  ArrowRight, 
  Shield, 
  Plus,
  Navigation,
  Boxes,
  Truck,
  RotateCw,
  Phone,
  Flame,
  Check,
  Send,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Gauge
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../api/client';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import MissionStepper from '../../components/mission/MissionStepper';
import { useToast } from '../../context/ToastContext';

const emergencyMarkerIcon = L.divIcon({
  className: 'custom-emg-pin',
  html: `
    <div style="
      background: radial-gradient(circle, #ef4444 40%, #b91c1c 100%);
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
      box-shadow: 0 0 16px #ef4444cc;
      border: 2px solid #ffffff;
      animation: pulse 2s infinite;
    ">
      🚨
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

const responderVehicleIcon = L.divIcon({
  className: 'custom-squad-pin',
  html: `
    <div style="
      background: radial-gradient(circle, #06b6d4 40%, #0891b2 100%);
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
      box-shadow: 0 0 16px #06b6d4cc;
      border: 2px solid #ffffff;
    ">
      🚑
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

const REPORT_TYPES = [
  'ROAD_BLOCKED', 'ADDITIONAL_RESOURCE', 'INJURY',
  'DAMAGE', 'WEATHER', 'SAFETY_RISK', 'MISSION_UPDATE', 'OTHER'
];

export default function ResponderMissions() {
  const [activeTab, setActiveTab] = useState('active'); // 'available' | 'active' | 'logistics'
  const [missions, setMissions] = useState([]);
  const [availableIncidents, setAvailableIncidents] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [missionDetail, setMissionDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [claimingId, setClaimingId] = useState(null);

  // Live GPS Tracking State
  const [isGpsSharing, setIsGpsSharing] = useState(false);
  const [squadCoords, setSquadCoords] = useState(null);
  const gpsWatchId = useRef(null);

  // Automated Real Road Navigation & Tactical Operational Timeline
  const [roadRoute, setRoadRoute] = useState([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState(4.8);
  const [routeDurationMin, setRouteDurationMin] = useState(8);
  const [simRunning, setSimRunning] = useState(false);
  const [simWaypointIdx, setSimWaypointIdx] = useState(0);
  const [simSpeed, setSimSpeed] = useState(2); // 1 = Real, 3 = Fast, 6 = Turbo
  const [remainingDist, setRemainingDist] = useState(4.8);
  const [remainingEta, setRemainingEta] = useState(8);
  const simIntervalRef = useRef(null);

  // OSRM Real Road Route Fetcher (100% Free, Zero API Keys)
  const fetchRoadRoute = async (startLat, startLng, endLat, endLng) => {
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data?.routes?.[0]?.geometry?.coordinates?.length > 0) {
        const coords = data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);
        const distKm = Number((data.routes[0].distance / 1000).toFixed(2));
        const durMin = Math.round(data.routes[0].duration / 60);
        return { coords, distKm, durMin };
      }
    } catch (err) {
      console.warn('OSRM routing fetch fallback:', err);
    }
    // High-resolution realistic street curvature fallback
    const coords = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const curve = Math.sin(t * Math.PI) * 0.003;
      coords.push([
        startLat + (endLat - startLat) * t + curve,
        startLng + (endLng - startLng) * t - curve * 0.4
      ]);
    }
    return { coords, distKm: 5.2, durMin: 9 };
  };

  // Field Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportForm, setReportForm] = useState({
    reportType: 'MISSION_UPDATE',
    severity: 'MEDIUM',
    description: ''
  });

  // Field Supply Request
  const [resourceCatalog, setResourceCatalog] = useState([]);
  const [fieldSupplyId, setFieldSupplyId] = useState('');
  const [fieldSupplyQty, setFieldSupplyQty] = useState(25);
  const [fieldDeliveries, setFieldDeliveries] = useState([]);

  const { success, error } = useToast();

  const fetchMissions = async () => {
    try {
      const res = await api.get('/responder/missions');
      if (res && res.success) {
        const ms = res.missions || [];
        setMissions(ms);
        if (ms.length > 0 && !selectedMission) {
          handleSelectMission(ms[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch responder missions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/resources')
      .then((res) => {
        const items = res?.resources || [];
        setResourceCatalog(items);
        if (items.length) setFieldSupplyId(String(items[0].resource_id || items[0].RESOURCEID));
      })
      .catch((err) => error(err.message || 'Resource catalogue could not be loaded.'));
  }, []);

  const fetchAvailableIncidents = async () => {
    try {
      const res = await api.get('/responder/available-incidents');
      if (res && res.incidents) {
        setAvailableIncidents(res.incidents);
      }
    } catch (err) {
      console.warn('Failed to fetch available incidents:', err);
    }
  };

  useEffect(() => {
    fetchMissions();
    fetchAvailableIncidents();

    const interval = setInterval(() => {
      fetchAvailableIncidents();
    }, 7000);
    return () => {
      clearInterval(interval);
      if (gpsWatchId.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(gpsWatchId.current);
    };
  }, []);

  const handleSelectMission = async (m) => {
    setSelectedMission(m);
    setDetailLoading(true);
    try {
      const res = await api.get(`/responder/missions/${m.MISSIONID || m.mission_id || m.id}`);
      if (res && res.success) {
        setMissionDetail(res.mission);
        const tLat = Number(res.mission.TARGETLATITUDE || res.mission.latitude || 13.0358);
        const tLng = Number(res.mission.TARGETLONGITUDE || res.mission.longitude || 77.5970);
        const baseLat = 13.0623;
        const baseLng = 77.5871;
        setSquadCoords({ lat: baseLat, lng: baseLng });

        // Load genuine OSRM street route
        fetchRoadRoute(baseLat, baseLng, tLat, tLng).then(r => {
          setRoadRoute(r.coords);
          setRouteDistanceKm(r.distKm);
          setRouteDurationMin(r.durMin);
          setRemainingDist(r.distKm);
          setRemainingEta(r.durMin);
          setSimWaypointIdx(0);
        });

        const incidentId = res.mission.disaster_id || res.mission.INCIDENTID;
        if (incidentId) {
          const deliveryResult = await api.get(`/deliveries?disaster_id=${incidentId}`);
          const deliveryRows = (deliveryResult?.deliveries || []).map((delivery) => ({
            ...delivery,
            delivery_status: delivery.status,
            item_name: delivery.items?.map((item) => item.resource_name).filter(Boolean).join(', ') || 'Relief supplies',
            quantity: delivery.items?.reduce((sum, item) => sum + Number(item.quantity_dispatched || 0), 0) || 0,
            quantity_received: delivery.items?.reduce((sum, item) => sum + Number(item.quantity_received || 0), 0) || 0
          }));
          setFieldDeliveries(deliveryRows);
        } else {
          setFieldDeliveries([]);
        }
      }
    } catch (err) {
      console.warn('Failed to load mission detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Automated Tactical Mission Progression Simulator
  const startMissionTimeline = () => {
    if (simRunning) {
      // Pause
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      setSimRunning(false);
      success('Mission timeline progression paused.');
      return;
    }

    if (!selectedMission) {
      error('Please select an active tactical mission.');
      return;
    }

    const mId = selectedMission.MISSIONID || selectedMission.mission_id || selectedMission.id;
    setSimRunning(true);
    success('🚀 Tactical mission timeline started: Vehicle tracking along real road network!');

    // Mobilize squad
    api.put(`/responder/missions/${mId}/status`, { status: 'DISPATCHED', notes: 'Automated squad mobilization' })
      .then(() => fetchMissions()).catch(() => {});

    let currentIdx = simWaypointIdx;
    const intervalMs = Math.max(250, 1000 / simSpeed);

    simIntervalRef.current = setInterval(async () => {
      const stepIncrement = Math.max(1, Math.floor((roadRoute.length || 30) / 25));
      currentIdx += stepIncrement;

      if (roadRoute.length > 0 && currentIdx < roadRoute.length) {
        const point = roadRoute[currentIdx];
        setSimWaypointIdx(currentIdx);
        setSquadCoords({ lat: point[0], lng: point[1] });

        const fraction = currentIdx / roadRoute.length;
        const remD = Number((routeDistanceKm * (1 - fraction)).toFixed(2));
        const remE = Math.max(1, Math.ceil(routeDurationMin * (1 - fraction)));
        setRemainingDist(remD);
        setRemainingEta(remE);

        // Update status to EN_ROUTE
        api.put(`/responder/missions/${mId}/status`, { status: 'EN_ROUTE', notes: 'Squad vehicle moving on streets' })
          .catch(() => {});

        // Ingest telemetry into RescueLocationHistory in database
        api.post(`/responder/missions/${mId}/location`, {
          latitude: point[0],
          longitude: point[1],
          speed: 42 + Math.floor(Math.random() * 8),
          heading: 115,
          accuracy: 5,
          status_note: 'EN_ROUTE'
        }).catch(() => {});
      } else {
        // Reached destination!
        clearInterval(simIntervalRef.current);
        const finalPoint = roadRoute[roadRoute.length - 1] || [13.0358, 77.5970];
        setSquadCoords({ lat: finalPoint[0], lng: finalPoint[1] });
        setRemainingDist(0);
        setRemainingEta(0);

        // Stage 3: ON_SCENE
        await api.put(`/responder/missions/${mId}/status`, { status: 'ON_SCENE', notes: 'Arrived at emergency perimeter' });
        await fetchMissions();
        success('🚑 Squad arrived at incident perimeter (ON SCENE)!');

        // Stage 4: RESCUE_IN_PROGRESS after 3 seconds
        setTimeout(async () => {
          await api.put(`/responder/missions/${mId}/status`, { status: 'RESCUE_IN_PROGRESS', notes: 'Active triage & extraction in progress' });
          await fetchMissions();
          success('🦺 Search & Rescue commenced: Extricating trapped victims & first-aid triage.');

          // Stage 5: COMPLETED after another 4 seconds
          setTimeout(async () => {
            await api.post(`/responder/missions/${mId}/complete`, { notes: 'Operation completed successfully. All victims evacuated.' });
            await fetchMissions();
            setSimRunning(false);
            success('🎉 Mission Accomplished! Trapped citizens safely evacuated.');
          }, 4500);
        }, 3000);
      }
    }, intervalMs);
  };

  const resetMissionTimeline = () => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    setSimRunning(false);
    setSimWaypointIdx(0);
    if (roadRoute.length > 0) {
      setSquadCoords({ lat: roadRoute[0][0], lng: roadRoute[0][1] });
    }
    setRemainingDist(routeDistanceKm);
    setRemainingEta(routeDurationMin);
    success('Mission timeline reset to base depot.');
  };

  const handleClaimIncident = async (incident) => {
    const incId = incident.incident_id || incident.disaster_id || incident.id;
    setClaimingId(incId);
    try {
      const res = await api.post('/responder/missions/claim', {
        incident_id: incId,
        report_id: incident.report_id
      });
      if (res && res.success) {
        success(`Incident claimed! Deployed squad to ${incident.disaster_name || 'Emergency Site'}.`);
        await fetchMissions();
        await fetchAvailableIncidents();
        setActiveTab('active');
        if (res.mission) {
          handleSelectMission(res.mission);
        }
      }
    } catch (err) {
      error(err.message || 'Failed to claim incident');
    } finally {
      setClaimingId(null);
    }
  };

  const handleTransition = async (newStatus) => {
    if (!selectedMission) return;
    setActionLoading(true);
    const mId = selectedMission.MISSIONID || selectedMission.mission_id || selectedMission.id;
    try {
      let res;
      if (newStatus === 'COMPLETED') {
        res = await api.post(`/responder/missions/${mId}/complete`, {
          notes: 'Tactical operation completed successfully by responder unit.'
        });
      } else {
        res = await api.put(`/responder/missions/${mId}/status`, {
          status: newStatus,
          notes: `Responder transitioned state to ${newStatus}`
        });
      }

      if (res && res.success) {
        success(`Status successfully advanced to ${newStatus}.`);
        await fetchMissions();
        handleSelectMission(selectedMission);
      }
    } catch (err) {
      error(err.message || 'Transition error');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Live GPS Sharing
  const toggleGpsSharing = () => {
    if (isGpsSharing) {
      // Turn OFF
      if (gpsWatchId.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(gpsWatchId.current);
        gpsWatchId.current = null;
      }
      setIsGpsSharing(false);
      success('Live GPS location sharing paused.');
    } else {
      if (!navigator.geolocation) {
        error('This browser does not provide GPS location. No tracking was started.');
        return;
      }
      const mId = selectedMission?.MISSIONID || selectedMission?.mission_id;
      if (!mId) {
        error('Select a persisted mission before starting GPS sharing.');
        return;
      }
      gpsWatchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed, heading, accuracy } = pos.coords;
          setSquadCoords({ lat: latitude, lng: longitude });
          setIsGpsSharing(true);
          api.post(`/responder/missions/${mId}/location`, {
            latitude,
            longitude,
            speed: speed ?? 0,
            heading: heading ?? 0,
            accuracy,
            status_note: missionDetail?.STATUS || 'EN_ROUTE'
          }).catch(e => error(e.message || 'GPS update could not be saved.'));
        },
        (err) => {
          setIsGpsSharing(false);
          error(`GPS sharing unavailable: ${err.message}`);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }
  };

  const handleSubmitFieldReport = async (e) => {
    e.preventDefault();
    if (!selectedMission || !missionDetail) return;

    setActionLoading(true);
    const mId = selectedMission.MISSIONID || selectedMission.mission_id || selectedMission.id;
    try {
      const res = await api.post(`/responder/missions/${mId}/report`, {
        reportType: reportForm.reportType,
        severity: reportForm.severity,
        description: reportForm.description,
        locationId: missionDetail.TARGETLOCATIONID || 1001
      });

      if (res && res.success) {
        success('Field report recorded in operational audit.');
        setIsReportModalOpen(false);
        setReportForm({ reportType: 'MISSION_UPDATE', severity: 'MEDIUM', description: '' });
        handleSelectMission(selectedMission);
      }
    } catch (err) {
      error(err.message || 'Report submission failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFieldSupplyRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/responder/requests', {
        resource_id: Number(fieldSupplyId),
        quantity: Number(fieldSupplyQty),
        incident_id: selectedMission?.INCIDENTID,
        priority: 'P1'
      });
      success('Field supply request saved for logistics review.');
    } catch (err) {
      error(err.message || 'Failed to submit field supply request.');
    }
  };

  const handleConfirmDeliveryReceipt = async (delivId) => {
    try {
      const delivery = fieldDeliveries.find((item) => item.delivery_id === delivId);
      if (!delivery) throw new Error('Delivery record is no longer available. Refresh the mission.');
      await api.post(`/deliveries/${delivId}/confirm`, {
        quantity_received: delivery.quantity,
        quantity_damaged: 0,
        receiver_name: 'Field response team',
        proof_of_delivery_note: 'Receipt recorded by the assigned field team.'
      });
      success('Delivery receipt stamped. Inventory updated.');
      await handleSelectMission(selectedMission);
    } catch (err) {
      error('Confirmation failed');
    }
  };

  if (loading) {
    return <Spinner size="lg" text="Loading responder tactical operations..." />;
  }

  const currentStatus = (missionDetail?.STATUS || selectedMission?.STATUS || 'ASSIGNED').toUpperCase();

  const targetLat = Number(missionDetail?.TARGETLATITUDE);
  const targetLng = Number(missionDetail?.TARGETLONGITUDE);
  const currentSquadLat = squadCoords?.lat;
  const currentSquadLng = squadCoords?.lng;

  return (
    <div className="space-y-6">
      {/* Header with Squad Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <Compass className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-white tracking-tight uppercase">
              Tactical Response Unit Terminal
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            NDRF Alpha Water Rescue Squad • Lead: <strong>Capt. Arvind Rao</strong> • Readiness: <span className="text-emerald-400 font-bold">OPERATIONAL</span>
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'available'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Available Incidents ({availableIncidents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'active'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Active Missions ({missions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('logistics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'logistics'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Field Logistics</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AVAILABLE INCIDENTS (EMERGENCY FEED) */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Citizen Emergencies Awaiting Squad Deployment
            </h3>
            <button
              onClick={fetchAvailableIncidents}
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <RotateCw className="w-3 h-3" />
              <span>Refresh Queue</span>
            </button>
          </div>

          {availableIncidents.length === 0 ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
              No unassigned emergencies in your sector. All active crisis sites have deployed tactical squads.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableIncidents.map((inc) => (
                <div
                  key={inc.id || inc.incident_id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded">
                        {inc.emergency_id || inc.incident_code}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                        {inc.severity || 'P1'}
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-sm">{inc.disaster_name}</h4>
                    <p className="text-xs text-slate-300 line-clamp-2">{inc.description}</p>

                    <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="truncate">{inc.location_name}</span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                        <span>Trapped: <strong className="text-rose-400">{inc.trapped_persons || 0}</strong></span>
                        <span>Injured: <strong className="text-amber-400">{inc.injuries_reported || 0}</strong></span>
                        <span>Affected: <strong className="text-white">{inc.people_affected || 1}</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleClaimIncident(inc)}
                    disabled={claimingId === (inc.id || inc.incident_id)}
                    className="w-full mt-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-rose-600/20"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{claimingId === (inc.id || inc.incident_id) ? 'Claiming & Deploying...' : 'Claim Incident & Deploy Squad'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE ASSIGNED MISSIONS */}
      {activeTab === 'active' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Mission Selector */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Assigned Queue ({missions.length})
            </h3>
            <div className="space-y-2">
              {missions.map((m) => {
                const isSelected = (selectedMission?.MISSIONID || selectedMission?.id) === (m.MISSIONID || m.id);
                return (
                  <div
                    key={m.MISSIONID || m.id}
                    onClick={() => handleSelectMission(m)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-brand-500 shadow-md shadow-brand-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-brand-400">
                        {m.EMERGENCYID || `MISSION #${m.MISSIONID || m.id}`}
                      </span>
                      <Badge text={m.STATUS} />
                    </div>
                    <h4 className="font-semibold text-white text-xs truncate">{m.INCIDENTNAME}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{m.TARGETLOCATION}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Mission Detail & Actions */}
          <div className="lg:col-span-2">
            {detailLoading ? (
              <Spinner text="Loading mission telemetry..." />
            ) : !missionDetail ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
                Select a tactical mission from the queue.
              </div>
            ) : (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-bold text-brand-400">
                        {missionDetail.EMERGENCYID || `MISSION #${missionDetail.MISSIONID}`}
                      </span>
                      <Badge text={missionDetail.PRIORITY} />
                      <Badge text={currentStatus} />
                    </div>
                    <h3 className="text-lg font-black text-white mt-1">{missionDetail.INCIDENTNAME}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span>{missionDetail.TARGETLOCATION} ({missionDetail.TARGETADDRESS || 'Field Sector'})</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Live GPS Sharing Toggle Button */}
                    <button
                      onClick={toggleGpsSharing}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        isGpsSharing
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/20 animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{isGpsSharing ? 'GPS Broadcasting Live' : 'Start Live GPS'}</span>
                    </button>

                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    >
                      <FileText className="w-3.5 h-3.5 text-brand-400" />
                      <span>SitRep</span>
                    </button>
                  </div>
                </div>

                {/* 8-Stage Tactical Stepper */}
                <MissionStepper currentStatus={currentStatus} />

                {/* State Machine Transition Controls */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Tactical Execution Controls (8-State Progression)
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      State: <strong className="text-cyan-400">{currentStatus}</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {/* Automated Tactical Mission Progression & Timeline */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/30 space-y-3 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                            <span className="font-bold text-xs uppercase tracking-wider text-cyan-300">
                              Tactical Mission Progression & Operational Timeline
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Automated operational lifecycle (Dispatched → En Route → On Scene → Rescued → Completed)
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          {/* Speed Toggle */}
                          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px]">
                            <button
                              type="button"
                              onClick={() => setSimSpeed(1)}
                              className={`px-2 py-0.5 rounded transition-all ${simSpeed === 1 ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'}`}
                            >
                              1x Demo
                            </button>
                            <button
                              type="button"
                              onClick={() => setSimSpeed(3)}
                              className={`px-2 py-0.5 rounded transition-all ${simSpeed === 3 ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'}`}
                            >
                              3x Fast
                            </button>
                          </div>

                          {/* Start/Pause Simulation Button */}
                          <button
                            type="button"
                            onClick={startMissionTimeline}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-lg ${
                              simRunning
                                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/30'
                            }`}
                          >
                            {simRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            <span>{simRunning ? 'Pause Timeline' : '▶ Start Mission Timeline'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={resetMissionTimeline}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                            title="Reset to Base"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Live Telemetry Metric Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800/80 text-xs font-mono">
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">Mission Stage</span>
                          <span className="font-bold text-white text-xs">{currentStatus}</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">Remaining Dist</span>
                          <span className="font-bold text-cyan-400 text-xs">{remainingDist} km</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">Est. Arrival (ETA)</span>
                          <span className="font-bold text-amber-400 text-xs">{remainingEta} mins</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">Real Road Route</span>
                          <span className="font-bold text-emerald-400 text-xs">{roadRoute.length} OSRM Points</span>
                        </div>
                      </div>
                    </div>

                    {/* Manual Step Overrides */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] text-slate-500 font-semibold uppercase">Manual Controls:</span>
                      {currentStatus === 'ASSIGNED' && (
                        <button
                          onClick={() => handleTransition('ACKNOWLEDGED')}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm"
                        >
                          1. Acknowledge Mission
                        </button>
                      )}

                      {(currentStatus === 'ACKNOWLEDGED' || currentStatus === 'ACCEPTED') && (
                        <button
                          onClick={() => handleTransition('PREPARING')}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm flex items-center gap-1.5"
                        >
                          <span>2. Preparing Gear</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {currentStatus === 'PREPARING' && (
                        <button
                          onClick={() => handleTransition('DISPATCHED')}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm flex items-center gap-1.5"
                        >
                          <span>3. Dispatched</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {currentStatus === 'DISPATCHED' && (
                        <button
                          onClick={() => handleTransition('EN_ROUTE')}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm flex items-center gap-1.5"
                        >
                          <span>4. En Route</span>
                          <Navigation className="w-3 h-3" />
                        </button>
                      )}

                      {currentStatus === 'EN_ROUTE' && (
                        <button
                          onClick={() => handleTransition('ON_SCENE')}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm flex items-center gap-1.5"
                        >
                          <span>5. Arrived On Scene</span>
                          <MapPin className="w-3 h-3" />
                        </button>
                      )}

                      {(currentStatus === 'ON_SCENE' || currentStatus === 'ARRIVED') && (
                        <button
                          onClick={() => handleTransition('RESCUE_IN_PROGRESS')}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm flex items-center gap-1.5"
                        >
                          <span>6. Commence Search & Rescue</span>
                          <Radio className="w-3 h-3" />
                        </button>
                      )}

                      {(currentStatus === 'RESCUE_IN_PROGRESS' || currentStatus === 'IN_PROGRESS') && (
                        <button
                          onClick={() => handleTransition('COMPLETED')}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>7. Complete Mission</span>
                        </button>
                      )}

                      {currentStatus === 'COMPLETED' && (
                        <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mission Completed. Squad released back to AVAILABLE readiness.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tactical Live Map View */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold uppercase tracking-wider text-white">Realistic Road-Network Tactical Map</span>
                    <span className="font-mono text-cyan-400">{simRunning ? '● Live Telemetry Streaming' : (squadCoords ? 'Squad GPS Active' : 'Depot Standby')}</span>
                  </div>
                  <div className="h-72 w-full rounded-xl overflow-hidden border border-slate-800 relative z-0">
                    {Number.isFinite(targetLat) && Number.isFinite(targetLng) ? (
                      <MapContainer center={[targetLat, targetLng]} zoom={13} scrollWheelZoom={false} className="h-full w-full">
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        
                        {/* Realistic Road Route Polyline */}
                        {roadRoute.length > 1 && (
                          <Polyline
                            positions={roadRoute}
                            color="#06b6d4"
                            weight={5}
                            opacity={0.85}
                            dashArray={simRunning ? "8, 8" : undefined}
                          />
                        )}

                        <Marker position={[targetLat, targetLng]} icon={emergencyMarkerIcon}>
                          <Popup><div className="text-xs"><strong>{missionDetail.INCIDENTNAME}</strong><p>{missionDetail.TARGETLOCATION}</p></div></Popup>
                        </Marker>

                        {Number.isFinite(currentSquadLat) && Number.isFinite(currentSquadLng) && (
                          <Marker position={[currentSquadLat, currentSquadLng]} icon={responderVehicleIcon}>
                            <Popup><div className="text-xs"><strong>{missionDetail.TEAMNAME}</strong><p>Status: {currentStatus}</p><p>Speed: 45 km/h</p></div></Popup>
                          </Marker>
                        )}
                      </MapContainer>
                    ) : <div className="h-full flex items-center justify-center text-sm text-slate-400">Incident coordinates are not available.</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FIELD SUPPLIES & LOGISTICS */}
      {activeTab === 'logistics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Supplies from Scene */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Boxes className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Field Supply Request (Scene Dispatch)
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Directly notify the Supplies & Logistics Coordinator for urgent replenishments required on scene.
            </p>

            <form onSubmit={handleFieldSupplyRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Resource Item Needed
                </label>
                <select
                  value={fieldSupplyId}
                  onChange={(e) => setFieldSupplyId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {resourceCatalog.map((item) => (
                    <option key={item.resource_id || item.RESOURCEID} value={item.resource_id || item.RESOURCEID}>
                      {item.resource_name || item.RESOURCENAME}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Quantity Required
                </label>
                <input
                  type="number"
                  min="1"
                  value={fieldSupplyQty}
                  onChange={(e) => setFieldSupplyQty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-cyan-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Field Request to Logistics</span>
              </button>
            </form>
          </div>

          {/* Incoming Convoys & Delivery Receipt */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Truck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                In-Transit Shipments & Delivery Receipts
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Confirm receipt of dispatched relief convoys arriving at the tactical perimeter.
            </p>

            <div className="space-y-3">
              {fieldDeliveries.map((deliv) => (
                <div
                  key={deliv.delivery_id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-cyan-400 font-bold">DELIVERY #{deliv.delivery_id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      deliv.delivery_status === 'DELIVERED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {deliv.delivery_status}
                    </span>
                  </div>

                  <p className="font-semibold text-white">{deliv.item_name} ({deliv.quantity} units)</p>
                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    <div>Origin: {deliv.warehouse_name}</div>
                    <div>Transport: {deliv.transport_driver_name} • {deliv.vehicle_registration}</div>
                  </div>

                  {deliv.delivery_status !== 'DELIVERED' ? (
                    <button
                      onClick={() => handleConfirmDeliveryReceipt(deliv.delivery_id)}
                      className="mt-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-emerald-600/20"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm Delivery Received on Scene</span>
                    </button>
                  ) : (
                    <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Receipt Verified & Handover Completed</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Field Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Submit Field Observation SitRep"
      >
        <form onSubmit={handleSubmitFieldReport} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Observation Category
            </label>
            <select
              value={reportForm.reportType}
              onChange={(e) => setReportForm({ ...reportForm, reportType: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              {REPORT_TYPES.map(t => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Severity Level
            </label>
            <select
              value={reportForm.severity}
              onChange={(e) => setReportForm({ ...reportForm, severity: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Field SitRep Observation
            </label>
            <textarea
              rows={4}
              required
              value={reportForm.description}
              onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
              placeholder="Enter current on-ground situation, access road status, water levels..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20"
            >
              Log SitRep
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
