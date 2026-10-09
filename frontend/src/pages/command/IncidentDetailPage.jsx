import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Flame, 
  ArrowLeft, 
  MapPin, 
  Users, 
  Clock, 
  PhoneCall, 
  Compass, 
  FileText, 
  History,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';

export default function IncidentDetailPage() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('zones');
  const [updating, setUpdating] = useState(false);

  const { success, error } = useToast();

  const fetchIncidentDetail = async () => {
    try {
      const res = await api.get(`/incidents/${id}`);
      if (res.success) setIncident(res.incident);
    } catch (err) {
      error(err.message || 'Failed to fetch incident details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentDetail();
  }, [id]);

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const res = await api.put(`/incidents/${id}`, { status: newStatus });
      if (res.success) {
        success(`Incident #${id} transitioned to ${newStatus}. Trigger logged event.`);
        fetchIncidentDetail();
      }
    } catch (err) {
      error(err.message || 'Status update failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <Spinner size="lg" text={`Loading incident #${id} records...`} />;
  }

  if (!incident) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Incident not found.</p>
        <Link to="/officer/incidents" className="text-brand-400 underline text-xs mt-2 inline-block">
          Return to Incidents List
        </Link>
      </div>
    );
  }

  const {
    zones = [],
    requests = [],
    missions = [],
    fieldReports = [],
    auditLogs = []
  } = incident;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <Link
            to="/officer/incidents"
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs text-brand-400 font-bold">INCIDENT #{incident.INCIDENTID || incident.disaster_id || id}</span>
              <Badge text={incident.SEVERITY || incident.severity_level || 'CRITICAL'} />
              <Badge text={incident.STATUS || incident.status || 'ACTIVE'} />
            </div>
            <h2 className="text-xl font-black text-white mt-0.5">{incident.INCIDENTNAME || incident.disaster_name || 'Disaster Incident'}</h2>
          </div>
        </div>

        {/* Operational Status Control */}
        <div className="flex items-center space-x-2">
          {incident.STATUS === 'ACTIVE' && (
            <>
              <button
                onClick={() => handleUpdateStatus('ON_HOLD')}
                disabled={updating}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all"
              >
                Mark On-Hold
              </button>
              <button
                onClick={() => handleUpdateStatus('RESOLVED')}
                disabled={updating}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20"
              >
                Resolve Incident
              </button>
            </>
          )}
          {incident.STATUS === 'RESOLVED' && (
            <button
              onClick={() => handleUpdateStatus('CLOSED')}
              disabled={updating}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              Archive & Close
            </button>
          )}
        </div>
      </div>

      {/* Incident Summary Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">Type</span>
            <span className="text-slate-100 font-bold text-sm mt-0.5 block">{incident.INCIDENTTYPE}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">Primary Epicenter</span>
            <div className="flex items-center space-x-1 text-slate-100 font-medium mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{incident.LOCATIONNAME} ({incident.CITY})</span>
            </div>
          </div>
          <div>
            <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">Start Time</span>
            <div className="flex items-center space-x-1 text-slate-100 font-mono mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{new Date(incident.STARTTIME).toLocaleString()}</span>
            </div>
          </div>
          <div>
            <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">Commander In Charge</span>
            <span className="text-slate-100 font-medium mt-0.5 block">{incident.CREATEDBYNAME}</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px] mb-1">Incident Briefing</span>
          <p className="text-xs text-slate-300 leading-relaxed">{incident.DESCRIPTION}</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('zones')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'zones'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Affected Zones ({zones.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'requests'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Emergency Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('missions')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'missions'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Tactical Missions ({missions.length})
        </button>
        <button
          onClick={() => setActiveTab('fieldReports')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'fieldReports'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Field Reports ({fieldReports.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'audit'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Audit History ({auditLogs.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        {/* Tab 1: Affected Zones */}
        {activeTab === 'zones' && (
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Geographic Zones Impacted (Composite Key: INCIDENT_ZONES)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {zones.map((z) => (
                <div key={z.LOCATIONID} className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{z.LOCATIONNAME}</span>
                    <Badge text={z.SEVERITY} />
                  </div>
                  <div className="text-slate-400">
                    Population Affected: <span className="font-mono font-bold text-brand-400">{z.POPULATIONAFFECTED?.toLocaleString()}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] italic">{z.NOTES || 'No special hazards noted.'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Requests */}
        {activeTab === 'requests' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase font-bold text-slate-400 bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Req ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Affected Souls</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Caller</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {requests.map((r) => (
                  <tr key={r.REQUESTID} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-brand-400">#{r.REQUESTID}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{r.REQUESTTYPE}</td>
                    <td className="py-2.5 px-3"><Badge text={r.PRIORITY} /></td>
                    <td className="py-2.5 px-3 text-slate-300">{r.LOCATIONNAME}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{r.PEOPLEAFFECTED}</td>
                    <td className="py-2.5 px-3"><Badge text={r.STATUS} /></td>
                    <td className="py-2.5 px-3 text-slate-400">{r.REQUESTEDBYNAME}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Tactical Missions */}
        {activeTab === 'missions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase font-bold text-slate-400 bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Mission ID</th>
                  <th className="py-2.5 px-3">Team Assigned</th>
                  <th className="py-2.5 px-3">Vehicle Assigned</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Start Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {missions.map((m) => (
                  <tr key={m.MISSIONID} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-brand-400">#{m.MISSIONID}</td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-400">{m.TEAMNAME}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{m.VEHICLETYPE || 'On Foot / Standard'}</td>
                    <td className="py-2.5 px-3"><Badge text={m.PRIORITY} /></td>
                    <td className="py-2.5 px-3"><Badge text={m.STATUS} /></td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{new Date(m.STARTTIME).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Field Reports */}
        {activeTab === 'fieldReports' && (
          <div className="space-y-3">
            {fieldReports.map((fr) => (
              <div key={fr.REPORTID} className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-brand-400">REPORT #{fr.REPORTID}</span>
                    <span className="text-slate-400">• Team {fr.TEAMNAME}</span>
                    <Badge text={fr.REPORTTYPE} />
                  </div>
                  <Badge text={fr.SEVERITY} />
                </div>
                <p className="text-slate-300 leading-relaxed">{fr.DESCRIPTION}</p>
                <div className="text-[10px] text-slate-500 font-mono mt-2">
                  Submitted: {new Date(fr.CREATEDAT).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: Audit History */}
        {activeTab === 'audit' && (
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div key={log.LOGID} className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-950/40 text-xs flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-slate-400 mr-2">[{log.ACTIONTYPE}]</span>
                  <span className="text-slate-200">{log.DESCRIPTION}</span>
                  <span className="text-slate-500 ml-2">by {log.PERFORMEDBYNAME}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono shrink-0 ml-4">
                  {new Date(log.TIMESTAMP).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
