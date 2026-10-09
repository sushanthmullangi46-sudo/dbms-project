from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.schema import Delivery, DeliveryItem, ResourceAllocation, UserAccount
from app.schemas.dtos import DeliveryDispatchCreate, DeliveryConfirmationRequest
from app.auth.security import get_current_user, require_role
from app.services.workflow_service import WorkflowService

router = APIRouter(prefix="/deliveries", tags=["Relief Dispatch & Delivery Confirmations"])

@router.get("")
def list_deliveries(
    status_filter: Optional[str] = None,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Delivery)
    if status_filter:
        query = query.filter(Delivery.delivery_status == status_filter.upper())
    deliveries = query.order_by(Delivery.delivery_id.desc()).all()

    results = []
    for d in deliveries:
        results.append({
            "delivery_id": d.delivery_id,
            "warehouse_name": d.warehouse.warehouse_name if d.warehouse else "Warehouse",
            "disaster_name": d.disaster_id,
            "transport_driver": d.transport_driver_name,
            "vehicle_registration": d.vehicle_registration,
            "status": d.delivery_status,
            "dispatched_at": d.dispatched_at,
            "delivered_at": d.delivered_at,
            "receiver_name": d.receiver_name,
            "items": [
                {
                    "resource_name": itm.resource_id,
                    "quantity_dispatched": itm.quantity_dispatched,
                    "quantity_received": itm.quantity_received,
                    "quantity_damaged": itm.quantity_damaged
                } for itm in d.items
            ]
        })
    return {"success": True, "count": len(results), "deliveries": results}

@router.post("/dispatch", status_code=status.HTTP_201_CREATED)
def dispatch_delivery(
    disp_in: DeliveryDispatchCreate,
    current_user: UserAccount = Depends(require_role(["COORDINATOR", "DISASTER_OFFICER"])),
    db: Session = Depends(get_db)
):
    """
    Stage 8: Dispatch Resources to Field
    """
    delivery = WorkflowService.dispatch_delivery(
        db=db,
        allocation_id=disp_in.allocation_id,
        user=current_user,
        driver_name=disp_in.transport_driver_name,
        vehicle_reg=disp_in.vehicle_registration
    )
    return {
        "success": True,
        "message": f"Delivery #{delivery.delivery_id} marked as DISPATCHED in transit.",
        "delivery_id": delivery.delivery_id,
        "status": delivery.delivery_status
    }

@router.post("/{delivery_id}/confirm")
def confirm_delivery(
    delivery_id: int,
    conf_in: DeliveryConfirmationRequest,
    current_user: UserAccount = Depends(get_current_user),
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
