import React, { useState, useEffect } from 'react';
import { Boxes, Truck, Users, Filter, CheckCircle2, ShieldAlert } from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState('resources');
  const [resources, setResources] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [availFilter, setAvailFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    let query = availFilter ? `?availabilityStatus=${availFilter}` : '';
    if (categoryFilter) query += (query ? '&' : '?') + `category=${categoryFilter}`;

    Promise.all([
      api.get(`/resources${query}`),
      api.get('/resources/vehicles'),
      api.get('/resources/responders')
    ]).then(([resRes, vehRes, respRes]) => {
      if (resRes.success) setResources(resRes.resources);
      if (vehRes.success) setVehicles(vehRes.vehicles);
      if (respRes.success) setResponders(respRes.responders);
    }).finally(() => setLoading(false));
  }, [availFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Boxes className="w-5 h-5 text-purple-400" />
            <span>Resource Catalog & Fleet Matrix</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Normalized inventory catalog across all registered NGOs, hospitals, and logistical providers
          </p>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'resources' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Supplies & Gear ({resources.length})
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'vehicles' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Vehicle Fleet ({vehicles.length})
          </button>
          <button
            onClick={() => setActiveTab('responders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'responders' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Responder Units ({responders.length})
          </button>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <Spinner text="Querying resource matrix..." />
        ) : activeTab === 'resources' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase font-bold text-slate-400 bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Asset ID</th>
                  <th className="py-3 px-4">Resource Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Available Qty</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Supplying Provider</th>
                  <th className="py-3 px-4">Current Staging Base</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {resources.map((r) => (
                  <tr key={r.RESOURCEID} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand-400">#{r.RESOURCEID}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{r.RESOURCENAME}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.REGISTRATIONNUMBER || 'Lot Item'}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{r.CATEGORY}</td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {r.QUANTITY} <span className="text-[10px] text-slate-500 font-normal">{r.UNIT}</span>
                    </td>
                    <td className="py-3 px-4"><Badge text={r.CONDITION} /></td>
                    <td className="py-3 px-4"><Badge text={r.AVAILABILITYSTATUS} /></td>
                    <td className="py-3 px-4 text-slate-200">{r.PROVIDERNAME}</td>
                    <td className="py-3 px-4 text-slate-400">{r.LOCATIONNAME || 'Regional Depot'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'vehicles' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase font-bold text-slate-400 bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Vehicle ID</th>
                  <th className="py-3 px-4">Vehicle Type</th>
                  <th className="py-3 px-4">License Plate</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Fuel Tank</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Provider Agency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {vehicles.map((v) => (
                  <tr key={v.VEHICLEID} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand-400">#{v.VEHICLEID}</td>
                    <td className="py-3 px-4 font-semibold text-white">{v.VEHICLETYPE}</td>
                    <td className="py-3 px-4 font-mono text-amber-400 font-bold">{v.REGISTRATIONNUMBER}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{v.CAPACITY} persons/tons</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${v.FUELLEVEL > 60 ? 'bg-emerald-500' : v.FUELLEVEL > 30 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${v.FUELLEVEL}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-300">{v.FUELLEVEL}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4"><Badge text={v.STATUS} /></td>
                    <td className="py-3 px-4 text-slate-200">{v.PROVIDERNAME}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase font-bold text-slate-400 bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Responder ID</th>
                  <th className="py-3 px-4">Squad Name</th>
                  <th className="py-3 px-4">Specialization</th>
                  <th className="py-3 px-4">Experience Tier</th>
                  <th className="py-3 px-4">Squad Lead</th>
                  <th className="py-3 px-4">Tactical Status</th>
                  <th className="py-3 px-4">Availability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {responders.map((resp) => (
                  <tr key={resp.RESPONDERID} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand-400">#{resp.RESPONDERID}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-400">{resp.TEAMNAME}</td>
                    <td className="py-3 px-4 text-slate-200">{resp.SPECIALIZATION}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-300">{resp.EXPERIENCELEVEL}</td>
                    <td className="py-3 px-4">
                      <div className="text-white font-medium">{resp.LEADNAME}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{resp.CONTACTPHONE}</div>
                    </td>
                    <td className="py-3 px-4"><Badge text={resp.CURRENTSTATUS} /></td>
                    <td className="py-3 px-4"><Badge text={resp.AVAILABILITYSTATUS} /></td>
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
