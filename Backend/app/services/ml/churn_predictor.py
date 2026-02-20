"""
Churn Prediction Service.
"""
import pandas as pd
import numpy as np
from typing import Dict, Any
from app.services.ml.model_loader import model_loader
from app.core.exceptions import PredictionError, ModelLoadError
from app.core.logging import get_logger

logger = get_logger(__name__)


class ChurnPredictor:
    """Service for predicting customer churn."""
    
    def __init__(self):
        self.model = None
        self.preprocessing = None
        self._load_model()
    
    def _load_model(self):
        """Load churn model and preprocessing."""
        try:
            self.model, self.preprocessing = model_loader.load_model("churn")
        except Exception as e:
            logger.error(f"Failed to load churn model: {e}")
            raise ModelLoadError("churn", str(e))
    
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict churn probability for given features.
        
        Args:
            features: Dictionary of input features
            
        Returns:
            Dictionary with churn_probability and risk_level
        """
        try:
            # Prepare features
            processed_features = self._preprocess_features(features)
            
            # Make prediction
            prediction = self.model.predict_proba(processed_features)[0]
            churn_probability = float(prediction[1])  # Probability of churn (class 1)
            
            # Determine risk level
            if churn_probability >= 0.7:
                risk_level = "critical"
            elif churn_probability >= 0.4:
                risk_level = "high"
            else:
                risk_level = "low"
            
            return {
                "churn_probability": churn_probability,
                "risk_level": risk_level,
                "confidence": float(max(prediction))
            }
        except Exception as e:
            logger.error(f"Churn prediction failed: {e}")
            raise PredictionError("churn", str(e))
    
    def _preprocess_features(self, features: Dict[str, Any]) -> np.ndarray:
        """Apply preprocessing to input features."""
        if not self.preprocessing:
            raise ValueError("Preprocessing pipeline not loaded")
        
        # Convert to DataFrame
        feature_df = pd.DataFrame([features])
        
        # Apply label encoders for categorical features
        if 'label_encoders' in self.preprocessing:
            for col, encoder in self.preprocessing['label_encoders'].items():
                if col in feature_df.columns:
                    # Handle unseen categories
                    try:
                        feature_df[col] = encoder.transform(feature_df[col].astype(str))
                    except ValueError:
                        # Use most common class for unseen categories
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
