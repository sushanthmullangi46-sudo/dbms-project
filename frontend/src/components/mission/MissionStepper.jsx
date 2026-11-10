import React from 'react';
import { Check, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

const STEPS = [
  'ASSIGNED',
  'ACKNOWLEDGED',
  'PREPARING',
  'DISPATCHED',
  'EN_ROUTE',
  'ON_SCENE',
  'RESCUE_IN_PROGRESS',
  'COMPLETED'
];

const STATUS_MAP = {
  'ACCEPTED': 'ACKNOWLEDGED',
  'ARRIVED': 'ON_SCENE',
  'IN_PROGRESS': 'RESCUE_IN_PROGRESS'
};

const STEP_LABELS = {
  'ASSIGNED': 'Assigned',
  'ACKNOWLEDGED': 'Acknowledged',
  'PREPARING': 'Preparing',
  'DISPATCHED': 'Dispatched',
  'EN_ROUTE': 'En Route',
  'ON_SCENE': 'On Scene',
  'RESCUE_IN_PROGRESS': 'Rescue In Progress',
  'COMPLETED': 'Completed'
};

export default function MissionStepper({ currentStatus }) {
  const normStatus = STATUS_MAP[currentStatus] || currentStatus || 'ASSIGNED';
  if (normStatus === 'CANCELLED') {
    return (
      <div className="flex items-center space-x-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs font-semibold">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>MISSION CANCELLED — Tactical operation aborted.</span>
      </div>
    );
  }

  const currentIndex = Math.max(0, STEPS.indexOf(normStatus));

  return (
    <div className="w-full py-4 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[540px] relative px-2">
        {/* Connecting line */}
        <div className="absolute left-6 right-6 top-4 -translate-y-1/2 h-0.5 bg-slate-800 -z-0" />
        <div 
          className="absolute left-6 top-4 -translate-y-1/2 h-0.5 bg-brand-500 transition-all duration-300 -z-0"
          style={{ width: `calc(${Math.max(0, (currentIndex / (STEPS.length - 1)) * 100)}% - 24px)` }}
        />

        {STEPS.map((step, idx) => {
          const isDone = idx < currentIndex || currentStatus === 'COMPLETED';
          const isCurrent = idx === currentIndex && currentStatus !== 'COMPLETED';

          let circleStyle = 'bg-slate-900 border-slate-700 text-slate-500';
          if (isDone) {
            circleStyle = 'bg-brand-500 border-brand-400 text-white shadow-md shadow-brand-500/30';
          } else if (isCurrent) {
            circleStyle = 'bg-brand-500/20 border-brand-400 text-brand-300 ring-4 ring-brand-500/20 animate-pulse';
          }

          return (
            <div key={step} className="flex flex-col items-center relative z-10 px-1 text-center">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${circleStyle}`}>
                {isDone ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : isCurrent ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span className={`text-[9px] font-bold tracking-wider uppercase mt-1.5 whitespace-nowrap ${
                isCurrent ? 'text-brand-400' : isDone ? 'text-slate-200' : 'text-slate-600'
              }`}>
                {STEP_LABELS[step]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
