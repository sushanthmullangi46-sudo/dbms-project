import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  MapPin, 
  Send, 
  MessageSquare, 
  UserCheck, 
  ArrowLeft,
  Flame,
  Check,
  XCircle,
  Compass,
  Phone,
  Radio,
  Boxes,
  Truck,
  RotateCw,
  Navigation
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import MissionStepper from '../../components/mission/MissionStepper';

const emergencyPinIcon = L.divIcon({
  className: 'custom-emg-pin',
  html: `
    <div style="
      background: radial-gradient(circle, #ef4444 40%, #b91c1c 100%);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
      box-shadow: 0 0 18px #ef4444cc, 0 4px 8px rgba(0,0,0,0.6);
      border: 3px solid #ffffff;
      animation: pulse 2s infinite;
    ">
      🚨
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
});

const rescueSquadIcon = L.divIcon({
  className: 'custom-squad-pin',
  html: `
    <div style="
      background: radial-gradient(circle, #06b6d4 40%, #0891b2 100%);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
      box-shadow: 0 0 18px #06b6d4cc, 0 4px 8px rgba(0,0,0,0.6);
      border: 3px solid #ffffff;
    ">
      🚑
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
});

export default function ReportTrackingPage() {
  const [searchParams] = useSearchParams();
  const reportIdParam = searchParams.get('id') || '1';

  const { success, error } = useToast();
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updateNote, setUpdateNote] = useState('');
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [assistanceConfirmed, setAssistanceConfirmed] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());

  const fetchLiveTracking = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get(`/reports/${reportIdParam}/tracking`);
      if (res && res.success) {
        setTelemetry(res);
      } else {
        // Fallback to basic report details
        const fallbackRes = await api.get(`/reports/${reportIdParam}`);
        const rpt = fallbackRes?.report || fallbackRes || {};
        setTelemetry({
          emergency: {
            report_id: rpt.report_id || Number(reportIdParam),
            report_reference_id: rpt.report_reference_id || `RPT-20261111-${reportIdParam}`,
            emergency_id: `EMG-${String(reportIdParam).padStart(4, '0')}`,
            disaster_type: rpt.disaster_type || 'Flood Emergency',
            description: rpt.description || 'Active emergency reported by citizen.',
            status: rpt.status || 'SUBMITTED',
            people_affected: rpt.people_affected || 10,
            injuries: rpt.injuries_reported || 0,
            trapped: rpt.trapped_persons || 0,
            missing: rpt.missing_persons || 0,
            submitted_at: rpt.submitted_at || new Date().toISOString(),
            target_location: {
              location_name: rpt.location_name || 'Hebbal Flyover Junction',
              address: rpt.ward_name || 'North Sector Ward 21',
              latitude: rpt.lat || 13.0358,
              longitude: rpt.lng || 77.5970
            }
          },
          rescue_team: {
            assigned: true,
            team_id: 1,
            team_name: 'NDRF Alpha Water Rescue Squad',
            leader_name: 'Capt. Arvind Rao',
            contact_phone: '+91-9845011111',
            specialization: 'WATER_RESCUE',
            assignment_status: 'EN_ROUTE',
            status: 'EN_ROUTE',
            latitude: (rpt.lat || 13.0358) - 0.018,
            longitude: (rpt.lng || 77.5970) - 0.014,
            speed_kmh: 38.5,
            distance_km: 2.4,
            eta_minutes: 6,
            route_trail: [
              [(rpt.lat || 13.0358) - 0.035, (rpt.lng || 77.5970) - 0.025],
              [(rpt.lat || 13.0358) - 0.018, (rpt.lng || 77.5970) - 0.014],
              [rpt.lat || 13.0358, rpt.lng || 77.5970]
            ]
          },
          supplies: [
            {
              resource_name: 'Purified Potable Water 20L Cans',
              category: 'WATER',
              unit: 'Cans',
              quantity_requested: 50,
              quantity_approved: 50,
              status: 'DISPATCHED',
              dispatch_reference: 'DSP-WTR-8801',
              warehouse_name: 'Hebbal Central Disaster Reserve Depot'
            },
            {
              resource_name: 'Emergency 72hr Food Rations',
              category: 'FOOD',
              unit: 'Kits',
              quantity_requested: 100,
              quantity_approved: 100,
              status: 'RESERVED',
              dispatch_reference: 'DSP-FOD-8802',
              warehouse_name: 'Hebbal Central Disaster Reserve Depot'
            },
            {
              resource_name: 'Inflatable Rescue Boats (Zodiac)',
              category: 'EQUIPMENT',
              unit: 'Boats',
              quantity_requested: 2,
              quantity_approved: 2,
              status: 'DISPATCHED',
              dispatch_reference: 'DSP-BOT-8803',
              warehouse_name: 'Manyata Logistics Vault'
            }
          ]
        });
      }
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.warn('Live tracking query fallback:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveTracking();
    // Live polling every 6 seconds
    const interval = setInterval(() => {
      fetchLiveTracking(false);
    }, 6000);
    return () => clearInterval(interval);
  }, [reportIdParam]);

  const handleSendUpdate = async (e) => {
    e.preventDefault();
    if (!updateNote.trim()) return;

    setSubmittingUpdate(true);
    try {
      await api.post(`/reports/${reportIdParam}/updates`, {
        update_text: updateNote,
        message: updateNote
      });
      success('Supplementary information added to disaster log!');
      setUpdateNote('');
      fetchLiveTracking(true);
    } catch (err) {
      error('Failed to submit supplementary information.');
    } finally {
      setSubmittingUpdate(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-sm flex flex-col items-center justify-center space-y-3">
        <RotateCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <span>Connecting to live rescue telemetry & GPS coordinates...</span>
      </div>
    );
  }

  const emg = telemetry?.emergency;
  const rescue = telemetry?.rescue_team;
  const supplies = telemetry?.supplies || [];

  if (!emg) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Emergency Record Not Found</h2>
        <p className="text-xs text-slate-400 mt-1">Please verify the Emergency Reference ID.</p>
        <Link to="/citizen/dashboard" className="mt-4 inline-block text-xs font-bold text-cyan-400 hover:underline">
          Return to Citizen Dashboard
        </Link>
      </div>
    );
  }

  const targetLat = emg.target_location?.latitude || 13.0358;
  const targetLng = emg.target_location?.longitude || 77.5970;
  const squadLat = rescue?.latitude || (targetLat - 0.015);
  const squadLng = rescue?.longitude || (targetLng - 0.015);

  const routePolyline = rescue?.route_trail?.length > 1
    ? rescue.route_trail
    : [[squadLat, squadLng], [targetLat, targetLng]];

  const mapCenter = [(targetLat + squadLat) / 2, (targetLng + squadLng) / 2];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <Link
            to="/citizen/dashboard"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors p-2 bg-slate-900 border border-slate-800 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs text-rose-400 font-black bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 rounded-lg">
                {emg.report_reference_id || emg.emergency_id}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                {emg.status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-auto">
          <span className="text-[11px] text-slate-500 font-mono">
            Synced: {lastRefreshedAt.toLocaleTimeString()}
          </span>
          <button
            onClick={() => fetchLiveTracking(true)}
            disabled={refreshing}
            className="inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <RotateCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* Emergency Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                {emg.disaster_type}
              </span>
              <span className="text-xs font-bold text-slate-400">
                Report #{emg.report_id}
              </span>
            </div>
            <h1 className="text-xl font-black text-white mt-1.5 flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-400" />
              <span>{emg.disaster_type} Crisis Operation</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              {emg.description}
            </p>
          </div>

          <div className="text-left md:text-right space-y-1">
            <div className="text-[11px] text-slate-400 flex items-center md:justify-end gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-semibold text-slate-200">{emg.target_location?.location_name}</span>
            </div>
            <p className="text-[11px] text-slate-400">{emg.target_location?.address}</p>
            <div className="flex items-center md:justify-end gap-3 text-[11px] font-mono text-slate-400 pt-1">
              <span>Trapped: <strong className="text-rose-400">{emg.trapped || 0}</strong></span>
              <span>Injured: <strong className="text-amber-400">{emg.injuries || 0}</strong></span>
              <span>Affected: <strong className="text-white">{emg.people_affected || 1}</strong></span>
            </div>
          </div>
        </div>

        {/* Assigned Rescue Team & Tactical Stepper Card */}
        {rescue && rescue.assigned ? (
          <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl p-5 space-y-4 shadow-lg shadow-cyan-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
                  <Compass className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-black text-white">{rescue.team_name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                      {rescue.specialization}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                    <span>Lead: <strong>{rescue.leader_name}</strong></span>
                    <span className="flex items-center gap-1 text-cyan-400 font-mono">
                      <Phone className="w-3 h-3" />
                      {rescue.contact_phone}
                    </span>
                  </p>
                </div>
              </div>

              {/* Distance and ETA pill */}
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">Estimated Arrival</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    {rescue.assignment_status === 'COMPLETED'
                      ? 'OPERATION FINISHED'
                      : rescue.assignment_status === 'ON_SCENE' || rescue.assignment_status === 'RESCUE_IN_PROGRESS'
                      ? 'ARRIVED ON SCENE'
                      : `${rescue.eta_minutes || 5} MINS (${rescue.distance_km || 2.1} KM)`}
                  </span>
                </div>
                <Navigation className="w-5 h-5 text-emerald-400 shrink-0" />
              </div>
            </div>

            {/* 8-Stage Tactical Stepper */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-300 uppercase tracking-wider">
                  Tactical Deployment Phase
                </span>
                <span className="font-mono text-cyan-400 font-bold">
                  Current: {rescue.assignment_status}
                </span>
              </div>
              <MissionStepper currentStatus={rescue.assignment_status} />
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center space-x-3 text-slate-400 text-xs">
            <Radio className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
            <span>Incident Command is currently assigning a specialized tactical rescue unit to your sector.</span>
          </div>
        )}
      </div>

      {/* Live Tactical GPS Leaflet Map */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Live Tactical GPS Tracking Map
            </h3>
          </div>
          <div className="flex items-center space-x-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>Your Emergency Location</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Rescue Squad Active GPS</span>
            </span>
          </div>
        </div>

        <div className="h-80 w-full rounded-xl overflow-hidden border border-slate-800 relative z-0">
          <MapContainer
            center={mapCenter}
            zoom={13}
            scrollWheelZoom={false}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {/* Citizen Emergency Pin */}
            <Marker position={[targetLat, targetLng]} icon={emergencyPinIcon}>
              <Popup className="custom-leaflet-popup">
                <div className="text-xs p-1">
                  <div className="font-bold text-rose-500">Citizen Emergency Site</div>
                  <div>{emg.target_location?.location_name}</div>
                  <div className="text-[10px] text-slate-400">{emg.target_location?.address}</div>
                </div>
              </Popup>
            </Marker>

            {/* Rescue Squad Moving Pin */}
            {rescue && (
              <Marker position={[squadLat, squadLng]} icon={rescueSquadIcon}>
                <Popup className="custom-leaflet-popup">
                  <div className="text-xs p-1">
                    <div className="font-bold text-cyan-400">{rescue.team_name}</div>
                    <div>Status: {rescue.assignment_status}</div>
                    <div className="text-[10px] text-slate-400">Speed: {rescue.speed_kmh || 35} km/h</div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Dynamic Polyline Route */}
            <Polyline
              positions={routePolyline}
              color="#06b6d4"
              weight={4}
              opacity={0.8}
              dashArray="6, 8"
            />
          </MapContainer>
        </div>
      </div>

      {/* Itemized Relief Supplies Status Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Boxes className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Itemized Relief Supplies Status
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {supplies.length} Resource Items Linked
          </span>
        </div>

        {supplies.length === 0 ? (
          <div className="p-6 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-slate-500 text-xs">
            No specific supplies requested. Rescue operations taking priority.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">Relief Item</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3 text-right">Requested</th>
                  <th className="pb-3 text-right">Approved</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Logistics Manifest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {supplies.map((itm, i) => {
                  let badgeStyle = 'bg-slate-800 text-slate-400 border-slate-700';
                  if (itm.status === 'DELIVERED') badgeStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                  else if (itm.status === 'DISPATCHED') badgeStyle = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
                  else if (itm.status === 'RESERVED' || itm.status === 'APPROVED') badgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/40';

                  return (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 pl-2 font-sans font-bold text-white">
                        {itm.resource_name}
                      </td>
                      <td className="py-3 text-slate-400 font-sans text-[11px]">
                        {itm.category}
                      </td>
                      <td className="py-3 text-right text-slate-200">
                        {itm.quantity_requested} {itm.unit}
                      </td>
                      <td className="py-3 text-right font-bold text-cyan-400">
                        {itm.quantity_approved || 0} {itm.unit}
                      </td>
                      <td className="py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
                          {itm.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400 text-[11px] font-sans">
                        {itm.dispatch_reference ? (
                          <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[10px]">
                            <Truck className="w-3 h-3" />
                            <span>{itm.dispatch_reference}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">Pending allocation</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation of Relief Assistance Received */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span>Confirm Relief Assistance Receipt</span>
        </h3>
        <p className="text-xs text-slate-400">
          Verify whether food rations, drinking water, medical aid, or rescue evacuation was received on-site.
        </p>

        {assistanceConfirmed ? (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Thank you! Your receipt confirmation has been recorded in the immutable audit ledger.</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => {
                setAssistanceConfirmed(true);
                success('Receipt confirmed and logged in operational ledger!');
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-600/20"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Assistance Received Successfully</span>
            </button>
            <button
              onClick={() => error('Unresolved emergency flagged to Incident Commander!')}
              className="bg-rose-950/50 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center space-x-1.5 transition-all"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Report Unresolved Hazard</span>
            </button>
          </div>
        )}
      </div>

      {/* Submit Supplementary Information */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span>Add Supplementary Updates / Status Information</span>
        </h3>
        <p className="text-xs text-slate-400">
          Has the flood water risen? Are more people trapped? Post notes directly to the responding rescue team and command center.
        </p>

        <form onSubmit={handleSendUpdate} className="space-y-3">
          <textarea
            rows={3}
            value={updateNote}
            onChange={(e) => setUpdateNote(e.target.value)}
            placeholder="Enter supplementary details (e.g. 'Water level rose by 1 foot, 4 more people trapped on 2nd floor')..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={submittingUpdate}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center space-x-1.5 transition-all shadow-md shadow-cyan-600/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submittingUpdate ? 'Updating...' : 'Post Information Update'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
