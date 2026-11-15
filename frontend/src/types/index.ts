export type UserRole = 'ELDERLY' | 'FAMILY_MEMBER' | 'CARETAKER';

export type DoseStatus = 'UPCOMING' | 'TAKEN' | 'MISSED' | 'SKIPPED';

export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export type NotificationType =
  | 'MEDICATION_REMINDER'
  | 'MISSED_DOSE_ALERT'
  | 'APPOINTMENT_REMINDER'
  | 'CARE_ACTIVITY_LOGGED'
  | 'CIRCLE_INVITATION'
  | 'SECURITY_ALERT';

export type DeliveryStatus = 'DELIVERED' | 'FAILED' | 'SKIPPED_NO_CREDENTIALS' | 'PENDING';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  phone_number?: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ElderlyProfile {
  id: number;
  user_id: number;
  full_name: string;
  date_of_birth?: string;
  gender?: string;
  contact_phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  medical_conditions?: string;
  known_allergies?: string;
  important_notes?: string;
  profile_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CareCircleMember {
  id: number;
  profile_id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  relationship_title: string;
  role: UserRole;
  can_view_health: boolean;
  can_manage_care: boolean;
  created_at: string;
}

export interface Invitation {
  id: number;
  profile_id: number;
  role: UserRole;
  relationship_title: string;
  recipient_email?: string;
  invitation_code?: string;
  expires_at: string;
  is_accepted: boolean;
  can_view_health: boolean;
  can_manage_care: boolean;
  created_at: string;
}

export interface Medication {
  id: number;
  profile_id: number;
  name: string;
  dosage: string;
  frequency: string;
  scheduled_times: string[];
  start_date: string;
  end_date?: string;
  prescribing_doctor?: string;
  instructions?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicationDose {
  id: number;
  medication_id: number;
  medication_name: string;
  medication_dosage: string;
  medication_instructions?: string;
  profile_id: number;
  scheduled_time: string;
  actual_time?: string;
  status: DoseStatus;
  recorded_by_id?: number;
  recorded_by_name?: string;
  notes?: string;
  escalated: boolean;
  created_at: string;
}

export interface Appointment {
  id: number;
  profile_id: number;
  doctor_name: string;
  hospital_clinic: string;
  appointment_date: string;
  appointment_time: string;
  purpose: string;
  notes?: string;
  status: AppointmentStatus;
  created_at: string;
  updated_at: string;
}

export interface CareActivity {
  id: number;
  profile_id: number;
  recorded_by_id: number;
  recorded_by_name: string;
  activity_type: string;
  activity_time: string;
  title: string;
  description?: string;
  metrics?: Record<string, any>;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  category: 'MEDICATION_DOSE' | 'APPOINTMENT' | 'CARE_ACTIVITY' | 'AUDIT';
  title: string;
  subtitle?: string;
  status?: string;
  status_color: 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'teal';
  details?: Record<string, any>;
  recorded_by?: string;
}

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  email_sent: boolean;
  email_delivery_status: DeliveryStatus;
  email_recipient?: string;
  created_at: string;
}

export interface NotificationPreference {
  email_notifications_enabled: boolean;
  missed_dose_alerts: boolean;
  appointment_reminders: boolean;
  grace_period_minutes: number;
}

export interface AdherenceDailyTrend {
  date: string;
  scheduled: number;
  taken: number;
  missed: number;
  skipped: number;
  adherence_percentage: number;
}

export interface AdherenceStats {
  total_scheduled: number;
  taken: number;
  missed: number;
  skipped: number;
  adherence_percentage: number;
  daily_trends: AdherenceDailyTrend[];
}
