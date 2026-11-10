import React, { useState, useEffect } from 'react';
import { Compass, Box, CheckCircle2, AlertTriangle, Truck, Clock, Shield, Plus } from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import MissionStepper from '../../components/mission/MissionStepper';
import { useToast } from '../../context/ToastContext';

export default function MissionsPage() {
  const [missions, setMissions] = useState([]);
  const [resources, setResources] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Deploy Mission modal
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [deployForm, setDeployForm] = useState({
    incidentId: '',
    responderId: '',
    priority: 'P1'
  });

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
      if (res.success) setMissions(res.missions || []);
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
    // Load resources for allocation modal
    api.get('/resources?availabilityStatus=AVAILABLE').then((res) => {
      if (res.success && res.resources) {
        setResources(res.resources);
        if (res.resources.length > 0) {
          const firstId = res.resources[0].RESOURCEID || res.resources[0].resource_id;
          setAllocateForm(f => ({ ...f, resourceId: firstId }));
        }
      }
    });

    // Load active incidents for deployment modal
    api.get('/incidents?status=ACTIVE').then((res) => {
      if (res.success && res.incidents) {
        setIncidents(res.incidents);
        if (res.incidents.length > 0) {
          const firstIncId = res.incidents[0].INCIDENTID || res.incidents[0].disaster_id || res.incidents[0].id;
          setDeployForm(f => ({ ...f, incidentId: firstIncId }));
        }
      }
    });

    // Load available responders for deployment modal
    api.get('/resources/responders?availabilityStatus=AVAILABLE').then((res) => {
      if (res.success && res.responders) {
        setResponders(res.responders);
        if (res.responders.length > 0) {
          const firstRespId = res.responders[0].RESPONDERID || res.responders[0].team_id || res.responders[0].id;
          setDeployForm(f => ({ ...f, responderId: firstRespId }));
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
      const res = await api.post(`/missions/${selectedMission.MISSIONID || selectedMission.mission_id}/allocate`, {
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

  const handleDeployMission = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/missions', {
        incidentId: Number(deployForm.incidentId),
        responderId: Number(deployForm.responderId),
        priority: deployForm.priority
      });

      if (res.success) {
        success(`Mission #${res.missionId || res.mission_id} deployed. Tactical squad locked to operation.`);
        setIsDeployModalOpen(false);
        fetchMissions();
      }
    } catch (err) {
      error(err.message || 'Failed to deploy mission');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (timeVal) => {
    if (!timeVal) return 'Active Now';
    const d = new Date(timeVal);
    return isNaN(d.getTime()) ? 'Active Now' : d.toLocaleTimeString();
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

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDeployModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Deploy Mission</span>
          </button>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
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
          {missions.map((m) => {
            const mId = m.MISSIONID || m.mission_id || m.id;
            const incName = m.INCIDENTNAME || m.disaster_name || 'Emergency Incident';
            const teamName = m.TEAMNAME || m.team_name || 'Rescue Squad';
            const spec = m.SPECIALIZATION || m.specialization || 'Search & Rescue';
            const status = m.STATUS || m.status || 'ASSIGNED';
            const priority = m.PRIORITY || m.priority || 'HIGH';
            const vehicle = m.VEHICLETYPE || 'None (Foot Squad)';
            const targetLoc = m.TARGETLOCATION || m.location_name || 'Field Sector';

            return (
              <div
                key={mId}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 hover:border-slate-700 transition-all"
              >
                {/* Mission Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm font-bold text-brand-400">MISSION #{mId}</span>
                    <span className="text-slate-600">•</span>
                    <span className="font-semibold text-white text-sm">{incName}</span>
                    <Badge text={priority} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge text={status} />
                    {status !== 'COMPLETED' && status !== 'CANCELLED' && (
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
                <MissionStepper currentStatus={status} />

                {/* Mission Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold uppercase text-[10px] block">Assigned Team</span>
                    <span className="text-emerald-400 font-bold mt-0.5 block">{teamName}</span>
                    <span className="text-slate-400 text-[11px]">{spec}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-semibold uppercase text-[10px] block">Transport Vehicle</span>
                    <span className="text-slate-200 font-mono font-semibold mt-0.5 block">
                      {vehicle}
                    </span>
                    <span className="text-slate-400 text-[11px] font-mono">{m.VEHICLEREGISTRATION || 'N/A'}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-semibold uppercase text-[10px] block">Target Destination</span>
                    <span className="text-slate-200 font-medium mt-0.5 block">{targetLoc}</span>
                    <span className="text-slate-500 text-[11px] font-mono">Mission #{mId}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-semibold uppercase text-[10px] block">Operation Clock</span>
                    <div className="flex items-center space-x-1 text-slate-300 font-mono mt-0.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{formatTime(m.STARTTIME || m.assigned_at)}</span>
                    </div>
                    {m.ACTUALENDTIME && (
                      <span className="text-emerald-400 text-[10px] font-mono block">
                        Ended: {formatTime(m.ACTUALENDTIME)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 leading-relaxed italic">
                  "{m.REQUESTDESCRIPTION || m.description || `Tactical rescue and evacuation operations active for ${incName}.`}"
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Deploy New Mission */}
      <Modal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        title="Deploy Tactical Rescue Mission"
      >
        <form onSubmit={handleDeployMission} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Select Target Disaster Incident
            </label>
            <select
              required
              value={deployForm.incidentId}
              onChange={(e) => setDeployForm({ ...deployForm, incidentId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              {incidents.map((inc) => {
                const id = inc.INCIDENTID || inc.disaster_id || inc.id;
                const name = inc.INCIDENTNAME || inc.disaster_name || inc.name;
                const loc = inc.LOCATIONNAME || inc.location_name || 'Bangalore Sector';
                return (
                  <option key={id} value={id}>
                    #{id} - {name} ({loc})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Assign Tactical Rescue Squad
            </label>
            <select
              required
              value={deployForm.responderId}
              onChange={(e) => setDeployForm({ ...deployForm, responderId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              {responders.map((r) => {
                const id = r.RESPONDERID || r.team_id || r.id;
                const name = r.TEAMNAME || r.team_name;
                const spec = r.SPECIALIZATION || r.specialization || 'Rescue Squad';
                return (
                  <option key={id} value={id}>
                    {name} ({spec})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Operational Priority
            </label>
            <select
              value={deployForm.priority}
              onChange={(e) => setDeployForm({ ...deployForm, priority: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="P1">P1 - Critical (Life Safety Priority)</option>
              <option value="P2">P2 - High (Urgent Medical / Evac)</option>
              <option value="P3">P3 - Medium (Supply Provisioning)</option>
              <option value="P4">P4 - Low (Monitoring)</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsDeployModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20"
            >
              {submitting ? 'Deploying...' : 'Deploy Mission & Lock Squad'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Allocate Resource Modal */}
      <Modal
        isOpen={isAllocateModalOpen}
        onClose={() => setIsAllocateModalOpen(false)}
        title={`Allocate Asset to Mission #${selectedMission?.MISSIONID || selectedMission?.mission_id}`}
      >
        <form onSubmit={handleAllocateResource} className="space-y-4">
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs space-y-1">
            <span className="text-slate-400">Target Team:</span>{' '}
            <span className="text-emerald-400 font-bold">{selectedMission?.TEAMNAME || selectedMission?.team_name}</span>
            <div className="text-slate-500 text-[11px] mt-1">
              Allocates equipment/supplies from regional warehouse directly to this tactical mission.
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
              {resources.map((r) => {
                const rId = r.RESOURCEID || r.resource_id;
                const rName = r.RESOURCENAME || r.resource_name;
                const rCat = r.CATEGORY || r.category;
                const rQty = r.QUANTITY || r.quantity || 100;
                return (
                  <option key={rId} value={rId}>
                    {rName} ({rCat} • Available: {rQty})
                  </option>
                );
              })}
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
              {submitting ? 'Executing Allocation...' : 'Execute Allocation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
