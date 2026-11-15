from datetime import date, datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.database.session import SessionLocal, Base, engine
from app.models import (
    User, ElderlyProfile, CareCircleMember, Medication, MedicationDose,
    Appointment, CareActivity, Notification, NotificationPreference,
    UserRole, DoseStatus, AppointmentStatus, NotificationType, DeliveryStatus
)
from app.core.security import get_password_hash
from app.services.dose_service import generate_doses_for_medication

def seed_demo_data(db: Session):
    """Seed fictional demonstration data for CareCircle hackathon evaluation."""
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    # Check if already seeded
    if db.query(User).filter(User.email == "eleanor@carecircle.demo").first():
        print("Demo data already seeded.")
        return

    print("Seeding fictional demo data...")
    hashed_pwd = get_password_hash("CareCircle2026!")

    # 1. Users
    eleanor = User(
        email="eleanor@carecircle.demo",
        hashed_password=hashed_pwd,
        full_name="Eleanor Vance",
        role=UserRole.ELDERLY,
        phone_number="+1 (555) 234-5678",
        is_active=True
    )
    sarah = User(
        email="sarah@carecircle.demo",
        hashed_password=hashed_pwd,
        full_name="Sarah Vance",
        role=UserRole.FAMILY_MEMBER,
        phone_number="+1 (555) 876-5432",
        is_active=True
    )
    marcus = User(
        email="marcus@carecircle.demo",
        hashed_password=hashed_pwd,
        full_name="Marcus Chen, RN",
        role=UserRole.CARETAKER,
        phone_number="+1 (555) 432-1098",
        is_active=True
    )
    db.add_all([eleanor, sarah, marcus])
    db.flush()

    # Preferences
    for u in [eleanor, sarah, marcus]:
        pref = NotificationPreference(
            user_id=u.id,
            email_notifications_enabled=True,
            missed_dose_alerts=True,
            appointment_reminders=True,
            grace_period_minutes=30
        )
        db.add(pref)

    # 2. Elderly Profile
    profile = ElderlyProfile(
        user_id=eleanor.id,
        full_name="Eleanor Vance",
        date_of_birth=date(1948, 6, 15),
        gender="Female",
        contact_phone="+1 (555) 234-5678",
        emergency_contact_name="Sarah Vance (Daughter)",
        emergency_contact_phone="+1 (555) 876-5432",
        emergency_contact_relation="Daughter",
        medical_conditions="Essential Hypertension, Type 2 Diabetes, Mild Osteoarthritis (Right Knee)",
        known_allergies="Penicillin (Moderate rash), Shellfish",
        important_notes="Prefers taking evening medicines immediately after dinner. Walks with a supportive cane for long distances.",
        profile_image_url="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256"
    )
    db.add(profile)
    db.flush()

    # 3. Care Circle Memberships
    member_sarah = CareCircleMember(
        profile_id=profile.id,
        user_id=sarah.id,
        relationship_title="Daughter",
        role=UserRole.FAMILY_MEMBER,
        can_view_health=True,
        can_manage_care=False
    )
    member_marcus = CareCircleMember(
        profile_id=profile.id,
        user_id=marcus.id,
        relationship_title="Primary Caretaker (RN)",
        role=UserRole.CARETAKER,
        can_view_health=True,
        can_manage_care=True
    )
    db.add_all([member_sarah, member_marcus])

    # 4. Medications
    med1 = Medication(
        profile_id=profile.id,
        name="Lisinopril",
        dosage="20mg",
        frequency="ONCE_DAILY",
        scheduled_times=["08:00"],
        start_date=date.today() - timedelta(days=30),
        prescribing_doctor="Dr. Robert Hayes",
        instructions="Take 1 tablet in the morning with a full glass of water. Monitor blood pressure weekly.",
        is_active=True
    )
    med2 = Medication(
        profile_id=profile.id,
        name="Metformin HCl",
        dosage="500mg",
        frequency="TWICE_DAILY",
        scheduled_times=["08:00", "20:00"],
        start_date=date.today() - timedelta(days=30),
        prescribing_doctor="Dr. Angela Thorne",
        instructions="Take with meals to avoid gastrointestinal upset.",
        is_active=True
    )
    med3 = Medication(
        profile_id=profile.id,
        name="Atorvastatin",
        dosage="10mg",
        frequency="ONCE_DAILY",
        scheduled_times=["20:00"],
        start_date=date.today() - timedelta(days=30),
        prescribing_doctor="Dr. Robert Hayes",
        instructions="Take 1 tablet every evening before bed.",
        is_active=True
    )
    db.add_all([med1, med2, med3])
    db.flush()

    # Generate doses
    for m in [med1, med2, med3]:
        generate_doses_for_medication(db, m, days_behind=5, days_ahead=7)

    # Mark some past doses realistically
    past_doses = db.query(MedicationDose).filter(
        MedicationDose.profile_id == profile.id,
        MedicationDose.scheduled_time < datetime.now(timezone.utc)
    ).all()

    for idx, d in enumerate(past_doses):
        if idx % 7 == 0:
            d.status = DoseStatus.SKIPPED
            d.notes = "Patient reported mild nausea; consulted doctor and skipped dose."
            d.recorded_by_id = marcus.id
        elif idx % 9 == 0:
            d.status = DoseStatus.MISSED
            d.escalated = True
            d.escalated_at = d.scheduled_time + timedelta(minutes=45)
        else:
            d.status = DoseStatus.TAKEN
            d.actual_time = d.scheduled_time + timedelta(minutes=10)
            d.recorded_by_id = eleanor.id if idx % 2 == 0 else marcus.id

    # 5. Appointments
    today = date.today()
    appt1 = Appointment(
        profile_id=profile.id,
        doctor_name="Robert Hayes, MD (Cardiologist)",
        hospital_clinic="St. Jude Medical Pavilion, Suite 402",
        appointment_date=today + timedelta(days=3),
        appointment_time="10:30",
        purpose="Quarterly Blood Pressure & ACE Inhibitor Review",
        notes="Please bring 14-day blood pressure logs and current medication list.",
        status=AppointmentStatus.SCHEDULED
    )
    appt2 = Appointment(
        profile_id=profile.id,
        doctor_name="Anita Desai, OD",
        hospital_clinic="Vision First Optometry Clinic",
        appointment_date=today + timedelta(days=12),
        appointment_time="14:00",
        purpose="Annual Diabetic Retinopathy Screening",
        notes="Pupil dilation expected. Family member should accompany for ride home.",
        status=AppointmentStatus.SCHEDULED
    )
    appt3 = Appointment(
        profile_id=profile.id,
        doctor_name="Angela Thorne, MD (Endocrinologist)",
        hospital_clinic="University Health Center",
        appointment_date=today - timedelta(days=14),
        appointment_time="09:15",
        purpose="HbA1c Routine Check",
        notes="HbA1c recorded at 6.8%. Excellent glycemic management.",
        status=AppointmentStatus.COMPLETED
    )
    db.add_all([appt1, appt2, appt3])

    # 6. Care Activities
    act1 = CareActivity(
        profile_id=profile.id,
        recorded_by_id=marcus.id,
        activity_type="VITALS",
        activity_time=datetime.now(timezone.utc) - timedelta(hours=3),
        title="Morning Blood Pressure & Heart Rate",
        description="Patient rested in seated position for 5 minutes prior to reading.",
        metrics={"systolic": 122, "diastolic": 78, "pulse": 72, "unit": "mmHg"}
    )
    act2 = CareActivity(
        profile_id=profile.id,
        recorded_by_id=marcus.id,
        activity_type="VITALS",
        activity_time=datetime.now(timezone.utc) - timedelta(hours=4),
        title="Fasting Blood Glucose",
        description="Fingerstick test before breakfast.",
        metrics={"glucose": 98, "unit": "mg/dL", "state": "fasting"}
    )
    act3 = CareActivity(
        profile_id=profile.id,
        recorded_by_id=marcus.id,
        activity_type="MOBILITY",
        activity_time=datetime.now(timezone.utc) - timedelta(days=1, hours=2),
        title="Afternoon Physical Therapy & Garden Walk",
        description="Completed 20 minutes gentle walking with cane. Steady gait, no knee pain reported.",
        metrics={"duration_minutes": 20, "assisted": True}
    )
    db.add_all([act1, act2, act3])

    # 7. Notifications
    notif1 = Notification(
        user_id=eleanor.id,
        profile_id=profile.id,
        type=NotificationType.MEDICATION_REMINDER,
        title="Upcoming Medication: Lisinopril 20mg",
        message="Scheduled for 08:00 AM UTC. Please take with a full glass of water.",
        is_read=True,
        email_sent=False,
        email_delivery_status=DeliveryStatus.SKIPPED_NO_CREDENTIALS,
        sent_at=datetime.now(timezone.utc) - timedelta(hours=5)
    )
    notif2 = Notification(
        user_id=marcus.id,
        profile_id=profile.id,
        type=NotificationType.APPOINTMENT_REMINDER,
        title="Upcoming Appointment Reminder",
        message=f"Reminder: Eleanor Vance has an appointment with Dr. Robert Hayes in 3 days ({appt1.appointment_date}).",
        is_read=False,
        email_sent=False,
        email_delivery_status=DeliveryStatus.SKIPPED_NO_CREDENTIALS,
        sent_at=datetime.now(timezone.utc) - timedelta(hours=2)
    )
    db.add_all([notif1, notif2])

    db.commit()
    print("Demo data successfully seeded!")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()
