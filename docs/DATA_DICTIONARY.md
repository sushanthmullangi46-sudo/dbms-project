# UDR-ORP — Comprehensive Data Dictionary

This data dictionary details the attributes, data types, constraints, nullability, and operational semantics across all 22 normalized relational tables.

---

### 1. ROLES
| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `RoleID` | NUMBER | No | PK | Unique identifier for role (1: Command, 2: Responder, 3: Provider) |
| `RoleName` | VARCHAR2(50) | No | UK, CHECK | Internal role token (`COMMAND_CENTER`, `FIELD_RESPONDER`, `RESOURCE_PROVIDER`) |
| `Description` | VARCHAR2(255) | Yes | None | Descriptive role definition |

---

### 2. USERS
| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `UserID` | NUMBER | No | PK | System-wide unique user identity |
| `RoleID` | NUMBER | No | FK -> ROLES | Authorization role binding |
| `FullName` | VARCHAR2(100) | No | None | Legal or operational name |
| `Email` | VARCHAR2(100) | No | UK | Login identifier and contact email |
| `Phone` | VARCHAR2(20) | No | None | Contact telephone number |
| `PasswordHash` | VARCHAR2(255) | No | None | Secure salted bcrypt hash |
| `AccountStatus`| VARCHAR2(20) | No | CHECK | Current account status (`ACTIVE`, `SUSPENDED`, `INACTIVE`) |
| `CreatedAt` | TIMESTAMP | No | DEFAULT NOW | Account provisioning timestamp |
| `LastLogin` | TIMESTAMP | Yes | None | Timestamp of most recent authentication |

---

### 3. LOCATIONS
| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `LocationID` | NUMBER | No | PK | Geographic reference identifier |
| `LocationName`| VARCHAR2(100) | No | None | Common landmark or sector name |
| `Address` | VARCHAR2(255) | No | None | Street address details |
| `City` | VARCHAR2(50) | No | None | Municipality |
| `State` | VARCHAR2(50) | No | None | Administrative province / state |
| `Latitude` | NUMBER(10,6) | No | CHECK [-90, 90]| WGS84 decimal latitude |
| `Longitude` | NUMBER(10,6) | No | CHECK [-180, 180]| WGS84 decimal longitude |
| `RiskZone` | VARCHAR2(20) | No | CHECK | Disaster exposure tier (`SAFE`, `LOW`, `MODERATE`, `HIGH`, `CRITICAL`) |
| `CreatedAt` | TIMESTAMP | No | DEFAULT NOW | Creation timestamp |

---

### 4. SHELTERS
| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `ShelterID` | NUMBER | No | PK | Relief shelter identifier |
| `LocationID` | NUMBER | No | FK -> LOCATIONS| Geographic site reference |
| `ShelterName` | VARCHAR2(100) | No | None | Facility name |
| `Capacity` | NUMBER | No | CHECK (>0) | Total occupant capacity |
| `CurrentOccupancy`| NUMBER | No | CHECK (>=0, <=Cap)| Active displaced persons sheltered |
| `MedicalFacility`| VARCHAR2(1) | No | CHECK ('Y','N') | On-site medical presence |
| `WaterAvailable` | VARCHAR2(1) | No | CHECK ('Y','N') | Dedicated potable water source |
| `Status` | VARCHAR2(20) | No | CHECK | Operational state (`OPEN`, `FULL`, `CLOSED`, `DAMAGED`) |

---

### 5. WAREHOUSES
| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `WarehouseID` | NUMBER | No | PK | Supply warehouse identifier |
| `LocationID` | NUMBER | No | FK -> LOCATIONS| Facility location |
| `WarehouseName`| VARCHAR2(100)| No | None | Warehouse title |
| `Capacity` | NUMBER | No | CHECK (>0) | Volumetric capacity (pallet units) |
| `ManagerName` | VARCHAR2(100)| No | None | Facility supervisor |
| `Status` | VARCHAR2(20) | No | CHECK | Operating state (`ACTIVE`, `MAINTENANCE`, `INACTIVE`) |

---

### 6. INCIDENTS
| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `IncidentID` | NUMBER | No | PK | Unique disaster incident record |
| `IncidentName`| VARCHAR2(150)| No | None | Incident title |
| `IncidentType`| VARCHAR2(50) | No | CHECK | Disaster category (FLOOD, FIRE, EARTHQUAKE, etc.) |
| `Severity` | VARCHAR2(20) | No | CHECK | Emergency scale (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) |
| `LocationID` | NUMBER | No | FK -> LOCATIONS| Epicenter landmark |
| `Description` | VARCHAR2(1000)| No | None | Incident briefing |
| `StartTime` | TIMESTAMP | No | DEFAULT NOW | Disaster inception |
| `EndTime` | TIMESTAMP | Yes | None | Official incident termination |
| `Status` | VARCHAR2(20) | No | CHECK | Incident lifecycle (`ACTIVE`, `ON_HOLD`, `RESOLVED`, `CLOSED`) |
| `CreatedBy` | NUMBER | No | FK -> USERS | Creator Command Center official |
| `CreatedAt` | TIMESTAMP | No | DEFAULT NOW | Record timestamp |

---

### 7. INCIDENT_ZONES
| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `IncidentID` | NUMBER | No | PK, FK -> INCIDENTS | Parent disaster event |
| `LocationID` | NUMBER | No | PK, FK -> LOCATIONS | Impacted zone |
| `Severity` | VARCHAR2(20) | No | CHECK | Zone-specific severity |
| `PopulationAffected` | NUMBER | No | CHECK (>=0) | Population residing in sector |
| `Notes` | VARCHAR2(500)| Yes | None | Field assessment remarks |

---

### 8. REQUESTS
| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `RequestID` | NUMBER | No | PK | Emergency request identifier |
| `IncidentID` | NUMBER | No | FK -> INCIDENTS | Linked disaster event |
| `LocationID` | NUMBER | No | FK -> LOCATIONS | Exact location of distress call |
| `RequestedBy`| NUMBER | No | FK -> USERS | Calling officer / citizen |
| `RequestType`| VARCHAR2(50) | No | CHECK | Distress type (`RESCUE`, `MEDICAL`, `FOOD`, etc.) |
| `Priority` | VARCHAR2(20) | No | CHECK | Urgency rating (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) |
| `PeopleAffected`| NUMBER | No | CHECK (>=0) | Headcount endangered |
| `Description`| VARCHAR2(1000)| No | None | Situation summary |
| `Status` | VARCHAR2(20) | No | CHECK | Triage state (`PENDING`, `APPROVED`, `ALLOCATED`, `IN_PROGRESS`, `RESOLVED`, `CANCELLED`) |
| `CreatedAt` | TIMESTAMP | No | DEFAULT NOW | Distress call logging time |
| `ResolvedAt` | TIMESTAMP | Yes | None | Resolution timestamp |

---

### 9. REQUEST_ITEMS
| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `RequestItemID`| NUMBER | No | PK | Unique item breakdown line |
| `RequestID` | NUMBER | No | FK -> REQUESTS | Parent distress request |
| `ResourceTypeID`| NUMBER | No | FK -> RESOURCE_TYPES | Requested asset type |
| `QuantityRequired`| NUMBER | No | CHECK (>0) | Required amount |
| `QuantityAllocated`| NUMBER| No | CHECK (>=0, <=Req) | Quantity committed |
| `Unit` | VARCHAR2(30) | No | None | Packaging metric |

---

### 10. RESOURCE_TYPES
| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `ResourceTypeID`| NUMBER | No | PK | Standardized catalog ID |
| `ResourceName`| VARCHAR2(100)| No | UK | Official equipment name |
| `Category` | VARCHAR2(50) | No | None | Classification (VEHICLE, MEDICAL, FOOD, WATER, EQUIPMENT) |
| `Unit` | VARCHAR2(30) | No | None | Standard counting unit |
| `Description` | VARCHAR2(255)| Yes | None | Catalog specification |

---

### 11. RESOURCES
| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `ResourceID` | NUMBER | No | PK | Physical inventory unit |
| `ProviderID` | NUMBER | No | FK -> USERS | Supplying provider |
| `ResourceTypeID`| NUMBER | No | FK -> RESOURCE_TYPES | Catalog association |
| `ResourceName`| VARCHAR2(100)| No | None | Specific make / batch title |
| `Quantity` | NUMBER | No | CHECK (>=0) | Quantity in lot |
| `Condition` | VARCHAR2(30) | No | CHECK | Equipment condition (`NEW`, `EXCELLENT`, `GOOD`, `FAIR`, `POOR`) |
| `AvailabilityStatus`| VARCHAR2(30)| No | CHECK | Readiness (`AVAILABLE`, `ALLOCATED`, `IN_USE`, `DAMAGED`, `UNDER_REPAIR`, `UNAVAILABLE`) |
| `CurrentLocationID`| NUMBER | Yes | FK -> LOCATIONS | Current physical location |
| `RegistrationNumber`| VARCHAR2(50)| Yes | None | Serial or tracking number |
| `CreatedAt` | TIMESTAMP | No | DEFAULT NOW | Registration timestamp |

---

### 12. VEHICLES
| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `VehicleID` | NUMBER | No | PK | Fleet vehicle ID |
| `ProviderID` | NUMBER | No | FK -> USERS | Owning provider |
| `VehicleType` | VARCHAR2(50) | No | None | Vehicle classification |
| `RegistrationNumber`| VARCHAR2(50)| No | UK | Official license plate |
| `Capacity` | NUMBER | No | CHECK (>0) | Seating or tonnage rating |
| `FuelLevel` | NUMBER(5,2) | No | CHECK [0, 100] | Current fuel tank percentage |
| `CurrentLocationID`| NUMBER | Yes | FK -> LOCATIONS | Base station location |
| `Status` | VARCHAR2(30) | No | CHECK | Availability state (`AVAILABLE`, `ALLOCATED`, `IN_USE`, `MAINTENANCE`, `UNAVAILABLE`) |
| `CreatedAt` | TIMESTAMP | No | DEFAULT NOW | Onboarding timestamp |

---

### 13. RESPONDERS
| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `ResponderID` | NUMBER | No | PK | Field team tactical identity |
| `UserID` | NUMBER | No | FK -> USERS, UK | Associated system login user |
| `TeamName` | VARCHAR2(100)| No | None | Team / call-sign moniker |
| `Specialization`| VARCHAR2(100)| No | None | Primary operational discipline |
| `ExperienceLevel`| VARCHAR2(30)| No | CHECK | Experience tier (`ENTRY`, `INTERMEDIATE`, `EXPERT`, `LEAD`) |
| `CurrentStatus`| VARCHAR2(30)| No | CHECK | Tactical dispatch state (`AVAILABLE`, `ASSIGNED`, `ON_MISSION`, `OFF_DUTY`, `UNAVAILABLE`) |
| `CurrentLocationID`| NUMBER | Yes | FK -> LOCATIONS | Staging ground |
| `AvailabilityStatus`| VARCHAR2(30)| No | CHECK | Availability flag (`AVAILABLE`, `BUSY`, `OFFLINE`) |

---

### 14. SKILLS
| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `SkillID` | NUMBER | No | PK | Operational capability ID |
| `SkillName` | VARCHAR2(100)| No | UK | Skill nomenclature |
| `Description` | VARCHAR2(255)| Yes | None | Qualification details |

---

### 15. RESPONDER_SKILLS
| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `ResponderID` | NUMBER | No | PK, FK -> RESPONDERS | Team reference |
| `SkillID` | NUMBER | No | PK, FK -> SKILLS | Qualification reference |
| `CertificationLevel`| VARCHAR2(50)| No | None | Certification grade |
| `CertificationExpiry`| DATE | Yes | None | Accreditation expiry date |

---

### 16. MISSIONS
| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `MissionID` | NUMBER | No | PK | Tactical mission identity |
| `RequestID` | NUMBER | No | FK -> REQUESTS | Distress call fulfilled |
| `ResponderID` | NUMBER | No | FK -> RESPONDERS| Assigned responder unit |
| `VehicleID` | NUMBER | Yes | FK -> VEHICLES | Assigned transport asset |
| `AssignedBy` | NUMBER | No | FK -> USERS | Authorizing Command Center user |
| `StartTime` | TIMESTAMP | No | DEFAULT NOW | Departure timestamp |
| `ExpectedEndTime`| TIMESTAMP| Yes | None | Estimated mission ETA |
| `ActualEndTime`| TIMESTAMP| Yes | None | Mission completion time |
| `Status` | VARCHAR2(30) | No | CHECK | Lifecycle state (`ASSIGNED`, `ACCEPTED`, `EN_ROUTE`, `ARRIVED`, `IN_PROGRESS`, `ON_HOLD`, `COMPLETED`, `CANCELLED`) |
| `Priority` | VARCHAR2(20) | No | CHECK | Tactical priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) |
| `CreatedAt` | TIMESTAMP | No | DEFAULT NOW | Creation timestamp |

---

### 17. MISSION_RESOURCES
| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `MissionID` | NUMBER | No | PK, FK -> MISSIONS | Parent mission |
| `ResourceID` | NUMBER | No | PK, FK -> RESOURCES| Allocated asset |
| `QuantityAllocated`| NUMBER | No | CHECK (>0) | Number of units issued |
| `QuantityUsed` | NUMBER | No | CHECK (>=0) | Consumed in theater |
| `QuantityReturned` | NUMBER | No | CHECK (>=0) | Safely returned to depot |

---

### 18. INVENTORY
| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `InventoryID` | NUMBER | No | PK | Stock line item ID |
| `WarehouseID` | NUMBER | No | FK -> WAREHOUSES, UK | Depot storage location |
| `ResourceTypeID`| NUMBER | No | FK -> RESOURCE_TYPES, UK| Catalog resource item |
| `QuantityAvailable`| NUMBER | No | CHECK (>=0) | Physical stock available |
| `ReorderLevel` | NUMBER | No | CHECK (>=0) | Safety stock threshold |
| `LastUpdated` | TIMESTAMP | No | DEFAULT NOW | Last stock change timestamp |

---

### 19. INVENTORY_TRANSACTIONS
| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `TransactionID`| NUMBER | No | PK | Inventory audit record |
| `WarehouseID` | NUMBER | No | FK -> WAREHOUSES | Facility altered |
| `ResourceTypeID`| NUMBER | No | FK -> RESOURCE_TYPES | Material category |
| `MissionID` | NUMBER | Yes | FK -> MISSIONS | Optional mission linkage |
| `TransactionType`| VARCHAR2(30)| No | CHECK | Ledger type (`RECEIPT`, `ALLOCATION`, `RETURN`, `ADJUSTMENT`, `DAMAGE`, `TRANSFER`) |
| `Quantity` | NUMBER | No | CHECK (>0) | Quantity transacted |
| `TransactionTime`| TIMESTAMP | No | DEFAULT NOW | Execution timestamp |
| `PerformedBy` | NUMBER | No | FK -> USERS | Warehouse operator |
| `Notes` | VARCHAR2(500)| Yes | None | Transaction context |

---

### 20. RESOURCE_HANDOVERS
| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `HandoverID` | NUMBER | No | PK | Chain of custody record |
| `ResourceID` | NUMBER | No | FK -> RESOURCES | Asset transferred |
| `FromUserID` | NUMBER | No | FK -> USERS | Transferring officer |
| `ToUserID` | NUMBER | No | FK -> USERS | Receiving officer |
| `Quantity` | NUMBER | No | CHECK (>0) | Transferred units |
| `HandoverLocationID`| NUMBER| No | FK -> LOCATIONS | Site of physical exchange |
| `HandoverTime` | TIMESTAMP | No | DEFAULT NOW | Exchange timestamp |
| `ConditionBefore`| VARCHAR2(50)| No | None | Physical inspection prior |
| `ConditionAfter` | VARCHAR2(50)| No | None | Physical inspection after |
| `Notes` | VARCHAR2(500)| Yes | None | Custody notes |

---

### 21. FIELD_REPORTS
| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `ReportID` | NUMBER | No | PK | Tactical field situation report |
| `MissionID` | NUMBER | No | FK -> MISSIONS | Active mission context |
| `ResponderID` | NUMBER | No | FK -> RESPONDERS| Reporting team |
| `ReportType` | VARCHAR2(50) | No | CHECK | Situation classification (`ROAD_BLOCKED`, `ADDITIONAL_RESOURCE`, `INJURY`, `DAMAGE`, `WEATHER`, `SAFETY_RISK`, `MISSION_UPDATE`, `OTHER`) |
| `Description` | VARCHAR2(1000)| No | None | Tactical details |
| `LocationID` | NUMBER | No | FK -> LOCATIONS | Precise coordinates |
| `Severity` | VARCHAR2(20) | No | CHECK | Threat level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) |
| `CreatedAt` | TIMESTAMP | No | DEFAULT NOW | Submission timestamp |

---

### 22. INCIDENT_LOGS
| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `LogID` | NUMBER | No | PK | Immutable audit record |
| `IncidentID` | NUMBER | No | FK -> INCIDENTS | Associated disaster |
| `UserID` | NUMBER | Yes | FK -> USERS | Acting user |
| `ActionType` | VARCHAR2(50) | No | None | Activity token (`INCIDENT_CREATED`, `REQUEST_SUBMITTED`, `MISSION_CREATED`, `RESOURCE_ALLOCATED`, `FIELD_REPORT`, `INCIDENT_UPDATED`, etc.) |
| `Description` | VARCHAR2(1000)| No | None | Detailed audit message |
| `Timestamp` | TIMESTAMP | No | DEFAULT NOW | Execution timestamp |
| `IPAddress` | VARCHAR2(50) | Yes | None | Client IP address |
