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
  HelpCircle
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

export default function ReportDisasterPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);

  // Form Fields
  const [disasterType, setDisasterType] = useState('Flood');
  const [locationId, setLocationId] = useState(1001);
  const [description, setDescription] = useState('');
  const [peopleAffected, setPeopleAffected] = useState(10);
  const [injuriesReported, setInjuriesReported] = useState(0);
  const [missingPersons, setMissingPersons] = useState(0);
  const [trappedPersons, setTrappedPersons] = useState(0);
  const [urgentMedicalNeeded, setUrgentMedicalNeeded] = useState(false);
  const [evacuationNeeded, setEvacuationNeeded] = useState(true);
  const [fileName, setFileName] = useState('');

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
        // Fallback default Bangalore sectors
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
      const payload = {
        location_id: Number(locationId),
        disaster_type: disasterType,
        description: description,
        people_affected: Number(peopleAffected),
        injuries_reported: Number(injuriesReported),
        missing_persons: Number(missingPersons),
        trapped_persons: Number(trappedPersons),
        urgent_medical_needed: Boolean(urgentMedicalNeeded),
        evacuation_needed: Boolean(evacuationNeeded)
      };

      const res = await api.post('/reports', payload);
      success('Stage 1 Complete: Emergency report logged in Oracle database!');
      setSubmittedReport(res);
    } catch (err) {
      error(err.message || 'Submission failed. Please check network connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedReport) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="inline-flex p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 mb-4 animate-bounce">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black text-white">Emergency Report Registered!</h2>
          <p className="text-sm text-slate-300 mt-2">
            Your report has entered the official disaster response workflow at <strong>Stage 1: SUBMITTED</strong>. 
            The Disaster Management Command Officer has been alerted.
          </p>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 my-6 text-left">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2 mb-2">
              <span className="text-xs text-slate-400">Incident Reference ID:</span>
              <span className="font-mono text-sm font-black text-rose-400">
                {submittedReport.report_reference_id}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Current Status:</span>
              <span className="font-bold text-amber-400 uppercase tracking-wide">
                {submittedReport.status} (Awaiting Officer Verification)
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(`/citizen/tracking?id=${submittedReport.report_id}`)}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 text-sm shadow-lg shadow-cyan-600/20 transition-all"
            >
              <span>Track Emergency Timeline</span>
              <ArrowRight className="w-4 h-4" />
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
          <span>Stage 1: Disaster Report Submission</span>
        </div>
        <h1 className="text-2xl font-black text-white">Report Urban Disaster or Emergency</h1>
        <p className="text-xs text-slate-400 mt-1">
          Provide accurate incident details to facilitate automated severity scoring and immediate tactical rescue team deployment.
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

        {/* Affected Location */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            2. Affected Location / Ward *
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
            3. Detailed Incident Description *
          </label>
          <textarea
            rows={4}
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
            4. Estimated Human Impact Metrics
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

        {/* Critical Flags */}
        <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-3">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            5. Urgent Intervention Requirements
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center space-x-3 p-3 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={urgentMedicalNeeded}
                onChange={(e) => setUrgentMedicalNeeded(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded bg-slate-950 border-slate-700 focus:ring-0"
              />
              <span className="text-xs font-semibold text-slate-200">Urgent Medical Assistance Required</span>
            </label>

            <label className="flex items-center space-x-3 p-3 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={evacuationNeeded}
                onChange={(e) => setEvacuationNeeded(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded bg-slate-950 border-slate-700 focus:ring-0"
              />
              <span className="text-xs font-semibold text-slate-200">Immediate Evacuation / Boat SAR Required</span>
            </label>
          </div>
        </div>

        {/* Photo Upload Attachment */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            6. Supporting Photo or Evidence (Optional)
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
          <span>{submitting ? 'Submitting & Generating Report ID...' : 'Submit Emergency Report (Stage 1)'}</span>
        </button>
      </form>
    </div>
  );
}
