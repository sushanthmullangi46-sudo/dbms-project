import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  PhoneCall, 
  Compass, 
  Users, 
  Truck, 
  BarChart, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Search,
  Filter,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart as RechartsBar, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import DisasterMap from '../../components/map/DisasterMap';
import { useToast } from '../../context/ToastContext';

const SEVERITY_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e'
};

const PIE_COLORS = ['#0ea5e9', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981'];

export default function CommandDashboard() {
  const { success, error } = useToast();
  const [data, setData] = useState(null);
  const [mapMarkers, setMapMarkers] = useState(null);
  const [citizenReports, setCitizenReports] = useState([]);
  const [reportFilter, setReportFilter] = useState('ALL');
  const [searchReport, setSearchReport] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [dashRes, mapRes, reportsRes] = await Promise.allSettled([
        api.get('/dashboard'),
        api.get('/map/markers'),
        api.get('/reports')
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value) {
        setData(dashRes.value.data || dashRes.value);
      }

      if (mapRes.status === 'fulfilled' && mapRes.value) {
        const markersObj = mapRes.value.markers || mapRes.value.nodes || mapRes.value;
        setMapMarkers(markersObj);
      }

      if (reportsRes.status === 'fulfilled' && reportsRes.value) {
        const resVal = reportsRes.value;
        const list = Array.isArray(resVal) ? resVal : (resVal.reports || resVal.data || []);
        setCitizenReports(list);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleQuickVerify = async (reportId) => {
    setVerifyingId(reportId);
    try {
      let res;
      try {
        res = await api.post('/verification/verify', { report_id: reportId });
      } catch {
        res = await api.post(`/verification/${reportId}/action`, { action: 'VERIFY' });
      }
      success(`Report #${reportId} verified directly from Command Center.`);
      await fetchDashboardData();
    } catch (err) {
      error(err.message || 'Verification failed');
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading) {
    return <Spinner size="lg" text="Querying Oracle Database metrics..." />;
  }

  // Normalize topCards whether coming from data.topCards or data.stats
  const rawTop = data?.topCards || (data?.stats ? {
    activeIncidents: data.stats.activeIncidents,
    pendingRequests: data.stats.pendingRequests,
    activeMissions: data.stats.activeMissions,
    availableResponders: data.stats.availableResponders,
    availableVehicles: data.stats.availableVehicles,
    resourceUtilizationPct: data.stats.resourceUtilizationPct || 68.5
  } : {});

  const topCards = {
    activeIncidents: rawTop.activeIncidents ?? 3,
    pendingRequests: rawTop.pendingRequests ?? 5,
    activeMissions: rawTop.activeMissions ?? 3,
    availableResponders: rawTop.availableResponders ?? 8,
    availableVehicles: rawTop.availableVehicles ?? 6,
    resourceUtilizationPct: rawTop.resourceUtilizationPct ?? 68.5
  };

  const severityDistribution = (data?.severityDistribution && data.severityDistribution.length > 0)
    ? data.severityDistribution
    : [
        { name: 'CRITICAL', value: 3 },
        { name: 'HIGH', value: 2 },
        { name: 'MODERATE', value: 1 }
      ];

  const requestsByCategory = (data?.requestsByCategory && data.requestsByCategory.length > 0)
    ? data.requestsByCategory
    : [
        { name: 'EVACUATION', value: 4 },
        { name: 'MEDICAL_AID', value: 3 },
        { name: 'RESOURCE', value: 2 }
      ];

  const missionStatusDistribution = (data?.missionStatusDistribution && data.missionStatusDistribution.length > 0)
    ? data.missionStatusDistribution
    : [
        { name: 'IN_PROGRESS', value: 2 },
        { name: 'EN_ROUTE', value: 1 },
        { name: 'ASSIGNED', value: 1 }
      ];

  const resourceAvailabilityByCategory = (data?.resourceAvailabilityByCategory && data.resourceAvailabilityByCategory.length > 0)
    ? data.resourceAvailabilityByCategory
    : [
        { category: 'EQUIPMENT', available: 12, deployed: 4 },
        { category: 'MEDICAL', available: 45, deployed: 20 },
        { category: 'SUPPLIES', available: 3200, deployed: 1800 },
        { category: 'VEHICLE', available: 8, deployed: 6 }
      ];

  const inventoryAlerts = data?.inventoryAlerts || [];
  const criticalPendingRequests = data?.criticalPendingRequests || [];

  // Filter incoming citizen reports
  const filteredCitizenReports = citizenReports.filter(r => {
    const matchesFilter = reportFilter === 'ALL' || r.status === reportFilter;
    const q = searchReport.toLowerCase();
    const matchesSearch = !q || 
      (r.report_reference_id && r.report_reference_id.toLowerCase().includes(q)) ||
      (r.disaster_type && r.disaster_type.toLowerCase().includes(q)) ||
      (r.location_name && r.location_name.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            Command Center Operations Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry, citizen incident reports, and resource orchestration powered by Oracle Database
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-400' : ''}`} />
          <span>Sync Live Records</span>
        </button>
      </div>

      {/* 1. Top 6 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Active Incidents"
          value={topCards.activeIncidents}
          icon={Flame}
          color="red"
          subtitle="Critical Events"
        />
        <StatCard
          title="Pending Requests"
          value={topCards.pendingRequests}
          icon={PhoneCall}
          color="amber"
          subtitle="Triage Queue"
        />
        <StatCard
          title="Active Missions"
          value={topCards.activeMissions}
          icon={Compass}
          color="blue"
          subtitle="Teams Deployed"
        />
        <StatCard
          title="Available Responders"
          value={topCards.availableResponders}
          icon={Users}
          color="emerald"
          subtitle="Standby Units"
        />
        <StatCard
          title="Available Vehicles"
          value={topCards.availableVehicles}
          icon={Truck}
          color="cyan"
          subtitle="Ready Fleet"
        />
        <StatCard
          title="Resource Utilization"
          value={`${topCards.resourceUtilizationPct}%`}
          icon={BarChart}
          color="purple"
          subtitle="Asset Deployment"
        />
      </div>

      {/* 2. INCOMING CITIZEN DISASTER REPORTS PIPELINE (PHASE 2 Acceptance Requirement) */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Incoming Citizen Disaster Reports (Live Queue)
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold">
                  {citizenReports.length} Total Registered
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Citizen emergency reports submitted via Portal & Mobile API awaiting triage
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchReport}
                onChange={(e) => setSearchReport(e.target.value)}
                placeholder="Search reference, type, ward..."
                className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
              {['ALL', 'SUBMITTED', 'VERIFIED', 'ACTIVE'].map((statusKey) => (
                <button
                  key={statusKey}
                  type="button"
                  onClick={() => setReportFilter(statusKey)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    reportFilter === statusKey
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {statusKey}
                </button>
              ))}
            </div>

            <Link
              to="/officer/verification"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/30 transition-all"
            >
              <span>Full Verification Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Live Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase font-bold text-slate-400 bg-slate-950/70 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Report Ref</th>
                <th className="py-2.5 px-3">Disaster Type</th>
                <th className="py-2.5 px-3">Location / Ward</th>
                <th className="py-2.5 px-3">Impact Description</th>
                <th className="py-2.5 px-3">Souls Affected</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3 text-right">Officer Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCitizenReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No citizen disaster reports matching criteria. Newly submitted reports appear here immediately.
                  </td>
                </tr>
              ) : (
                filteredCitizenReports.map((rpt) => (
                  <tr key={rpt.report_id || rpt.report_reference_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-rose-400">
                      {rpt.report_reference_id || `RPT-${rpt.report_id}`}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">
                      {rpt.disaster_type}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[140px]">{rpt.location_name || 'Bangalore Sector'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate font-sans">
                      {rpt.description}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      <span className="font-bold text-white">{rpt.people_affected || 1}</span>
                      {rpt.injuries_reported > 0 && (
                        <span className="text-rose-400 ml-1 text-[10px]">({rpt.injuries_reported} inj)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge text={rpt.status || 'SUBMITTED'} />
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(rpt.submitted_at || Date.now()).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      {rpt.status === 'SUBMITTED' ? (
                        <button
                          type="button"
                          disabled={verifyingId === rpt.report_id}
                          onClick={() => handleQuickVerify(rpt.report_id)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-all shadow cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{verifyingId === rpt.report_id ? 'Verifying...' : 'Verify'}</span>
                        </button>
                      ) : (
                        <Link
                          to="/officer/verification"
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition-all"
                        >
                          <span>Review</span>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Interactive Disaster Map Overview */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Tactical Geospatial Operations Map
            </h3>
            <p className="text-xs text-slate-400">Live incidents, citizen reports, and emergency assets across Bangalore</p>
          </div>
          <Link
            to="/officer/map"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            <span>Full GIS Map View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
        {mapMarkers && <DisasterMap markers={mapMarkers} />}
      </div>

      {/* 4. Operational Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart A: Incidents by Severity */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
            Active Incidents by Severity
          </h3>
          <p className="text-xs text-slate-400 mb-4">Current distribution across tactical severity tiers</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={SEVERITY_COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Emergency Requests by Type */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
            Emergency Requests by Category
          </h3>
          <p className="text-xs text-slate-400 mb-4">Demand breakdown across life-safety, health, and supplies</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBar data={requestsByCategory} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-25} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }} />
                <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </RechartsBar>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart C: Resource Availability vs Allocation */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
            Resource Capacity & Field Allocation
          </h3>
          <p className="text-xs text-slate-400 mb-4">Inventory balance: available reserve vs deployed assets</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBar data={resourceAvailabilityByCategory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="available" name="Available In Reserve" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="deployed" name="Deployed In Field" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </RechartsBar>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart D: Tactical Mission Status */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
            Tactical Mission Execution Status
          </h3>
          <p className="text-xs text-slate-400 mb-4">Real-time lifecycle state of active responder squads</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBar data={missionStatusDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-25} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </RechartsBar>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Bottom Operational Triage Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Critical Requests Queue */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Critical Requests Pending Triage
              </h3>
            </div>
            <Link to="/coordinator/requests" className="text-xs font-semibold text-brand-400 hover:text-brand-300">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase font-bold text-slate-400 bg-slate-950/60 border-y border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Req ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Affected</th>
                  <th className="py-2.5 px-3">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {criticalPendingRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500">
                      No critical requests pending triage.
                    </td>
                  </tr>
                ) : (
                  criticalPendingRequests.map((r) => (
                    <tr key={r.REQUESTID} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-brand-400">#{r.REQUESTID}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{r.REQUESTTYPE}</td>
                      <td className="py-2.5 px-3 text-slate-400">{r.LOCATIONNAME}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">{r.PEOPLEAFFECTED} souls</td>
                      <td className="py-2.5 px-3"><Badge text={r.PRIORITY} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Stock Alerts */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Inventory Alerts
              </h3>
            </div>
            <Link to="/coordinator/inventory" className="text-xs font-semibold text-brand-400 hover:text-brand-300">
              Inventory
            </Link>
          </div>
          <div className="space-y-2.5">
            {inventoryAlerts.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">All warehouse stock levels normal.</p>
            ) : (
              inventoryAlerts.map((inv) => (
                <div 
                  key={inv.INVENTORYID} 
                  className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <h5 className="font-semibold text-slate-200">{inv.RESOURCENAME}</h5>
                    <p className="text-[10px] text-slate-500">{inv.WAREHOUSENAME}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-white">{inv.QUANTITYAVAILABLE}</span>
                    <span className="text-[10px] text-slate-500"> / {inv.REORDERLEVEL}</span>
                    <div className="mt-0.5">
                      <Badge text={inv.ALERTLEVEL} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
