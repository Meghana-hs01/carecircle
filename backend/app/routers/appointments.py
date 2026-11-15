from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import User, ElderlyProfile, Appointment, AppointmentStatus, AuditLog
from app.schemas import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.security.deps import get_current_active_user, verify_profile_access

router = APIRouter(tags=["Appointment Management"])

@router.get("/profiles/{profile_id}/appointments", response_model=List[AppointmentResponse])
def list_appointments(
    profile_id: int,
    status_filter: Optional[AppointmentStatus] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List doctor appointments for an elderly profile."""
    profile = verify_profile_access(profile_id, db, current_user, required_permission="view")

    query = db.query(Appointment).filter(Appointment.profile_id == profile.id)
    if status_filter:
        query = query.filter(Appointment.status == status_filter)

    appointments = query.order_by(Appointment.appointment_date.asc(), Appointment.appointment_time.asc()).all()
    return [AppointmentResponse.model_validate(a) for a in appointments]

@router.post("/profiles/{profile_id}/appointments", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    profile_id: int,
    appt_in: AppointmentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Schedule a new doctor or clinic appointment."""
    profile = verify_profile_access(profile_id, db, current_user, required_permission="manage")

    new_appt = Appointment(
        profile_id=profile.id,
        doctor_name=appt_in.doctor_name,
        hospital_clinic=appt_in.hospital_clinic,
        appointment_date=appt_in.appointment_date,
        appointment_time=appt_in.appointment_time,
        purpose=appt_in.purpose,
        notes=appt_in.notes,
        status=AppointmentStatus.SCHEDULED
    )
    db.add(new_appt)

    audit = AuditLog(
        profile_id=profile.id,
        user_id=current_user.id,
        action="APPOINTMENT_SCHEDULED",
        entity_type="Appointment",
        details={
            "doctor": appt_in.doctor_name,
            "clinic": appt_in.hospital_clinic,
            "date": str(appt_in.appointment_date),
            "time": appt_in.appointment_time
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(new_appt)
    return AppointmentResponse.model_validate(new_appt)

@router.put("/appointments/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    appt_in: AppointmentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update or cancel an existing appointment."""
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    profile = verify_profile_access(appt.profile_id, db, current_user, required_permission="manage")

    for field, value in appt_in.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(appt, field, value)

    audit = AuditLog(
        profile_id=profile.id,
        user_id=current_user.id,
        action="APPOINTMENT_UPDATED",
        entity_type="Appointment",
        entity_id=appt.id,
        details={"status": appt.status.value}
    )
    db.add(audit)
    db.commit()
    db.refresh(appt)
    return AppointmentResponse.model_validate(appt)

@router.delete("/appointments/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete an appointment."""
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    profile = verify_profile_access(appt.profile_id, db, current_user, required_permission="manage")

    profile_id = appt.profile_id
    db.delete(appt)

    audit = AuditLog(
        profile_id=profile_id,
        user_id=current_user.id,
        action="APPOINTMENT_DELETED",
        entity_type="Appointment",
        entity_id=appointment_id
    )
    db.add(audit)
    db.commit()
    return None
