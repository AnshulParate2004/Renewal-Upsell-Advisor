# Renewal & Upsell Advisor - Backend

FastAPI backend for the Renewal & Upsell Advisor application.

## Project Structure

See `docs/structure.md` for detailed folder structure.

## Setup

### Prerequisites

- Python 3.11+
- [uv](https://github.com/astral-sh/uv) package manager

### Installation

```bash
# Install dependencies
uv sync

# Install with dev dependencies
uv sync --dev
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### Running the Server

```bash
# Development mode
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## ML Models

ML models should be placed in the `ml_models/` directory. You can either:

1. Copy models from `Research/models/` to `Backend/ml_models/`
2. Create symlinks to the Research folder

## Testing

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=app
```

## Docker

```bash
# Build image
docker build -t renewal-upsell-backend .

# Run container
docker run -p 8000:8000 renewal-upsell-backend
```
