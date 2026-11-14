import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  ShieldAlert, 
  FileText, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Home, 
  HeartHandshake, 
  ArrowRight,
  LifeBuoy,
  Radio,
  Loader2,
  Navigation,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // SOS Modal State
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosSubmitting, setSosSubmitting] = useState(false);
  const [sosSuccess, setSosSuccess] = useState(null);
  const [sosTrappedCount, setSosTrappedCount] = useState(1);
  const [sosMedical, setSosMedical] = useState(true);
  const [sosNotes, setSosNotes] = useState('CRITICAL: Flood water entering dwelling. Immediate boat evacuation required.');
  const [currentCoords, setCurrentCoords] = useState({ lat: 13.0382, lng: 77.5895 });

  useEffect(() => {
    fetchMyReports();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setCurrentCoords({
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5))
          });
        },
        _err => console.log('Using default Bangalore coordinates')
      );
    }
  }, []);

  const fetchMyReports = async () => {
    try {
      const res = await api.get('/reports');
      if (Array.isArray(res)) {
        setReports(res);
      } else if (res && res.reports) {
        setReports(res.reports);
      }
    } catch (e) {
      console.error('Failed to fetch citizen reports:', e);
    } finally {
      setLoading(false);
    }
  };

  const triggerInstantSOS = async () => {
    setSosSubmitting(true);
    try {
      const res = await api.post('/sos/activate', {
        latitude: currentCoords.lat,
        longitude: currentCoords.lng,
        emergency_type: 'FLASH_FLOOD_TRAPPED',
        notes: sosNotes,
        trapped_count: Number(sosTrappedCount),
        medical_needed: Boolean(sosMedical)
      });
      setSosSuccess(res);
      setTimeout(() => {
        setShowSosModal(false);
        const reportId = res.report_id || (res.emergency_id ? res.emergency_id.replace('EMG-', '') : 1);
        navigate(`/citizen/tracking?id=${reportId}`);
      }, 1500);
    } catch (err) {
      console.error('SOS Activation error:', err);
      // Fallback redirect
      setTimeout(() => {
        setShowSosModal(false);
        navigate('/citizen/tracking?id=1');
      }, 1200);
    } finally {
      setSosSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">Submitted (Awaiting Verification)</span>;
      case 'VERIFIED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Verified by Officer</span>;
      case 'ACTIVE':
      case 'RESPONSE_IN_PROGRESS':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">Emergency Response Active</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Resolved & Closed</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">Rejected</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/20 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Instant Red SOS Floating / Header Alert */}
      <div className="bg-gradient-to-r from-red-950 via-rose-900 to-red-950 border-2 border-rose-500/70 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-xs font-black uppercase tracking-widest text-rose-300 bg-rose-950/80 px-3 py-1 rounded-full border border-rose-500/50">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span>EMERGENCY SOS BEACON DISPATCH</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Life-Threatening Emergency?
            </h1>
            <p className="text-sm text-rose-100 max-w-xl">
              One-touch priority distress beacon. Transmits live coordinates to all active NDRF/SDRF rescue boats and emergency officers instantly.
            </p>
          </div>
          <button
            onClick={() => setShowSosModal(true)}
            className="inline-flex items-center justify-center space-x-3 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-black text-base px-7 py-4 rounded-xl shadow-2xl shadow-rose-600/60 border border-rose-300/40 transition-all transform hover:scale-105 active:scale-95 shrink-0"
          >
            <Radio className="w-6 h-6 animate-pulse text-white" />
            <span className="tracking-wide">ACTIVATE INSTANT SOS</span>
          </button>
        </div>
      </div>

      {/* Citizen Welcome Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-rose-400 mb-1">
              <LifeBuoy className="w-4 h-4" />
              <span>Standard Incident Registration</span>
            </div>
            <h2 className="text-xl font-black text-white">
              Hello, {user?.fullName || 'Citizen'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Report urban hazards with detailed descriptions, photos, and itemized relief supply requests. 
              Track deployed rescue squads, shelter beds, and hospital referrals in real time.
            </p>
          </div>
          <Link
            to="/citizen/report"
            className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl border border-slate-700 text-xs sm:text-sm shrink-0 transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-rose-400" />
            <span>Detailed Disaster Report</span>
          </Link>
        </div>
      </div>

      {/* Quick Access Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/citizen/report"
          className="bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 p-5 rounded-xl transition-all group flex items-start space-x-4"
        >
          <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400 group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm group-hover:text-rose-400 transition-colors">
              Submit Incident Report
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Report floods, fire, building collapse, or severe accidents with map pin coordinates and supply needs.
            </p>
          </div>
        </Link>

        <Link
          to="/citizen/tracking"
          className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 p-5 rounded-xl transition-all group flex items-start space-x-4"
        >
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 group-hover:scale-110 transition-transform">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">
              Live Squad Tracking
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              View real-time GPS telemetry, squad leader contact, distance in km, and arrival ETA.
            </p>
          </div>
        </Link>

        <Link
          to="/citizen/shelters"
          className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-xl transition-all group flex items-start space-x-4"
        >
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
              Find Safe Shelters & Beds
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Check live capacity of nearby municipal relief shelters and hospital bed status.
            </p>
          </div>
        </Link>
      </div>

      {/* My Submitted Reports Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-white">My Emergency Reports & Incident Status</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {reports.length} Report(s) Registered
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Loading your verified incident records...
          </div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center">
            <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-medium text-sm">No disaster reports logged yet</p>
            <p className="text-xs text-slate-500 mt-1">If you are witnessing an emergency in Bangalore North, report it immediately.</p>
            <Link
              to="/citizen/report"
              className="mt-4 inline-flex items-center space-x-2 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2 rounded-lg border border-rose-500/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Incident Report</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((rpt) => (
              <div
                key={rpt.report_id || rpt.REPORTID}
                className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-bold text-rose-400">
                      {rpt.report_reference_id || `RPT-${rpt.report_id || rpt.REPORTID}`}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                      {rpt.disaster_type || 'Disaster'}
                    </span>
                    {getStatusBadge(rpt.status)}
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-1 mt-1">
                    {rpt.description}
                  </p>
                  <div className="flex items-center space-x-4 text-[11px] text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(rpt.submitted_at || Date.now()).toLocaleString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Ward: {rpt.location_id ? `Loc #${rpt.location_id}` : 'Bangalore Sector'}</span>
                    </span>
                    <span>People Affected: <strong>{rpt.people_affected || 1}</strong></span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <Link
                    to={`/citizen/tracking?id=${rpt.report_id || rpt.REPORTID}`}
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-3.5 py-2 rounded-lg transition-colors"
                  >
                    <span>Track Live Squad</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SOS Confirmation Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-rose-500 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100">
            {sosSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto border-2 border-rose-500 animate-bounce">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-white">SOS BEACON TRANSMITTED!</h3>
                <p className="text-sm text-slate-300">
                  Emergency ID: <span className="font-mono font-bold text-rose-400">{sosSuccess.emergency_id}</span>
                </p>
                <p className="text-xs text-slate-400">
                  Routing rescue squads and opening live tracking map...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-rose-400 border-b border-slate-800 pb-3">
                  <Radio className="w-6 h-6 animate-pulse" />
                  <div>
                    <h3 className="font-black text-lg text-white">CONFIRM EMERGENCY SOS BEACON</h3>
                    <p className="text-xs text-rose-400">Direct transmission to Disaster Command & NDRF</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>GPS Telemetry:</span>
                    <span className="font-mono text-cyan-400 font-bold">{currentCoords.lat}, {currentCoords.lng}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Priority Level:</span>
                    <span className="font-bold text-rose-400">P1 - CRITICAL RESCUE</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Trapped Persons Count:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={sosTrappedCount}
                      onChange={(e) => setSosTrappedCount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Urgent Emergency Notes:
                    </label>
                    <textarea
                      rows="2"
                      value={sosNotes}
                      onChange={(e) => setSosNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <label className="flex items-center space-x-2 text-xs cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={sosMedical}
                      onChange={(e) => setSosMedical(e.target.checked)}
                      className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span className="font-semibold text-rose-200">Urgent Medical Attention / Triage Required</span>
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowSosModal(false)}
                    disabled={sosSubmitting}
                    className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={triggerInstantSOS}
                    disabled={sosSubmitting}
                    className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-rose-600/40"
                  >
                    {sosSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Broadcasting...</span>
                      </>
                    ) : (
                      <>
                        <Radio className="w-4 h-4" />
                        <span>CONFIRM & TRANSMIT NOW</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
