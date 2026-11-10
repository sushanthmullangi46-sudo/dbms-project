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
      const resList = (resRes && (resRes.resources || resRes.data)) || (Array.isArray(resRes) ? resRes : []);
      const vehList = (vehRes && (vehRes.vehicles || vehRes.data)) || (Array.isArray(vehRes) ? vehRes : []);
      const respList = (respRes && (respRes.responders || respRes.data)) || (Array.isArray(respRes) ? respRes : []);
      setResources(resList);
      setVehicles(vehList);
      setResponders(respList);
    }).catch(err => {
      console.error('Resource fetch error:', err);
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
                {(resources || []).length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-500">
                      No disaster relief resources found matching the specified filter criteria.
                    </td>
                  </tr>
                ) : (
                  (resources || []).map((r, i) => {
                    const rId = r.RESOURCEID ?? r.resource_id ?? r.id ?? (i + 1);
                    const rName = r.RESOURCENAME || r.resource_name || r.name || 'Emergency Supply Item';
                    const rReg = r.REGISTRATIONNUMBER || r.registration_number || `AST-2026-${String(rId).padStart(4, '0')}`;
                    const rCat = r.CATEGORY || r.category || 'SUPPLIES';
                    const rQty = r.QUANTITY ?? r.quantity ?? r.quantity_available ?? 0;
                    const rUnit = r.UNIT || r.unit || 'Units';
                    const rCond = r.CONDITION || r.condition || 'Operational';
                    const rStatus = r.AVAILABILITYSTATUS || r.status || (rQty > 0 ? 'AVAILABLE' : 'ALLOCATED');
                    const rProv = r.PROVIDERNAME || r.provider_name || 'Disaster Logistics Reserve';
                    const rLoc = r.LOCATIONNAME || r.location_name || 'Hebbal Central Reserve Depot';
                    return (
                      <tr key={rId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-brand-400">#{rId}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{rName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{rReg}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">{rCat}</td>
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          {rQty} <span className="text-[10px] text-slate-500 font-normal">{rUnit}</span>
                        </td>
                        <td className="py-3 px-4"><Badge text={rCond} /></td>
                        <td className="py-3 px-4"><Badge text={rStatus} /></td>
                        <td className="py-3 px-4 text-slate-200">{rProv}</td>
                        <td className="py-3 px-4 text-slate-400">{rLoc}</td>
                      </tr>
                    );
                  })
                )}
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
                {(vehicles || []).length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      No emergency response vehicles currently registered in active fleet.
                    </td>
                  </tr>
                ) : (
                  (vehicles || []).map((v, i) => {
                    const vId = v.VEHICLEID ?? v.id ?? (i + 1);
                    const vType = v.VEHICLETYPE || v.type || 'AMBULANCE';
                    const vPlate = v.REGISTRATIONNUMBER || v.plate || `KA-04-E-${1000 + i}`;
                    const vCap = v.CAPACITY ?? v.capacity ?? 8;
                    const vFuel = v.FUELLEVEL ?? v.fuel ?? 85;
                    const vStatus = v.STATUS || v.status || 'AVAILABLE';
                    const vProv = v.PROVIDERNAME || v.provider || 'State Emergency Medical Services';
                    return (
                      <tr key={vId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-brand-400">#{vId}</td>
                        <td className="py-3 px-4 font-semibold text-white">{vType}</td>
                        <td className="py-3 px-4 font-mono text-amber-400 font-bold">{vPlate}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{vCap} persons/tons</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full ${vFuel > 60 ? 'bg-emerald-500' : vFuel > 30 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${vFuel}%` }}
                              />
                            </div>
                            <span className="font-mono text-slate-300">{vFuel}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4"><Badge text={vStatus} /></td>
                        <td className="py-3 px-4 text-slate-200">{vProv}</td>
                      </tr>
                    );
                  })
                )}
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
                {(responders || []).length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      No tactical responder units currently mobilized.
                    </td>
                  </tr>
                ) : (
                  (responders || []).map((resp, i) => {
                    const respId = resp.RESPONDERID ?? resp.team_id ?? resp.id ?? (i + 1);
                    const teamName = resp.TEAMNAME || resp.team_name || 'Rescue Squad';
                    const spec = resp.SPECIALIZATION || resp.specialization || 'Search & Rescue';
                    const exp = resp.EXPERIENCELEVEL || resp.experience || 'Tier 1 Certified';
                    const lead = resp.LEADNAME || resp.leader_name || 'Command Officer';
                    const phone = resp.CONTACTPHONE || resp.contact_phone || '+91-9845012345';
                    const curStatus = resp.CURRENTSTATUS || resp.status || resp.readiness_status || 'READY';
                    const avail = resp.AVAILABILITYSTATUS || resp.readiness_status || 'AVAILABLE';
                    return (
                      <tr key={respId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-brand-400">#{respId}</td>
                        <td className="py-3 px-4 font-semibold text-emerald-400">{teamName}</td>
                        <td className="py-3 px-4 text-slate-200">{spec}</td>
                        <td className="py-3 font-mono font-bold text-slate-300">{exp}</td>
                        <td className="py-3 px-4">
                          <div className="text-white font-medium">{lead}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{phone}</div>
                        </td>
                        <td className="py-3 px-4"><Badge text={curStatus} /></td>
                        <td className="py-3 px-4"><Badge text={avail} /></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
