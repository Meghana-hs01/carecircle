from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import User
from app.schemas import AdherenceStats
from app.services.analytics_service import compute_adherence_analytics
from app.security.deps import get_current_active_user, verify_profile_access

router = APIRouter(tags=["Medication Adherence Analytics"])

@router.get("/profiles/{profile_id}/adherence", response_model=AdherenceStats)
def get_profile_adherence(
    profile_id: int,
    days: int = Query(14, ge=3, le=90),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Computes real mathematical adherence from actual database dose records.
    Explicitly excludes future scheduled doses from the adherence percentage.
    """
    profile = verify_profile_access(profile_id, db, current_user, required_permission="view")
    return compute_adherence_analytics(db, profile.id, days_window=days)
