import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  MapPin, 
  Search, 
  ShieldCheck, 
  Award,
  ChevronRight,
  Filter
} from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/common/Badge';
import StatCard from '../../components/common/StatCard';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';

export default function ResponderHistory() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMission, setSelectedMission] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [missionDetail, setMissionDetail] = useState(null);
  const { error } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/responder/missions');
      if (res.success) {
        // All missions for this responder; we can examine completed and past missions
        setMissions(res.missions || []);
      }
    } catch (err) {
      error(err.message || 'Failed to fetch mission history');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (mission) => {
    setSelectedMission(mission);
    setDetailLoading(true);
    try {
      const res = await api.get(`/responder/missions/${mission.MISSIONID}`);
      if (res.success) {
        setMissionDetail(res.mission);
      }
    } catch (err) {
      error(err.message || 'Failed to load mission telemetry');
    } finally {
      setDetailLoading(false);
    }
  };

  const completedMissions = missions.filter((m) => m.STATUS === 'COMPLETED');
  const activeMissions = missions.filter((m) => m.STATUS !== 'COMPLETED' && m.STATUS !== 'CANCELLED');

  const filteredMissions = missions.filter((m) => {
    const matchesSearch = 
      m.INCIDENTNAME?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.TARGETLOCATION?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(m.MISSIONID).includes(searchTerm);
    return matchesSearch;
  });

  if (loading) {
    return <Spinner size="lg" text="Loading historical mission logs..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-400" />
            <span>Field Responder Mission History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational archive of dispatched operations, resolution logs, and tactical post-mortems
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Lifetime Missions"
          value={missions.length}
          icon={Award}
          color="blue"
          subtext="Assigned tactical runs"
        />
        <StatCard
          title="Operations Completed"
          value={completedMissions.length}
          icon={CheckCircle2}
          color="emerald"
          subtext={`${missions.length > 0 ? Math.round((completedMissions.length / missions.length) * 100) : 0}% success rate`}
        />
        <StatCard
          title="Active Engagements"
          value={activeMissions.length}
          icon={Clock}
          color="amber"
          subtext="Currently underway"
        />
        <StatCard
          title="Unit Status"
          value="Operational"
          icon={ShieldCheck}
          color="cyan"
          subtext="Oracle Telemetry Verified"
        />
      </div>

      {/* Controls & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by mission ID, incident, or sector..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span>Showing {filteredMissions.length} of {missions.length} operations</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Mission ID</th>
                <th className="py-3 px-4">Incident Name</th>
                <th className="py-3 px-4">Target Sector</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Dispatched At</th>
                <th className="py-3 px-4 text-right">Telemetry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                    No matching mission logs found.
                  </td>
                </tr>
              ) : (
                filteredMissions.map((m) => (
                  <tr key={m.MISSIONID} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand-400">
                      #{m.MISSIONID}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {m.INCIDENTNAME}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div className="flex items-center gap-1 truncate max-w-xs">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{m.TARGETLOCATION}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge text={m.PRIORITY} />
                    </td>
                    <td className="py-3 px-4">
                      <Badge text={m.STATUS} />
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {m.STARTTIME ? new Date(m.STARTTIME).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(m)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700"
                      >
                        <span>Telemetry</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mission Telemetry Modal */}
      <Modal
        isOpen={!!selectedMission}
        onClose={() => { setSelectedMission(null); setMissionDetail(null); }}
        title={`Mission Audit Archive: #${selectedMission?.MISSIONID}`}
      >
        {detailLoading ? (
          <Spinner text="Fetching Oracle operation records..." />
        ) : !missionDetail ? null : (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{missionDetail.INCIDENTNAME}</span>
                <Badge text={missionDetail.STATUS} />
              </div>
              <p className="text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>{missionDetail.TARGETLOCATION} ({missionDetail.TARGETADDRESS || 'General Sector'})</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Dispatched</span>
                <span className="text-slate-300 font-mono">
                  {missionDetail.STARTTIME ? new Date(missionDetail.STARTTIME).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Finished</span>
                <span className="text-slate-300 font-mono">
                  {missionDetail.ENDTIME ? new Date(missionDetail.ENDTIME).toLocaleString() : 'In Progress'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Tactical Unit</span>
                <span className="text-brand-400 font-semibold">{missionDetail.TEAMNAME}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Assigned Vehicle</span>
                <span className="text-slate-300 font-mono">{missionDetail.VEHICLENUMBER || 'Foot Unit / None'}</span>
              </div>
            </div>

            {/* Resources Allocated */}
            <div>
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-2">
                Deployed Resource Equipment
              </h4>
              {(!missionDetail.resources || missionDetail.resources.length === 0) ? (
                <p className="text-slate-500 italic">No equipment logged for this operation.</p>
              ) : (
                <div className="space-y-1.5">
                  {missionDetail.resources.map((r) => (
                    <div key={r.RESOURCEID} className="flex justify-between items-center p-2 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-white font-medium">{r.RESOURCENAME}</span>
                      <span className="text-emerald-400 font-mono font-bold">{r.QUANTITYALLOCATED} {r.UNIT}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Filed Field Reports */}
            <div>
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-2">
                Field Reports Transmitted ({missionDetail.fieldReports?.length || 0})
              </h4>
              {(!missionDetail.fieldReports || missionDetail.fieldReports.length === 0) ? (
                <p className="text-slate-500 italic">No field reports filed during this engagement.</p>
              ) : (
                <div className="space-y-2">
                  {missionDetail.fieldReports.map((fr) => (
                    <div key={fr.REPORTID} className="p-2.5 bg-slate-950 border border-slate-800 rounded space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-brand-400 font-bold">REPORT #{fr.REPORTID}</span>
                        <Badge text={fr.REPORTTYPE} />
                      </div>
                      <p className="text-slate-300">{fr.DESCRIPTION}</p>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {new Date(fr.CREATEDAT).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
