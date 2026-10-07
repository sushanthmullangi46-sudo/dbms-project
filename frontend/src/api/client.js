import axios from 'axios';
import {
  mockUsers,
  mockDashboard,
  mockIncidents,
  mockRequests,
  mockMissions,
  mockMapMarkers
} from './clientData';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 4000
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

// Mock Fallback Resolver when Backend is not reached (e.g. GitHub Pages or offline)
function handleFallback(url, method, data) {
  const cleanUrl = url ? url.toLowerCase() : '';

  // Auth: Login
  if (cleanUrl.includes('/auth/login')) {
    const email = data?.email || 'admin@udrorp.com';
    const user = mockUsers[email] || mockUsers['admin@udrorp.com'];
    return {
      success: true,
      token: 'mock_jwt_token_standalone_2026',
      user
    };
  }

  // Auth: Me
  if (cleanUrl.includes('/auth/me')) {
    const saved = localStorage.getItem('udr_user');
    const user = saved ? JSON.parse(saved) : mockUsers['admin@udrorp.com'];
    return { success: true, user };
  }

  // Auth: Logout
  if (cleanUrl.includes('/auth/logout')) {
    return { success: true, message: 'Signed out' };
  }

  // Dashboard stats
  if (cleanUrl.includes('/dashboard')) {
    return { success: true, ...mockDashboard };
  }

  // Map markers
  if (cleanUrl.includes('/map/markers') || cleanUrl.includes('/map/locations')) {
    return { success: true, ...mockMapMarkers, locations: mockMapMarkers.incidents };
  }

  // Incidents
  if (cleanUrl.includes('/incidents')) {
    const idMatch = cleanUrl.match(/\/incidents\/(\d+)/);
    if (idMatch) {
      const inc = mockIncidents.find(x => x.INCIDENTID === Number(idMatch[1])) || mockIncidents[0];
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
    return { success: true, count: mockIncidents.length, incidents: mockIncidents };
  }

  // Requests
  if (cleanUrl.includes('/requests')) {
    return { success: true, count: mockRequests.length, requests: mockRequests };
  }

  // Missions
  if (cleanUrl.includes('/missions') || cleanUrl.includes('/responder/missions')) {
    const idMatch = cleanUrl.match(/\/missions\/(\d+)/);
    if (idMatch) {
      const m = mockMissions.find(x => x.MISSIONID === Number(idMatch[1])) || mockMissions[0];
      return { success: true, mission: m };
    }
    return { success: true, count: mockMissions.length, missions: mockMissions };
  }

  // Resources
  if (cleanUrl.includes('/resources/types')) {
    return {
      success: true,
      types: [
        { RESOURCETYPEID: 1001, RESOURCENAME: 'Ambulance (ALS/BLS)', CATEGORY: 'VEHICLE' },
        { RESOURCETYPEID: 1002, RESOURCENAME: 'Inflatable Rescue Boat', CATEGORY: 'EQUIPMENT' },
        { RESOURCETYPEID: 1006, RESOURCENAME: 'Medical Oxygen Cylinder 50L', CATEGORY: 'MEDICAL' }
      ]
    };
  }

  if (cleanUrl.includes('/resources') || cleanUrl.includes('/provider/resources')) {
    return {
      success: true,
      resources: [
        { RESOURCEID: 1001, RESOURCENAME: 'Inflatable Raft Zodiac 4.5m', CATEGORY: 'EQUIPMENT', QUANTITY: 4, UNIT: 'Boats', CONDITION: 'EXCELLENT', AVAILABILITYSTATUS: 'AVAILABLE' },
        { RESOURCEID: 1002, RESOURCENAME: 'Medical Oxygen 47L Kit', CATEGORY: 'MEDICAL', QUANTITY: 25, UNIT: 'Cylinders', CONDITION: 'EXCELLENT', AVAILABILITYSTATUS: 'AVAILABLE' }
      ],
      vehicles: [
        { VEHICLEID: 1001, VEHICLENAME: 'Ambulance ALS-01', REGISTRATIONNUMBER: 'KA-04-G-1102', VEHICLETYPE: 'AMBULANCE', STATUS: 'AVAILABLE' }
      ]
    };
  }

  // Shelters
  if (cleanUrl.includes('/shelters')) {
    return { success: true, count: 5, shelters: mockMapMarkers.shelters };
  }

  // Warehouses / Inventory
  if (cleanUrl.includes('/inventory') || cleanUrl.includes('/warehouses')) {
    return {
      success: true,
      warehouses: mockMapMarkers.warehouses,
      inventory: [
        { INVENTORYID: 1001, WAREHOUSENAME: 'Hebbal Reserve Depot', RESOURCENAME: 'Emergency Food Kits', QUANTITYONHAND: 2400, REORDERLEVEL: 500, UNIT: 'Kits' },
        { INVENTORYID: 1002, WAREHOUSENAME: 'Hebbal Reserve Depot', RESOURCENAME: 'Drinking Water 20L', QUANTITYONHAND: 1800, REORDERLEVEL: 400, UNIT: 'Cans' }
      ]
    };
  }

  // Reports
  if (cleanUrl.includes('/reports')) {
    return {
      success: true,
      reportName: 'Incident Response Matrix',
      data: [
        { INCIDENT: 'Bangalore North Flood', EVACUEES: 125, RESCUE_TIME: '18 mins', STATUS: 'ACTIVE' },
        { INCIDENT: 'Manyata Basement Flooding', EVACUEES: 42, RESCUE_TIME: '24 mins', STATUS: 'ACTIVE' },
        { INCIDENT: 'Yelahanka Lake Breach', EVACUEES: 210, RESCUE_TIME: '15 mins', STATUS: 'CRITICAL' }
      ]
    };
  }

  // Audit Logs
  if (cleanUrl.includes('/audit-logs')) {
    return {
      success: true,
      count: 3,
      logs: [
        { LOGID: 1001, ACTION: 'CREATE_INCIDENT', TABLENAME: 'INCIDENTS', DETAILS: 'Incident #1001 declared (CRITICAL Flood)', USERNAME: 'Director Rajesh Sharma', TIMESTAMP: '2026-10-06T04:30:00Z' },
        { LOGID: 1002, ACTION: 'ASSIGN_MISSION', TABLENAME: 'MISSIONS', DETAILS: 'Mission #1001 assigned to NDRF Alpha', USERNAME: 'Director Rajesh Sharma', TIMESTAMP: '2026-10-06T05:10:00Z' }
      ]
    };
  }

  // Mutations default
  return { success: true, message: 'Operation recorded in emergency system.' };
}

// Interceptor to handle responses and network fallbacks
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
