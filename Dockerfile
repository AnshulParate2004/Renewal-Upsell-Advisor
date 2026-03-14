FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency specification first to leverage Docker layer caching
COPY Backend/requirements.txt ./Backend/requirements.txt

WORKDIR /app/Backend

# Install Python dependencies with pip
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the full backend source including ML models and assets
COPY Backend/ /app/Backend/

ENV PYTHONPATH=/app/Backend

EXPOSE 8000

# Frontend is deployed separately (e.g. Azure Static Web Apps).
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

