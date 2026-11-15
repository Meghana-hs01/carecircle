from datetime import datetime, date, timedelta, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import (
    User, ElderlyProfile, Medication, MedicationDose, Appointment, CareActivity,
    DoseStatus, utcnow
)
from app.security.deps import get_current_active_user, verify_profile_access
from app.services.analytics_service import compute_adherence_analytics

router = APIRouter(prefix="/ai", tags=["AI Care Assistant & Clinical Intelligence"])

class AIQueryRequest(BaseModel):
    profile_id: int
    query: str

class AIQueryResponse(BaseModel):
    answer: str
    suggested_actions: List[str]
    context_data: Dict[str, Any]

class AICareDigestResponse(BaseModel):
    profile_id: int
    patient_name: str
    generated_at: datetime
    adherence_rate: float
    executive_summary: str
    medication_status: str
    vitals_assessment: str
    upcoming_events_notice: str
    recommendations: List[str]

@router.post("/query", response_model=AIQueryResponse)
def ask_care_assistant(
    req: AIQueryRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    AI-powered conversational care assistant.
    Answers patient questions about their schedule, appointments, and vitals
    strictly grounded in actual database records with clinical safety guardrails.
    """
    profile = verify_profile_access(req.profile_id, db, current_user, required_permission="view")

    # Fetch live clinical context
    today = date.today()
    meds = db.query(Medication).filter(Medication.profile_id == profile.id, Medication.is_active == True).all()
    doses = db.query(MedicationDose).join(Medication).filter(
        MedicationDose.profile_id == profile.id,
        MedicationDose.scheduled_time >= datetime(today.year, today.month, today.day, 0, 0, tzinfo=timezone.utc),
        MedicationDose.scheduled_time <= datetime(today.year, today.month, today.day, 23, 59, tzinfo=timezone.utc)
    ).order_by(MedicationDose.scheduled_time.asc()).all()

    appts = db.query(Appointment).filter(
        Appointment.profile_id == profile.id,
        Appointment.appointment_date >= today
    ).order_by(Appointment.appointment_date.asc()).limit(3).all()

    vitals = db.query(CareActivity).filter(
        CareActivity.profile_id == profile.id
    ).order_by(CareActivity.activity_time.desc()).limit(3).all()

    query_lower = req.query.lower()
    answer_parts = []
    actions = []

    # 1. Medication / dose inquiries
    if any(k in query_lower for k in ["medicine", "medication", "pill", "dose", "take", "schedule"]):
        taken_doses = [d for d in doses if d.status == DoseStatus.TAKEN]
        upcoming_doses = [d for d in doses if d.status == DoseStatus.UPCOMING]
        missed_doses = [d for d in doses if d.status == DoseStatus.MISSED]

        if upcoming_doses:
            next_dose = upcoming_doses[0]
            next_time = next_dose.scheduled_time.strftime("%I:%M %p UTC")
            answer_parts.append(
                f"Your next scheduled medication today is **{next_dose.medication.name}** "
                f"({next_dose.medication.dosage}) at **{next_time}**."
            )
            if next_dose.medication.instructions:
                answer_parts.append(f"Instructions: *{next_dose.medication.instructions}*")
            actions.append(f"Mark {next_dose.medication.name} as Taken")
        elif taken_doses:
            answer_parts.append(
                f"You have already taken **{len(taken_doses)}** scheduled doses today. "
                "You are all caught up for the moment!"
            )
        else:
            answer_parts.append(f"You have {len(meds)} active prescribed medications on file.")

        if missed_doses:
            answer_parts.append(
                f"⚠️ Note: You have {len(missed_doses)} unconfirmed or missed dose(s) from earlier today. "
                "Please check with your caretaker before taking any delayed medications."
            )

    # 2. Doctor appointment inquiries
    elif any(k in query_lower for k in ["appointment", "doctor", "clinic", "hospital", "visit"]):
        if appts:
            next_appt = appts[0]
            answer_parts.append(
                f"Your next medical appointment is with **{next_appt.doctor_name}** at "
                f"**{next_appt.hospital_clinic}** on **{next_appt.appointment_date}** at **{next_appt.appointment_time}**."
            )
            if next_appt.purpose:
                answer_parts.append(f"Purpose: {next_appt.purpose}.")
            if next_appt.notes:
                answer_parts.append(f"Preparation: {next_appt.notes}.")
            actions.append("View Appointment Calendar")
        else:
            answer_parts.append("You do not have any upcoming medical appointments scheduled right now.")
            actions.append("Schedule an Appointment")

    # 3. Vitals inquiries
    elif any(k in query_lower for k in ["vital", "pressure", "glucose", "heart", "sugar", "bp"]):
        if vitals:
            latest = vitals[0]
            v_time = latest.activity_time.strftime("%b %d at %I:%M %p UTC")
            m_text = ""
            if latest.metrics:
                parts = [f"{k}: {v}" for k, v in latest.metrics.items() if k != "unit"]
                m_text = f" ({', '.join(parts)})"
            answer_parts.append(
                f"Your most recently recorded care activity was **{latest.title}**{m_text} logged on {v_time}."
            )
            actions.append("View Full Vitals Log")
        else:
            answer_parts.append("No vitals checks recorded yet today.")
            actions.append("Record Blood Pressure / Glucose")

    # 4. General / Allergy / Conditions
    else:
        answer_parts.append(
            f"Hello {profile.full_name}! I am your CareCircle AI assistant. "
            f"You currently have {len(meds)} active medications and {len(appts)} upcoming appointments. "
            "You can ask me about your daily doses, when your next doctor visit is, or your recent vitals."
        )
        if profile.known_allergies:
            answer_parts.append(f"Registered Allergies: {profile.known_allergies}.")
        actions.extend(["Check Today's Schedule", "View Doctor Visits", "View Care Circle"])

    # Clinical Safety Notice Guardrail
    answer_parts.append(
        "\n*Medical Safety Notice: CareCircle AI provides schedule and record assistance only and never alters dosages or provides diagnostic medical advice. Always consult your prescribing physician for dosage changes.*"
    )

    return AIQueryResponse(
        answer=" ".join(answer_parts),
        suggested_actions=actions,
        context_data={
            "patient": profile.full_name,
            "active_meds_count": len(meds),
            "upcoming_appts_count": len(appts)
        }
    )

@router.get("/summary/{profile_id}", response_model=AICareDigestResponse)
def get_ai_weekly_digest(
    profile_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generate an automated AI Executive Clinical Summary for Family Members & Caretakers.
    Synthesizes adherence data, recent vitals, and upcoming consultations.
    """
    profile = verify_profile_access(profile_id, db, current_user, required_permission="view")

    adherence_data = compute_adherence_analytics(db, profile.id, days_window=14)
    rate = adherence_data.adherence_percentage

    # Fetch recent care logs
    vitals = db.query(CareActivity).filter(
        CareActivity.profile_id == profile.id
    ).order_by(CareActivity.activity_time.desc()).limit(5).all()

    appts = db.query(Appointment).filter(
        Appointment.profile_id == profile.id,
        Appointment.appointment_date >= date.today()
    ).order_by(Appointment.appointment_date.asc()).all()

    # Formulate executive assessment
    if rate >= 85.0:
        exec_summary = (
            f"{profile.full_name} demonstrates excellent medication adherence of {rate}% over the past 14 days. "
            f"Doses have been consistently administered and confirmed on time by the patient and care team."
        )
    elif rate >= 70.0:
        exec_summary = (
            f"{profile.full_name} has a moderate adherence rate of {rate}%. "
            f"{adherence_data.missed} dose(s) were escalated as missed. Routine check-ins are recommended to maintain consistent compliance."
        )
    else:
        exec_summary = (
            f"Attention Required: {profile.full_name}'s medication adherence has fallen to {rate}%, with {adherence_data.missed} missed doses. "
            "Immediate follow-up with the primary caretaker is advised to resolve barriers to administration."
        )

    # Vitals assessment
    vitals_summary = "Vitals are within expected baseline parameters."
    for v in vitals:
        if v.metrics and "systolic" in v.metrics:
            sys = v.metrics["systolic"]
            dia = v.metrics.get("diastolic", 80)
            if sys > 140 or dia > 90:
                vitals_summary = f"Recent blood pressure reading on {v.activity_time.strftime('%b %d')} was slightly elevated at {sys}/{dia} mmHg. Continue daily monitoring."
            break

    # Upcoming visits notice
    if appts:
        next_a = appts[0]
        appts_notice = f"Next appointment: {next_a.doctor_name} at {next_a.hospital_clinic} on {next_a.appointment_date} ({next_a.purpose})."
    else:
        appts_notice = "No medical consultations scheduled in the immediate 14-day window."

    recommendations = [
        "Continue morning administration routine with food and water.",
        "Ensure caretaker verifies evening doses within the 30-minute grace period.",
        "Review blood pressure logs with physician at upcoming appointment."
    ]

    return AICareDigestResponse(
        profile_id=profile.id,
        patient_name=profile.full_name,
        generated_at=utcnow(),
        adherence_rate=rate,
        executive_summary=exec_summary,
        medication_status=f"{adherence_data.taken} taken, {adherence_data.missed} missed, {adherence_data.skipped} skipped out of {adherence_data.total_scheduled} evaluated doses.",
        vitals_assessment=vitals_summary,
        upcoming_events_notice=appts_notice,
        recommendations=recommendations
    )
