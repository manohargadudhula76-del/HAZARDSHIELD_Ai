from fastapi import APIRouter
from app.schemas.ml import MLPredictionInput, MLPredictionResponse, MLModelMetricsResponse
from app.services.ml_engine import ml_engine

router = APIRouter(prefix="/api/ml", tags=["Machine Learning Engine"])

@router.get("/metrics", response_model=MLModelMetricsResponse, summary="Get ML Model Evaluation Metrics")
def get_model_metrics():
    """
    Returns training and evaluation scorecard for the Random Forest disaster classifier,
    including Accuracy, Precision, Recall, F1-Score, Confusion Matrix, and Feature Importances.
    """
    return ml_engine.get_metrics()

@router.post("/predict", response_model=MLPredictionResponse, summary="Run Real-Time ML Disaster Risk Inference")
def predict_hazard_risk(input_data: MLPredictionInput):
    """
    Runs real-time machine learning inference to predict risk level, confidence score,
    probability distributions, and primary contributing risk drivers.
    """
    return ml_engine.predict(input_data)
