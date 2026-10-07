import React, { useState, useEffect } from 'react';
import { Users, Phone, MapPin, Award, Shield } from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';

export default function RespondersPage() {
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/resources/responders')
      .then((res) => {
        if (res.success) setResponders(res.responders);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Field Responders & Tactical Personnel</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Certified urban rescue, trauma triage, HAZMAT containment, and flood piloting teams
          </p>
        </div>
      </div>

      {loading ? (
        <Spinner text="Querying field responders..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {responders.map((r) => (
            <div
              key={r.RESPONDERID}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] text-brand-400 font-bold uppercase">TEAM #{r.RESPONDERID}</span>
                  <h3 className="font-bold text-white text-base mt-0.5">{r.TEAMNAME}</h3>
                  <p className="text-xs text-emerald-400 font-medium">{r.SPECIALIZATION}</p>
                </div>
                <Badge text={r.AVAILABILITYSTATUS} />
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Squad Lead:</span>
                  <span className="text-slate-200 font-medium">{r.LEADNAME}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Contact Radio/Phone:</span>
                  <span className="font-mono text-slate-300 font-medium">{r.CONTACTPHONE}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Experience Tier:</span>
                  <span className="font-mono font-bold text-amber-400">{r.EXPERIENCELEVEL}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Current Status:</span>
                  <Badge text={r.CURRENTSTATUS} />
                </div>
              </div>

              <div className="flex items-center space-x-1.5 text-xs text-slate-400 pt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Stationed: {r.LOCATIONNAME || 'Hebbal Central Staging Base'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
