from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import User, ElderlyProfile, CareActivity, AuditLog, utcnow
from app.schemas import CareActivityCreate, CareActivityResponse
from app.security.deps import get_current_active_user, verify_profile_access

router = APIRouter(tags=["Care Activities & Daily Vitals"])

@router.get("/profiles/{profile_id}/activities", response_model=List[CareActivityResponse])
def list_care_activities(
    profile_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieve logged care activities (vitals, meals, mobility) for an elderly profile."""
    profile = verify_profile_access(profile_id, db, current_user, required_permission="view")

    activities = db.query(CareActivity).filter(
        CareActivity.profile_id == profile.id
    ).order_by(CareActivity.activity_time.desc()).all()

    results = []
    for a in activities:
        rec_name = a.recorded_by.full_name if a.recorded_by else "System"
        results.append(CareActivityResponse(
            id=a.id,
            profile_id=a.profile_id,
            recorded_by_id=a.recorded_by_id,
            recorded_by_name=rec_name,
            activity_type=a.activity_type,
            activity_time=a.activity_time,
            title=a.title,
            description=a.description,
            metrics=a.metrics,
            created_at=a.created_at
        ))
    return results

@router.post("/profiles/{profile_id}/activities", response_model=CareActivityResponse, status_code=status.HTTP_201_CREATED)
def log_care_activity(
    profile_id: int,
    act_in: CareActivityCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Record a care activity (e.g. vitals check, meal logged, mobility assistance)."""
    profile = verify_profile_access(profile_id, db, current_user, required_permission="manage")

    new_act = CareActivity(
        profile_id=profile.id,
        recorded_by_id=current_user.id,
        activity_type=act_in.activity_type.upper(),
        activity_time=act_in.activity_time or utcnow(),
        title=act_in.title,
        description=act_in.description,
        metrics=act_in.metrics
    )
    db.add(new_act)

    audit = AuditLog(
        profile_id=profile.id,
        user_id=current_user.id,
        action="CARE_ACTIVITY_LOGGED",
        entity_type="CareActivity",
        details={
            "type": new_act.activity_type,
            "title": new_act.title,
            "metrics": new_act.metrics
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(new_act)

    return CareActivityResponse(
        id=new_act.id,
        profile_id=new_act.profile_id,
        recorded_by_id=new_act.recorded_by_id,
        recorded_by_name=current_user.full_name,
        activity_type=new_act.activity_type,
        activity_time=new_act.activity_time,
        title=new_act.title,
        description=new_act.description,
        metrics=new_act.metrics,
        created_at=new_act.created_at
    )
