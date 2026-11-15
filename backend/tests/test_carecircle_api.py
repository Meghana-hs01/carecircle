import pytest
from datetime import date, datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database.session import Base, get_db
from app.models import (
    User, ElderlyProfile, CareCircleMember, CareCircleInvitation,
    Medication, MedicationDose, Appointment, UserRole, DoseStatus,
    AppointmentStatus, NotificationPreference, utcnow
)
from app.core.security import get_password_hash, generate_invitation_code, hash_invitation_code

# Setup test in-memory SQLite database
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///./test_carecircle.db"
test_engine = create_engine(TEST_SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True, scope="module")
def setup_database():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

def test_health_and_ready_endpoints():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    res_ready = client.get("/ready")
    assert res_ready.status_code == 200
    assert res_ready.json()["status"] == "ready"

def test_elderly_registration_and_login():
    reg_payload = {
        "email": "test.elderly@example.com",
        "password": "Password123!",
        "full_name": "Arthur Pendelton",
        "role": "ELDERLY",
        "phone_number": "+15551234567"
    }
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test.elderly@example.com"
    assert data["user"]["role"] == "ELDERLY"

    # Test login
    login_payload = {
        "email": "test.elderly@example.com",
        "password": "Password123!"
    }
    login_res = client.post("/api/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert len(token) > 20

    # Test invalid password rejection
    bad_login = client.post("/api/auth/login", json={"email": "test.elderly@example.com", "password": "WrongPassword!"})
    assert bad_login.status_code == 401

def test_elderly_profile_creation_and_retrieval():
    # Login as Arthur
    login_res = client.post("/api/auth/login", json={"email": "test.elderly@example.com", "password": "Password123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get profiles list
    res = client.get("/api/profiles", headers=headers)
    assert res.status_code == 200
    profiles = res.json()
    assert len(profiles) == 1
    profile_id = profiles[0]["id"]

    # Update profile
    update_data = {
        "medical_conditions": "Mild Hypertension",
        "known_allergies": "Sulfa drugs",
        "emergency_contact_name": "Grace Pendelton",
        "emergency_contact_phone": "+15559876543"
    }
    update_res = client.put(f"/api/profiles/{profile_id}", json=update_data, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["known_allergies"] == "Sulfa drugs"

def test_invitation_generation_and_acceptance():
    # 1. Login as Arthur (Elderly)
    auth_res = client.post("/api/auth/login", json={"email": "test.elderly@example.com", "password": "Password123!"})
    arthur_token = auth_res.json()["access_token"]
    arthur_headers = {"Authorization": f"Bearer {arthur_token}"}
    profile_id = client.get("/api/profiles", headers=arthur_headers).json()[0]["id"]

    # 2. Register Caretaker (David)
    caretaker_payload = {
        "email": "david.caretaker@example.com",
        "password": "Password123!",
        "full_name": "David Miller",
        "role": "CARETAKER",
        "phone_number": "+15553334444"
    }
    david_res = client.post("/api/auth/register", json=caretaker_payload)
    david_token = david_res.json()["access_token"]
    david_headers = {"Authorization": f"Bearer {david_token}"}

    # 3. Arthur creates invitation for David
    invite_payload = {
        "profile_id": profile_id,
        "role": "CARETAKER",
        "relationship_title": "Visiting Nurse",
        "recipient_email": "david.caretaker@example.com",
        "can_view_health": True,
        "can_manage_care": True,
        "expiry_days": 7
    }
    invite_res = client.post("/api/invitations", json=invite_payload, headers=arthur_headers)
    assert invite_res.status_code == 201
    invitation_code = invite_res.json()["invitation_code"]
    assert invitation_code.startswith("CC-")

    # 4. David accepts invitation using code
    accept_res = client.post("/api/invitations/accept", json={"invitation_code": invitation_code}, headers=david_headers)
    assert accept_res.status_code == 200
    assert accept_res.json()["relationship_title"] == "Visiting Nurse"
    assert accept_res.json()["can_manage_care"] == True

    # 5. Verify single-use code: second attempt should fail
    re_accept = client.post("/api/invitations/accept", json={"invitation_code": invitation_code}, headers=david_headers)
    assert re_accept.status_code == 400

    # 6. David can now access Arthur's profile
    david_profiles = client.get("/api/profiles", headers=david_headers)
    assert david_profiles.status_code == 200
    assert len(david_profiles.json()) == 1
    assert david_profiles.json()[0]["id"] == profile_id

def test_unauthorized_profile_access_rejected_idor_protection():
    # Register an unrelated stranger
    stranger_payload = {
        "email": "stranger@example.com",
        "password": "Password123!",
        "full_name": "Intruder User",
        "role": "FAMILY_MEMBER"
    }
    stranger_res = client.post("/api/auth/register", json=stranger_payload)
    stranger_token = stranger_res.json()["access_token"]
    stranger_headers = {"Authorization": f"Bearer {stranger_token}"}

    # Arthur's profile id is 1
    unauthorized_res = client.get("/api/profiles/1", headers=stranger_headers)
    assert unauthorized_res.status_code == 403
    assert "Access denied" in unauthorized_res.json()["detail"]

def test_medication_creation_and_dose_generation():
    auth_res = client.post("/api/auth/login", json={"email": "test.elderly@example.com", "password": "Password123!"})
    token = auth_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    profile_id = 1

    med_payload = {
        "name": "Amlodipine",
        "dosage": "5mg",
        "frequency": "ONCE_DAILY",
        "scheduled_times": ["09:00"],
        "start_date": str(date.today()),
        "prescribing_doctor": "Dr. Watson",
        "instructions": "Take daily in morning"
    }
    res = client.post(f"/api/profiles/{profile_id}/medications", json=med_payload, headers=headers)
    assert res.status_code == 201
    med_id = res.json()["id"]

    # Check that doses were automatically generated
    doses_res = client.get(f"/api/profiles/{profile_id}/doses", headers=headers)
    assert doses_res.status_code == 200
    doses = doses_res.json()
    assert len(doses) >= 7

    # Mark a dose as TAKEN
    target_dose = doses[0]
    record_res = client.post(
        f"/api/doses/{target_dose['id']}/record",
        json={"status": "TAKEN", "notes": "Taken with water on time"},
        headers=headers
    )
    assert record_res.status_code == 200
    assert record_res.json()["status"] == "TAKEN"
    assert record_res.json()["notes"] == "Taken with water on time"

def test_appointments_crud():
    auth_res = client.post("/api/auth/login", json={"email": "test.elderly@example.com", "password": "Password123!"})
    headers = {"Authorization": f"Bearer {auth_res.json()['access_token']}"}
    profile_id = 1

    appt_payload = {
        "doctor_name": "Dr. Stephanie Croft",
        "hospital_clinic": "General Memorial Hospital",
        "appointment_date": str(date.today() + timedelta(days=5)),
        "appointment_time": "11:00",
        "purpose": "Comprehensive Geriatric Assessment",
        "notes": "Bring medical files"
    }
    create_res = client.post(f"/api/profiles/{profile_id}/appointments", json=appt_payload, headers=headers)
    assert create_res.status_code == 201
    appt_id = create_res.json()["id"]

    # List appointments
    list_res = client.get(f"/api/profiles/{profile_id}/appointments", headers=headers)
    assert list_res.status_code == 200
    assert any(a["id"] == appt_id for a in list_res.json())

    # Cancel appointment
    update_res = client.put(f"/api/appointments/{appt_id}", json={"status": "CANCELLED"}, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "CANCELLED"

def test_daily_care_timeline():
    auth_res = client.post("/api/auth/login", json={"email": "test.elderly@example.com", "password": "Password123!"})
    headers = {"Authorization": f"Bearer {auth_res.json()['access_token']}"}
    profile_id = 1

    timeline_res = client.get(f"/api/profiles/{profile_id}/timeline", headers=headers)
    assert timeline_res.status_code == 200
    events = timeline_res.json()
    assert len(events) > 0
    categories = {e["category"] for e in events}
    assert "MEDICATION_DOSE" in categories or "APPOINTMENT" in categories

def test_adherence_analytics():
    auth_res = client.post("/api/auth/login", json={"email": "test.elderly@example.com", "password": "Password123!"})
    headers = {"Authorization": f"Bearer {auth_res.json()['access_token']}"}
    profile_id = 1

    analytics_res = client.get(f"/api/profiles/{profile_id}/adherence", headers=headers)
    assert analytics_res.status_code == 200
    data = analytics_res.json()
    assert "adherence_percentage" in data
    assert "daily_trends" in data
    assert data["adherence_percentage"] >= 0.0

def test_cloud_scheduler_job_endpoint():
    # Test unauthorized cron access
    bad_cron = client.post("/api/internal/jobs/process-reminders", headers={"Authorization": "Bearer invalid_secret"})
    assert bad_cron.status_code == 403

    # Test authorized cron access
    good_cron = client.post(
        "/api/internal/jobs/process-reminders",
        headers={"Authorization": "Bearer carecircle-internal-job-token-2026"}
    )
    assert good_cron.status_code == 200
    assert good_cron.json()["status"] == "success"

def test_ai_care_assistant():
    auth_res = client.post("/api/auth/login", json={"email": "test.elderly@example.com", "password": "Password123!"})
    headers = {"Authorization": f"Bearer {auth_res.json()['access_token']}"}
    profile_id = 1

    # Test medication query
    q_res = client.post(
        "/api/ai/query",
        json={"profile_id": profile_id, "query": "What medicine do I take next?"},
        headers=headers
    )
    assert q_res.status_code == 200
    assert "answer" in q_res.json()
    assert "suggested_actions" in q_res.json()

    # Test weekly AI digest
    digest_res = client.get(f"/api/ai/summary/{profile_id}", headers=headers)
    assert digest_res.status_code == 200
    assert "executive_summary" in digest_res.json()
    assert "recommendations" in digest_res.json()
    assert digest_res.json()["adherence_rate"] >= 0.0

def test_clinical_safety_and_drug_interaction_guard():
    auth_res = client.post("/api/auth/login", json={"email": "test.elderly@example.com", "password": "Password123!"})
    assert auth_res.status_code == 200
    headers = {"Authorization": f"Bearer {auth_res.json()['access_token']}"}

    # Fetch safety analysis
    safety_res = client.get("/api/profiles/1/medications/safety-analysis", headers=headers)
    assert safety_res.status_code == 200
    data = safety_res.json()
    assert "patient_name" in data
    assert "allergies_evaluated" in data
    assert "clinical_warnings" in data
    assert "administration_insights" in data
    assert data["overall_status"] in ["OPTIMAL", "MODERATE_MONITOR", "HIGH_RISK"]

def test_indian_persona_and_10_digit_phones():
    reg_res = client.post("/api/auth/register", json={
        "email": "kausalya.sharma@example.com",
        "password": "Password123!",
        "full_name": "Kausalya Sharma",
        "role": "ELDERLY",
        "phone_number": "9845012345"
    })
    assert reg_res.status_code == 201
    headers = {"Authorization": f"Bearer {reg_res.json()['access_token']}"}

    # Get profile ID
    profiles_res = client.get("/api/profiles", headers=headers)
    assert profiles_res.status_code == 200
    target_id = profiles_res.json()[0]["id"]

    profile_res = client.put(f"/api/profiles/{target_id}", json={
        "full_name": "Kausalya Sharma",
        "contact_phone": "9845012345",
        "emergency_contact_name": "Pooja Sharma (Daughter)",
        "emergency_contact_phone": "9876543210",
        "emergency_contact_relation": "Daughter"
    }, headers=headers)
    assert profile_res.status_code == 200
    p = profile_res.json()
    assert p["full_name"] == "Kausalya Sharma"
    assert p["contact_phone"] == "9845012345"
    assert p["emergency_contact_phone"] == "9876543210"

def test_notification_preferences_and_audit_trail():
    auth_res = client.post("/api/auth/login", json={"email": "test.elderly@example.com", "password": "Password123!"})
    assert auth_res.status_code == 200
    headers = {"Authorization": f"Bearer {auth_res.json()['access_token']}"}

    # Get notification preferences
    pref_res = client.get("/api/notification-preferences", headers=headers)
    assert pref_res.status_code == 200
    assert pref_res.json()["grace_period_minutes"] >= 15

    # Update grace period
    update_res = client.put("/api/notification-preferences", json={"grace_period_minutes": 45}, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["grace_period_minutes"] == 45
