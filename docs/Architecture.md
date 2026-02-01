# Backend Architecture (FastAPI)

The system follows a microservices-based architecture optimized for modularity.

## Directory Structure

```plaintext
backend/
├── alembic/                    # Database migrations
├── app/
│   ├── api/v1/endpoints/       # Presentation Layer
│   │   ├── contracts.py        # Renewal tracking endpoints
│   │   ├── risks.py            # Churn prediction endpoints
│   │   ├── opportunities.py    # Upsell detection endpoints
│   │   ├── playbooks.py        # Recommendation engine endpoints
│   │   └── webhooks.py         # External event listeners (Stripe/Salesforce)
│   ├── core/                   # Configuration & Security
│   ├── db/                     # Database connection & init
│   ├── models/                 # SQLAlchemy Database Models
│   │   ├── account.py          # Account & Risk Data
│   │   ├── contract.py         # Subscription Terms
│   │   └── opportunity.py      # Upsell Leads
│   ├── services/               # Business Logic & Integration Layer
│   │   ├── integrations/       # Data ingestion (Salesforce/Stripe)
│   │   ├── ml/                 # Intelligence Engine (Churn/Upsell Models)
│   │   └── playbooks/          # Rules Engine & Template Generator
│   └── main.py                 # Application Entry Point
├── ml_models/                  # Serialized ML Models (.pkl)
└── requirements.txt            # Dependencies
```
