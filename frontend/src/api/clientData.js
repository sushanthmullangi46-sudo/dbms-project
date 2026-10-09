/**
 * In-browser fallback data for standalone deployments (e.g. GitHub Pages)
 * Matches Bangalore North Zone Flood dataset with complete fidelity
 */

export const mockUsers = {
  'citizen@udrrms.com': {
    userId: 1,
    roleId: 1,
    roleName: 'CITIZEN',
    fullName: 'Aarav Sharma (Citizen)',
    email: 'citizen@udrrms.com',
    phone: '+91-9880112233'
  },
  'officer@udrrms.com': {
    userId: 2,
    roleId: 2,
    roleName: 'DISASTER_OFFICER',
    fullName: 'Col. Rajesh Varma (Chief Officer)',
    email: 'officer@udrrms.com',
    phone: '+91-9880223344'
  },
  'coordinator@udrrms.com': {
    userId: 3,
    roleId: 3,
    roleName: 'COORDINATOR',
    fullName: 'Dr. Suresh Hegde (Relief Coordinator)',
    email: 'coordinator@udrrms.com',
    phone: '+91-9880334455'
  },
  'admin@udrorp.com': {
    userId: 2,
    roleId: 2,
    roleName: 'DISASTER_OFFICER',
    fullName: 'Director Rajesh Sharma',
    email: 'admin@udrorp.com',
    phone: '+91-9880112233'
  },
  'responder@udrorp.com': {
    userId: 1004,
    roleId: 2,
    roleName: 'FIELD_RESPONDER',
    fullName: 'Captain Arvind Rao',
    email: 'responder@udrorp.com',
    phone: '+91-9845012345'
  },
  'provider@udrorp.com': {
    userId: 3,
    roleId: 3,
    roleName: 'COORDINATOR',
    fullName: 'Apex Medical Supplies Ltd',
    email: 'provider@udrorp.com',
    phone: '+91-8023456781'
  }
};

export const mockDashboard = {
  stats: {
    activeIncidents: 4,
    criticalIncidents: 2,
    pendingRequests: 5,
    activeMissions: 3,
    availableResponders: 8,
    deployedResponders: 6,
    totalShelters: 5,
    openShelters: 4,
    shelterCapacity: 1650,
    currentEvacuees: 610,
    shelterOccupancyPct: 37,
    availableResourcesCount: 42
  },
  recentIncidents: [
    {
      INCIDENTID: 1001,
      INCIDENTNAME: 'Bangalore North Zone Flash Flood',
      INCIDENTTYPE: 'FLOOD',
      SEVERITY: 'CRITICAL',
      LOCATIONNAME: 'Hebbal Flyover Junction',
      STARTTIME: '2026-10-06T04:30:00Z',
      REQUESTCOUNT: 6,
      MISSIONCOUNT: 3
    },
    {
      INCIDENTID: 1002,
      INCIDENTNAME: 'Manyata Commercial Basement Inundation',
      INCIDENTTYPE: 'FLOOD',
      SEVERITY: 'HIGH',
      LOCATIONNAME: 'Manyata Embassy Business Park',
      STARTTIME: '2026-10-06T05:15:00Z',
      REQUESTCOUNT: 3,
      MISSIONCOUNT: 1
    },
    {
      INCIDENTID: 1003,
      INCIDENTNAME: 'Yelahanka Lake Breach & Silt Flow',
      INCIDENTTYPE: 'STRUCTURAL_COLLAPSE',
      SEVERITY: 'CRITICAL',
      LOCATIONNAME: 'Yelahanka Old Town Lake Basin',
      STARTTIME: '2026-10-06T06:00:00Z',
      REQUESTCOUNT: 5,
      MISSIONCOUNT: 2
    }
  ],
  recentRequests: [
    {
      REQUESTID: 1001,
      REQUESTTYPE: 'EVACUATION',
      PRIORITY: 'CRITICAL',
      PEOPLEAFFECTED: 45,
      STATUS: 'ASSIGNED',
      LOCATIONNAME: 'Hebbal Flyover Junction',
      DESCRIPTION: '45 residents marooned on terrace surrounded by 5ft water.',
      CREATEDAT: '2026-10-06T05:00:00Z'
    },
    {
      REQUESTID: 1002,
      REQUESTTYPE: 'MEDICAL_AID',
      PRIORITY: 'CRITICAL',
      PEOPLEAFFECTED: 3,
      STATUS: 'ASSIGNED',
      LOCATIONNAME: 'Hebbal Flyover Junction',
      DESCRIPTION: 'Elderly diabetic patients with failing dialysis and hypothermia.',
      CREATEDAT: '2026-10-06T05:20:00Z'
    }
  ]
};

export const mockIncidents = [
  {
    INCIDENTID: 1001,
    disaster_id: 1001,
    incident_code: 'INC-20261009-BLR01',
    INCIDENTNAME: 'Bangalore North Zone Flash Flood',
    disaster_name: 'Bangalore North Zone Flash Flood',
    INCIDENTTYPE: 'FLOOD',
    disaster_type: 'Flood',
    SEVERITY: 'CRITICAL',
    severity_level: 'CRITICAL',
    STATUS: 'ACTIVE',
    status: 'ACTIVE',
    STARTTIME: '2026-10-06T04:30:00Z',
    LOCATIONNAME: 'Hebbal Flyover Junction',
    location_name: 'Hebbal Flyover Junction',
    ward_name: 'Hebbal Ward 21',
    CITY: 'Bangalore',
    LATITUDE: 13.0358,
    LONGITUDE: 77.5970,
    RISKZONE: 'CRITICAL',
    CREATEDBYNAME: 'Director Rajesh Sharma',
    REQUESTCOUNT: 6,
    MISSIONCOUNT: 3,
    DESCRIPTION: 'Severe cloudburst caused breach of secondary canal walls at Hebbal-Nagawara cascade.'
  },
  {
    INCIDENTID: 1002,
    disaster_id: 1002,
    incident_code: 'INC-20261009-BLR02',
    INCIDENTNAME: 'Manyata Commercial Basement Inundation',
    disaster_name: 'Manyata Commercial Basement Inundation',
    INCIDENTTYPE: 'FLOOD',
    disaster_type: 'Flash Flood',
    SEVERITY: 'HIGH',
    severity_level: 'HIGH',
    STATUS: 'ACTIVE',
    status: 'ACTIVE',
    STARTTIME: '2026-10-06T05:15:00Z',
    LOCATIONNAME: 'Manyata Embassy Business Park',
    location_name: 'Manyata Embassy Business Park',
    ward_name: 'Nagawara Ward 23',
    CITY: 'Bangalore',
    LATITUDE: 13.0475,
    LONGITUDE: 77.6200,
    RISKZONE: 'HIGH',
    CREATEDBYNAME: 'Director Rajesh Sharma',
    REQUESTCOUNT: 3,
    MISSIONCOUNT: 1,
    DESCRIPTION: 'Basement levels 1 and 2 submerged with vehicle traps and power substation short-circuits.'
  },
  {
    INCIDENTID: 1003,
    disaster_id: 1003,
    incident_code: 'INC-20261009-BLR03',
    INCIDENTNAME: 'Yelahanka Lake Breach & Silt Flow',
    disaster_name: 'Yelahanka Lake Breach & Silt Flow',
    INCIDENTTYPE: 'STRUCTURAL_COLLAPSE',
    disaster_type: 'Structural Collapse',
    SEVERITY: 'CRITICAL',
    severity_level: 'CRITICAL',
    STATUS: 'ACTIVE',
    status: 'ACTIVE',
    STARTTIME: '2026-10-06T06:00:00Z',
    LOCATIONNAME: 'Yelahanka Old Town Lake Basin',
    location_name: 'Yelahanka Old Town Lake Basin',
    ward_name: 'Yelahanka Ward 4',
    CITY: 'Bangalore',
    LATITUDE: 13.1007,
    LONGITUDE: 77.5963,
    RISKZONE: 'CRITICAL',
    CREATEDBYNAME: 'Duty Officer Anita Menon',
    REQUESTCOUNT: 5,
    MISSIONCOUNT: 2,
    DESCRIPTION: 'Earthen bund wall washed away; water entering low-lying residential layouts.'
  }
];

export const mockRequests = [
  {
    REQUESTID: 1001,
    INCIDENTID: 1001,
    REQUESTTYPE: 'EVACUATION',
    PRIORITY: 'CRITICAL',
    PEOPLEAFFECTED: 45,
    STATUS: 'ASSIGNED',
    DESCRIPTION: '45 residents marooned on terrace of Sterling Park Apartments surrounded by 5ft water.',
    CREATEDAT: '2026-10-06T05:00:00Z',
    INCIDENTNAME: 'Bangalore North Zone Flash Flood',
    LOCATIONNAME: 'Hebbal Flyover Junction',
    RESOURCENAME: 'Inflatable Rescue Boat'
  },
  {
    REQUESTID: 1002,
    INCIDENTID: 1001,
    REQUESTTYPE: 'MEDICAL_AID',
    PRIORITY: 'CRITICAL',
    PEOPLEAFFECTED: 3,
    STATUS: 'ASSIGNED',
    DESCRIPTION: 'Elderly diabetic patients with failing dialysis and hypothermia symptoms.',
    CREATEDAT: '2026-10-06T05:20:00Z',
    INCIDENTNAME: 'Bangalore North Zone Flash Flood',
    LOCATIONNAME: 'Hebbal Flyover Junction',
    RESOURCENAME: 'Ambulance (ALS/BLS)'
  },
  {
    REQUESTID: 1003,
    INCIDENTID: 1002,
    REQUESTTYPE: 'RESOURCE',
    PRIORITY: 'HIGH',
    PEOPLEAFFECTED: 0,
    STATUS: 'PENDING',
    DESCRIPTION: 'Commercial power generation room flooding; emergency sump dewatering needed.',
    CREATEDAT: '2026-10-06T05:40:00Z',
    INCIDENTNAME: 'Manyata Commercial Basement Inundation',
    LOCATIONNAME: 'Manyata Embassy Business Park',
    RESOURCENAME: 'Water De-Watering Heavy Pump'
  }
];

export const mockMissions = [
  {
    MISSIONID: 1001,
    REQUESTID: 1001,
    RESPONDERID: 1001,
    VEHICLEID: 1002,
    PRIORITY: 'CRITICAL',
    STATUS: 'IN_PROGRESS',
    STARTTIME: '2026-10-06T05:10:00Z',
    INCIDENTNAME: 'Bangalore North Zone Flash Flood',
    TARGETLOCATION: 'Hebbal Flyover Junction',
    TARGETADDRESS: 'Bellary Rd & Outer Ring Rd, Hebbal',
    TEAMNAME: 'NDRF 10th Bn Alpha Squad',
    VEHICLENUMBER: 'KA-04-BT-09',
    VEHICLETYPE: 'BOAT',
    resources: [
      { RESOURCEID: 1001, RESOURCENAME: 'Motorized Inflatable Raft Zodiac 4.5m', CATEGORY: 'EQUIPMENT', QUANTITYALLOCATED: 2, UNIT: 'Boats' }
    ],
    fieldReports: [
      { REPORTID: 1001, REPORTTYPE: 'ROAD_BLOCKED', DESCRIPTION: 'Hebbal Flyover ramp submerged under 4.5ft water; access by wheel vehicles impassable.', CREATEDAT: '2026-10-06T05:35:00Z' },
      { REPORTID: 1002, REPORTTYPE: 'MISSION_UPDATE', DESCRIPTION: '18 residents evacuated safely to Sahakarnagar Relief Shelter.', CREATEDAT: '2026-10-06T06:10:00Z' }
    ]
  },
  {
    MISSIONID: 1002,
    REQUESTID: 1002,
    RESPONDERID: 1002,
    VEHICLEID: 1001,
    PRIORITY: 'CRITICAL',
    STATUS: 'EN_ROUTE',
    STARTTIME: '2026-10-06T05:30:00Z',
    INCIDENTNAME: 'Bangalore North Zone Flash Flood',
    TARGETLOCATION: 'Hebbal Flyover Junction',
    TARGETADDRESS: 'Bellary Rd & Outer Ring Rd, Hebbal',
    TEAMNAME: 'EMS Trauma Response Unit 1',
    VEHICLENUMBER: 'KA-04-G-1102',
    VEHICLETYPE: 'AMBULANCE',
    resources: [
      { RESOURCEID: 1002, RESOURCENAME: 'Medical Oxygen Cylinder 50L', CATEGORY: 'MEDICAL', QUANTITYALLOCATED: 4, UNIT: 'Cylinders' }
    ],
    fieldReports: []
  }
];

export const mockMapMarkers = {
  incidents: [
    { id: 1001, INCIDENTID: 1001, title: 'Bangalore North Zone Flash Flood', INCIDENTNAME: 'Bangalore North Zone Flash Flood', type: 'FLOOD', INCIDENTTYPE: 'FLOOD', severity: 'CRITICAL', SEVERITY: 'CRITICAL', status: 'ACTIVE', STATUS: 'ACTIVE', lat: 13.0358, lng: 77.5970, LATITUDE: 13.0358, LONGITUDE: 77.5970, location: 'Hebbal Flyover Junction', LOCATIONNAME: 'Hebbal Flyover Junction', description: 'Canal breach causing 5ft deep inundation of arterial roads' },
    { id: 1002, INCIDENTID: 1002, title: 'Manyata Commercial Basement Inundation', INCIDENTNAME: 'Manyata Commercial Basement Inundation', type: 'FLOOD', INCIDENTTYPE: 'FLOOD', severity: 'HIGH', SEVERITY: 'HIGH', status: 'ACTIVE', STATUS: 'ACTIVE', lat: 13.0475, lng: 77.6200, LATITUDE: 13.0475, LONGITUDE: 77.6200, location: 'Manyata Embassy Business Park', LOCATIONNAME: 'Manyata Embassy Business Park', description: 'Basement levels 1 and 2 flooded with vehicle traps' },
    { id: 1003, INCIDENTID: 1003, title: 'Yelahanka Lake Breach & Silt Flow', INCIDENTNAME: 'Yelahanka Lake Breach & Silt Flow', type: 'STRUCTURAL_COLLAPSE', INCIDENTTYPE: 'STRUCTURAL_COLLAPSE', severity: 'CRITICAL', SEVERITY: 'CRITICAL', status: 'ACTIVE', STATUS: 'ACTIVE', lat: 13.1007, lng: 77.5963, LATITUDE: 13.1007, LONGITUDE: 77.5963, location: 'Yelahanka Old Town Lake Basin', LOCATIONNAME: 'Yelahanka Old Town Lake Basin', description: 'Retaining wall failure, rapid silt water surge into homes' }
  ],
  shelters: [
    { id: 1001, SHELTERID: 1001, title: 'Sahakarnagar Indoor Stadium Shelter', SHELTERNAME: 'Sahakarnagar Indoor Stadium Shelter', capacity: 500, CAPACITY: 500, occupancy: 180, CURRENTOCCUPANCY: 180, status: 'OPEN', STATUS: 'OPEN', lat: 13.0623, lng: 77.5871, LATITUDE: 13.0623, LONGITUDE: 77.5871, location: 'Sahakarnagar Community Hub' },
    { id: 1002, SHELTERID: 1002, title: 'Jakkur Government High School Camp', SHELTERNAME: 'Jakkur Government High School Camp', capacity: 300, CAPACITY: 300, occupancy: 140, CURRENTOCCUPANCY: 140, status: 'OPEN', STATUS: 'OPEN', lat: 13.0784, lng: 77.6048, LATITUDE: 13.0784, LONGITUDE: 77.6048, location: 'Jakkur Aerodrome Sector' }
  ],
  warehouses: [
    { id: 1001, WAREHOUSEID: 1001, title: 'Hebbal Central Disaster Reserve Depot', WAREHOUSENAME: 'Hebbal Central Disaster Reserve Depot', capacity: 10000, CAPACITY: 10000, status: 'ACTIVE', STATUS: 'ACTIVE', lat: 13.0358, lng: 77.5970, LATITUDE: 13.0358, LONGITUDE: 77.5970, location: 'Hebbal Logistics Hub' },
    { id: 1002, WAREHOUSEID: 1002, title: 'Manyata Emergency Logistics Vault', WAREHOUSENAME: 'Manyata Emergency Logistics Vault', capacity: 8000, CAPACITY: 8000, status: 'ACTIVE', STATUS: 'ACTIVE', lat: 13.0475, lng: 77.6200, LATITUDE: 13.0475, LONGITUDE: 77.6200, location: 'Nagawara Ring Road' }
  ],
  responders: [
    { id: 1001, RESPONDERID: 1001, title: 'NDRF 10th Bn Alpha Squad', TEAMNAME: 'NDRF 10th Bn Alpha Squad', specialization: 'Search & Rescue', status: 'DEPLOYED', STATUS: 'DEPLOYED', lat: 13.0358, lng: 77.5970, LATITUDE: 13.0358, LONGITUDE: 77.5970 },
    { id: 1002, RESPONDERID: 1002, title: 'EMS Trauma Response Unit 1', TEAMNAME: 'EMS Trauma Response Unit 1', specialization: 'Emergency Medical', status: 'DEPLOYED', STATUS: 'DEPLOYED', lat: 13.0475, lng: 77.6200, LATITUDE: 13.0475, LONGITUDE: 77.6200 }
  ],
  hospitals: [
    { id: 1, hospital_id: 1, title: 'Columbia Asia Emergency Trauma Center', hospital_name: 'Columbia Asia Emergency Trauma Center', lat: 13.0358, lng: 77.5970, LATITUDE: 13.0358, LONGITUDE: 77.5970, location: 'Hebbal Flyover Junction', status: 'OPEN' },
    { id: 2, hospital_id: 2, title: 'Aster CMI Tertiary Care Hospital', hospital_name: 'Aster CMI Tertiary Care Hospital', lat: 13.0623, lng: 77.5871, LATITUDE: 13.0623, LONGITUDE: 77.5871, location: 'Sahakarnagar', status: 'OPEN' }
  ],
  zones: [
    { id: 1001, name: 'Hebbal Flyover Inundation Zone', riskZone: 'CRITICAL', zone: 'Hebbal Ward 21', lat: 13.0358, lng: 77.5970, address: 'Outer Ring Road Hebbal' },
    { id: 1002, name: 'Manyata Tech Park Sector', riskZone: 'HIGH', zone: 'Nagawara Ward 23', lat: 13.0475, lng: 77.6200, address: 'Nagawara Ring Road' },
    { id: 1003, name: 'Yelahanka Lake Overflow Perimeter', riskZone: 'CRITICAL', zone: 'Yelahanka Ward 4', lat: 13.1007, lng: 77.5963, address: 'Kogilu Main Road' }
  ]
};

export const mockCitizenReports = [
  {
    report_id: 1,
    id: 1,
    report_reference_id: 'RPT-20261009-HB001',
    disaster_type: 'Flood',
    severity_level: 'CRITICAL',
    severity: 'CRITICAL',
    location_id: 1001,
    location_name: 'Hebbal Flyover Junction',
    ward_name: 'Hebbal Ward 21',
    description: 'Outer Ring Road heavily submerged. Water reached 5 feet in apartment ground floors.',
    people_affected: 150,
    injuries_reported: 12,
    missing_persons: 2,
    trapped_persons: 18,
    urgent_medical_needed: true,
    evacuation_needed: true,
    status: 'ACTIVE',
    lat: 13.0358,
    lng: 77.5970,
    latitude: 13.0358,
    longitude: 77.5970,
    submitted_at: '2026-10-09T08:30:00Z',
    updates: [
      { update_id: 1, note: 'NDRF 10th Bn Alpha Squad deployed on scene with 2 rafts.', created_at: '2026-10-09T09:15:00Z', updated_by: 'Officer Col. Varma' },
      { update_id: 2, note: '18 marooned citizens evacuated to Sahakarnagar Indoor Stadium.', created_at: '2026-10-09T10:00:00Z', updated_by: 'NDRF Team Lead' }
    ]
  },
  {
    report_id: 2,
    id: 2,
    report_reference_id: 'RPT-20261009-MY002',
    disaster_type: 'Flash Flood',
    severity_level: 'HIGH',
    severity: 'HIGH',
    location_id: 1002,
    location_name: 'Manyata Embassy Business Park',
    ward_name: 'Nagawara Ward 23',
    description: 'Basement parking completely submerged. High voltage electrical transformer at risk.',
    people_affected: 45,
    injuries_reported: 2,
    missing_persons: 0,
    trapped_persons: 4,
    urgent_medical_needed: false,
    evacuation_needed: true,
    status: 'VERIFIED',
    lat: 13.0475,
    lng: 77.6200,
    latitude: 13.0475,
    longitude: 77.6200,
    submitted_at: '2026-10-09T09:00:00Z',
    updates: []
  },
  {
    report_id: 3,
    id: 3,
    report_reference_id: 'RPT-20261009-YL003',
    disaster_type: 'Structural Collapse',
    severity_level: 'CRITICAL',
    severity: 'CRITICAL',
    location_id: 1003,
    location_name: 'Yelahanka Old Town Lake Basin',
    ward_name: 'Yelahanka Ward 4',
    description: 'Lake retaining wall breached causing rapid silt water surge into homes.',
    people_affected: 210,
    injuries_reported: 8,
    missing_persons: 1,
    trapped_persons: 15,
    urgent_medical_needed: true,
    evacuation_needed: true,
    status: 'SUBMITTED',
    lat: 13.1007,
    lng: 77.5963,
    latitude: 13.1007,
    longitude: 77.5963,
    submitted_at: '2026-10-09T10:30:00Z',
    updates: []
  }
];

export const mockHospitals = [
  { hospital_id: 1, hospital_name: 'Columbia Asia Emergency Trauma Center', total_icu_beds: 35, available_icu_beds: 12, total_general_beds: 200, available_general_beds: 60, location: 'Hebbal', contact: '+91-80-66600000' },
  { hospital_id: 2, hospital_name: 'Aster CMI Tertiary Care Hospital', total_icu_beds: 50, available_icu_beds: 18, total_general_beds: 300, available_general_beds: 95, location: 'Sahakarnagar', contact: '+91-80-43420100' },
  { hospital_id: 3, hospital_name: 'Baptist Hospital Emergency Ward', total_icu_beds: 25, available_icu_beds: 7, total_general_beds: 150, available_general_beds: 38, location: 'Bellary Road', contact: '+91-80-22024700' }
];

export const mockLocations = [
  { location_id: 1001, location_name: 'Hebbal Flyover Junction', ward_name: 'Hebbal Ward 21', risk_zone: 'CRITICAL', latitude: 13.0358, longitude: 77.5970 },
  { location_id: 1002, location_name: 'Manyata Embassy Business Park', ward_name: 'Nagawara Ward 23', risk_zone: 'HIGH', latitude: 13.0475, longitude: 77.6200 },
  { location_id: 1003, location_name: 'Yelahanka Old Town Lake Basin', ward_name: 'Yelahanka Ward 4', risk_zone: 'CRITICAL', latitude: 13.1007, longitude: 77.5963 },
  { location_id: 1004, location_name: 'Jakkur Aerodrome Sector', ward_name: 'Jakkur Ward 5', risk_zone: 'MODERATE', latitude: 13.0784, longitude: 77.6048 },
  { location_id: 1005, location_name: 'Nagawara Lake Lowlands', ward_name: 'Nagawara Ward 23', risk_zone: 'HIGH', latitude: 13.0450, longitude: 77.6150 },
  { location_id: 1006, location_name: 'RT Nagar Central Market', ward_name: 'RT Nagar Ward 32', risk_zone: 'MODERATE', latitude: 13.0200, longitude: 77.5900 }
];

export const mockDeliveries = [
  {
    delivery_id: 1,
    dispatch_reference: 'DSP-20261009-HB001',
    allocation_id: 1,
    destination: 'Hebbal Flyover Relief Camp',
    carrier_info: 'KA-04-G-4412 (Constable K. Murthy)',
    status: 'DELIVERED',
    quantity_dispatched: 500,
    dispatched_at: '2026-10-09T08:45:00Z',
    delivered_at: '2026-10-09T09:40:00Z',
    item_name: 'Emergency Food Rations & Potable Water',
    receiver_name: 'Inspector Anand (Relief Lead)'
  },
  {
    delivery_id: 2,
    dispatch_reference: 'DSP-20261009-MY002',
    allocation_id: 2,
    destination: 'Manyata Business Park Depot',
    carrier_info: 'KA-04-E-8890 (Driver R. Ramesh)',
    status: 'DISPATCHED',
    quantity_dispatched: 25,
    dispatched_at: '2026-10-09T10:15:00Z',
    delivered_at: null,
    item_name: 'Medical Oxygen Cylinders 50L',
    receiver_name: null
  }
];

export const mockAnalytics = {
  kpis: {
    total_reports: 18,
    active_incidents: 4,
    closed_incidents: 14,
    avg_verification_time_mins: 8.5,
    avg_response_time_mins: 18.2,
    deliveries_fulfilled_pct: 94
  },
  incidents_by_type: [
    { name: 'Flood', count: 8 },
    { name: 'Fire', count: 4 },
    { name: 'Building collapse', count: 3 },
    { name: 'Cyclone', count: 2 },
    { name: 'Industrial', count: 1 }
  ],
  incidents_by_severity: [
    { name: 'P1 - Critical', value: 5 },
    { name: 'P2 - High', value: 7 },
    { name: 'P3 - Moderate', value: 4 },
    { name: 'P4 - Low', value: 2 }
  ],
  inventory_summary: [
    { resource: 'Inflatable Rafts', stock: 12, allocated: 6, unit: 'Boats' },
    { resource: 'Medical Oxygen', stock: 180, allocated: 65, unit: 'Cylinders' },
    { resource: 'Food Rations', stock: 4200, allocated: 1500, unit: 'Kits' },
    { resource: 'Dewatering Pumps', stock: 8, allocated: 4, unit: 'Pumps' }
  ]
};

