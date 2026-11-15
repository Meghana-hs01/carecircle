from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.escalation_service import process_missed_dose_escalations
from app.security.deps import verify_cron_secret

router = APIRouter(prefix="/internal/jobs", tags=["Scheduled Jobs (Cloud Scheduler / Cron)"])

@router.post("/process-reminders", status_code=status.HTTP_200_OK)
def trigger_process_reminders_job(
    authenticated: bool = Depends(verify_cron_secret),
    db: Session = Depends(get_db)
):
    """
    Authenticated, idempotent endpoint designed for Google Cloud Scheduler on Cloud Run.
    Scans overdue medication doses, escalates unconfirmed doses past grace period to MISSED,
    and alerts assigned caretakers and family members with authentic email delivery logs.
    """
    result = process_missed_dose_escalations(db)
    return {
        "status": "success",
        "job": "process-reminders",
        "details": result
    }
