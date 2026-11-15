from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import (
    User, ElderlyProfile, CareCircleMember, CareCircleInvitation,
    AuditLog, Notification, NotificationType, UserRole, DeliveryStatus, utcnow, ensure_utc
)
from app.schemas import (
    InvitationCreate, InvitationResponse, InvitationAccept, MemberResponse
)
from app.core.security import generate_invitation_code, hash_invitation_code
from app.security.deps import get_current_active_user, verify_profile_access

router = APIRouter(tags=["Care Circle & Invitations"])

@router.post("/invitations", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
def create_invitation(
    invite_in: InvitationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Elderly user creates a secure invitation code for a family member or caretaker.
    Passcodes are hashed before storage in DB.
    """
    profile = verify_profile_access(invite_in.profile_id, db, current_user, required_permission="manage")

    raw_code = generate_invitation_code()
    code_hash = hash_invitation_code(raw_code)
    expires_at = utcnow() + timedelta(days=invite_in.expiry_days)

    invitation = CareCircleInvitation(
        profile_id=profile.id,
        invited_by_id=current_user.id,
        role=invite_in.role,
        relationship_title=invite_in.relationship_title,
        recipient_email=invite_in.recipient_email,
        code_hash=code_hash,
        expires_at=expires_at,
        is_accepted=False,
        can_view_health=invite_in.can_view_health,
        can_manage_care=invite_in.can_manage_care
    )
    db.add(invitation)

    audit = AuditLog(
        profile_id=profile.id,
        user_id=current_user.id,
        action="INVITATION_CREATED",
        entity_type="CareCircleInvitation",
        details={
            "role": invite_in.role.value,
            "relationship": invite_in.relationship_title,
            "can_view_health": invite_in.can_view_health,
            "can_manage_care": invite_in.can_manage_care
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(invitation)

    res = InvitationResponse.model_validate(invitation)
    res.invitation_code = raw_code  # Only provided on generation
    return res

@router.post("/invitations/accept", response_model=MemberResponse)
def accept_invitation(
    accept_in: InvitationAccept,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Invited user (Family Member or Caretaker) enters code to join the elderly Care Circle.
    Validates hash, checks expiration, consumes the code, and creates the relationship.
    """
    code_hash = hash_invitation_code(accept_in.invitation_code)
    invitation = db.query(CareCircleInvitation).filter(
        CareCircleInvitation.code_hash == code_hash
    ).first()

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invitation code. Please verify the code and try again."
        )

    if invitation.is_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation code has already been used and cannot be reused."
        )

    if ensure_utc(invitation.expires_at) < utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation code has expired. Please request a new code from the profile owner."
        )

    # Check if user is already a member
    existing_member = db.query(CareCircleMember).filter(
        CareCircleMember.profile_id == invitation.profile_id,
        CareCircleMember.user_id == current_user.id
    ).first()

    if existing_member:
        invitation.is_accepted = True
        invitation.accepted_by_id = current_user.id
        db.commit()
        return MemberResponse(
            id=existing_member.id,
            profile_id=existing_member.profile_id,
            user_id=existing_member.user_id,
            user_name=current_user.full_name,
            user_email=current_user.email,
            relationship_title=existing_member.relationship_title,
            role=existing_member.role,
            can_view_health=existing_member.can_view_health,
            can_manage_care=existing_member.can_manage_care,
            created_at=existing_member.created_at
        )

    # Create new membership
    new_member = CareCircleMember(
        profile_id=invitation.profile_id,
        user_id=current_user.id,
        relationship_title=invitation.relationship_title,
        role=invitation.role,
        can_view_health=invitation.can_view_health,
        can_manage_care=invitation.can_manage_care
    )
    db.add(new_member)

    # Mark invitation accepted
    invitation.is_accepted = True
    invitation.accepted_by_id = current_user.id

    # Create notification for profile owner
    profile = db.query(ElderlyProfile).filter(ElderlyProfile.id == invitation.profile_id).first()
    if profile:
        notif = Notification(
            user_id=profile.user_id,
            profile_id=profile.id,
            type=NotificationType.CIRCLE_INVITATION,
            title="Care Circle Member Joined",
            message=f"{current_user.full_name} has accepted your invitation as {invitation.relationship_title} ({invitation.role.value}).",
            is_read=False,
            email_delivery_status=DeliveryStatus.SKIPPED_NO_CREDENTIALS,
            sent_at=utcnow()
        )
        db.add(notif)

    audit = AuditLog(
        profile_id=invitation.profile_id,
        user_id=current_user.id,
        action="INVITATION_ACCEPTED",
        entity_type="CareCircleMember",
        details={
            "relationship": invitation.relationship_title,
            "role": invitation.role.value
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(new_member)

    return MemberResponse(
        id=new_member.id,
        profile_id=new_member.profile_id,
        user_id=new_member.user_id,
        user_name=current_user.full_name,
        user_email=current_user.email,
        relationship_title=new_member.relationship_title,
        role=new_member.role,
        can_view_health=new_member.can_view_health,
        can_manage_care=new_member.can_manage_care,
        created_at=new_member.created_at
    )

@router.get("/profiles/{profile_id}/members", response_model=List[MemberResponse])
def get_care_circle_members(
    profile_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List members of an elderly person's care circle."""
    profile = verify_profile_access(profile_id, db, current_user, required_permission="view")

    members = db.query(CareCircleMember).filter(
        CareCircleMember.profile_id == profile.id
    ).all()

    result = []
    for m in members:
        u = db.query(User).filter(User.id == m.user_id).first()
        result.append(MemberResponse(
            id=m.id,
            profile_id=m.profile_id,
            user_id=m.user_id,
            user_name=u.full_name if u else "Unknown",
            user_email=u.email if u else "unknown@email.com",
            relationship_title=m.relationship_title,
            role=m.role,
            can_view_health=m.can_view_health,
            can_manage_care=m.can_manage_care,
            created_at=m.created_at
        ))
    return result

@router.delete("/care-circle/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_care_circle_member(
    member_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Revoke a member's access from the Care Circle."""
    member = db.query(CareCircleMember).filter(CareCircleMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Care circle member record not found")

    # Only profile owner or user revoking themselves can do this
    profile = db.query(ElderlyProfile).filter(ElderlyProfile.id == member.profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if profile.user_id != current_user.id and member.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the elderly profile owner can revoke members")

    profile_id = member.profile_id
    user_id = member.user_id

    db.delete(member)
    audit = AuditLog(
        profile_id=profile_id,
        user_id=current_user.id,
        action="MEMBER_ACCESS_REVOKED",
        entity_type="CareCircleMember",
        entity_id=member_id,
        details={"revoked_user_id": user_id}
    )
    db.add(audit)
    db.commit()
    return None
