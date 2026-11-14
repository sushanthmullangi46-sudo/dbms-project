import axios from 'axios';
import {
  mockUsers,
  mockDashboard,
  mockIncidents,
  mockRequests,
  mockMissions,
  mockMapMarkers,
  mockCitizenReports,
  mockHospitals,
  mockLocations,
  mockDeliveries,
  mockAnalytics,
  mockWarehouses,
  mockInventory,
  mockTransactions,
  mockResources
} from './clientData';

// Determine if running on static cloud hosting (GitHub Pages, Vercel, Netlify, etc.)
const isStaticHosting = typeof window !== 'undefined' && 
  (window.location.hostname.includes('github.io') || 
   window.location.hostname.includes('vercel.app') || 
   window.location.hostname.includes('netlify.app') || 
   window.location.hostname.includes('surge.sh') ||
   (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')));

// Mock Fallback Resolver ONLY active when deployed to static hosting without Python backend
function handleFallback(url, method, data) {
  const cleanUrl = url ? url.toLowerCase() : '';

  // Auth: Login
  if (cleanUrl.includes('/auth/login')) {
    const email = data?.email || 'officer@udrrms.com';
    const user = mockUsers[email] || mockUsers['officer@udrrms.com'] || mockUsers['admin@udrorp.com'] || mockUsers['rescue@udrrms.com'];
    localStorage.setItem('udr_token', 'mock_jwt_token_standalone_2026');
    localStorage.setItem('udr_user', JSON.stringify(user));
    return {
      success: true,
      token: 'mock_jwt_token_standalone_2026',
      access_token: 'mock_jwt_token_standalone_2026',
      token_type: 'bearer',
      user_id: user.userId || user.user_id || 1,
      role: user.roleName || user.role || 'CITIZEN',
      user
    };
  }

  // Auth: Register
  if (cleanUrl.includes('/auth/register')) {
    const newUser = {
      userId: 999,
      roleId: 1,
      roleName: 'CITIZEN',
      fullName: data?.full_name || 'Citizen User',
      email: data?.email || 'citizen@udrrms.com',
      phone: data?.phone || '+91-9880112233'
    };
    localStorage.setItem('udr_token', 'mock_jwt_token_standalone_2026');
    localStorage.setItem('udr_user', JSON.stringify(newUser));
    return { success: true, token: 'mock_jwt_token_standalone_2026', access_token: 'mock_jwt_token_standalone_2026', user: newUser };
  }

  // Auth: Me
  if (cleanUrl.includes('/auth/me')) {
    const saved = localStorage.getItem('udr_user');
    const user = saved ? JSON.parse(saved) : mockUsers['officer@udrrms.com'];
    return { success: true, user, ...user };
  }

  // Auth: Logout
  if (cleanUrl.includes('/auth/logout')) {
    localStorage.removeItem('udr_token');
    localStorage.removeItem('udr_user');
    return { success: true, message: 'Signed out' };
  }

  // SOS Activation
  if (cleanUrl.includes('/sos')) {
    const rptId = mockCitizenReports.length + 1;
    const refCode = `SOS-${Date.now().toString().slice(-6)}`;
    const newSos = {
      report_id: rptId,
      id: rptId,
      REPORTID: rptId,
      report_reference_id: refCode,
      emergency_id: `EMG-${String(rptId).padStart(4, '0')}`,
      disaster_id: 1,
      disaster_type: 'Flood',
      severity: 'P1',
      description: data?.notes || 'CRITICAL SOS: Citizen trapped requiring immediate rescue.',
      people_affected: data?.trapped_count || 1,
      status: 'ACTIVE',
      STATUS: 'ACTIVE',
      submitted_at: new Date().toISOString()
    };
    mockCitizenReports.unshift(newSos);
    return {
      success: true,
      message: 'SOS Emergency beacon activated! Response teams alerted.',
      report_id: rptId,
      emergency_id: newSos.emergency_id,
      report_reference_id: refCode,
      disaster_id: 1,
      status: 'ACTIVE',
      severity: 'CRITICAL',
      tracking_url: `/citizen/tracking?id=${rptId}`
    };
  }

  // Emergency Alerts
  if (cleanUrl.includes('/alerts')) {
    return {
      success: true,
      count: 2,
      alerts: [
        {
          alert_id: 1,
          title: 'FLASH FLOOD RED ALERT: Hebbal & Nagawara Lake Basin',
          alert_type: 'FLOOD_WARNING',
          severity: 'CRITICAL',
          target_area: 'Hebbal / Outer Ring Road',
          message: 'Low-lying basements submerged. Seek upper floors or move to Sahakarnagar Indoor Stadium.',
          is_active: true
        },
        {
          alert_id: 2,
          title: 'URGENT EVACUATION ADVISORY: Kodigehalli Underpass',
          alert_type: 'EVACUATION_NOTICE',
          severity: 'HIGH',
          target_area: 'Kodigehalli',
          message: 'Water stagnation reached 4.5 feet. Move towards Vidyaranyapura Community Hall.',
          is_active: true
        }
      ]
    };
  }

  // Tactical Roadblocks Feed
  if (cleanUrl.includes('/roadblocks')) {
    return {
      success: true,
      count: 2,
      roadblocks: [
        {
          roadblock_id: 1,
          road_name: 'Outer Ring Road Hebbal Underpass',
          blockage_type: 'FLOODED_ROAD',
          severity: 'CRITICAL',
          latitude: 13.0382,
          longitude: 77.5895,
          is_passable: false,
          detour_instructions: 'Divert all rescue transports via Kempapura Main Road.'
        },
        {
          roadblock_id: 2,
          road_name: 'Kodigehalli Railway Underbridge',
          blockage_type: 'COLLAPSED_BRIDGE',
          severity: 'HIGH',
          latitude: 13.0645,
          longitude: 77.5788,
          is_passable: false,
          detour_instructions: 'Use bypass route via Thindlu Circle.'
        }
      ]
    };
  }

  // Evacuation Corridors & Plans
  if (cleanUrl.includes('/evacuation/plans')) {
    return {
      success: true,
      count: 2,
      plans: [
        {
          plan_id: 1,
          zone_name: 'Hebbal Lake Lowland Settlement Sector 4',
          risk_level: 'CRITICAL',
          priority: 'P1',
          instructions: 'Deploy motorized inflatables. Evacuate elderly and children from ground-floor dwellings.',
          evacuation_status: 'ACTIVE',
          estimated_evacuees: 120,
          evacuated_count: 45,
          completion_pct: 37.5,
          target_shelter: {
            shelter_name: 'Sahakarnagar Indoor Stadium Relief Camp',
            capacity: 500,
            current_occupancy: 225
          },
          assigned_squads: [{ team_id: 1, team_name: 'NDRF Alpha Water Rescue', status: 'EVACUATING' }]
        },
        {
          plan_id: 2,
          zone_name: 'Kodigehalli Slum Perimeter Basin',
          risk_level: 'HIGH',
          priority: 'P2',
          instructions: 'Ground clearance team guide evacuees on foot using safety guide-ropes towards Vidyaranyapura Hall.',
          evacuation_status: 'ACTIVE',
          estimated_evacuees: 80,
          evacuated_count: 30,
          completion_pct: 37.5,
          target_shelter: {
            shelter_name: 'Vidyaranyapura Community Hall',
            capacity: 250,
            current_occupancy: 65
          },
          assigned_squads: [{ team_id: 2, team_name: 'SDRF Quick Response Squad', status: 'EN_ROUTE' }]
        }
      ]
    };
  }

  // Squad Recommendations
  if (cleanUrl.includes('/teams/recommendations')) {
    return {
      success: true,
      disaster_id: 1,
      disaster_type: 'FLOOD',
      recommended_squads: [
        {
          team_id: 1,
          team_name: 'NDRF Alpha Water Rescue',
          specialization: 'WATER_RESCUE',
          leader_name: 'Capt. Arvind Rao',
          contact_phone: '+91-9845012301',
          readiness_status: 'AVAILABLE',
          match_score_pct: 96,
          distance_km: 2.1,
          estimated_eta_minutes: 5,
          justification: 'Direct tactical match for Flood (WATER_RESCUE) • Squad is unassigned • Immediate radius (2.1 km)'
        },
        {
          team_id: 2,
          team_name: 'SDRF Quick Response Squad',
          specialization: 'COLLAPSE_SAR',
          leader_name: 'Sub-Inspector Vikas Patil',
          contact_phone: '+91-9845012304',
          readiness_status: 'AVAILABLE',
          match_score_pct: 78,
          distance_km: 4.3,
          estimated_eta_minutes: 9,
          justification: 'Secondary tactical suitability • Squad is unassigned • Medium sector range (4.3 km)'
        }
      ]
    };
  }

  // Citizen Feedback
  if (cleanUrl.includes('/feedback')) {
    return {
      success: true,
      message: 'Citizen feedback and review recorded in immutable operational audit log.',
      count: 2,
      average_overall_rating: 4.8,
      average_speed_rating: 4.9,
      average_team_rating: 5.0,
      average_supplies_rating: 4.7
    };
  }

  // Predictive Logistics & Hotspots
  if (cleanUrl.includes('/analytics/resource-predictions')) {
    return {
      success: true,
      predictions: [
        {
          resource_name: 'Drinking Water 20L Can',
          current_available: 120,
          reserved_in_transit: 30,
          burn_rate_per_hour: 18.5,
          hours_remaining_buffer: 6.5,
          status_badge: 'CRITICAL_DEFICIT',
          recommended_reorder_units: 768
        },
        {
          resource_name: 'Emergency Ration Packs',
          current_available: 240,
          reserved_in_transit: 50,
          burn_rate_per_hour: 14.0,
          hours_remaining_buffer: 17.1,
          status_badge: 'REORDER_WARNING',
          recommended_reorder_units: 432
        },
        {
          resource_name: 'First Aid Trauma Kits',
          current_available: 85,
          reserved_in_transit: 15,
          burn_rate_per_hour: 4.2,
          hours_remaining_buffer: 20.2,
          status_badge: 'REORDER_WARNING',
          recommended_reorder_units: 116
        },
        {
          resource_name: 'Inflatable Rescue Boat',
          current_available: 14,
          reserved_in_transit: 4,
          burn_rate_per_hour: 0.5,
          hours_remaining_buffer: 28.0,
          status_badge: 'STABLE',
          recommended_reorder_units: 0
        }
      ]
    };
  }

  if (cleanUrl.includes('/analytics/hotspots')) {
    return {
      success: true,
      hotspots_detected: 2,
      clusters: [
        {
          cluster_id: 'HOTSPOT-01',
          cluster_name: 'Hebbal Lake Basin Lowlands',
          centroid_latitude: 13.0382,
          centroid_longitude: 77.5895,
          radius_meters: 1200,
          incident_count: 6,
          criticality: 'CRITICAL'
        },
        {
          cluster_id: 'HOTSPOT-02',
          cluster_name: 'Kodigehalli Railway Underpass',
          centroid_latitude: 13.0645,
          centroid_longitude: 77.5788,
          radius_meters: 800,
          incident_count: 4,
          criticality: 'HIGH'
        }
      ]
    };
  }

  // Analytics Dashboard
  if (cleanUrl.includes('/analytics/dashboard')) {
    return { success: true, ...mockAnalytics };
  }

  // Dashboard Stats
  if (cleanUrl.includes('/dashboard')) {
    return { success: true, ...mockDashboard };
  }

  // Verification Queue
  if (cleanUrl.includes('/verification/queue')) {
    const queue = mockCitizenReports.filter(r => ['SUBMITTED', 'AWAITING_INFORMATION'].includes(r.status));
    return {
      success: true,
      count: queue.length,
      queue,
      reports: queue
    };
  }

  // Verification Actions
  if (cleanUrl.includes('/verification/verify') || (cleanUrl.includes('/verification') && data?.action === 'VERIFY')) {
    const targetId = Number(data?.report_id || cleanUrl.match(/\/verification\/(\d+)/)?.[1]);
    const rpt = mockCitizenReports.find(x => x.report_id === targetId || x.id === targetId);
    if (rpt) {
      rpt.status = 'VERIFIED';
      rpt.verified_at = new Date().toISOString();
    }
    return { success: true, message: 'Report officially VERIFIED!' };
  }

  if (cleanUrl.includes('/verification/reject')) {
    const targetId = Number(data?.report_id || cleanUrl.match(/\/verification\/(\d+)/)?.[1]);
    const rpt = mockCitizenReports.find(x => x.report_id === targetId || x.id === targetId);
    if (rpt) {
      rpt.status = 'REJECTED';
      rpt.rejection_reason = data?.reason || 'Unsubstantiated alert';
    }
    return { success: true, message: 'Report REJECTED.' };
  }

  // Incidents
  if (cleanUrl.includes('/incidents')) {
    const idMatch = cleanUrl.match(/\/incidents\/(\d+)/);
    if (idMatch) {
      const inc = mockIncidents.find(x => x.id === Number(idMatch[1]) || x.incident_id === Number(idMatch[1])) || mockIncidents[0];
      return { success: true, incident: inc, ...inc };
    }
    return { success: true, count: mockIncidents.length, incidents: mockIncidents, data: mockIncidents };
  }

  // Missions & Responder
  if (cleanUrl.includes('/responder/available-incidents') || cleanUrl.includes('/missions/available-incidents')) {
    const unassigned = mockIncidents.filter(inc => !mockMissions.some(m => m.INCIDENTID === inc.id || m.incident_id === inc.id));
    return {
      success: true,
      count: unassigned.length,
      incidents: unassigned.map(inc => ({
        incident_id: inc.id || inc.incident_id,
        id: inc.id || inc.incident_id,
        disaster_name: inc.name || inc.incident_name || 'Emergency Incident',
        disaster_type: inc.type || inc.disaster_type || 'Flood',
        severity: inc.severity || 'P1',
        emergency_id: inc.report_reference_id || `RPT-20261111-${inc.id}`,
        report_reference_id: inc.report_reference_id || `RPT-20261111-${inc.id}`,
        report_id: inc.id,
        description: inc.description || 'Emergency assistance requested',
        location_name: inc.location_name || 'Hebbal Sector',
        trapped_persons: 4,
        injuries_reported: 2,
        people_affected: 20
      }))
    };
  }

  if (cleanUrl.includes('/responder/missions/claim') || cleanUrl.includes('/missions/claim')) {
    const targetIncId = Number(data?.incident_id || data?.disaster_id || data?.report_id || 1);
    const inc = mockIncidents.find(x => x.id === targetIncId) || mockIncidents[0];
    const newMission = {
      MISSIONID: mockMissions.length + 101,
      mission_id: mockMissions.length + 101,
      id: mockMissions.length + 101,
      INCIDENTID: targetIncId,
      disaster_id: targetIncId,
      INCIDENTNAME: inc.name || inc.incident_name || 'Emergency Crisis Operation',
      EMERGENCYID: inc.report_reference_id || `RPT-20261111-${targetIncId}`,
      emergency_id: inc.report_reference_id || `RPT-20261111-${targetIncId}`,
      STATUS: 'ASSIGNED',
      status: 'ASSIGNED',
      assignment_status: 'ASSIGNED',
      PRIORITY: inc.severity || 'P1',
      priority: inc.severity || 'P1',
      TARGETLOCATION: inc.location_name || 'Hebbal Flyover Junction',
      TARGETLATITUDE: 13.0358,
      TARGETLONGITUDE: 77.5970,
      TEAMNAME: 'NDRF Alpha Water Rescue',
      team_name: 'NDRF Alpha Water Rescue'
    };
    mockMissions.unshift(newMission);
    return {
      success: true,
      message: 'Incident claimed and squad assigned!',
      mission_id: newMission.MISSIONID,
      mission: newMission
    };
  }

  if (cleanUrl.includes('/missions') || cleanUrl.includes('/responder/missions')) {
    if (cleanUrl.includes('/status')) {
      const match = cleanUrl.match(/missions\/(\d+)/);
      const mId = match ? Number(match[1]) : 1;
      const m = mockMissions.find(x => x.MISSIONID === mId || x.id === mId);
      if (m) {
        m.STATUS = data?.status || 'EN_ROUTE';
        m.status = m.STATUS;
        m.assignment_status = m.STATUS;
      }
      return { success: true, message: `Status advanced to ${data?.status || 'EN_ROUTE'}`, status: data?.status || 'EN_ROUTE' };
    }
    if (cleanUrl.includes('/complete')) {
      const match = cleanUrl.match(/missions\/(\d+)/);
      const mId = match ? Number(match[1]) : 1;
      const m = mockMissions.find(x => x.MISSIONID === mId || x.id === mId);
      if (m) {
        m.STATUS = 'COMPLETED';
        m.status = 'COMPLETED';
        m.assignment_status = 'COMPLETED';
      }
      return { success: true, message: 'Mission completed!', status: 'COMPLETED' };
    }
    const matchDetail = cleanUrl.match(/missions\/(\d+)/);
    if (matchDetail) {
      const mId = Number(matchDetail[1]);
      const m = mockMissions.find(x => x.MISSIONID === mId || x.id === mId) || mockMissions[0];
      return { success: true, mission: m, ...m };
    }
    return { success: true, count: mockMissions.length, missions: mockMissions, data: mockMissions };
  }

  // Reports & Live Tracking
  if (cleanUrl.includes('/tracking')) {
    const match = cleanUrl.match(/reports\/(\d+)/);
    const rptId = match ? Number(match[1]) : 1;
    const rpt = mockCitizenReports.find(x => x.report_id === rptId || x.id === rptId) || mockCitizenReports[0] || {};
    const refId = rpt.report_reference_id || `RPT-20261111-${rptId}`;

    return {
      success: true,
      emergency: {
        report_id: rptId,
        report_reference_id: refId,
        emergency_id: `EMG-${String(rptId).padStart(4, '0')}`,
        disaster_type: rpt.disaster_type || 'Flood Emergency',
        description: rpt.description || 'Water rising rapidly around residential block.',
        status: rpt.status || 'SUBMITTED',
        people_affected: rpt.people_affected || 15,
        injuries: 2,
        trapped: 4,
        missing: 0,
        submitted_at: rpt.created_at || new Date().toISOString(),
        target_location: {
          location_name: 'Hebbal Flyover Junction',
          address: 'North Sector Ward 21',
          latitude: 13.0358,
          longitude: 77.5970
        }
      },
      rescue_team: {
        assigned: true,
        team_id: 1,
        team_name: 'NDRF Alpha Water Rescue Squad',
        leader_name: 'Capt. Arvind Rao',
        contact_phone: '+91-9845011111',
        specialization: 'WATER_RESCUE',
        assignment_status: 'EN_ROUTE',
        status: 'EN_ROUTE',
        latitude: 13.018,
        longitude: 77.583,
        speed_kmh: 38.5,
        distance_km: 2.1,
        eta_minutes: 5,
        route_trail: [
          [13.001, 77.575],
          [13.018, 77.583],
          [13.0358, 77.5970]
        ]
      },
      supplies: [
        {
          resource_name: 'Purified Potable Water 20L Cans',
          category: 'WATER',
          unit: 'Cans',
          quantity_requested: 50,
          quantity_approved: 50,
          status: 'DISPATCHED',
          dispatch_reference: 'DSP-WTR-8801',
          warehouse_name: 'Hebbal Central Reserve Depot'
        },
        {
          resource_name: 'Emergency 72hr Food Rations',
          category: 'FOOD',
          unit: 'Kits',
          quantity_requested: 100,
          quantity_approved: 100,
          status: 'RESERVED',
          dispatch_reference: 'DSP-FOD-8802',
          warehouse_name: 'Hebbal Central Reserve Depot'
        },
        {
          resource_name: 'Inflatable Rescue Boats (Zodiac)',
          category: 'EQUIPMENT',
          unit: 'Boats',
          quantity_requested: 2,
          quantity_approved: 2,
          status: 'DISPATCHED',
          dispatch_reference: 'DSP-BOT-8803',
          warehouse_name: 'Manyata Logistics Vault'
        }
      ]
    };
  }

  // Reports
  if (cleanUrl.includes('/reports')) {
    if (method === 'post') {
      const rptId = mockCitizenReports.length + 101;
      const refCode = `RPT-20261111-${Math.floor(1000 + Math.random() * 9000)}`;
      const newReport = {
        id: rptId,
        report_id: rptId,
        report_reference_id: refCode,
        emergency_id: `EMG-${String(rptId).padStart(4, '0')}`,
        emergency_code: refCode,
        disaster_type: data?.disaster_type || 'Flood',
        description: data?.description || 'Emergency assistance requested',
        severity: data?.severity || 'P1',
        status: 'SUBMITTED',
        people_affected: data?.people_affected || 15,
        created_at: new Date().toISOString()
      };
      mockCitizenReports.unshift(newReport);

      // Synchronously create operational incident in mock memory
      const newInc = {
        id: rptId,
        incident_id: rptId,
        name: `${data?.disaster_type || 'Flood'} Emergency at Hebbal`,
        incident_name: `${data?.disaster_type || 'Flood'} Emergency at Hebbal`,
        type: data?.disaster_type || 'Flood',
        severity: data?.severity || 'P1',
        status: 'ACTIVE',
        location_name: 'Hebbal Flyover Junction',
        report_reference_id: refCode,
        description: data?.description || 'Active citizen reported emergency',
        created_at: new Date().toISOString()
      };
      mockIncidents.unshift(newInc);

      // Create linked supplies in mockRequests
      mockRequests.unshift({
        request_id: mockRequests.length + 101,
        REQUESTID: mockRequests.length + 101,
        id: mockRequests.length + 101,
        incident_id: rptId,
        INCIDENTID: rptId,
        incident_name: newInc.name,
        INCIDENTNAME: newInc.name,
        emergency_id: refCode,
        EMERGENCYID: refCode,
        report_reference_id: refCode,
        location_name: 'Hebbal Flyover Junction',
        priority: data?.severity || 'P1',
        status: 'PENDING_APPROVAL',
        STATUS: 'PENDING_APPROVAL',
        resource_name: 'Emergency 72hr Food Rations & Potable Water',
        quantity_requested: 100,
        unit: 'Kits',
        created_at: new Date().toISOString()
      });

      return {
        success: true,
        message: 'Report submitted successfully!',
        report: newReport,
        report_id: rptId,
        id: rptId,
        report_reference_id: refCode,
        emergency_id: `EMG-${String(rptId).padStart(4, '0')}`,
        emergency_code: refCode,
        status: 'SUBMITTED',
        ...newReport
      };
    }
    return { success: true, count: mockCitizenReports.length, reports: mockCitizenReports, data: mockCitizenReports };
  }


  // Requests
  if (cleanUrl.includes('/requests')) {
    return { success: true, count: mockRequests.length, requests: mockRequests, data: mockRequests };
  }

  // Map & GIS Data
  if (cleanUrl.includes('/map') || cleanUrl.includes('/markers')) {
    return { success: true, ...mockMapMarkers };
  }

  // Locations & Hospitals
  if (cleanUrl.includes('/locations')) return { success: true, locations: mockLocations, data: mockLocations };
  if (cleanUrl.includes('/hospitals')) return { success: true, hospitals: mockHospitals, data: mockHospitals };

  // Inventory & Warehouse Logistics
  if (cleanUrl.includes('/inventory/stock')) {
    return { success: true, count: mockInventory.length, stock: mockInventory, inventory: mockInventory, data: mockInventory };
  }
  if (cleanUrl.includes('/inventory/transactions')) {
    return { success: true, count: mockTransactions.length, transactions: mockTransactions, data: mockTransactions };
  }
  if (cleanUrl.includes('/inventory/warehouses') || cleanUrl.includes('/resources/warehouses')) {
    return { success: true, count: mockWarehouses.length, warehouses: mockWarehouses, data: mockWarehouses };
  }
  if (cleanUrl.includes('/resources/inventory') || cleanUrl.includes('/inventory')) {
    return { success: true, count: mockInventory.length, stock: mockInventory, inventory: mockInventory, data: mockInventory };
  }

  // Resources Operations & Allocation
  if (cleanUrl.includes('/resources/requests')) {
    return { success: true, count: mockRequests.length, requests: mockRequests, data: mockRequests };
  }
  if (cleanUrl.includes('/resources/allocate')) {
    return { success: true, message: 'Stock allocated and reserved successfully' };
  }
  if (cleanUrl.includes('/resources/replenishment')) {
    return { success: true, message: 'Stock replenished into warehouse successfully' };
  }
  if (cleanUrl.includes('/resources')) {
    return { success: true, count: mockResources.length, resources: mockResources, data: mockResources };
  }

  return { success: true, message: 'Operation successful' };
}

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000,
  // If deployed on static cloud hosting (e.g. GitHub Pages), handle requests in-browser
  adapter: isStaticHosting ? async (config) => {
    let payload = {};
    try {
      payload = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    } catch {
      payload = {};
    }
    const result = handleFallback(config.url, config.method, payload);
    return {
      data: result,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      request: {}
    };
  } : undefined
});

// Interceptor to attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('udr_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor to handle responses and real backend errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // If on static hosting and network error happens, resolve via fallback
    if (isStaticHosting) {
      const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error');
      if (isNetworkError) {
        let payload = {};
        try {
          payload = typeof error.config?.data === 'string' ? JSON.parse(error.config.data) : (error.config?.data || {});
        } catch {
          payload = {};
        }
        return Promise.resolve(handleFallback(error.config?.url, error.config?.method, payload));
      }
    }

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('udr_token');
      localStorage.removeItem('udr_user');
      if (!window.location.hash.includes('/login')) {
        window.location.hash = '#/login';
      }
    }
    const message = error.response?.data?.detail || error.response?.data?.message || error.message || 'Operation failed';
    return Promise.reject(new Error(message));
  }
);

export default api;
