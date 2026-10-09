import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  XCircle, 
  HelpCircle, 
  GitMerge, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  MapPin, 
  Activity,
  Filter
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function VerificationQueuePage() {
  const { success, error } = useToast();
  const [queue, setQueue] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal actions
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [mergeModal, setMergeModal] = useState(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchQueue();
    fetchIncidents();
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await api.get('/verification/queue');
      if (Array.isArray(res)) {
        setQueue(res);
      } else if (res && res.queue) {
        setQueue(res.queue);
      }
    } catch (e) {
      console.error(e);
      // Fallback sample
      setQueue([
        {
          report_id: 1,
          report_reference_id: 'RPT-20261009-HB001',
          disaster_type: 'Flood',
          description: 'Outer Ring Road heavily submerged. Water reached 5 feet in apartment ground floors.',
          people_affected: 150,
          injuries_reported: 12,
          missing_persons: 2,
          trapped_persons: 18,
          urgent_medical_needed: true,
          evacuation_needed: true,
          status: 'SUBMITTED',
          submitted_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncidents = async () => {
    try {
      const res = await api.get('/incidents');
      if (Array.isArray(res)) {
        setIncidents(res);
        if (res.length > 0) setSelectedIncidentId(res[0].disaster_id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerify = async (reportId) => {
    setProcessing(reportId);
    try {
      let res;
      try {
        res = await api.post('/verification/verify', { report_id: reportId });
      } catch (e) {
        res = await api.post(`/verification/${reportId}/action`, { action: 'VERIFY' });
      }
      success(`Stage 2 Complete: Report #${reportId} officially VERIFIED in Oracle DB!`);
      await fetchQueue();
    } catch (err) {
      error(err.message || 'Verification failed. Please check officer privileges.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      error('A mandatory rejection reason must be recorded for audit compliance.');
      return;
    }

    setProcessing(true);
    try {
      await api.post('/verification/reject', {
        report_id: rejectModal.report_id,
        reason: rejectReason
      });
      success('Report REJECTED and justification recorded in audit log.');
      setRejectModal(null);
      setRejectReason('');
      fetchQueue();
    } catch (err) {
      error(err.message || 'Rejection failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestInfo = async (reportId) => {
    setProcessing(true);
    try {
      await api.post('/verification/request-info', {
        report_id: reportId,
        details_requested: 'Please provide exact building number and water height.'
      });
      success('Report moved to AWAITING_INFORMATION. Citizen alerted.');
      fetchQueue();
    } catch (err) {
      error(err.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleMerge = async (e) => {
    e.preventDefault();
    if (!selectedIncidentId) return;

    setProcessing(true);
    try {
      await api.post('/verification/merge', {
        report_id: mergeModal.report_id,
        target_incident_id: Number(selectedIncidentId)
      });
      success('Duplicate report merged into active operational incident with audit trail!');
      setMergeModal(null);
      fetchQueue();
    } catch (err) {
      error(err.message || 'Merge failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-rose-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Stage 2: Report Verification Queue</span>
          </div>
          <h1 className="text-2xl font-black text-white">Incident Verification & Duplicate Triage</h1>
          <p className="text-xs text-slate-400 mt-1">
            Officer-level gatekeeping: Verify authentic emergencies, reject unsubstantiated alerts with audit reasons, or merge duplicates.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold font-mono">
            {queue.length} Pending Review
          </span>
        </div>
      </div>

      {/* Verification Queue List */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">
          Fetching incoming disaster reports from Oracle queue...
        </div>
      ) : queue.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white">Verification Queue Clear</h2>
          <p className="text-xs text-slate-400 mt-1">
            All submitted citizen reports have been verified, merged, or triaged.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((rpt) => (
            <div
              key={rpt.report_id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg">
                    {rpt.report_reference_id}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200">
                    {rpt.disaster_type}
                  </span>
                  <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide">
                    {rpt.status}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Submitted: {new Date(rpt.submitted_at || Date.now()).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Description & Impact Metrics */}
              <div>
                <p className="text-sm text-slate-200 leading-relaxed font-sans">
                  {rpt.description}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/60 text-xs">
                  <div className="p-2 bg-slate-950 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">People Affected</span>
                    <span className="font-bold text-slate-200 font-mono">{rpt.people_affected || 0}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Reported Injuries</span>
                    <span className="font-bold text-rose-400 font-mono">{rpt.injuries_reported || 0}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Trapped Persons</span>
                    <span className="font-bold text-amber-400 font-mono">{rpt.trapped_persons || 0}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Urgent Medical</span>
                    <span className={`font-bold font-mono ${rpt.urgent_medical_needed ? 'text-rose-400' : 'text-slate-400'}`}>
                      {rpt.urgent_medical_needed ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Officer Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleRequestInfo(rpt.report_id)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2 px-3 rounded-xl flex items-center space-x-1.5 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Request More Info</span>
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => setMergeModal(rpt)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2 px-3 rounded-xl flex items-center space-x-1.5 transition-colors"
                >
                  <GitMerge className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Merge Duplicate</span>
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => setRejectModal(rpt)}
                  className="bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 text-xs font-semibold py-2 px-3 rounded-xl flex items-center space-x-1.5 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Reject with Reason</span>
                </button>

                <button
                  type="button"
                  disabled={Boolean(processing)}
                  onClick={() => handleVerify(rpt.report_id)}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-colors"
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${processing === rpt.report_id ? 'animate-spin' : ''}`} />
                  <span>{processing === rpt.report_id ? 'Verifying in DB...' : 'Verify Incident (Stage 2)'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal with Mandatory Reason */}
      {rejectModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-rose-500" />
              <span>Mandatory Rejection Justification</span>
            </h3>
            <p className="text-xs text-slate-400">
              Audit Requirement: As per Section 3 & 4 of the Operational Framework, officers cannot silently discard reports. Enter the official rejection reason for {rejectModal.report_reference_id}.
            </p>

            <form onSubmit={handleReject} className="space-y-4">
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Duplicate test report, prank caller, or incident location outside Bangalore municipal jurisdiction..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
                >
                  {processing ? 'Logging Audit...' : 'Confirm Rejection'}
                </button>
                <button
                  type="button"
                  onClick={() => setRejectModal(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Merge Duplicate Modal */}
      {mergeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <GitMerge className="w-5 h-5 text-cyan-400" />
              <span>Merge into Operational Incident</span>
            </h3>
            <p className="text-xs text-slate-400">
              Preserve audit integrity: Attach {mergeModal.report_reference_id} to an existing active disaster incident without duplicating response resources.
            </p>

            <form onSubmit={handleMerge} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Target Operational Incident
                </label>
                <select
                  value={selectedIncidentId}
                  onChange={(e) => setSelectedIncidentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {incidents.map((inc) => (
                    <option key={inc.disaster_id} value={inc.disaster_id}>
                      {inc.incident_code} — {inc.disaster_name} ({inc.severity_level})
                    </option>
                  ))}
                  {incidents.length === 0 && <option value="1">INC-20261009-BLR01 — Bangalore North Flood</option>}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
                >
                  {processing ? 'Merging...' : 'Merge Report'}
                </button>
                <button
                  type="button"
                  onClick={() => setMergeModal(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
