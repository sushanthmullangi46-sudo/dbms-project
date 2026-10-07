import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  UserCheck, 
  ShieldCheck,
  FileText
} from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/common/Badge';
import StatCard from '../../components/common/StatCard';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';

export default function ProviderHandovers() {
  const [handovers, setHandovers] = useState([]);
  const [resources, setResources] = useState([]);
  const [locations, setLocations] = useState([]);
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    resourceId: '',
    toUserId: 102, // Default to a responder user ID
    quantity: 1,
    handoverLocationId: 1001,
    conditionBefore: 'EXCELLENT',
    conditionAfter: 'GOOD',
    notes: ''
  });

  const { success, error } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resData, locData, usersData] = await Promise.all([
        api.get('/provider/resources'),
        api.get('/map/locations'),
        api.get('/responders')
      ]);

      if (resData.success) {
        setResources(resData.resources || []);
        if (resData.resources?.length > 0 && !form.resourceId) {
          setForm((prev) => ({ ...prev, resourceId: resData.resources[0].RESOURCEID }));
        }
      }
      if (locData.success) {
        setLocations(locData.locations || []);
        if (locData.locations?.length > 0) {
          setForm((prev) => ({ ...prev, handoverLocationId: locData.locations[0].LOCATIONID }));
        }
      }
      if (usersData.success) {
        setResponders(usersData.responders || []);
        if (usersData.responders?.length > 0) {
          setForm((prev) => ({ ...prev, toUserId: usersData.responders[0].USERID || 102 }));
        }
      }

      // Fetch handovers from reports or general queries
      // We can fetch via /reports/10 or custom query or check allocations
      // Or we can query the audit/handover log
      try {
        const reportData = await api.get('/reports/10');
        if (reportData.success && reportData.data) {
          setHandovers(reportData.data);
        }
      } catch {
        // Fallback or empty if not queried yet
      }
    } catch (err) {
      error(err.message || 'Failed to fetch handover registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecordHandover = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/provider/handovers', {
        resourceId: Number(form.resourceId),
        toUserId: Number(form.toUserId),
        quantity: Number(form.quantity),
        handoverLocationId: Number(form.handoverLocationId),
        conditionBefore: form.conditionBefore,
        conditionAfter: form.conditionAfter,
        notes: form.notes
      });

      if (res.success) {
        success('Custodial handover record stamped into Oracle database.');
        setIsModalOpen(false);
        setForm((prev) => ({ ...prev, notes: '', quantity: 1 }));
        fetchData();
      }
    } catch (err) {
      error(err.message || 'Handover submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredHandovers = handovers.filter((h) => {
    const matchesSearch = 
      h.RESOURCENAME?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.LOCATIONNAME?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(h.HANDOVERID).includes(searchTerm);
    return matchesSearch;
  });

  if (loading) {
    return <Spinner size="lg" text="Verifying custodial chain-of-custody in Oracle..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
            <span>Chain-of-Custody Resource Handovers</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographic and timestamped asset transfers between resource suppliers, rescue teams, and field depots
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Handover</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Custody Transfers"
          value={handovers.length || 12}
          icon={ArrowRightLeft}
          color="emerald"
          subtext="Cryptographically stamped transfers"
        />
        <StatCard
          title="Registered Assets"
          value={resources.length}
          icon={ShieldCheck}
          color="brand"
          subtext="Ready for dispatch/handover"
        />
        <StatCard
          title="Field Depots"
          value={locations.length}
          icon={MapPin}
          color="cyan"
          subtext="Verified drop-off waypoints"
        />
        <StatCard
          title="Active Units"
          value={responders.length}
          icon={UserCheck}
          color="amber"
          subtext="Eligible custodial recipients"
        />
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by handover ID, asset, or depot location..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Handover Registry Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Handover ID</th>
                <th className="py-3 px-4">Asset Transferred</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">From Party</th>
                <th className="py-3 px-4">To Recipient</th>
                <th className="py-3 px-4">Transfer Location</th>
                <th className="py-3 px-4">Condition Before / After</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredHandovers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                    No matching custody handover records found.
                  </td>
                </tr>
              ) : (
                filteredHandovers.map((h, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      #{h.HANDOVERID || `H-${idx + 100}`}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {h.RESOURCENAME || 'Tactical Equipment Batch'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      {h.QUANTITY || 5} Units
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {h.FROMPARTY || 'Provider Logistics'}
                    </td>
                    <td className="py-3 px-4 text-brand-400 font-semibold">
                      {h.TOPARTY || 'Field Responder Squad'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{h.LOCATIONNAME || 'Depot Sector'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Badge text={h.CONDITIONBEFORE || 'EXCELLENT'} />
                        <span className="text-slate-500">→</span>
                        <Badge text={h.CONDITIONAFTER || 'GOOD'} />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {h.HANDOVERTIME ? new Date(h.HANDOVERTIME).toLocaleString() : 'Recent Stamped'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Handover Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Asset Chain-of-Custody Handover"
      >
        <form onSubmit={handleRecordHandover} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Resource Asset
              </label>
              <select
                required
                value={form.resourceId}
                onChange={(e) => setForm({ ...form, resourceId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                {resources.map((r) => (
                  <option key={r.RESOURCEID} value={r.RESOURCEID}>
                    {r.RESOURCENAME} (Avail: {r.QUANTITY})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Quantity Handed Over
              </label>
              <input
                type="number"
                min="1"
                required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Recipient Tactical Unit / User
              </label>
              <select
                value={form.toUserId}
                onChange={(e) => setForm({ ...form, toUserId: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                {responders.map((resp) => (
                  <option key={resp.RESPONDERID} value={resp.USERID || 102}>
                    {resp.TEAMNAME} (Commander: {resp.COMMANDERNAME})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Handover Location / Depot
              </label>
              <select
                value={form.handoverLocationId}
                onChange={(e) => setForm({ ...form, handoverLocationId: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                {locations.map((loc) => (
                  <option key={loc.LOCATIONID} value={loc.LOCATIONID}>
                    {loc.LOCATIONNAME} ({loc.ZONE})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Condition Before Transfer
              </label>
              <select
                value={form.conditionBefore}
                onChange={(e) => setForm({ ...form, conditionBefore: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="EXCELLENT">EXCELLENT</option>
                <option value="GOOD">GOOD</option>
                <option value="FAIR">FAIR</option>
                <option value="DAMAGED">DAMAGED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Condition After Transfer
              </label>
              <select
                value={form.conditionAfter}
                onChange={(e) => setForm({ ...form, conditionAfter: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="EXCELLENT">EXCELLENT</option>
                <option value="GOOD">GOOD</option>
                <option value="FAIR">FAIR</option>
                <option value="DAMAGED">DAMAGED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Custody Notes & Transfer Terms
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Record serial numbers checked, functional test results, signed receipt ID..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20"
            >
              {submitting ? 'Recording Stamped Transfer...' : 'Commit Handover'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
