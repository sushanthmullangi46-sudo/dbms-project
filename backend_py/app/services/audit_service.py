from sqlalchemy.orm import Session
from app.models.schema import AuditLog, IncidentWorkflowEvent, Notification
import json

class AuditService:
    @staticmethod
    def log_audit(
        db: Session,
        entity_name: str,
        entity_id: str,
        action: str,
        performed_by: int,
        actor_name: str,
        details: dict or str
    ) -> AuditLog:
        if isinstance(details, dict):
            details_str = json.dumps(details)
        else:
            details_str = str(details)
            
        audit = AuditLog(
            entity_name=entity_name,
            entity_id=str(entity_id),
            action=action,
            performed_by=performed_by,
            actor_name=actor_name,
            details=details_str
        )
        db.add(audit)
        db.commit()
        db.refresh(audit)
        return audit

    @staticmethod
    def log_workflow_event(
        db: Session,
        disaster_id: int,
        event_type: str,
        actor_id: int,
        previous_state: str,
        new_state: str,
        reason: str = None
    ) -> IncidentWorkflowEvent:
        event = IncidentWorkflowEvent(
            disaster_id=disaster_id,
            event_type=event_type,
            actor_id=actor_id,
            previous_state=previous_state,
            new_state=new_state,
            reason=reason
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def notify_user(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        notification_type: str = "ALERT"
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type
        )
        db.add(notif)
        db.commit()
        return notif
