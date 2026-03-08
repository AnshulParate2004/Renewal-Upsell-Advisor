"""
ML Pipeline: runs models in strict dependency order (graph priority).
Downstream models always use predictions from upstream—never DB-stored values.

Order (priority):
  1. Relationship (M_Rel) — uses only raw + engineered: F_Days_Contact, sentiment, utilization, licenses
  2. Health (M_Health)   — uses F_Utilization + output of (1) relationship_score
  3. Churn (C_Churn)     — uses output of (2) health_score + F_Days_Renewal + industry
  4. Upsell (C_Upsell)   — uses output of (2) health_score + F_Utilization + arr, mrr, company_size
"""
from datetime import datetime, timezone, date
from typing import Any, Dict, Optional
from decimal import Decimal

from app.core.logging import get_logger

logger = get_logger(__name__)

_relationship_predictor = None
_health_predictor = None
_churn_predictor = None
_upsell_predictor = None


def _get_relationship_predictor():
    global _relationship_predictor
    if _relationship_predictor is None:
        from app.services.ml.relationship_score import RelationshipScorePredictor
        _relationship_predictor = RelationshipScorePredictor()
    return _relationship_predictor


def _get_health_predictor():
    global _health_predictor
    if _health_predictor is None:
        from app.services.ml.health_score import HealthScorePredictor
        _health_predictor = HealthScorePredictor()
    return _health_predictor


def _get_churn_predictor():
    global _churn_predictor
    if _churn_predictor is None:
        from app.services.ml.churn_predictor import ChurnPredictor
        _churn_predictor = ChurnPredictor()
    return _churn_predictor


def _get_upsell_predictor():
    global _upsell_predictor
    if _upsell_predictor is None:
        from app.services.ml.upsell_detector import UpsellDetector
        _upsell_predictor = UpsellDetector()
    return _upsell_predictor


def _to_float(v: Any) -> float:
    if v is None:
        return 0.0
    if isinstance(v, Decimal):
        return float(v)
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0.0


def _days_since_last_contact(last_contact_date: Any) -> int:
    if last_contact_date is None:
        return 30
    try:
        if isinstance(last_contact_date, str):
            dt = datetime.fromisoformat(last_contact_date.replace("Z", "+00:00"))
        else:
            dt = last_contact_date
        delta = datetime.now(timezone.utc) - (dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc))
        return max(0, min(365, delta.days))
    except Exception:
        return 30


def _days_until_renewal(renewal_date: Any) -> int:
    if renewal_date is None:
        return 90
    try:
        if isinstance(renewal_date, str):
            d = datetime.fromisoformat(renewal_date.replace("Z", "+00:00")).date()
        else:
            d = renewal_date if hasattr(renewal_date, "day") else datetime.fromisoformat(str(renewal_date)).date()
        delta = (d - date.today()).days
        return delta
    except Exception:
        return 90


def _calculated_utilization(account: Dict[str, Any]) -> float:
    lic_total = int(_to_float(account.get("licenses_total") or 0)) or 1
    lic_used = int(_to_float(account.get("licenses_used") or 0))
    util_pct = _to_float(account.get("utilization_percentage"))
    if lic_total > 0 and lic_used >= 0:
        return min(1.0, max(0.0, lic_used / lic_total))
    if util_pct:
        return min(1.0, max(0.0, util_pct / 100.0))
    return 0.5


def _sentiment_one_hot(sentiment_category: Optional[str]) -> Dict[str, int]:
    cat = (sentiment_category or "neutral").strip().lower()
    keys = [
        "sentiment_category_neutral",
        "sentiment_category_positive",
        "sentiment_category_very_negative",
        "sentiment_category_very_positive",
    ]
    out = {k: 0 for k in keys}
    if cat == "neutral":
        out["sentiment_category_neutral"] = 1
    elif cat == "positive":
        out["sentiment_category_positive"] = 1
    elif cat == "very_negative":
        out["sentiment_category_very_negative"] = 1
    elif cat == "very_positive":
        out["sentiment_category_very_positive"] = 1
    else:
        if "sentiment_category_negative" not in out:
            out["sentiment_category_neutral"] = 1
    return out


def run_pipeline_for_account(account: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run the full ML flowchart for one account in dependency order.
    Each model uses only: raw/engineered inputs + outputs from prior steps (never DB values for scores).
    """
    account_id = account.get("id")
    result = {
        "account_id": account_id,
        "account_updates": {},
        "churn_prediction_row": None,
        "upsell_opportunity_row": None,
        "error": None,
    }

    try:
        # --- Engineered features from raw (no model outputs) ---
        last_contact = account.get("last_contact_date")
        renewal_date = account.get("renewal_date")
        days_since_contact = _days_since_last_contact(last_contact)
        days_until_renewal = _days_until_renewal(renewal_date)
        calculated_util = _calculated_utilization(account)

        sentiment_score = _to_float(account.get("sentiment_score"))
        sentiment_cat = account.get("sentiment_category") or "neutral"
        licenses_total = int(_to_float(account.get("licenses_total") or 0)) or 1
        licenses_used = int(_to_float(account.get("licenses_used") or 0))
        utilization_pct = _to_float(account.get("utilization_percentage") or 0)
        if utilization_pct <= 0 and licenses_total > 0:
            utilization_pct = (licenses_used / licenses_total) * 100

        # ========== PRIORITY 1: Relationship (M_Rel) — no model dependencies ==========
        rel_features = {
            "days_since_last_contact": days_since_contact,
            "sentiment_score": sentiment_score,
            "sentiment_category": sentiment_cat,
            "licenses_total": licenses_total,
            "licenses_used": licenses_used,
            "utilization_percentage": utilization_pct,
        }
        rel_features.update(_sentiment_one_hot(sentiment_cat))
        try:
            rel_pred = _get_relationship_predictor().predict(rel_features)
            relationship_score_pred = int(round(rel_pred["relationship_score"]))
        except Exception as e:
            logger.warning(f"Relationship prediction failed for account {account_id}: {e}")
            relationship_score_pred = 50
        result["account_updates"]["relationship_score"] = relationship_score_pred

        # ========== PRIORITY 2: Health (M_Health) — uses only Relationship output, not DB ==========
        health_features = {
            "calculated_utilization": calculated_util,
            "relationship_score": float(relationship_score_pred),
        }
        try:
            health_pred = _get_health_predictor().predict(health_features)
            health_score_pred = int(round(health_pred["health_score"]))
        except Exception as e:
            logger.warning(f"Health prediction failed for account {account_id}: {e}")
            health_score_pred = 50
        result["account_updates"]["health_score"] = health_score_pred

        # ========== PRIORITY 3: Churn (C_Churn) — uses only Health output + raw/engineered ==========
        industry = (account.get("industry") or "Unknown").strip()
        churn_features = {
            "health_score": health_score_pred,
            "days_until_renewal": days_until_renewal,
            "industry": industry,
        }
        try:
            churn_pred = _get_churn_predictor().predict(churn_features)
            churn_prob = churn_pred["churn_probability"]
            risk_level = churn_pred.get("risk_level", "low")
            result["account_updates"]["churn_probability"] = round(churn_prob, 4)
            result["account_updates"]["risk_score"] = int(round(churn_prob * 100))
            result["churn_prediction_row"] = {
                "account_id": account_id,
                "prediction_date": date.today().isoformat(),
                "churn_probability": float(round(churn_prob, 4)),
                "risk_score": int(round(churn_prob * 100)),
                "risk_category": str(risk_level),
            }
        except Exception as e:
            logger.warning(f"Churn prediction failed for account {account_id}: {e}")

        # ========== PRIORITY 4: Upsell (C_Upsell) — uses only Health output + raw ==========
        arr_from_db = _to_float(account.get("arr") or 0)
        mrr_raw = account.get("monthly_wise_instalment") or account.get("mrr")
        if mrr_raw is not None and mrr_raw != "":
            mrr = _to_float(mrr_raw)
        else:
            mrr = (arr_from_db / 12) if arr_from_db else 0.0
        # Annual equivalent for ML only: if account has no ARR (e.g. monthly-only), use mrr*12. Never save to DB.
        arr_for_ml = arr_from_db if arr_from_db else (mrr * 12)
        company_size = (account.get("company_size") or "Medium").strip()
        upsell_features = {
            "health_score": health_score_pred,
            "calculated_utilization": calculated_util,
            "arr": arr_for_ml,
            "mrr": mrr,
            "company_size": company_size,
        }
        try:
            upsell_pred = _get_upsell_predictor().predict(upsell_features)
            prob = upsell_pred.get("probability", 0.0)
            result["upsell_opportunity_row"] = {
                "account_id": str(account_id),
                "opportunity_type": "upsell",
                "predicted_value": float(round(arr_for_ml * 0.2, 2)) if prob >= 0.5 else 0.0,
                "probability": float(round(prob, 4)),
                "status": "identified",
                "reasoning": upsell_pred.get("reasoning", "Identified by ML model based on current usage and health."),
                "recommended_products": upsell_pred.get("recommended_products", ["Premium Support", "Additional Modules"]),
            }
        except Exception as e:
            logger.warning(f"Upsell prediction failed for account {account_id}: {e}")

    except Exception as e:
        logger.exception(f"ML pipeline failed for account {account_id}: {e}")
        result["error"] = str(e)

    return result
