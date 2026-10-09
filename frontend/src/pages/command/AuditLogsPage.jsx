import React, { useState, useEffect } from 'react';
import { FileText, Search, Clock, ShieldCheck } from 'lucide-react';
import api from '../../api/client';
import Spinner from '../../components/common/Spinner';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = () => {
    setLoading(true);
    api.get('/reports/audit-logs')
      .then((res) => {
        if (res.success) setLogs(res.logs);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((l) =>
    (l.DESCRIPTION || l.DETAILS || l.details || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.ACTIONTYPE || l.ACTION || l.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.INCIDENTNAME || l.TABLENAME || l.table_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-400" />
            <span>Immutable Incident Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tamper-evident record of all lifecycle events generated automatically by Oracle Triggers
          </p>
        </div>

        <div className="w-full sm:w-64 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action or incident..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <Spinner text="Querying audit ledger..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase font-bold text-slate-400 bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Log ID</th>
                  <th className="py-3 px-4">Action Token</th>
                  <th className="py-3 px-4">Incident Target</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Operator / Agent</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No audit events recorded.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((l) => (
                    <tr key={l.LOGID || l.log_id || Math.random()} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-brand-400">#{l.LOGID || l.log_id}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[11px]">
                          {l.ACTIONTYPE || l.ACTION || l.action || 'EVENT'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-sans font-medium">{l.INCIDENTNAME || l.TABLENAME || l.incident_code || 'System'}</td>
                      <td className="py-3 px-4 text-slate-200 font-sans">{l.DESCRIPTION || l.DETAILS || l.details || l.reason || 'Operation logged'}</td>
                      <td className="py-3 px-4 text-slate-400 font-sans">
                        {l.PERFORMEDBYNAME || l.USERNAME || l.username || 'System Administrator'}
                        {l.ROLENAME && <span className="text-[10px] text-brand-400 block font-mono">[{l.ROLENAME}]</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(l.TIMESTAMP || l.created_at || Date.now()).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
