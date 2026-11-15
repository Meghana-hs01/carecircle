from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import User, ElderlyProfile, CareCircleMember, UserRole, AuditLog
from app.schemas import ElderlyProfileCreate, ElderlyProfileUpdate, ElderlyProfileResponse
from app.security.deps import get_current_active_user, verify_profile_access

router = APIRouter(prefix="/profiles", tags=["Elderly Healthcare Profiles"])

@router.get("", response_model=List[ElderlyProfileResponse])
def list_accessible_profiles(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List all elderly profiles the authenticated user is authorized to access."""
    if current_user.role == UserRole.ELDERLY:
        profile = db.query(ElderlyProfile).filter(ElderlyProfile.user_id == current_user.id).first()
        return [ElderlyProfileResponse.model_validate(profile)] if profile else []

    # For family members and caretakers, find all linked profiles
    memberships = db.query(CareCircleMember).filter(
        CareCircleMember.user_id == current_user.id,
        CareCircleMember.can_view_health == True
    ).all()
    
    profile_ids = [m.profile_id for m in memberships]
    if not profile_ids:
        return []

    profiles = db.query(ElderlyProfile).filter(ElderlyProfile.id.in_(profile_ids)).all()
    return [ElderlyProfileResponse.model_validate(p) for p in profiles]

@router.post("", response_model=ElderlyProfileResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_own_profile(
    profile_in: ElderlyProfileCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Elderly user creates or updates their healthcare profile."""
    if current_user.role != UserRole.ELDERLY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only elderly users can own a primary healthcare profile"
        )

    profile = db.query(ElderlyProfile).filter(ElderlyProfile.user_id == current_user.id).first()
    if not profile:
        profile = ElderlyProfile(user_id=current_user.id, **profile_in.model_dump())
        db.add(profile)
    else:
        for field, value in profile_in.model_dump(exclude_unset=True).items():
            setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return ElderlyProfileResponse.model_validate(profile)

@router.get("/{profile_id}", response_model=ElderlyProfileResponse)
def get_profile_by_id(
    profile_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieve an elderly profile with strict RBAC & IDOR validation."""
    profile = verify_profile_access(profile_id, db, current_user, required_permission="view")
    return ElderlyProfileResponse.model_validate(profile)

@router.put("/{profile_id}", response_model=ElderlyProfileResponse)
def update_profile_by_id(
    profile_id: int,
    profile_in: ElderlyProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update profile details if authorized."""
    # Profile owner or care circle member with can_manage_care
    profile = verify_profile_access(profile_id, db, current_user, required_permission="manage")

    for field, value in profile_in.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(profile, field, value)

    audit = AuditLog(
        profile_id=profile.id,
        user_id=current_user.id,
        action="PROFILE_UPDATED",
        entity_type="ElderlyProfile",
        entity_id=profile.id,
        details={"updated_fields": list(profile_in.model_dump(exclude_unset=True).keys())}
    )
    db.add(audit)
    db.commit()
    db.refresh(profile)
    return ElderlyProfileResponse.model_validate(profile)
