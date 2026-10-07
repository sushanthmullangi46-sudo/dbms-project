import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('stock');
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

  const fetchInventory = async () => {
    try {
      let query = `?search=${encodeURIComponent(search)}`;
      if (statusFilter) query += `&stockStatus=${statusFilter}`;
      if (warehouseFilter) query += `&warehouseId=${warehouseFilter}`;

      const [invRes, txRes, whRes] = await Promise.all([
        api.get(`/inventory/stock${query}`),
        api.get('/inventory/transactions'),
        api.get('/inventory/warehouses')
      ]);

      if (invRes.success) setInventory(invRes.inventory);
      if (txRes.success) setTransactions(txRes.transactions);
      if (whRes.success) setWarehouses(whRes.warehouses);
    } catch (err) {
      console.error('Inventory error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [statusFilter, warehouseFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchInventory();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-400" />
            <span>Warehouse Inventory & Logistics Ledger</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time stock monitoring from Oracle View V_INVENTORY_STATUS with safety reorder thresholds
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'stock' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Stock Levels ({inventory.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'transactions' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Transaction History ({transactions.length})
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      {activeTab === 'stock' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-3">
          <form onSubmit={handleSearch} className="flex-1 w-full relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search resource item or warehouse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
          </form>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="">All Stock Statuses</option>
              <option value="CRITICAL">Critical Shortage (0 stock)</option>
              <option value="LOW">Low Stock (≤ Reorder)</option>
              <option value="NORMAL">Normal</option>
            </select>

            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.WAREHOUSEID} value={w.WAREHOUSEID}>{w.WAREHOUSENAME}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <Spinner text="Querying inventory ledger..." />
        ) : activeTab === 'stock' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase font-bold text-slate-400 bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Warehouse Depot</th>
                  <th className="py-3 px-4">Resource Nomenclature</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Available In Stock</th>
                  <th className="py-3 px-4">Reorder Threshold</th>
                  <th className="py-3 px-4">Health Badge</th>
                  <th className="py-3 px-4">Last Audited</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {inventory.map((inv) => (
                  <tr key={inv.INVENTORYID} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      {inv.WAREHOUSENAME}
                      <span className="block text-[10px] text-slate-500">{inv.WAREHOUSELOCATION}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200">{inv.RESOURCENAME}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{inv.CATEGORY}</td>
                    <td className="py-3 px-4 font-mono font-bold text-white text-sm">
                      {inv.QUANTITYAVAILABLE} <span className="text-[10px] text-slate-500 font-normal">{inv.UNIT}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{inv.REORDERLEVEL} {inv.UNIT}</td>
                    <td className="py-3 px-4"><Badge text={inv.STOCKSTATUS} /></td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {new Date(inv.LASTUPDATED).toLocaleString()}
                    </td>
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
                  <th className="py-3 px-4">Tx ID</th>
                  <th className="py-3 px-4">Ledger Type</th>
                  <th className="py-3 px-4">Warehouse</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Logged By</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((tx) => (
                  <tr key={tx.TRANSACTIONID} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand-400">#{tx.TRANSACTIONID}</td>
                    <td className="py-3 px-4"><Badge text={tx.TRANSACTIONTYPE} /></td>
                    <td className="py-3 px-4 text-slate-200">{tx.WAREHOUSENAME}</td>
                    <td className="py-3 px-4 font-semibold text-white">{tx.RESOURCENAME}</td>
                    <td className="py-3 px-4 font-mono font-bold text-white">{tx.QUANTITY} {tx.UNIT}</td>
                    <td className="py-3 px-4 text-slate-300">{tx.PERFORMEDBYNAME}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {new Date(tx.TRANSACTIONTIME).toLocaleString()}
                    </td>
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
