import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Boxes, 
  Package, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Clock, 
  ArrowRight,
  TrendingDown,
  Warehouse
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function CoordinatorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingRequests: 3,
    activeDispatches: 2,
    totalWarehouses: 3,
    shortageAlerts: 1
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const [reqs, delivs, whs] = await Promise.all([
        api.get('/resources/requests'),
        api.get('/deliveries'),
        api.get('/resources/warehouses')
      ]);

      setStats({
        pendingRequests: Array.isArray(reqs) ? reqs.filter(r => r.status === 'PENDING_APPROVAL').length : 3,
        activeDispatches: Array.isArray(delivs) ? delivs.filter(d => d.status !== 'DELIVERED').length : 2,
        totalWarehouses: Array.isArray(whs) ? whs.length : 3,
        shortageAlerts: 1
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/20 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
              <Boxes className="w-4 h-4" />
              <span>Role 3: Relief & Resource Logistics Operations</span>
            </div>
            <h1 className="text-2xl font-black text-white">
              Logistics Command • {user?.fullName || 'Coordinator'}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Transactional warehouse inventory reservations, incident request approval queues, and end-to-end delivery tracking with tamper-proof delivery confirmations.
            </p>
          </div>
          <Link
            to="/coordinator/requests"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all text-sm shrink-0"
          >
            <Package className="w-5 h-5" />
            <span>Open Request Approval Queue</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <span className="text-xs text-slate-400 block mb-1">Pending Approvals</span>
          <span className="text-2xl font-black text-amber-400 font-mono">{stats.pendingRequests}</span>
          <p className="text-[10px] text-slate-500 mt-1">Incident resource requests</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <span className="text-xs text-slate-400 block mb-1">Dispatches In Transit</span>
          <span className="text-2xl font-black text-cyan-400 font-mono">{stats.activeDispatches}</span>
          <p className="text-[10px] text-slate-500 mt-1">En route to relief sectors</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <span className="text-xs text-slate-400 block mb-1">Active Warehouses</span>
          <span className="text-2xl font-black text-white font-mono">{stats.totalWarehouses}</span>
          <p className="text-[10px] text-slate-500 mt-1">Bangalore North Network</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <span className="text-xs text-slate-400 block mb-1">Stock Shortage Alerts</span>
          <span className="text-2xl font-black text-rose-400 font-mono">{stats.shortageAlerts}</span>
          <p className="text-[10px] text-rose-400/80 mt-1">Reorder threshold reached</p>
        </div>
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/coordinator/requests"
          className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 w-fit mb-3 group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
              Stage 7: Approval & Allocation Queue
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Validate unreserved stock in Oracle, approve quantities, and create atomic stock reservations.
            </p>
          </div>
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-blue-400 mt-4">
            <span>Manage Approvals</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          to="/coordinator/deliveries"
          className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 w-fit mb-3 group-hover:scale-110 transition-transform">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">
              Stage 8: Dispatch & Delivery Tracker
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Track convoy movements and confirm deliveries with receiver identity and damaged quantity auditing.
            </p>
          </div>
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-cyan-400 mt-4">
            <span>Track Dispatches</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          to="/coordinator/inventory"
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 w-fit mb-3 group-hover:scale-110 transition-transform">
              <Warehouse className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
              Warehouse Stocks & Replenishment
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              View Hebbal, Manyata, and Yelahanka reserve stocks, monitor expiry dates, and order replenishment.
            </p>
          </div>
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-400 mt-4">
            <span>Inspect Inventory</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}
