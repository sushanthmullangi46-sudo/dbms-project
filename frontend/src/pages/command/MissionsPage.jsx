import React, { useState, useEffect } from 'react';
import { Compass, Box, CheckCircle2, AlertTriangle, Truck, Clock, Shield } from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import MissionStepper from '../../components/mission/MissionStepper';
import { useToast } from '../../context/ToastContext';

export default function MissionsPage() {
  const [missions, setMissions] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Allocation modal
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);
  const [allocateForm, setAllocateForm] = useState({
    resourceId: '',
    quantity: 1
  });
  const [submitting, setSubmitting] = useState(false);

  const { success, error } = useToast();

  const fetchMissions = async () => {
    try {
      let query = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/missions${query}`);
      if (res.success) setMissions(res.missions);
    } catch (err) {
      error(err.message || 'Failed to load missions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, [statusFilter]);

  useEffect(() => {
    api.get('/resources?availabilityStatus=AVAILABLE').then((res) => {
      if (res.success) {
        setResources(res.resources);
        if (res.resources.length > 0) {
          setAllocateForm(f => ({ ...f, resourceId: res.resources[0].RESOURCEID }));
        }
      }
    });
  }, []);

  const handleOpenAllocate = (m) => {
    setSelectedMission(m);
    setIsAllocateModalOpen(true);
  };

  const handleAllocateResource = async (e) => {
    e.preventDefault();
    if (!selectedMission) return;

    setSubmitting(true);
    try {
      const res = await api.post(`/missions/${selectedMission.MISSIONID}/allocate`, {
        resourceId: allocateForm.resourceId,
        quantity: allocateForm.quantity
      });

      if (res.success) {
        success('Resource locked & allocated via Oracle ALLOCATE_RESOURCE.');
        setIsAllocateModalOpen(false);
        fetchMissions();
      }
    } catch (err) {
      error(err.message || 'Allocation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Compass className="w-5 h-5 text-brand-500" />
            <span>Tactical Mission Operations</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time responder deployments, lifecycle transitions, and transaction-safe asset provisioning
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500 self-start sm:self-auto"
        >
          <option value="">All Mission Statuses</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="EN_ROUTE">En Route</option>
          <option value="ARRIVED">Arrived</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Missions Grid */}
      {loading ? (
        <Spinner text="Querying active missions..." />
      ) : missions.length === 0 ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
          No tactical missions found matching status.
        </div>
      ) : (
        <div className="space-y-4">
          {missions.map((m) => (
            <div
              key={m.MISSIONID}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 hover:border-slate-700 transition-all"
            >
              {/* Mission Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-sm font-bold text-brand-400">MISSION #{m.MISSIONID}</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-semibold text-white text-sm">{m.INCIDENTNAME}</span>
                  <Badge text={m.PRIORITY} />
                </div>
                <div className="flex items-center space-x-2">
                  <Badge text={m.STATUS} />
                  {m.STATUS !== 'COMPLETED' && m.STATUS !== 'CANCELLED' && (
                    <button
                      onClick={() => handleOpenAllocate(m)}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-brand-600 text-slate-200 hover:text-white border border-slate-700 transition-all"
                    >
                      <Box className="w-3.5 h-3.5 text-brand-400" />
                      <span>Allocate Asset</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Lifecycle Visual Stepper */}
              <MissionStepper currentStatus={m.STATUS} />

              {/* Mission Metadata Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold uppercase text-[10px] block">Assigned Team</span>
                  <span className="text-emerald-400 font-bold mt-0.5 block">{m.TEAMNAME}</span>
                  <span className="text-slate-400 text-[11px]">{m.SPECIALIZATION}</span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold uppercase text-[10px] block">Transport Vehicle</span>
                  <span className="text-slate-200 font-mono font-semibold mt-0.5 block">
                    {m.VEHICLETYPE || 'None (Foot Squad)'}
                  </span>
                  <span className="text-slate-400 text-[11px] font-mono">{m.VEHICLEREGISTRATION || 'N/A'}</span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold uppercase text-[10px] block">Target Destination</span>
                  <span className="text-slate-200 font-medium mt-0.5 block">{m.TARGETLOCATION}</span>
                  <span className="text-slate-500 text-[11px] font-mono">Req #{m.REQUESTID}</span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold uppercase text-[10px] block">Operation Clock</span>
                  <div className="flex items-center space-x-1 text-slate-300 font-mono mt-0.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{new Date(m.STARTTIME).toLocaleTimeString()}</span>
                  </div>
                  {m.ACTUALENDTIME && (
                    <span className="text-emerald-400 text-[10px] font-mono block">
                      Ended: {new Date(m.ACTUALENDTIME).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed italic">
                "{m.REQUESTDESCRIPTION}"
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Allocate Resource Modal */}
      <Modal
        isOpen={isAllocateModalOpen}
        onClose={() => setIsAllocateModalOpen(false)}
        title={`Allocate Asset to Mission #${selectedMission?.MISSIONID}`}
      >
        <form onSubmit={handleAllocateResource} className="space-y-4">
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs space-y-1">
            <span className="text-slate-400">Target Team:</span>{' '}
            <span className="text-emerald-400 font-bold">{selectedMission?.TEAMNAME}</span>
            <div className="text-slate-500 text-[11px] mt-1">
              Oracle Stored Procedure ALLOCATE_RESOURCE executes row-level lock (SELECT ... FOR UPDATE) and updates inventory ledger.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Select Available Resource
            </label>
            <select
              value={allocateForm.resourceId}
              onChange={(e) => setAllocateForm({ ...allocateForm, resourceId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              {resources.map((r) => (
                <option key={r.RESOURCEID} value={r.RESOURCEID}>
                  {r.RESOURCENAME} ({r.CATEGORY} • Available: {r.QUANTITY} • Provider: {r.PROVIDERNAME})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Units to Allocate
            </label>
            <input
              type="number"
              min="1"
              required
              value={allocateForm.quantity}
              onChange={(e) => setAllocateForm({ ...allocateForm, quantity: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAllocateModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20"
            >
              {submitting ? 'Executing ALLOCATE_RESOURCE...' : 'Execute Allocation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
