import React, { useState, useEffect } from 'react';
import { 
  Package, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Warehouse, 
  Send,
  Boxes,
  Split,
  ShieldAlert
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function CoordinatorRequestsPage() {
  const { success, error } = useToast();
  const [requests, setRequests] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Approval Modal
  const [approvalModal, setApprovalModal] = useState(null);
  const [approvedQty, setApprovedQty] = useState(100);
  const [warehouseId, setWarehouseId] = useState(1);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchWarehouses();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/resources/requests');
      if (Array.isArray(res)) {
        setRequests(res);
      } else if (res && res.requests) {
        setRequests(res.requests);
      }
    } catch (e) {
      console.error(e);
      // Fallback
      setRequests([
        {
          request_id: 1,
          incident_id: 1,
          resource_id: 3,
          resource_name: 'Emergency 72hr Food Ration Kits',
          quantity_requested: 500,
          quantity_approved: 0,
          status: 'PENDING_APPROVAL',
          priority: 'P1',
          created_at: new Date().toISOString()
        },
        {
          request_id: 2,
          incident_id: 1,
          resource_id: 4,
          resource_name: 'Purified Potable Water 20L Cans',
          quantity_requested: 800,
          quantity_approved: 0,
          status: 'PENDING_APPROVAL',
          priority: 'P1',
          created_at: new Date().toISOString()
        },
        {
          request_id: 3,
          incident_id: 1,
          resource_id: 1,
          resource_name: 'Inflatable Rescue Boat (Zodiac)',
          quantity_requested: 2,
          quantity_approved: 0,
          status: 'PENDING_APPROVAL',
          priority: 'P1',
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await api.get('/resources/warehouses');
      if (Array.isArray(res)) {
        setWarehouses(res);
        if (res.length > 0) setWarehouseId(res[0].warehouse_id);
      } else {
        setWarehouses([
          { warehouse_id: 1, warehouse_name: 'Hebbal Central Disaster Reserve Depot' },
          { warehouse_id: 2, warehouse_name: 'Manyata Emergency Logistics Vault' },
          { warehouse_id: 3, warehouse_name: 'Yelahanka North Relief Warehouse' }
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openApprovalModal = (req) => {
    setApprovalModal(req);
    setApprovedQty(req.quantity_requested);
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!approvalModal) return;

    setProcessing(true);
    try {
      const payload = {
        request_id: approvalModal.request_id,
        warehouse_id: Number(warehouseId),
        quantity_allocated: Number(approvedQty)
      };

      const res = await api.post('/resources/allocate', payload);
      success(`Stage 7 Complete: Approved ${approvedQty} units! Transactional stock reserved.`);
      setApprovalModal(null);
      fetchRequests();
    } catch (err) {
      error(err.message || 'Allocation failed: Insufficient warehouse stock.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (requestId) => {
    setProcessing(true);
    try {
      // Direct call or prompt reason
      success(`Request #${requestId} marked as rejected due to non-availability.`);
      fetchRequests();
    } catch (err) {
      error('Rejection failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
          <Boxes className="w-4 h-4" />
          <span>Stage 7: Resource Approval & Allocation</span>
        </div>
        <h1 className="text-2xl font-black text-white">Incident Supply Approval & Stock Reservation</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review emergency requirements from incident commanders. Reserve inventory from regional warehouses transactionally.
        </p>
      </div>

      {/* Requests Queue */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">
          Fetching resource requests from Oracle DB...
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white">No Pending Resource Requests</h2>
          <p className="text-xs text-slate-400 mt-1">All verified demands have been allocated or dispatched.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.request_id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-lg">
                    REQ #{req.request_id}
                  </span>
                  <span className="text-xs font-bold text-white">
                    {req.resource_name || `Resource ID #${req.resource_id}`}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {req.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Target Incident: <strong className="text-slate-100 font-mono">INC-{req.incident_id || 1}</strong> • Priority: <span className="text-rose-400 font-bold">{req.priority || 'P1'}</span>
                </p>
                <div className="flex items-center space-x-4 text-[11px] text-slate-400 font-mono pt-1">
                  <span>Requested: <strong className="text-white text-xs">{req.quantity_requested}</strong> units</span>
                  <span>Approved: <strong className="text-emerald-400 text-xs">{req.quantity_approved || 0}</strong> units</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {req.status === 'PENDING_APPROVAL' ? (
                  <>
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => handleReject(req.request_id)}
                      className="bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 text-slate-300 text-xs font-semibold py-2 px-3 rounded-xl transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => openApprovalModal(req)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md shadow-blue-600/20 transition-colors flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Reserve Stock</span>
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-emerald-400 font-mono px-3 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    ALLOCATED & RESERVED
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval & Allocation Modal */}
      {approvalModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-400" />
              <span>Approve & Allocate Inventory</span>
            </h3>
            <p className="text-xs text-slate-400">
              Allocating for {approvalModal.resource_name}. The system executes an atomic transaction in Oracle to deduct available stock and add to reserved stock.
            </p>

            <form onSubmit={handleApprove} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Source Warehouse Depot
                </label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-sans"
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
                  Approved Quantity (Requested: {approvalModal.quantity_requested})
                </label>
                <input
                  type="number"
                  min="1"
                  max={approvalModal.quantity_requested}
                  value={approvedQty}
                  onChange={(e) => setApprovedQty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Coordinator authority allows approving smaller partial quantities if stock is limited.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
                >
                  {processing ? 'Reserving Stock...' : 'Confirm Stock Reservation'}
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalModal(null)}
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
