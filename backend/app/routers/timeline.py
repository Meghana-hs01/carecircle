from datetime import datetime, date, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import (
    User, ElderlyProfile, MedicationDose, Appointment, CareActivity, AuditLog,
    DoseStatus, AppointmentStatus, ensure_utc
)
from app.schemas import TimelineEvent
from app.security.deps import get_current_active_user, verify_profile_access

router = APIRouter(tags=["Daily Care Timeline"])

@router.get("/profiles/{profile_id}/timeline", response_model=List[TimelineEvent])
def get_daily_care_timeline(
    profile_id: int,
    days_back: int = Query(7, ge=1, le=30),
    days_forward: int = Query(7, ge=0, le=30),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Chronological care timeline aggregating medication doses, doctor appointments,
    and recorded care activities.
    """
    profile = verify_profile_access(profile_id, db, current_user, required_permission="view")

    now_utc = datetime.now(timezone.utc)
    start_window = now_utc - timedelta(days=days_back)
    end_window = now_utc + timedelta(days=days_forward)

    events: List[TimelineEvent] = []

    # 1. Medication Doses
    doses = db.query(MedicationDose).filter(
        MedicationDose.profile_id == profile.id,
        MedicationDose.scheduled_time.between(start_window, end_window)
    ).all()

    for d in doses:
        color = "blue"
        if d.status == DoseStatus.TAKEN:
            color = "green"
        elif d.status == DoseStatus.MISSED:
            color = "red"
        elif d.status == DoseStatus.SKIPPED:
            color = "amber"

        med_title = f"{d.medication.name} ({d.medication.dosage})" if d.medication else "Medication Dose"
        subtitle = f"Scheduled: {d.scheduled_time.strftime('%I:%M %p UTC')}"
        if d.actual_time:
            subtitle += f" • Administered at {d.actual_time.strftime('%I:%M %p UTC')}"

        events.append(TimelineEvent(
            id=f"dose-{d.id}",
            timestamp=ensure_utc(d.scheduled_time),
            category="MEDICATION_DOSE",
            title=med_title,
            subtitle=subtitle,
            status=d.status.value,
            status_color=color,
            details={
                "medication_id": d.medication_id,
                "dose_id": d.id,
                "notes": d.notes,
                "instructions": d.medication.instructions if d.medication else None
            },
            recorded_by=d.recorded_by.full_name if d.recorded_by else None
        ))

    # 2. Appointments
    start_date = start_window.date()
    end_date = end_window.date()
    appointments = db.query(Appointment).filter(
        Appointment.profile_id == profile.id,
        Appointment.appointment_date.between(start_date, end_date)
    ).all()

    for a in appointments:
        color = "blue"
        if a.status == AppointmentStatus.COMPLETED:
            color = "green"
        elif a.status == AppointmentStatus.CANCELLED:
            color = "gray"

        # parse hour/minute to make timestamp
        try:
            parts = a.appointment_time.split(":")
            h = int(parts[0])
            m = int(parts[1]) if len(parts) > 1 else 0
        except Exception:
            h, m = 9, 0

        appt_dt = datetime(
            a.appointment_date.year, a.appointment_date.month, a.appointment_date.day,
            h, m, tzinfo=timezone.utc
        )

        events.append(TimelineEvent(
            id=f"appt-{a.id}",
            timestamp=ensure_utc(appt_dt),
            category="APPOINTMENT",
            title=f"Doctor Appointment: Dr. {a.doctor_name}",
            subtitle=f"{a.hospital_clinic} • {a.purpose}",
            status=a.status.value,
            status_color=color,
            details={"appointment_id": a.id, "notes": a.notes}
        ))

    # 3. Care Activities (vitals, meals, checks)
    activities = db.query(CareActivity).filter(
        CareActivity.profile_id == profile.id,
        CareActivity.activity_time.between(start_window, end_window)
    ).all()

    for act in activities:
        events.append(TimelineEvent(
            id=f"activity-{act.id}",
            timestamp=ensure_utc(act.activity_time),
            category="CARE_ACTIVITY",
            title=f"{act.activity_type.title()}: {act.title}",
            subtitle=act.description,
            status="LOGGED",
            status_color="teal",
            details={"metrics": act.metrics},
            recorded_by=act.recorded_by.full_name if act.recorded_by else "Care Circle"
        ))

    # Sort descending by timestamp
    events.sort(key=lambda x: x.timestamp, reverse=True)
    return events
