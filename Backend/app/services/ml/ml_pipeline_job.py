"""
Run ML pipeline for all accounts and push results to Supabase.
Used by manual trigger (API) and by the daily 12:00 AM scheduler.
Writes current scores to accounts and appends each run to ml_score_history.
"""
from datetime import date, datetime, timezone
from typing import Any, Dict, List

from app.core.logging import get_logger

logger = get_logger(__name__)


def get_supabase_client():
    import os
    from supabase import create_client
    from app.core.config import settings
    supabase_url = os.getenv("SUPABASE_URL") or settings.SUPABASE_URL
    supabase_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_SECRET")
        or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
        or settings.SUPABASE_KEY
    )
    if not supabase_url or not supabase_key:
        return None
    return create_client(supabase_url, supabase_key)


def run_pipeline_and_push_to_supabase() -> Dict[str, Any]:
    """
    Fetch all accounts, run ML pipeline for each, update accounts and insert churn/upsell.
    Returns: { success, accounts_processed, accounts_updated, churn_inserted, upsell_inserted, errors }.
    """
    from app.services.ml.ml_pipeline import run_pipeline_for_account

    client = get_supabase_client()
    if not client:
        return {"success": False, "error": "Supabase not configured", "accounts_processed": 0}

    result = {
        "success": True,
        "accounts_processed": 0,
        "accounts_updated": 0,
        "churn_inserted": 0,
        "upsell_inserted": 0,
        "errors": [],
    }

    try:
        response = client.table("accounts").select("*").execute()
        accounts = response.data if response.data else []
        if not accounts:
            logger.info("No accounts found for ML pipeline.")
            return result

        result["accounts_processed"] = len(accounts)
        today = date.today().isoformat()
        run_at_iso = datetime.now(timezone.utc).isoformat()
        churn_rows: List[Dict[str, Any]] = []
        upsell_rows: List[Dict[str, Any]] = []
        history_rows: List[Dict[str, Any]] = []

        for account in accounts:
            account_id = account.get("id")
            if not account_id:
                continue
            pipeline_result = run_pipeline_for_account(account)
            if pipeline_result.get("error"):
                result["errors"].append({"account_id": account_id, "message": pipeline_result["error"]})
                continue

            updates = pipeline_result.get("account_updates") or {}
            if updates:
                try:
                    client.table("accounts").update(updates).eq("id", account_id).execute()
                    result["accounts_updated"] += 1
                    # Append to history for this run (current scores + run_at)
                    history_rows.append({
                        "account_id": account_id,
                        "run_at": run_at_iso,
                        "relationship_score": updates.get("relationship_score"),
                        "health_score": updates.get("health_score"),
                        "risk_score": updates.get("risk_score"),
                        "churn_probability": updates.get("churn_probability")
                    })
                except Exception as e:
                    result["errors"].append({"account_id": account_id, "message": f"Account update: {e}"})

            cr = pipeline_result.get("churn_prediction_row")
            if cr:
                cr["prediction_date"] = today
                churn_rows.append(cr)
            ur = pipeline_result.get("upsell_opportunity_row")
            if ur:
                upsell_rows.append(ur)

        # Insert ML score history (one row per account per run)
        for row in history_rows:
            try:
                client.table("ml_score_history").insert(row).execute()
            except Exception as e:
                logger.warning(f"ml_score_history insert failed (table may not exist yet): {e}")

        for row in churn_rows:
            try:
                client.table("churn_predictions").insert(row).execute()
                result["churn_inserted"] += 1
            except Exception:
                try:
                    client.table("churn_predictions").upsert(row, on_conflict="account_id,prediction_date").execute()
                    result["churn_inserted"] += 1
                except Exception:
                    pass

        if upsell_rows:
            try:
                # First delete existing 'identified' opportunities for these accounts to avoid duplicates
                account_ids_with_upsell = list(set([row["account_id"] for row in upsell_rows]))
                if account_ids_with_upsell:
                    try:
                        client.table("upsell_opportunities").delete().in_("account_id", account_ids_with_upsell).eq("status", "identified").execute()
                    except Exception as e:
                        logger.warning(f"Failed to delete old identified opportunities: {e}")
                        
                client.table("upsell_opportunities").insert(upsell_rows).execute()
                result["upsell_inserted"] = len(upsell_rows)
            except Exception as e:
                result["errors"].append({"message": f"Upsell insert: {e}"})

        result["success"] = len(result["errors"]) == 0 or result["accounts_updated"] > 0
        logger.info(
            f"ML pipeline job: processed={result['accounts_processed']}, updated={result['accounts_updated']}, "
            f"churn={result['churn_inserted']}, upsell={result['upsell_inserted']}, errors={len(result['errors'])}"
        )
    except Exception as e:
        logger.exception(f"ML pipeline job failed: {e}")
        result["success"] = False
        result["errors"].append({"message": str(e)})

    return result
