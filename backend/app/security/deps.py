from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.database.session import get_db
from app.models import User, ElderlyProfile, CareCircleMember, UserRole

security_scheme = HTTPBearer(auto_error=True)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: Optional[str] = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def verify_profile_access(
    profile_id: int,
    db: Session,
    current_user: User,
    required_permission: str = "view"  # "view" or "manage"
) -> ElderlyProfile:
    """
    Independent backend permission validation to prevent Insecure Direct Object Reference (IDOR).
    Validates that:
    1. Profile exists.
    2. User is the elderly profile owner, OR
    3. User is an active Care Circle member with the required permission (can_view_health / can_manage_care).
    """
    profile = db.query(ElderlyProfile).filter(ElderlyProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Healthcare profile #{profile_id} not found"
        )

    # 1. Elderly profile owner has full access
    if profile.user_id == current_user.id:
        return profile

    # 2. Check CareCircle membership
    membership = db.query(CareCircleMember).filter(
        CareCircleMember.profile_id == profile_id,
        CareCircleMember.user_id == current_user.id
    ).first()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not authorized to view or manage this healthcare profile"
        )

    if required_permission == "view" and not membership.can_view_health:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not have permission to view healthcare records for this profile"
        )

    if required_permission == "manage" and not membership.can_manage_care:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not have permission to manage or record care activities for this profile"
        )

    return profile

def verify_cron_secret(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme)
) -> bool:
    """Authenticate internal scheduled jobs triggered by Google Cloud Scheduler."""
    token = credentials.credentials
    if token != settings.CRON_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid internal scheduler authentication token"
        )
    return True
