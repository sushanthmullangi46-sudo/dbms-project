from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Auth Schemas
class UserRegister(BaseModel):
    full_name: str
    email: str
    password: str
    role_name: str = "CITIZEN" # CITIZEN, DISASTER_OFFICER, COORDINATOR
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    special_needs: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    full_name: str
    email: str
    role: str

class UserProfile(BaseModel):
    user_id: int
    full_name: str
    email: str
    role: str
    phone: Optional[str] = None
    created_at: datetime

# Disaster Report Schemas
class DisasterReportCreate(BaseModel):
    location_id: int
    disaster_type: str
    description: str
    people_affected: int = 1
    injuries_reported: int = 0
    missing_persons: int = 0
    trapped_persons: int = 0
    urgent_medical_needed: bool = False
    evacuation_needed: bool = False
    attachment_urls: Optional[List[str]] = []

class ReportVerificationAction(BaseModel):
    action: str # VERIFY, REJECT, AWAIT_INFO, LINK_DUPLICATE
    rejection_reason: Optional[str] = None
    target_report_id: Optional[int] = None # For duplicates

class ReportUpdateCreate(BaseModel):
    message: Optional[str] = None
    update_text: Optional[str] = None
    note: Optional[str] = None

class AssistanceRequestCreate(BaseModel):
    request_type: str = "GENERAL"
    quantity_or_people: int = 1
    notes: Optional[str] = None

# Severity Assessment & Activation
class SeverityAssessmentRequest(BaseModel):
    disaster_type: str
    people_affected: int
    injuries: int = 0
    trapped: int = 0
    missing: int = 0
    infrastructure_damage: str = "MODERATE" # CRITICAL, SEVERE, MODERATE, LOW
    medical_urgency: bool = False
    override_level: Optional[str] = None # P1, P2, P3, P4
    override_reason: Optional[str] = None

class IncidentActivationRequest(BaseModel):
    disaster_name: str
    estimated_population: int = 500
    priority_level: str = "P2"
    checklist: Optional[List[str]] = []

class IncidentEscalationRequest(BaseModel):
    escalation_reason: str

class IncidentClosureRequest(BaseModel):
    closure_summary: str
    confirm_all_rescued: bool = True
    confirm_supplies_reconciled: bool = True
    confirm_medical_handed_over: bool = True

# Team & Mission Assignment
class TeamAssignmentCreate(BaseModel):
    team_id: int
    disaster_id: int

class TeamStatusUpdate(BaseModel):
    new_status: str # ACKNOWLEDGED, EN_ROUTE, ON_SCENE, COMPLETED, CANCELLED
    notes: Optional[str] = None

# Resource Management
class RequestItemCreate(BaseModel):
    resource_id: int
    quantity_requested: int

class ResourceRequestCreate(BaseModel):
    disaster_id: int
    items: List[RequestItemCreate]
    priority: str = "P2"

class ResourceApprovalRequest(BaseModel):
    request_id: int
    warehouse_id: int
    approved_items: Optional[List[Dict[str, int]]] = None
    quantity_allocated: Optional[int] = None
    resource_id: Optional[int] = None

class DeliveryDispatchCreate(BaseModel):
    allocation_id: int
    transport_driver_name: str
    vehicle_registration: str

class DeliveryConfirmationRequest(BaseModel):
    quantity_received: int
    quantity_damaged: int = 0
    receiver_name: str
    proof_of_delivery_note: Optional[str] = None

# Evacuation & Shelter
class ShelterRegistrationCreate(BaseModel):
    shelter_id: int
    dependents_count: int = 0
    special_requirements: Optional[str] = None

# Medical Referral
class MedicalReferralCreate(BaseModel):
    disaster_id: int
    hospital_id: int
    patient_name: str
    injury_severity: str = "SERIOUS"
    assigned_ambulance: Optional[str] = None
