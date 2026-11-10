import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  MapPin, 
  Users, 
  Activity, 
  LifeBuoy, 
  Upload, 
  CheckCircle, 
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  PackageCheck,
  Compass,
  Boxes
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

const DISASTER_TYPES = [
  'Flood',
  'Fire',
  'Earthquake',
  'Building collapse',
  'Cyclone',
  'Landslide',
  'Industrial accident',
  'Other emergency'
];

const RELIEF_SUPPLY_ITEMS = [
  { key: 'water', name: 'Drinking Water (20L Cans)', category: 'WATER', defaultQty: 50, unit: 'Cans' },
  { key: 'food', name: 'Emergency 72hr Food Rations', category: 'FOOD', defaultQty: 100, unit: 'Kits' },
  { key: 'first_aid', name: 'Trauma Emergency First-Aid Kits', category: 'MEDICAL', defaultQty: 10, unit: 'Kits' },
  { key: 'medicines', name: 'Emergency Medicines & IV Fluids', category: 'MEDICAL', defaultQty: 25, unit: 'Packs' },
  { key: 'blankets', name: 'Thermal Cold Relief Blankets', category: 'SHELTER_SUPPLIES', defaultQty: 50, unit: 'Blankets' },
  { key: 'boats', name: 'Inflatable Rescue Boats (Zodiac)', category: 'EQUIPMENT', defaultQty: 2, unit: 'Boats' },
  { key: 'tents', name: 'Emergency Family All-Weather Tents', category: 'SHELTER_SUPPLIES', defaultQty: 10, unit: 'Tents' },
  { key: 'oxygen', name: 'High-Pressure Medical Oxygen 50L', category: 'MEDICAL', defaultQty: 5, unit: 'Cylinders' },
  { key: 'baby_food', name: 'Baby Care & Infant Nutrition Packs', category: 'FOOD', defaultQty: 20, unit: 'Packs' },
  { key: 'sanitation', name: 'Sanitation & Disinfectant Kits', category: 'SHELTER_SUPPLIES', defaultQty: 25, unit: 'Kits' },
  { key: 'pump', name: 'Heavy De-Watering Storm Pump', category: 'EQUIPMENT', defaultQty: 1, unit: 'Pumps' }
];

export default function ReportDisasterPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);

  // Form Fields
  const [disasterType, setDisasterType] = useState('Flood');
  const [severity, setSeverity] = useState('P1');
  const [locationId, setLocationId] = useState(1001);
  const [description, setDescription] = useState('');
  const [peopleAffected, setPeopleAffected] = useState(15);
  const [injuriesReported, setInjuriesReported] = useState(2);
  const [missingPersons, setMissingPersons] = useState(0);
  const [trappedPersons, setTrappedPersons] = useState(4);
  const [urgentMedicalNeeded, setUrgentMedicalNeeded] = useState(true);
  const [evacuationNeeded, setEvacuationNeeded] = useState(true);
  const [fileName, setFileName] = useState('');

  // Itemized supply selection state: { key: { selected: bool, quantity: number } }
  const [suppliesSelection, setSuppliesSelection] = useState({
    water: { selected: true, quantity: 50 },
    food: { selected: true, quantity: 100 },
    first_aid: { selected: true, quantity: 10 },
    medicines: { selected: false, quantity: 25 },
    blankets: { selected: true, quantity: 50 },
    boats: { selected: true, quantity: 2 },
    tents: { selected: false, quantity: 10 },
    oxygen: { selected: false, quantity: 5 },
    baby_food: { selected: false, quantity: 20 },
    sanitation: { selected: false, quantity: 25 },
    pump: { selected: false, quantity: 1 }
  });

  const toggleSupply = (key) => {
    setSuppliesSelection(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        selected: !prev[key].selected
      }
    }));
  };

  const updateSupplyQty = (key, qty) => {
    setSuppliesSelection(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        quantity: Math.max(1, parseInt(qty) || 1)
      }
    }));
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await api.get('/map/nodes');
      if (res && res.disaster_locations) {
        setLocations(res.disaster_locations);
        if (res.disaster_locations.length > 0) {
          setLocationId(res.disaster_locations[0].location_id);
        }
      } else {
        setLocations([
          { location_id: 1001, location_name: 'Hebbal Flyover Junction', ward_name: 'Hebbal Ward 21', risk_zone: 'CRITICAL' },
          { location_id: 1002, location_name: 'Manyata Embassy Business Park', ward_name: 'Nagawara Ward 23', risk_zone: 'HIGH' },
          { location_id: 1003, location_name: 'Yelahanka Old Town Lake Basin', ward_name: 'Yelahanka Ward 4', risk_zone: 'CRITICAL' },
          { location_id: 1004, location_name: 'Jakkur Aerodrome Sector', ward_name: 'Jakkur Ward 5', risk_zone: 'MODERATE' },
          { location_id: 1005, location_name: 'Nagawara Lake Lowlands', ward_name: 'Nagawara Ward 23', risk_zone: 'HIGH' },
          { location_id: 1006, location_name: 'RT Nagar Central Market', ward_name: 'RT Nagar Ward 32', risk_zone: 'MODERATE' }
        ]);
      }
    } catch (e) {
      console.warn('Failed to fetch map nodes, using default sectors:', e);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      error('Please enter a description of the emergency.');
      return;
    }

    setSubmitting(true);
    try {
      // Build itemized supplies list
      const requested_supplies = [];
      RELIEF_SUPPLY_ITEMS.forEach(item => {
        const sel = suppliesSelection[item.key];
        if (sel && sel.selected) {
          requested_supplies.push({
            name: item.name,
            resource_name: item.name,
            quantity: sel.quantity,
            category: item.category,
            unit: item.unit
          });
        }
      });

      const payload = {
        location_id: Number(locationId),
        disaster_type: disasterType,
        severity: severity,
        description: description,
        people_affected: Number(peopleAffected),
        injuries_reported: Number(injuriesReported),
        missing_persons: Number(missingPersons),
        trapped_persons: Number(trappedPersons),
        urgent_medical_needed: Boolean(urgentMedicalNeeded),
        evacuation_needed: Boolean(evacuationNeeded),
        requested_supplies: requested_supplies
      };

      const res = await api.post('/reports', payload);
      success('Emergency registered! Command center, Rescue squads, and Logistics alerted.');
      setSubmittedReport(res);
    } catch (err) {
      error(err.message || 'Submission failed. Please check network connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedReport) {
    const reportRef = submittedReport.report_reference_id || submittedReport.emergency_code || submittedReport.emergency_id;
    const reportId = submittedReport.report_id || submittedReport.id || 1;

    return (
      <div className="max-w-xl mx-auto py-10">
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="inline-flex p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 mb-4 animate-bounce">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black text-white">Emergency Report Registered!</h2>
          <p className="text-sm text-slate-300 mt-2">
            Your emergency has been registered in the centralized database and is now actively synchronized across <strong>Incident Command</strong>, <strong>Rescue Squads</strong>, and <strong>Relief Logistics</strong>.
          </p>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 my-6 text-left space-y-2">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-xs text-slate-400">Unique Emergency ID:</span>
              <span className="font-mono text-sm font-black text-rose-400">
                {reportRef}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Disaster Type:</span>
              <span className="font-bold text-white uppercase">{disasterType}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Operational Status:</span>
              <span className="font-bold text-emerald-400 uppercase tracking-wide">
                SUBMITTED & ACTIVE
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Assistance Queued:</span>
              <span className="font-bold text-cyan-400">
                {evacuationNeeded ? 'Rescue Squad' : ''} {urgentMedicalNeeded ? '+ Medical' : ''} + Relief Supplies
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(`/citizen/tracking?id=${reportId}`)}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 text-sm shadow-lg shadow-cyan-600/20 transition-all"
            >
              <Compass className="w-4 h-4" />
              <span>Track Rescue Squad & Supplies Live</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            <button
              onClick={() => {
                setSubmittedReport(null);
                setDescription('');
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-3 px-4 rounded-xl text-sm transition-all"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-rose-400 mb-1">
          <ShieldAlert className="w-4 h-4" />
          <span>Stage 1: Citizen Emergency & Relief Dispatch</span>
        </div>
        <h1 className="text-2xl font-black text-white">Report Urban Disaster or Emergency</h1>
        <p className="text-xs text-slate-400 mt-1">
          Enter emergency details and request necessary relief supplies. This centralized emergency is immediately visible to Rescue Squads and Relief Logistics.
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Disaster Type Grid */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            1. Select Disaster Type *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {DISASTER_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setDisasterType(type)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                  disasterType === type
                    ? 'bg-rose-500/20 border-rose-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span>{type}</span>
                {disasterType === type && <span className="w-2 h-2 rounded-full bg-rose-500" />}
              </button>
            ))}
          </div>
        </div>

        {/* Severity Level */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            2. Urgency & Severity Level *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { level: 'P1', label: 'P1 - Critical', sub: 'Immediate threat to life' },
              { level: 'P2', label: 'P2 - High', sub: 'Urgent evacuation/aid' },
              { level: 'P3', label: 'P3 - Moderate', sub: 'Standard relief aid' },
              { level: 'P4', label: 'P4 - Low', sub: 'Resource monitoring' }
            ].map(sev => (
              <button
                key={sev.level}
                type="button"
                onClick={() => setSeverity(sev.level)}
                className={`py-2 px-3 rounded-xl border text-left transition-all ${
                  severity === sev.level
                    ? 'bg-rose-500/20 border-rose-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs">{sev.label}</div>
                <div className="text-[10px] text-slate-500">{sev.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Affected Location */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            3. Affected Location / Ward *
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
            >
              {locations.map((loc) => (
                <option key={loc.location_id} value={loc.location_id}>
                  {loc.location_name} — {loc.ward_name} ({loc.risk_zone} Risk Zone)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Incident Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            4. Detailed Incident Description *
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Describe the current hazard conditions, water levels, structural collapses, trapped people, or immediate dangers..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Human Impact Numbers */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            5. Estimated Human Impact Metrics
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">People Affected</span>
              <input
                type="number"
                min="1"
                value={peopleAffected}
                onChange={(e) => setPeopleAffected(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Injuries</span>
              <input
                type="number"
                min="0"
                value={injuriesReported}
                onChange={(e) => setInjuriesReported(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Missing Persons</span>
              <input
                type="number"
                min="0"
                value={missingPersons}
                onChange={(e) => setMissingPersons(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">People Trapped</span>
              <input
                type="number"
                min="0"
                value={trappedPersons}
                onChange={(e) => setTrappedPersons(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Critical Rescue Squad Flags */}
        <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-3">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            6. Tactical Rescue Assistance Required
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center space-x-3 p-3 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={urgentMedicalNeeded}
                onChange={(e) => setUrgentMedicalNeeded(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded bg-slate-950 border-slate-700 focus:ring-0"
              />
              <span className="text-xs font-semibold text-slate-200">Urgent Medical Triage & Ambulance Required</span>
            </label>

            <label className="flex items-center space-x-3 p-3 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={evacuationNeeded}
                onChange={(e) => setEvacuationNeeded(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded bg-slate-950 border-slate-700 focus:ring-0"
              />
              <span className="text-xs font-semibold text-slate-200">Immediate Search & Rescue Squad Required</span>
            </label>
          </div>
        </div>

        {/* Multi-Select Relief Supplies Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              7. Required Relief Supplies & Material Assistance
            </label>
            <span className="text-[11px] text-slate-500">
              Check all that apply & specify needed quantity
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
            {RELIEF_SUPPLY_ITEMS.map((item) => {
              const sel = suppliesSelection[item.key] || { selected: false, quantity: item.defaultQty };
              return (
                <div
                  key={item.key}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                    sel.selected
                      ? 'bg-slate-800/90 border-cyan-500/50 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <label className="flex items-center space-x-3 cursor-pointer flex-1 mr-2">
                    <input
                      type="checkbox"
                      checked={sel.selected}
                      onChange={() => toggleSupply(item.key)}
                      className="w-4 h-4 text-cyan-500 rounded bg-slate-900 border-slate-700 focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-white leading-tight">{item.name}</div>
                      <div className="text-[10px] text-slate-400">{item.category} • {item.unit}</div>
                    </div>
                  </label>

                  {sel.selected && (
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span className="text-[10px] text-slate-400">Qty:</span>
                      <input
                        type="number"
                        min="1"
                        value={sel.quantity}
                        onChange={(e) => updateSupplyQty(item.key, e.target.value)}
                        className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-right font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Photo Upload Attachment */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            8. Supporting Photo or Evidence (Optional)
          </label>
          <div className="border border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-4 text-center cursor-pointer bg-slate-950 relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
            <p className="text-xs text-slate-300">
              {fileName ? <span className="text-emerald-400 font-bold">{fileName}</span> : 'Click or drop disaster photos to attach'}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, or WEBP up to 10MB</p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center space-x-2 text-sm shadow-xl shadow-rose-600/25 transition-all"
        >
          <AlertTriangle className="w-5 h-5" />
          <span>{submitting ? 'Registering & Routing Emergency...' : 'Submit Emergency Report & Dispatch Request'}</span>
        </button>
      </form>
    </div>
  );
}

