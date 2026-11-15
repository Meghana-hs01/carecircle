# ==========================================
# Stage 1: Build Frontend (Vite + React SPA)
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /build

COPY frontend/package*.json ./
RUN npm ci --prefer-offline --no-audit

COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Production FastAPI Application
# ==========================================
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for PostgreSQL, cryptography, and networking
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend source code into /app
COPY backend/ /app/

# Copy compiled frontend SPA into /frontend/dist so FastAPI serves it at /
COPY --from=frontend-builder /build/dist /frontend/dist

# Render & Cloud Run inject dynamic $PORT (default 10000 or 8000)
ENV PORT=8000
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

EXPOSE 8000

# Start FastAPI uvicorn server binding to 0.0.0.0 and dynamic $PORT
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
