from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models import UserRole, DoseStatus, AppointmentStatus, DeliveryStatus, NotificationType

# --- User & Auth Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    full_name: str = Field(..., min_length=2)
    role: UserRole = UserRole.ELDERLY
    phone_number: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    phone_number: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None

# --- Elderly Profile Schemas ---
class ElderlyProfileBase(BaseModel):
    full_name: str = Field(..., min_length=2)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    contact_phone: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    medical_conditions: Optional[str] = None
    known_allergies: Optional[str] = None
    important_notes: Optional[str] = None
    profile_image_url: Optional[str] = None

class ElderlyProfileCreate(ElderlyProfileBase):
    pass

class ElderlyProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    contact_phone: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    medical_conditions: Optional[str] = None
    known_allergies: Optional[str] = None
    important_notes: Optional[str] = None
    profile_image_url: Optional[str] = None

class ElderlyProfileResponse(ElderlyProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Care Circle Schemas ---
class InvitationCreate(BaseModel):
    profile_id: int
    role: UserRole = Field(..., description="Must be FAMILY_MEMBER or CARETAKER")
    relationship_title: str = Field(..., description="E.g. Daughter, Caregiver, Son, Nurse")
    recipient_email: Optional[EmailStr] = None
    can_view_health: bool = True
    can_manage_care: bool = False
    expiry_days: int = Field(default=7, ge=1, le=30)

class InvitationResponse(BaseModel):
    id: int
    profile_id: int
    role: UserRole
    relationship_title: str
    recipient_email: Optional[str] = None
    invitation_code: Optional[str] = None  # Returned only upon creation
    expires_at: datetime
    is_accepted: bool
    can_view_health: bool
    can_manage_care: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class InvitationAccept(BaseModel):
    invitation_code: str = Field(..., description="E.g. CC-A3B9-4F2E")

class MemberResponse(BaseModel):
    id: int
    profile_id: int
    user_id: int
    user_name: str
    user_email: str
    relationship_title: str
    role: UserRole
    can_view_health: bool
    can_manage_care: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Medication & Dose Schemas ---
class MedicationCreate(BaseModel):
    name: str = Field(..., min_length=2)
    dosage: str = Field(..., description="e.g. 50mg, 1 tablet")
    frequency: str = Field(..., description="e.g. ONCE_DAILY, TWICE_DAILY, CUSTOM")
    scheduled_times: List[str] = Field(..., description="e.g. ['09:00', '21:00']")
    start_date: date
    end_date: Optional[date] = None
    prescribing_doctor: Optional[str] = None
    instructions: Optional[str] = None

class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    scheduled_times: Optional[List[str]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    prescribing_doctor: Optional[str] = None
    instructions: Optional[str] = None
    is_active: Optional[bool] = None

class MedicationResponse(BaseModel):
    id: int
    profile_id: int
    name: str
    dosage: str
    frequency: str
    scheduled_times: List[str]
    start_date: date
    end_date: Optional[date] = None
    prescribing_doctor: Optional[str] = None
    instructions: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DoseResponse(BaseModel):
    id: int
    medication_id: int
    medication_name: str
    medication_dosage: str
    medication_instructions: Optional[str] = None
    profile_id: int
    scheduled_time: datetime
    actual_time: Optional[datetime] = None
    status: DoseStatus
    recorded_by_id: Optional[int] = None
    recorded_by_name: Optional[str] = None
    notes: Optional[str] = None
    escalated: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DoseRecordRequest(BaseModel):
    status: DoseStatus = Field(..., description="TAKEN, SKIPPED, or MISSED")
    notes: Optional[str] = None

class AdherenceDailyTrend(BaseModel):
    date: str
    scheduled: int
    taken: int
    missed: int
    skipped: int
    adherence_percentage: float

class AdherenceStats(BaseModel):
    total_scheduled: int
    taken: int
    missed: int
    skipped: int
    adherence_percentage: float
    daily_trends: List[AdherenceDailyTrend]

# --- Appointment Schemas ---
class AppointmentCreate(BaseModel):
    doctor_name: str
    hospital_clinic: str
    appointment_date: date
    appointment_time: str = Field(..., description="HH:MM e.g. 10:30")
    purpose: str
    notes: Optional[str] = None

class AppointmentUpdate(BaseModel):
    doctor_name: Optional[str] = None
    hospital_clinic: Optional[str] = None
    appointment_date: Optional[date] = None
    appointment_time: Optional[str] = None
    purpose: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[AppointmentStatus] = None

class AppointmentResponse(BaseModel):
    id: int
    profile_id: int
    doctor_name: str
    hospital_clinic: str
    appointment_date: date
    appointment_time: str
    purpose: str
    notes: Optional[str] = None
    status: AppointmentStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Care Activity Schemas ---
class CareActivityCreate(BaseModel):
    activity_type: str = Field(..., description="VITALS, MEAL, MOBILITY, FLUIDS, HYGIENE, OTHER")
    title: str
    description: Optional[str] = None
    activity_time: Optional[datetime] = None
    metrics: Optional[Dict[str, Any]] = None

class CareActivityResponse(BaseModel):
    id: int
    profile_id: int
    recorded_by_id: int
    recorded_by_name: str
    activity_type: str
    activity_time: datetime
    title: str
    description: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Timeline Schemas ---
class TimelineEvent(BaseModel):
    id: str
    timestamp: datetime
    category: str  # "MEDICATION_DOSE", "APPOINTMENT", "CARE_ACTIVITY", "AUDIT"
    title: str
    subtitle: Optional[str] = None
    status: Optional[str] = None
    status_color: str  # "green", "amber", "red", "blue", "gray"
    details: Optional[Dict[str, Any]] = None
    recorded_by: Optional[str] = None

# --- Notification Schemas ---
class NotificationResponse(BaseModel):
    id: int
    type: NotificationType
    title: str
    message: str
    is_read: bool
    email_sent: bool
    email_delivery_status: DeliveryStatus
    email_recipient: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationPreferenceResponse(BaseModel):
    email_notifications_enabled: bool
    missed_dose_alerts: bool
    appointment_reminders: bool
    grace_period_minutes: int

    model_config = ConfigDict(from_attributes=True)

class NotificationPreferenceUpdate(BaseModel):
    email_notifications_enabled: Optional[bool] = None
    missed_dose_alerts: Optional[bool] = None
    appointment_reminders: Optional[bool] = None
    grace_period_minutes: Optional[int] = Field(None, ge=10, le=120)
