# Backend Folder Structure for FastAPI

## Current Structure Analysis

### ✅ **Good Aspects:**
- Proper separation of concerns (api, core, db, models, schemas, services)
- API versioning structure (`api/v1/`)
- Organized services by domain (intelligence, integrations, workflows, voice_agent)
- Core utilities separated (config, logging, security)
- Database layer abstraction

### ❌ **Missing/Issues:**
- ML model loading and inference services not integrated
- Missing health score, relationship score, renewal score, upsell detection services
- No model management/versioning
- Missing tests directory
- Missing utilities/helpers
- No proper main.py setup
- Missing ML models directory structure
- No error handling middleware
- Missing API documentation setup

---

## Recommended FastAPI Structure

```
Backend/
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI app entry point
│   │
│   ├── api/                         # API routes
│   │   ├── __init__.py
│   │   ├── deps.py                  # Dependencies (auth, db session, etc.)
│   │   └── v1/                      # API version 1
│   │       ├── __init__.py
│   │       ├── api.py               # Main router that includes all endpoints
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── accounts.py     # Account CRUD & predictions
│   │           ├── predictions.py  # ML model predictions endpoint
│   │           ├── contracts.py    # Contract management
│   │           ├── opportunities.py # Upsell/renewal opportunities
│   │           ├── analytics.py    # Analytics & insights
│   │           └── webhooks.py     # External webhooks
│   │
│   ├── core/                        # Core configuration
│   │   ├── __init__.py
│   │   ├── config.py                # Pydantic settings
│   │   ├── security.py              # Authentication & authorization
│   │   ├── logging.py               # Logging configuration
│   │   └── exceptions.py            # Custom exception handlers
│   │
│   ├── db/                          # Database layer
│   │   ├── __init__.py
│   │   ├── base.py                  # SQLAlchemy Base
│   │   ├── session.py               # Database session management
│   │   └── migrations/              # Alembic migrations (if using)
│   │
│   ├── models/                      # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── account.py
│   │   ├── interaction.py
│   │   ├── opportunity.py
│   │   └── prediction.py            # Store prediction history
│   │
│   ├── schemas/                     # Pydantic schemas (request/response)
│   │   ├── __init__.py
│   │   ├── account.py
│   │   ├── prediction.py
│   │   ├── opportunity.py
│   │   └── common.py                 # Common schemas (pagination, etc.)
│   │
│   ├── services/                    # Business logic
│   │   ├── __init__.py
│   │   │
│   │   ├── ml/                      # ML Model Services
│   │   │   ├── __init__.py
│   │   │   ├── model_loader.py      # Load & cache ML models
│   │   │   ├── churn_predictor.py   # Churn prediction service
│   │   │   ├── health_score.py      # Health score prediction
│   │   │   ├── relationship_score.py # Relationship score prediction
│   │   │   ├── renewal_score.py     # Renewal score prediction
│   │   │   ├── sentiment_analyzer.py # Sentiment analysis
│   │   │   └── upsell_detector.py   # Upsell detection
│   │   │
│   │   ├── intelligence/            # Intelligence services (legacy/combined)
│   │   │   ├── __init__.py
│   │   │   └── predictor.py        # Unified prediction orchestrator
│   │   │
│   │   ├── integrations/            # Third-party integrations
│   │   │   ├── __init__.py
│   │   │   ├── salesforce.py
│   │   │   ├── stripe.py
│   │   │   └── supabase.py          # Supabase client
│   │   │
│   │   ├── workflows/               # Business workflows
│   │   │   ├── __init__.py
│   │   │   ├── renewal_manager.py
│   │   │   ├── quote_generator.py
│   │   │   └── opportunity_engine.py # Opportunity identification
│   │   │
│   │   └── voice_agent/             # Voice/communication services
│   │       ├── __init__.py
│   │       ├── twilio_client.py
│   │       └── retry_scheduler.py
│   │
│   ├── utils/                       # Utility functions
│   │   ├── __init__.py
│   │   ├── helpers.py               # General helpers
│   │   ├── validators.py            # Data validators
│   │   └── formatters.py           # Data formatters
│   │
│   └── middleware/                  # Custom middleware
│       ├── __init__.py
│       ├── error_handler.py         # Global error handling
│       └── request_logging.py        # Request logging
│
├── ml_models/                       # ML Model Storage (symlink or copy from Research/)
│   ├── churn/
│   │   └── churn_model_best_20260214_192352.pkl
│   ├── health_score/
│   │   └── health_score_model_best_20260214_224009.pkl
│   ├── relationship/
│   │   └── relationship_model_best_20260214_221417.pkl
│   ├── renewal/
│   │   └── renewal_model_best_20260214_214502.pkl
│   ├── sentiment/
│   │   └── sentiment_model_20260215_003343/
│   └── upsell/
│       └── upsell_model_best_20260214_200240.pkl
│
├── tests/                           # Test suite
│   ├── __init__.py
│   ├── conftest.py                  # Pytest fixtures
│   ├── test_api/
│   │   ├── __init__.py
│   │   ├── test_accounts.py
│   │   └── test_predictions.py
│   ├── test_services/
│   │   ├── __init__.py
│   │   ├── test_ml_services.py
│   │   └── test_workflows.py
│   └── test_utils/
│       └── __init__.py
│
├── scripts/                         # Utility scripts
│   ├── load_models.py               # Pre-load models script
│   └── seed_data.py                  # Seed database
│
├── .env.example                     # Environment variables template
├── .gitignore
├── docker-compose.yml                # Docker setup
├── Dockerfile                        # Docker image
├── pyproject.toml                    # Project dependencies & config (uv)
├── uv.lock                           # Locked dependencies (uv)
└── README.md                        # Backend documentation

```

---

## Key Improvements

### 1. **ML Model Integration**
- Dedicated `services/ml/` directory for all ML services
- `model_loader.py` to handle model loading, caching, and versioning
- Separate service for each model type
- Models stored in `ml_models/` (symlink to Research/models or copy)

### 2. **Better Organization**
- `utils/` for reusable helper functions
- `middleware/` for cross-cutting concerns
- `scripts/` for one-off utilities
- Proper `__init__.py` files for Python packages

### 3. **Testing Structure**
- Separate test directories mirroring app structure
- `conftest.py` for shared fixtures
- Tests organized by module

### 4. **API Endpoints**
- `predictions.py` - Unified endpoint for all ML predictions
- `opportunities.py` - Upsell/renewal opportunities
- `analytics.py` - Analytics and insights

### 5. **Model Management**
- Centralized model loading with caching
- Version management
- Error handling for model loading failures

---

## Implementation Priority

1. **Phase 1: Core Structure & Setup**
   - Initialize uv project: `uv init` or create `pyproject.toml`
   - Install dependencies: `uv sync --dev`
   - Set up `ml_models/` directory (symlink to Research/models)
   - Create `services/ml/model_loader.py`
   - Implement individual ML services

2. **Phase 2: API Integration**
   - Create `api/v1/endpoints/predictions.py`
   - Update `api/v1/api.py` to include new routes
   - Implement request/response schemas
   - Set up `app/main.py` with FastAPI app

3. **Phase 3: Testing & Documentation**
   - Set up test structure with `uv add --dev pytest`
   - Add API documentation
   - Create deployment scripts
   - Set up Docker with uv

---

## Notes

- Keep models in `Research/` folder and symlink or copy to `ml_models/` for deployment
- Use environment variables for model paths (via `core/config.py`)
- Implement model caching to avoid reloading on every request
- Add health check endpoint to verify model loading status
- Consider using a model registry for version management in production
