from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from app.database import get_db
from app.models.schema import CitizenFeedback, Disaster, UserAccount
from app.auth.security import get_current_user

router = APIRouter(prefix="/feedback", tags=["Post-Rescue Citizen Ratings & Service Feedback"])

class FeedbackCreate(BaseModel):
    disaster_id: int
    rating: int = Field(ge=1, le=5)
    response_speed_rating: int = Field(default=5, ge=1, le=5)
    rescue_team_rating: int = Field(default=5, ge=1, le=5)
    supplies_rating: int = Field(default=5, ge=1, le=5)
    comments: Optional[str] = None

@router.get("/summary")
@router.get("")
def get_feedback_summary(
    db: Session = Depends(get_db)
):
    feedbacks = db.query(CitizenFeedback).order_by(CitizenFeedback.created_at.desc()).all()
    count = len(feedbacks)
    if count == 0:
        return {
            "success": True,
            "count": 0,
            "average_overall_rating": 5.0,
            "average_speed_rating": 5.0,
            "average_team_rating": 5.0,
            "average_supplies_rating": 5.0,
            "recent_reviews": []
        }
    
    avg_overall = sum(f.rating for f in feedbacks) / count
    avg_speed = sum(f.response_speed_rating for f in feedbacks) / count
    avg_team = sum(f.rescue_team_rating for f in feedbacks) / count
    avg_supplies = sum(f.supplies_rating for f in feedbacks) / count

    reviews = []
    for f in feedbacks[:15]:
        reviews.append({
            "feedback_id": f.feedback_id,
            "disaster_id": f.disaster_id,
            "citizen_name": f.citizen.full_name if f.citizen else "Verified Citizen",
            "rating": f.rating,
            "response_speed_rating": f.response_speed_rating,
            "rescue_team_rating": f.rescue_team_rating,
            "supplies_rating": f.supplies_rating,
            "comments": f.comments,
            "created_at": f.created_at.isoformat() if f.created_at else None
        })

    return {
        "success": True,
        "count": count,
        "average_overall_rating": round(avg_overall, 2),
        "average_speed_rating": round(avg_speed, 2),
        "average_team_rating": round(avg_team, 2),
        "average_supplies_rating": round(avg_supplies, 2),
        "recent_reviews": reviews
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def submit_citizen_feedback(
    fb_in: FeedbackCreate,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    # Check disaster exists
    disaster = db.query(Disaster).filter(Disaster.disaster_id == fb_in.disaster_id).first()
    if not disaster:
        raise HTTPException(status_code=404, detail="Incident record not found.")

    feedback = CitizenFeedback(
        disaster_id=fb_in.disaster_id,
        citizen_id=current_user.user_id,
        rating=fb_in.rating,
        response_speed_rating=fb_in.response_speed_rating,
        rescue_team_rating=fb_in.rescue_team_rating,
        supplies_rating=fb_in.supplies_rating,
        comments=fb_in.comments,
        created_at=now
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return {
        "success": True,
        "message": "Thank you! Your post-rescue operational evaluation has been recorded.",
        "feedback_id": feedback.feedback_id
    }

