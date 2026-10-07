import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Users, 
  Boxes,
  Calendar
} from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/common/Badge';
import StatCard from '../../components/common/StatCard';
import Spinner from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';

export default function ProviderAllocations() {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const { error } = useToast();

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/provider/allocations');
      if (res.success) {
        setAllocations(res.allocations || []);
      }
    } catch (err) {
      error(err.message || 'Failed to fetch allocations');
    } finally {
      setLoading(false);
    }
  };

  const activeAllocations = allocations.filter((a) => a.MISSIONSTATUS !== 'COMPLETED');
  const completedAllocations = allocations.filter((a) => a.MISSIONSTATUS === 'COMPLETED');

  const filteredAllocations = allocations.filter((a) => {
    const matchesSearch = 
      a.RESOURCENAME?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.INCIDENTNAME?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.RESPONDERTEAM?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(a.MISSIONID).includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || a.MISSIONSTATUS === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <Spinner size="lg" text="Querying Oracle mission allocations..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Truck className="w-5 h-5 text-cyan-400" />
            <span>Mission Equipment Allocations</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time tracking of tactical missions utilizing your registered stockpile equipment
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Mission Dispatches"
          value={allocations.length}
          icon={Truck}
          color="cyan"
          subtext="Total equipment deploy runs"
        />
        <StatCard
          title="Active Field Deployments"
          value={activeAllocations.length}
          icon={Clock}
          color="amber"
          subtext="Currently deployed in operations"
        />
        <StatCard
          title="Completed & Returned"
          value={completedAllocations.length}
          icon={CheckCircle2}
          color="emerald"
          subtext="Safely returned to inventory"
        />
        <StatCard
          title="Assigned Teams"
          value={new Set(allocations.map(a => a.RESPONDERTEAM)).size}
          icon={Users}
          color="brand"
          subtext="Distinct rescue squads"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by mission ID, resource, incident, or squad..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs text-slate-400 font-semibold">Mission Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="EN_ROUTE">En Route</option>
            <option value="ARRIVED">Arrived</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Mission ID</th>
                <th className="py-3 px-4">Resource Allocated</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Quantity Allocated</th>
                <th className="py-3 px-4">Assigned Unit</th>
                <th className="py-3 px-4">Incident Operation</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Deployment Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAllocations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                    No resource allocations match current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAllocations.map((a, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      #{a.MISSIONID}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {a.RESOURCENAME}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {a.CATEGORY || 'GENERAL'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {a.QUANTITYALLOCATED} Units
                    </td>
                    <td className="py-3 px-4 text-brand-300 font-medium">
                      {a.RESPONDERTEAM}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {a.INCIDENTNAME}
                    </td>
                    <td className="py-3 px-4">
                      <Badge text={a.MISSIONSTATUS} />
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {a.STARTTIME ? new Date(a.STARTTIME).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
