from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.schema import (
    Resource, Warehouse, Inventory, ResourceRequest, RequestItem,
    ResourceAllocation, UserAccount
)
from app.schemas.dtos import (
    ResourceRequestCreate, ResourceApprovalRequest
)
from app.auth.security import get_current_user, require_role
from app.services.workflow_service import WorkflowService

router = APIRouter(prefix="/resources", tags=["Relief Inventory & Warehouse Logistics"])

@router.get("")
def list_resources(
    category_filter: Optional[str] = None,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Resource)
    if category_filter:
        query = query.filter(Resource.category == category_filter.upper())
    items = query.all()

    return {
        "success": True,
        "count": len(items),
        "resources": [
            {
                "resource_id": r.resource_id,
                "resource_name": r.resource_name,
                "category": r.category,
                "unit": r.unit,
                "is_perishable": r.is_perishable,
                "unit_cost": r.standard_unit_cost
            } for r in items
        ]
    }

@router.get("/warehouses")
def list_warehouses_with_inventory(
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    warehouses = db.query(Warehouse).all()
    results = []
    for wh in warehouses:
        inv_list = []
        for inv in wh.inventory:
            inv_list.append({
                "inventory_id": inv.inventory_id,
                "resource_id": inv.resource_id,
                "resource_name": inv.resource.resource_name if inv.resource else "Item",
                "category": inv.resource.category if inv.resource else "SUPPLY",
                "unit": inv.resource.unit if inv.resource else "Units",
                "quantity_available": inv.quantity_available,
                "quantity_reserved": inv.quantity_reserved,
                "reorder_threshold": inv.reorder_threshold,
                "is_low_stock": inv.quantity_available <= inv.reorder_threshold
            })
        results.append({
            "warehouse_id": wh.warehouse_id,
            "warehouse_name": wh.warehouse_name,
            "manager_name": wh.manager_name,
            "capacity_pallets": wh.capacity_pallets,
            "location_name": wh.location.location_name if wh.location else "Sector",
            "inventory": inv_list
        })
    return {"success": True, "count": len(results), "warehouses": results}

@router.post("/requests", status_code=status.HTTP_201_CREATED)
def create_resource_request(
    req_in: ResourceRequestCreate,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Stage 5: Emergency Resource Assessment & Request
    """
    items_dicts = [{"resource_id": i.resource_id, "quantity_requested": i.quantity_requested} for i in req_in.items]
    req = WorkflowService.create_resource_request(
        db=db,
        disaster_id=req_in.disaster_id,
        user_id=current_user.user_id,
        items=items_dicts,
        priority=req_in.priority
    )
    return {
        "success": True,
        "message": "Resource request created and routed to Relief Coordinator.",
        "request_id": req.request_id,
        "status": req.status
    }

@router.get("/requests")
def list_resource_requests(
    status_filter: Optional[str] = None,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ResourceRequest)
    if status_filter:
        query = query.filter(ResourceRequest.status == status_filter.upper())
    requests = query.order_by(ResourceRequest.requested_at.desc()).all()

    results = []
    for r in requests:
        primary_item = r.items[0] if r.items else None
        results.append({
            "request_id": r.request_id,
            "disaster_id": r.disaster_id,
            "disaster_name": r.disaster.disaster_name if r.disaster else "Emergency",
            "priority": r.priority,
            "status": r.status,
            "requested_at": r.requested_at,
            "resource_id": primary_item.resource_id if primary_item else 1,
            "resource_name": primary_item.resource.resource_name if primary_item and primary_item.resource else "Emergency Supplies",
            "quantity_requested": primary_item.quantity_requested if primary_item else 0,
            "quantity_approved": primary_item.quantity_approved if primary_item else 0,
            "unit": primary_item.resource.unit if primary_item and primary_item.resource else "Units",
            "items": [
                {
                    "resource_id": itm.resource_id,
                    "resource_name": itm.resource.resource_name if itm.resource else "Item",
                    "unit": itm.resource.unit if itm.resource else "Units",
                    "quantity_requested": itm.quantity_requested,
                    "quantity_approved": itm.quantity_approved
                } for itm in r.items
            ]
        })
    return {"success": True, "count": len(results), "requests": results}

@router.post("/allocate")
def approve_and_allocate(
    alloc_in: ResourceApprovalRequest,
    current_user: UserAccount = Depends(require_role(["COORDINATOR", "DISASTER_OFFICER", "RESOURCE_PROVIDER"])),
    db: Session = Depends(get_db)
):
    """
    Stage 7: Resource Approval & Transactional Stock Allocation
    Ensures sufficient stock, reserves items atomically, prevents negative inventory.
    """
    approved_items = alloc_in.approved_items
    if not approved_items:
        req = db.query(ResourceRequest).filter(ResourceRequest.request_id == alloc_in.request_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Resource request not found")
        res_id = alloc_in.resource_id or (req.items[0].resource_id if req.items else 1)
        qty = alloc_in.quantity_allocated if alloc_in.quantity_allocated is not None else (req.items[0].quantity_requested if req.items else 1)
        approved_items = [{"resource_id": res_id, "approved_quantity": qty}]

    allocations = WorkflowService.approve_and_allocate_resources(
        db=db,
        request_id=alloc_in.request_id,
        coordinator=current_user,
        warehouse_id=alloc_in.warehouse_id,
        approved_items=approved_items
    )
    return {
        "success": True,
        "message": f"Successfully approved and reserved {len(allocations)} resource items.",
        "allocations_count": len(allocations),
        "dispatch_references": [a.dispatch_reference for a in allocations]
    }

@router.get("/responders")
def list_responders_alias(
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.schema import ResponseTeam
    teams = db.query(ResponseTeam).all()
    results = [
        {
            "RESPONDERID": t.team_id,
            "id": t.team_id,
            "team_id": t.team_id,
            "TEAMNAME": t.team_name,
            "team_name": t.team_name,
            "SPECIALIZATION": getattr(t, "specialization", "Search & Rescue"),
            "specialization": getattr(t, "specialization", "Search & Rescue"),
            "AVAILABILITYSTATUS": t.readiness_status,
            "status": t.readiness_status,
            "LEADNAME": t.leader_name or "Command Officer",
            "CONTACTPHONE": getattr(t, "contact_phone", "+91-9845012345")
        } for t in teams
    ]
    return {"success": True, "count": len(results), "responders": results}

@router.get("/vehicles")
def list_vehicles_alias(
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return {
        "success": True,
        "vehicles": [
            {"id": 1001, "VEHICLEID": 1001, "VEHICLENAME": "Ambulance ALS-01", "REGISTRATIONNUMBER": "KA-04-G-1102", "VEHICLETYPE": "AMBULANCE", "STATUS": "AVAILABLE"},
            {"id": 1002, "VEHICLEID": 1002, "VEHICLENAME": "NDRF Rescue Boat Zodiac-1", "REGISTRATIONNUMBER": "KA-04-BT-09", "VEHICLETYPE": "BOAT", "STATUS": "DEPLOYED"}
        ]
    }

