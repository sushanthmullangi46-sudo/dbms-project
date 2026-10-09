import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Flame, MapPin, Eye } from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';

const INCIDENT_TYPES = [
  'FLOOD', 'EARTHQUAKE', 'FIRE', 'CYCLONE',
  'INDUSTRIAL_ACCIDENT', 'ROAD_ACCIDENT',
  'BUILDING_COLLAPSE', 'CHEMICAL_EMERGENCY', 'OTHER'
];

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    incidentName: '',
    incidentType: 'FLOOD',
    severity: 'HIGH',
    locationId: '',
    description: ''
  });

  const { success, error } = useToast();

  const fetchIncidents = async () => {
    try {
      let query = `?search=${encodeURIComponent(search)}`;
      if (severityFilter) query += `&severity=${severityFilter}`;
      if (statusFilter) query += `&status=${statusFilter}`;

      const res = await api.get(`/incidents${query}`);
      if (res.success) setIncidents(res.incidents);
    } catch (err) {
      error(err.message || 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [severityFilter, statusFilter]);

  useEffect(() => {
    api.get('/map/markers').then((res) => {
      if (res.success && res.markers?.shelters) {
        // extract locations list
        api.get('/inventory/warehouses').then((wRes) => {
          if (wRes.success) {
            const locList = wRes.warehouses.map(w => ({
              id: w.LOCATIONID,
              name: `${w.LOCATIONNAME} (${w.CITY})`
            }));
            setLocations(locList);
            if (locList.length > 0 && !formData.locationId) {
              setFormData(f => ({ ...f, locationId: locList[0].id }));
            }
          }
        });
      }
    });
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchIncidents();
  };

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/incidents', formData);
      if (res.success) {
        success(`Disaster incident #${res.incidentId} initiated.`);
        setIsModalOpen(false);
        setFormData({
          incidentName: '',
          incidentType: 'FLOOD',
          severity: 'HIGH',
          locationId: locations[0]?.id || '',
          description: ''
        });
        fetchIncidents();
      }
    } catch (err) {
      error(err.message || 'Failed to register incident');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            <span>Incident Command & Triage</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Active disaster events, epicenters, affected population zones, and life-safety operations
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-lg shadow-rose-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Declare Incident</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search incident title, location, type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Severities</option>
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
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Incidents Data Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <Spinner text="Querying incident records..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase font-bold text-slate-400 bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Incident Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Epicenter Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Requests</th>
                  <th className="py-3 px-4">Missions</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      No disaster incidents match the search criteria.
                    </td>
                  </tr>
                ) : (
                  incidents.map((inc) => {
                    const incId = inc.INCIDENTID || inc.disaster_id || inc.id;
                    const incName = inc.INCIDENTNAME || inc.disaster_name || inc.name;
                    const incType = inc.INCIDENTTYPE || inc.disaster_type || inc.type;
                    const incSev = inc.SEVERITY || inc.severity_level || inc.severity;
                    const incLoc = inc.LOCATIONNAME || inc.location_name || inc.location?.location_name || 'Bangalore Sector';
                    const incStatus = inc.STATUS || inc.status;
                    return (
                      <tr key={incId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-brand-400">#{incId}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{incName}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{inc.DESCRIPTION || inc.description}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">{incType}</td>
                        <td className="py-3 px-4"><Badge text={incSev} /></td>
                        <td className="py-3 px-4 text-slate-300">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{incLoc}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4"><Badge text={incStatus} /></td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-200">{inc.REQUESTCOUNT || inc.requests?.length || 0}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-200">{inc.MISSIONCOUNT || inc.missions?.length || 0}</td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/officer/incidents/${incId}`}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-brand-600 text-slate-200 hover:text-white transition-all border border-slate-700"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Detail</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Declare Incident Modal Dialog */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Declare New Disaster Incident (Oracle CREATE_INCIDENT Procedure)"
      >
        <form onSubmit={handleCreateIncident} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Incident Nomenclature / Title
            </label>
            <input
              type="text"
              required
              value={formData.incidentName}
              onChange={(e) => setFormData({ ...formData, incidentName: e.target.value })}
              placeholder="e.g. Hebbal Cascade Flash Flood Surge"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Disaster Type
              </label>
              <select
                value={formData.incidentType}
                onChange={(e) => setFormData({ ...formData, incidentType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                {INCIDENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Severity Level
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="CRITICAL">Critical (Immediate Evacuation)</option>
                <option value="HIGH">High (Urgent Deployment)</option>
                <option value="MEDIUM">Medium (Local Containment)</option>
                <option value="LOW">Low (Monitoring)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Primary Epicenter Location
            </label>
            <select
              required
              value={formData.locationId}
              onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Tactical Description & Assessment
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="State initial casualties, structural vulnerabilities, and immediate resource needs..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-lg shadow-rose-600/20"
            >
              {submitting ? 'Executing Stored Procedure...' : 'Initialize Incident'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
