# Phase 1 Scoring Formulas — Canonical Reference



Deterministic formulas for Revenue Navigator scoring pipeline. **Sentiment only** uses LiteLLM; all other scores are fixed math driven by **`app_settings.config.scoring_formulas`** (see `scoring_config.example.json`). Swap to ML later via `SCORING_MODE=ml` without changing LangGraph topology.



## Pipeline Order (strict)



```

fetch_features → sentiment_enrich (LLM) → utilization → relationship → health → churn → risk → upsell → persist → lifecycle_reclassify

```



Downstream nodes use **in-memory state from the current run**, never stale DB scores. Config is loaded **once per scoring batch** via `load_scoring_config()`.



## Configuration



| Location | Purpose |

|----------|---------|

| `app_settings.config.scoring_formulas` | Tenant-specific formula parameters (JSONB) |

| `app_settings.config.lifecycle_buckets` | Bucket classification thresholds (linked to upsell gates) |

| `schemas/scoring_config.example.json` | Canonical defaults |



### Threshold resolution



```python

def effective(key_scoring, key_bucket, default):

    return scoring_cfg.get(key_scoring) or bucket_cfg.get(key_bucket) or default

```



When `threshold_links.sync_with_lifecycle_buckets` is true:



| Scoring param | Lifecycle bucket key | Default |

|---------------|----------------------|---------|

| `upsell.gate_min_health_score` | `expand_min_health_score` | 65 |

| `upsell.gate_min_utilization_percent` | `expand_min_utilization_percent` | 72 |

| `upsell.gate_max_risk_score` | `expand_max_risk_score` | 45 |

| `risk.at_risk_score_floor` | `protect_min_risk_score` | 70 |



## Raw Inputs



| Field | Source |

|-------|--------|

| `licenses_used`, `licenses_total` | `accounts` or latest `usage_metrics` |

| `utilization_percentage` | `accounts` (normalize 0–1 or 0–100) |

| `last_contact_date` | `accounts` → `days_since_last_contact` |

| `renewal_date`, `contract_end_date` | → `days_until_renewal` |

| `status` | `accounts.status` |

| `arr` | `accounts.arr` |

| Communication text | Mongo `email_raw_bodies` + `voice_transcripts` (last 7 days) |



## Helper Functions



```python

def clamp(x, lo, hi):

    return max(lo, min(hi, x))



def days_since_last_contact(last_contact_date, today) -> int:

    if not last_contact_date:

        return 30

    return max(0, min(365, (today - last_contact_date).days))



def recency_points(dsbc: int, cfg: ScoringConfig) -> float:

    for tier in cfg.relationship.recency_tiers:

        if dsbc <= tier.max_days:

            return tier.points

    return cfg.relationship.recency_tiers[-1].points



def sentiment_points(sentiment_score: float, category: str, cfg: ScoringConfig) -> float:

    pts = ((sentiment_score + 1) / 2) * 100

    if category in cfg.relationship.negative_sentiment_categories:

        pts *= cfg.relationship.negative_sentiment_multiplier

    return pts



def resolve_upsell_gates(scoring_cfg, bucket_cfg) -> dict:

    if scoring_cfg.threshold_links.sync_with_lifecycle_buckets:

        return {

            "min_health": bucket_cfg.expand_min_health_score,

            "min_util": bucket_cfg.expand_min_utilization_percent,

            "max_risk": bucket_cfg.expand_max_risk_score,

        }

    return {

        "min_health": scoring_cfg.upsell.gate_min_health_score,

        "min_util": scoring_cfg.upsell.gate_min_utilization_percent,

        "max_risk": scoring_cfg.upsell.gate_max_risk_score,

    }

```



## 1. Utilization (`util_pct`, 0–100)



Not config-driven (pure feature math).



```python

def compute_utilization(features: dict) -> float:

    lic_total = int(features.get("licenses_total") or 0)

    lic_used = int(features.get("licenses_used") or 0)

    util_raw = features.get("utilization_percentage")



    if lic_total > 0:

        util_ratio = clamp(lic_used / lic_total, 0.0, 1.0)

    elif util_raw is not None:

        u = float(util_raw)

        util_ratio = u if 0 <= u <= 1 else clamp(u / 100.0, 0.0, 1.0)

    else:

        util_ratio = 0.5



    return util_ratio * 100.0

```



## 2. Sentiment (LLM only)



```python

def sentiment_enrich(account_id: str) -> dict:

    text = fetch_recent_comms(account_id, days=7)

    if len(text.strip()) < 5:

        return {"sentiment_score": 0.0, "sentiment_category": "neutral", "keywords": []}

    try:

        result = litellm_sentiment(text)

        return {

            "sentiment_score": float(result["sentiment_score"]),

            "sentiment_category": result["label"],

            "keywords": result.get("keywords", []),

        }

    except Exception:

        return {"sentiment_score": 0.0, "sentiment_category": "neutral", "keywords": []}

```



## 3. Relationship Score (0–100)



Uses `cfg.relationship` recency tiers and weights.



```python

def compute_relationship_score(features: dict, sentiment: dict, cfg: ScoringConfig) -> int:

    dsbc = days_since_last_contact(features.get("last_contact_date"))

    recency_pts = recency_points(dsbc, cfg)

    sent_pts = sentiment_points(

        sentiment["sentiment_score"],

        sentiment["sentiment_category"],

        cfg,

    )

    score = (

        cfg.relationship.recency_weight * recency_pts

        + cfg.relationship.sentiment_weight * sent_pts

    )

    return int(round(clamp(score, 0, 100)))

```



## 4. Health Score (0–100)



Uses `cfg.health` weights and shared `recency_points()`.



```python

def compute_health_score(

    features: dict, util_pct: float, sentiment: dict,

    relationship_score: int, cfg: ScoringConfig,

) -> int:

    dsbc = days_since_last_contact(features.get("last_contact_date"))

    recency_pts = recency_points(dsbc, cfg)

    sent_pts = sentiment_points(

        sentiment["sentiment_score"],

        sentiment["sentiment_category"],

        cfg,

    )

    score = (

        cfg.health.util_weight * util_pct

        + cfg.health.sentiment_weight * sent_pts

        + cfg.health.recency_weight * recency_pts

    )

    blend = cfg.health.relationship_blend

    if blend > 0:

        score = (1 - blend) * score + blend * relationship_score

    return int(round(clamp(score, 0, 100)))

```



## 5. Churn Probability (0.0–1.0)



Uses `cfg.churn` urgency and at-risk floor.



```python

def compute_churn_probability(features: dict, health_score: int, cfg: ScoringConfig) -> float:

    p = 1.0 - (health_score / 100.0)

    days_until = int(features.get("days_until_renewal") or 90)

    status = (features.get("status") or "").lower()



    if days_until < cfg.churn.urgency_renewal_days_lt and health_score < cfg.churn.urgency_health_below:

        p += cfg.churn.urgency_penalty

    if status == "at_risk":

        p = max(p, cfg.churn.at_risk_status_floor)

    return clamp(p, 0.0, 1.0)

```



## 6. Risk Score (0–100)



Uses `cfg.risk`; floor linked to `protect_min_risk_score` when syncing.



```python

def compute_risk_score(features: dict, churn_probability: float, cfg: ScoringConfig, bucket_cfg) -> int:

    risk = int(round(churn_probability * 100))

    status = (features.get("status") or "").lower()

    floor = cfg.risk.at_risk_score_floor

    if cfg.threshold_links.sync_with_lifecycle_buckets:

        floor = max(floor, bucket_cfg.protect_min_risk_score)

    if status == "at_risk":

        risk = max(risk, floor)

    return clamp(risk, 0, 100)

```



### Risk Bands (from `cfg.risk.bands`)



| Band | `risk_score` |

|------|----------------|

| Low | 0 – `low_max` |

| Medium | `low_max + 1` – `medium_max` |

| High / Critical | `medium_max + 1` – 100 |



## 7. Upsell Score (0–100, heuristic)



Gates resolved via `resolve_upsell_gates()` (linked to Expand bucket thresholds).



```python

import math



def compute_upsell_score(

    features: dict, health_score: int, util_pct: float, risk_score: int,

    cfg: ScoringConfig, bucket_cfg,

) -> int:

    gates = resolve_upsell_gates(cfg, bucket_cfg)

    if not (

        health_score >= gates["min_health"]

        and util_pct >= gates["min_util"]

        and risk_score < gates["max_risk"]

    ):

        return 0

    arr = float(features.get("arr") or 0)

    w = cfg.upsell.blend_weights

    arr_factor = math.log10(arr + 1) * 10

    score = w.health * health_score + w.utilization * util_pct + w.arr_log * arr_factor

    return int(round(clamp(score, 0, 100)))

```



## Persistence



After each account run, write to:



- `accounts`: `health_score`, `relationship_score`, `risk_score`, `churn_probability`, `utilization_percentage`, `sentiment_score`, `sentiment_category`

- `ml_score_history`: append row with `scoring_mode = 'formula'`

- `sentiment_snapshots`: if LLM ran

- `churn_predictions` / `upsell_opportunities`: when thresholds met



## ML Migration (Phase 2+)



Set `SCORING_MODE=ml` and replace individual `FormulaNode` implementations with `MLModelNode` behind `ScorePredictor` protocol. LangGraph state schema and API responses unchanged; config still applies to formula fallback nodes.

