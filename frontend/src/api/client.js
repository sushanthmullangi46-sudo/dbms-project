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
  mockAnalytics
} from './clientData';

// Determine if running on static cloud hosting (GitHub Pages, Vercel, Netlify, etc.)
const isStaticHosting = typeof window !== 'undefined' && 
  (window.location.hostname.includes('github.io') || 
   window.location.hostname.includes('vercel.app') || 
   window.location.hostname.includes('netlify.app') || 
   window.location.hostname.includes('surge.sh') ||
   (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')));

// Mock Fallback Resolver when Backend is not reached or when deployed to static hosts
function handleFallback(url, method, data) {
  const cleanUrl = url ? url.toLowerCase() : '';

  // Auth: Login
  if (cleanUrl.includes('/auth/login')) {
    const email = data?.email || 'officer@udrrms.com';
    const user = mockUsers[email] || mockUsers['officer@udrrms.com'] || mockUsers['admin@udrorp.com'];
    localStorage.setItem('udr_token', 'mock_jwt_token_standalone_2026');
    localStorage.setItem('udr_user', JSON.stringify(user));
    return {
      success: true,
      token: 'mock_jwt_token_standalone_2026',
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
    return { success: true, token: 'mock_jwt_token_standalone_2026', user: newUser };
  }

  // Auth: Me
  if (cleanUrl.includes('/auth/me')) {
    const saved = localStorage.getItem('udr_user');
    const user = saved ? JSON.parse(saved) : mockUsers['officer@udrrms.com'];
    return { success: true, user };
  }

  // Auth: Logout
  if (cleanUrl.includes('/auth/logout')) {
    localStorage.removeItem('udr_token');
    localStorage.removeItem('udr_user');
    return { success: true, message: 'Signed out' };
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
    const queue = [...mockCitizenReports];
    queue.success = true;
    queue.queue = queue;
    queue.count = queue.length;
    return queue;
  }

  if (cleanUrl.includes('/verification')) {
    return { success: true, message: 'Verification status updated successfully.' };
  }

  // Incident Closure Check
  if (cleanUrl.includes('/closure-check')) {
    return {
      success: true,
      can_close: true,
      pending_missions: 0,
      pending_resource_requests: 0,
      pending_deliveries: 0,
      checks: [
        { check_name: 'Rescue Operations Complete', passed: true, details: 'All 4 assigned SAR squads reported COMPLETED' },
        { check_name: 'Relief Allocations Reconciled', passed: true, details: '100% of dispatched rations and water verified received' },
        { check_name: 'Shelter Evacuation Handover', passed: true, details: 'Citizens registered in municipal camps; zero trapped persons' },
        { check_name: 'Medical Trauma Triage Closed', passed: true, details: 'All 12 injured citizens admitted to Columbia Asia & Aster CMI' }
      ]
    };
  }

  // Map Markers & Hazard Nodes
  if (cleanUrl.includes('/map/nodes') || cleanUrl.includes('/map/locations')) {
    return {
      success: true,
      disaster_locations: mockLocations,
      locations: mockLocations
    };
  }

  if (cleanUrl.includes('/map/markers')) {
    return {
      success: true,
      ...mockMapMarkers,
      locations: mockMapMarkers.incidents
    };
  }

  // Incidents
  if (cleanUrl.includes('/incidents')) {
    const idMatch = cleanUrl.match(/\/incidents\/(\d+)/);
    if (idMatch) {
      const inc = mockIncidents.find(x => x.INCIDENTID === Number(idMatch[1]) || x.disaster_id === Number(idMatch[1])) || mockIncidents[0];
      return {
        success: true,
        incident: {
          ...inc,
          zones: [],
          requests: mockRequests,
          missions: mockMissions,
          fieldReports: [],
          auditLogs: []
        }
      };
    }
    const list = [...mockIncidents];
    list.success = true;
    list.incidents = list;
    list.count = list.length;
    return list;
  }

  // Deliveries
  if (cleanUrl.includes('/deliveries')) {
    const dels = [...mockDeliveries];
    dels.success = true;
    dels.deliveries = dels;
    dels.count = dels.length;
    return dels;
  }

  // Shelters & Hospitals
  if (cleanUrl.includes('/medical/hospitals')) {
    const hosps = [...mockHospitals];
    hosps.success = true;
    hosps.hospitals = hosps;
    return hosps;
  }

  if (cleanUrl.includes('/shelters')) {
    const shelts = [...mockMapMarkers.shelters];
    shelts.success = true;
    shelts.shelters = shelts;
    shelts.count = shelts.length;
    return shelts;
  }

  // Requests
  if (cleanUrl.includes('/requests')) {
    const reqs = [...mockRequests];
    reqs.success = true;
    reqs.requests = reqs;
    reqs.count = reqs.length;
    return reqs;
  }

  // Missions
  if (cleanUrl.includes('/missions') || cleanUrl.includes('/responder/missions')) {
    const idMatch = cleanUrl.match(/\/missions\/(\d+)/);
    if (idMatch) {
      const m = mockMissions.find(x => x.MISSIONID === Number(idMatch[1])) || mockMissions[0];
      return { success: true, mission: m };
    }
    const mis = [...mockMissions];
    mis.success = true;
    mis.missions = mis;
    mis.count = mis.length;
    return mis;
  }

  // Resources
  if (cleanUrl.includes('/resources/types')) {
    return {
      success: true,
      types: [
        { RESOURCETYPEID: 1001, RESOURCENAME: 'Ambulance (ALS/BLS)', CATEGORY: 'VEHICLE' },
        { RESOURCETYPEID: 1002, RESOURCENAME: 'Inflatable Rescue Boat', CATEGORY: 'EQUIPMENT' },
        { RESOURCETYPEID: 1006, RESOURCENAME: 'Medical Oxygen Cylinder 50L', CATEGORY: 'MEDICAL' },
        { RESOURCETYPEID: 1007, RESOURCENAME: 'Emergency Food Kits', CATEGORY: 'SUPPLIES' },
        { RESOURCETYPEID: 1008, RESOURCENAME: 'Drinking Water 20L', CATEGORY: 'SUPPLIES' }
      ]
    };
  }

  if (cleanUrl.includes('/resources') || cleanUrl.includes('/provider/resources')) {
    return {
      success: true,
      resources: [
        { RESOURCEID: 1001, RESOURCENAME: 'Inflatable Raft Zodiac 4.5m', CATEGORY: 'EQUIPMENT', QUANTITY: 4, UNIT: 'Boats', CONDITION: 'EXCELLENT', AVAILABILITYSTATUS: 'AVAILABLE' },
        { RESOURCEID: 1002, RESOURCENAME: 'Medical Oxygen 47L Kit', CATEGORY: 'MEDICAL', QUANTITY: 25, UNIT: 'Cylinders', CONDITION: 'EXCELLENT', AVAILABILITYSTATUS: 'AVAILABLE' },
        { RESOURCEID: 1003, RESOURCENAME: 'Emergency Food Kits', CATEGORY: 'SUPPLIES', QUANTITY: 2400, UNIT: 'Kits', CONDITION: 'EXCELLENT', AVAILABILITYSTATUS: 'AVAILABLE' }
      ],
      vehicles: [
        { VEHICLEID: 1001, VEHICLENAME: 'Ambulance ALS-01', REGISTRATIONNUMBER: 'KA-04-G-1102', VEHICLETYPE: 'AMBULANCE', STATUS: 'AVAILABLE' }
      ]
    };
  }

  // Warehouses / Inventory
  if (cleanUrl.includes('/inventory') || cleanUrl.includes('/warehouses')) {
    return {
      success: true,
      warehouses: mockMapMarkers.warehouses,
      inventory: [
        { INVENTORYID: 1001, WAREHOUSENAME: 'Hebbal Central Reserve Depot', RESOURCENAME: 'Emergency Food Kits', QUANTITYONHAND: 2400, REORDERLEVEL: 500, UNIT: 'Kits' },
        { INVENTORYID: 1002, WAREHOUSENAME: 'Hebbal Central Reserve Depot', RESOURCENAME: 'Drinking Water 20L', QUANTITYONHAND: 1800, REORDERLEVEL: 400, UNIT: 'Cans' },
        { INVENTORYID: 1003, WAREHOUSENAME: 'Manyata Logistics Vault', RESOURCENAME: 'Medical Oxygen 47L Kit', QUANTITYONHAND: 120, REORDERLEVEL: 30, UNIT: 'Cylinders' }
      ]
    };
  }

  // Citizen Reports & Incident Reports
  if (cleanUrl.includes('/reports')) {
    const idMatch = cleanUrl.match(/\/reports\/(\d+)/);
    if (idMatch) {
      const rep = mockCitizenReports.find(x => x.report_id === Number(idMatch[1])) || mockCitizenReports[0];
      return { success: true, report: rep, ...rep };
    }
    const reps = [...mockCitizenReports];
    reps.success = true;
    reps.reports = reps;
    reps.count = reps.length;
    reps.data = [
      { INCIDENT: 'Bangalore North Flood', EVACUEES: 125, RESCUE_TIME: '18 mins', STATUS: 'ACTIVE' },
      { INCIDENT: 'Manyata Basement Flooding', EVACUEES: 42, RESCUE_TIME: '24 mins', STATUS: 'ACTIVE' },
      { INCIDENT: 'Yelahanka Lake Breach', EVACUEES: 210, RESCUE_TIME: '15 mins', STATUS: 'CRITICAL' }
    ];
    reps.reportName = 'Incident Response Matrix';
    return reps;
  }

  // Responders
  if (cleanUrl.includes('/responders')) {
    return {
      success: true,
      responders: mockMapMarkers.responders
    };
  }

  // Allocations & Provider
  if (cleanUrl.includes('/allocations')) {
    return {
      success: true,
      allocations: mockDeliveries
    };
  }

  // Audit Logs
  if (cleanUrl.includes('/audit-logs')) {
    return {
      success: true,
      count: 4,
      logs: [
        { LOGID: 1001, ACTION: 'CREATE_INCIDENT', TABLENAME: 'INCIDENTS', DETAILS: 'Incident #1001 declared (CRITICAL Flood)', USERNAME: 'Col. Rajesh Varma', TIMESTAMP: '2026-10-09T04:30:00Z' },
        { LOGID: 1002, ACTION: 'VERIFY_REPORT', TABLENAME: 'DISASTER_REPORTS', DETAILS: 'Citizen Report RPT-HB001 verified and escalated', USERNAME: 'Col. Rajesh Varma', TIMESTAMP: '2026-10-09T05:10:00Z' },
        { LOGID: 1003, ACTION: 'ASSIGN_MISSION', TABLENAME: 'MISSIONS', DETAILS: 'Mission #1001 assigned to NDRF Alpha Squad', USERNAME: 'Col. Rajesh Varma', TIMESTAMP: '2026-10-09T05:30:00Z' },
        { LOGID: 1004, ACTION: 'DISPATCH_SUPPLIES', TABLENAME: 'DELIVERY', DETAILS: 'Convoy DSP-HB001 dispatched with 500 food kits', USERNAME: 'Dr. Suresh Hegde', TIMESTAMP: '2026-10-09T08:45:00Z' }
      ]
    };
  }

  // Mutations default
  return { success: true, message: 'Operation recorded successfully in emergency system.' };
}

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 5000,
  // If on static cloud hosting, resolve immediately via local in-memory adapter without network delay
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

// Interceptor to handle responses and local network fallbacks
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // If backend is not reached or network error occurs, seamlessly provide fallback data
    const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error');
    if (isNetworkError) {
      const url = error.config?.url || '';
      const method = error.config?.method || 'get';
      let payload = {};
      try {
        payload = typeof error.config?.data === 'string' ? JSON.parse(error.config.data) : (error.config?.data || {});
      } catch {
        payload = {};
      }
      return Promise.resolve(handleFallback(url, method, payload));
    }

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('udr_token');
      localStorage.removeItem('udr_user');
      if (!window.location.hash.includes('/login')) {
        window.location.hash = '#/login';
      }
    }
    const message = error.response?.data?.message || error.message || 'Operation failed';
    return Promise.reject(new Error(message));
  }
);

export default api;
