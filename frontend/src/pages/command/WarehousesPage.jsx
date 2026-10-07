import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Package, UserCheck } from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/inventory/warehouses')
      .then((res) => {
        if (res.success) setWarehouses(res.warehouses);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            <span>Disaster Distribution Warehouses</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Buffer inventory vaults, pallet capacity, and regional emergency management depots
          </p>
        </div>
      </div>

      {loading ? (
        <Spinner text="Querying disaster depots..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((w) => (
            <div
              key={w.WAREHOUSEID}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] text-brand-400 font-bold uppercase">DEPOT #{w.WAREHOUSEID}</span>
                  <h3 className="font-bold text-white text-base mt-0.5">{w.WAREHOUSENAME}</h3>
                  <div className="flex items-center space-x-1 text-slate-400 text-xs mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{w.LOCATIONNAME} ({w.CITY})</span>
                  </div>
                </div>
                <Badge text={w.STATUS} />
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Pallet Volumetric Capacity:</span>
                  <span className="font-mono font-bold text-white">{w.CAPACITY?.toLocaleString()} units</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Stocked Line Items:</span>
                  <span className="font-mono font-semibold text-brand-400">{w.STOCKITEMCOUNT} categories</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total Units Stored:</span>
                  <span className="font-mono font-semibold text-emerald-400">{w.TOTALUNITSSTOCKED?.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-300 pt-1 border-t border-slate-800/80">
                <UserCheck className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Depot Manager: <strong>{w.MANAGERNAME}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
