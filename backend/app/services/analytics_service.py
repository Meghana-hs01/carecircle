from datetime import datetime, timedelta, date, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import MedicationDose, DoseStatus, utcnow
from app.schemas import AdherenceStats, AdherenceDailyTrend

def compute_adherence_analytics(db: Session, profile_id: int, days_window: int = 14) -> AdherenceStats:
    """
    Computes real mathematical medication adherence from actual database dose records.
    Explicitly excludes future/pending doses.
    Formula:
        Adherence % = (taken_doses / (taken + missed + skipped)) * 100
    """
    now = utcnow()
    window_start = now - timedelta(days=days_window)

    # All doses in window that are past or already acted upon
    doses = db.query(MedicationDose).filter(
        MedicationDose.profile_id == profile_id,
        MedicationDose.scheduled_time >= window_start,
        # Exclude future upcoming doses
        (MedicationDose.scheduled_time <= now) | (MedicationDose.status != DoseStatus.UPCOMING)
    ).order_by(MedicationDose.scheduled_time.asc()).all()

    taken = sum(1 for d in doses if d.status == DoseStatus.TAKEN)
    missed = sum(1 for d in doses if d.status == DoseStatus.MISSED)
    skipped = sum(1 for d in doses if d.status == DoseStatus.SKIPPED)
    total_evaluated = taken + missed + skipped

    adherence_pct = round((taken / total_evaluated) * 100.0, 1) if total_evaluated > 0 else 100.0

    # Group by date for trends
    days_map: Dict[str, Dict[str, int]] = {}
    current_date = (now - timedelta(days=6)).date()
    end_date = now.date()

    while current_date <= end_date:
        d_str = current_date.strftime("%Y-%m-%d")
        days_map[d_str] = {"scheduled": 0, "taken": 0, "missed": 0, "skipped": 0}
        current_date += timedelta(days=1)

    for d in doses:
        d_str = d.scheduled_time.strftime("%Y-%m-%d")
        if d_str in days_map:
            days_map[d_str]["scheduled"] += 1
            if d.status == DoseStatus.TAKEN:
                days_map[d_str]["taken"] += 1
            elif d.status == DoseStatus.MISSED:
                days_map[d_str]["missed"] += 1
            elif d.status == DoseStatus.SKIPPED:
                days_map[d_str]["skipped"] += 1

    daily_trends: List[AdherenceDailyTrend] = []
    for d_str, counts in sorted(days_map.items()):
        sub_total = counts["taken"] + counts["missed"] + counts["skipped"]
        rate = round((counts["taken"] / sub_total) * 100.0, 1) if sub_total > 0 else 100.0
        daily_trends.append(AdherenceDailyTrend(
            date=d_str,
            scheduled=counts["scheduled"],
            taken=counts["taken"],
            missed=counts["missed"],
            skipped=counts["skipped"],
            adherence_percentage=rate
        ))

    return AdherenceStats(
        total_scheduled=total_evaluated,
        taken=taken,
        missed=missed,
        skipped=skipped,
        adherence_percentage=adherence_pct,
        daily_trends=daily_trends
    )
