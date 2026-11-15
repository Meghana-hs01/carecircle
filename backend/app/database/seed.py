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

    # 1. Users (Authentic Indian Healthcare Personas)
    kausalya = User(
        email="kausalya@carecircle.demo",
        hashed_password=hashed_pwd,
        full_name="Kausalya Sharma",
        role=UserRole.ELDERLY,
        phone_number="9845012345",
        is_active=True
    )
    pooja = User(
        email="pooja@carecircle.demo",
        hashed_password=hashed_pwd,
        full_name="Pooja Sharma",
        role=UserRole.FAMILY_MEMBER,
        phone_number="9876543210",
        is_active=True
    )
    rajesh = User(
        email="rajesh@carecircle.demo",
        hashed_password=hashed_pwd,
        full_name="Rajesh Kumar, RN",
        role=UserRole.CARETAKER,
        phone_number="9123456789",
        is_active=True
    )
    ramesh = User(
        email="ramesh@carecircle.demo",
        hashed_password=hashed_pwd,
        full_name="Dr. Ramesh Rao, MD",
        role=UserRole.CARETAKER,
        phone_number="9880011223",
        is_active=True
    )

    # Legacy Aliases for Seamless Login Compatibility
    eleanor_alias = User(
        email="eleanor@carecircle.demo",
        hashed_password=hashed_pwd,
        full_name="Kausalya Sharma",
        role=UserRole.ELDERLY,
        phone_number="9845012345",
        is_active=True
    )
    sarah_alias = User(
        email="sarah@carecircle.demo",
        hashed_password=hashed_pwd,
        full_name="Pooja Sharma",
        role=UserRole.FAMILY_MEMBER,
        phone_number="9876543210",
        is_active=True
    )
    marcus_alias = User(
        email="marcus@carecircle.demo",
        hashed_password=hashed_pwd,
        full_name="Rajesh Kumar, RN",
        role=UserRole.CARETAKER,
        phone_number="9123456789",
        is_active=True
    )
    doctor_alias = User(
        email="doctor@carecircle.demo",
        hashed_password=hashed_pwd,
        full_name="Dr. Ramesh Rao, MD",
        role=UserRole.CARETAKER,
        phone_number="9880011223",
        is_active=True
    )

    db.add_all([kausalya, pooja, rajesh, ramesh, eleanor_alias, sarah_alias, marcus_alias, doctor_alias])
    db.flush()

    # Preferences
    for u in [kausalya, pooja, rajesh, ramesh, eleanor_alias, sarah_alias, marcus_alias, doctor_alias]:
        pref = NotificationPreference(
            user_id=u.id,
            email_notifications_enabled=True,
            missed_dose_alerts=True,
            appointment_reminders=True,
            grace_period_minutes=30
        )
        db.add(pref)

    # 2. Elderly Profile (Kausalya Sharma)
    profile = ElderlyProfile(
        user_id=kausalya.id,
        full_name="Kausalya Sharma",
        date_of_birth=date(1948, 6, 15),
        gender="Female",
        contact_phone="9845012345",
        emergency_contact_name="Pooja Sharma (Daughter)",
        emergency_contact_phone="9876543210",
        emergency_contact_relation="Daughter",
        medical_conditions="Essential Hypertension, Type 2 Diabetes Mellitus, Mild Osteoarthritis (Right Knee)",
        known_allergies="Penicillin (Moderate skin rash), Dust",
        important_notes="Prefers taking evening medicines immediately after dinner. Walks with a supportive cane for long distances.",
        profile_image_url="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256"
    )
    db.add(profile)
    db.flush()

    # Profile alias for eleanor_alias as well
    profile_alias = ElderlyProfile(
        user_id=eleanor_alias.id,
        full_name="Kausalya Sharma",
        date_of_birth=date(1948, 6, 15),
        gender="Female",
        contact_phone="9845012345",
        emergency_contact_name="Pooja Sharma (Daughter)",
        emergency_contact_phone="9876543210",
        emergency_contact_relation="Daughter",
        medical_conditions="Essential Hypertension, Type 2 Diabetes Mellitus, Mild Osteoarthritis (Right Knee)",
        known_allergies="Penicillin (Moderate skin rash), Dust",
        important_notes="Prefers taking evening medicines immediately after dinner.",
        profile_image_url="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256"
    )
    db.add(profile_alias)
    db.flush()

    # 3. Care Circle Memberships
    member_pooja = CareCircleMember(
        profile_id=profile.id,
        user_id=pooja.id,
        relationship_title="Daughter",
        role=UserRole.FAMILY_MEMBER,
        can_view_health=True,
        can_manage_care=False
    )
    member_rajesh = CareCircleMember(
        profile_id=profile.id,
        user_id=rajesh.id,
        relationship_title="Primary Caretaker (RN)",
        role=UserRole.CARETAKER,
        can_view_health=True,
        can_manage_care=True
    )
    member_ramesh = CareCircleMember(
        profile_id=profile.id,
        user_id=ramesh.id,
        relationship_title="Attending Physician (Apollo Hospitals)",
        role=UserRole.CARETAKER,
        can_view_health=True,
        can_manage_care=True
    )

    # Link aliases
    member_sarah = CareCircleMember(
        profile_id=profile_alias.id,
        user_id=sarah_alias.id,
        relationship_title="Daughter",
        role=UserRole.FAMILY_MEMBER,
        can_view_health=True,
        can_manage_care=False
    )
    member_marcus = CareCircleMember(
        profile_id=profile_alias.id,
        user_id=marcus_alias.id,
        relationship_title="Primary Caretaker (RN)",
        role=UserRole.CARETAKER,
        can_view_health=True,
        can_manage_care=True
    )
    member_doctor = CareCircleMember(
        profile_id=profile_alias.id,
        user_id=doctor_alias.id,
        relationship_title="Attending Physician (Apollo Hospitals)",
        role=UserRole.CARETAKER,
        can_view_health=True,
        can_manage_care=True
    )

    db.add_all([member_pooja, member_rajesh, member_ramesh, member_sarah, member_marcus, member_doctor])

    # 4. Medications
    med1 = Medication(
        profile_id=profile.id,
        name="Lisinopril",
        dosage="20mg",
        frequency="ONCE_DAILY",
        scheduled_times=["08:00"],
        start_date=date.today() - timedelta(days=30),
        prescribing_doctor="Dr. Arvind Swaminathan",
        instructions="Take 1 tablet in the morning with water. Monitor blood pressure weekly.",
        is_active=True
    )
    med2 = Medication(
        profile_id=profile.id,
        name="Metformin HCl",
        dosage="500mg",
        frequency="TWICE_DAILY",
        scheduled_times=["08:00", "20:00"],
        start_date=date.today() - timedelta(days=30),
        prescribing_doctor="Dr. Suresh Varma",
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
        prescribing_doctor="Dr. Arvind Swaminathan",
        instructions="Take 1 tablet every evening after dinner.",
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
            d.recorded_by_id = rajesh.id
        elif idx % 9 == 0:
            d.status = DoseStatus.MISSED
            d.escalated = True
            d.escalated_at = d.scheduled_time + timedelta(minutes=45)
        else:
            d.status = DoseStatus.TAKEN
            d.actual_time = d.scheduled_time + timedelta(minutes=10)
            d.recorded_by_id = kausalya.id if idx % 2 == 0 else rajesh.id

    # 5. Appointments
    today = date.today()
    appt1 = Appointment(
        profile_id=profile.id,
        doctor_name="Dr. Arvind Swaminathan, MD (Cardiologist)",
        hospital_clinic="Apollo Hospitals, Bannerghatta Road, Bengaluru",
        appointment_date=today + timedelta(days=3),
        appointment_time="10:30",
        purpose="Quarterly Blood Pressure & ACE Inhibitor Review",
        notes="Please bring 14-day blood pressure logs and current medication list.",
        status=AppointmentStatus.SCHEDULED
    )
    appt2 = Appointment(
        profile_id=profile.id,
        doctor_name="Dr. Anita Desai, MS (Ophthalmology)",
        hospital_clinic="Narayana Nethralaya Eye Care, Bengaluru",
        appointment_date=today + timedelta(days=12),
        appointment_time="14:00",
        purpose="Annual Diabetic Retinopathy Screening",
        notes="Pupil dilation expected. Family member should accompany for ride home.",
        status=AppointmentStatus.SCHEDULED
    )
    appt3 = Appointment(
        profile_id=profile.id,
        doctor_name="Dr. Suresh Varma, MD (Endocrinologist)",
        hospital_clinic="Manipal Hospital, Old Airport Road, Bengaluru",
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
        recorded_by_id=rajesh.id,
        activity_type="VITALS",
        activity_time=datetime.now(timezone.utc) - timedelta(hours=3),
        title="Morning Blood Pressure & Heart Rate",
        description="Patient rested in seated position for 5 minutes prior to reading.",
        metrics={"systolic": 122, "diastolic": 78, "pulse": 72, "unit": "mmHg"}
    )
    act2 = CareActivity(
        profile_id=profile.id,
        recorded_by_id=rajesh.id,
        activity_type="VITALS",
        activity_time=datetime.now(timezone.utc) - timedelta(hours=4),
        title="Fasting Blood Glucose",
        description="Fingerstick test before breakfast.",
        metrics={"glucose": 98, "unit": "mg/dL", "state": "fasting"}
    )
    act3 = CareActivity(
        profile_id=profile.id,
        recorded_by_id=rajesh.id,
        activity_type="MOBILITY",
        activity_time=datetime.now(timezone.utc) - timedelta(days=1, hours=2),
        title="Afternoon Physical Therapy & Garden Walk",
        description="Completed 20 minutes gentle walking with cane. Steady gait, no knee pain reported.",
        metrics={"duration_minutes": 20, "assisted": True}
    )
    db.add_all([act1, act2, act3])

    # 7. Notifications
    notif1 = Notification(
        user_id=kausalya.id,
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
        user_id=rajesh.id,
        profile_id=profile.id,
        type=NotificationType.APPOINTMENT_REMINDER,
        title="Upcoming Appointment Reminder",
        message=f"Reminder: Kausalya Sharma has an appointment with Dr. Arvind Swaminathan in 3 days ({appt1.appointment_date}).",
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
