import React, { useState, useEffect } from 'react';
import { AlertCircle, Volume2, X, ShieldAlert, ArrowRight } from 'lucide-react';
import api from '../api/client';

export default function EmergencyAlertBanner() {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState({});

  useEffect(() => {
    fetchActiveAlerts();
    const interval = setInterval(fetchActiveAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveAlerts = async () => {
    try {
      const res = await api.get('/alerts/active');
      if (res && res.alerts && Array.isArray(res.alerts)) {
        setAlerts(res.alerts);
      } else if (Array.isArray(res)) {
        setAlerts(res);
      }
    } catch (e) {
      // Fallback banner if network disconnected
      console.warn('Could not fetch real-time alerts:', e);
    }
  };

  const handleDismiss = (id) => {
    setDismissed(prev => ({ ...prev, [id]: true }));
  };

  const activeAlerts = alerts.filter(a => !dismissed[a.alert_id]);
  if (activeAlerts.length === 0) return null;

  const alert = activeAlerts[0];
  const isCritical = alert.severity === 'CRITICAL' || alert.severity === 'HIGH';

  return (
    <div className={`w-full transition-all duration-300 relative z-30 shadow-lg ${
      isCritical 
        ? 'bg-gradient-to-r from-red-950 via-rose-900 to-red-950 border-b border-rose-500/50 text-white' 
        : 'bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 border-b border-amber-500/50 text-amber-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <span className={`flex h-2.5 w-2.5 relative shrink-0`}>
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isCritical ? 'bg-rose-400 opacity-75' : 'bg-amber-400 opacity-75'}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isCritical ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider uppercase ${
            isCritical ? 'bg-rose-500 text-white' : 'bg-amber-500 text-black'
          }`}>
            {alert.alert_type || 'ALERT'}
          </span>
          <p className="font-semibold truncate">
            <span className="font-black text-rose-200">[{alert.target_area}]:</span> {alert.title} — <span className="opacity-90">{alert.message}</span>
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button 
            onClick={() => handleDismiss(alert.alert_id)}
            className="p-1 hover:bg-black/30 rounded text-slate-300 hover:text-white transition-colors"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
