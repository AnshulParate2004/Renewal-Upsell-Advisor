"""
Upsell Detection Service.
"""
import pandas as pd
import numpy as np
from typing import Dict, Any
from app.services.ml.model_loader import model_loader
from app.core.exceptions import PredictionError, ModelLoadError
from app.core.logging import get_logger

logger = get_logger(__name__)


class UpsellDetector:
    """Service for detecting upsell opportunities."""
    
    def __init__(self):
        self.model = None
        self.preprocessing = None
        self._load_model()
    
    def _load_model(self):
        """Load upsell detection model and preprocessing."""
        try:
            self.model, self.preprocessing = model_loader.load_model("upsell")
        except Exception as e:
            logger.error(f"Failed to load upsell model: {e}")
            raise ModelLoadError("upsell", str(e))
    
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Detect upsell opportunity for given features.
        
        Args:
            features: Dictionary of input features
            
        Returns:
            Dictionary with has_upsell_opportunity, probability, and recommendation
        """
        try:
            # Prepare features
            processed_features = self._preprocess_features(features)
            
            # Make prediction
            prediction = self.model.predict_proba(processed_features)[0]
            upsell_probability = float(prediction[1])  # Probability of upsell opportunity
            
            has_opportunity = upsell_probability >= 0.5
            
            # Generate recommendation
            if has_opportunity:
                if upsell_probability >= 0.8:
                    recommendation = "high_priority"
                elif upsell_probability >= 0.6:
                    recommendation = "medium_priority"
                else:
                    recommendation = "low_priority"
            else:
                recommendation = "no_opportunity"
            
            return {
                "has_upsell_opportunity": has_opportunity,
                "probability": upsell_probability,
                "recommendation": recommendation,
                "confidence": float(max(prediction))
            }
        except Exception as e:
            logger.error(f"Upsell detection failed: {e}")
            raise PredictionError("upsell", str(e))
    
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
            return pd.DataFrame(scaled_features, columns=feature_names)
        
        return feature_df
