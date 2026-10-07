/**
 * UDR-ORP HIGH-FIDELITY RELATIONAL MEMORY FALLBACK
 * Active when local Oracle is legacy 10g/11g (NJS-138) or offline
 * Fully loaded with Bangalore North Zone Flood dataset & 22 tables
 */

let seq = {
  incident: 1010,
  request: 1030,
  mission: 1040,
  resource: 1060,
  handover: 1020,
  report: 1020,
  log: 1050
};

// 1. ROLES
const roles = [
  { ROLEID: 1, ROLENAME: 'COMMAND_CENTER', DESCRIPTION: 'Central Emergency Coordination Authority' },
  { ROLEID: 2, ROLENAME: 'FIELD_RESPONDER', DESCRIPTION: 'Tactical Field Teams' },
  { ROLEID: 3, ROLENAME: 'RESOURCE_PROVIDER', DESCRIPTION: 'Hospitals, NGOs, Supply Depots' }
];

// 2. USERS (bcrypt for 'password123')
const users = [
  { USERID: 1001, ROLEID: 1, FULLNAME: 'Director Rajesh Sharma', EMAIL: 'admin@udrorp.com', PHONE: '+91-9880112233', PASSWORDHASH: '$2a$10$6NLc6AWqGie5.YUlgLbHIeN2FzYUGnSShwPq44I5Lm0T8P7C.0NkC', ACCOUNTSTATUS: 'ACTIVE' },
  { USERID: 1002, ROLEID: 1, FULLNAME: 'Duty Officer Anita Menon', EMAIL: 'anita.menon@udrorp.com', PHONE: '+91-9880112234', PASSWORDHASH: '$2a$10$6NLc6AWqGie5.YUlgLbHIeN2FzYUGnSShwPq44I5Lm0T8P7C.0NkC', ACCOUNTSTATUS: 'ACTIVE' },
  { USERID: 1004, ROLEID: 2, FULLNAME: 'Captain Arvind Rao', EMAIL: 'responder@udrorp.com', PHONE: '+91-9845012345', PASSWORDHASH: '$2a$10$6NLc6AWqGie5.YUlgLbHIeN2FzYUGnSShwPq44I5Lm0T8P7C.0NkC', ACCOUNTSTATUS: 'ACTIVE' },
  { USERID: 1005, ROLEID: 2, FULLNAME: 'Dr. Priya Nambiar', EMAIL: 'priya.medical@udrorp.com', PHONE: '+91-9845023456', PASSWORDHASH: '$2a$10$6NLc6AWqGie5.YUlgLbHIeN2FzYUGnSShwPq44I5Lm0T8P7C.0NkC', ACCOUNTSTATUS: 'ACTIVE' },
  { USERID: 1013, ROLEID: 3, FULLNAME: 'Apex Medical Supplies Ltd', EMAIL: 'provider@udrorp.com', PHONE: '+91-8023456781', PASSWORDHASH: '$2a$10$6NLc6AWqGie5.YUlgLbHIeN2FzYUGnSShwPq44I5Lm0T8P7C.0NkC', ACCOUNTSTATUS: 'ACTIVE' }
];

// 3. LOCATIONS (Bangalore coordinates)
const locations = [
  { LOCATIONID: 1001, LOCATIONNAME: 'Hebbal Flyover Junction', ADDRESS: 'Bellary Rd & Outer Ring Rd, Hebbal', CITY: 'Bangalore', STATE: 'Karnataka', LATITUDE: 13.035800, LONGITUDE: 77.597000, RISKZONE: 'CRITICAL', ZONE: 'North Zone' },
  { LOCATIONID: 1002, LOCATIONNAME: 'Manyata Embassy Business Park', ADDRESS: 'Nagawara Ring Road', CITY: 'Bangalore', STATE: 'Karnataka', LATITUDE: 13.047500, LONGITUDE: 77.620000, RISKZONE: 'HIGH', ZONE: 'East Zone' },
  { LOCATIONID: 1003, LOCATIONNAME: 'Yelahanka Old Town Lake Basin', ADDRESS: 'Kogilu Main Road, Yelahanka', CITY: 'Bangalore', STATE: 'Karnataka', LATITUDE: 13.100700, LONGITUDE: 77.596300, RISKZONE: 'CRITICAL', ZONE: 'North Zone' },
  { LOCATIONID: 1004, LOCATIONNAME: 'Jakkur Aerodrome Sector', ADDRESS: 'Jakkur Airfield perimeter', CITY: 'Bangalore', STATE: 'Karnataka', LATITUDE: 13.078400, LONGITUDE: 77.604800, RISKZONE: 'MODERATE', ZONE: 'North Zone' },
  { LOCATIONID: 1005, LOCATIONNAME: 'Nagawara Lake Lowlands', ADDRESS: 'Govindapura, Nagawara', CITY: 'Bangalore', STATE: 'Karnataka', LATITUDE: 13.043800, LONGITUDE: 77.625300, RISKZONE: 'HIGH', ZONE: 'East Zone' },
  { LOCATIONID: 1006, LOCATIONNAME: 'RT Nagar Central Market', ADDRESS: 'Dinnur Main Road, RT Nagar', CITY: 'Bangalore', STATE: 'Karnataka', LATITUDE: 13.024700, LONGITUDE: 77.594800, RISKZONE: 'MODERATE', ZONE: 'Central' },
  { LOCATIONID: 1007, LOCATIONNAME: 'Vidyaranyapura HMT Layout', ADDRESS: 'Vidyaranyapura 4th Block', CITY: 'Bangalore', STATE: 'Karnataka', LATITUDE: 13.080500, LONGITUDE: 77.556200, RISKZONE: 'LOW', ZONE: 'North Zone' },
  { LOCATIONID: 1008, LOCATIONNAME: 'Hennur Cross Radial Road', ADDRESS: 'Hennur Ring Rd Junction', CITY: 'Bangalore', STATE: 'Karnataka', LATITUDE: 13.038200, LONGITUDE: 77.644600, RISKZONE: 'MODERATE', ZONE: 'East Zone' },
  { LOCATIONID: 1009, LOCATIONNAME: 'Sahakarnagar Community Hub', ADDRESS: '60 Feet Road, Sahakarnagar', CITY: 'Bangalore', STATE: 'Karnataka', LATITUDE: 13.062300, LONGITUDE: 77.587100, RISKZONE: 'SAFE', ZONE: 'North Zone' },
  { LOCATIONID: 1010, LOCATIONNAME: 'Kogilu Cross Industrial Zone', ADDRESS: 'International Airport Road, Kogilu', CITY: 'Bangalore', STATE: 'Karnataka', LATITUDE: 13.118900, LONGITUDE: 77.609500, RISKZONE: 'HIGH', ZONE: 'North Zone' }
];

// 4. SHELTERS
const shelters = [
  { SHELTERID: 1001, LOCATIONID: 1009, SHELTERNAME: 'Sahakarnagar Indoor Stadium Shelter', CAPACITY: 500, CURRENTOCCUPANCY: 180, MEDICALFACILITY: 'Y', WATERAVAILABLE: 'Y', STATUS: 'OPEN', LOCATIONNAME: 'Sahakarnagar Community Hub', ADDRESS: '60 Feet Road, Sahakarnagar', LATITUDE: 13.062300, LONGITUDE: 77.587100 },
  { SHELTERID: 1002, LOCATIONID: 1004, SHELTERNAME: 'Jakkur Government High School Camp', CAPACITY: 300, CURRENTOCCUPANCY: 140, MEDICALFACILITY: 'Y', WATERAVAILABLE: 'Y', STATUS: 'OPEN', LOCATIONNAME: 'Jakkur Aerodrome Sector', ADDRESS: 'Jakkur Airfield perimeter', LATITUDE: 13.078400, LONGITUDE: 77.604800 },
  { SHELTERID: 1003, LOCATIONID: 1007, SHELTERNAME: 'Vidyaranyapura Community Hall', CAPACITY: 250, CURRENTOCCUPANCY: 75, MEDICALFACILITY: 'N', WATERAVAILABLE: 'Y', STATUS: 'OPEN', LOCATIONNAME: 'Vidyaranyapura HMT Layout', ADDRESS: 'Vidyaranyapura 4th Block', LATITUDE: 13.080500, LONGITUDE: 77.556200 },
  { SHELTERID: 1004, LOCATIONID: 1006, SHELTERNAME: 'RT Nagar BBMP Relief Shelter', CAPACITY: 200, CURRENTOCCUPANCY: 195, MEDICALFACILITY: 'Y', WATERAVAILABLE: 'Y', STATUS: 'FULL', LOCATIONNAME: 'RT Nagar Central Market', ADDRESS: 'Dinnur Main Road, RT Nagar', LATITUDE: 13.024700, LONGITUDE: 77.594800 },
  { SHELTERID: 1005, LOCATIONID: 1003, SHELTERNAME: 'Yelahanka Railway Community Center', CAPACITY: 400, CURRENTOCCUPANCY: 20, MEDICALFACILITY: 'Y', WATERAVAILABLE: 'Y', STATUS: 'OPEN', LOCATIONNAME: 'Yelahanka Old Town Lake Basin', ADDRESS: 'Kogilu Main Road, Yelahanka', LATITUDE: 13.100700, LONGITUDE: 77.596300 }
];

// 5. WAREHOUSES
const warehouses = [
  { WAREHOUSEID: 1001, LOCATIONID: 1001, WAREHOUSENAME: 'Hebbal Central Disaster Reserve Depot', CAPACITY: 10000, MANAGERNAME: 'Inspector R. Chettiar', STATUS: 'ACTIVE', LOCATIONNAME: 'Hebbal Flyover Junction', ADDRESS: 'Bellary Rd & Outer Ring Rd, Hebbal', LATITUDE: 13.035800, LONGITUDE: 77.597000 },
  { WAREHOUSEID: 1002, LOCATIONID: 1002, WAREHOUSENAME: 'Manyata Emergency Logistics Vault', CAPACITY: 8000, MANAGERNAME: 'T. Sundaram', STATUS: 'ACTIVE', LOCATIONNAME: 'Manyata Embassy Business Park', ADDRESS: 'Nagawara Ring Road', LATITUDE: 13.047500, LONGITUDE: 77.620000 },
  { WAREHOUSEID: 1003, LOCATIONID: 1003, WAREHOUSENAME: 'Yelahanka North Relief Warehouse', CAPACITY: 12000, MANAGERNAME: 'Major B. Varma', STATUS: 'ACTIVE', LOCATIONNAME: 'Yelahanka Old Town Lake Basin', ADDRESS: 'Kogilu Main Road, Yelahanka', LATITUDE: 13.100700, LONGITUDE: 77.596300 },
  { WAREHOUSEID: 1004, LOCATIONID: 1008, WAREHOUSENAME: 'Hennur Road FMCG & Medical Buffer', CAPACITY: 6000, MANAGERNAME: 'P. Kulkarni', STATUS: 'ACTIVE', LOCATIONNAME: 'Hennur Cross Radial Road', ADDRESS: 'Hennur Ring Rd Junction', LATITUDE: 13.038200, LONGITUDE: 77.644600 },
  { WAREHOUSEID: 1005, LOCATIONID: 1010, WAREHOUSENAME: 'Kogilu Cold-Chain Pharmaceutical Depot', CAPACITY: 5000, MANAGERNAME: 'Dr. K. Swaminathan', STATUS: 'ACTIVE', LOCATIONNAME: 'Kogilu Cross Industrial Zone', ADDRESS: 'International Airport Road, Kogilu', LATITUDE: 13.118900, LONGITUDE: 77.609500 }
];

// 6. RESOURCE TYPES
const resourceTypes = [
  { RESOURCETYPEID: 1001, RESOURCENAME: 'Ambulance (ALS/BLS)', CATEGORY: 'VEHICLE', UNIT: 'Units', DESCRIPTION: 'Equipped emergency response ambulances' },
  { RESOURCETYPEID: 1002, RESOURCENAME: 'Inflatable Rescue Boat', CATEGORY: 'EQUIPMENT', UNIT: 'Boats', DESCRIPTION: 'Motorized flood rescue rafts' },
  { RESOURCETYPEID: 1003, RESOURCENAME: 'Heavy Rescue Truck', CATEGORY: 'VEHICLE', UNIT: 'Trucks', DESCRIPTION: 'Tactical vehicle with hydraulic cutters' },
  { RESOURCETYPEID: 1004, RESOURCENAME: 'Emergency Food Ration Kit', CATEGORY: 'FOOD', UNIT: 'Kits', DESCRIPTION: 'Ready-to-eat dry meals (72 hr/family)' },
  { RESOURCETYPEID: 1005, RESOURCENAME: 'Drinking Water 20L Cans', CATEGORY: 'WATER', UNIT: 'Cans', DESCRIPTION: 'Purified potable drinking water units' },
  { RESOURCETYPEID: 1006, RESOURCENAME: 'Medical Oxygen Cylinder 50L', CATEGORY: 'MEDICAL', UNIT: 'Cylinders', DESCRIPTION: 'High-pressure medical grade oxygen' },
  { RESOURCETYPEID: 1007, RESOURCENAME: 'Trauma First Aid Kit', CATEGORY: 'MEDICAL', UNIT: 'Kits', DESCRIPTION: 'Dressings, tourniquets, antiseptics' },
  { RESOURCETYPEID: 1008, RESOURCENAME: 'Diesel Generator 15kVA', CATEGORY: 'EQUIPMENT', UNIT: 'Generators', DESCRIPTION: 'Portable power generation unit' },
  { RESOURCETYPEID: 1011, RESOURCENAME: 'Water De-Watering Heavy Pump', CATEGORY: 'EQUIPMENT', UNIT: 'Pumps', DESCRIPTION: 'High-capacity stormwater sump pumps' }
];

// 7. INCIDENTS (Bangalore North Zone Flood)
const incidents = [
  { INCIDENTID: 1001, INCIDENTNAME: 'Bangalore North Zone Flash Flood', INCIDENTTYPE: 'FLOOD', SEVERITY: 'CRITICAL', LOCATIONID: 1001, DESCRIPTION: 'Severe cloudburst caused breach of secondary canal walls at Hebbal-Nagawara cascade, flooding ring roads and tech parks under 4-6 ft water.', STARTTIME: '2026-10-06T04:30:00Z', STATUS: 'ACTIVE', CREATEDBY: 1001, LOCATIONNAME: 'Hebbal Flyover Junction', CITY: 'Bangalore', LATITUDE: 13.035800, LONGITUDE: 77.597000, RISKZONE: 'CRITICAL', CREATEDBYNAME: 'Director Rajesh Sharma' },
  { INCIDENTID: 1002, INCIDENTNAME: 'Manyata Commercial Basement Inundation', INCIDENTTYPE: 'FLOOD', SEVERITY: 'HIGH', LOCATIONID: 1002, DESCRIPTION: 'Basement levels 1 and 2 submerged with vehicle traps and power substation short-circuits.', STARTTIME: '2026-10-06T05:15:00Z', STATUS: 'ACTIVE', CREATEDBY: 1001, LOCATIONNAME: 'Manyata Embassy Business Park', CITY: 'Bangalore', LATITUDE: 13.047500, LONGITUDE: 77.620000, RISKZONE: 'HIGH', CREATEDBYNAME: 'Director Rajesh Sharma' },
  { INCIDENTID: 1003, INCIDENTNAME: 'Yelahanka Lake Breach & Silt Flow', INCIDENTTYPE: 'STRUCTURAL_COLLAPSE', SEVERITY: 'CRITICAL', LOCATIONID: 1003, DESCRIPTION: 'Earthen bund wall washed away; water entering low-lying residential layouts.', STARTTIME: '2026-10-06T06:00:00Z', STATUS: 'ACTIVE', CREATEDBY: 1002, LOCATIONNAME: 'Yelahanka Old Town Lake Basin', CITY: 'Bangalore', LATITUDE: 13.100700, LONGITUDE: 77.596300, RISKZONE: 'CRITICAL', CREATEDBYNAME: 'Duty Officer Anita Menon' },
  { INCIDENTID: 1004, INCIDENTNAME: 'Nagawara Underpass Structural Flooding', INCIDENTTYPE: 'FLOOD', SEVERITY: 'HIGH', LOCATIONID: 1005, DESCRIPTION: '8 feet standing water inside transit underpass with stranded buses.', STARTTIME: '2026-10-06T06:45:00Z', STATUS: 'ACTIVE', CREATEDBY: 1001, LOCATIONNAME: 'Nagawara Lake Lowlands', CITY: 'Bangalore', LATITUDE: 13.043800, LONGITUDE: 77.625300, RISKZONE: 'HIGH', CREATEDBYNAME: 'Director Rajesh Sharma' },
  { INCIDENTID: 1005, INCIDENTNAME: 'Jakkur Aviation Fuel Depot Water Seepage', INCIDENTTYPE: 'HAZMAT', SEVERITY: 'MEDIUM', LOCATIONID: 1004, DESCRIPTION: 'Flood water threatening perimeter drainage near underground fuel tanks.', STARTTIME: '2026-10-06T07:30:00Z', STATUS: 'ACTIVE', CREATEDBY: 1002, LOCATIONNAME: 'Jakkur Aerodrome Sector', CITY: 'Bangalore', LATITUDE: 13.078400, LONGITUDE: 77.604800, RISKZONE: 'MODERATE', CREATEDBYNAME: 'Duty Officer Anita Menon' }
];

// 8. RESPONDERS
const responders = [
  { RESPONDERID: 1001, USERID: 1004, TEAMNAME: 'NDRF 10th Bn Alpha Squad', SPECIALIZATION: 'SEARCH_AND_RESCUE', MEMBERSCOUNT: 12, STATUS: 'AVAILABLE', COMMANDERNAME: 'Captain Arvind Rao', CONTACTNUMBER: '+91-9845012345' },
  { RESPONDERID: 1002, USERID: 1005, TEAMNAME: 'EMS Trauma Response Unit 1', SPECIALIZATION: 'MEDICAL', MEMBERSCOUNT: 6, STATUS: 'AVAILABLE', COMMANDERNAME: 'Dr. Priya Nambiar', CONTACTNUMBER: '+91-9845023456' },
  { RESPONDERID: 1003, USERID: 1006, TEAMNAME: 'Karnataka Fire Station 4', SPECIALIZATION: 'FIRE_RESCUE', MEMBERSCOUNT: 10, STATUS: 'DEPLOYED', COMMANDERNAME: 'Commander Suresh Kumar', CONTACTNUMBER: '+91-9845034567' },
  { RESPONDERID: 1004, USERID: 1007, TEAMNAME: 'SDRF Water Rescue Team Bravo', SPECIALIZATION: 'WATER_RESCUE', MEMBERSCOUNT: 8, STATUS: 'AVAILABLE', COMMANDERNAME: 'Sub-Inspector Deepa Hegde', CONTACTNUMBER: '+91-9845045678' }
];

// 9. VEHICLES
const vehicles = [
  { VEHICLEID: 1001, VEHICLENAME: 'Ambulance ALS-01', REGISTRATIONNUMBER: 'KA-04-G-1102', VEHICLETYPE: 'AMBULANCE', CAPACITYPERSONS: 4, CAPACITYKG: 500, STATUS: 'AVAILABLE', PROVIDERID: 1013 },
  { VEHICLEID: 1002, VEHICLENAME: 'NDRF Rescue Boat Zodiac-1', REGISTRATIONNUMBER: 'KA-04-BT-09', VEHICLETYPE: 'BOAT', CAPACITYPERSONS: 10, CAPACITYKG: 1200, STATUS: 'DEPLOYED', PROVIDERID: 1013 },
  { VEHICLEID: 1003, VEHICLENAME: 'Heavy Water Tender-4', REGISTRATIONNUMBER: 'KA-04-F-3321', VEHICLETYPE: 'TRUCK', CAPACITYPERSONS: 6, CAPACITYKG: 5000, STATUS: 'AVAILABLE', PROVIDERID: 1013 },
  { VEHICLEID: 1004, VEHICLENAME: 'Ambulance BLS-02', REGISTRATIONNUMBER: 'KA-04-G-1103', VEHICLETYPE: 'AMBULANCE', CAPACITYPERSONS: 4, CAPACITYKG: 500, STATUS: 'AVAILABLE', PROVIDERID: 1013 }
];

// 10. REQUESTS
const requests = [
  { REQUESTID: 1001, INCIDENTID: 1001, RESOURCETYPEID: 1002, LOCATIONID: 1001, REQUESTTYPE: 'EVACUATION', PRIORITY: 'CRITICAL', PEOPLEAFFECTED: 45, STATUS: 'ASSIGNED', DESCRIPTION: '45 residents marooned on terrace of Sterling Park Apartments surrounded by 5ft surging water.', CREATEDAT: '2026-10-06T05:00:00Z', INCIDENTNAME: 'Bangalore North Zone Flash Flood', LOCATIONNAME: 'Hebbal Flyover Junction', RESOURCENAME: 'Inflatable Rescue Boat' },
  { REQUESTID: 1002, INCIDENTID: 1001, RESOURCETYPEID: 1001, LOCATIONID: 1001, REQUESTTYPE: 'MEDICAL_AID', PRIORITY: 'CRITICAL', PEOPLEAFFECTED: 3, STATUS: 'ASSIGNED', DESCRIPTION: 'Elderly diabetic patients with failing dialysis and hypothermia symptoms.', CREATEDAT: '2026-10-06T05:20:00Z', INCIDENTNAME: 'Bangalore North Zone Flash Flood', LOCATIONNAME: 'Hebbal Flyover Junction', RESOURCENAME: 'Ambulance (ALS/BLS)' },
  { REQUESTID: 1003, INCIDENTID: 1002, RESOURCETYPEID: 1011, LOCATIONID: 1002, REQUESTTYPE: 'RESOURCE', PRIORITY: 'HIGH', PEOPLEAFFECTED: 0, STATUS: 'PENDING', DESCRIPTION: 'Commercial power generation room flooding; emergency sump dewatering needed immediately.', CREATEDAT: '2026-10-06T05:40:00Z', INCIDENTNAME: 'Manyata Commercial Basement Inundation', LOCATIONNAME: 'Manyata Embassy Business Park', RESOURCENAME: 'Water De-Watering Heavy Pump' },
  { REQUESTID: 1004, INCIDENTID: 1003, RESOURCETYPEID: 1002, LOCATIONID: 1003, REQUESTTYPE: 'EVACUATION', PRIORITY: 'CRITICAL', PEOPLEAFFECTED: 80, STATUS: 'ASSIGNED', DESCRIPTION: 'Low-lying houses near lake sluice gate submerged; children and families need immediate boat transport.', CREATEDAT: '2026-10-06T06:15:00Z', INCIDENTNAME: 'Yelahanka Lake Breach & Silt Flow', LOCATIONNAME: 'Yelahanka Old Town Lake Basin', RESOURCENAME: 'Inflatable Rescue Boat' },
  { REQUESTID: 1005, INCIDENTID: 1001, RESOURCETYPEID: 1004, LOCATIONID: 1001, REQUESTTYPE: 'RESOURCE', PRIORITY: 'MEDIUM', PEOPLEAFFECTED: 120, STATUS: 'PENDING', DESCRIPTION: 'Food ration kits required for isolated families at Hebbal Lake view enclave.', CREATEDAT: '2026-10-06T06:30:00Z', INCIDENTNAME: 'Bangalore North Zone Flash Flood', LOCATIONNAME: 'Hebbal Flyover Junction', RESOURCENAME: 'Emergency Food Ration Kit' }
];

// 11. MISSIONS
const missions = [
  { MISSIONID: 1001, REQUESTID: 1001, RESPONDERID: 1001, VEHICLEID: 1002, ASSIGNEDBY: 1001, PRIORITY: 'CRITICAL', STATUS: 'IN_PROGRESS', STARTTIME: '2026-10-06T05:10:00Z', INCIDENTNAME: 'Bangalore North Zone Flash Flood', TARGETLOCATION: 'Hebbal Flyover Junction', TARGETADDRESS: 'Bellary Rd & Outer Ring Rd, Hebbal', TEAMNAME: 'NDRF 10th Bn Alpha Squad', VEHICLENUMBER: 'KA-04-BT-09', VEHICLETYPE: 'BOAT' },
  { MISSIONID: 1002, REQUESTID: 1002, RESPONDERID: 1002, VEHICLEID: 1001, ASSIGNEDBY: 1001, PRIORITY: 'CRITICAL', STATUS: 'EN_ROUTE', STARTTIME: '2026-10-06T05:30:00Z', INCIDENTNAME: 'Bangalore North Zone Flash Flood', TARGETLOCATION: 'Hebbal Flyover Junction', TARGETADDRESS: 'Bellary Rd & Outer Ring Rd, Hebbal', TEAMNAME: 'EMS Trauma Response Unit 1', VEHICLENUMBER: 'KA-04-G-1102', VEHICLETYPE: 'AMBULANCE' },
  { MISSIONID: 1003, REQUESTID: 1004, RESPONDERID: 1004, VEHICLEID: null, ASSIGNEDBY: 1002, PRIORITY: 'CRITICAL', STATUS: 'ASSIGNED', STARTTIME: '2026-10-06T06:25:00Z', INCIDENTNAME: 'Yelahanka Lake Breach & Silt Flow', TARGETLOCATION: 'Yelahanka Old Town Lake Basin', TARGETADDRESS: 'Kogilu Main Road, Yelahanka', TEAMNAME: 'SDRF Water Rescue Team Bravo', VEHICLENUMBER: null, VEHICLETYPE: null }
];

// 12. RESOURCES (Registered stockpile)
const resources = [
  { RESOURCEID: 1001, RESOURCETYPEID: 1002, PROVIDERID: 1013, RESOURCENAME: 'Motorized Inflatable Raft Zodiac 4.5m', QUANTITY: 4, CONDITION: 'EXCELLENT', AVAILABILITYSTATUS: 'AVAILABLE', REGISTRATIONNUMBER: 'ZOD-450-A', CATEGORY: 'EQUIPMENT', UNIT: 'Boats', TYPENAME: 'Inflatable Rescue Boat' },
  { RESOURCEID: 1002, RESOURCETYPEID: 1006, PROVIDERID: 1013, RESOURCENAME: 'Oxygen Cylinder Jumbo 47L Kit', QUANTITY: 25, CONDITION: 'EXCELLENT', AVAILABILITYSTATUS: 'AVAILABLE', REGISTRATIONNUMBER: 'OXY-47-BLR', CATEGORY: 'MEDICAL', UNIT: 'Cylinders', TYPENAME: 'Medical Oxygen Cylinder 50L' },
  { RESOURCEID: 1003, RESOURCETYPEID: 1007, PROVIDERID: 1013, RESOURCENAME: 'Trauma Burn & Wound Hemostatic Kit', QUANTITY: 50, CONDITION: 'EXCELLENT', AVAILABILITYSTATUS: 'AVAILABLE', REGISTRATIONNUMBER: 'MED-FA-88', CATEGORY: 'MEDICAL', UNIT: 'Kits', TYPENAME: 'Trauma First Aid Kit' },
  { RESOURCEID: 1004, RESOURCETYPEID: 1008, PROVIDERID: 1013, RESOURCENAME: 'Kirloskar 15kVA Diesel Generator', QUANTITY: 3, CONDITION: 'GOOD', AVAILABILITYSTATUS: 'AVAILABLE', REGISTRATIONNUMBER: 'GEN-KIR-15', CATEGORY: 'EQUIPMENT', UNIT: 'Generators', TYPENAME: 'Diesel Generator 15kVA' },
  { RESOURCEID: 1005, RESOURCETYPEID: 1011, PROVIDERID: 1013, RESOURCENAME: 'Honda 4-inch Submersible Dewatering Pump', QUANTITY: 6, CONDITION: 'EXCELLENT', AVAILABILITYSTATUS: 'AVAILABLE', REGISTRATIONNUMBER: 'PMP-HON-04', CATEGORY: 'EQUIPMENT', UNIT: 'Pumps', TYPENAME: 'Water De-Watering Heavy Pump' }
];

// 13. INVENTORY (Warehouse stock)
const inventory = [
  { INVENTORYID: 1001, WAREHOUSEID: 1001, RESOURCETYPEID: 1004, QUANTITYONHAND: 2400, REORDERLEVEL: 500, SAFETYSTOCK: 200, WAREHOUSENAME: 'Hebbal Central Disaster Reserve Depot', RESOURCENAME: 'Emergency Food Ration Kit', CATEGORY: 'FOOD', UNIT: 'Kits' },
  { INVENTORYID: 1002, WAREHOUSEID: 1001, RESOURCETYPEID: 1005, QUANTITYONHAND: 1800, REORDERLEVEL: 400, SAFETYSTOCK: 150, WAREHOUSENAME: 'Hebbal Central Disaster Reserve Depot', RESOURCENAME: 'Drinking Water 20L Cans', CATEGORY: 'WATER', UNIT: 'Cans' },
  { INVENTORYID: 1003, WAREHOUSEID: 1001, RESOURCETYPEID: 1007, QUANTITYONHAND: 320, REORDERLEVEL: 100, SAFETYSTOCK: 50, WAREHOUSENAME: 'Hebbal Central Disaster Reserve Depot', RESOURCENAME: 'Trauma First Aid Kit', CATEGORY: 'MEDICAL', UNIT: 'Kits' },
  { INVENTORYID: 1004, WAREHOUSEID: 1002, RESOURCETYPEID: 1011, QUANTITYONHAND: 15, REORDERLEVEL: 5, SAFETYSTOCK: 2, WAREHOUSENAME: 'Manyata Emergency Logistics Vault', RESOURCENAME: 'Water De-Watering Heavy Pump', CATEGORY: 'EQUIPMENT', UNIT: 'Pumps' },
  { INVENTORYID: 1005, WAREHOUSEID: 1003, RESOURCETYPEID: 1002, QUANTITYONHAND: 8, REORDERLEVEL: 4, SAFETYSTOCK: 2, WAREHOUSENAME: 'Yelahanka North Relief Warehouse', RESOURCENAME: 'Inflatable Rescue Boat', CATEGORY: 'EQUIPMENT', UNIT: 'Boats' }
];

// 14. FIELD REPORTS
const fieldReports = [
  { REPORTID: 1001, MISSIONID: 1001, RESPONDERID: 1001, LOCATIONID: 1001, REPORTTYPE: 'ROAD_BLOCKED', SEVERITY: 'CRITICAL', DESCRIPTION: 'Hebbal Flyover ramp submerged under 4.5ft water; access by wheel vehicles impassable. Rafts navigating through side service road.', CREATEDAT: '2026-10-06T05:35:00Z', TEAMNAME: 'NDRF 10th Bn Alpha Squad', LOCATIONNAME: 'Hebbal Flyover Junction' },
  { REPORTID: 1002, MISSIONID: 1001, RESPONDERID: 1001, LOCATIONID: 1001, REPORTTYPE: 'MISSION_UPDATE', SEVERITY: 'MEDIUM', DESCRIPTION: '18 residents evacuated safely to Sahakarnagar Relief Shelter. Second boat run commencing.', CREATEDAT: '2026-10-06T06:10:00Z', TEAMNAME: 'NDRF 10th Bn Alpha Squad', LOCATIONNAME: 'Hebbal Flyover Junction' }
];

// 15. AUDIT LOGS
const auditLogs = [
  { LOGID: 1001, USERID: 1001, ACTION: 'CREATE_INCIDENT', TABLENAME: 'INCIDENTS', RECORDID: 1001, DETAILS: 'Incident #1001 declared (CRITICAL Flood)', TIMESTAMP: '2026-10-06T04:30:00Z', USERNAME: 'Director Rajesh Sharma', IPADDRESS: '10.0.4.1' },
  { LOGID: 1002, USERID: 1001, ACTION: 'ASSIGN_MISSION', TABLENAME: 'MISSIONS', RECORDID: 1001, DETAILS: 'Mission #1001 assigned to NDRF Alpha', TIMESTAMP: '2026-10-06T05:10:00Z', USERNAME: 'Director Rajesh Sharma', IPADDRESS: '10.0.4.1' },
  { LOGID: 1003, USERID: 1004, ACTION: 'STATUS_UPDATE', TABLENAME: 'MISSIONS', RECORDID: 1001, DETAILS: 'Mission #1001 moved to IN_PROGRESS', TIMESTAMP: '2026-10-06T05:25:00Z', USERNAME: 'Captain Arvind Rao', IPADDRESS: '192.168.1.55' }
];

module.exports = {
  roles,
  users,
  locations,
  shelters,
  warehouses,
  resourceTypes,
  incidents,
  responders,
  vehicles,
  requests,
  missions,
  resources,
  inventory,
  fieldReports,
  auditLogs,
  seq
};
