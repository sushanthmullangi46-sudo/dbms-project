import React from 'react';

export default function Badge({ text, variant = 'default', className = '' }) {
  const v = (text || variant || '').toString().toUpperCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';

  // Severity & Criticality
  if (v === 'CRITICAL' || v === 'CANCELLED' || v === 'DAMAGED' || v === 'OUT_OF_STOCK') {
    styles = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  } else if (v === 'HIGH' || v === 'ON_HOLD' || v === 'UNDER_REPAIR') {
    styles = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
  } else if (v === 'MEDIUM' || v === 'PENDING' || v === 'ASSIGNED' || v === 'LOW_STOCK') {
    styles = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (v === 'COMPLETED' || v === 'RESOLVED' || v === 'AVAILABLE' || v === 'NORMAL' || v === 'ACTIVE' || v === 'SAFE') {
    styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else if (v === 'IN_PROGRESS' || v === 'EN_ROUTE' || v === 'ARRIVED' || v === 'ALLOCATED' || v === 'IN_USE') {
    styles = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  } else if (v === 'ACCEPTED' || v === 'OPEN') {
    styles = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {text || variant}
    </span>
  );
}
