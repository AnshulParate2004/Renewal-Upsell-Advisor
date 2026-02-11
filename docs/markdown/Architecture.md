# System Architecture

The S-007 Agent follows a microservices-based architecture designed for **autonomous execution**.

## Core Components

### 1. The 24-Hour Analysis Engine (Scheduler)
A central Cron/APScheduler job runs daily at 00:00 UTC to triggers the "Re-Analysis" pipeline.
*   **Input:** Fetches last 24h of Usage Logs, Support Tickets, and Emails.
*   **Process:** Runs 3 concurrent ML models (Churn XGBoost, Sentiment NLP, Upsell CF).
*   **Output:** Updates `Account.risk_score` and `Account.upsell_propensity` in PostgreSQL.

### 2. Yagna-Style Notification Workflow
The Scheduler checks Contract End Dates against T-90, T-60, and T-30 thresholds.
*   **T-90 Days:** Triggers "Early Renewal" workflow. Generates Quote PDF.
*   **T-60 Days:** Adoption utilization check.
*   **T-30 Days:** Triggers "Urgent Renewal". **Embeds Stripe Payment Link** directly in the email.

### 3. Closed-Loop Voice Agent
Handles high-priority outreach via Twilio/Amazon Connect.
*   **Action:** Initiates call.
*   **Decision Node (Outcome):**
    *   **Picked Up:** Records transcript, logs to MongoDB, marks interaction "Success".
    *   **Missed:** Logs "Missed" to MongoDB, **Schedules Retry Task** (+4 hours).

## Data Stores
*   **PostgreSQL:** Structured data (Accounts, Contracts, Opportunities).
*   **MongoDB:** Unstructured event logs (Voice Transcripts, Raw Email Bodies, Webhook Payloads).
*   **Redis:** Task queue for Voice Retries and Async Jobs.

## Backend Directory Structure (Scalable & Bug-Manageable)

This structure follows the **Domain-Driven Design (DDD)** principles for FastAPI applications to ensure maintainability and separation of concerns.

```plaintext
backend/
├── alembic/                    # Database Migrations
│   └── versions/               # Migration scripts
├── app/
│   ├── api/                    # API Layer (Routers)
│   │   ├── v1/
│   │   │   ├── endpoints/      # Version 1 Endpoints
│   │   │   │   ├── accounts.py
│   │   │   │   ├── contracts.py
│   │   │   │   └── webhooks.py
│   │   │   └── api.py          # Central Router Include
│   │   └── deps.py             # Dependency Injection (DB session, Auth)
│   ├── core/                   # Core Configuration
│   │   ├── config.py           # Environment variables (Pydantic Settings)
│   │   ├── security.py         # JWT & Auth Logic
│   │   └── logging.py          # Structured Logging Config
│   ├── db/                     # Database Foundation
│   │   ├── base.py             # SQLAlchemy Base
│   │   └── session.py          # Session Factory
│   ├── models/                 # SQLAlchemy ORM Models (Logic-Free)
│   │   ├── account.py
│   │   ├── interaction.py
│   │   └── opportunity.py
│   ├── schemas/                # Pydantic Models (Data Validation)
│   │   ├── account.py          # Request/Response Schemas
│   │   └── common.py
│   ├── services/               # Business Logic Layer (The "Brain")
│   │   ├── intelligence/       # 24h Loop Models
│   │   │   ├── churn_predictor.py
│   │   │   └── sentiment_analyzer.py
│   │   ├── voice_agent/        # Voice Logic
│   │   │   ├── twilio_client.py
│   │   │   └── retry_scheduler.py
│   │   ├── workflows/          # Yagna Triggers
│   │   │   ├── quote_generator.py
│   │   │   └── renewal_manager.py
│   │   └── integrations/       # External Adapters
│   │       ├── salesforce.py
│   │       └── stripe.py
│   └── main.py                 # App Entry Point
├── tests/                      # Testing Suite
│   ├── api/
│   └── services/
├── .env                        # Secrets
├── docker-compose.yml          # Container Orchestration
└── requirements.txt            # Python Dependencies
```

### Key Design Principles:
1.  **Separation of Concerns:**
    *   **API Layer:** Only handles request parsing and response formatting.
    *   **Service Layer:** Contains ALL business logic (e.g., "Calculate Risk", "Send Quote"). This makes logic reusable and testable without HTTP context.
    *   **Models/Schemas:** Separates Database ORM objects from API Data Transfer Objects (DTOs).

2.  **Scalability:**
    *   The `v1/` folder allows future API versions (`v2/`) without breaking existing clients.
    *   `services/` are modular; switching from Twilio to Amazon Connect only changes `voice_agent/` files.

3.  **Bug Manageability:**
    *   **Centralized Config:** All settings in `core/config.py` prevents hardcoded values.
    *   **Typed Schemas:** Pydantic ensures data integrity strictly at the entry gate.
