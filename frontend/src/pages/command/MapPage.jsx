import React, { useState, useEffect } from 'react';
import { Map as MapIcon, RefreshCw } from 'lucide-react';
import api from '../../api/client';
import DisasterMap from '../../components/map/DisasterMap';
import Spinner from '../../components/common/Spinner';

export default function MapPage() {
  const [markers, setMarkers] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMarkers = () => {
    setLoading(true);
    api.get('/map/markers')
      .then((res) => {
        if (res.success) setMarkers(res.markers);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMarkers();
  }, []);

  return (
    <div className="space-y-4 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-emerald-400" />
            <span>Interactive Geospatial Command Map</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time coordinates extracted from Oracle Database (LOCATIONS, INCIDENTS, SHELTERS, WAREHOUSES)
          </p>
        </div>
        <button
          onClick={fetchMarkers}
          className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-brand-400" />
          <span>Sync GIS Nodes</span>
        </button>
      </div>

      <div className="flex-1 min-h-0">
        {loading ? (
          <Spinner text="Querying geographic coordinates from Oracle Database..." />
        ) : (
          <div className="h-full">
            <DisasterMap markers={markers} zoom={13} />
          </div>
        )}
      </div>
    </div>
  );
}
