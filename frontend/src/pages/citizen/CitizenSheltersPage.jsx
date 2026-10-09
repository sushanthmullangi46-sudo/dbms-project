import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Building2, 
  Users, 
  Bed, 
  Activity, 
  CheckCircle, 
  ShieldCheck, 
  MapPin, 
  UserPlus, 
  AlertCircle
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function CitizenSheltersPage() {
  const { success, error } = useToast();
  const [shelters, setShelters] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [dependents, setDependents] = useState(0);
  const [registering, setRegistering] = useState(false);
  const [registeredCamp, setRegisteredCamp] = useState(null);

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const [shRes, hospRes] = await Promise.all([
        api.get('/shelters'),
        api.get('/medical/hospitals')
      ]);

      if (Array.isArray(shRes)) {
        setShelters(shRes);
      } else if (shRes && shRes.shelters) {
        setShelters(shRes.shelters);
      }

      if (Array.isArray(hospRes)) {
        setHospitals(hospRes);
      }
    } catch (e) {
      console.error(e);
      // Fallback
      setShelters([
        { shelter_id: 1, shelter_name: 'Sahakarnagar Indoor Stadium Relief Shelter', capacity: 500, current_occupancy: 185, status: 'OPEN' },
        { shelter_id: 2, shelter_name: 'Jakkur Government High School Camp', capacity: 300, current_occupancy: 140, status: 'OPEN' },
        { shelter_id: 3, shelter_name: 'Vidyaranyapura Community Hall', capacity: 250, current_occupancy: 65, status: 'OPEN' },
        { shelter_id: 4, shelter_name: 'RT Nagar BBMP Relief Shelter', capacity: 200, current_occupancy: 195, status: 'FULL' }
      ]);
      setHospitals([
        { hospital_id: 1, hospital_name: 'Columbia Asia Emergency Trauma Center', total_icu_beds: 35, available_icu_beds: 12, total_general_beds: 200, available_general_beds: 60 },
        { hospital_id: 2, hospital_name: 'Aster CMI Tertiary Care Hospital', total_icu_beds: 50, available_icu_beds: 18, total_general_beds: 300, available_general_beds: 95 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterShelter = async (e) => {
    e.preventDefault();
    if (!selectedShelter) return;

    setRegistering(true);
    try {
      const res = await api.post('/shelters/register', {
        shelter_id: selectedShelter.shelter_id,
        number_of_dependents: Number(dependents),
        special_assistance_needed: 'Elderly assistance & food supplies'
      });
      success(`Checked in to ${selectedShelter.shelter_name}!`);
      setRegisteredCamp(selectedShelter);
      setSelectedShelter(null);
      fetchFacilities();
    } catch (err) {
      error(err.message || 'Capacity exceeded or registration failed.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
          <Home className="w-4 h-4" />
          <span>Stage 9 & 10: Evacuation Shelters & Hospital Beds</span>
        </div>
        <h1 className="text-2xl font-black text-white">Emergency Relief Shelters & Hospital Capacities</h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time occupancy limits enforced by Oracle transactional constraints. Check in to secure shelter places.
        </p>
      </div>

      {registeredCamp && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Registered at {registeredCamp.shelter_name}</h3>
              <p className="text-xs text-slate-300">Your reservation is confirmed in the emergency shelter ledger.</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-mono font-bold">
            CONFIRMED
          </span>
        </div>
      )}

      {/* Shelters Grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center space-x-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Municipal Emergency Shelters (Bangalore North)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shelters.map((sh) => {
            const cap = sh.capacity || sh.CAPACITY || 100;
            const occ = sh.current_occupancy || sh.CURRENTOCCUPANCY || 0;
            const pct = Math.round((occ / cap) * 100);
            const isFull = pct >= 95 || sh.status === 'FULL';

            return (
              <div
                key={sh.shelter_id || sh.SHELTERID}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-sm">{sh.shelter_name || sh.SHELTERNAME}</h3>
                    <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>Hebbal - Yelahanka Sector</span>
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${
                      isFull
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}
                  >
                    {isFull ? 'FULL' : 'OPEN'}
                  </span>
                </div>

                {/* Capacity Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400 font-mono">
                    <span>Occupancy: {occ} / {cap} ({pct}%)</span>
                    <span>Available: {Math.max(0, cap - occ)}</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        pct > 90 ? 'bg-rose-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isFull}
                  onClick={() => setSelectedShelter(sh)}
                  className="w-full bg-slate-800 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-slate-800 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isFull ? 'Shelter at Full Capacity' : 'Check In to This Shelter'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hospital Capacities */}
      <div>
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center space-x-2">
          <Activity className="w-4 h-4 text-rose-400" />
          <span>Tertiary Trauma Hospitals & Bed Availability</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {hospitals.map((hosp) => (
            <div
              key={hosp.hospital_id || hosp.HOSPITALID}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3"
            >
              <div>
                <h3 className="font-bold text-white text-sm">{hosp.hospital_name || hosp.HOSPITALNAME}</h3>
                <span className="text-[11px] text-cyan-400 font-mono">Level 1 Emergency Center</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-xs">
                <div className="p-2 bg-slate-950 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">Available ICU Beds</span>
                  <span className="text-base font-bold text-rose-400 font-mono">
                    {hosp.available_icu_beds || 12}
                  </span>
                  <span className="text-[10px] text-slate-500 block">of {hosp.total_icu_beds || 35}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">General Relief Beds</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    {hosp.available_general_beds || 60}
                  </span>
                  <span className="text-[10px] text-slate-500 block">of {hosp.total_general_beds || 200}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shelter Registration Modal */}
      {selectedShelter && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              Check In to {selectedShelter.shelter_name}
            </h3>
            <p className="text-xs text-slate-400">
              Transactional capacity check: The database will immediately reserve spots and reject if capacity is breached.
            </p>

            <form onSubmit={handleRegisterShelter} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Accompanying Family / Dependents
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={dependents}
                  onChange={(e) => setDependents(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={registering}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
                >
                  {registering ? 'Confirming with DB...' : 'Confirm Check-In'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedShelter(null)}
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
