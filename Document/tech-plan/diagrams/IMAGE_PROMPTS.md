# AI Image Generation Prompts — Technical Architecture Plan

Revenue Navigator branding only. Style for all images:
- Clean enterprise technical diagram, white background
- Primary color navy `#0c3472`, accent light blue `#c8d7eb`
- Sans-serif labels, readable at A4 print size
- No watermarks, no client-specific names

Regenerate any image, copy to `images/`, then run `.\build.ps1`.

---

## Platform & Data Architecture

### rnu-tech-platform-architecture.png
Six-layer technology platform stack diagram for Revenue Navigator backend. Top to bottom layers labeled: (1) Presentation Layer — React Revenue Navigator; (2) API Gateway — FastAPI Uvicorn, WebSocket Voicebot, Webhook Ingress; (3) Domain Services — Account, Scoring, Lifecycle NBA, Campaign, Voice, Email, Analytics, Integration; (4) AI Orchestration — LiteLLM Router, LangChain Tools, LangGraph graphs for Scoring, Voice, Email Intent, NBA; (5) Async Execution — Redis Queues, Celery Workers, Celery Beat, APScheduler; (6) Data Layer — PostgreSQL, MongoDB, Redis Cache. External systems on right: Twilio, Salesforce, Stripe, Email Provider. Arrows showing data flow between layers. Navy headers, light blue boxes, white background.

### rnu-tech-data-flow.png
Horizontal end-to-end technical data flow with eight stages: Input Sources (CRM, usage, tickets, email, voice, contracts, payments, webhooks) → Data Unification (normalize, match accounts, validate) → AI Decision Engine (LangGraph scoring, sentiment, NBA) → Management Review (auto vs CSM escalation gate) → Outreach Execution (email, voice, WhatsApp, SMS) → Enterprise Integrations → Analytics & Governance → Feedback Loop back to scoring. Engineering annotations on arrows: PostgreSQL writes, Mongo archives, Redis cache. Navy and light blue color scheme.

### rnu-postgres-erd.png
Enterprise database ERD for Revenue Navigator PostgreSQL schema. Show tables with crow's foot notation: tenants, users, roles, accounts (center), contacts, contracts, usage_metrics, support_tickets, account_comments, ml_score_history, churn_predictions, upsell_opportunities, sentiment_snapshots, lifecycle_stage_snapshots, renewal_quotes, workflow_templates, workflow_steps, account_workflow_states, auto_campaigns, campaign_enrollments, email_campaigns, voice_calls, whatsapp_messages, activity_logs, app_settings, integration_credentials, webhook_events, transactions. Primary keys highlighted, foreign key lines labeled. Navy table headers, light blue table bodies, white background.

### rnu-mongo-collections.png
MongoDB collections architecture diagram. Six document collections as cylinders or document icons: email_raw_bodies (TTL 365d), voice_transcripts (permanent), llm_traces (TTL 90d), langgraph_checkpoints (TTL 30d), webhook_payloads (TTL 180d), voicebot_sessions (TTL 7d). Arrows from PostgreSQL tables (accounts, voice_calls, email_campaigns) showing mongo_ref_id pointer pattern. Fields listed inside each collection box. Navy and light blue styling.

### rnu-redis-topology.png
Redis multi-database topology diagram. Six logical Redis databases: db0 Cache (lifecycle:dashboard, account:scores keys with TTL), db1 Celery Broker, db2 Celery Results, db3 Rate Limits, db4 Distributed Locks (lock:campaign, lock:ml_pipeline), db5 Pub/Sub. Celery queue names branching from db1: scoring, campaigns, email, voice, integrations, analytics. Navy headers, light blue key pattern boxes.

---

## Async Runtime & Scheduling

### rnu-async-runtime.png
Detailed async process and thread diagram. Three process groups: (1) API Process Uvicorn — Main Thread Event Loop, Worker 1..N, APScheduler Thread enqueueing to Redis; (2) Celery Beat Process — Cron Scheduler publishing to Redis; (3) Celery Worker Pool — scoring prefork, campaigns prefork, email prefork, voice gevent workers. Arrows to Redis, PostgreSQL, MongoDB. Labels on arrows: async HTTP handlers, Twilio webhooks via tasks, batch scoring. Technical systems diagram style, navy and light blue.

### rnu-cron-scheduler.png
Cron job scheduler catalog diagram. Celery Beat at top publishing to Redis queues. Nine jobs in a table or grid: scoring_daily (0 0 UTC), scoring_incremental (every 6h), campaign_evaluator (every 5 min), email_inbound_poll (every 2 min), voice_retry_sweep (every 4h), analytics_rollup (01:30 UTC), integration_sf_sync (02:00 UTC), mongo_ttl_cleanup (weekly), redis_cache_warm (06:00 UTC). Each job shows target queue name and Redis lock icon. Navy and light blue enterprise diagram.

---

## LangGraph Agent Graphs

### rnu-langgraph-scoring.png
LangGraph state machine flowchart for scoring pipeline. Nodes left to right: Cron or API Trigger → Fetch Accounts from PostgreSQL → For Each Account (diamond) → Relationship Score → Health Score → Churn Probability → Upsell Detect → Write PG History → loop back → Complete. Optional branch: Sentiment Enrich via LiteLLM. Rounded nodes, directed arrows, navy nodes with light blue highlights.

### rnu-langgraph-voice.png
LangGraph voice agent state machine. Linear flow with branches: init → greet → listen → classify_intent → respond → escalate_or_close (branch: human CSM escalation) → summarize → persist. Side annotations: thread_id = call_sid, Mongo transcript chunks, PostgreSQL call outcome. Twilio icon on listen node. Navy and light blue technical flowchart.

### rnu-langgraph-email-intent.png
LangGraph email intent processing graph. Flow: receive → parse → sentiment (LiteLLM) → intent_classify → branch_actions diamond with five exits: renewed, churned, objection, needs_followup, completed. Each branch arrow labeled Celery sub-task (update account, schedule follow-up, log activity). Navy and light blue.

### rnu-langgraph-nba.png
LangGraph Next Best Action agent graph. States: load_account → classify_stage (Protect/Renew/Adopt/Expand/Activate) → check_history → select_channel (call/email/WhatsApp) → generate_action → human_review_gate (diamond, required for Protect) → enqueue_outreach → Redis Celery queue. Navy and light blue enterprise diagram.

---

## Scoring Formula Pipeline

### rnu-scoring-formula-pipeline.png
Wide horizontal scoring pipeline diagram left to right with LARGE readable text (minimum 14pt equivalent). Ten nodes: Fetch Features, Sentiment Enrich (LLM - blue highlight), Compute Utilization (green formula), Compute Relationship (green), Compute Health (green), Compute Churn (green), Compute Risk Score (green), Compute Upsell (green), Persist PostgreSQL (accounts + ml_score_history), Lifecycle Reclassify. Final node lists lifecycle buckets: Protect P1, Renew P2, Activate P3, Expand P4, Adopt P5 (NOT Champion/Loyal/Churned). Legend: blue = LLM node only, green = deterministic formula. Navy #0c3472 headers, light blue accents, white background. Landscape aspect ratio 16:9.

---

## Lifecycle Buckets & Quarterly Pipelines

### rnu-lifecycle-bucket-classification.png
Tall vertical fit-ratio priority cascade flowchart with LARGE readable text. Start: Account Signals box (risk_score, health_score, utilization, days_to_renewal, days_since_start, status). Full cascade visible on one canvas: P1 Protect → P2 Renew → P3 Activate → P4 Expand → P5 Adopt (default fallback). Each diamond shows configurable threshold from lifecycle_buckets config. Show ALL five bucket outcome boxes with no clipping at bottom. No page numbers or footers embedded in image. Navy #0c3472 nodes, light blue #c8d7eb, white background. Portrait aspect ratio 3:4.

### rnu-lifecycle-bucket-filter-bar.png
Horizontal filter bar UI diagram for Customer Lifecycle page. Six cards in a row: ALL (214 accounts), PROTECT P1 red (52), RENEW P2 blue (36), ADOPT P3 orange (42), EXPAND P4 green (59), ACTIVATE P5 grey (25). Each card shows stage label pill at bottom. Clean enterprise dashboard style, navy headers, colored accent per stage, white background.

### rnu-quarterly-pipeline-matrix.png
Quarterly pipeline matrix grid diagram. Four columns Q1 Q2 Q3 Q4 with headers showing days to renewal band, total accounts, total ARR. Each column has five horizontal bucket rows: PROTECT red, RENEW blue, ADOPT yellow, EXPAND green, ACTIVATE grey. Each cell shows account count, dollar amount, percent of quarter ARR. Example: Q4 column heavily weighted to RENEW. Matches B2B customer lifecycle dashboard layout. Navy and light blue styling.

### rnu-dynamic-workflow-engine.png
Dynamic workflow execution engine diagram. Flow: Celery Beat workflow_step_evaluator → load account_workflow_states where next_due_at due → resolve workflow_step from PostgreSQL → check IST send window → action_type router diamond → email to Resend API, call to Twilio, whatsapp to Twilio WhatsApp, task to activity_logs → write workflow_executions → advance account_workflow_state → schedule next step via follow_up_offset_days. Navy and light blue enterprise technical flow.

### rnu-workflow-step-timeline.png
Vertical workflow step timeline diagram matching AB_Q1 Process Flow modal. Title: Automated Workflow. Three steps connected by vertical line: Step 1 Email Welcome (Week 1, Weekly, 09:00-17:00, Follow-up 3d, purpose text box), Step 2 Email Creative Toolkit (Week 3), Step 3 Email Stay Organised (Week 5). Gear icons, email icons. Save flow button at bottom. Navy and light blue UI wireframe style.

### rnu-langgraph-workflow-executor.png
LangGraph workflow executor state machine. States: load_state → check_send_window (diamond, IST window) → generate_content (LiteLLM using topic field) → dispatch_channel (diamond: email/call/whatsapp/task) → wait_response → advance_or_retry → persist to PostgreSQL and Mongo. Side note: thread_id = account_id + template_id. Navy nodes, light blue highlights, white background.

---

## Module Technical Flows

### rnu-flow-campaign-tech.png
Technical campaign execution flow. Steps: Celery Beat campaign_evaluator → load auto_campaigns PostgreSQL → filter accounts by filter_config → Redis distributed lock per campaign → channel router (email_sequence / voice_bot / whatsapp / sms) → Celery task per account → Twilio or Email provider → write activity_logs PostgreSQL → update last_run_at. IST send window check box. Engineering annotations on each step. Navy and light blue.

### rnu-flow-webhook-ingest.png
Webhook ingestion technical flow. External sources (Twilio, Stripe, Salesforce, Email) → API Gateway signature verify → Mongo webhook_payloads archive → enqueue Celery integration or voice queue → domain handler → PostgreSQL metadata in webhook_events → activity timeline update. Fast 200 response path separate from async processing. Navy and light blue.

---

## Deployment

### rnu-deployment-topology.png
Production deployment topology diagram. Top: CDN Static Host → React Frontend. Below: API Load Balancer splitting to FastAPI instances (x N) and WebSocket nodes. Center: Redis Cluster. Bottom row: PostgreSQL primary/replica, MongoDB replica set, Celery Workers (x M), single Celery Beat. Side box: Observability (Prometheus, OpenTelemetry, structured logs). Cloud-neutral boxes, navy and light blue, white background.
