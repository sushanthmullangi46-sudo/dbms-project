from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from app.database import get_db
from app.models.schema import (
    Resource, Warehouse, Inventory, ResourceRequest, RequestItem,
    ResourceAllocation, UserAccount, AuditLog, DisasterLocation, Delivery
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
    category: Optional[str] = None,
    availabilityStatus: Optional[str] = None,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cat = category_filter or category
    query = db.query(Resource)
    if cat:
        query = query.filter(Resource.category == cat.upper())
    items = query.all()

    resource_list = []
    for r in items:
        total_qty = sum(inv.quantity_available for inv in r.inventory_records) if r.inventory_records else 250
        first_wh = r.inventory_records[0].warehouse.warehouse_name if (r.inventory_records and r.inventory_records[0].warehouse) else "Hebbal Central Disaster Reserve Depot"
        avail_status = "AVAILABLE" if total_qty > 0 else "ALLOCATED"
        if availabilityStatus and availabilityStatus.upper() != "ALL" and avail_status != availabilityStatus.upper():
            continue

        resource_list.append({
            "RESOURCEID": r.resource_id,
            "resource_id": r.resource_id,
            "id": r.resource_id,
            "RESOURCENAME": r.resource_name,
            "resource_name": r.resource_name,
            "title": r.resource_name,
            "REGISTRATIONNUMBER": f"AST-2026-{r.resource_id:04d}",
            "registration_number": f"AST-2026-{r.resource_id:04d}",
            "CATEGORY": r.category,
            "category": r.category,
            "QUANTITY": total_qty,
            "quantity": total_qty,
            "quantity_available": total_qty,
            "UNIT": r.unit,
            "unit": r.unit,
            "CONDITION": "OPERATIONAL",
            "condition": "OPERATIONAL",
            "AVAILABILITYSTATUS": avail_status,
            "availability_status": avail_status,
            "status": avail_status,
            "PROVIDERNAME": "State Disaster Logistics Authority",
            "provider_name": "State Disaster Logistics Authority",
            "LOCATIONNAME": first_wh,
            "location_name": first_wh,
            "is_perishable": r.is_perishable,
            "unit_cost": r.standard_unit_cost,
            "STANDARDUNITCOST": r.standard_unit_cost
        })

    return {
        "success": True,
        "count": len(resource_list),
        "resources": resource_list,
        "data": resource_list
    }

@router.get("/inventory")
def list_inventory_direct(
    warehouse_id: Optional[int] = None,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Inventory)
    if warehouse_id:
        query = query.filter(Inventory.warehouse_id == warehouse_id)
    inv_records = query.all()
    results = [
        {
            "INVENTORYID": inv.inventory_id,
            "inventory_id": inv.inventory_id,
            "WAREHOUSEID": inv.warehouse_id,
            "warehouse_id": inv.warehouse_id,
            "WAREHOUSENAME": inv.warehouse.warehouse_name if inv.warehouse else "Central Vault",
            "warehouse_name": inv.warehouse.warehouse_name if inv.warehouse else "Central Vault",
            "RESOURCEID": inv.resource_id,
            "resource_id": inv.resource_id,
            "RESOURCENAME": inv.resource.resource_name if inv.resource else "Relief Item",
            "resource_name": inv.resource.resource_name if inv.resource else "Relief Item",
            "CATEGORY": inv.resource.category if inv.resource else "SUPPLIES",
            "category": inv.resource.category if inv.resource else "SUPPLIES",
            "QUANTITYAVAILABLE": inv.quantity_available,
            "quantity_available": inv.quantity_available,
            "QUANTITYRESERVED": inv.quantity_reserved,
            "quantity_reserved": inv.quantity_reserved,
            "REORDERLEVEL": inv.reorder_threshold,
            "reorder_threshold": inv.reorder_threshold,
            "UNIT": inv.resource.unit if inv.resource else "Units",
            "unit": inv.resource.unit if inv.resource else "Units",
            "STOCKSTATUS": "NORMAL" if inv.quantity_available > inv.reorder_threshold else ("CRITICAL" if inv.quantity_available == 0 else "LOW"),
            "status": "NORMAL" if inv.quantity_available > inv.reorder_threshold else ("CRITICAL" if inv.quantity_available == 0 else "LOW")
        } for inv in inv_records
    ]
    return {"success": True, "count": len(results), "inventory": results, "stock": results}

@router.post("/replenishment")
def replenish_stock(
    body: dict,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    w_id = body.get("warehouse_id") or body.get("warehouseId") or 1
    r_id = body.get("resource_id") or body.get("resourceId") or 1
    qty = body.get("quantity_to_add") or body.get("quantity") or 500

    inv = db.query(Inventory).filter(Inventory.warehouse_id == w_id, Inventory.resource_id == r_id).first()
    if inv:
        inv.quantity_available += qty
    else:
        inv = Inventory(warehouse_id=w_id, resource_id=r_id, quantity_available=qty, quantity_reserved=0, reorder_threshold=50)
        db.add(inv)
    db.commit()
    return {"success": True, "message": f"Successfully replenished {qty} units in warehouse #{w_id}"}

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
        rpt = r.disaster.reports[0] if (r.disaster and r.disaster.reports) else None
        emg_code = rpt.report_reference_id if rpt else (r.disaster.incident_code if r.disaster else f"EMG-{r.disaster_id:04d}")
        loc_name = r.disaster.location.location_name if (r.disaster and r.disaster.location) else "Bangalore Sector"

        res_name = primary_item.resource.resource_name if primary_item and primary_item.resource else "Emergency Supplies"
        unit_str = primary_item.resource.unit if primary_item and primary_item.resource else "Units"
        qty_req = primary_item.quantity_requested if primary_item else 0
        qty_app = primary_item.quantity_approved if primary_item else 0

        item_list = [
            {
                "resource_id": itm.resource_id,
                "resource_name": itm.resource.resource_name if itm.resource else "Item",
                "unit": itm.resource.unit if itm.resource else "Units",
                "quantity_requested": itm.quantity_requested,
                "quantity_approved": itm.quantity_approved
            } for itm in r.items
        ]

        results.append({
            "request_id": r.request_id,
            "REQUESTID": r.request_id,
            "id": r.request_id,
            "disaster_id": r.disaster_id,
            "incident_id": r.disaster_id,
            "INCIDENTID": r.disaster_id,
            "disaster_name": r.disaster.disaster_name if r.disaster else "Emergency Operation",
            "incident_name": r.disaster.disaster_name if r.disaster else "Emergency Operation",
            "INCIDENTNAME": r.disaster.disaster_name if r.disaster else "Emergency Operation",
            "emergency_id": emg_code,
            "EMERGENCYID": emg_code,
            "emergency_code": emg_code,
            "EMERGENCYCODE": emg_code,
            "report_reference_id": emg_code,
            "location_name": loc_name,
            "LOCATIONNAME": loc_name,
            "priority": r.priority,
            "PRIORITY": r.priority,
            "status": r.status,
            "STATUS": r.status,
            "requested_at": r.requested_at.isoformat() if r.requested_at else None,
            "CREATEDAT": r.requested_at.isoformat() if r.requested_at else None,
            "resource_id": primary_item.resource_id if primary_item else 1,
            "resource_name": res_name,
            "RESOURCENAME": res_name,
            "quantity_requested": qty_req,
            "QUANTITYREQUESTED": qty_req,
            "quantity_approved": qty_app,
            "QUANTITYAPPROVED": qty_app,
            "unit": unit_str,
            "UNIT": unit_str,
            "items": item_list,
            "ITEMS": item_list
        })
    return {"success": True, "count": len(results), "requests": results, "data": results}

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


# =====================================================================
# WAREHOUSE MANAGEMENT CRUD (WITH SAFEGUARDS)
# =====================================================================

class WarehouseCreateBody(BaseModel):
    warehouse_name: str
    location_id: Optional[int] = None
    manager_name: str = "Regional Logistics Officer"
    capacity_pallets: int = 5000

class WarehouseUpdateBody(BaseModel):
    warehouse_name: Optional[str] = None
    manager_name: Optional[str] = None
    capacity_pallets: Optional[int] = None
    is_active: Optional[bool] = None

@router.post("/warehouses", status_code=status.HTTP_201_CREATED)
def create_warehouse(
    body: WarehouseCreateBody,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify duplicate name
    existing = db.query(Warehouse).filter(Warehouse.warehouse_name.ilike(body.warehouse_name.strip())).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Warehouse '{body.warehouse_name}' already exists.")

    loc_id = body.location_id
    if not loc_id:
        loc = db.query(DisasterLocation).first()
        loc_id = loc.location_id if loc else 1

    wh = Warehouse(
        warehouse_name=body.warehouse_name.strip(),
        location_id=loc_id,
        manager_name=body.manager_name.strip(),
        capacity_pallets=body.capacity_pallets,
        is_active=True
    )
    db.add(wh)
    db.commit()
    db.refresh(wh)

    # Initialize inventory catalog rows with 0 quantity
    resources = db.query(Resource).all()
    for r in resources:
        db.add(Inventory(
            warehouse_id=wh.warehouse_id,
            resource_id=r.resource_id,
            quantity_available=0,
            quantity_reserved=0,
            reorder_threshold=50
        ))
    db.commit()

    return {
        "success": True,
        "message": f"Warehouse '{wh.warehouse_name}' successfully added to logistics registry.",
        "warehouse_id": wh.warehouse_id
    }

@router.put("/warehouses/{warehouse_id}")
def update_warehouse(
    warehouse_id: int,
    body: WarehouseUpdateBody,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wh = db.query(Warehouse).filter(Warehouse.warehouse_id == warehouse_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found.")

    if body.warehouse_name:
        wh.warehouse_name = body.warehouse_name.strip()
    if body.manager_name:
        wh.manager_name = body.manager_name.strip()
    if body.capacity_pallets is not None:
        wh.capacity_pallets = body.capacity_pallets
    if body.is_active is not None:
        wh.is_active = body.is_active

    db.commit()
    return {"success": True, "message": f"Warehouse #{warehouse_id} updated successfully."}

@router.delete("/warehouses/{warehouse_id}")
def delete_warehouse(
    warehouse_id: int,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wh = db.query(Warehouse).filter(Warehouse.warehouse_id == warehouse_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found.")

    # SAFEGUARD: Check if any active stock exists
    active_inv = db.query(Inventory).filter(
        Inventory.warehouse_id == warehouse_id,
        (Inventory.quantity_available > 0) | (Inventory.quantity_reserved > 0)
    ).all()

    if active_inv:
        total_remaining = sum(i.quantity_available + i.quantity_reserved for i in active_inv)
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete warehouse: holds {total_remaining} active/reserved resource units. Relocate stock first."
        )

    # Delete empty inventory rows and warehouse
    db.query(Inventory).filter(Inventory.warehouse_id == warehouse_id).delete()
    db.delete(wh)
    db.commit()
    return {"success": True, "message": f"Warehouse #{warehouse_id} decommissioned successfully."}


# =====================================================================
# RESOURCE CATALOG MANAGEMENT (WITH DUPLICATE PREVENTION)
# =====================================================================

class ResourceCatalogCreateBody(BaseModel):
    resource_name: str
    category: str = "SUPPLIES"
    unit: str = "Units"
    is_perishable: bool = False
    standard_unit_cost: float = 100.0
    initial_quantity: Optional[int] = 0
    warehouse_id: Optional[int] = 1

class ResourceCatalogUpdateBody(BaseModel):
    resource_name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    is_perishable: Optional[bool] = None
    standard_unit_cost: Optional[float] = None

@router.post("", status_code=status.HTTP_201_CREATED)
def create_resource_catalog_entry(
    body: ResourceCatalogCreateBody,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check duplicate name
    existing = db.query(Resource).filter(Resource.resource_name.ilike(body.resource_name.strip())).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Resource '{body.resource_name}' already exists in catalog.")

    r = Resource(
        resource_name=body.resource_name.strip(),
        category=body.category.upper(),
        unit=body.unit.strip(),
        is_perishable=body.is_perishable,
        standard_unit_cost=body.standard_unit_cost
    )
    db.add(r)
    db.commit()
    db.refresh(r)

    # Seed initial inventory
    wh_id = body.warehouse_id or 1
    qty = max(0, body.initial_quantity or 0)
    db.add(Inventory(
        warehouse_id=wh_id,
        resource_id=r.resource_id,
        quantity_available=qty,
        quantity_reserved=0,
        reorder_threshold=50
    ))
    db.commit()

    return {
        "success": True,
        "message": f"Resource '{r.resource_name}' added to catalog with {qty} units in Warehouse #{wh_id}.",
        "resource_id": r.resource_id
    }

@router.put("/{resource_id}")
def update_resource_catalog_entry(
    resource_id: int,
    body: ResourceCatalogUpdateBody,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    r = db.query(Resource).filter(Resource.resource_id == resource_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resource not found.")

    if body.resource_name:
        r.resource_name = body.resource_name.strip()
    if body.category:
        r.category = body.category.upper()
    if body.unit:
        r.unit = body.unit.strip()
    if body.is_perishable is not None:
        r.is_perishable = body.is_perishable
    if body.standard_unit_cost is not None:
        r.standard_unit_cost = body.standard_unit_cost

    db.commit()
    return {"success": True, "message": f"Resource #{resource_id} catalog details updated."}


# =====================================================================
# REQUEST REJECTION & STOCK ADJUSTMENT (AUDIT RECORDED)
# =====================================================================

class RequestRejectBody(BaseModel):
    reason: Optional[str] = "Insufficient regional stock or duplicated requirement."

@router.post("/requests/{request_id}/reject")
def reject_resource_request(
    request_id: int,
    body: RequestRejectBody,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(ResourceRequest).filter(ResourceRequest.request_id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Resource request not found.")

    req.status = "REJECTED"
    req.notes = f"REJECTED by {current_user.full_name}: {body.reason}"
    db.commit()

    # Log to audit trail
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    db.add(AuditLog(
        entity_name="RESOURCE_REQUEST",
        entity_id=str(request_id),
        action="UPDATE",
        performed_by=current_user.user_id,
        actor_name=current_user.full_name,
        details=f"Resource request #{request_id} rejected. Reason: {body.reason}",
        created_at=now
    ))
    db.commit()

    return {"success": True, "message": f"Request #{request_id} marked as REJECTED."}

class InventoryAdjustBody(BaseModel):
    inventory_id: int
    new_quantity_available: int = Field(ge=0)
    adjustment_reason: str = "Physical warehouse audit count"

@router.post("/inventory/adjust")
def adjust_inventory_stock(
    body: InventoryAdjustBody,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inv = db.query(Inventory).filter(Inventory.inventory_id == body.inventory_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory row not found.")

    diff = body.new_quantity_available - inv.quantity_available
    inv.quantity_available = body.new_quantity_available
    db.commit()

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    db.add(AuditLog(
        entity_name="INVENTORY",
        entity_id=str(inv.inventory_id),
        action="UPDATE",
        performed_by=current_user.user_id,
        actor_name=current_user.full_name,
        details=f"Stock adjusted by {diff:+d} units for Resource #{inv.resource_id} at Warehouse #{inv.warehouse_id}. Reason: {body.adjustment_reason}",
        created_at=now
    ))
    db.commit()

    return {
        "success": True,
        "message": f"Stock reconciled. New available count: {inv.quantity_available} units.",
        "quantity_available": inv.quantity_available
    }


# =====================================================================
# COMPREHENSIVE LOGISTICS SQL REPORTS
# =====================================================================

@router.get("/reports/summary")
def get_logistics_reports(
    db: Session = Depends(get_db)
):
    """
    Returns actual SQL aggregation reports:
    - Warehouse stock levels
    - Resource utilization
    - Emergency allocations
    - Dispatches
    - Deliveries
    - Low-stock alerts
    """
    # 1. Warehouse Stock Report
    warehouses = db.query(Warehouse).all()
    wh_report = []
    for w in warehouses:
        total_avail = sum(i.quantity_available for i in (w.inventory or []))
        total_res = sum(i.quantity_reserved for i in (w.inventory or []))
        wh_report.append({
            "warehouse_id": w.warehouse_id,
            "warehouse_name": w.warehouse_name,
            "manager_name": w.manager_name,
            "capacity_pallets": w.capacity_pallets,
            "total_available": total_avail,
            "total_reserved": total_res,
            "total_stock": total_avail + total_res,
            "line_items_count": len(w.inventory or [])
        })

    # 2. Low-Stock Report
    low_stock = db.query(Inventory).filter(Inventory.quantity_available <= Inventory.reorder_threshold).all()
    low_report = [
        {
            "warehouse_name": i.warehouse.warehouse_name if i.warehouse else "Depot",
            "resource_name": i.resource.resource_name if i.resource else "Item",
            "category": i.resource.category if i.resource else "SUPPLIES",
            "quantity_available": i.quantity_available,
            "reorder_threshold": i.reorder_threshold,
            "deficit": max(0, (i.reorder_threshold * 2) - i.quantity_available)
        } for i in low_stock
    ]

    # 3. Allocations by Emergency
    allocations = db.query(ResourceAllocation).order_by(ResourceAllocation.allocated_at.desc()).limit(20).all()
    alloc_report = [
        {
            "allocation_id": a.allocation_id,
            "request_id": a.request_id,
            "dispatch_reference": a.dispatch_reference,
            "warehouse_name": a.warehouse.warehouse_name if a.warehouse else "Depot",
            "allocated_quantity": a.allocated_quantity,
            "status": a.allocation_status,
            "is_dispatched": (a.allocation_status == "DISPATCHED"),
            "allocated_at": a.allocated_at.isoformat() if a.allocated_at else None
        } for a in allocations
    ]

    # 4. Dispatches and Deliveries
    deliveries = db.query(Delivery).order_by(Delivery.delivery_id.desc()).limit(20).all()
    deliv_report = [
        {
            "delivery_id": d.delivery_id,
            "warehouse_name": d.warehouse.warehouse_name if d.warehouse else "Depot",
            "transport_driver": d.transport_driver_name,
            "vehicle_reg": d.vehicle_registration,
            "status": d.delivery_status,
            "dispatched_at": d.dispatched_at.isoformat() if d.dispatched_at else None,
            "delivered_at": d.delivered_at.isoformat() if d.delivered_at else None,
            "receiver_name": d.receiver_name
        } for d in deliveries
    ]

    return {
        "success": True,
        "warehouse_stock_report": wh_report,
        "low_stock_report": low_report,
        "allocations_report": alloc_report,
        "deliveries_report": deliv_report
    }


