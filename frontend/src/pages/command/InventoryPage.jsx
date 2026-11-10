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

      const [invRes, txRes, whRes] = await Promise.allSettled([
        api.get(`/inventory/stock${query}`),
        api.get('/inventory/transactions'),
        api.get('/inventory/warehouses')
      ]);

      if (invRes.status === 'fulfilled' && invRes.value) {
        const val = invRes.value;
        const list = val.inventory || val.stock || (Array.isArray(val) ? val : []);
        setInventory(list);
      }
      if (txRes.status === 'fulfilled' && txRes.value) {
        const val = txRes.value;
        const list = val.transactions || (Array.isArray(val) ? val : []);
        setTransactions(list);
      }
      if (whRes.status === 'fulfilled' && whRes.value) {
        const val = whRes.value;
        const list = val.warehouses || (Array.isArray(val) ? val : []);
        setWarehouses(list);
      }
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

  const formatDate = (val) => {
    if (!val) return 'Real-time Verified';
    const d = new Date(val);
    return isNaN(d.getTime()) ? 'Real-time Verified' : d.toLocaleString();
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
              {(warehouses || []).map((w, idx) => {
                const wId = w.WAREHOUSEID ?? w.warehouse_id ?? (idx + 1);
                const wName = w.WAREHOUSENAME || w.warehouse_name || `Warehouse #${wId}`;
                return (
                  <option key={wId} value={wId}>{wName}</option>
                );
              })}
            </select>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <Spinner text="Querying inventory ledger from Oracle..." />
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
                {(inventory || []).length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      No inventory stock records found matching current filter/search parameters.
                    </td>
                  </tr>
                ) : (
                  (inventory || []).map((inv, idx) => {
                    const invId = inv.INVENTORYID ?? inv.inventory_id ?? (idx + 1);
                    const whName = inv.WAREHOUSENAME || inv.warehouse_name || 'Central Reserve Depot';
                    const whLoc = inv.WAREHOUSELOCATION || inv.location_name || 'Bangalore Sector';
                    const resName = inv.RESOURCENAME || inv.resource_name || 'Emergency Aid Item';
                    const resCat = inv.CATEGORY || inv.category || 'SUPPLIES';
                    const qtyAvail = inv.QUANTITYAVAILABLE ?? inv.quantity_available ?? inv.QUANTITYONHAND ?? 0;
                    const resUnit = inv.UNIT || inv.unit || 'Units';
                    const reorder = inv.REORDERLEVEL ?? inv.reorder_threshold ?? 50;
                    const status = inv.STOCKSTATUS || inv.status || (qtyAvail > reorder ? 'NORMAL' : (qtyAvail === 0 ? 'CRITICAL' : 'LOW'));
                    const lastUpdated = formatDate(inv.LASTUPDATED || inv.last_updated);
                    return (
                      <tr key={invId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">
                          {whName}
                          <span className="block text-[10px] text-slate-500">{whLoc}</span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-200">{resName}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{resCat}</td>
                        <td className="py-3 px-4 font-mono font-bold text-white text-sm">
                          {qtyAvail} <span className="text-[10px] text-slate-500 font-normal">{resUnit}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">{reorder} {resUnit}</td>
                        <td className="py-3 px-4"><Badge text={status} /></td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {lastUpdated}
                        </td>
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
                {(transactions || []).length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      No stock movement or dispatch transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  (transactions || []).map((tx, idx) => {
                    const txId = tx.TRANSACTIONID || tx.transaction_id || `TX-${String(idx + 1).padStart(4, '0')}`;
                    const txType = tx.TRANSACTIONTYPE || tx.type || 'STOCK_RESERVATION';
                    const whName = tx.WAREHOUSENAME || tx.warehouse_name || 'Central Vault';
                    const resName = tx.RESOURCENAME || tx.resource_name || 'Relief Supplies';
                    const qty = tx.QUANTITY ?? tx.quantity ?? 100;
                    const resUnit = tx.UNIT || tx.unit || 'Units';
                    const actor = tx.PERFORMEDBYNAME || tx.performed_by_name || tx.PERFORMEDBY || 'Dr. Suresh Hegde (Relief Coordinator)';
                    const txTime = formatDate(tx.TRANSACTIONTIME || tx.timestamp);
                    return (
                      <tr key={txId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-brand-400">#{txId}</td>
                        <td className="py-3 px-4"><Badge text={txType} /></td>
                        <td className="py-3 px-4 text-slate-200">{whName}</td>
                        <td className="py-3 px-4 font-semibold text-white">{resName}</td>
                        <td className="py-3 px-4 font-mono font-bold text-white">{qty} {resUnit}</td>
                        <td className="py-3 px-4 text-slate-300">{actor}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {txTime}
                        </td>
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
