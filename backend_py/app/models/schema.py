from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, CheckConstraint, UniqueConstraint
)
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

# 1. ROLE (COMMAND_OFFICER, CITIZEN, COORDINATOR)
class Role(Base):
    __tablename__ = "role"
    role_id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String(50), unique=True, nullable=False) # CITIZEN, DISASTER_OFFICER, COORDINATOR
    description = Column(String(255), nullable=True)

    users = relationship("UserAccount", back_populates="role")

# 2. AGENCY (NDRF, SDRF, EMS, Fire & Rescue, Red Cross)
class Agency(Base):
    __tablename__ = "agency"
    agency_id = Column(Integer, primary_key=True, index=True)
    agency_name = Column(String(100), unique=True, nullable=False)
    agency_type = Column(String(50), nullable=False) # RESCUE, MEDICAL, FIRE, LOGISTICS, NGO
    contact_phone = Column(String(50), nullable=True)
    contact_email = Column(String(100), nullable=True)

    teams = relationship("ResponseTeam", back_populates="agency")

# 3. USER_ACCOUNT
class UserAccount(Base):
    __tablename__ = "user_account"
    user_id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("role.role_id"), nullable=False)
    full_name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    password_hash = Column(String(255), nullable=False)
    account_status = Column(String(20), default="ACTIVE", nullable=False) # ACTIVE, SUSPENDED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    role = relationship("Role", back_populates="users")
    citizen_profile = relationship("Citizen", back_populates="user", uselist=False)
    reports = relationship("DisasterReport", back_populates="reporter")
    notifications = relationship("Notification", back_populates="user")

# 4. CITIZEN (Profile details)
class Citizen(Base):
    __tablename__ = "citizen"
    citizen_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_account.user_id"), unique=True, nullable=False)
    address = Column(String(255), nullable=True)
    emergency_contact = Column(String(50), nullable=True)
    special_needs = Column(Text, nullable=True) # Elderly, Mobility Impaired, Infant

    user = relationship("UserAccount", back_populates="citizen_profile")
    registrations = relationship("ShelterRegistration", back_populates="citizen")

# 5. DISASTER_LOCATION
class DisasterLocation(Base):
    __tablename__ = "disaster_location"
    location_id = Column(Integer, primary_key=True, index=True)
    location_name = Column(String(120), nullable=False)
    address = Column(String(255), nullable=True)
    ward_name = Column(String(80), nullable=True)
    city = Column(String(60), default="Bangalore", nullable=False)
    state = Column(String(60), default="Karnataka", nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    risk_zone = Column(String(20), default="MODERATE", nullable=False) # CRITICAL, HIGH, MODERATE, LOW, SAFE

    reports = relationship("DisasterReport", back_populates="location")
    disasters = relationship("Disaster", back_populates="location")
    warehouses = relationship("Warehouse", back_populates="location")
    shelters = relationship("Shelter", back_populates="location")
    hospitals = relationship("Hospital", back_populates="location")

# 6. DISASTER_REPORT (Citizen reporting entity)
class DisasterReport(Base):
    __tablename__ = "disaster_report"
    report_id = Column(Integer, primary_key=True, index=True)
    report_reference_id = Column(String(36), unique=True, nullable=False, index=True)
    reporter_user_id = Column(Integer, ForeignKey("user_account.user_id"), nullable=False)
    location_id = Column(Integer, ForeignKey("disaster_location.location_id"), nullable=False)
    disaster_id = Column(Integer, ForeignKey("disaster.disaster_id"), nullable=True) # Linked when verified
    
    disaster_type = Column(String(50), nullable=False) # Flood, Fire, Earthquake, Building collapse, etc.
    description = Column(Text, nullable=False)
    people_affected = Column(Integer, default=1, nullable=False)
    injuries_reported = Column(Integer, default=0, nullable=False)
    missing_persons = Column(Integer, default=0, nullable=False)
    trapped_persons = Column(Integer, default=0, nullable=False)
    urgent_medical_needed = Column(Boolean, default=False, nullable=False)
    evacuation_needed = Column(Boolean, default=False, nullable=False)
    
    status = Column(String(30), default="SUBMITTED", nullable=False) # SUBMITTED, VERIFIED, AWAITING_INFORMATION, REJECTED, LINKED_DUPLICATE
    rejection_reason = Column(Text, nullable=True)
    duplicate_of_report_id = Column(Integer, ForeignKey("disaster_report.report_id"), nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    verified_at = Column(DateTime, nullable=True)

    reporter = relationship("UserAccount", back_populates="reports")
    location = relationship("DisasterLocation", back_populates="reports")
    disaster = relationship("Disaster", back_populates="reports")
    attachments = relationship("ReportAttachment", back_populates="report")
    updates = relationship("ReportUpdate", back_populates="report")

# 7. REPORT_ATTACHMENT (Photos / Evidence)
class ReportAttachment(Base):
    __tablename__ = "report_attachment"
    attachment_id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("disaster_report.report_id"), nullable=False)
    file_url = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    description = Column(String(255), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    report = relationship("DisasterReport", back_populates="attachments")

# 8. REPORT_UPDATE (Citizen or Officer supplemental notes)
class ReportUpdate(Base):
    __tablename__ = "report_update"
    update_id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("disaster_report.report_id"), nullable=False)
    author_id = Column(Integer, ForeignKey("user_account.user_id"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    report = relationship("DisasterReport", back_populates="updates")

# 9. DISASTER (Operational Incident entity)
class Disaster(Base):
    __tablename__ = "disaster"
    disaster_id = Column(Integer, primary_key=True, index=True)
    incident_code = Column(String(36), unique=True, nullable=False, index=True)
    disaster_name = Column(String(120), nullable=False)
    disaster_type = Column(String(50), nullable=False)
    location_id = Column(Integer, ForeignKey("disaster_location.location_id"), nullable=False)
    
    # Severity & Assessment
    severity_score = Column(Float, default=1.0, nullable=False)
    severity_level = Column(String(10), default="P3", nullable=False) # P1, P2, P3, P4
    override_reason = Column(Text, nullable=True)
    assessed_by = Column(Integer, ForeignKey("user_account.user_id"), nullable=True)
    
    status = Column(String(30), default="ACTIVE", nullable=False)
    # SUBMITTED, VERIFIED, ASSESSED, ACTIVE, RESPONSE_IN_PROGRESS, RECOVERY, CLOSED, ON_HOLD, REOPENED
    
    is_escalated = Column(Boolean, default=False, nullable=False)
    escalation_reason = Column(Text, nullable=True)
    closure_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    activated_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)

    location = relationship("DisasterLocation", back_populates="disasters")
    reports = relationship("DisasterReport", back_populates="disaster")
    affected_people = relationship("AffectedPerson", back_populates="disaster")
    team_assignments = relationship("TeamAssignment", back_populates="disaster")
    resource_requests = relationship("ResourceRequest", back_populates="disaster")
    workflow_events = relationship("IncidentWorkflowEvent", back_populates="disaster")

# 10. AFFECTED_PERSON (Victim tracking)
class AffectedPerson(Base):
    __tablename__ = "affected_person"
    person_id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster.disaster_id"), nullable=False)
    full_name = Column(String(100), nullable=True)
    status = Column(String(30), default="SAFE", nullable=False) # TRAPPED, INJURED, MISSING, EVACUATED, SAFE, HOSPITALIZED
    triage_priority = Column(String(10), default="P3", nullable=False)
    notes = Column(Text, nullable=True)
    registered_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    disaster = relationship("Disaster", back_populates="affected_people")

# 11. RESPONSE_TEAM
class ResponseTeam(Base):
    __tablename__ = "response_team"
    team_id = Column(Integer, primary_key=True, index=True)
    agency_id = Column(Integer, ForeignKey("agency.agency_id"), nullable=False)
    team_name = Column(String(100), nullable=False)
    leader_name = Column(String(100), nullable=False)
    contact_phone = Column(String(50), nullable=False)
    specialization = Column(String(80), nullable=False) # WATER_RESCUE, MEDICAL_TRIAGE, COLLAPSE_SAR, HAZMAT
    capacity = Column(Integer, default=10, nullable=False)
    readiness_status = Column(String(30), default="AVAILABLE", nullable=False) # AVAILABLE, ASSIGNED, ON_MISSION, MAINTENANCE

    agency = relationship("Agency", back_populates="teams")
    assignments = relationship("TeamAssignment", back_populates="team")

# 12. TEAM_ASSIGNMENT (Mission dispatch)
class TeamAssignment(Base):
    __tablename__ = "team_assignment"
    assignment_id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster.disaster_id"), nullable=False)
    team_id = Column(Integer, ForeignKey("response_team.team_id"), nullable=False)
    assigned_by = Column(Integer, ForeignKey("user_account.user_id"), nullable=False)
    
    assignment_status = Column(String(30), default="ASSIGNED", nullable=False)
    # ASSIGNED -> ACKNOWLEDGED -> EN_ROUTE -> ON_SCENE -> COMPLETED (or CANCELLED, REASSIGNED)
    
    cancellation_reason = Column(Text, nullable=True)
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    acknowledged_at = Column(DateTime, nullable=True)
    en_route_at = Column(DateTime, nullable=True)
    on_scene_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    disaster = relationship("Disaster", back_populates="team_assignments")
    team = relationship("ResponseTeam", back_populates="assignments")

# 13. RESOURCE (Catalog of goods & equipment)
class Resource(Base):
    __tablename__ = "resource"
    resource_id = Column(Integer, primary_key=True, index=True)
    resource_name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False) # FOOD, WATER, MEDICAL, SHELTER_SUPPLIES, EQUIPMENT
    unit = Column(String(30), nullable=False) # Packets, Litres, Kits, Blankets, Boats
    is_perishable = Column(Boolean, default=False, nullable=False)
    standard_unit_cost = Column(Float, default=0.0, nullable=False)

    inventory_records = relationship("Inventory", back_populates="resource")
    request_items = relationship("RequestItem", back_populates="resource")

# 14. WAREHOUSE
class Warehouse(Base):
    __tablename__ = "warehouse"
    warehouse_id = Column(Integer, primary_key=True, index=True)
    warehouse_name = Column(String(100), nullable=False)
    location_id = Column(Integer, ForeignKey("disaster_location.location_id"), nullable=False)
    manager_name = Column(String(100), nullable=False)
    capacity_pallets = Column(Integer, default=5000, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    location = relationship("DisasterLocation", back_populates="warehouses")
    inventory = relationship("Inventory", back_populates="warehouse")
    allocations = relationship("ResourceAllocation", back_populates="warehouse")
    deliveries = relationship("Delivery", back_populates="warehouse")

# 15. INVENTORY (Warehouse stock balances)
class Inventory(Base):
    __tablename__ = "inventory"
    inventory_id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouse.warehouse_id"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resource.resource_id"), nullable=False)
    
    quantity_available = Column(Integer, default=0, nullable=False) # Free unreserved stock
    quantity_reserved = Column(Integer, default=0, nullable=False)  # Reserved for active dispatches
    reorder_threshold = Column(Integer, default=50, nullable=False)
    expiry_date = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint('warehouse_id', 'resource_id', name='uq_warehouse_resource'),
        CheckConstraint('quantity_available >= 0', name='chk_positive_inventory'),
        CheckConstraint('quantity_reserved >= 0', name='chk_positive_reserved'),
    )

    warehouse = relationship("Warehouse", back_populates="inventory")
    resource = relationship("Resource", back_populates="inventory_records")

# 16. RESOURCE_REQUEST
class ResourceRequest(Base):
    __tablename__ = "resource_request"
    request_id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster.disaster_id"), nullable=False)
    requested_by = Column(Integer, ForeignKey("user_account.user_id"), nullable=False)
    status = Column(String(30), default="PENDING_APPROVAL", nullable=False) # PENDING_APPROVAL, APPROVED, PARTIALLY_APPROVED, REJECTED, FULFILLED
    priority = Column(String(10), default="P2", nullable=False)
    rejection_reason = Column(Text, nullable=True)
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    disaster = relationship("Disaster", back_populates="resource_requests")
    items = relationship("RequestItem", back_populates="request")
    allocations = relationship("ResourceAllocation", back_populates="request")

# 17. REQUEST_ITEM
class RequestItem(Base):
    __tablename__ = "request_item"
    request_item_id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("resource_request.request_id"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resource.resource_id"), nullable=False)
    quantity_requested = Column(Integer, nullable=False)
    quantity_approved = Column(Integer, default=0, nullable=False)

    request = relationship("ResourceRequest", back_populates="items")
    resource = relationship("Resource", back_populates="request_items")

# 18. RESOURCE_ALLOCATION
class ResourceAllocation(Base):
    __tablename__ = "resource_allocation"
    allocation_id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("resource_request.request_id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouse.warehouse_id"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resource.resource_id"), nullable=False)
    allocated_quantity = Column(Integer, nullable=False)
    allocated_by = Column(Integer, ForeignKey("user_account.user_id"), nullable=False)
    dispatch_reference = Column(String(36), unique=True, nullable=False)
    allocation_status = Column(String(30), default="RESERVED", nullable=False) # RESERVED, DISPATCHED, COMPLETED, CANCELLED
    allocated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    request = relationship("ResourceRequest", back_populates="allocations")
    warehouse = relationship("Warehouse", back_populates="allocations")

# 19. DELIVERY
class Delivery(Base):
    __tablename__ = "delivery"
    delivery_id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouse.warehouse_id"), nullable=False)
    disaster_id = Column(Integer, ForeignKey("disaster.disaster_id"), nullable=False)
    transport_driver_name = Column(String(100), nullable=True)
    vehicle_registration = Column(String(50), nullable=True)
    
    delivery_status = Column(String(30), default="PREPARING", nullable=False)
    # PREPARING -> DISPATCHED -> IN_TRANSIT -> DELIVERED (or FAILED, PARTIALLY_DELIVERED, RETURNED)
    
    dispatched_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    receiver_name = Column(String(100), nullable=True)
    proof_of_delivery_note = Column(Text, nullable=True)

    warehouse = relationship("Warehouse", back_populates="deliveries")
    items = relationship("DeliveryItem", back_populates="delivery")

# 20. DELIVERY_ITEM
class DeliveryItem(Base):
    __tablename__ = "delivery_item"
    delivery_item_id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("delivery.delivery_id"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resource.resource_id"), nullable=False)
    quantity_dispatched = Column(Integer, nullable=False)
    quantity_received = Column(Integer, default=0, nullable=False)
    quantity_damaged = Column(Integer, default=0, nullable=False)

    delivery = relationship("Delivery", back_populates="items")

# 21. SHELTER
class Shelter(Base):
    __tablename__ = "shelter"
    shelter_id = Column(Integer, primary_key=True, index=True)
    shelter_name = Column(String(120), nullable=False)
    location_id = Column(Integer, ForeignKey("disaster_location.location_id"), nullable=False)
    capacity = Column(Integer, nullable=False)
    current_occupancy = Column(Integer, default=0, nullable=False)
    status = Column(String(20), default="OPEN", nullable=False) # OPEN, FULL, CLOSED
    has_medical_unit = Column(Boolean, default=True, nullable=False)
    has_potable_water = Column(Boolean, default=True, nullable=False)

    __table_args__ = (
        CheckConstraint('current_occupancy >= 0', name='chk_shelter_min_occ'),
        CheckConstraint('current_occupancy <= capacity', name='chk_shelter_max_capacity'),
    )

    location = relationship("DisasterLocation", back_populates="shelters")
    registrations = relationship("ShelterRegistration", back_populates="shelter")

# 22. SHELTER_REGISTRATION (Citizen Check-in / Check-out)
class ShelterRegistration(Base):
    __tablename__ = "shelter_registration"
    registration_id = Column(Integer, primary_key=True, index=True)
    shelter_id = Column(Integer, ForeignKey("shelter.shelter_id"), nullable=False)
    citizen_id = Column(Integer, ForeignKey("citizen.citizen_id"), nullable=False)
    check_in_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    check_out_time = Column(DateTime, nullable=True)
    dependents_count = Column(Integer, default=0, nullable=False)
    special_requirements = Column(Text, nullable=True)

    shelter = relationship("Shelter", back_populates="registrations")
    citizen = relationship("Citizen", back_populates="registrations")

# 23. HOSPITAL
class Hospital(Base):
    __tablename__ = "hospital"
    hospital_id = Column(Integer, primary_key=True, index=True)
    hospital_name = Column(String(120), nullable=False)
    location_id = Column(Integer, ForeignKey("disaster_location.location_id"), nullable=False)
    total_icu_beds = Column(Integer, default=30, nullable=False)
    available_icu_beds = Column(Integer, default=10, nullable=False)
    total_general_beds = Column(Integer, default=150, nullable=False)
    available_general_beds = Column(Integer, default=45, nullable=False)
    trauma_center_level = Column(String(20), default="LEVEL_1", nullable=False)

    location = relationship("DisasterLocation", back_populates="hospitals")
    referrals = relationship("MedicalReferral", back_populates="hospital")

# 24. MEDICAL_REFERRAL
class MedicalReferral(Base):
    __tablename__ = "medical_referral"
    referral_id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster.disaster_id"), nullable=False)
    hospital_id = Column(Integer, ForeignKey("hospital.hospital_id"), nullable=False)
    patient_name = Column(String(100), nullable=False)
    injury_severity = Column(String(20), nullable=False) # CRITICAL, SERIOUS, MODERATE, MINOR
    assigned_ambulance = Column(String(50), nullable=True)
    referral_status = Column(String(30), default="REQUESTED", nullable=False)
    # REQUESTED -> ASSIGNED -> IN_TRANSIT -> RECEIVED -> COMPLETED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    received_at = Column(DateTime, nullable=True)

    hospital = relationship("Hospital", back_populates="referrals")

# 25. NOTIFICATION
class Notification(Base):
    __tablename__ = "notification"
    notification_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_account.user_id"), nullable=False)
    title = Column(String(120), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="ALERT", nullable=False) # ALERT, DISPATCH, STATUS_CHANGE, WARNING
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("UserAccount", back_populates="notifications")

# 26. INCIDENT_WORKFLOW_EVENT (Lifecycle Transition History)
class IncidentWorkflowEvent(Base):
    __tablename__ = "incident_workflow_event"
    event_id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster.disaster_id"), nullable=False)
    event_type = Column(String(60), nullable=False) # REPORT_SUBMITTED, SEVERITY_ASSESSED, INCIDENT_ACTIVATED, etc.
    actor_id = Column(Integer, ForeignKey("user_account.user_id"), nullable=False)
    previous_state = Column(String(40), nullable=True)
    new_state = Column(String(40), nullable=False)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    disaster = relationship("Disaster", back_populates="workflow_events")

# 27. AUDIT_LOG (Immutable master audit trail)
class AuditLog(Base):
    __tablename__ = "audit_log"
    log_id = Column(Integer, primary_key=True, index=True)
    entity_name = Column(String(60), nullable=False)
    entity_id = Column(String(60), nullable=False)
    action = Column(String(30), nullable=False) # INSERT, UPDATE, DELETE, STATE_TRANSITION
    performed_by = Column(Integer, nullable=False)
    actor_name = Column(String(100), nullable=True)
    details = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
