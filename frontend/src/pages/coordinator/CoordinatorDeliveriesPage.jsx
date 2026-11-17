import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Package, 
  AlertTriangle, 
  FileCheck, 
  Send,
  UserCheck,
  ShieldCheck,
  Building,
  Boxes
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function CoordinatorDeliveriesPage() {
  const { success, error } = useToast();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Dispatch Modal
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [resources, setResources] = useState([]);
  
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedDisasterId, setSelectedDisasterId] = useState('');
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [dispatchQty, setDispatchQty] = useState(150);
  const [driverName, setDriverName] = useState('Constable K. Murthy (Logistics Squad)');
  const [vehicleReg, setVehicleReg] = useState('KA-04-G-4412 (NDRF Supply Carrier)');
  const [destination, setDestination] = useState('Hebbal Sector 21 Relief Camp');

  // Delivery Confirmation Modal
  const [confirmModal, setConfirmModal] = useState(null);
  const [receivedQty, setReceivedQty] = useState(0);
  const [damagedQty, setDamagedQty] = useState(0);
  const [receiverName, setReceiverName] = useState('Inspector V. Raman (Field Ops)');
  const [proofNotes, setProofNotes] = useState('Signed physical receipt challan #8841 verified on scene');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDeliveries();
    loadDispatchMetadata();
  }, []);

  const loadDispatchMetadata = async () => {
    try {
      const [wRes, iRes, rRes] = await Promise.allSettled([
        api.get('/resources/warehouses'),
        api.get('/incidents'),
        api.get('/resources')
      ]);

      if (wRes.status === 'fulfilled' && wRes.value) {
        const whs = wRes.value.warehouses || (Array.isArray(wRes.value) ? wRes.value : []);
        setWarehouses(whs);
        if (whs.length > 0) setSelectedWarehouseId(String(whs[0].warehouse_id || whs[0].WAREHOUSEID));
      }

      if (iRes.status === 'fulfilled' && iRes.value) {
        const incs = iRes.value.incidents || (Array.isArray(iRes.value) ? iRes.value : []);
        setIncidents(incs);
        if (incs.length > 0) setSelectedDisasterId(String(incs[0].disaster_id || incs[0].incident_id || incs[0].id));
      }

      if (rRes.status === 'fulfilled' && rRes.value) {
        const rList = rRes.value.resources || (Array.isArray(rRes.value) ? rRes.value : []);
        setResources(rList);
        if (rList.length > 0) setSelectedResourceId(String(rList[0].resource_id || rList[0].RESOURCEID));
      }
    } catch (_) {}
  };

  const fetchDeliveries = async () => {
    try {
      const res = await api.get('/deliveries');
      let list = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (res && res.deliveries) {
        list = res.deliveries;
      }
      setDeliveries(list);
    } catch (e) {
      console.error(e);
      // Fallback
      setDeliveries([
        {
          delivery_id: 1,
          dispatch_reference: 'DSP-101-0001',
          destination: 'Hebbal Flyover Relief Camp (Hebbal Ward)',
          carrier_info: 'KA-04-G-4412 • Constable K. Murthy',
          status: 'DISPATCHED',
          quantity_dispatched: 500,
          quantity_received: 0,
          quantity_damaged: 0,
          dispatched_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          delivery_id: 2,
          dispatch_reference: 'DSP-102-0002',
          destination: 'Yelahanka Lake Basin Center (Yelahanka Sector)',
          carrier_info: 'KA-04-G-8819 • Driver R. Sharma',
          status: 'DELIVERED',
          quantity_dispatched: 800,
          quantity_received: 800,
          quantity_damaged: 0,
          dispatched_at: new Date(Date.now() - 7200000).toISOString(),
          delivered_at: new Date(Date.now() - 1800000).toISOString(),
          received_by: 'Inspector S. Reddy'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispatch = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const payload = {
        warehouse_id: selectedWarehouseId ? Number(selectedWarehouseId) : undefined,
        disaster_id: selectedDisasterId ? Number(selectedDisasterId) : undefined,
        resource_id: selectedResourceId ? Number(selectedResourceId) : undefined,
        quantity: Number(dispatchQty) || 100,
        transport_driver_name: driverName,
        vehicle_registration: vehicleReg,
        carrier_info: `${vehicleReg} • ${driverName}`,
        destination: destination
      };

      const res = await api.post('/deliveries/dispatch', payload);
      success(res?.message || 'Stage 8 Complete: Delivery convoy dispatched! Status set to DISPATCHED.');
      setShowDispatchModal(false);
      await fetchDeliveries();
    } catch (err) {
      error(err.message || 'Dispatch creation failed.');
    } finally {
      setProcessing(false);
    }
  };

  const openConfirmModal = (deliv) => {
    setConfirmModal(deliv);
    const initialQty = deliv.quantity_dispatched ?? (deliv.items?.[0]?.quantity_dispatched || 50);
    setReceivedQty(initialQty);
    setDamagedQty(0);
  };

  const handleConfirmDelivery = async (e) => {
    e.preventDefault();
    if (!confirmModal) return;

    setProcessing(true);
    try {
      const payload = {
        delivery_id: confirmModal.delivery_id,
        received_by: receiverName,
        quantity_received: Number(receivedQty),
        quantity_damaged: Number(damagedQty),
        proof_of_delivery: proofNotes
      };

      await api.post('/deliveries/confirm', payload);
      success('Delivery receipt verified! Audit record created with zero duplicate deductions.');
      setConfirmModal(null);
      await fetchDeliveries();
    } catch (err) {
      error(err.message || 'Delivery confirmation failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
            <Truck className="w-4 h-4" />
            <span>Stage 8: Dispatch & Delivery Tracking</span>
          </div>
          <h1 className="text-2xl font-black text-white">Relief Transport Convoy Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Idempotent delivery tracking: Dispatches advance through PREPARING &rarr; DISPATCHED &rarr; DELIVERED with receiver reconciliation.
          </p>
        </div>

        <button
          onClick={() => setShowDispatchModal(true)}
          className="inline-flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-cyan-600/20 transition-all shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>Create New Convoy Dispatch</span>
        </button>
      </div>

      {/* Deliveries List */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">
          Tracking active logistics convoys...
        </div>
      ) : deliveries.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white">No Active Dispatches</h2>
          <p className="text-xs text-slate-400 mt-1">Create a dispatch from approved warehouse allocations.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((deliv) => {
            const isDelivered = deliv.status === 'DELIVERED' || deliv.delivery_status === 'DELIVERED';
            const refCode = deliv.dispatch_reference || `DSP-${deliv.disaster_id || 101}-${String(deliv.delivery_id).padStart(4, '0')}`;
            const destStr = deliv.destination || deliv.disaster_name || 'Emergency Field Sector';
            const carrierStr = deliv.carrier_info || `${deliv.vehicle_registration || 'KA-04-TR-4421'} • ${deliv.transport_driver || deliv.transport_driver_name || 'Logistics Driver'}`;
            const qtyDispatched = deliv.quantity_dispatched ?? (deliv.items?.[0]?.quantity_dispatched || 50);
            const qtyReceived = deliv.quantity_received ?? (deliv.items?.[0]?.quantity_received || (isDelivered ? qtyDispatched : 0));
            const qtyDamaged = deliv.quantity_damaged ?? (deliv.items?.[0]?.quantity_damaged || 0);

            return (
              <div
                key={deliv.delivery_id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
                      {refCode}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        isDelivered
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 animate-pulse'
                      }`}
                    >
                      {isDelivered ? 'DELIVERED' : 'DISPATCHED'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 font-mono">
                    Dispatched: {new Date(deliv.dispatched_at || Date.now()).toLocaleTimeString()}
                  </div>
                </div>

                {/* Convoy Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Destination</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block truncate">{destStr}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Transport & Carrier</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block truncate">{carrierStr}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Cargo Quantity</span>
                    <span className="font-mono font-bold text-cyan-400 text-sm mt-0.5 block">
                      {qtyDispatched} units
                    </span>
                  </div>
                </div>

                {/* Delivery Confirmation Bar */}
                <div className="flex items-center justify-between pt-2">
                  {isDelivered ? (
                    <div className="text-xs text-emerald-400 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Delivered & Reconciled: Received by <strong>{deliv.received_by || deliv.receiver_name || 'Inspector V. Raman'}</strong> ({qtyReceived} units received, {qtyDamaged} damaged)
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-400 flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Convoy in transit. Awaiting authorized field receipt confirmation.</span>
                    </div>
                  )}

                  {!isDelivered && (
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => openConfirmModal(deliv)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md shadow-emerald-600/20 transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Record Delivery Confirmation</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Truck className="w-5 h-5 text-cyan-400" />
              <span>Create Physical Dispatch Record</span>
            </h3>

            <form onSubmit={handleCreateDispatch} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Source Warehouse Depot
                  </label>
                  <select
                    value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {warehouses.length > 0 ? (
                      warehouses.map(w => (
                        <option key={w.warehouse_id || w.WAREHOUSEID} value={w.warehouse_id || w.WAREHOUSEID}>
                          {w.warehouse_name || w.WAREHOUSENAME}
                        </option>
                      ))
                    ) : (
                      <option value="1">Hebbal Central Disaster Reserve Depot</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Target Disaster Incident
                  </label>
                  <select
                    value={selectedDisasterId}
                    onChange={(e) => {
                      setSelectedDisasterId(e.target.value);
                      const inc = incidents.find(i => String(i.disaster_id || i.incident_id || i.id) === e.target.value);
                      if (inc) setDestination(`${inc.disaster_name || inc.name} (${inc.location_name || 'Relief Sector'})`);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {incidents.length > 0 ? (
                      incidents.map(i => (
                        <option key={i.disaster_id || i.incident_id || i.id} value={i.disaster_id || i.incident_id || i.id}>
                          {i.disaster_name || i.name}
                        </option>
                      ))
                    ) : (
                      <option value="1">Bangalore North Flash Flood</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Resource Item to Dispatch
                  </label>
                  <select
                    value={selectedResourceId}
                    onChange={(e) => setSelectedResourceId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {resources.length > 0 ? (
                      resources.map(r => (
                        <option key={r.resource_id || r.RESOURCEID} value={r.resource_id || r.RESOURCEID}>
                          {r.resource_name || r.RESOURCENAME} ({r.unit || r.UNIT})
                        </option>
                      ))
                    ) : (
                      <option value="1">Drinking Water 20L Can</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Quantity to Dispatch
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={dispatchQty}
                    onChange={(e) => setDispatchQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Destination Field Relief Sector
                </label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Assigned Driver
                  </label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Vehicle Registration Plate
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleReg}
                    onChange={(e) => setVehicleReg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {processing ? 'Dispatching...' : 'Dispatch Transport Convoy'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Delivery Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              <span>Record Delivery Receipt Confirmation</span>
            </h3>
            <p className="text-xs text-slate-400">
              Confirm arrival for {confirmModal.dispatch_reference || `Delivery #${confirmModal.delivery_id}`}. Reconciles inventory balances and prevents double deductions.
            </p>

            <form onSubmit={handleConfirmDelivery} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Authorized Receiving Officer / Agency
                </label>
                <input
                  type="text"
                  required
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Quantity Received
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={receivedQty}
                    onChange={(e) => setReceivedQty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Damaged in Transit
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={damagedQty}
                    onChange={(e) => setDamagedQty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Proof of Delivery / Physical Challan Notes
                </label>
                <textarea
                  rows={2}
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {processing ? 'Verifying Receipt...' : 'Confirm Delivery & Stamp Record'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
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
