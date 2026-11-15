# CareCircle — Evaluator Demo Script & Testing Walkthrough

Follow these steps to experience the complete end-to-end workflow of CareCircle.

---

### Step 1: Elderly Experience (Eleanor Vance)
1. Navigate to `/login`.
2. Click the **👵 Elderly (Eleanor)** quick button or type:
   - Email: `eleanor@carecircle.demo`
   - Password: `CareCircle2026!`
3. You are taken to the **Elderly Dashboard**:
   - See Eleanor's **Today's Medication Schedule** (Lisinopril, Metformin).
   - Click **"Mark as Taken"** on an unconfirmed dose.
   - Choose **Dose Taken** or **Skip Dose** with an optional note, and submit.
   - Observe the immediate status transition to `Taken` with confirmed timestamp.
   - Note the **Primary Emergency Contact** banner with quick dial.
4. Click **Care Circle** in the sidebar:
   - Click **Invite New Member**.
   - Select **Family Member** or **Caretaker / Nurse**, choose permissions, and click **Generate Code**.
   - Copy the generated 8-character invitation code (e.g., `CC-XXXX-XXXX`).

---

### Step 2: Family Member Collaboration (Sarah Vance)
1. Sign out of Eleanor's account and log in as Sarah:
   - Click **👨‍👩‍👧 Family (Sarah)** or enter `sarah@carecircle.demo` / `CareCircle2026!`.
2. On the **Family Dashboard**:
   - See Eleanor's real-time adherence rate (e.g. 72.7%) computed from database dose records.
   - Check the upcoming doctor visit with Dr. Robert Hayes.
   - Review Eleanor's medication schedule for today.
   - Click **Adherence Analytics** to view interactive Recharts daily curves and volume distributions.

---

### Step 3: Clinical Caretaker Station (Marcus Chen, RN)
1. Sign out and log in as Marcus:
   - Click **🩺 Nurse (Marcus)** or enter `marcus@carecircle.demo` / `CareCircle2026!`.
2. On the **Caretaker Dashboard**:
   - See assigned patient Eleanor Vance.
   - Click **Record Vitals & Care**:
     - Enter Systolic `122`, Diastolic `78`, Pulse `72`.
     - Click **Save Record**.
   - Check the **Daily Care Timeline** (`/timeline`) to see the vitals entry chronologically embedded alongside medication administrations.

---

### Step 4: Missed-Dose Escalation Workflow
1. Navigate to **Notifications** (`/notifications`).
2. Click **Run Escalation Check Now** (simulates Cloud Scheduler triggering `/api/internal/jobs/process-reminders`).
3. Notice unconfirmed doses beyond the 30-minute grace period escalated to `MISSED`, with alerts generated and honest SMTP status recorded.

---

### Step 5: Accessibility Features
1. Click the **Text Size** or **Contrast** pills in the top navbar:
   - Observe large-font scaling and WCAG 2.1 AAA high-contrast black/yellow theme.
   - Visit `/accessibility` to test assistive landmarks.
