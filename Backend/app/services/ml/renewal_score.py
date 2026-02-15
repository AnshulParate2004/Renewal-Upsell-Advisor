"""
Renewal Score Prediction Service.
"""
import pandas as pd
import numpy as np
from typing import Dict, Any
from app.services.ml.model_loader import model_loader
from app.core.exceptions import PredictionError, ModelLoadError
from app.core.logging import get_logger

logger = get_logger(__name__)


class RenewalScorePredictor:
    """Service for predicting renewal probability."""
    
    def __init__(self):
        self.model = None
        self.preprocessing = None
        self._load_model()
    
    def _load_model(self):
        """Load renewal score model and preprocessing."""
        try:
            self.model, self.preprocessing = model_loader.load_model("renewal")
        except Exception as e:
            logger.error(f"Failed to load renewal score model: {e}")
            raise ModelLoadError("renewal_score", str(e))
    
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict renewal probability for given features.
        
        Args:
            features: Dictionary of input features
            
        Returns:
            Dictionary with renewal_probability and stage
        """
        try:
            # Prepare features
            processed_features = self._preprocess_features(features)
            
            # Make prediction
            if hasattr(self.model, 'predict_proba'):
                prediction = self.model.predict_proba(processed_features)[0]
                renewal_probability = float(prediction[1]) if len(prediction) > 1 else float(prediction[0])
            else:
                renewal_probability = float(self.model.predict(processed_features)[0])
            
            # Determine renewal stage based on probability
            if renewal_probability >= 0.8:
                stage = "likely"
            elif renewal_probability >= 0.5:
                stage = "possible"
            else:
                stage = "unlikely"
            
            return {
                "renewal_probability": renewal_probability,
                "stage": stage
            }
        except Exception as e:
            logger.error(f"Renewal score prediction failed: {e}")
            raise PredictionError("renewal_score", str(e))
    
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
