import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, 
  Truck, 
  Box, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Radio,
  FileText
} from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import MissionStepper from '../../components/mission/MissionStepper';

export default function ResponderDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/responder/missions')
      .then((res) => {
        if (res.success) setData(res);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Spinner size="lg" text="Connecting to Responder Tactical Comm..." />;
  }

  const { responder = {}, missions = [] } = data || {};
  const activeMission = missions.find(
    (m) => m.STATUS !== 'COMPLETED' && m.STATUS !== 'CANCELLED'
  );
  const completedMissions = missions.filter((m) => m.STATUS === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-mono text-xs text-emerald-400 font-bold uppercase tracking-wider">
              FIELD RESPONDER TERMINAL ACTIVE
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            {responder.TEAMNAME || 'Tactical Team'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Specialization: <strong className="text-slate-200">{responder.SPECIALIZATION}</strong> • Experience Tier: <strong className="text-amber-400">{responder.EXPERIENCELEVEL}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge text={responder.CURRENTSTATUS} />
          <Badge text={responder.AVAILABILITYSTATUS} />
        </div>
      </div>

      {/* Active Mission Spotlight */}
      {activeMission ? (
        <div className="bg-slate-900/90 border-2 border-brand-500/40 rounded-xl p-6 shadow-xl space-y-4 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-brand-500 text-white font-mono text-xs font-bold">
                ACTIVE MISSION #{activeMission.MISSIONID}
              </span>
              <Badge text={activeMission.PRIORITY} />
              <Badge text={activeMission.STATUS} />
            </div>
            <Link
              to={`/responder/missions`}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-md shadow-brand-600/20 text-center"
            >
              Enter Mission Control
            </Link>
          </div>

          {/* Stepper */}
          <MissionStepper currentStatus={activeMission.STATUS} />

          {/* Mission Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-lg border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] block">Disaster Incident</span>
              <span className="text-white font-bold text-sm mt-0.5 block">{activeMission.INCIDENTNAME}</span>
              <span className="text-slate-400 text-[11px]">Severity: {activeMission.INCIDENTSEVERITY}</span>
            </div>

            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] block">Assigned Transport</span>
              <span className="text-slate-200 font-medium mt-0.5 block">
                {activeMission.VEHICLETYPE || 'Foot Operation'}
              </span>
              <span className="text-slate-500 font-mono text-[11px]">{activeMission.VEHICLEREGISTRATION || 'N/A'}</span>
            </div>

            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] block">Destination</span>
              <div className="flex items-center space-x-1 text-slate-200 font-medium mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{activeMission.TARGETLOCATION}</span>
              </div>
              <span className="text-slate-500 text-[11px]">Req #{activeMission.REQUESTID}</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 italic">
            "{activeMission.REQUESTDESCRIPTION}"
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-8 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h3 className="font-bold text-white text-base">All Active Missions Completed</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Your squad is currently marked AVAILABLE on standby for new emergency dispatches from the Command Center.
          </p>
        </div>
      )}

      {/* Responder Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="p-3 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-lg">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Dispatches</span>
            <h4 className="text-xl font-bold text-white font-mono">{missions.length}</h4>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Successfully Resolved</span>
            <h4 className="text-xl font-bold text-white font-mono">{completedMissions.length}</h4>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Reports Filed</span>
            <h4 className="text-xl font-bold text-white font-mono">
              {missions.reduce((acc, m) => acc + (m.FIELDREPORTCOUNT || 0), 0)}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
}
