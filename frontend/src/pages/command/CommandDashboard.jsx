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
  ExternalLink
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

const SEVERITY_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e'
};

const PIE_COLORS = ['#0ea5e9', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981'];

export default function CommandDashboard() {
  const [data, setData] = useState(null);
  const [mapMarkers, setMapMarkers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [dashRes, mapRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/map/markers')
      ]);
      if (dashRes.success) setData(dashRes.data);
      if (mapRes.success) setMapMarkers(mapRes.markers);
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

  if (loading) {
    return <Spinner size="lg" text="Querying Oracle Database metrics..." />;
  }

  const {
    topCards = {},
    severityDistribution = [],
    requestsByCategory = [],
    missionStatusDistribution = [],
    resourceAvailabilityByCategory = [],
    inventoryAlerts = [],
    criticalPendingRequests = [],
    recentActivity = []
  } = data || {};

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            Command Center Operations Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry and resource orchestration powered by Oracle Database
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-400' : ''}`} />
          <span>Refresh Database</span>
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

      {/* 2. Interactive Disaster Map Overview */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Tactical Geospatial Overview
            </h3>
            <p className="text-xs text-slate-400">Live incidents, distress calls, and facility pins across Bangalore</p>
          </div>
          <Link
            to="/command/map"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            <span>Full Map View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
        {mapMarkers && <DisasterMap markers={mapMarkers} />}
      </div>

      {/* 3. Operational Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart A: Incidents by Severity */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
            Active Incidents by Severity
          </h3>
          <p className="text-xs text-slate-400 mb-4">Distribution of ongoing emergency threats</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {severityDistribution.map((entry) => (
                    <Cell 
                      key={`cell-${entry.name}`} 
                      fill={SEVERITY_COLORS[entry.name] || '#3b82f6'} 
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Requests by Category */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
            Emergency Requests by Category
          </h3>
          <p className="text-xs text-slate-400 mb-4">Breakdown of civilian distress call types</p>
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

        {/* Chart C: Resource Availability vs Deployment */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
            Resource Capacity & Deployment
          </h3>
          <p className="text-xs text-slate-400 mb-4">Available vs field-deployed inventory units by category</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBar data={resourceAvailabilityByCategory} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <XAxis dataKey="category" stroke="#64748b" fontSize={11} angle={-20} textAnchor="end" />
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

      {/* 4. Bottom Operational Triage Tables */}
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
            <Link to="/command/requests" className="text-xs font-semibold text-brand-400 hover:text-brand-300">
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
            <Link to="/command/inventory" className="text-xs font-semibold text-brand-400 hover:text-brand-300">
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
