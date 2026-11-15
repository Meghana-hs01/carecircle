from datetime import timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models import (
    MedicationDose, Medication, ElderlyProfile, User, CareCircleMember,
    Notification, NotificationPreference, NotificationType, DoseStatus,
    DeliveryStatus, AuditLog, utcnow, ensure_utc
)
from app.services.email_service import send_smtp_email

def process_missed_dose_escalations(db: Session) -> Dict[str, Any]:
    """
    Idempotent escalation worker:
    1. Finds unconfirmed UPCOMING doses whose scheduled_time + grace_period has passed.
    2. Marks doses as MISSED.
    3. Escalates alerts to assigned caretakers and family members.
    4. Accurately dispatches and logs email delivery statuses.
    """
    now = utcnow()
    default_grace_delta = timedelta(minutes=30)
    
    # Query upcoming unconfirmed doses that are older than now - default grace
    overdue_doses = db.query(MedicationDose).join(
        Medication, MedicationDose.medication_id == Medication.id
    ).filter(
        MedicationDose.status == DoseStatus.UPCOMING,
        MedicationDose.escalated == False,
        MedicationDose.scheduled_time < (now - timedelta(minutes=15))  # Candidate window
    ).all()

    escalated_count = 0
    notifications_created = 0
    emails_dispatched = 0

    for dose in overdue_doses:
        profile = db.query(ElderlyProfile).filter(ElderlyProfile.id == dose.profile_id).first()
        if not profile:
            continue

        # Check elderly owner's configured grace period
        owner_pref = db.query(NotificationPreference).filter(
            NotificationPreference.user_id == profile.user_id
        ).first()
        grace_minutes = owner_pref.grace_period_minutes if owner_pref else 30

        # Only escalate if actual scheduled_time + grace_period has passed
        if ensure_utc(dose.scheduled_time) + timedelta(minutes=grace_minutes) > now:
            continue

        # Mark dose as MISSED and escalated
        dose.status = DoseStatus.MISSED
        dose.escalated = True
        dose.escalated_at = now

        med_name = dose.medication.name if dose.medication else "Medication"
        time_display = dose.scheduled_time.strftime("%I:%M %p UTC")

        # Find circle members to alert (Caretakers and Family Members)
        members = db.query(CareCircleMember).filter(
            CareCircleMember.profile_id == profile.id,
            CareCircleMember.can_view_health == True
        ).all()

        recipient_user_ids = {profile.user_id}
        for m in members:
            recipient_user_ids.add(m.user_id)

        for u_id in recipient_user_ids:
            user = db.query(User).filter(User.id == u_id).first()
            if not user or not user.is_active:
                continue

            pref = db.query(NotificationPreference).filter(
                NotificationPreference.user_id == user.id
            ).first()

            alert_title = f"Missed Dose Alert: {profile.full_name}"
            alert_message = (
                f"{profile.full_name} has not confirmed taking {med_name} "
                f"({dose.medication.dosage if dose.medication else ''}) scheduled at {time_display}. "
                f"Grace period of {grace_minutes} minutes has expired. Please verify patient status."
            )

            notif = Notification(
                user_id=user.id,
                profile_id=profile.id,
                type=NotificationType.MISSED_DOSE_ALERT,
                title=alert_title,
                message=alert_message,
                is_read=False,
                email_sent=False,
                email_delivery_status=DeliveryStatus.PENDING,
                email_recipient=user.email,
                sent_at=now
            )
            db.add(notif)
            notifications_created += 1

            # Dispatch email if preference allows
            if not pref or (pref.email_notifications_enabled and pref.missed_dose_alerts):
                status_code, status_detail = send_smtp_email(
                    recipient_email=user.email,
                    subject=f"[CareCircle ALERT] Missed Dose: {med_name} for {profile.full_name}",
                    body_text=alert_message,
                    body_html=f"""
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <h2 style="color: #dc2626;">CareCircle Alert — Missed Dose</h2>
                        <p><strong>Patient:</strong> {profile.full_name}</p>
                        <p><strong>Medication:</strong> {med_name} ({dose.medication.dosage if dose.medication else ''})</p>
                        <p><strong>Scheduled Time:</strong> {time_display}</p>
                        <p><strong>Status:</strong> Unconfirmed after {grace_minutes} min grace period.</p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
                        <p style="color: #64748b; font-size: 14px;">Please open the CareCircle portal to follow up with the patient or record administration.</p>
                    </div>
                    """
                )
                notif.email_delivery_status = status_code
                if status_code == DeliveryStatus.DELIVERED:
                    notif.email_sent = True
                emails_dispatched += 1
            else:
                notif.email_delivery_status = DeliveryStatus.SKIPPED_NO_CREDENTIALS

        # Record audit log
        audit = AuditLog(
            profile_id=profile.id,
            user_id=None,
            action="DOSE_ESCALATED_MISSED",
            entity_type="MedicationDose",
            entity_id=dose.id,
            details={
                "medication_id": dose.medication_id,
                "scheduled_time": dose.scheduled_time.isoformat(),
                "grace_minutes": grace_minutes,
                "recipients_count": len(recipient_user_ids)
            }
        )
        db.add(audit)
        escalated_count += 1

    db.commit()

    return {
        "processed_at": now.isoformat(),
        "escalated_doses": escalated_count,
        "notifications_created": notifications_created,
        "emails_dispatched": emails_dispatched
    }
