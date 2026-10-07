import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  MapPin, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  ArrowRight,
  Shield,
  Plus
} from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import MissionStepper from '../../components/mission/MissionStepper';
import { useToast } from '../../context/ToastContext';

const REPORT_TYPES = [
  'ROAD_BLOCKED', 'ADDITIONAL_RESOURCE', 'INJURY',
  'DAMAGE', 'WEATHER', 'SAFETY_RISK', 'MISSION_UPDATE', 'OTHER'
];

export default function ResponderMissions() {
  const [missions, setMissions] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [missionDetail, setMissionDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Field Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportForm, setReportForm] = useState({
    reportType: 'MISSION_UPDATE',
    severity: 'MEDIUM',
    description: ''
  });

  const { success, error } = useToast();

  const fetchMissions = async () => {
    try {
      const res = await api.get('/responder/missions');
      if (res.success) {
        setMissions(res.missions);
        if (res.missions.length > 0 && !selectedMission) {
          handleSelectMission(res.missions[0]);
        }
      }
    } catch (err) {
      error(err.message || 'Failed to fetch responder missions');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMission = async (m) => {
    setSelectedMission(m);
    setDetailLoading(true);
    try {
      const res = await api.get(`/responder/missions/${m.MISSIONID}`);
      if (res.success) {
        setMissionDetail(res.mission);
      }
    } catch (err) {
      error(err.message || 'Failed to load mission detail');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  const handleTransition = async (newStatus) => {
    if (!selectedMission) return;
    setActionLoading(true);
    try {
      let res;
      if (newStatus === 'COMPLETED') {
        res = await api.post(`/responder/missions/${selectedMission.MISSIONID}/complete`, {
          notes: 'Tactical operation completed successfully by responder unit.'
        });
      } else {
        res = await api.put(`/responder/missions/${selectedMission.MISSIONID}/status`, {
          status: newStatus,
          notes: `Responder transitioned state to ${newStatus}`
        });
      }

      if (res.success) {
        success(`Status successfully advanced to ${newStatus}.`);
        fetchMissions();
        handleSelectMission(selectedMission);
      }
    } catch (err) {
      error(err.message || 'Transition error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitFieldReport = async (e) => {
    e.preventDefault();
    if (!selectedMission || !missionDetail) return;

    setActionLoading(true);
    try {
      const res = await api.post(`/responder/missions/${selectedMission.MISSIONID}/report`, {
        reportType: reportForm.reportType,
        severity: reportForm.severity,
        description: reportForm.description,
        locationId: missionDetail.TARGETLOCATIONID || 1001
      });

      if (res.success) {
        success('Field report recorded in database.');
        setIsReportModalOpen(false);
        setReportForm({ reportType: 'MISSION_UPDATE', severity: 'MEDIUM', description: '' });
        handleSelectMission(selectedMission);
      }
    } catch (err) {
      error(err.message || 'Report submission failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <Spinner size="lg" text="Loading responder mission records..." />;
  }

  const currentStatus = missionDetail?.STATUS || selectedMission?.STATUS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            <span>Assigned Tactical Missions</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Execute mission steps, log field observations, and synchronize tactical lifecycle state
          </p>
        </div>
      </div>

      {missions.length === 0 ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
          No missions currently assigned to your team.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Mission Selector */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Assigned Queue ({missions.length})
            </h3>
            <div className="space-y-2">
              {missions.map((m) => {
                const isSelected = selectedMission?.MISSIONID === m.MISSIONID;
                return (
                  <div
                    key={m.MISSIONID}
                    onClick={() => handleSelectMission(m)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-brand-500 shadow-md shadow-brand-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-brand-400">MISSION #{m.MISSIONID}</span>
                      <Badge text={m.STATUS} />
                    </div>
                    <h4 className="font-semibold text-white text-xs truncate">{m.INCIDENTNAME}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{m.TARGETLOCATION}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Mission Detail & Actions */}
          <div className="lg:col-span-2">
            {detailLoading ? (
              <Spinner text="Loading mission telemetry..." />
            ) : !missionDetail ? null : (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-bold text-brand-400">MISSION #{missionDetail.MISSIONID}</span>
                      <Badge text={missionDetail.PRIORITY} />
                      <Badge text={missionDetail.STATUS} />
                    </div>
                    <h3 className="text-lg font-black text-white mt-1">{missionDetail.INCIDENTNAME}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span>{missionDetail.TARGETLOCATION} ({missionDetail.TARGETADDRESS || 'Field Sector'})</span>
                    </p>
                  </div>

                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 self-start sm:self-auto"
                  >
                    <FileText className="w-3.5 h-3.5 text-brand-400" />
                    <span>Submit Field Report</span>
                  </button>
                </div>

                {/* Visual Lifecycle Stepper */}
                <MissionStepper currentStatus={currentStatus} />

                {/* State Machine Transition Controls */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Tactical Execution Controls
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Current State: <strong className="text-white">{currentStatus}</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {currentStatus === 'ASSIGNED' && (
                      <button
                        onClick={() => handleTransition('ACCEPTED')}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-lg text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20"
                      >
                        Accept Mission
                      </button>
                    )}

                    {currentStatus === 'ACCEPTED' && (
                      <button
                        onClick={() => handleTransition('EN_ROUTE')}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 flex items-center gap-1.5"
                      >
                        <span>Mark En Route (Mobilizing)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {currentStatus === 'EN_ROUTE' && (
                      <button
                        onClick={() => handleTransition('ARRIVED')}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 flex items-center gap-1.5"
                      >
                        <span>Mark Arrived On Site</span>
                        <MapPin className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {currentStatus === 'ARRIVED' && (
                      <button
                        onClick={() => handleTransition('IN_PROGRESS')}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 flex items-center gap-1.5"
                      >
                        <span>Commence Rescue / Operation</span>
                        <Radio className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {currentStatus === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleTransition('COMPLETED')}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete Mission (Free Assets)</span>
                      </button>
                    )}

                    {currentStatus === 'COMPLETED' && (
                      <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Operation Completed. Assets and team released into reserve pool.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Allocated Resources Breakdown */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                    Allocated Tactical Gear & Resources
                  </h4>
                  {missionDetail.resources?.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No external equipment allocated to this squad.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {missionDetail.resources.map((r) => (
                        <div key={r.RESOURCEID} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs">
                          <div className="font-semibold text-white">{r.RESOURCENAME}</div>
                          <div className="flex justify-between text-slate-400 mt-1">
                            <span>Category: {r.CATEGORY}</span>
                            <span className="font-mono text-emerald-400 font-bold">
                              {r.QUANTITYALLOCATED} {r.UNIT}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Field Reports Filed */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                    Field Situation Reports Filed ({missionDetail.fieldReports?.length || 0})
                  </h4>
                  {missionDetail.fieldReports?.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No reports filed yet for this operation.</p>
                  ) : (
                    <div className="space-y-2">
                      {missionDetail.fieldReports.map((fr) => (
                        <div key={fr.REPORTID} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono font-bold text-brand-400">REPORT #{fr.REPORTID}</span>
                            <Badge text={fr.REPORTTYPE} />
                          </div>
                          <p className="text-slate-300">{fr.DESCRIPTION}</p>
                          <span className="text-[10px] text-slate-500 font-mono block mt-1">
                            {new Date(fr.CREATEDAT).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit Field Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Submit Tactical Field Report"
      >
        <form onSubmit={handleSubmitFieldReport} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Report Type
              </label>
              <select
                value={reportForm.reportType}
                onChange={(e) => setReportForm({ ...reportForm, reportType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Threat Severity
              </label>
              <select
                value={reportForm.severity}
                onChange={(e) => setReportForm({ ...reportForm, severity: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="CRITICAL">Critical Hazard</option>
                <option value="HIGH">High Severity</option>
                <option value="MEDIUM">Medium Condition</option>
                <option value="LOW">Low / Informational</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Field Observations & Situational Report
            </label>
            <textarea
              required
              rows={4}
              value={reportForm.description}
              onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
              placeholder="Detail blocked access roads, secondary collapses, required reinforcements, or weather impacts..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20"
            >
              {actionLoading ? 'Logging Report...' : 'Transmit Report'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
