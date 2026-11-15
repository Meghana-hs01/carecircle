import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Text, Enum, JSON, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database.session import Base

def utcnow():
    return datetime.now(timezone.utc)

def ensure_utc(dt):
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


class UserRole(str, enum.Enum):
    ELDERLY = "ELDERLY"
    FAMILY_MEMBER = "FAMILY_MEMBER"
    CARETAKER = "CARETAKER"

class DoseStatus(str, enum.Enum):
    UPCOMING = "UPCOMING"
    TAKEN = "TAKEN"
    MISSED = "MISSED"
    SKIPPED = "SKIPPED"

class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class DeliveryStatus(str, enum.Enum):
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"
    SKIPPED_NO_CREDENTIALS = "SKIPPED_NO_CREDENTIALS"
    PENDING = "PENDING"

class NotificationType(str, enum.Enum):
    MEDICATION_REMINDER = "MEDICATION_REMINDER"
    MISSED_DOSE_ALERT = "MISSED_DOSE_ALERT"
    APPOINTMENT_REMINDER = "APPOINTMENT_REMINDER"
    CARE_ACTIVITY_LOGGED = "CARE_ACTIVITY_LOGGED"
    CIRCLE_INVITATION = "CIRCLE_INVITATION"
    SECURITY_ALERT = "SECURITY_ALERT"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.ELDERLY)
    phone_number = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    elderly_profile = relationship("ElderlyProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    care_circle_memberships = relationship("CareCircleMember", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    notification_preference = relationship("NotificationPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")

class ElderlyProfile(Base):
    __tablename__ = "elderly_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(50), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    
    # Emergency Contact
    emergency_contact_name = Column(String(255), nullable=True)
    emergency_contact_phone = Column(String(50), nullable=True)
    emergency_contact_relation = Column(String(100), nullable=True)

    # Healthcare background
    medical_conditions = Column(Text, nullable=True)  # Comma-separated or narrative
    known_allergies = Column(Text, nullable=True)     # Comma-separated or narrative
    important_notes = Column(Text, nullable=True)
    profile_image_url = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="elderly_profile")
    care_circle_members = relationship("CareCircleMember", back_populates="profile", cascade="all, delete-orphan")
    invitations = relationship("CareCircleInvitation", back_populates="profile", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="profile", cascade="all, delete-orphan")
    doses = relationship("MedicationDose", back_populates="profile", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="profile", cascade="all, delete-orphan")
    care_activities = relationship("CareActivity", back_populates="profile", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="profile", cascade="all, delete-orphan")

class CareCircleMember(Base):
    __tablename__ = "care_circle_members"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("elderly_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    relationship_title = Column(String(100), nullable=False)  # e.g., Daughter, Son, Nurse, Primary Caregiver
    role = Column(Enum(UserRole), nullable=False)             # FAMILY_MEMBER or CARETAKER
    can_view_health = Column(Boolean, default=True, nullable=False)
    can_manage_care = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("profile_id", "user_id", name="uq_profile_circle_user"),
    )

    profile = relationship("ElderlyProfile", back_populates="care_circle_members")
    user = relationship("User", back_populates="care_circle_memberships")

class CareCircleInvitation(Base):
    __tablename__ = "care_circle_invitations"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("elderly_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    invited_by_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum(UserRole), nullable=False)  # FAMILY_MEMBER or CARETAKER
    relationship_title = Column(String(100), nullable=False)
    code_hash = Column(String(64), unique=True, index=True, nullable=False)
    recipient_email = Column(String(255), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_accepted = Column(Boolean, default=False, nullable=False)
    accepted_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    can_view_health = Column(Boolean, default=True, nullable=False)
    can_manage_care = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    profile = relationship("ElderlyProfile", back_populates="invitations")

class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("elderly_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    dosage = Column(String(100), nullable=False)          # e.g. "50mg", "1 tablet"
    frequency = Column(String(100), nullable=False)       # e.g. "ONCE_DAILY", "TWICE_DAILY", "CUSTOM"
    scheduled_times = Column(JSON, nullable=False)         # e.g. ["08:00", "20:00"]
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    prescribing_doctor = Column(String(255), nullable=True)
    instructions = Column(Text, nullable=True)            # e.g. "Take after meal with warm water"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    profile = relationship("ElderlyProfile", back_populates="medications")
    doses = relationship("MedicationDose", back_populates="medication", cascade="all, delete-orphan")

class MedicationDose(Base):
    __tablename__ = "medication_doses"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id", ondelete="CASCADE"), nullable=False, index=True)
    profile_id = Column(Integer, ForeignKey("elderly_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    scheduled_time = Column(DateTime(timezone=True), nullable=False, index=True)
    actual_time = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(DoseStatus), default=DoseStatus.UPCOMING, nullable=False, index=True)
    recorded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    escalated = Column(Boolean, default=False, nullable=False)
    escalated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("medication_id", "scheduled_time", name="uq_medication_dose_scheduled"),
    )

    medication = relationship("Medication", back_populates="doses")
    profile = relationship("ElderlyProfile", back_populates="doses")
    recorded_by = relationship("User", foreign_keys=[recorded_by_id])

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("elderly_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_name = Column(String(255), nullable=False)
    hospital_clinic = Column(String(255), nullable=False)
    appointment_date = Column(Date, nullable=False, index=True)
    appointment_time = Column(String(20), nullable=False)  # "10:30"
    purpose = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.SCHEDULED, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    profile = relationship("ElderlyProfile", back_populates="appointments")

class CareActivity(Base):
    __tablename__ = "care_activities"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("elderly_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    recorded_by_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    activity_type = Column(String(100), nullable=False)  # VITALS, MEAL, MOBILITY, FLUIDS, HYGIENE, OTHER
    activity_time = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    metrics = Column(JSON, nullable=True)  # e.g. {"systolic": 120, "diastolic": 80, "pulse": 72}
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    profile = relationship("ElderlyProfile", back_populates="care_activities")
    recorded_by = relationship("User", foreign_keys=[recorded_by_id])

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    profile_id = Column(Integer, ForeignKey("elderly_profiles.id", ondelete="CASCADE"), nullable=True, index=True)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    email_sent = Column(Boolean, default=False, nullable=False)
    email_delivery_status = Column(Enum(DeliveryStatus), default=DeliveryStatus.PENDING, nullable=False)
    email_recipient = Column(String(255), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="notifications")

class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    email_notifications_enabled = Column(Boolean, default=True, nullable=False)
    missed_dose_alerts = Column(Boolean, default=True, nullable=False)
    appointment_reminders = Column(Boolean, default=True, nullable=False)
    grace_period_minutes = Column(Integer, default=30, nullable=False)  # 15, 30, 45, 60 minutes
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="notification_preference")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("elderly_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)     # e.g., "DOSE_MARKED_TAKEN", "MEDICATION_CREATED", "MEMBER_REVOKED"
    entity_type = Column(String(100), nullable=False) # e.g., "MedicationDose", "CareCircleMember"
    entity_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)

    profile = relationship("ElderlyProfile", back_populates="audit_logs")
    user = relationship("User", foreign_keys=[user_id])
