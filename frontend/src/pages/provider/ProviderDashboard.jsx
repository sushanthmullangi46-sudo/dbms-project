import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Truck, 
  ArrowRightLeft, 
  CheckCircle2, 
  Plus, 
  Package, 
  Clock, 
  MapPin, 
  TrendingUp, 
  AlertCircle
} from 'lucide-react';
import api from '../../api/client';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';

export default function ProviderDashboard() {
  const [resources, setResources] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [resourceTypes, setResourceTypes] = useState([]);

  const [form, setForm] = useState({
    resourceTypeId: 1,
    resourceName: '',
    quantity: 10,
    condition: 'EXCELLENT',
    currentLocationId: 1001,
    registrationNumber: ''
  });

  const { success, error } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resData, allocData, catData] = await Promise.all([
        api.get('/provider/resources'),
        api.get('/provider/allocations'),
        api.get('/resources/types')
      ]);

      if (resData.success) {
        setResources(resData.resources || []);
        setVehicles(resData.vehicles || []);
      }
      if (allocData.success) {
        setAllocations(allocData.allocations || []);
      }
      if (catData.success) {
        setResourceTypes(catData.types || []);
        if (catData.types && catData.types.length > 0) {
          setForm((prev) => ({ ...prev, resourceTypeId: catData.types[0].RESOURCETYPEID }));
        }
      }
    } catch (err) {
      error(err.message || 'Failed to load provider metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegisterResource = async (e) => {
    e.preventDefault();
    setRegistering(true);
    try {
      const res = await api.post('/provider/resources', form);
      if (res.success) {
        success('Resource equipment registered to emergency stockpile!');
        setIsRegisterOpen(false);
        setForm({
          resourceTypeId: resourceTypes[0]?.RESOURCETYPEID || 1,
          resourceName: '',
          quantity: 10,
          condition: 'EXCELLENT',
          currentLocationId: 1001,
          registrationNumber: ''
        });
        fetchData();
      }
    } catch (err) {
      error(err.message || 'Resource registration failed');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return <Spinner size="lg" text="Syncing provider logistics with Oracle DB..." />;
  }

  const totalQuantity = resources.reduce((acc, r) => acc + (Number(r.QUANTITY) || 0), 0);
  const availableItems = resources.filter((r) => r.AVAILABILITYSTATUS === 'AVAILABLE');
  const activeAllocations = allocations.filter((a) => a.MISSIONSTATUS !== 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Boxes className="w-5 h-5 text-brand-400" />
            <span>Resource Provider Command & Logistics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage physical asset inventory, transport fleet, and monitor tactical mission allocations
          </p>
        </div>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Resource</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Cataloged Assets"
          value={resources.length}
          icon={Boxes}
          color="brand"
          subtext={`${totalQuantity} total inventory units`}
        />
        <StatCard
          title="Fleet Vehicles"
          value={vehicles.length}
          icon={Truck}
          color="cyan"
          subtext="Emergency transport units"
        />
        <StatCard
          title="Active Mission Dispatches"
          value={activeAllocations.length}
          icon={TrendingUp}
          color="amber"
          subtext="Currently deployed in field"
        />
        <StatCard
          title="Stock Availability"
          value={`${resources.length > 0 ? Math.round((availableItems.length / resources.length) * 100) : 0}%`}
          icon={CheckCircle2}
          color="emerald"
          subtext={`${availableItems.length} ready for mobilization`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Managed Resources (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-brand-400" />
              <span>Registered Emergency Stockpile</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {resources.length} items cataloged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/60">
                  <th className="py-2.5 px-3">Asset ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Quantity</th>
                  <th className="py-2.5 px-3">Condition</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {resources.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500 italic">
                      No resources registered under this provider account yet.
                    </td>
                  </tr>
                ) : (
                  resources.slice(0, 7).map((r) => (
                    <tr key={r.RESOURCEID} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-brand-400">
                        #{r.RESOURCEID}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-white">
                        {r.RESOURCENAME}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {r.CATEGORY || 'GENERAL'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                        {r.QUANTITY} {r.UNIT || 'Units'}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge text={r.CONDITION} />
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge text={r.AVAILABILITYSTATUS} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Mission Deployments (1 Col) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-cyan-400" />
              <span>Active Deployed Gear</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {allocations.length} records
            </span>
          </div>

          <div className="space-y-3">
            {allocations.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">
                No resources currently deployed in active operations.
              </p>
            ) : (
              allocations.slice(0, 5).map((a, idx) => (
                <div key={idx} className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white truncate max-w-[140px]">{a.RESOURCENAME}</span>
                    <Badge text={a.MISSIONSTATUS} />
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Dispatched To:</span>
                    <span className="text-brand-400 font-semibold">{a.RESPONDERTEAM}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Incident:</span>
                    <span className="text-slate-300 truncate max-w-[140px]">{a.INCIDENTNAME}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px] pt-1 border-t border-slate-800/80">
                    <span className="text-slate-500">Allocated:</span>
                    <span className="text-emerald-400 font-bold">{a.QUANTITYALLOCATED} Units</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Register Resource Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register Resource / Asset in Emergency Pool"
      >
        <form onSubmit={handleRegisterResource} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Resource Name / Model
            </label>
            <input
              type="text"
              required
              value={form.resourceName}
              onChange={(e) => setForm({ ...form, resourceName: e.target.value })}
              placeholder="e.g. Inflatable Rescue Raft MK-II, Generator 5kVA..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Resource Category / Type
              </label>
              <select
                value={form.resourceTypeId}
                onChange={(e) => setForm({ ...form, resourceTypeId: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                {resourceTypes.map((t) => (
                  <option key={t.RESOURCETYPEID} value={t.RESOURCETYPEID}>
                    {t.RESOURCENAME} ({t.CATEGORY})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Quantity Available
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
                Equipment Condition
              </label>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="EXCELLENT">EXCELLENT</option>
                <option value="GOOD">GOOD</option>
                <option value="FAIR">FAIR</option>
                <option value="NEEDS_MAINTENANCE">NEEDS MAINTENANCE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Registration / Serial #
              </label>
              <input
                type="text"
                value={form.registrationNumber}
                onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                placeholder="Optional tag (e.g. SN-88392)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registering}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20"
            >
              {registering ? 'Registering...' : 'Register Asset'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
