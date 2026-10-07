import React, { useState, useEffect } from 'react';
import { Home, Users, CheckCircle2, XCircle, Droplets, HeartPulse, MapPin } from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';

export default function SheltersPage() {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/inventory/shelters')
      .then((res) => {
        if (res.success) setShelters(res.shelters);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Home className="w-5 h-5 text-blue-400" />
            <span>Evacuation & Relief Shelters</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Designated safe zones, bed capacities, medical clinics, and water availability
          </p>
        </div>
      </div>

      {loading ? (
        <Spinner text="Querying relief shelters..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shelters.map((s) => (
            <div
              key={s.SHELTERID}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] text-brand-400 font-bold uppercase">SHELTER #{s.SHELTERID}</span>
                  <h3 className="font-bold text-white text-base mt-0.5">{s.SHELTERNAME}</h3>
                  <div className="flex items-center space-x-1 text-slate-400 text-xs mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{s.LOCATIONNAME}</span>
                  </div>
                </div>
                <Badge text={s.STATUS} />
              </div>

              {/* Occupancy Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Occupancy</span>
                  <span className="font-mono text-slate-200">
                    <strong className="text-white">{s.CURRENTOCCUPANCY}</strong> / {s.CAPACITY} ({s.OCCUPANCYRATE}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all ${
                      s.OCCUPANCYRATE >= 90 ? 'bg-rose-500' : s.OCCUPANCYRATE >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, s.OCCUPANCYRATE)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 text-right">
                  {s.REMAININGCAPACITY} available bed spaces
                </p>
              </div>

              {/* Amenities Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <div className="flex items-center space-x-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <HeartPulse className={`w-4 h-4 ${s.MEDICALFACILITY === 'Y' ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Medical Clinic</span>
                    <span className="font-medium text-slate-300">{s.MEDICALFACILITY === 'Y' ? 'Equipped' : 'None'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <Droplets className={`w-4 h-4 ${s.WATERAVAILABLE === 'Y' ? 'text-blue-400' : 'text-slate-600'}`} />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Potable Water</span>
                    <span className="font-medium text-slate-300">{s.WATERAVAILABLE === 'Y' ? 'Available' : 'Shortage'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
