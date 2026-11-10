import uuid
from datetime import datetime
from typing import Dict, Any, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.schema import (
    DisasterReport, Disaster, DisasterLocation, UserAccount, ResponseTeam, TeamAssignment,
    Resource, Warehouse, Inventory, ResourceRequest, RequestItem, ResourceAllocation,
    Delivery, DeliveryItem, Shelter, ShelterRegistration, Hospital, MedicalReferral,
    ReportAttachment, ReportUpdate
)
from app.services.audit_service import AuditService
from app.services.scoring_service import ScoringService

SUPPLY_RESOURCE_MAP = {
    "water": 4,
    "drinking water": 4,
    "food": 3,
    "food packets": 3,
    "first aid": 5,
    "first-aid": 5,
    "first-aid kits": 5,
    "medical supplies": 8,
    "emergency medicines": 8,
    "medicines": 8,
    "medicine": 8,
    "blankets": 7,
    "blankets & warm clothing": 7,
    "clothing": 7,
    "rescue boats": 1,
    "boat": 1,
    "boats": 1,
    "emergency shelter": 9,
    "tents": 9,
    "shelter": 9,
    "oxygen cylinders": 2,
    "oxygen": 2,
    "baby supplies": 10,
    "baby food": 10,
    "infant": 10,
    "sanitation kits": 11,
    "sanitation": 11,
    "storm pump": 6,
    "pump": 6
}

class WorkflowService:

    # STAGE 1: DISASTER REPORT SUBMITTED
    @staticmethod
    def submit_report(
        db: Session,
        reporter_user_id: int,
        location_id: int,
        disaster_type: str,
        description: str,
        people_affected: int = 1,
        injuries_reported: int = 0,
        missing_persons: int = 0,
        trapped_persons: int = 0,
        urgent_medical_needed: bool = False,
        evacuation_needed: bool = False,
        attachment_urls: List[str] = [],
        requested_supplies: List[Dict[str, Any]] = None,
        severity: str = "P2"
    ) -> DisasterReport:
        location = db.query(DisasterLocation).filter(DisasterLocation.location_id == location_id).first()
        if not location:
            raise HTTPException(status_code=400, detail="Invalid disaster location ID")

        # Generate unique Report Reference ID (e.g., RPT-20261111-A1B2)
        ref_id = f"RPT-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        report = DisasterReport(
            report_reference_id=ref_id,
            reporter_user_id=reporter_user_id,
            location_id=location_id,
            disaster_type=disaster_type,
            description=description,
            people_affected=max(1, people_affected),
            injuries_reported=max(0, injuries_reported),
            missing_persons=max(0, missing_persons),
            trapped_persons=max(0, trapped_persons),
            urgent_medical_needed=urgent_medical_needed,
            evacuation_needed=evacuation_needed,
            status="SUBMITTED",
            submitted_at=datetime.utcnow()
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        # Attachments
        if attachment_urls:
            for url in attachment_urls:
                att = ReportAttachment(
                    report_id=report.report_id,
                    file_url=url,
                    file_type="IMAGE" if any(url.endswith(x) for x in [".png", ".jpg", ".jpeg"]) else "DOCUMENT"
                )
                db.add(att)
            db.commit()

        # Synchronously create or link active operational incident so that Rescue & Logistics share this emergency
        sev_level = severity or ("P1" if (trapped_persons > 0 or urgent_medical_needed) else "P2")
        inc_code = f"INC-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        disaster = Disaster(
            incident_code=inc_code,
            disaster_name=f"{disaster_type} Emergency at {location.location_name}",
            disaster_type=disaster_type,
            location_id=location_id,
            severity_score=1.5 if sev_level == "P1" else 1.0,
            severity_level=sev_level,
            status="ACTIVE",
            activated_at=datetime.utcnow()
        )
        db.add(disaster)
        db.commit()
        db.refresh(disaster)

        report.disaster_id = disaster.disaster_id
        db.commit()

        # Itemize requested supplies for Logistics & Rescue
        items_to_add = []
        if requested_supplies:
            for sup in requested_supplies:
                raw_name = (sup.get("name") or sup.get("resource_name") or sup.get("item") or "").lower().strip()
                qty = int(sup.get("quantity") or sup.get("qty") or 1)
                res_id = sup.get("resource_id") or SUPPLY_RESOURCE_MAP.get(raw_name)
                if not res_id:
                    for key, val in SUPPLY_RESOURCE_MAP.items():
                        if key in raw_name:
                            res_id = val
                            break
                if not res_id:
                    res_id = 3 # fallback to food ration
                items_to_add.append((res_id, max(1, qty)))
        else:
            # Default supplies based on condition
            if urgent_medical_needed or injuries_reported > 0:
                items_to_add.append((5, max(5, injuries_reported * 2)))
                items_to_add.append((8, 20))
            if evacuation_needed or trapped_persons > 0:
                items_to_add.append((1, max(1, (trapped_persons + 5) // 6)))
                items_to_add.append((4, max(20, people_affected * 2)))
                items_to_add.append((3, max(20, people_affected * 2)))
                items_to_add.append((7, max(10, people_affected)))

        if items_to_add:
            req = ResourceRequest(
                disaster_id=disaster.disaster_id,
                requested_by=reporter_user_id,
                status="PENDING_APPROVAL",
                priority=sev_level,
                requested_at=datetime.utcnow()
            )
            db.add(req)
            db.commit()
            db.refresh(req)
            for r_id, q_req in items_to_add:
                db.add(RequestItem(
                    request_id=req.request_id,
                    resource_id=r_id,
                    quantity_requested=q_req,
                    quantity_approved=0
                ))
            db.commit()

        # Audit initial event
        AuditService.log_audit(
            db, "DISASTER_REPORT", report.report_reference_id, "REPORT_SUBMITTED",
            reporter_user_id, "Citizen Reporter",
            {"disaster_type": disaster_type, "people_affected": people_affected, "location": location.location_name, "incident_code": disaster.incident_code}
        )

        return report


    # STAGE 2: REPORT VERIFICATION
    @staticmethod
    def verify_report(
        db: Session,
        report_id: int,
        officer: UserAccount,
        action: str, # VERIFY, REJECT, AWAIT_INFO, LINK_DUPLICATE
        rejection_reason: str = None,
        target_report_id: int = None
    ) -> DisasterReport:
        report = db.query(DisasterReport).filter(DisasterReport.report_id == report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Disaster report not found")

        prev_status = report.status

        if action == "VERIFY":
            report.status = "VERIFIED"
            report.verified_at = datetime.utcnow()
        elif action == "REJECT":
            if not rejection_reason or len(rejection_reason.strip()) < 5:
                raise HTTPException(status_code=400, detail="A mandatory justification is required to reject an emergency report")
            report.status = "REJECTED"
            report.rejection_reason = rejection_reason
        elif action == "AWAIT_INFO":
            report.status = "AWAITING_INFORMATION"
        elif action == "LINK_DUPLICATE":
            if not target_report_id or target_report_id == report_id:
                raise HTTPException(status_code=400, detail="Target master report ID required to link duplicate")
            report.status = "LINKED_DUPLICATE"
            report.duplicate_of_report_id = target_report_id
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported verification action: {action}")

        db.commit()
        db.refresh(report)

        AuditService.log_audit(
            db, "DISASTER_REPORT", report.report_reference_id, f"VERIFICATION_{action}",
            officer.user_id, officer.full_name,
            {"prev_status": prev_status, "new_status": report.status, "reason": rejection_reason}
        )

        # Notify reporter
        AuditService.notify_user(
            db, report.reporter_user_id,
            f"Report Status Update: {report.status}",
            f"Your report {report.report_reference_id} was updated to {report.status} by Disaster Command."
        )

        return report

    # STAGE 3: SEVERITY ASSESSMENT
    @staticmethod
    def assess_severity(
        db: Session,
        report_id: int,
        officer: UserAccount,
        override_level: str = None,
        override_reason: str = None
    ) -> Dict[str, Any]:
        report = db.query(DisasterReport).filter(DisasterReport.report_id == report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Disaster report not found")
        if report.status not in ("VERIFIED", "ASSESSED"):
            raise HTTPException(status_code=400, detail="Report must be VERIFIED before evaluating severity assessment")

        score_data = ScoringService.calculate_severity_score(
            disaster_type=report.disaster_type,
            people_affected=report.people_affected,
            injuries=report.injuries_reported,
            trapped=report.trapped_persons,
            missing=report.missing_persons,
            infrastructure_damage="CRITICAL" if report.trapped_persons > 0 else "MODERATE",
            medical_urgency=report.urgent_medical_needed
        )

        final_priority = score_data["recommended_priority"]
        if override_level:
            if override_level not in ("P1", "P2", "P3", "P4"):
                raise HTTPException(status_code=400, detail="Override level must be P1, P2, P3, or P4")
            if not override_reason or len(override_reason.strip()) < 5:
                raise HTTPException(status_code=400, detail="Officer must provide recorded justification to override severity recommendation")
            final_priority = override_level

        report.status = "ASSESSED"
        db.commit()

        AuditService.log_audit(
            db, "DISASTER_REPORT", report.report_reference_id, "SEVERITY_ASSESSED",
            officer.user_id, officer.full_name,
            {"recommended": score_data["recommended_priority"], "final_priority": final_priority, "score": score_data["score"]}
        )

        return {
            "report_reference_id": report.report_reference_id,
            "calculated_score": score_data["score"],
            "recommended_priority": score_data["recommended_priority"],
            "final_priority": final_priority,
            "breakdown": score_data["breakdown"],
            "explanation": score_data["explanation"]
        }

    # STAGE 4: INCIDENT ACTIVATION
    @staticmethod
    def activate_incident(
        db: Session,
        report_id: int,
        officer: UserAccount,
        disaster_name: str,
        priority_level: str = "P2"
    ) -> Disaster:
        report = db.query(DisasterReport).filter(DisasterReport.report_id == report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Disaster report not found")
        if report.status not in ("VERIFIED", "ASSESSED"):
            raise HTTPException(status_code=400, detail="Cannot activate incident from unverified report")

        if report.disaster_id:
            disaster = db.query(Disaster).filter(Disaster.disaster_id == report.disaster_id).first()
            if disaster:
                disaster.disaster_name = disaster_name
                disaster.severity_level = priority_level
                disaster.status = "ACTIVE"
                disaster.activated_at = datetime.utcnow()
                db.commit()
                db.refresh(disaster)
                AuditService.log_workflow_event(
                    db, disaster.disaster_id, "INCIDENT_ACTIVATED", officer.user_id,
                    previous_state="ASSESSED", new_state="ACTIVE", reason=f"Activated by {officer.full_name}"
                )
                AuditService.log_audit(
                    db, "DISASTER", disaster.incident_code, "INCIDENT_ACTIVATED",
                    officer.user_id, officer.full_name,
                    {"linked_report": report.report_reference_id, "priority": priority_level}
                )
                return disaster

        inc_code = f"INC-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        disaster = Disaster(
            incident_code=inc_code,
            disaster_name=disaster_name,
            disaster_type=report.disaster_type,
            location_id=report.location_id,
            severity_level=priority_level,
            status="ACTIVE",
            activated_at=datetime.utcnow()
        )
        db.add(disaster)
        db.commit()
        db.refresh(disaster)

        # Link report to activated disaster
        report.disaster_id = disaster.disaster_id
        db.commit()

        AuditService.log_workflow_event(
            db, disaster.disaster_id, "INCIDENT_ACTIVATED", officer.user_id,
            previous_state="ASSESSED", new_state="ACTIVE", reason=f"Activated by {officer.full_name}"
        )

        AuditService.log_audit(
            db, "DISASTER", disaster.incident_code, "INCIDENT_ACTIVATED",
            officer.user_id, officer.full_name,
            {"linked_report": report.report_reference_id, "priority": priority_level}
        )

        return disaster

    # STAGE 5 & 7: EMERGENCY RESOURCE ASSESSMENT & ALLOCATION (TRANSACTIONAL)
    @staticmethod
    def create_resource_request(
        db: Session,
        disaster_id: int,
        user_id: int,
        items: List[Dict[str, int]],
        priority: str = "P2"
    ) -> ResourceRequest:
        disaster = db.query(Disaster).filter(Disaster.disaster_id == disaster_id).first()
        if not disaster:
            raise HTTPException(status_code=404, detail="Active incident not found")
        if disaster.status == "CLOSED":
            raise HTTPException(status_code=400, detail="Cannot request resources for a closed incident")

        req = ResourceRequest(
            disaster_id=disaster_id,
            requested_by=user_id,
            status="PENDING_APPROVAL",
            priority=priority,
            requested_at=datetime.utcnow()
        )
        db.add(req)
        db.commit()
        db.refresh(req)

        for itm in items:
            req_item = RequestItem(
                request_id=req.request_id,
                resource_id=itm["resource_id"],
                quantity_requested=itm["quantity_requested"],
                quantity_approved=0
            )
            db.add(req_item)
        db.commit()

        AuditService.log_workflow_event(
            db, disaster_id, "RESOURCE_REQUESTED", user_id,
            previous_state=disaster.status, new_state=disaster.status,
            reason=f"Resource request #{req.request_id} created with {len(items)} items"
        )
        return req

    @staticmethod
    def approve_and_allocate_resources(
        db: Session,
        request_id: int,
        coordinator: UserAccount,
        warehouse_id: int,
        approved_items: List[Dict[str, int]]
    ) -> List[ResourceAllocation]:
        """
        Transactional Stock Allocation:
        - Prevents negative inventory
        - Prevents double allocation
        - Reserves unreserved stock atomically
        """
        req = db.query(ResourceRequest).filter(ResourceRequest.request_id == request_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Resource request not found")

        allocations = []
        try:
            for item in approved_items:
                res_id = item["resource_id"]
                qty = item["approved_quantity"]

                # Atomic warehouse inventory check
                inv = db.query(Inventory).filter(
                    Inventory.warehouse_id == warehouse_id,
                    Inventory.resource_id == res_id
                ).with_for_update().first()

                if not inv or inv.quantity_available < qty:
                    available = inv.quantity_available if inv else 0
                    raise HTTPException(
                        status_code=400,
                        detail=f"Insufficient inventory for resource ID {res_id} in warehouse {warehouse_id}. Available: {available}, Requested: {qty}"
                    )

                # Reserve stock atomically
                inv.quantity_available -= qty
                inv.quantity_reserved += qty

                # Update requested item approved quantity
                req_itm = db.query(RequestItem).filter(
                    RequestItem.request_id == request_id,
                    RequestItem.resource_id == res_id
                ).first()
                if req_itm:
                    req_itm.quantity_approved += qty

                # Create allocation record
                disp_ref = f"DSP-{uuid.uuid4().hex[:8].upper()}"
                alloc = ResourceAllocation(
                    request_id=request_id,
                    warehouse_id=warehouse_id,
                    resource_id=res_id,
                    allocated_quantity=qty,
                    allocated_by=coordinator.user_id,
                    dispatch_reference=disp_ref,
                    allocation_status="RESERVED",
                    allocated_at=datetime.utcnow()
                )
                db.add(alloc)
                allocations.append(alloc)

            req.status = "APPROVED"
            db.commit()

            AuditService.log_workflow_event(
                db, req.disaster_id, "RESOURCE_APPROVED", coordinator.user_id,
                previous_state="PENDING_APPROVAL", new_state="APPROVED",
                reason=f"Approved and reserved {len(approved_items)} items from warehouse #{warehouse_id}"
            )
            return allocations

        except Exception as e:
            db.rollback()
            raise e

    # STAGE 6: RESCUE TEAM ASSIGNMENT
    @staticmethod
    def assign_response_team(
        db: Session,
        disaster_id: int,
        team_id: int,
        officer: UserAccount
    ) -> TeamAssignment:
        disaster = db.query(Disaster).filter(Disaster.disaster_id == disaster_id).first()
        if not disaster:
            raise HTTPException(status_code=404, detail="Incident not found")

        team = db.query(ResponseTeam).filter(ResponseTeam.team_id == team_id).first()
        if not team:
            raise HTTPException(status_code=404, detail="Response team not found")
        if team.readiness_status != "AVAILABLE":
            raise HTTPException(status_code=400, detail=f"Team '{team.team_name}' is currently {team.readiness_status}")

        assignment = TeamAssignment(
            disaster_id=disaster_id,
            team_id=team_id,
            assigned_by=officer.user_id,
            assignment_status="ASSIGNED",
            assigned_at=datetime.utcnow()
        )
        team.readiness_status = "ASSIGNED"
        db.add(assignment)
        db.commit()
        db.refresh(assignment)

        AuditService.log_workflow_event(
            db, disaster_id, "TEAM_ASSIGNED", officer.user_id,
            previous_state=disaster.status, new_state="RESPONSE_IN_PROGRESS",
            reason=f"Assigned squad {team.team_name}"
        )
        return assignment

    @staticmethod
    def update_team_status(
        db: Session,
        assignment_id: int,
        user: UserAccount,
        new_status: str,
        notes: str = None
    ) -> TeamAssignment:
        assignment = db.query(TeamAssignment).filter(TeamAssignment.assignment_id == assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Team assignment not found")

        status_norm = (new_status or "ASSIGNED").upper().strip()
        alias_map = {
            "ACCEPTED": "ACKNOWLEDGED",
            "ARRIVED": "ON_SCENE",
            "IN_PROGRESS": "RESCUE_IN_PROGRESS"
        }
        target_status = alias_map.get(status_norm, status_norm)

        valid_transitions = {
            "ASSIGNED": ["ACKNOWLEDGED", "ACCEPTED", "PREPARING", "DISPATCHED", "EN_ROUTE", "CANCELLED"],
            "ACCEPTED": ["ACKNOWLEDGED", "PREPARING", "DISPATCHED", "EN_ROUTE", "CANCELLED"],
            "ACKNOWLEDGED": ["PREPARING", "DISPATCHED", "EN_ROUTE", "ON_SCENE", "ARRIVED", "CANCELLED"],
            "PREPARING": ["DISPATCHED", "EN_ROUTE", "ON_SCENE", "ARRIVED", "CANCELLED"],
            "DISPATCHED": ["EN_ROUTE", "ON_SCENE", "ARRIVED", "CANCELLED"],
            "EN_ROUTE": ["ON_SCENE", "ARRIVED", "RESCUE_IN_PROGRESS", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
            "ARRIVED": ["ON_SCENE", "RESCUE_IN_PROGRESS", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
            "ON_SCENE": ["ARRIVED", "RESCUE_IN_PROGRESS", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
            "IN_PROGRESS": ["RESCUE_IN_PROGRESS", "COMPLETED", "CANCELLED"],
            "RESCUE_IN_PROGRESS": ["COMPLETED", "CANCELLED"],
            "COMPLETED": [],
            "CANCELLED": []
        }
        allowed = valid_transitions.get(assignment.assignment_status, [])
        if status_norm not in allowed and target_status not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid assignment transition: cannot move from {assignment.assignment_status} to {new_status}"
            )

        assignment.assignment_status = status_norm
        now = datetime.utcnow()
        if target_status in ("ACKNOWLEDGED", "PREPARING"):
            assignment.acknowledged_at = now
        elif target_status in ("DISPATCHED", "EN_ROUTE"):
            assignment.en_route_at = now
        elif target_status in ("ON_SCENE", "RESCUE_IN_PROGRESS"):
            assignment.on_scene_at = now
        elif target_status in ("COMPLETED", "CANCELLED"):
            assignment.completed_at = now
            # Free team back to AVAILABLE
            team = db.query(ResponseTeam).filter(ResponseTeam.team_id == assignment.team_id).first()
            if team:
                team.readiness_status = "AVAILABLE"

        db.commit()
        db.refresh(assignment)
        return assignment

    # STAGE 8: DISPATCH AND DELIVERY TRACKING
    @staticmethod
    def dispatch_delivery(
        db: Session,
        allocation_id: int,
        user: UserAccount,
        driver_name: str,
        vehicle_reg: str
    ) -> Delivery:
        alloc = db.query(ResourceAllocation).filter(ResourceAllocation.allocation_id == allocation_id).first()
        if not alloc:
            raise HTTPException(status_code=404, detail="Allocation not found")
        if alloc.allocation_status != "RESERVED":
            raise HTTPException(status_code=400, detail="Allocation has already been dispatched or processed")

        req = db.query(ResourceRequest).filter(ResourceRequest.request_id == alloc.request_id).first()
        delivery = Delivery(
            warehouse_id=alloc.warehouse_id,
            disaster_id=req.disaster_id,
            transport_driver_name=driver_name,
            vehicle_registration=vehicle_reg,
            delivery_status="DISPATCHED",
            dispatched_at=datetime.utcnow()
        )
        db.add(delivery)
        db.commit()
        db.refresh(delivery)

        # Add item
        deliv_item = DeliveryItem(
            delivery_id=delivery.delivery_id,
            resource_id=alloc.resource_id,
            quantity_dispatched=alloc.allocated_quantity,
            quantity_received=0
        )
        db.add(deliv_item)
        alloc.allocation_status = "DISPATCHED"
        db.commit()

        AuditService.log_workflow_event(
            db, req.disaster_id, "RESOURCE_DISPATCHED", user.user_id,
            previous_state="RESERVED", new_state="DISPATCHED",
            reason=f"Dispatched via driver {driver_name} ({vehicle_reg})"
        )
        return delivery

    @staticmethod
    def confirm_delivery(
        db: Session,
        delivery_id: int,
        user: UserAccount,
        quantity_received: int,
        quantity_damaged: int = 0,
        receiver_name: str = "Field Relief Officer",
        proof_note: str = None
    ) -> Delivery:
        delivery = db.query(Delivery).filter(Delivery.delivery_id == delivery_id).first()
        if not delivery:
            raise HTTPException(status_code=404, detail="Delivery record not found")
        if delivery.delivery_status == "DELIVERED":
            raise HTTPException(status_code=400, detail="Delivery has already been confirmed as DELIVERED")

        item = db.query(DeliveryItem).filter(DeliveryItem.delivery_id == delivery_id).first()
        if not item:
            raise HTTPException(status_code=400, detail="No items associated with delivery")

        item.quantity_received = quantity_received
        item.quantity_damaged = quantity_damaged
        delivery.delivery_status = "DELIVERED"
        delivery.delivered_at = datetime.utcnow()
        delivery.receiver_name = receiver_name
        delivery.proof_of_delivery_note = proof_note

        # Reconcile inventory: subtract from reserved
        inv = db.query(Inventory).filter(
            Inventory.warehouse_id == delivery.warehouse_id,
            Inventory.resource_id == item.resource_id
        ).first()
        if inv:
            inv.quantity_reserved = max(0, inv.quantity_reserved - item.quantity_dispatched)

        db.commit()
        db.refresh(delivery)

        AuditService.log_workflow_event(
            db, delivery.disaster_id, "DELIVERY_CONFIRMED", user.user_id,
            previous_state="DISPATCHED", new_state="DELIVERED",
            reason=f"Received {quantity_received} units by {receiver_name}"
        )
        return delivery

    # STAGE 9: EVACUATION & SHELTER CAPACITY ENFORCEMENT
    @staticmethod
    def register_shelter_entry(
        db: Session,
        citizen_id: int,
        shelter_id: int,
        dependents: int = 0,
        special_reqs: str = None
    ) -> ShelterRegistration:
        shelter = db.query(Shelter).filter(Shelter.shelter_id == shelter_id).with_for_update().first()
        if not shelter:
            raise HTTPException(status_code=404, detail="Shelter not found")
        if shelter.status != "OPEN":
            raise HTTPException(status_code=400, detail=f"Shelter '{shelter.shelter_name}' is currently {shelter.status}")

        total_people = 1 + max(0, dependents)
        if shelter.current_occupancy + total_people > shelter.capacity:
            raise HTTPException(
                status_code=400,
                detail=f"Shelter capacity exceeded! Available spaces: {shelter.capacity - shelter.current_occupancy}, Requested: {total_people}"
            )

        reg = ShelterRegistration(
            shelter_id=shelter_id,
            citizen_id=citizen_id,
            check_in_time=datetime.utcnow(),
            dependents_count=dependents,
            special_requirements=special_reqs
        )
        shelter.current_occupancy += total_people
        if shelter.current_occupancy >= shelter.capacity:
            shelter.status = "FULL"

        db.add(reg)
        db.commit()
        db.refresh(reg)
        return reg

    # STAGE 12: INCIDENT CLOSURE VALIDATION
    @staticmethod
    def validate_and_close_incident(
        db: Session,
        disaster_id: int,
        officer: UserAccount,
        closure_summary: str
    ) -> Disaster:
        disaster = db.query(Disaster).filter(Disaster.disaster_id == disaster_id).first()
        if not disaster:
            raise HTTPException(status_code=404, detail="Incident not found")
        if disaster.status == "CLOSED":
            raise HTTPException(status_code=400, detail="Incident is already closed")

        # 1. Check all team assignments are completed or cancelled
        active_teams = db.query(TeamAssignment).filter(
            TeamAssignment.disaster_id == disaster_id,
            TeamAssignment.assignment_status.in_(["ASSIGNED", "ACKNOWLEDGED", "EN_ROUTE", "ON_SCENE"])
        ).all()
        if active_teams:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot close incident: {len(active_teams)} response squads are still active on scene."
            )

        # 2. Check all deliveries in progress
        pending_deliveries = db.query(Delivery).filter(
            Delivery.disaster_id == disaster_id,
            Delivery.delivery_status.in_(["PREPARING", "DISPATCHED", "IN_TRANSIT"])
        ).all()
        if pending_deliveries:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot close incident: {len(pending_deliveries)} relief deliveries are still in transit."
            )

        if not closure_summary or len(closure_summary.strip()) < 10:
            raise HTTPException(status_code=400, detail="A comprehensive closure summary is required to close the incident")

        disaster.status = "CLOSED"
        disaster.closed_at = datetime.utcnow()
        disaster.closure_summary = closure_summary
        db.commit()
        db.refresh(disaster)

        AuditService.log_workflow_event(
            db, disaster_id, "INCIDENT_CLOSED", officer.user_id,
            previous_state="RECOVERY", new_state="CLOSED",
            reason=closure_summary
        )
        return disaster
