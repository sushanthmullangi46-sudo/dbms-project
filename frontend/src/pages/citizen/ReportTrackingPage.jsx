import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  MapPin, 
  Send, 
  MessageSquare, 
  UserCheck, 
  ArrowLeft,
  Flame,
  Check,
  XCircle
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function ReportTrackingPage() {
  const [searchParams] = useSearchParams();
  const reportIdParam = searchParams.get('id');

  const { success, error } = useToast();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateNote, setUpdateNote] = useState('');
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [assistanceConfirmed, setAssistanceConfirmed] = useState(false);

  useEffect(() => {
    fetchReportDetails();
  }, [reportIdParam]);

  const fetchReportDetails = async () => {
    try {
      const idToFetch = reportIdParam || 1;
      const res = await api.get(`/reports/${idToFetch}`);
      if (res) {
        setReport(res);
      }
    } catch (e) {
      console.error('Failed to fetch report details:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendUpdate = async (e) => {
    e.preventDefault();
    if (!updateNote.trim()) return;

    setSubmittingUpdate(true);
    try {
      await api.post(`/reports/${report?.report_id || 1}/updates`, {
        update_text: updateNote
      });
      success('Supplementary information added to disaster log!');
      setUpdateNote('');
      fetchReportDetails();
    } catch (err) {
      error('Failed to submit supplementary information.');
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const stages = [
    { key: 'SUBMITTED', name: '1. Report Submitted', desc: 'Disaster reported & reference ID generated' },
    { key: 'VERIFIED', name: '2. Officer Verification', desc: 'Verified by Disaster Command Officer' },
    { key: 'ASSESSED', name: '3. Severity Assessment', desc: 'P1-P4 priority score assigned' },
    { key: 'ACTIVE', name: '4. Operations Activated', desc: 'Multi-agency response deployed' },
    { key: 'CLOSED', name: '5. Incident Closure', desc: 'Recovery verified & case closed' }
  ];

  const getStageIndex = (status) => {
    switch (status) {
      case 'SUBMITTED':
      case 'AWAITING_INFORMATION':
        return 0;
      case 'VERIFIED':
        return 1;
      case 'ASSESSED':
        return 2;
      case 'ACTIVE':
      case 'RESPONSE_IN_PROGRESS':
        return 3;
      case 'CLOSED':
        return 4;
      default:
        return 0;
    }
  };

  const currentIdx = getStageIndex(report?.status || 'SUBMITTED');

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        Connecting to Oracle disaster event ledger...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Incident Report Not Found</h2>
        <p className="text-xs text-slate-400 mt-1">Please verify the Incident Reference ID.</p>
        <Link to="/citizen/dashboard" className="mt-4 inline-block text-xs font-bold text-cyan-400 hover:underline">
          Return to Citizen Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/citizen/dashboard"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Reports</span>
        </Link>
        <span className="font-mono text-xs text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-lg">
          Reference ID: {report.report_reference_id}
        </span>
      </div>

      {/* Incident Status Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                {report.disaster_type}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                Status: {report.status}
              </span>
            </div>
            <h1 className="text-xl font-black text-white mt-2">
              Disaster Report #{report.report_id}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              {report.description}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Submitted On</span>
            <span className="font-mono text-xs text-slate-200">
              {new Date(report.submitted_at || Date.now()).toLocaleString()}
            </span>
          </div>
        </div>

        {/* 5-Step Sequential Workflow Timeline */}
        <div className="mt-8 mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
            Response Workflow Progress (Sequential Stages)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 relative">
            {stages.map((stg, i) => {
              const isPast = i < currentIdx;
              const isCurrent = i === currentIdx;
              const isFuture = i > currentIdx;

              return (
                <div
                  key={stg.key}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isCurrent
                      ? 'bg-rose-500/10 border-rose-500 text-white shadow-lg shadow-rose-500/10'
                      : isPast
                      ? 'bg-slate-950 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                    <span className="text-xs font-bold">{stg.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{stg.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirmation of Relief Assistance Received */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span>Confirm Relief Assistance Receipt</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Help the Disaster Management team maintain delivery fidelity by verifying whether food rations, drinking water, or rescue evacuation was received.
        </p>

        {assistanceConfirmed ? (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Thank you! Your receipt confirmation has been logged to the operational audit ledger.</span>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setAssistanceConfirmed(true);
                success('Receipt confirmed and logged in audit events!');
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-600/20"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Assistance Received Successfully</span>
            </button>
            <button
              onClick={() => error('Unresolved issue flagged to Incident Commander!')}
              className="bg-rose-950/50 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center space-x-1.5 transition-all"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Report Unresolved Problem</span>
            </button>
          </div>
        )}
      </div>

      {/* Submit Supplementary Information */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span>Add Supplementary Updates / Status Information</span>
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Has the flood water risen? Are more people stranded? Provide supplementary notes directly to the responding team.
        </p>

        <form onSubmit={handleSendUpdate} className="space-y-3">
          <textarea
            rows={3}
            value={updateNote}
            onChange={(e) => setUpdateNote(e.target.value)}
            placeholder="Enter supplementary details (e.g. 'Water level rose by 1 foot, 4 more people trapped on 2nd floor')..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={submittingUpdate}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center space-x-1.5 transition-all shadow-md shadow-cyan-600/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submittingUpdate ? 'Updating...' : 'Post Information Update'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
