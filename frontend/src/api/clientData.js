/**
 * In-browser fallback data for standalone deployments (e.g. GitHub Pages)
 * Matches Bangalore North Zone Flood dataset with complete fidelity
 */

export const mockUsers = {
  'admin@udrorp.com': {
    userId: 1001,
    roleId: 1,
    roleName: 'COMMAND_CENTER',
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
    userId: 1013,
    roleId: 3,
    roleName: 'RESOURCE_PROVIDER',
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
    INCIDENTNAME: 'Bangalore North Zone Flash Flood',
    INCIDENTTYPE: 'FLOOD',
    SEVERITY: 'CRITICAL',
    STATUS: 'ACTIVE',
    STARTTIME: '2026-10-06T04:30:00Z',
    LOCATIONNAME: 'Hebbal Flyover Junction',
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
    INCIDENTNAME: 'Manyata Commercial Basement Inundation',
    INCIDENTTYPE: 'FLOOD',
    SEVERITY: 'HIGH',
    STATUS: 'ACTIVE',
    STARTTIME: '2026-10-06T05:15:00Z',
    LOCATIONNAME: 'Manyata Embassy Business Park',
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
    INCIDENTNAME: 'Yelahanka Lake Breach & Silt Flow',
    INCIDENTTYPE: 'STRUCTURAL_COLLAPSE',
    SEVERITY: 'CRITICAL',
    STATUS: 'ACTIVE',
    STARTTIME: '2026-10-06T06:00:00Z',
    LOCATIONNAME: 'Yelahanka Old Town Lake Basin',
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
    { INCIDENTID: 1001, INCIDENTNAME: 'Bangalore North Zone Flash Flood', INCIDENTTYPE: 'FLOOD', SEVERITY: 'CRITICAL', STATUS: 'ACTIVE', LATITUDE: 13.0358, LONGITUDE: 77.5970, LOCATIONNAME: 'Hebbal Flyover Junction' },
    { INCIDENTID: 1002, INCIDENTNAME: 'Manyata Commercial Basement Inundation', INCIDENTTYPE: 'FLOOD', SEVERITY: 'HIGH', STATUS: 'ACTIVE', LATITUDE: 13.0475, LONGITUDE: 77.6200, LOCATIONNAME: 'Manyata Embassy Business Park' },
    { INCIDENTID: 1003, INCIDENTNAME: 'Yelahanka Lake Breach & Silt Flow', INCIDENTTYPE: 'STRUCTURAL_COLLAPSE', SEVERITY: 'CRITICAL', STATUS: 'ACTIVE', LATITUDE: 13.1007, LONGITUDE: 77.5963, LOCATIONNAME: 'Yelahanka Old Town Lake Basin' }
  ],
  shelters: [
    { SHELTERID: 1001, SHELTERNAME: 'Sahakarnagar Indoor Stadium Shelter', CAPACITY: 500, CURRENTOCCUPANCY: 180, STATUS: 'OPEN', LATITUDE: 13.0623, LONGITUDE: 77.5871 },
    { SHELTERID: 1002, SHELTERNAME: 'Jakkur Government High School Camp', CAPACITY: 300, CURRENTOCCUPANCY: 140, STATUS: 'OPEN', LATITUDE: 13.0784, LONGITUDE: 77.6048 }
  ],
  warehouses: [
    { WAREHOUSEID: 1001, WAREHOUSENAME: 'Hebbal Central Disaster Reserve Depot', CAPACITY: 10000, STATUS: 'ACTIVE', LATITUDE: 13.0358, LONGITUDE: 77.5970 },
    { WAREHOUSEID: 1002, WAREHOUSENAME: 'Manyata Emergency Logistics Vault', CAPACITY: 8000, STATUS: 'ACTIVE', LATITUDE: 13.0475, LONGITUDE: 77.6200 }
  ],
  responders: [
    { RESPONDERID: 1001, TEAMNAME: 'NDRF 10th Bn Alpha Squad', STATUS: 'DEPLOYED', LATITUDE: 13.0358, LONGITUDE: 77.5970 },
    { RESPONDERID: 1002, TEAMNAME: 'EMS Trauma Response Unit 1', STATUS: 'DEPLOYED', LATITUDE: 13.0475, LONGITUDE: 77.6200 }
  ]
};
