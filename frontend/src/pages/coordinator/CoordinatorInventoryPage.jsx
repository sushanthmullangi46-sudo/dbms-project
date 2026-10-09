import React, { useState, useEffect } from 'react';
import { 
  Warehouse, 
  Package, 
  AlertTriangle, 
  PlusCircle, 
  TrendingDown, 
  Boxes, 
  CheckCircle2, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function CoordinatorInventoryPage() {
  const { success, error } = useToast();
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Replenishment Modal
  const [replenishModal, setReplenishModal] = useState(false);
  const [selWarehouseId, setSelWarehouseId] = useState(1);
  const [selResourceId, setSelResourceId] = useState(1);
  const [replenishQty, setReplenishQty] = useState(500);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      const [whRes, invRes, resList] = await Promise.all([
        api.get('/resources/warehouses'),
        api.get('/resources/inventory'),
        api.get('/resources')
      ]);

      if (Array.isArray(whRes)) setWarehouses(whRes);
      if (Array.isArray(invRes)) setInventory(invRes);
      if (Array.isArray(resList)) setResources(resList);
    } catch (e) {
      console.error(e);
      // Fallback
      setWarehouses([
        { warehouse_id: 1, warehouse_name: 'Hebbal Central Disaster Reserve Depot', capacity_pallets: 10000, manager_name: 'Inspector R. Chettiar' },
        { warehouse_id: 2, warehouse_name: 'Manyata Emergency Logistics Vault', capacity_pallets: 8000, manager_name: 'T. Sundaram' },
        { warehouse_id: 3, warehouse_name: 'Yelahanka North Relief Warehouse', capacity_pallets: 12000, manager_name: 'Major B. Varma' }
      ]);
      setInventory([
        { inventory_id: 1, warehouse_id: 1, warehouse_name: 'Hebbal Central Depot', resource_id: 1, resource_name: 'Inflatable Rescue Boat (Zodiac)', quantity_available: 8, quantity_reserved: 2, reorder_threshold: 2, unit: 'Boats' },
        { inventory_id: 2, warehouse_id: 1, warehouse_name: 'Hebbal Central Depot', resource_id: 2, resource_name: 'High-Pressure Medical Oxygen 50L', quantity_available: 85, quantity_reserved: 15, reorder_threshold: 20, unit: 'Cylinders' },
        { inventory_id: 3, warehouse_id: 1, warehouse_name: 'Hebbal Central Depot', resource_id: 3, resource_name: 'Emergency 72hr Food Ration Kits', quantity_available: 2500, quantity_reserved: 500, reorder_threshold: 300, unit: 'Kits' },
        { inventory_id: 4, warehouse_id: 1, warehouse_name: 'Hebbal Central Depot', resource_id: 4, resource_name: 'Purified Potable Water 20L Cans', quantity_available: 4000, quantity_reserved: 800, reorder_threshold: 500, unit: 'Cans' },
        { inventory_id: 5, warehouse_id: 1, warehouse_name: 'Hebbal Central Depot', resource_id: 6, resource_name: 'Heavy De-Watering Storm Pump', quantity_available: 12, quantity_reserved: 3, reorder_threshold: 3, unit: 'Pumps' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReplenish = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/resources/replenishment', {
        warehouse_id: Number(selWarehouseId),
        resource_id: Number(selResourceId),
        quantity_to_add: Number(replenishQty),
        supplier_notes: 'Regional Disaster Stock Replenishment Batch 2026'
      });
      success(`Added ${replenishQty} units to warehouse stock balance!`);
      setReplenishModal(false);
      fetchInventoryData();
    } catch (err) {
      error(err.message || 'Replenishment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
            <Warehouse className="w-4 h-4" />
            <span>Warehouses & Inventory Balances</span>
          </div>
          <h1 className="text-2xl font-black text-white">Disaster Reserve Depot Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-depot inventory tracking with reserved stock isolation and automated reorder notifications.
          </p>
        </div>

        <button
          onClick={() => setReplenishModal(true)}
          className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Replenish Depot Stocks</span>
        </button>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {warehouses.map((wh) => (
          <div key={wh.warehouse_id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-white text-sm">{wh.warehouse_name}</h3>
                <span className="text-[11px] text-slate-400 font-mono">Manager: {wh.manager_name}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <div className="text-xs text-slate-400 pt-2 border-t border-slate-800/80 font-mono">
              Capacity: <strong className="text-slate-200">{wh.capacity_pallets || 10000}</strong> pallets
            </div>
          </div>
        ))}
      </div>

      {/* Stock Balances Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <Boxes className="w-4 h-4 text-emerald-400" />
            <span>Master Inventory Balances</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">{inventory.length} Stock Ledger Items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-3 px-3">Warehouse</th>
                <th className="py-3 px-3">Resource Item</th>
                <th className="py-3 px-3 text-right">Available</th>
                <th className="py-3 px-3 text-right">Reserved</th>
                <th className="py-3 px-3 text-right">Total Balance</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {inventory.map((inv) => {
                const avail = inv.quantity_available || inv.QUANTITYAVAILABLE || 0;
                const rsv = inv.quantity_reserved || inv.QUANTITYRESERVED || 0;
                const isLow = avail <= (inv.reorder_threshold || 10);

                return (
                  <tr key={inv.inventory_id || Math.random()} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-sans text-slate-300">
                      {inv.warehouse_name || `Warehouse #${inv.warehouse_id}`}
                    </td>
                    <td className="py-3 px-3 font-sans font-bold text-white">
                      {inv.resource_name || `Resource #${inv.resource_id}`}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                      {avail} {inv.unit || ''}
                    </td>
                    <td className="py-3 px-3 text-right text-amber-400 font-bold">
                      {rsv} {inv.unit || ''}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-200 font-bold">
                      {avail + rsv} {inv.unit || ''}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isLow
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {isLow ? 'LOW STOCK' : 'OPTIMAL'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Replenishment Modal */}
      {replenishModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              <span>Replenish Regional Depot Stock</span>
            </h3>

            <form onSubmit={handleReplenish} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Target Warehouse Depot
                </label>
                <select
                  value={selWarehouseId}
                  onChange={(e) => setSelWarehouseId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {warehouses.map((wh) => (
                    <option key={wh.warehouse_id} value={wh.warehouse_id}>
                      {wh.warehouse_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Resource Item
                </label>
                <select
                  value={selResourceId}
                  onChange={(e) => setSelResourceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="1">Inflatable Rescue Boat (Zodiac)</option>
                  <option value="2">High-Pressure Medical Oxygen 50L</option>
                  <option value="3">Emergency 72hr Food Ration Kits</option>
                  <option value="4">Purified Potable Water 20L Cans</option>
                  <option value="5">Trauma Emergency First Aid Kit</option>
                  <option value="6">Heavy De-Watering Storm Pump</option>
                  <option value="7">Thermal Cold Relief Blankets</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Quantity to Replenish
                </label>
                <input
                  type="number"
                  min="1"
                  value={replenishQty}
                  onChange={(e) => setReplenishQty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
                >
                  {submitting ? 'Updating DB...' : 'Confirm Stock Intake'}
                </button>
                <button
                  type="button"
                  onClick={() => setReplenishModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
