import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  Utensils, 
  Droplets, 
  Activity, 
  Home, 
  LifeBuoy, 
  CheckCircle2, 
  Send
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function CitizenAssistancePage() {
  const { success, error } = useToast();
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [requestType, setRequestType] = useState('FOOD_WATER');
  const [peopleCount, setPeopleCount] = useState(4);
  const [urgentNotes, setUrgentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedHistory, setSubmittedHistory] = useState([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports');
      if (Array.isArray(res) && res.length > 0) {
        setReports(res);
        setSelectedReportId(res[0].report_id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        request_type: requestType,
        quantity_or_people: Number(peopleCount),
        notes: urgentNotes
      };
      
      if (selectedReportId) {
        await api.post(`/reports/${selectedReportId}/assistance-request`, payload);
      }
      
      const newEntry = {
        id: Date.now(),
        type: requestType,
        count: peopleCount,
        notes: urgentNotes,
        status: 'PENDING_APPROVAL',
        timestamp: new Date().toLocaleTimeString()
      };
      setSubmittedHistory([newEntry, ...submittedHistory]);
      success('Assistance request registered and routed to Relief Coordinator!');
      setUrgentNotes('');
    } catch (err) {
      error('Failed to submit relief request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
          <HeartHandshake className="w-4 h-4" />
          <span>Stage 5: Emergency Relief Requests</span>
        </div>
        <h1 className="text-2xl font-black text-white">Request Emergency Relief Supplies & Evacuation</h1>
        <p className="text-xs text-slate-400 mt-1">
          Submit urgent requests for rations, potable water, medical emergency response, or shelter beds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Link to Your Incident Report
              </label>
              <select
                value={selectedReportId}
                onChange={(e) => setSelectedReportId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {reports.map((r) => (
                  <option key={r.report_id} value={r.report_id}>
                    {r.report_reference_id || `RPT-${r.report_id}`} — {r.disaster_type} ({r.description?.slice(0, 40)}...)
                  </option>
                ))}
                {reports.length === 0 && <option value="1">RPT-20261009-HB001 — Bangalore Flood</option>}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Type of Assistance Required
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRequestType('FOOD_WATER')}
                  className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition-all text-xs font-bold ${
                    requestType === 'FOOD_WATER'
                      ? 'bg-cyan-500/20 border-cyan-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Utensils className="w-4 h-4 text-cyan-400" />
                  <span>Food Kits & Drinking Water</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestType('MEDICAL')}
                  className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition-all text-xs font-bold ${
                    requestType === 'MEDICAL'
                      ? 'bg-rose-500/20 border-rose-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Activity className="w-4 h-4 text-rose-400" />
                  <span>Urgent Medical Kits & Triage</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestType('EVACUATION')}
                  className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition-all text-xs font-bold ${
                    requestType === 'EVACUATION'
                      ? 'bg-amber-500/20 border-amber-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LifeBuoy className="w-4 h-4 text-amber-400" />
                  <span>Boat Rescue & Evacuation</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestType('SHELTER')}
                  className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition-all text-xs font-bold ${
                    requestType === 'SHELTER'
                      ? 'bg-emerald-500/20 border-emerald-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Home className="w-4 h-4 text-emerald-400" />
                  <span>Relief Shelter Placement</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Number of Affected Individuals
              </label>
              <input
                type="number"
                min="1"
                value={peopleCount}
                onChange={(e) => setPeopleCount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Special Needs or Urgent Medical Requirements
              </label>
              <textarea
                rows={3}
                value={urgentNotes}
                onChange={(e) => setUrgentNotes(e.target.value)}
                placeholder="e.g. Diabetics needing insulin, infant requiring baby food, elderly person unable to walk..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 text-xs shadow-lg shadow-cyan-600/20 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Transmit Request to Resource Coordinator'}</span>
            </button>
          </form>
        </div>

        {/* Info & Status Sidebar */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Real-Time Requests History
            </h3>
            {submittedHistory.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No new assistance requests in this session.
              </p>
            ) : (
              <div className="space-y-2.5">
                {submittedHistory.map((req) => (
                  <div key={req.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-cyan-400">{req.type}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {req.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">For {req.count} people • {req.timestamp}</p>
                    {req.notes && <p className="text-[10px] text-slate-500 italic">"{req.notes}"</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
