# Renewal & Upsell Advisor - Backend Services

This directory contains the microservices for the Renewal & Upsell Advisor system.

## Structure

### Data Ingestion & Integration
- `integration_service/`: Handles Salesforce, Stripe, Analytics webhooks/sync.

### Core Backend Services
- `api_gateway/`: Entry point for frontend and external calls.
- `notification_service/`: Handles Email/Slack alerts.
- `workflow_automation/`: Manages tasks and updates in Salesforce.
- `dashboard_api/`: Serves data to the frontend.

### Machine Learning Layer
- `ml_services/churn_prediction/`: Churn prediction models.
- `ml_services/upsell_propensity/`: Upsell opportunity scoring.
- `ml_services/sentiment_analysis/`: Customer sentiment analysis.

### Shared Resources
- `common/`: Shared schemas, utilities, and libraries.
- `docker/`: Docker compose and container configurations.
