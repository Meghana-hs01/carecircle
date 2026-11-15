# CareCircle — Production Deployment Guide

CareCircle supports containerized deployments across **Google Cloud Run** (hackathon target), **Render** (free 1-click blueprint), **Vercel**, and **Docker Compose**.

---

## 1. Google Cloud Run (Recommended / Official Hackathon Target)

CareCircle includes complete Cloud Run Dockerfiles and Cloud Build orchestration in `cloudbuild.yaml`.

### Step A: Prerequisites
Ensure Google Cloud SDK (`gcloud`) is installed and authenticated:
```bash
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID
```

### Step B: Build & Deploy Backend to Cloud Run
From project root:
```bash
# 1. Build & Push Backend Container Image
gcloud builds submit --tag gcr.io/YOUR_GCP_PROJECT_ID/carecircle-backend ./backend

# 2. Deploy Backend Service to Cloud Run
gcloud run deploy carecircle-backend \
  --image gcr.io/YOUR_GCP_PROJECT_ID/carecircle-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8000 \
  --set-env-vars ENVIRONMENT=production,SECRET_KEY=YOUR_SECURE_JWT_SECRET_256BIT
```
*Take note of the Backend URL outputted (e.g., `https://carecircle-backend-xyz.a.run.app`).*

### Step C: Build & Deploy Frontend to Cloud Run
```bash
# 1. Build & Push Frontend Container Image
gcloud builds submit \
  --tag gcr.io/YOUR_GCP_PROJECT_ID/carecircle-frontend \
  --build-arg VITE_API_URL=https://carecircle-backend-xyz.a.run.app \
  ./frontend

# 2. Deploy Frontend Service to Cloud Run
gcloud run deploy carecircle-frontend \
  --image gcr.io/YOUR_GCP_PROJECT_ID/carecircle-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 80
```

### Step D: Automated Missed-Dose Escalation with Cloud Scheduler
CareCircle includes an idempotent cron endpoint designed for Google Cloud Scheduler:
```bash
gcloud scheduler jobs create http carecircle-missed-dose-escalation \
  --schedule="*/15 * * * *" \
  --uri="https://carecircle-backend-xyz.a.run.app/api/internal/jobs/process-reminders" \
  --http-method=POST \
  --headers="X-Cron-Secret=YOUR_CRON_SECRET" \
  --time-zone="UTC"
```

---

## 2. Render Blueprint (Free 1-Click Cloud Deployment)

CareCircle includes a `render.yaml` blueprint that spins up:
1. **Managed PostgreSQL Database**
2. **FastAPI Backend Web Service** (with automatic health check `/health`)
3. **React 18 + Vite Frontend** (with SPA rewrites)

### How to Deploy on Render:
1. Log in to [Render.com](https://render.com).
2. Go to **Blueprints** → Click **New Blueprint Instance**.
3. Connect your GitHub repository: `https://github.com/Meghana-hs01/carecircle`.
4. Render will detect `render.yaml` and automatically configure the PostgreSQL database, backend service, and frontend static site.
5. Click **Apply**. Within 3 minutes, your live URLs will be active with SSL/HTTPS!

---

## 3. Docker Compose (Instant Multi-Container Deployment)

Runs PostgreSQL 15, FastAPI, and Nginx React frontend in isolated Docker containers:

```bash
# Build and run all services in the background
docker-compose up --build -d

# Verify running containers
docker-compose ps
```

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **Database:** PostgreSQL on `localhost:5432`

---

## 4. Vercel (Frontend) + Render / Railway (Backend)

For ultra-fast global CDN delivery of the frontend:
1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to `frontend`:
   ```bash
   cd frontend
   vercel --prod
   ```
3. Set the environment variable `VITE_API_URL` in the Vercel dashboard to your live backend URL.

---

## 5. Production Environment Variables Reference

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `ENVIRONMENT` | Target environment | `production` |
| `SECRET_KEY` | 256-bit cryptographic secret for JWT | `min-32-chars-random-string` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/carecircle` |
| `CORS_ORIGINS` | Permitted frontend origins | `https://your-frontend-domain.com` |
| `CRON_SECRET` | Secret key for cron trigger authentication | `secret-cron-token` |
| `SMTP_HOST` | *(Optional)* SMTP mail server | `smtp.gmail.com` |
| `SMTP_PORT` | *(Optional)* SMTP port | `587` |
| `SMTP_USER` | *(Optional)* SMTP email | `notifications@carecircle.health` |
| `SMTP_PASSWORD` | *(Optional)* SMTP app password | `app-specific-password` |
