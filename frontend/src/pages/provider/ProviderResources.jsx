import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Truck, 
  Plus, 
  Edit3, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';

export default function ProviderResources() {
  const [resources, setResources] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [resourceTypes, setResourceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resources'); // 'resources' | 'vehicles'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [editForm, setEditForm] = useState({
    quantity: 0,
    condition: 'EXCELLENT',
    availabilityStatus: 'AVAILABLE'
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Register Modal
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    resourceTypeId: 1,
    resourceName: '',
    quantity: 1,
    condition: 'EXCELLENT',
    currentLocationId: 1001,
    registrationNumber: ''
  });

  const { success, error } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resData, typesData] = await Promise.all([
        api.get('/provider/resources'),
        api.get('/resources/types')
      ]);

      if (resData.success) {
        setResources(resData.resources || []);
        setVehicles(resData.vehicles || []);
      }
      if (typesData.success) {
        setResourceTypes(typesData.types || []);
        if (typesData.types?.length > 0) {
          setNewForm((prev) => ({ ...prev, resourceTypeId: typesData.types[0].RESOURCETYPEID }));
        }
      }
    } catch (err) {
      error(err.message || 'Failed to fetch resource catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenEdit = (res) => {
    setEditingResource(res);
    setEditForm({
      quantity: res.QUANTITY,
      condition: res.CONDITION,
      availabilityStatus: res.AVAILABILITYSTATUS
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingResource) return;
    setActionLoading(true);
    try {
      const res = await api.put(`/provider/resources/${editingResource.RESOURCEID}`, editForm);
      if (res.success) {
        success(`Resource #${editingResource.RESOURCEID} updated.`);
        setIsEditModalOpen(false);
        fetchData();
      }
    } catch (err) {
      error(err.message || 'Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post('/provider/resources', newForm);
      if (res.success) {
        success('New asset added to stockpile.');
        setIsRegisterOpen(false);
        fetchData();
      }
    } catch (err) {
      error(err.message || 'Registration failed');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredResources = resources.filter((r) => {
    const matchesSearch = 
      r.RESOURCENAME?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.CATEGORY?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(r.RESOURCEID).includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || r.AVAILABILITYSTATUS === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch = 
      v.VEHICLENAME?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.REGISTRATIONNUMBER?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.VEHICLETYPE?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || v.STATUS === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <Spinner size="lg" text="Loading provider asset fleet..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Boxes className="w-5 h-5 text-brand-400" />
            <span>Managed Equipment & Fleet Inventory</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Registered equipment units, physical health conditions, and real-time operational availability
          </p>
        </div>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Asset</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab('resources')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'resources'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Tactical Equipment ({resources.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'vehicles'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Transport Vehicles ({vehicles.length})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by asset name, model, serial, or category..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs text-slate-400 font-semibold">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ALLOCATED">Allocated</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {activeTab === 'resources' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Asset ID</th>
                  <th className="py-3 px-4">Resource Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Quantity Stock</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredResources.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                      No matching equipment records found.
                    </td>
                  </tr>
                ) : (
                  filteredResources.map((r) => (
                    <tr key={r.RESOURCEID} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-brand-400">
                        #{r.RESOURCEID}
                      </td>
                      <td className="py-3 px-4 font-medium text-white">
                        <div>{r.RESOURCENAME}</div>
                        {r.REGISTRATIONNUMBER && (
                          <div className="text-[10px] text-slate-500 font-mono">SN: {r.REGISTRATIONNUMBER}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {r.CATEGORY || 'GENERAL'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {r.QUANTITY} {r.UNIT || 'Units'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge text={r.CONDITION} />
                      </td>
                      <td className="py-3 px-4">
                        <Badge text={r.AVAILABILITYSTATUS} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700"
                        >
                          <Edit3 className="w-3 h-3 text-brand-400" />
                          <span>Update</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Vehicle ID</th>
                  <th className="py-3 px-4">Vehicle Model</th>
                  <th className="py-3 px-4">License Plate</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                      No vehicles registered.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((v) => (
                    <tr key={v.VEHICLEID} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                        #{v.VEHICLEID}
                      </td>
                      <td className="py-3 px-4 font-medium text-white">
                        {v.VEHICLENAME}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {v.REGISTRATIONNUMBER}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {v.VEHICLETYPE}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {v.CAPACITYPERSONS || 0} Pax / {v.CAPACITYKG || 0} kg
                      </td>
                      <td className="py-3 px-4">
                        <Badge text={v.STATUS} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Resource Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Update Resource #${editingResource?.RESOURCEID}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Resource Name
            </label>
            <input
              type="text"
              disabled
              value={editingResource?.RESOURCENAME || ''}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                required
                value={editForm.quantity}
                onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Availability Status
              </label>
              <select
                value={editForm.availabilityStatus}
                onChange={(e) => setEditForm({ ...editForm, availabilityStatus: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="ALLOCATED">ALLOCATED</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="DECOMMISSIONED">DECOMMISSIONED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Condition Assessment
            </label>
            <select
              value={editForm.condition}
              onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="EXCELLENT">EXCELLENT</option>
              <option value="GOOD">GOOD</option>
              <option value="FAIR">FAIR</option>
              <option value="NEEDS_MAINTENANCE">NEEDS MAINTENANCE</option>
              <option value="DAMAGED">DAMAGED</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20"
            >
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Register Resource Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register New Stockpile Asset"
      >
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Resource Name
            </label>
            <input
              type="text"
              required
              value={newForm.resourceName}
              onChange={(e) => setNewForm({ ...newForm, resourceName: e.target.value })}
              placeholder="e.g. Inflatable Rubber Boat, Water Purification Kit..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Category Type
              </label>
              <select
                value={newForm.resourceTypeId}
                onChange={(e) => setNewForm({ ...newForm, resourceTypeId: Number(e.target.value) })}
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
                Initial Stock
              </label>
              <input
                type="number"
                min="1"
                required
                value={newForm.quantity}
                onChange={(e) => setNewForm({ ...newForm, quantity: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Condition
              </label>
              <select
                value={newForm.condition}
                onChange={(e) => setNewForm({ ...newForm, condition: e.target.value })}
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
                Serial / Reg #
              </label>
              <input
                type="text"
                value={newForm.registrationNumber}
                onChange={(e) => setNewForm({ ...newForm, registrationNumber: e.target.value })}
                placeholder="Optional ID"
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
              disabled={actionLoading}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20"
            >
              {actionLoading ? 'Saving...' : 'Register Asset'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
