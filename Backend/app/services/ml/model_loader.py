"""
ML Model Loader - Centralized model loading and caching.
"""
import joblib
import json
from pathlib import Path
from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.exceptions import ModelLoadError
from app.core.logging import get_logger

logger = get_logger(__name__)


class ModelLoader:
    """Singleton class for loading and caching ML models."""
    
    _instance = None
    _models: Dict[str, Any] = {}
    _preprocessing: Dict[str, Any] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not hasattr(self, '_initialized'):
            self.models_path = settings.ml_models_path
            self._initialized = True
    
    def load_model(self, model_type: str) -> tuple[Any, Optional[Any]]:
        """
        Load a model and its preprocessing pipeline.
        
        Args:
            model_type: Type of model (churn, health_score, relationship_score, etc.)
            
        Returns:
            Tuple of (model, preprocessing) or (model, None) if no preprocessing
        """
        if model_type in self._models:
            logger.debug(f"Using cached model: {model_type}")
            return self._models[model_type], self._preprocessing.get(model_type)
        
        try:
            model, preprocessing = self._load_model_files(model_type)
            self._models[model_type] = model
            if preprocessing:
                self._preprocessing[model_type] = preprocessing
            logger.info(f"Successfully loaded model: {model_type}")
            return model, preprocessing
        except Exception as e:
            logger.error(f"Failed to load model {model_type}: {str(e)}")
            raise ModelLoadError(model_type, str(e))
    
    def _load_model_files(self, model_type: str) -> tuple[Any, Optional[Any]]:
        """Load model and preprocessing files from disk."""
        model_dir = self.models_path / model_type
        
        if not model_dir.exists():
            raise FileNotFoundError(f"Model directory not found: {model_dir}")
        
        # Load model based on type
        if model_type == "sentiment":
            return self._load_sentiment_model(model_dir)
        else:
            return self._load_standard_model(model_dir, model_type)
    
    def _load_standard_model(self, model_dir: Path, model_type: str) -> tuple[Any, Optional[Any]]:
        """Load standard .pkl model and preprocessing."""
        # Find model file
        model_files = list(model_dir.glob("*_model_best_*.pkl"))
        if not model_files:
            raise FileNotFoundError(f"No model file found in {model_dir}")
        
        model_file = model_files[0]
        logger.debug(f"Loading model from: {model_file}")
        model = joblib.load(model_file)
        
        # Load preprocessing
        preprocessing = None
        preprocessing_files = list(model_dir.glob("*preprocessing*.pkl"))
        if preprocessing_files:
            preprocessing_file = preprocessing_files[0]
            logger.debug(f"Loading preprocessing from: {preprocessing_file}")
            preprocessing = joblib.load(preprocessing_file)
        
        return model, preprocessing
    
    def _load_sentiment_model(self, model_dir: Path) -> tuple[Any, Optional[Any]]:
        """Load sentiment model (uses joblib pipeline and transformers)."""
        # Load pipeline
        pipeline_files = list(model_dir.glob("*pipeline*.joblib"))
        if not pipeline_files:
            raise FileNotFoundError(f"No pipeline file found in {model_dir}")
        
        pipeline_file = pipeline_files[0]
        logger.debug(f"Loading sentiment pipeline from: {pipeline_file}")
        pipeline = joblib.load(pipeline_file)
        
        # Load config if available
        config = None
        config_files = list(model_dir.glob("*config*.json"))
        if config_files:
            config_file = config_files[0]
            with open(config_file, 'r') as f:
                config = json.load(f)
        
        return pipeline, config
    
    def get_model_info(self, model_type: str) -> Dict[str, Any]:
        """Get information about a loaded model."""
        if model_type not in self._models:
            return {"loaded": False}
        
        return {
            "loaded": True,
            "has_preprocessing": model_type in self._preprocessing,
            "model_type": model_type
        }
    
    def get_all_models_info(self) -> Dict[str, Dict[str, Any]]:
        """Get information about all models."""
        return {
            model_type: self.get_model_info(model_type)
            for model_type in ["churn", "health_score", "relationship_score", 
                             "renewal_score", "sentiment", "upsell"]
        }
    
    def reload_model(self, model_type: str) -> None:
        """Reload a model (useful for model updates)."""
        if model_type in self._models:
            del self._models[model_type]
        if model_type in self._preprocessing:
            del self._preprocessing[model_type]
        self.load_model(model_type)


# Global model loader instance
model_loader = ModelLoader()
