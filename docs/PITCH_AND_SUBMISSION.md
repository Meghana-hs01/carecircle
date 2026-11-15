# CareCircle — Catalyst Solo AI Hackathon Pitch & Submission Guide

> **Tagline:** "Better Care. Together."  
> **Track:** AI-Assisted Healthcare & Elderly Care Management  
> **Platform:** Full-Stack Monorepo (FastAPI + PostgreSQL + React + TypeScript + Recharts + Cloud Run)

---

## 1. Executive Summary

Elderly individuals frequently face fragmented medical schedules, scattered paper reminders, and disjointed communication between distant family members and visiting nurses. 

**CareCircle** is a unified, privacy-first healthcare management platform designed to preserve patient agency while empowering their support network through collaborative access control.

Unlike static prototypes, CareCircle is a **production-minded web platform** with an idempotent medication dose generation engine, automated missed-dose escalation with honest SMTP logging, real mathematical adherence calculations, zero-leakage IDOR protection, and an integrated **conversational AI Care Assistant**.

---

## 2. Core Competitive Advantages

### A. Real Data & Idempotent Dose Generation
- Rather than mock or hardcoded statistics, CareCircle generates individual dose records based on clinical recurrence schedules (e.g. `["08:00", "20:00"]`).
- Protected by composite database uniqueness constraints (`(medication_id, scheduled_time)`), doses can never be duplicated.

### B. Ethical Clinical Safety Rule
- **A reminder never automatically marks a dose as taken.**
- A dose status transition (`TAKEN`, `SKIPPED`, `MISSED`) requires explicit action from an authorized user and creates an unalterable audit log entry with timestamp and attribution.

### C. Zero-Leakage Cryptographic Invitations
- Elderly individuals invite family and caretakers via 8-character expiring codes (e.g., `CC-XXXX-XXXX`).
- Passcodes are never stored plaintext; the database only stores deterministic SHA-256 hashes. Codes are single-use and automatically consumed upon acceptance.

### D. Automated Missed-Dose Escalation Engine
- Designed for **Google Cloud Scheduler** via `/api/internal/jobs/process-reminders`.
- Overdue doses past the patient-configured grace period (15–60 mins) transition to `MISSED` and alert the care circle.
- **Honest SMTP Delivery Tracking:** If SMTP credentials are not present, delivery is accurately logged as `SKIPPED_NO_CREDENTIALS` rather than pretending an email was sent.

### E. AI Care Intelligence ("CareCircle AI")
- Conversational voice/text assistant powered by clinical database records.
- **Voice Read Aloud:** Uses SpeechSynthesis for visually impaired or elderly patients.
- **14-Day Executive AI Care Digest:** 1-click clinical synthesis analyzing adherence rates, blood pressure trends, missed doses, and upcoming doctor visits for family members and visiting physicians.

---

## 3. Two-Minute Video Demo Script

| Time | Screen / Persona | Voiceover / Action |
| :--- | :--- | :--- |
| **0:00 - 0:25** | **Landing Page & Vision** | "Welcome to CareCircle: Better Care. Together. Over 80% of elderly individuals manage multiple daily prescriptions. CareCircle brings elderly patients, family members, and caretakers into one shared, secure healthcare ecosystem." |
| **0:25 - 0:55** | **Elderly Persona: Eleanor Vance** | *Log in as Eleanor (1-click demo button).* "Here is Eleanor's high-visibility dashboard. She sees today's doses: Lisinopril and Metformin. With a single tap, she marks her morning dose as taken. She can toggle Large Text or High Contrast mode anytime. In her Care Circle, she generates a secure, expiring code for her daughter Sarah." |
| **0:55 - 1:20** | **Family Persona: Sarah Vance** | *Switch to Sarah's dashboard.* "As Eleanor's daughter, Sarah has read-only access. She sees Eleanor's 14-day adherence score calculated from real records (72.7%), upcoming cardiology appointment with Dr. Hayes, and receives instant alerts if a dose is missed." |
| **1:20 - 1:40** | **Caretaker Station: Marcus Chen, RN** | *Switch to Marcus's clinical view.* "Marcus is Eleanor's registered nurse with administration permissions. He logs her morning vitals: Blood Pressure 122/78 mmHg and pulse 72. Notice how this immediately appears on the Daily Care Timeline." |
| **1:40 - 2:00** | **CareCircle AI & Conclusion** | *Open AI Assistant.* "Eleanor can speak with CareCircle AI to ask 'When is my next dose?' or generate a 14-day clinical summary for her visiting doctor. 100% test coverage, Cloud Run and Docker ready. That's CareCircle." |

---

## 4. Key Metrics & Verification Evidence

- **Automated Tests:** 11/11 Pytest tests passing in 4.34s.
- **TypeScript & Vite:** Zero compilation errors, clean production bundle.
- **Security:** Full IDOR and RBAC test suite rejecting unauthorized profile access attempts with HTTP 403.
- **Database:** PostgreSQL production ready with automated Alembic migrations (`13e064c4cbda_initial_schema.py`).
