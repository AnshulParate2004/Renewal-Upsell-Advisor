FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

# Copy dependency files
COPY Backend/pyproject.toml Backend/uv.lock ./Backend/

WORKDIR /app/Backend

# Install dependencies using uv into the system environment (no venv)
RUN uv sync --frozen --no-dev

# Copy the full backend source
COPY Backend/ /app/Backend/

ENV PYTHONPATH=/app/Backend

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
