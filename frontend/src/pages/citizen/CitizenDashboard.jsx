import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  LifeBuoy
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyReports();
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
      {/* Citizen Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-rose-400 mb-1">
              <LifeBuoy className="w-4 h-4" />
              <span>Emergency Citizen Portal</span>
            </div>
            <h1 className="text-2xl font-black text-white">
              Hello, {user?.fullName || 'Citizen'}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Report active urban emergencies directly to the Disaster Management Command Center. 
              Track response team progress, shelter availability, and medical assistance in real-time.
            </p>
          </div>
          <Link
            to="/citizen/report"
            className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-rose-600/30 transition-all text-sm shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Report Disaster / Emergency</span>
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
              Report floods, fire, building collapse, or severe accidents with map pin coordinates.
            </p>
          </div>
        </Link>

        <Link
          to="/citizen/assistance"
          className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 p-5 rounded-xl transition-all group flex items-start space-x-4"
        >
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 group-hover:scale-110 transition-transform">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">
              Request Relief Assistance
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Urgent food packets, purified water, medical triage, or boat rescue evacuation.
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
                      {rpt.report_reference_id || `RPT-${rpt.report_id}`}
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
                    <span>Track Real-Time Status</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
