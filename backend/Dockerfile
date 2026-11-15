# CareCircle Backend Dockerfile — Optimized for Google Cloud Run
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for cryptography / networking
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . .

# Google Cloud Run injects $PORT (default 8000)
ENV PORT=8000
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

EXPOSE 8000

# Run uvicorn bound to 0.0.0.0 and Cloud Run's dynamic $PORT
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
