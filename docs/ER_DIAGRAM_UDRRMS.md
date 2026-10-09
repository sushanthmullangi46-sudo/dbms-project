# Urban Disaster Relief and Resource Management System (UDRRMS)
## Entity-Relationship Diagram (27 Normalized Tables in 3NF)

```mermaid
erDiagram
    ROLE ||--o{ USER_ACCOUNT : "categorizes"
    USER_ACCOUNT ||--o| CITIZEN : "has profile"
    USER_ACCOUNT ||--o{ NOTIFICATION : "receives"
    USER_ACCOUNT ||--o{ AUDIT_LOG : "triggers"
    AGENCY ||--o{ RESPONSE_TEAM : "deploys"
    
    DISASTER_LOCATION ||--o{ DISASTER_REPORT : "occurs at"
    DISASTER_LOCATION ||--o{ DISASTER : "pinpoints"
    DISASTER_LOCATION ||--o{ WAREHOUSE : "situates"
    DISASTER_LOCATION ||--o{ SHELTER : "hosts"
    DISASTER_LOCATION ||--o{ HOSPITAL : "locates"

    USER_ACCOUNT ||--o{ DISASTER_REPORT : "submits"
    DISASTER_REPORT ||--o{ REPORT_ATTACHMENT : "includes"
    DISASTER_REPORT ||--o{ REPORT_UPDATE : "supplements"
    DISASTER_REPORT }o--o| DISASTER : "consolidated into"

    DISASTER ||--o{ INCIDENT_WORKFLOW_EVENT : "logs stages"
    DISASTER ||--o{ TEAM_ASSIGNMENT : "tasks"
    DISASTER ||--o{ RESOURCE_REQUEST : "requires"
    DISASTER ||--o{ MEDICAL_REFERRAL : "generates"
    DISASTER ||--o{ SHELTER_REGISTRATION : "evacuates into"

    RESPONSE_TEAM ||--o{ TEAM_ASSIGNMENT : "executes"

    RESOURCE ||--o{ INVENTORY : "stocked in"
    RESOURCE ||--o{ REQUEST_ITEM : "specifies"
    WAREHOUSE ||--o{ INVENTORY : "stores"
    WAREHOUSE ||--o{ RESOURCE_ALLOCATION : "sources"

    RESOURCE_REQUEST ||--o{ REQUEST_ITEM : "contains"
    RESOURCE_REQUEST ||--o{ RESOURCE_ALLOCATION : "approved into"

    RESOURCE_ALLOCATION ||--o{ DELIVERY : "dispatches"
    DELIVERY ||--o{ DELIVERY_ITEM : "transports"

    SHELTER ||--o{ SHELTER_REGISTRATION : "accommodates"
    USER_ACCOUNT ||--o{ SHELTER_REGISTRATION : "checks in"

    HOSPITAL ||--o{ MEDICAL_REFERRAL : "treats"
    USER_ACCOUNT ||--o{ MEDICAL_REFERRAL : "patient"
    CITIZEN ||--o{ AFFECTED_PERSON : "declares family"

    %% Table Entities
    USER_ACCOUNT {
        int user_id PK
        int role_id FK
        string full_name
        string email UK
        string password_hash
        string phone
        string account_status
    }
    ROLE {
        int role_id PK
        string role_name UK
        string description
    }
    AGENCY {
        int agency_id PK
        string agency_name UK
        string agency_type
        string contact_phone
    }
    CITIZEN {
        int citizen_id PK
        int user_id FK, UK
        string address
        string emergency_contact
        string special_needs
    }
    DISASTER_LOCATION {
        int location_id PK
        string location_name
        string ward_name
        float latitude
        float longitude
        string risk_zone
    }
    DISASTER_REPORT {
        int report_id PK
        string report_reference_id UK
        int reporter_user_id FK
        int location_id FK
        int disaster_id FK
        string disaster_type
        string description
        int people_affected
        int injuries_reported
        int missing_persons
        int trapped_persons
        boolean urgent_medical_needed
        boolean evacuation_needed
        string status
        timestamp submitted_at
        timestamp verified_at
    }
    DISASTER {
        int disaster_id PK
        string incident_code UK
        string disaster_name
        string disaster_type
        int location_id FK
        float severity_score
        string severity_level
        string status
        timestamp activated_at
        timestamp closed_at
    }
    RESPONSE_TEAM {
        int team_id PK
        int agency_id FK
        string team_name
        string specialization
        int capacity
        string readiness_status
    }
    TEAM_ASSIGNMENT {
        int assignment_id PK
        int disaster_id FK
        int team_id FK
        string mission_objective
        string status
        timestamp assigned_at
        timestamp completed_at
    }
    RESOURCE {
        int resource_id PK
        string resource_name UK
        string category
        string unit
        boolean is_perishable
        float standard_unit_cost
    }
    WAREHOUSE {
        int warehouse_id PK
        string warehouse_name UK
        int location_id FK
        string manager_name
        int capacity_pallets
    }
    INVENTORY {
        int inventory_id PK
        int warehouse_id FK
        int resource_id FK
        int quantity_available
        int quantity_reserved
        int reorder_threshold
    }
    RESOURCE_REQUEST {
        int request_id PK
        int disaster_id FK
        string status
        string priority
        timestamp requested_at
    }
    RESOURCE_ALLOCATION {
        int allocation_id PK
        int request_id FK
        int warehouse_id FK
        int quantity_allocated
        string status
        timestamp allocated_at
    }
    DELIVERY {
        int delivery_id PK
        string dispatch_reference UK
        int allocation_id FK
        string destination
        string carrier_info
        int quantity_dispatched
        int quantity_received
        int quantity_damaged
        string status
        timestamp dispatched_at
        timestamp delivered_at
    }
    SHELTER {
        int shelter_id PK
        string shelter_name UK
        int location_id FK
        int capacity
        int current_occupancy
        string status
    }
    HOSPITAL {
        int hospital_id PK
        string hospital_name UK
        int location_id FK
        int total_icu_beds
        int available_icu_beds
        int total_general_beds
        int available_general_beds
    }
    AUDIT_LOG {
        int log_id PK
        string entity_name
        string entity_id
        string action
        int performed_by FK
        string actor_name
        string details
        timestamp timestamp
    }
```

### Table Normalization Rationale (3NF Compliance)
1. **Separation of Report and Operational Incident**: Citizens submit individual reports (`DISASTER_REPORT`). Multiple reports from nearby callers are merged into a single operational incident (`DISASTER`), avoiding data duplication while preserving complete reporting histories and caller identities.
2. **Transaction Isolation in Inventory**: Warehouse inventory (`INVENTORY`) separates `quantity_available` from `quantity_reserved`. When an allocation is approved, quantities move transactionally between available and reserved balances without double-allocation.
3. **Audit Immutability**: All stage transitions generate permanent event rows in `INCIDENT_WORKFLOW_EVENT` and `AUDIT_LOG` with foreign key actors, timestamps, and justification reasons.
