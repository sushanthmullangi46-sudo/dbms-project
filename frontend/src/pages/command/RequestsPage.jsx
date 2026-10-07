import React, { useState, useEffect } from 'react';
import { PhoneCall, Plus, Search, Filter, Compass, AlertTriangle, Users } from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';

const REQUEST_TYPES = [
  'RESCUE', 'MEDICAL', 'FOOD', 'WATER', 'SHELTER',
  'TRANSPORT', 'FIRE_RESPONSE', 'LOGISTICS', 'OTHER'
];

export default function RequestsPage() {
  const [requests, setRequests] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [responders, setResponders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // New Request Form
  const [requestForm, setRequestForm] = useState({
    incidentId: '',
    locationId: '',
    requestType: 'RESCUE',
    priority: 'CRITICAL',
    peopleAffected: 5,
    description: '',
    resourceTypeId: 1002,
    quantityRequired: 2
  });

  // Launch Mission Form
  const [missionForm, setMissionForm] = useState({
    responderId: '',
    vehicleId: '',
    priority: 'HIGH',
    expectedEndTime: ''
  });

  const { success, error } = useToast();

  const fetchRequests = async () => {
    try {
      let query = '?';
      if (priorityFilter) query += `priority=${priorityFilter}&`;
      if (statusFilter) query += `status=${statusFilter}&`;
      if (typeFilter) query += `requestType=${typeFilter}&`;

      const res = await api.get(`/requests${query}`);
      if (res.success) setRequests(res.requests);
    } catch (err) {
      error(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [priorityFilter, statusFilter, typeFilter]);

  useEffect(() => {
    // Load dropdown dependencies
    Promise.all([
      api.get('/incidents?status=ACTIVE'),
      api.get('/resources/responders?availabilityStatus=AVAILABLE'),
      api.get('/resources/vehicles?status=AVAILABLE')
    ]).then(([incRes, respRes, vehRes]) => {
      if (incRes.success) {
        setIncidents(incRes.incidents);
        if (incRes.incidents.length > 0 && !requestForm.incidentId) {
          setRequestForm(f => ({
            ...f,
            incidentId: incRes.incidents[0].INCIDENTID,
            locationId: incRes.incidents[0].LOCATIONID
          }));
        }
      }
      if (respRes.success) {
        setResponders(respRes.responders);
        if (respRes.responders.length > 0) {
          setMissionForm(m => ({ ...m, responderId: respRes.responders[0].RESPONDERID }));
        }
      }
      if (vehRes.success) {
        setVehicles(vehRes.vehicles);
        if (vehRes.vehicles.length > 0) {
          setMissionForm(m => ({ ...m, vehicleId: vehRes.vehicles[0].VEHICLEID }));
        }
      }
    });
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        incidentId: requestForm.incidentId,
        locationId: requestForm.locationId,
        requestType: requestForm.requestType,
        priority: requestForm.priority,
        peopleAffected: requestForm.peopleAffected,
        description: requestForm.description,
        items: [
          {
            resourceTypeId: requestForm.resourceTypeId,
            quantityRequired: requestForm.quantityRequired,
            unit: 'Units'
          }
        ]
      };

      const res = await api.post('/requests', payload);
      if (res.success) {
        success(`Emergency Request #${res.requestId} generated via Oracle CREATE_REQUEST.`);
        setIsCreateModalOpen(false);
        fetchRequests();
      }
    } catch (err) {
      error(err.message || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenMissionModal = (req) => {
    setSelectedRequest(req);
    setIsMissionModalOpen(true);
  };

  const handleLaunchMission = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setSubmitting(true);
    try {
      const res = await api.post('/missions', {
        requestId: selectedRequest.REQUESTID,
        responderId: missionForm.responderId,
        vehicleId: missionForm.vehicleId || null,
        priority: selectedRequest.PRIORITY,
        expectedEndTime: missionForm.expectedEndTime || null
      });

      if (res.success) {
        success(`Mission #${res.missionId} created. Assets locked to operation.`);
        setIsMissionModalOpen(false);
        fetchRequests();
      }
    } catch (err) {
      error(err.message || 'Failed to launch mission');
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
            <PhoneCall className="w-5 h-5 text-amber-500" />
            <span>Emergency Distress Requests</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time citizen calls, rescue demands, medical evac queues, and tactical mission deployment
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-lg shadow-amber-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Emergency Call</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
        >
          <option value="">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending Triage</option>
          <option value="APPROVED">Approved</option>
          <option value="ALLOCATED">Mission Dispatched</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
        >
          <option value="">All Categories</option>
          {REQUEST_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Requests Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <Spinner text="Querying requests from Oracle Database..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase font-bold text-slate-400 bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Req ID</th>
                  <th className="py-3 px-4">Incident</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Affected</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Time</th>
                  <th className="py-3 px-4 text-right">Dispatch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      No distress calls matching current filter criteria.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.REQUESTID} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-brand-400">#{r.REQUESTID}</td>
                      <td className="py-3 px-4 font-semibold text-white truncate max-w-[150px]">
                        {r.INCIDENTNAME}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{r.LOCATIONNAME}</td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{r.REQUESTTYPE}</td>
                      <td className="py-3 px-4"><Badge text={r.PRIORITY} /></td>
                      <td className="py-3 px-4 font-mono text-slate-200 font-semibold">{r.PEOPLEAFFECTED} souls</td>
                      <td className="py-3 px-4"><Badge text={r.STATUS} /></td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {new Date(r.CREATEDAT).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {r.STATUS === 'PENDING' || r.STATUS === 'APPROVED' ? (
                          <button
                            onClick={() => handleOpenMissionModal(r)}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-md shadow-brand-600/20"
                          >
                            <Compass className="w-3.5 h-3.5" />
                            <span>Launch Mission</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-slate-500">Mission Assigned</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Emergency Request */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Log Emergency Distress Call (Oracle CREATE_REQUEST Procedure)"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Associated Incident
            </label>
            <select
              value={requestForm.incidentId}
              onChange={(e) => {
                const inc = incidents.find(i => i.INCIDENTID === Number(e.target.value));
                setRequestForm({
                  ...requestForm,
                  incidentId: e.target.value,
                  locationId: inc ? inc.LOCATIONID : requestForm.locationId
                });
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              {incidents.map((i) => (
                <option key={i.INCIDENTID} value={i.INCIDENTID}>
                  #{i.INCIDENTID} - {i.INCIDENTNAME} ({i.LOCATIONNAME})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Distress Category
              </label>
              <select
                value={requestForm.requestType}
                onChange={(e) => setRequestForm({ ...requestForm, requestType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                {REQUEST_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Priority Tier
              </label>
              <select
                value={requestForm.priority}
                onChange={(e) => setRequestForm({ ...requestForm, priority: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="CRITICAL">Critical (Life Threat)</option>
                <option value="HIGH">High (Urgent)</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Estimated People In Jeopardy
            </label>
            <input
              type="number"
              min="1"
              required
              value={requestForm.peopleAffected}
              onChange={(e) => setRequestForm({ ...requestForm, peopleAffected: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Distress Situation Description
            </label>
            <textarea
              required
              rows={3}
              value={requestForm.description}
              onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
              placeholder="State caller identity, exact landmark, water level, medical symptoms..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20"
            >
              {submitting ? 'Registering...' : 'Submit Emergency Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Launch Mission */}
      <Modal
        isOpen={isMissionModalOpen}
        onClose={() => setIsMissionModalOpen(false)}
        title={`Deploy Mission for Request #${selectedRequest?.REQUESTID}`}
      >
        <form onSubmit={handleLaunchMission} className="space-y-4">
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs space-y-1">
            <div className="font-bold text-white">{selectedRequest?.INCIDENTNAME}</div>
            <p className="text-slate-400">{selectedRequest?.DESCRIPTION}</p>
            <div className="flex items-center gap-2 pt-1">
              <Badge text={selectedRequest?.REQUESTTYPE} />
              <Badge text={selectedRequest?.PRIORITY} />
              <span className="text-slate-300 font-mono font-bold">
                {selectedRequest?.PEOPLEAFFECTED} souls
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Assign Tactical Responder Team (Rule 1: No Concurrent Missions)
            </label>
            <select
              required
              value={missionForm.responderId}
              onChange={(e) => setMissionForm({ ...missionForm, responderId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              {responders.map((r) => (
                <option key={r.RESPONDERID} value={r.RESPONDERID}>
                  {r.TEAMNAME} ({r.SPECIALIZATION} • {r.EXPERIENCELEVEL})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Assign Dedicated Fleet Vehicle (Rule 2: No Concurrent Missions)
            </label>
            <select
              value={missionForm.vehicleId}
              onChange={(e) => setMissionForm({ ...missionForm, vehicleId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="">None (On Foot / Standalone)</option>
              {vehicles.map((v) => (
                <option key={v.VEHICLEID} value={v.VEHICLEID}>
                  {v.VEHICLETYPE} ({v.REGISTRATIONNUMBER} • Fuel: {v.FUELLEVEL}%)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsMissionModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20"
            >
              {submitting ? 'Executing CREATE_MISSION...' : 'Authorize & Dispatch'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
