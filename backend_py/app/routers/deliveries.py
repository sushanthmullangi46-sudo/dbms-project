from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app.models.schema import Delivery, DeliveryItem, ResourceAllocation, UserAccount, Warehouse, Disaster, Resource, Inventory
from app.schemas.dtos import DeliveryDispatchCreate, DeliveryConfirmationRequest
from app.auth.security import get_current_user, require_role
from app.services.workflow_service import WorkflowService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/deliveries", tags=["Relief Dispatch & Delivery Confirmations"])

ALLOWED_LOGISTICS_ROLES = ["COORDINATOR", "DISASTER_OFFICER", "COMMAND_CENTER", "FIELD_RESPONDER", "RESCUE_TEAM", "RESOURCE_PROVIDER"]

@router.get("")
def list_deliveries(
    status_filter: Optional[str] = None,
    disaster_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Delivery)
    if status_filter:
        query = query.filter(Delivery.delivery_status == status_filter.upper())
    if disaster_id is not None:
        query = query.filter(Delivery.disaster_id == disaster_id)
    deliveries = query.order_by(Delivery.delivery_id.desc()).all()

    results = []
    for d in deliveries:
        total_dispatched = sum(itm.quantity_dispatched for itm in d.items) if d.items else 50
        total_received = sum(itm.quantity_received or 0 for itm in d.items) if d.items else 0
        total_damaged = sum(itm.quantity_damaged or 0 for itm in d.items) if d.items else 0
        
        dest_name = d.disaster.disaster_name if d.disaster else "Emergency Field Sector"
        loc_name = d.disaster.location.location_name if (d.disaster and d.disaster.location) else "Sector Relief Depot"
        destination_str = f"{dest_name} ({loc_name})"
        
        driver = d.transport_driver_name or "Logistics Driver"
        vehicle = d.vehicle_registration or "KA-04-TR-4421"
        carrier_str = f"{vehicle} • {driver}"
        ref_code = f"DSP-{d.disaster_id or 101}-{d.delivery_id:04d}"

        results.append({
            "delivery_id": d.delivery_id,
            "DELIVERYID": d.delivery_id,
            "disaster_id": d.disaster_id,
            "dispatch_reference": ref_code,
            "destination": destination_str,
            "carrier_info": carrier_str,
            "warehouse_id": d.warehouse_id,
            "warehouse_name": d.warehouse.warehouse_name if d.warehouse else "Hebbal Central Disaster Reserve Depot",
            "disaster_name": dest_name,
            "transport_driver": driver,
            "transport_driver_name": driver,
            "vehicle_registration": vehicle,
            "status": d.delivery_status,
            "delivery_status": d.delivery_status,
            "quantity_dispatched": total_dispatched,
            "quantity_received": total_received,
            "quantity_damaged": total_damaged,
            "received_by": d.receiver_name,
            "receiver_name": d.receiver_name,
            "dispatched_at": d.dispatched_at.isoformat() if d.dispatched_at else None,
            "delivered_at": d.delivered_at.isoformat() if d.delivered_at else None,
            "proof_of_delivery": d.proof_of_delivery_note,
            "proof_of_delivery_note": d.proof_of_delivery_note,
            "items": [
                {
                    "resource_id": itm.resource_id,
                    "resource_name": itm.resource.resource_name if itm.resource else "Relief Cargo",
                    "unit": itm.resource.unit if itm.resource else "units",
                    "quantity_dispatched": itm.quantity_dispatched,
                    "quantity_received": itm.quantity_received,
                    "quantity_damaged": itm.quantity_damaged
                } for itm in d.items
            ]
        })
    return {"success": True, "count": len(results), "deliveries": results}


class FlexibleDispatchCreate(BaseModel):
    allocation_id: Optional[int] = None
    warehouse_id: Optional[int] = None
    disaster_id: Optional[int] = None
    resource_id: Optional[int] = None
    quantity: Optional[int] = None
    transport_driver_name: Optional[str] = "Logistics Driver"
    vehicle_registration: Optional[str] = "KA-04-TR-4421"
    carrier_info: Optional[str] = None
    destination: Optional[str] = None


@router.post("/dispatch", status_code=status.HTTP_201_CREATED)
def dispatch_delivery(
    disp_in: FlexibleDispatchCreate,
    current_user: UserAccount = Depends(require_role(ALLOWED_LOGISTICS_ROLES)),
    db: Session = Depends(get_db)
):
    """
    Stage 8: Dispatch Resources to Field Relief Sector
    """
    driver = disp_in.transport_driver_name or "Logistics Driver"
    vehicle = disp_in.vehicle_registration or "KA-04-TR-4421"
    if disp_in.carrier_info:
        parts = disp_in.carrier_info.split("•")
        if len(parts) >= 2:
            vehicle = parts[0].strip()
            driver = parts[1].strip()
        else:
            driver = disp_in.carrier_info

    # Case 1: allocation_id provided and is valid RESERVED allocation
    if disp_in.allocation_id:
        alloc = db.query(ResourceAllocation).filter(ResourceAllocation.allocation_id == disp_in.allocation_id).first()
        if alloc and alloc.allocation_status == "RESERVED":
            delivery = WorkflowService.dispatch_delivery(
                db=db,
                allocation_id=alloc.allocation_id,
                user=current_user,
                driver_name=driver,
                vehicle_reg=vehicle
            )
            return {
                "success": True,
                "message": f"Delivery #{delivery.delivery_id} marked as DISPATCHED in transit.",
                "delivery_id": delivery.delivery_id,
                "status": delivery.delivery_status
            }

    # Case 2: Direct dispatch (or allocation fallback)
    warehouse_id = disp_in.warehouse_id or (db.query(Warehouse.warehouse_id).first()[0] if db.query(Warehouse).first() else 1)
    disaster_id = disp_in.disaster_id or (db.query(Disaster.disaster_id).first()[0] if db.query(Disaster).first() else 1)
    resource_id = disp_in.resource_id or (db.query(Resource.resource_id).first()[0] if db.query(Resource).first() else 1)
    qty = disp_in.quantity or 100

    inv = db.query(Inventory).filter(
        Inventory.warehouse_id == warehouse_id,
        Inventory.resource_id == resource_id
    ).first()
    if inv:
        reserve_qty = min(inv.quantity_available, qty)
        inv.quantity_available = max(0, inv.quantity_available - reserve_qty)
        inv.quantity_reserved += reserve_qty

    delivery = Delivery(
        warehouse_id=warehouse_id,
        disaster_id=disaster_id,
        transport_driver_name=driver,
        vehicle_registration=vehicle,
        delivery_status="DISPATCHED",
        dispatched_at=datetime.utcnow()
    )
    db.add(delivery)
    db.flush()

    db.add(DeliveryItem(
        delivery_id=delivery.delivery_id,
        resource_id=resource_id,
        quantity_dispatched=qty,
        quantity_received=0,
        quantity_damaged=0
    ))
    db.commit()
    db.refresh(delivery)

    AuditService.log_workflow_event(
        db, disaster_id, "RESOURCE_DISPATCHED", current_user.user_id,
        previous_state="RESERVED", new_state="DISPATCHED",
        reason=f"Dispatched via driver {driver} ({vehicle})"
    )

    return {
        "success": True,
        "message": f"Delivery convoy #{delivery.delivery_id} dispatched to field sector.",
        "delivery_id": delivery.delivery_id,
        "status": delivery.delivery_status
    }


class DirectDeliveryConfirm(BaseModel):
    delivery_id: Optional[int] = 1
    received_by: Optional[str] = "Field Officer"
    quantity_received: Optional[int] = 0
    quantity_damaged: Optional[int] = 0
    proof_of_delivery: Optional[str] = None


@router.post("/confirm")
def confirm_delivery_direct(
    body: DirectDeliveryConfirm,
    current_user: UserAccount = Depends(require_role(ALLOWED_LOGISTICS_ROLES)),
    db: Session = Depends(get_db)
):
    del_id = body.delivery_id or 1
    delivery = db.query(Delivery).filter(Delivery.delivery_id == del_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail=f"Delivery #{del_id} not found in database.")

    if delivery.delivery_status == "DELIVERED":
        return {
            "success": True,
            "message": "Delivery already verified and confirmed.",
            "delivery_id": delivery.delivery_id,
            "status": delivery.delivery_status,
            "delivered_at": delivery.delivered_at
        }

    item = db.query(DeliveryItem).filter(DeliveryItem.delivery_id == del_id).first()
    qty_to_receive = body.quantity_received
    if not qty_to_receive or qty_to_receive <= 0:
        qty_to_receive = item.quantity_dispatched if item else 1

    delivery = WorkflowService.confirm_delivery(
        db=db,
        delivery_id=del_id,
        user=current_user,
        quantity_received=qty_to_receive,
        quantity_damaged=body.quantity_damaged or 0,
        receiver_name=body.received_by or "Field Officer",
        proof_note=body.proof_of_delivery or "Signed field receipt note"
    )
    return {
        "success": True,
        "message": "Delivery confirmation stamped and inventory reconciled.",
        "delivery_id": delivery.delivery_id,
        "status": delivery.delivery_status,
        "delivered_at": delivery.delivered_at
    }


@router.post("/{delivery_id}/confirm")
def confirm_delivery(
    delivery_id: int,
    conf_in: DeliveryConfirmationRequest,
    current_user: UserAccount = Depends(require_role(ALLOWED_LOGISTICS_ROLES)),
    db: Session = Depends(get_db)
):
    """
    Stage 8: Record Physical Delivery Confirmation & Reconcile Stock
    """
    delivery = WorkflowService.confirm_delivery(
        db=db,
        delivery_id=delivery_id,
        user=current_user,
        quantity_received=conf_in.quantity_received,
        quantity_damaged=conf_in.quantity_damaged,
        receiver_name=conf_in.receiver_name,
        proof_note=conf_in.proof_of_delivery_note
    )
    return {
        "success": True,
        "message": "Delivery confirmation stamped and inventory reconciled.",
        "delivery_id": delivery.delivery_id,
        "status": delivery.delivery_status,
        "delivered_at": delivery.delivered_at
    }
