# CareCircle Production Backend Dockerfile for Render & Cloud Deployments
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for cryptography, networking, and PostgreSQL client
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies from backend/requirements.txt
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend source code into /app
COPY backend/ /app/

# Render and Cloud Run inject dynamic $PORT (Render default is 10000, fallback to 8000)
ENV PORT=8000
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

EXPOSE 8000

# Start FastAPI uvicorn server binding to 0.0.0.0 and dynamic $PORT
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
