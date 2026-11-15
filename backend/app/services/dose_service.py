from datetime import datetime, date, time, timedelta, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models import Medication, MedicationDose, DoseStatus, AuditLog, utcnow

def generate_doses_for_medication(
    db: Session,
    medication: Medication,
    days_behind: int = 2,
    days_ahead: int = 7
) -> int:
    """
    Generates scheduled doses for a medication over a specific date window.
    Strictly idempotent: ignores existing records to prevent duplicate dose generation.
    """
    if not medication.is_active or not medication.scheduled_times:
        return 0

    today = date.today()
    start_window = max(medication.start_date, today - timedelta(days=days_behind))
    end_window = today + timedelta(days=days_ahead)
    if medication.end_date:
        end_window = min(end_window, medication.end_date)

    if start_window > end_window:
        return 0

    generated_count = 0
    current_date = start_window

    while current_date <= end_window:
        for time_str in medication.scheduled_times:
            try:
                parts = time_str.strip().split(":")
                hour = int(parts[0])
                minute = int(parts[1]) if len(parts) > 1 else 0
            except Exception:
                continue

            scheduled_dt = datetime(
                year=current_date.year,
                month=current_date.month,
                day=current_date.day,
                hour=hour,
                minute=minute,
                tzinfo=timezone.utc
            )

            # Check if record already exists to avoid IntegrityError
            existing = db.query(MedicationDose).filter(
                MedicationDose.medication_id == medication.id,
                MedicationDose.scheduled_time == scheduled_dt
            ).first()

            if not existing:
                new_dose = MedicationDose(
                    medication_id=medication.id,
                    profile_id=medication.profile_id,
                    scheduled_time=scheduled_dt,
                    status=DoseStatus.UPCOMING,
                    escalated=False
                )
                db.add(new_dose)
                generated_count += 1

        current_date += timedelta(days=1)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

    return generated_count

def generate_doses_for_profile(db: Session, profile_id: int, days_ahead: int = 7) -> int:
    """Generate scheduled doses for all active medications in an elderly profile."""
    meds = db.query(Medication).filter(
        Medication.profile_id == profile_id,
        Medication.is_active == True
    ).all()
    total = 0
    for med in meds:
        total += generate_doses_for_medication(db, med, days_behind=2, days_ahead=days_ahead)
    return total

def record_dose_status(
    db: Session,
    dose: MedicationDose,
    new_status: DoseStatus,
    user_id: int,
    notes: Optional[str] = None
) -> MedicationDose:
    """Record administration or skip of a dose, with audit logging."""
    dose.status = new_status
    dose.actual_time = utcnow()
    dose.recorded_by_id = user_id
    if notes:
        dose.notes = f"{dose.notes}\n{notes}".strip() if dose.notes else notes

    # Audit log
    audit = AuditLog(
        profile_id=dose.profile_id,
        user_id=user_id,
        action=f"DOSE_STATUS_UPDATED_TO_{new_status.value}",
        entity_type="MedicationDose",
        entity_id=dose.id,
        details={
            "medication_id": dose.medication_id,
            "scheduled_time": dose.scheduled_time.isoformat(),
            "actual_time": dose.actual_time.isoformat(),
            "status": new_status.value,
            "notes": notes
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(dose)
    return dose
