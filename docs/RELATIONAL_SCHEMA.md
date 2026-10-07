# UDR-ORP — Relational Database Schema & Normalization Analysis

## Relational Schema Specifications (3NF Formulation)

1. **ROLES**  
   `ROLES (RoleID [PK], RoleName [UK], Description)`  
   *FD:* `RoleID -> RoleName, Description`; `RoleName -> RoleID, Description`

2. **USERS**  
   `USERS (UserID [PK], RoleID [FK], FullName, Email [UK], Phone, PasswordHash, AccountStatus, CreatedAt, LastLogin)`  
   *FD:* `UserID -> RoleID, FullName, Email, Phone, PasswordHash, AccountStatus, CreatedAt, LastLogin`; `Email -> UserID, ...`

3. **LOCATIONS**  
   `LOCATIONS (LocationID [PK], LocationName, Address, City, State, Latitude, Longitude, RiskZone, CreatedAt)`  
   *FD:* `LocationID -> LocationName, Address, City, State, Latitude, Longitude, RiskZone, CreatedAt`

4. **SHELTERS**  
   `SHELTERS (ShelterID [PK], LocationID [FK], ShelterName, Capacity, CurrentOccupancy, MedicalFacility, WaterAvailable, Status)`  
   *FD:* `ShelterID -> LocationID, ShelterName, Capacity, CurrentOccupancy, MedicalFacility, WaterAvailable, Status`

5. **WAREHOUSES**  
   `WAREHOUSES (WarehouseID [PK], LocationID [FK], WarehouseName, Capacity, ManagerName, Status)`  
   *FD:* `WarehouseID -> LocationID, WarehouseName, Capacity, ManagerName, Status`

6. **INCIDENTS**  
   `INCIDENTS (IncidentID [PK], IncidentName, IncidentType, Severity, LocationID [FK], Description, StartTime, EndTime, Status, CreatedBy [FK], CreatedAt)`  
   *FD:* `IncidentID -> IncidentName, IncidentType, Severity, LocationID, Description, StartTime, EndTime, Status, CreatedBy, CreatedAt`

7. **INCIDENT_ZONES**  
   `INCIDENT_ZONES (IncidentID [PK/FK], LocationID [PK/FK], Severity, PopulationAffected, Notes)`  
   *FD:* `(IncidentID, LocationID) -> Severity, PopulationAffected, Notes`

8. **REQUESTS**  
   `REQUESTS (RequestID [PK], IncidentID [FK], LocationID [FK], RequestedBy [FK], RequestType, Priority, PeopleAffected, Description, Status, CreatedAt, ResolvedAt)`  
   *FD:* `RequestID -> IncidentID, LocationID, RequestedBy, RequestType, Priority, PeopleAffected, Description, Status, CreatedAt, ResolvedAt`

9. **REQUEST_ITEMS**  
   `REQUEST_ITEMS (RequestItemID [PK], RequestID [FK], ResourceTypeID [FK], QuantityRequired, QuantityAllocated, Unit)`  
   *FD:* `RequestItemID -> RequestID, ResourceTypeID, QuantityRequired, QuantityAllocated, Unit`

10. **RESOURCE_TYPES**  
    `RESOURCE_TYPES (ResourceTypeID [PK], ResourceName [UK], Category, Unit, Description)`  
    *FD:* `ResourceTypeID -> ResourceName, Category, Unit, Description`

11. **RESOURCES**  
    `RESOURCES (ResourceID [PK], ProviderID [FK], ResourceTypeID [FK], ResourceName, Quantity, Condition, AvailabilityStatus, CurrentLocationID [FK], RegistrationNumber, CreatedAt)`  
    *FD:* `ResourceID -> ProviderID, ResourceTypeID, ResourceName, Quantity, Condition, AvailabilityStatus, CurrentLocationID, RegistrationNumber, CreatedAt`

12. **VEHICLES**  
    `VEHICLES (VehicleID [PK], ProviderID [FK], VehicleType, RegistrationNumber [UK], Capacity, FuelLevel, CurrentLocationID [FK], Status, CreatedAt)`  
    *FD:* `VehicleID -> ProviderID, VehicleType, RegistrationNumber, Capacity, FuelLevel, CurrentLocationID, Status, CreatedAt`

13. **RESPONDERS**  
    `RESPONDERS (ResponderID [PK], UserID [FK, UK], TeamName, Specialization, ExperienceLevel, CurrentStatus, CurrentLocationID [FK], AvailabilityStatus)`  
    *FD:* `ResponderID -> UserID, TeamName, Specialization, ExperienceLevel, CurrentStatus, CurrentLocationID, AvailabilityStatus`

14. **SKILLS**  
    `SKILLS (SkillID [PK], SkillName [UK], Description)`  
    *FD:* `SkillID -> SkillName, Description`

15. **RESPONDER_SKILLS**  
    `RESPONDER_SKILLS (ResponderID [PK/FK], SkillID [PK/FK], CertificationLevel, CertificationExpiry)`  
    *FD:* `(ResponderID, SkillID) -> CertificationLevel, CertificationExpiry`

16. **MISSIONS**  
    `MISSIONS (MissionID [PK], RequestID [FK], ResponderID [FK], VehicleID [FK], AssignedBy [FK], StartTime, ExpectedEndTime, ActualEndTime, Status, Priority, CreatedAt)`  
    *FD:* `MissionID -> RequestID, ResponderID, VehicleID, AssignedBy, StartTime, ExpectedEndTime, ActualEndTime, Status, Priority, CreatedAt`

17. **MISSION_RESOURCES**  
    `MISSION_RESOURCES (MissionID [PK/FK], ResourceID [PK/FK], QuantityAllocated, QuantityUsed, QuantityReturned)`  
    *FD:* `(MissionID, ResourceID) -> QuantityAllocated, QuantityUsed, QuantityReturned`

18. **INVENTORY**  
    `INVENTORY (InventoryID [PK], WarehouseID [FK], ResourceTypeID [FK], QuantityAvailable, ReorderLevel, LastUpdated)`  
    *FD:* `InventoryID -> WarehouseID, ResourceTypeID, QuantityAvailable, ReorderLevel, LastUpdated`; `(WarehouseID, ResourceTypeID) -> QuantityAvailable, ...`

19. **INVENTORY_TRANSACTIONS**  
    `INVENTORY_TRANSACTIONS (TransactionID [PK], WarehouseID [FK], ResourceTypeID [FK], MissionID [FK], TransactionType, Quantity, TransactionTime, PerformedBy [FK], Notes)`  
    *FD:* `TransactionID -> WarehouseID, ResourceTypeID, MissionID, TransactionType, Quantity, TransactionTime, PerformedBy, Notes`

20. **RESOURCE_HANDOVERS**  
    `RESOURCE_HANDOVERS (HandoverID [PK], ResourceID [FK], FromUserID [FK], ToUserID [FK], Quantity, HandoverLocationID [FK], HandoverTime, ConditionBefore, ConditionAfter, Notes)`  
    *FD:* `HandoverID -> ResourceID, FromUserID, ToUserID, Quantity, HandoverLocationID, HandoverTime, ConditionBefore, ConditionAfter, Notes`

21. **FIELD_REPORTS**  
    `FIELD_REPORTS (ReportID [PK], MissionID [FK], ResponderID [FK], ReportType, Description, LocationID [FK], Severity, CreatedAt)`  
    *FD:* `ReportID -> MissionID, ResponderID, ReportType, Description, LocationID, Severity, CreatedAt`

22. **INCIDENT_LOGS**  
    `INCIDENT_LOGS (LogID [PK], IncidentID [FK], UserID [FK], ActionType, Description, Timestamp, IPAddress)`  
    *FD:* `LogID -> IncidentID, UserID, ActionType, Description, Timestamp, IPAddress`

## Normalization Validation (3NF & BCNF)
- **1NF Satisfied:** Every attribute contains atomic values (no delimited strings, no arrays of resources inside requests).
- **2NF Satisfied:** All non-prime attributes are fully functionally dependent on the entire candidate key (no partial dependencies on composite keys in `INCIDENT_ZONES`, `RESPONDER_SKILLS`, `MISSION_RESOURCES`).
- **3NF Satisfied:** No non-prime attribute is transitively dependent on any candidate key ($X \rightarrow Y$ implies $X$ is a superkey or $Y$ is a prime attribute).
