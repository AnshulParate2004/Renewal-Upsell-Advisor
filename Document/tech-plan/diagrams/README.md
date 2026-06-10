# Diagram Source Specifications

Mermaid source blocks for maintainability. Regenerate PNGs via `IMAGE_PROMPTS.md` when diagrams change.

## Platform Architecture

```mermaid
flowchart TB
    subgraph presentation [Presentation Layer]
        ReactApp[React_Revenue_Navigator]
    end
    subgraph gateway [API Gateway Layer]
        FastAPI[FastAPI_Uvicorn]
        WSS[WebSocket_Voicebot]
        WH[Webhook_Ingress]
    end
    subgraph services [Domain Services]
        AccountSvc[Account_Service]
        ScoreSvc[Scoring_Service]
        LifeSvc[Lifecycle_NBA_Service]
        CampSvc[Campaign_Service]
        VoiceSvc[Voice_Service]
        EmailSvc[Email_Service]
        AnalyticSvc[Analytics_Service]
        IntegrSvc[Integration_Service]
    end
    subgraph ai [AI Orchestration Layer]
        LiteLLM[LiteLLM_Router]
        LC[LangChain_Tools]
        LGScore[LangGraph_Scoring_Pipeline]
        LGVoice[LangGraph_Voice_Agent]
        LGEmail[LangGraph_Email_Intent]
        LGNBA[LangGraph_NBA_Agent]
    end
    subgraph async [Async Execution Layer]
        RedisQ[Redis_Queues]
        CeleryW[Celery_Workers]
        Beat[Celery_Beat_Cron]
        APScheduler[APScheduler_In_API]
    end
    subgraph data [Data Layer]
        PG[(PostgreSQL)]
        Mongo[(MongoDB)]
        RedisC[(Redis_Cache)]
    end
    subgraph external [External Systems]
        Twilio[Twilio]
        CRM[Salesforce]
        Billing[Stripe]
        Mail[Email_Provider]
    end
    ReactApp --> FastAPI
    ReactApp --> WSS
    Twilio --> WH
    CRM --> WH
    Billing --> WH
    Mail --> WH
    FastAPI --> services
    WSS --> VoiceSvc
    WH --> IntegrSvc
    services --> PG
    services --> Mongo
    services --> RedisC
    services --> ai
    ai --> LiteLLM
    LiteLLM --> LC
    Beat --> RedisQ
    FastAPI --> RedisQ
    RedisQ --> CeleryW
    CeleryW --> services
    CeleryW --> ai
```

## Scoring Formula Pipeline (Phase 1)

```mermaid
flowchart TD
    trigger[trigger] --> fetch[fetch_account_batch]
    fetch --> sentiment[sentiment_enrich_LLM]
    sentiment --> util[compute_utilization]
    util --> rel[compute_relationship]
    rel --> health[compute_health]
    health --> churn[compute_churn]
    churn --> risk[compute_risk_score]
    risk --> upsell[compute_upsell]
    upsell --> persist[persist_pg_and_history]
    persist --> classify[lifecycle_reclassify]
    classify --> next{more_accounts?}
    next -->|yes| fetch
    next -->|no| done[done]
```

Legend: `sentiment_enrich_LLM` = LiteLLM only; all other nodes = fixed formulas (Phase 1).

## LangGraph Scoring Pipeline (legacy summary)

```mermaid
flowchart LR
    Start([Cron_or_API_Trigger]) --> FetchAccounts[Fetch_Accounts_PG]
    FetchAccounts --> ForEach{For_Each_Account}
    ForEach --> RelNode[Relationship_Score]
    RelNode --> HealthNode[Health_Score]
    HealthNode --> ChurnNode[Churn_Probability]
    ChurnNode --> UpsellNode[Upsell_Detect]
    UpsellNode --> Persist[Write_PG_History]
    Persist --> ForEach
    ForEach --> Done([Complete])
```

## Async Runtime

```mermaid
flowchart TB
    subgraph apiProcess [Process_API_Uvicorn]
        MainThread[MainThread_EventLoop]
        Worker1[Uvicorn_Worker_1]
        Worker2[Uvicorn_Worker_N]
        APSched[APScheduler_Thread]
    end
    subgraph celeryPool [Process_Celery_Workers]
        CW1[Celery_Worker_scoring_prefork]
        CW2[Celery_Worker_campaigns_prefork]
        CW3[Celery_Worker_email_prefork]
        CW4[Celery_Worker_voice_gevent]
    end
    subgraph beatProcess [Process_Celery_Beat]
        BeatSched[Cron_Scheduler]
    end
    Redis[(Redis)]
    PG[(PostgreSQL)]
    Mongo[(MongoDB)]
    MainThread --> Worker1
    MainThread --> Worker2
    APSched -->|"enqueue lightweight polls"| Redis
    BeatSched -->|"publish cron tasks"| Redis
    Redis --> CW1
    Redis --> CW2
    Redis --> CW3
    Redis --> CW4
    Worker1 -->|"async HTTP handlers"| PG
    CW1 --> PG
    CW1 --> Mongo
    CW4 -->|"Twilio webhooks via tasks"| Mongo
```

## Dual-Axis Classification Model

```mermaid
flowchart TB
    subgraph input [Account Signals]
        Scores[health_risk_churn_scores]
        Dates[renewal_dates]
        Usage[utilization_sentiment]
        Config[User_FitRatio_Config]
    end
    subgraph axis1 [Axis1_LifecycleBucket]
        Classify[classify_stage_priority_cascade]
        Bucket[Single_Bucket_Assignment]
    end
    subgraph axis2 [Axis2_QuarterPipeline]
        Quarter[resolve_quarter_q1_q4]
        Template[load_workflow_template_from_DB]
        Steps[execute_due_workflow_steps]
    end
    subgraph output [Outputs]
        GridUI[Pipeline_Grid_Qx_Bucket]
        FilterUI[Bucket_Filter_Bar]
        Actions[Resend_Email_Twilio_Voice]
    end
    Scores --> Classify
    Dates --> Classify
    Usage --> Classify
    Config --> Classify
    Classify --> Bucket
    Dates --> Quarter
    Quarter --> Template
    Template --> Steps
    Bucket --> GridUI
    Quarter --> GridUI
    Bucket --> FilterUI
    Steps --> Actions
```

## Lifecycle Bucket Priority Cascade

```mermaid
flowchart TD
    Start([Account]) --> P1{P1_Protect?}
    P1 -->|yes| Protect[protect]
    P1 -->|no| P2{P2_Renew_window?}
    P2 -->|yes| Renew[renew]
    P2 -->|no| P3{P3_Activate?}
    P3 -->|yes| Activate[activate]
    P3 -->|no| P4{P4_Expand?}
    P4 -->|yes| Expand[expand]
    P4 -->|no| Adopt[adopt_default]
```

## Dynamic Workflow Executor

```mermaid
flowchart LR
    Cron[Celery_workflow_evaluator] --> LoadDue[Load_due_states]
    LoadDue --> ResolveStep[Resolve_workflow_step]
    ResolveStep --> Router{action_type}
    Router -->|email| Resend[Resend_API]
    Router -->|call| Twilio[Twilio_Outbound]
    Router -->|whatsapp| TwilioWA[Twilio_WhatsApp]
    Router -->|task| Manual[CSM_task_log]
    Resend --> Log[workflow_executions]
    Twilio --> Log
    TwilioWA --> Log
    Manual --> Log
    Log --> Advance[Advance_state]
```

## PNG Target Files

| Mermaid / Concept | PNG File |
|-------------------|----------|
| Scoring Formula Pipeline | `images/rnu-scoring-formula-pipeline.png` |
| Platform Architecture | `images/rnu-tech-platform-architecture.png` |
| Data Flow | `images/rnu-tech-data-flow.png` |
| PostgreSQL ERD | `images/rnu-postgres-erd.png` |
| Mongo Collections | `images/rnu-mongo-collections.png` |
| Redis Topology | `images/rnu-redis-topology.png` |
| Async Runtime | `images/rnu-async-runtime.png` |
| Cron Scheduler | `images/rnu-cron-scheduler.png` |
| LangGraph Scoring | `images/rnu-langgraph-scoring.png` |
| LangGraph Voice | `images/rnu-langgraph-voice.png` |
| LangGraph Email | `images/rnu-langgraph-email-intent.png` |
| LangGraph NBA | `images/rnu-langgraph-nba.png` |
| Campaign Flow | `images/rnu-flow-campaign-tech.png` |
| Webhook Ingest | `images/rnu-flow-webhook-ingest.png` |
| Deployment | `images/rnu-deployment-topology.png` |
| Bucket Classification Cascade | `images/rnu-lifecycle-bucket-classification.png` |
| Bucket Filter Bar | `images/rnu-lifecycle-bucket-filter-bar.png` |
| Quarterly Pipeline Matrix | `images/rnu-quarterly-pipeline-matrix.png` |
| Dynamic Workflow Engine | `images/rnu-dynamic-workflow-engine.png` |
| Workflow Step Timeline | `images/rnu-workflow-step-timeline.png` |
| LangGraph Workflow Executor | `images/rnu-langgraph-workflow-executor.png` |
