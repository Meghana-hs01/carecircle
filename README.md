# CareCircle — Better Care. Together.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat&logo=React&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6.svg?style=flat&logo=TypeScript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC.svg?style=flat&logo=Tailwind-CSS&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1.svg?style=flat&logo=PostgreSQL&logoColor=white)](https://www.postgresql.org)
[![Google Cloud Run](https://img.shields.io/badge/Google_Cloud_Run-Ready-4285F4.svg?style=flat&logo=Google-Cloud&logoColor=white)](https://cloud.google.com/run)
[![Tests Passing](https://img.shields.io/badge/Tests-10%2F10%20Passing-brightgreen.svg)]()

> **Catalyst Solo AI Hackathon Project**
> CareCircle is a shared, secure healthcare management ecosystem connecting elderly individuals, authorized family members, and professional caretakers with mathematical adherence analytics, zero-leakage RBAC, and automated missed-dose escalation.

---

## 1. Project Vision & Problem Solved

Elderly individuals frequently depend on family members and caretakers to manage medicines, doctor visits, and everyday healthcare activities. Information is scattered across handwritten schedules and isolated reminder apps.

**CareCircle solves this by providing:**
- **Patient Agency:** Elderly individuals maintain full ownership and can independently record doses or invite trusted loved ones.
- **Role-Based Collaboration:** Family members track live adherence trends without micromanaging; professional nurses/caretakers record clinical vitals and dose administrations.
- **Missed-Dose Escalation:** When a scheduled medicine is unconfirmed past a configured grace period, automated alerts trigger across the care network.
- **Zero Insecure Direct Object References (IDOR):** Backend dependency guards strictly isolate patient profiles from unauthorized users.

---

## 2. Instant Hackathon Demo Accounts

CareCircle seeds fictional demonstration data so evaluators can test immediately without manual setup.

| Persona | Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Eleanor Vance** | `ELDERLY` | `eleanor@carecircle.demo` | `CareCircle2026!` | Primary patient, dose confirmation, appointment calendar, invite generator. |
| **Sarah Vance** | `FAMILY_MEMBER` | `sarah@carecircle.demo` | `CareCircle2026!` | Daughter with read access, live adherence analytics, missed-dose alerts. |
| **Marcus Chen, RN** | `CARETAKER` | `marcus@carecircle.demo` | `CareCircle2026!` | Registered Nurse with administration rights, clinical vitals logger (BP/pulse). |

---

## 3. Technology Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide React icons, Recharts, React Router v6, Axios.
- **Backend:** Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy 2.0 ORM, Alembic.
- **Database:** PostgreSQL (production / Docker) with SQLite local dev fallback.
- **Authentication:** JWT Bearer tokens (`jose`), bcrypt password hashing, secure random cryptographic invitation passcodes (`secrets` module) stored as SHA-256 hashes.
- **Cloud Scheduler & Jobs:** Authenticated endpoint `/api/internal/jobs/process-reminders` with bearer token validation.
- **Email:** Real SMTP integration with honest delivery status tracking (`DELIVERED`, `FAILED`, `SKIPPED_NO_CREDENTIALS`).

---

## 4. Key Modules & Architectural Highlights

### A. Medication & Dose Engine
- **Idempotent Dose Generator:** Automatically generates upcoming scheduled dose records from recurrence frequencies without duplication (`uq_medication_dose_scheduled`).
- **Safety Rule:** Reminder delivery never marks a dose as taken. A dose can only be marked `TAKEN` after an authorized user explicitly records it.
- **Audit Logging:** Every dose status transition records the exact timestamp, user id, and optional clinical notes.

### B. Secure Invitation & Care Circle System
- **Cryptographic Access Codes:** Formats like `CC-9K2F-9P4A`.
- **Zero Plaintext Passcode Storage:** The backend hashes codes with SHA-256 before saving to the database.
- **Single-Use Enforcement:** Codes are atomically consumed upon acceptance and cannot be reused or shared.

### C. Mathematical Adherence Analytics
- Formula:
  $$\text{Adherence \%} = \frac{\text{Taken Doses}}{\text{Taken} + \text{Missed} + \text{Skipped}} \times 100$$
- Excludes still-upcoming and future scheduled doses so the score reflects true historical compliance.
- Visualized using Recharts (Line trend curve and stacked distribution bar chart).

### D. Automated Missed-Dose Escalation Engine
- Evaluates unconfirmed doses where $\text{scheduled\_time} + \text{grace\_period} < \text{now}$.
- Idempotently marks doses as `MISSED` and sends alerts to assigned caretakers and family members.
- Accurately tracks SMTP status (never claims an email was delivered unless the SMTP server reports success).

### E. Accessibility Mode
- Large Text & Button Mode (enlarges text scale and ensures $\ge 48\text{px}$ touch targets).
- High Contrast Mode (WCAG 2.1 AAA high-contrast styling).
- Screen Reader Assistive landmarks and semantic ARIA attributes.

---

## 5. Automated Pytest Verification Results

The test suite thoroughly verifies authentication, RBAC, IDOR protection, dose generation, invitation workflows, appointments, timeline, and scheduler jobs:

```bash
$ pytest backend/tests -v

backend/tests/test_carecircle_api.py::test_health_and_ready_endpoints PASSED [ 10%]
backend/tests/test_carecircle_api.py::test_elderly_registration_and_login PASSED [ 20%]
backend/tests/test_carecircle_api.py::test_elderly_profile_creation_and_retrieval PASSED [ 30%]
backend/tests/test_carecircle_api.py::test_invitation_generation_and_acceptance PASSED [ 40%]
backend/tests/test_carecircle_api.py::test_unauthorized_profile_access_rejected_idor_protection PASSED [ 50%]
backend/tests/test_carecircle_api.py::test_medication_creation_and_dose_generation PASSED [ 60%]
backend/tests/test_carecircle_api.py::test_appointments_crud PASSED      [ 70%]
backend/tests/test_carecircle_api.py::test_daily_care_timeline PASSED    [ 80%]
backend/tests/test_carecircle_api.py::test_adherence_analytics PASSED    [ 90%]
backend/tests/test_carecircle_api.py::test_cloud_scheduler_job_endpoint PASSED [100%]

======================= 10 passed in 5.31s =======================
```

---

## 6. How to Run Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Step 1: Start the Backend
```bash
# From CareCircle directory
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run the FastAPI server (auto-creates tables and seeds demo data on startup)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API is now running at `http://localhost:8000`.
Interactive Swagger documentation is available at `http://localhost:8000/docs`.

### Step 2: Start the Frontend
```bash
# Open a second terminal from CareCircle directory
cd frontend

# Install dependencies (already built)
npm install

# Start Vite development server
npm run dev
```
The React frontend is now live at `http://localhost:5173`.

---

## 7. Running with Docker Compose (PostgreSQL Production Mode)

To run the complete production stack (PostgreSQL, FastAPI backend, and Nginx React frontend):

```bash
docker-compose up --build
```

- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000`
- **PostgreSQL Database:** `localhost:5432`

---

## 8. Google Cloud Run Deployment Guide

### Deploying the Backend to Cloud Run
```bash
# 1. Build and push backend image to Google Artifact Registry
gcloud artifacts repositories create carecircle-repo --repository-format=docker --location=us-central1
gcloud builds submit --tag us-central1-docker.pkg.dev/$PROJECT_ID/carecircle-repo/backend:latest ./backend

# 2. Deploy backend service to Cloud Run
gcloud run deploy carecircle-backend \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/carecircle-repo/backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars ENVIRONMENT=production,SECRET_KEY=prod-secret-key,DATABASE_URL=postgresql://... \
  --port 8000

# 3. Setup Google Cloud Scheduler for Missed-Dose Escalations
gcloud scheduler jobs create http carecircle-escalation-cron \
  --schedule="*/15 * * * *" \
  --uri="https://<YOUR-BACKEND-URL>/api/internal/jobs/process-reminders" \
  --http-method=POST \
  --headers="Authorization=Bearer carecircle-internal-job-token-2026"
```

### Deploying the Frontend to Cloud Run
```bash
gcloud builds submit --tag us-central1-docker.pkg.dev/$PROJECT_ID/carecircle-repo/frontend:latest ./frontend

gcloud run deploy carecircle-frontend \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/carecircle-repo/frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

---

## 9. API Specification Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user with role (`ELDERLY`, `FAMILY_MEMBER`, `CARETAKER`). |
| `POST` | `/api/auth/login` | Authenticate user and return signed JWT bearer token. |
| `GET` | `/api/auth/me` | Fetch authenticated user profile and roles. |
| `GET` | `/api/profiles` | List authorized elderly healthcare profiles (RBAC guarded). |
| `GET` | `/api/profiles/{id}` | Retrieve profile details with IDOR validation. |
| `PUT` | `/api/profiles/{id}` | Update clinical conditions, emergency contacts, and notes. |
| `POST` | `/api/invitations` | Generate 8-character expiring invitation code (SHA-256 hashed). |
| `POST` | `/api/invitations/accept` | Accept invitation code and establish Care Circle relationship. |
| `GET` | `/api/profiles/{id}/medications` | List active prescriptions and instructions. |
| `POST` | `/api/profiles/{id}/medications` | Prescribe medication and trigger 7-day dose generation. |
| `GET` | `/api/profiles/{id}/doses` | Retrieve doses for date range with status filters. |
| `POST` | `/api/doses/{id}/record` | Record dose as `TAKEN` or `SKIPPED` with audit trail. |
| `GET` | `/api/profiles/{id}/appointments`| List scheduled and past medical visits. |
| `POST` | `/api/profiles/{id}/appointments`| Schedule a new doctor or clinic consultation. |
| `GET` | `/api/profiles/{id}/timeline` | Unified chronological care timeline. |
| `GET` | `/api/profiles/{id}/adherence` | Real mathematical adherence percentage & daily trends. |
| `POST` | `/api/internal/jobs/process-reminders` | Cloud Scheduler cron endpoint for missed-dose escalation. |
| `GET` | `/health` & `/ready` | Liveness and database connectivity probes. |

---

## 10. License
Built for the Catalyst Solo AI Hackathon. Released under the MIT License.
