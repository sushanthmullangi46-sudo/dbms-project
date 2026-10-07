# UDR-ORP — Entity Relationship (ER) Diagram & Architecture

The **Urban Disaster Response & Resource Orchestration Platform (UDR-ORP)** relational model consists of 22 normalized tables designed to at least 3NF.

## Mermaid Entity-Relationship Diagram

```mermaid
erDiagram
    ROLES ||--o{ USERS : "assigned_to"
    USERS ||--o{ INCIDENTS : "creates"
    USERS ||--o| RESPONDERS : "operates_as"
    USERS ||--o{ RESOURCES : "provided_by"
    USERS ||--o{ VEHICLES : "owned_by"
    USERS ||--o{ REQUESTS : "requested_by"
    USERS ||--o{ MISSIONS : "assigned_by"
    USERS ||--o{ INCIDENT_LOGS : "audited_by"

    LOCATIONS ||--o{ SHELTERS : "hosts"
    LOCATIONS ||--o{ WAREHOUSES : "hosts"
    LOCATIONS ||--o{ INCIDENTS : "epicenter_of"
    LOCATIONS ||--o{ INCIDENT_ZONES : "affected_in"
    LOCATIONS ||--o{ REQUESTS : "origin_of"
    LOCATIONS ||--o{ FIELD_REPORTS : "reported_at"
    LOCATIONS ||--o{ RESOURCE_HANDOVERS : "occurred_at"

    INCIDENTS ||--o{ INCIDENT_ZONES : "impacts"
    INCIDENTS ||--o{ REQUESTS : "generates"
    INCIDENTS ||--o{ INCIDENT_LOGS : "logs"

    REQUESTS ||--o{ REQUEST_ITEMS : "specifies"
    REQUESTS ||--o{ MISSIONS : "triggers"

    RESOURCE_TYPES ||--o{ REQUEST_ITEMS : "requested_as"
    RESOURCE_TYPES ||--o{ RESOURCES : "categorizes"
    RESOURCE_TYPES ||--o{ INVENTORY : "stocked_as"
    RESOURCE_TYPES ||--o{ INVENTORY_TRANSACTIONS : "tracked_in"

    WAREHOUSES ||--o{ INVENTORY : "stores"
    WAREHOUSES ||--o{ INVENTORY_TRANSACTIONS : "transacts_at"

    RESPONDERS ||--o{ RESPONDER_SKILLS : "possesses"
    SKILLS ||--o{ RESPONDER_SKILLS : "classified_in"

    RESPONDERS ||--o{ MISSIONS : "dispatched_to"
    VEHICLES ||--o{ MISSIONS : "assigned_to"

    MISSIONS ||--o{ MISSION_RESOURCES : "allocates"
    RESOURCES ||--o{ MISSION_RESOURCES : "utilized_in"
    RESOURCES ||--o{ RESOURCE_HANDOVERS : "transferred_in"

    MISSIONS ||--o{ FIELD_REPORTS : "yields"
    MISSIONS ||--o{ INVENTORY_TRANSACTIONS : "associated_with"

    USERS {
        NUMBER UserID PK
        NUMBER RoleID FK
        VARCHAR2 FullName
        VARCHAR2 Email UK
        VARCHAR2 Phone
        VARCHAR2 PasswordHash
        VARCHAR2 AccountStatus
        TIMESTAMP CreatedAt
    }

    ROLES {
        NUMBER RoleID PK
        VARCHAR2 RoleName UK
        VARCHAR2 Description
    }

    LOCATIONS {
        NUMBER LocationID PK
        VARCHAR2 LocationName
        VARCHAR2 Address
        VARCHAR2 City
        VARCHAR2 State
        NUMBER Latitude
        NUMBER Longitude
        VARCHAR2 RiskZone
    }

    INCIDENTS {
        NUMBER IncidentID PK
        VARCHAR2 IncidentName
        VARCHAR2 IncidentType
        VARCHAR2 Severity
        NUMBER LocationID FK
        VARCHAR2 Description
        VARCHAR2 Status
        NUMBER CreatedBy FK
    }

    REQUESTS {
        NUMBER RequestID PK
        NUMBER IncidentID FK
        NUMBER LocationID FK
        NUMBER RequestedBy FK
        VARCHAR2 RequestType
        VARCHAR2 Priority
        NUMBER PeopleAffected
        VARCHAR2 Status
    }

    MISSIONS {
        NUMBER MissionID PK
        NUMBER RequestID FK
        NUMBER ResponderID FK
        NUMBER VehicleID FK
        NUMBER AssignedBy FK
        VARCHAR2 Status
        VARCHAR2 Priority
        TIMESTAMP StartTime
        TIMESTAMP ActualEndTime
    }

    RESOURCES {
        NUMBER ResourceID PK
        NUMBER ProviderID FK
        NUMBER ResourceTypeID FK
        VARCHAR2 ResourceName
        NUMBER Quantity
        VARCHAR2 AvailabilityStatus
    }

    INVENTORY {
        NUMBER InventoryID PK
        NUMBER WarehouseID FK
        NUMBER ResourceTypeID FK
        NUMBER QuantityAvailable
        NUMBER ReorderLevel
    }
```

## Cardinality & Multiplicity Matrix

| Relationship | Type | Parent Entity | Child Entity | Foreign Key Column |
|---|---|---|---|---|
| Role Assignment | 1 : N | ROLES | USERS | `RoleID` |
| Incident Origination | 1 : N | USERS | INCIDENTS | `CreatedBy` |
| Epicenter Location | 1 : N | LOCATIONS | INCIDENTS | `LocationID` |
| Multi-Zone Impact | M : N | INCIDENTS, LOCATIONS | INCIDENT_ZONES | `IncidentID`, `LocationID` |
| Emergency Request | 1 : N | INCIDENTS | REQUESTS | `IncidentID` |
| Request Resource Item | 1 : N | REQUESTS | REQUEST_ITEMS | `RequestID` |
| Resource Categorization | 1 : N | RESOURCE_TYPES | RESOURCES | `ResourceTypeID` |
| Warehouse Stocking | M : N | WAREHOUSES, RESOURCE_TYPES | INVENTORY | `WarehouseID`, `ResourceTypeID` |
| Mission Dispatch | 1 : N | REQUESTS | MISSIONS | `RequestID` |
| Tactical Assignment | 1 : N | RESPONDERS | MISSIONS | `ResponderID` |
| Mission Assets | M : N | MISSIONS, RESOURCES | MISSION_RESOURCES | `MissionID`, `ResourceID` |
| Field Reports | 1 : N | MISSIONS | FIELD_REPORTS | `MissionID` |
