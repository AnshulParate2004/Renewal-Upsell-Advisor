"""
Prediction API endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from app.schemas.prediction import (
    PredictionRequest,
    PredictionResponse,
    BatchPredictionRequest,
    BatchPredictionResponse,
    ModelHealthResponse
)
from app.services.intelligence.predictor import UnifiedPredictor
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()
predictor = UnifiedPredictor()


@router.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Make a prediction using a specific model type.
    
    Note: model_type should be specified in the request features or as a parameter.
    For now, this endpoint runs all models and returns the requested one.
    """
    try:
        # Extract model type from features if present, otherwise use default
        model_type = request.features.pop("model_type", "churn")
        text_data = request.features.pop("text", None)
        
        # Run prediction
        result = predictor.predict_specific(model_type, request.features, text_data)
        
        return PredictionResponse(
            account_id=request.account_id,
            model_type=model_type,
            prediction_value=result.get("churn_probability") or result.get("health_score") or 
                           result.get("relationship_score") or result.get("renewal_probability") or
                           result.get("probability") or result.get("sentiment_score", 0.0),
            confidence=result.get("confidence"),
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict/all", response_model=dict)
async def predict_all(request: PredictionRequest):
    """Run all predictions for an account."""
    try:
        text_data = request.features.pop("text", None)
        results = predictor.predict_all(request.features, text_data)
        
        return {
            "account_id": request.account_id,
            "predictions": results,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Batch prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch(request: BatchPredictionRequest):
    """Run predictions for multiple accounts."""
    try:
        results = {}
        
        # For each account, run predictions
        for account_id in request.account_ids:
            # In a real implementation, you'd fetch account data from database
            # For now, using placeholder features
            account_data = {"account_id": account_id}
            
            model_types = request.model_types or ["churn", "health_score", "relationship_score", 
                                                  "renewal_score", "upsell"]
            
            account_results = {}
            for model_type in model_types:
                try:
                    result = predictor.predict_specific(model_type, account_data)
                    account_results[model_type] = PredictionResponse(
                        account_id=account_id,
                        model_type=model_type,
                        prediction_value=result.get("churn_probability") or result.get("health_score") or 
                                       result.get("relationship_score") or result.get("renewal_probability") or
                                       result.get("probability") or result.get("sentiment_score", 0.0),
                        confidence=result.get("confidence"),
                        timestamp=datetime.now()
                    )
                except Exception as e:
                    logger.error(f"Prediction failed for {account_id}, {model_type}: {e}")
            
            results[account_id] = account_results
        
        return BatchPredictionResponse(predictions=results)
    except Exception as e:
        logger.error(f"Batch prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health", response_model=List[ModelHealthResponse])
async def get_models_health():
    """Get health status of all scoring/prediction components."""
    import os
    components = {
        "churn":              {"type": "formula",  "loaded": True},
        "health_score":       {"type": "formula",  "loaded": True},
        "relationship_score": {"type": "formula",  "loaded": True},
        "renewal_score":      {"type": "formula",  "loaded": True},
        "sentiment":          {"type": "llm",      "loaded": bool(os.getenv("AZURE_OPENAI_API_KEY"))},
        "upsell":             {"type": "rule",     "loaded": True},
    }

    return [
        ModelHealthResponse(
            model_type=name,
            loaded=info["loaded"],
            version=info["type"],
            error=None if info["loaded"] else "Azure OpenAI credentials not configured"
        )
        for name, info in components.items()
    ]
