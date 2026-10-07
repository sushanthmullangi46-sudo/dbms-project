import React, { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';
import Spinner from '../../components/common/Spinner';

const REPORTS = [
  { id: 1, title: 'Active Incidents', subtitle: 'Disasters with risk score & mission telemetry' },
  { id: 2, title: 'Critical Emergency Requests', subtitle: 'Priority triage backlog' },
  { id: 3, title: 'Most Requested Resources', subtitle: 'Resource demand & fulfillment rates' },
  { id: 4, title: 'Resource Capacity & Utilization', subtitle: 'Available vs deployed equipment' },
  { id: 5, title: 'Responder Workload & Readiness', subtitle: 'Team assignment saturation' },
  { id: 6, title: 'Average Response Time', subtitle: 'Response latency by severity' },
  { id: 7, title: 'Inventory Deficit & Shortages', subtitle: 'Depot stock below safety thresholds' },
  { id: 8, title: 'Mission Completion Statistics', subtitle: 'Operational outcome distribution' },
  { id: 9, title: 'Incident Resolution Rates', subtitle: 'Resolution percentage by disaster type' },
  { id: 10, title: 'Resource Consumption Per Incident', subtitle: 'Aggregated equipment usage' },
];

export default function ReportsPage() {
  const [selectedReportId, setSelectedReportId] = useState(1);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = (id) => {
    setLoading(true);
    api.get(`/reports/${id}`)
      .then((res) => {
        if (res.success) setReportData(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport(selectedReportId);
  }, [selectedReportId]);

  const currentReport = REPORTS.find((r) => r.id === selectedReportId);

  // Generate table headers dynamically from data keys
  const headers = reportData.length > 0 ? Object.keys(reportData[0]) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-400" />
            <span>SQL-Backed Analytics & Reports Engine</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Complex Oracle analytical queries, window functions, and multi-table aggregations
          </p>
        </div>
        <button
          onClick={() => fetchReport(selectedReportId)}
          className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-brand-400" />
          <span>Re-run SQL Query</span>
        </button>
      </div>

      {/* Report Selector Pills */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {REPORTS.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedReportId(r.id)}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedReportId === r.id
                ? 'bg-brand-500/10 border-brand-500 text-white shadow-md shadow-brand-500/10'
                : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <span className="font-mono text-[10px] text-brand-400 font-bold block">REPORT #{r.id}</span>
            <span className="text-xs font-bold leading-tight line-clamp-1 block mt-0.5">{r.title}</span>
          </button>
        ))}
      </div>

      {/* Selected Report Title & Context */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-brand-400 uppercase">
              SQL REPORT {currentReport?.id}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-semibold text-slate-300">
              {reportData.length} records returned from Oracle Engine
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">{currentReport?.title}</h3>
          <p className="text-xs text-slate-400">{currentReport?.subtitle}</p>
        </div>

        {/* Dynamic Table */}
        {loading ? (
          <Spinner text="Executing SQL analytics query..." />
        ) : reportData.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Query returned 0 rows.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-950 border-b border-slate-800">
                <tr>
                  {headers.map((h) => (
                    <th key={h} className="py-2.5 px-3 whitespace-nowrap">
                      {h.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors font-mono">
                    {headers.map((h) => (
                      <td key={h} className="py-2.5 px-3 text-slate-200 whitespace-nowrap">
                        {row[h] !== null && row[h] !== undefined ? String(row[h]) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
