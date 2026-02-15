# Renewal & Upsell Advisor Backend

FastAPI backend for the Renewal & Upsell Advisor application.

## Setup

### Prerequisites

- Python 3.11+
- `uv` package manager

### Installation

1. Install dependencies:
```bash
cd Backend
uv sync
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
   - Database URL (defaults to SQLite: `sqlite:///./app.db`)
   - Azure credentials (if using Azure services)
   - Other API keys as needed

### Database Setup

1. The database tables are automatically created on startup.

2. Seed the database with sample data:
```bash
uv run python scripts/seed_db.py
```

This will create:
- 6 sample accounts
- 4 sample opportunities

**Note:** The seed script will skip if data already exists. To reset, delete the database file (`app.db` for SQLite) and run the seed script again.

## Running the Server

### Development Mode

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or using Python directly:
```bash
uv run python -m app.main
```

### Production Mode

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Accounts
- `GET /api/v1/accounts` - List all accounts
- `GET /api/v1/accounts/{id}` - Get account by ID
- `POST /api/v1/accounts` - Create new account
- `PUT /api/v1/accounts/{id}` - Update account
- `DELETE /api/v1/accounts/{id}` - Delete account

### Analytics
- `GET /api/v1/analytics/dashboard` - Get dashboard statistics

### Opportunities
- `GET /api/v1/opportunities` - List all opportunities
- `GET /api/v1/opportunities/{id}` - Get opportunity by ID
- `POST /api/v1/opportunities` - Create new opportunity

### Predictions
- `POST /api/v1/predictions/predict` - Get prediction for a single model
- `POST /api/v1/predictions/predict-all` - Get predictions from all models

## Health Check

```bash
curl http://localhost:8000/health
```

## Troubleshooting

### No Data Showing in Frontend

1. **Check if backend is running:**
   ```bash
   curl http://localhost:8000/api/v1/accounts
   ```

2. **Seed the database:**
   ```bash
   uv run python scripts/seed_db.py
   ```

3. **Check CORS configuration:**
   - Ensure `CORS_ORIGINS` in `.env` includes your frontend URL (default: `http://localhost:8080`)

4. **Check browser console:**
   - Look for CORS errors or network errors
   - Verify API base URL is correct in frontend

5. **Check backend logs:**
   - Look for errors in the terminal where the backend is running

### Database Issues

- If using SQLite, the database file is created at `Backend/app.db`
- To reset: delete `app.db` and restart the server (tables will be recreated)

### Model Loading Issues

- Ensure ML model files are in `Backend/ml_models/` directory
- Check model paths in `app/core/config.py`
- Models are loaded lazily (on first use) to prevent startup errors

## Development

### Project Structure

```
Backend/
├── app/
│   ├── api/          # API endpoints
│   ├── core/         # Configuration, logging, security
│   ├── db/           # Database session and base
│   ├── models/       # SQLAlchemy ORM models
│   ├── schemas/      # Pydantic schemas
│   ├── services/     # Business logic
│   │   ├── ml/       # ML model services
│   │   └── intelligence/  # Unified prediction service
│   ├── middleware/   # Custom middleware
│   └── utils/        # Utility functions
├── ml_models/        # ML model files (.pkl, .joblib, .safetensors)
├── scripts/          # Utility scripts (seed_db.py, etc.)
├── tests/            # Test files
├── pyproject.toml    # Project configuration
└── README.md
```

### Adding New Endpoints

1. Create endpoint file in `app/api/v1/endpoints/`
2. Add router to `app/api/v1/api.py`
3. Add schema in `app/schemas/` if needed

### Adding New Models

1. Create model in `app/models/`
2. Create schema in `app/schemas/`
3. Update database: tables are auto-created on startup

## Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `DATABASE_URL` - Database connection string
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated)
- `DEBUG` - Enable debug mode
- `ML_MODELS_PATH` - Path to ML models directory
- Azure credentials (if using Azure services)
