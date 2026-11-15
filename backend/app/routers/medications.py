from datetime import date, datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import (
    User, ElderlyProfile, Medication, MedicationDose, DoseStatus, AuditLog, utcnow
)
from app.schemas import (
    MedicationCreate, MedicationUpdate, MedicationResponse,
    DoseResponse, DoseRecordRequest
)
from app.services.dose_service import generate_doses_for_medication, record_dose_status
from app.security.deps import get_current_active_user, verify_profile_access

router = APIRouter(tags=["Medications & Dose Tracking"])

@router.get("/profiles/{profile_id}/medications", response_model=List[MedicationResponse])
def list_medications(
    profile_id: int,
    active_only: bool = Query(False),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieve medications prescribed for an elderly profile."""
    profile = verify_profile_access(profile_id, db, current_user, required_permission="view")

    query = db.query(Medication).filter(Medication.profile_id == profile.id)
    if active_only:
        query = query.filter(Medication.is_active == True)

    meds = query.order_by(Medication.created_at.desc()).all()
    return [MedicationResponse.model_validate(m) for m in meds]

@router.post("/profiles/{profile_id}/medications", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
def create_medication(
    profile_id: int,
    med_in: MedicationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new medication schedule and immediately generate upcoming doses."""
    profile = verify_profile_access(profile_id, db, current_user, required_permission="manage")

    new_med = Medication(
        profile_id=profile.id,
        name=med_in.name,
        dosage=med_in.dosage,
        frequency=med_in.frequency,
        scheduled_times=med_in.scheduled_times,
        start_date=med_in.start_date,
        end_date=med_in.end_date,
        prescribing_doctor=med_in.prescribing_doctor,
        instructions=med_in.instructions,
        is_active=True
    )
    db.add(new_med)
    db.flush()

    # Generate initial doses for the upcoming 7 days
    generate_doses_for_medication(db, new_med, days_behind=0, days_ahead=7)

    audit = AuditLog(
        profile_id=profile.id,
        user_id=current_user.id,
        action="MEDICATION_PRESCRIBED",
        entity_type="Medication",
        entity_id=new_med.id,
        details={
            "name": new_med.name,
            "dosage": new_med.dosage,
            "frequency": new_med.frequency,
            "scheduled_times": new_med.scheduled_times
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(new_med)

    return MedicationResponse.model_validate(new_med)

@router.put("/medications/{medication_id}", response_model=MedicationResponse)
def update_medication(
    medication_id: int,
    med_in: MedicationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update medication details or active status."""
    med = db.query(Medication).filter(Medication.id == medication_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")

    profile = verify_profile_access(med.profile_id, db, current_user, required_permission="manage")

    for field, value in med_in.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(med, field, value)

    # Regenerate upcoming doses if times/dates were updated
    if med_in.scheduled_times or med_in.is_active is not None:
        generate_doses_for_medication(db, med, days_behind=0, days_ahead=7)

    audit = AuditLog(
        profile_id=profile.id,
        user_id=current_user.id,
        action="MEDICATION_UPDATED",
        entity_type="Medication",
        entity_id=med.id,
        details={"updated_fields": list(med_in.model_dump(exclude_unset=True).keys())}
    )
    db.add(audit)
    db.commit()
    db.refresh(med)

    return MedicationResponse.model_validate(med)

@router.delete("/medications/{medication_id}", status_code=status.HTTP_204_NO_CONTENT)
def discontinue_medication(
    medication_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Discontinue medication (preserves dose history)."""
    med = db.query(Medication).filter(Medication.id == medication_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")

    profile = verify_profile_access(med.profile_id, db, current_user, required_permission="manage")

    med.is_active = False

    # Remove only future unadministered UPCOMING doses
    now = utcnow()
    db.query(MedicationDose).filter(
        MedicationDose.medication_id == med.id,
        MedicationDose.scheduled_time > now,
        MedicationDose.status == DoseStatus.UPCOMING
    ).delete(synchronize_session=False)

    audit = AuditLog(
        profile_id=profile.id,
        user_id=current_user.id,
        action="MEDICATION_DISCONTINUED",
        entity_type="Medication",
        entity_id=med.id,
        details={"name": med.name}
    )
    db.add(audit)
    db.commit()
    return None

@router.get("/profiles/{profile_id}/doses", response_model=List[DoseResponse])
def list_doses(
    profile_id: int,
    date_filter: Optional[date] = Query(None, description="Specific date YYYY-MM-DD"),
    status_filter: Optional[DoseStatus] = Query(None),
    days_span: int = Query(7, ge=1, le=30),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List medication dose records for a profile.
    Supports filtering by specific date or date range.
    """
    profile = verify_profile_access(profile_id, db, current_user, required_permission="view")

    query = db.query(MedicationDose).join(
        Medication, MedicationDose.medication_id == Medication.id
    ).filter(MedicationDose.profile_id == profile.id)

    if date_filter:
        start_of_day = datetime(date_filter.year, date_filter.month, date_filter.day, 0, 0, 0, tzinfo=timezone.utc)
        end_of_day = datetime(date_filter.year, date_filter.month, date_filter.day, 23, 59, 59, tzinfo=timezone.utc)
        query = query.filter(MedicationDose.scheduled_time.between(start_of_day, end_of_day))
    else:
        # Default: today - 3 days to today + days_span
        today = date.today()
        start_range = datetime(today.year, today.month, today.day, 0, 0, 0, tzinfo=timezone.utc) - timedelta(days=3)
        end_range = datetime(today.year, today.month, today.day, 23, 59, 59, tzinfo=timezone.utc) + timedelta(days=days_span)
        query = query.filter(MedicationDose.scheduled_time.between(start_range, end_range))

    if status_filter:
        query = query.filter(MedicationDose.status == status_filter)

    doses = query.order_by(MedicationDose.scheduled_time.asc()).all()

    results = []
    for d in doses:
        rec_name = d.recorded_by.full_name if d.recorded_by else None
        results.append(DoseResponse(
            id=d.id,
            medication_id=d.medication_id,
            medication_name=d.medication.name,
            medication_dosage=d.medication.dosage,
            medication_instructions=d.medication.instructions,
            profile_id=d.profile_id,
            scheduled_time=d.scheduled_time,
            actual_time=d.actual_time,
            status=d.status,
            recorded_by_id=d.recorded_by_id,
            recorded_by_name=rec_name,
            notes=d.notes,
            escalated=d.escalated,
            created_at=d.created_at
        ))
    return results

@router.post("/doses/{dose_id}/record", response_model=DoseResponse)
def record_dose(
    dose_id: int,
    record_in: DoseRecordRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Authorized user (Elderly or Caretaker/Family with manage permission) records dose as TAKEN or SKIPPED.
    Preserves audit history and prevents duplicate recording.
    """
    dose = db.query(MedicationDose).join(
        Medication, MedicationDose.medication_id == Medication.id
    ).filter(MedicationDose.id == dose_id).first()

    if not dose:
        raise HTTPException(status_code=404, detail="Medication dose record not found")

    # Verify manage permission
    verify_profile_access(dose.profile_id, db, current_user, required_permission="manage")

    updated_dose = record_dose_status(
        db=db,
        dose=dose,
        new_status=record_in.status,
        user_id=current_user.id,
        notes=record_in.notes
    )

    rec_name = updated_dose.recorded_by.full_name if updated_dose.recorded_by else current_user.full_name
    return DoseResponse(
        id=updated_dose.id,
        medication_id=updated_dose.medication_id,
        medication_name=updated_dose.medication.name,
        medication_dosage=updated_dose.medication.dosage,
        medication_instructions=updated_dose.medication.instructions,
        profile_id=updated_dose.profile_id,
        scheduled_time=updated_dose.scheduled_time,
        actual_time=updated_dose.actual_time,
        status=updated_dose.status,
        recorded_by_id=updated_dose.recorded_by_id,
        recorded_by_name=rec_name,
        notes=updated_dose.notes,
        escalated=updated_dose.escalated,
        created_at=updated_dose.created_at
    )
