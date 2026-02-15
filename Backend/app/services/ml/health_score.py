"""
Health Score Prediction Service.
"""
import pandas as pd
import numpy as np
from typing import Dict, Any
from app.services.ml.model_loader import model_loader
from app.core.exceptions import PredictionError, ModelLoadError
from app.core.logging import get_logger

logger = get_logger(__name__)


class HealthScorePredictor:
    """Service for predicting customer health score."""
    
    def __init__(self):
        self.model = None
        self.preprocessing = None
        self._load_model()
    
    def _load_model(self):
        """Load health score model and preprocessing."""
        try:
            self.model, self.preprocessing = model_loader.load_model("health_score")
        except Exception as e:
            logger.error(f"Failed to load health score model: {e}")
            raise ModelLoadError("health_score", str(e))
    
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict health score for given features.
        
        Args:
            features: Dictionary of input features
            
        Returns:
            Dictionary with health_score and status
        """
        try:
            # Prepare features
            processed_features = self._preprocess_features(features)
            
            # Make prediction
            health_score = float(self.model.predict(processed_features)[0])
            
            # Clamp to 0-100 range
            health_score = max(0, min(100, health_score))
            
            # Determine status
            if health_score >= 70:
                status = "healthy"
            elif health_score >= 40:
                status = "at_risk"
            else:
                status = "critical"
            
            return {
                "health_score": health_score,
                "status": status
            }
        except Exception as e:
            logger.error(f"Health score prediction failed: {e}")
            raise PredictionError("health_score", str(e))
    
    def _preprocess_features(self, features: Dict[str, Any]) -> np.ndarray:
        """Apply preprocessing to input features."""
        if not self.preprocessing:
            raise ValueError("Preprocessing pipeline not loaded")
        
        # Convert to DataFrame
        feature_df = pd.DataFrame([features])
        
        # Apply label encoders
        if 'label_encoders' in self.preprocessing:
            for col, encoder in self.preprocessing['label_encoders'].items():
                if col in feature_df.columns:
                    try:
                        feature_df[col] = encoder.transform(feature_df[col].astype(str))
                    except ValueError:
                        feature_df[col] = 0
        
        # Select and order features
        feature_names = self.preprocessing.get('feature_names', feature_df.columns.tolist())
        feature_df = feature_df.reindex(columns=feature_names, fill_value=0)
        
        # Apply scaler
        if 'scaler' in self.preprocessing:
            scaled_features = self.preprocessing['scaler'].transform(feature_df)
        else:
            scaled_features = feature_df.values
        
        return scaled_features
