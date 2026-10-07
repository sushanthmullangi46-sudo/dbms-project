import React from 'react';
import { Check, Clock, AlertTriangle } from 'lucide-react';

const STEPS = [
  'ASSIGNED',
  'ACCEPTED',
  'EN_ROUTE',
  'ARRIVED',
  'IN_PROGRESS',
  'COMPLETED'
];

export default function MissionStepper({ currentStatus }) {
  if (currentStatus === 'CANCELLED') {
    return (
      <div className="flex items-center space-x-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs font-semibold">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>MISSION CANCELLED — Tactical operation aborted.</span>
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(currentStatus);

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-slate-800 -z-0" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-brand-500 transition-all duration-300 -z-0"
          style={{ width: `${Math.max(0, (currentIndex / (STEPS.length - 1)) * 100)}%` }}
        />

        {STEPS.map((step, idx) => {
          const isDone = idx < currentIndex || currentStatus === 'COMPLETED';
          const isCurrent = idx === currentIndex && currentStatus !== 'COMPLETED';
          const isPending = idx > currentIndex;

          let circleStyle = 'bg-slate-900 border-slate-700 text-slate-500';
          if (isDone) {
            circleStyle = 'bg-brand-500 border-brand-400 text-white shadow-md shadow-brand-500/30';
          } else if (isCurrent) {
            circleStyle = 'bg-brand-500/20 border-brand-400 text-brand-300 ring-4 ring-brand-500/20 animate-pulse';
          }

          return (
            <div key={step} className="flex flex-col items-center relative z-10">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${circleStyle}`}>
                {isDone ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : isCurrent ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span className={`text-[10px] font-semibold tracking-wider uppercase mt-2 ${
                isCurrent ? 'text-brand-400' : isDone ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {step.replace('_', ' ')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
