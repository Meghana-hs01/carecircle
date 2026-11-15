# CareCircle — Architectural Specifications

## 1. Domain Entities & Database Schema

The relational database architecture is designed with foreign key constraints, uniqueness constraints, cascading deletes, and indexes for high-throughput query performance:

- **`users`**: Core identity table storing user credentials, role (`ELDERLY`, `FAMILY_MEMBER`, `CARETAKER`), and account status.
- **`elderly_profiles`**: Clinical profile 1-to-1 with elderly user (`user_id`), storing demographics, emergency contacts, chronic conditions, and drug allergies.
- **`care_circle_members`**: Relationship mapping connecting authorized family members and caretakers to an elderly profile with granular boolean permissions (`can_view_health`, `can_manage_care`).
- **`care_circle_invitations`**: Single-use expiring invitation codes stored as deterministic SHA-256 hashes (`code_hash`) to avoid plaintext credential exposure.
- **`medications`**: Prescriptions containing medicine name, dosage, frequency, recurrence schedule (`scheduled_times`), start/end dates, and prescribing physician.
- **`medication_doses`**: Individual dose instances generated from medication schedules. Features status (`UPCOMING`, `TAKEN`, `MISSED`, `SKIPPED`), actual administration timestamp, and audit attribution. Protected by unique composite constraint `(medication_id, scheduled_time)`.
- **`appointments`**: Medical consultations with clinic, date, time, purpose, notes, and status (`SCHEDULED`, `COMPLETED`, `CANCELLED`).
- **`care_activities`**: Daily clinical records (blood pressure, blood glucose, meals, hydration, physical therapy walks) logged by caretakers.
- **`notifications`**: Real-time alerts with honest delivery tracking (`DELIVERED`, `FAILED`, `SKIPPED_NO_CREDENTIALS`).
- **`notification_preferences`**: User-configurable escalation rules including grace period duration (15 to 60 minutes).
- **`audit_logs`**: Immutable security and medical action log tracking profile updates, dose confirmations, and member access changes.

---

## 2. Insecure Direct Object Reference (IDOR) & Security Model

CareCircle enforces authorization at the backend dependency injection layer (`verify_profile_access`):
1. **Elderly Owner:** Always has full view and management permissions over their own primary profile.
2. **Care Circle Members:** Explicit database check on `CareCircleMember` linking `(profile_id, current_user.id)`. If absent, HTTP 403 Forbidden is returned immediately.
3. **Permission Granularity:**
   - Reading health records or dose history requires `can_view_health == True`.
   - Recording dose administrations or altering care activities requires `can_manage_care == True`.

---

## 3. Mathematical Adherence Engine

$$\text{Adherence \%} = \frac{\sum \text{TAKEN Doses}}{\sum (\text{TAKEN} + \text{MISSED} + \text{SKIPPED})} \times 100$$

- Future / upcoming doses are strictly filtered out from the denominator.
- Days with zero scheduled doses are handled safely without division by zero.
