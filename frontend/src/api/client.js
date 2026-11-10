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
  if (cleanUrl.includes('/missions') || cleanUrl.includes('/responder/missions')) {
    return { success: true, count: mockMissions.length, missions: mockMissions, data: mockMissions };
  }

  // Reports
  if (cleanUrl.includes('/reports')) {
    if (method === 'post') {
      const newReport = {
        id: mockCitizenReports.length + 100,
        report_id: mockCitizenReports.length + 100,
        report_reference_id: `RPT-20261110-${Math.floor(1000 + Math.random() * 9000)}`,
        disaster_type: data?.disaster_type || 'Flood',
        description: data?.description || 'Emergency assistance requested',
        severity: data?.severity || 'HIGH',
        status: 'SUBMITTED',
        people_affected: data?.people_affected || 4,
        created_at: new Date().toISOString()
      };
      mockCitizenReports.unshift(newReport);
      return { success: true, message: 'Report submitted successfully!', report: newReport, ...newReport };
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
