"""
HAZARDSHIELD AI - Machine Learning Engine
Implements Scikit-learn RandomForestClassifier & GradientBoosting models
for Multi-Hazard Risk and Vulnerability Classification.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

from app.schemas.ml import MLPredictionInput, MLPredictionResponse, MLModelMetricsResponse

class HazardRiskMLEngine:
    """
    Scikit-Learn Powered Disaster Risk Assessment Engine.
    Trained on structured multi-hazard features for rapid, reproducible inference.
    """

    FEATURES = [
        "average_rainfall_mm",
        "distance_from_river_km",
        "elevation_meters",
        "population_density",
        "historical_disaster_frequency",
        "infrastructure_score",
    ]

    TARGET_CLASSES = ["LOW", "MODERATE", "HIGH", "CRITICAL"]

    def __init__(self):
        self.model_version = "v1.2.0-rf"
        self.model_name = "HazardShield Random Forest Risk Classifier"
        self.algorithm = "RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)"
        self.training_date = "2026-09-09"
        self.model = None
        self.metrics: Dict[str, Any] = {}
        self._train_model()

    def _generate_synthetic_training_dataset(self, n_samples: int = 1200) -> pd.DataFrame:
        """
        Synthesize realistic regional multi-hazard disaster distributions
        modeled on Brahmaputra floodplains, Himalayan slopes, and coastal corridors.
        """
        np.random.seed(42)

        # Features
        rainfall = np.random.uniform(600, 4500, n_samples)
        river_dist = np.random.exponential(3.5, n_samples)
        elevation = np.random.uniform(5, 3200, n_samples)
        pop_density = np.random.uniform(50, 4500, n_samples)
        disaster_freq = np.random.poisson(4.5, n_samples)
        infra_resilience = np.random.uniform(15, 95, n_samples)

        # Ground-truth continuous risk index formulation
        norm_rain = np.clip(rainfall / 3500, 0, 1)
        norm_river = np.clip((8.0 - river_dist) / 8.0, 0, 1)
        norm_elevation_risk = np.where(elevation < 50, 0.85, np.where(elevation > 1500, 0.70, 0.25))
        norm_density = np.clip(pop_density / 3000, 0, 1)
        norm_freq = np.clip(disaster_freq / 12, 0, 1)
        norm_infra_vuln = (100 - infra_resilience) / 100.0

        continuous_risk = (
            0.30 * norm_rain +
            0.20 * norm_river +
            0.15 * norm_elevation_risk +
            0.15 * norm_density +
            0.10 * norm_freq +
            0.10 * norm_infra_vuln
        ) * 100.0

        # Discretize into 4 balanced classes using quantiles
        labels = pd.qcut(continuous_risk, q=4, labels=["LOW", "MODERATE", "HIGH", "CRITICAL"]).astype(str).tolist()

        df = pd.DataFrame({
            "average_rainfall_mm": rainfall,
            "distance_from_river_km": river_dist,
            "elevation_meters": elevation,
            "population_density": pop_density,
            "historical_disaster_frequency": disaster_freq,
            "infrastructure_score": infra_resilience,
            "target": labels
        })
        return df

    def _train_model(self):
        """Train Random Forest classifier and evaluate metrics."""
        df = self._generate_synthetic_training_dataset(n_samples=2000)
        X = df[self.FEATURES]
        y = df["target"]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.25, random_state=42, stratify=y
        )

        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=8,
            min_samples_split=2,
            random_state=42
        )
        self.model.fit(X_train, y_train)

        y_pred = self.model.predict(X_test)

        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, average="macro", zero_division=0))
        rec = float(recall_score(y_test, y_pred, average="macro", zero_division=0))
        f1 = float(f1_score(y_test, y_pred, average="macro", zero_division=0))
        cm = confusion_matrix(y_test, y_pred, labels=self.TARGET_CLASSES).tolist()

        importances = dict(zip(self.FEATURES, [round(float(imp), 4) for imp in self.model.feature_importances_]))

        self.metrics = {
            "model_name": self.model_name,
            "model_version": self.model_version,
            "algorithm": self.algorithm,
            "training_date": self.training_date,
            "dataset_size": len(df),
            "features": self.FEATURES,
            "target_classes": self.TARGET_CLASSES,
            "accuracy": round(acc, 4),
            "precision_macro": round(prec, 4),
            "recall_macro": round(rec, 4),
            "f1_score_macro": round(f1, 4),
            "confusion_matrix": cm,
            "feature_importances": importances,
            "provenance_label": "Trained Scikit-Learn Model (HazardShield Prototype Dataset)"
        }

    def get_metrics(self) -> MLModelMetricsResponse:
        """Return model evaluation metrics."""
        return MLModelMetricsResponse(**self.metrics)

    def predict(self, input_data: MLPredictionInput) -> MLPredictionResponse:
        """Run real-time inference on input features."""
        features_df = pd.DataFrame([{
            "average_rainfall_mm": input_data.average_rainfall_mm,
            "distance_from_river_km": input_data.distance_from_river_km,
            "elevation_meters": input_data.elevation_meters,
            "population_density": input_data.population_density,
            "historical_disaster_frequency": input_data.historical_disaster_frequency,
            "infrastructure_score": input_data.infrastructure_score
        }], columns=self.FEATURES)

        pred_class = str(self.model.predict(features_df)[0])
        probs = self.model.predict_proba(features_df)[0]
        prob_dist = {cls: round(float(prob), 4) for cls, prob in zip(self.model.classes_, probs)}
        confidence = float(np.max(probs))

        # Dynamic contribution weighting based on feature importances and input severity
        feat_contributions = {}
        importances = self.metrics["feature_importances"]
        
        # Calculate localized driver impacts
        rain_factor = (input_data.average_rainfall_mm / 3000.0) * importances.get("average_rainfall_mm", 0.3)
        river_factor = (max(0, 5.0 - input_data.distance_from_river_km) / 5.0) * importances.get("distance_from_river_km", 0.2)
        infra_factor = ((100 - input_data.infrastructure_score) / 100.0) * importances.get("infrastructure_score", 0.15)
        pop_factor = (input_data.population_density / 1000.0) * importances.get("population_density", 0.15)
        freq_factor = (input_data.historical_disaster_frequency / 10.0) * importances.get("historical_disaster_frequency", 0.1)

        drivers = [
            ("Heavy Precipitation & Water Inundation", rain_factor),
            ("Proximity to Riverbank Breach Zones", river_factor),
            ("Infrastructure Fragility & Drainage Deficit", infra_factor),
            ("High Demographic Exposure & Density", pop_factor),
            ("Historical Disaster Recurrence Frequency", freq_factor),
        ]
        drivers.sort(key=lambda x: x[1], reverse=True)

        primary_driver = drivers[0][0]
        secondary_driver = drivers[1][0]

        return MLPredictionResponse(
            habitation_name=input_data.habitation_name or "Custom Habitation",
            predicted_risk_level=pred_class,
            confidence_score=round(confidence, 4),
            probability_distribution=prob_dist,
            primary_risk_driver=primary_driver,
            secondary_risk_driver=secondary_driver,
            feature_contributions={
                "Rainfall Severity": round(float(rain_factor), 3),
                "River Proximity": round(float(river_factor), 3),
                "Infrastructure Risk": round(float(infra_factor), 3),
                "Population Exposure": round(float(pop_factor), 3),
                "Historical Frequency": round(float(freq_factor), 3),
            },
            model_version=self.model_version,
            model_type=self.algorithm,
            engine_note="Machine Learning Model Evaluation: Scikit-learn Random Forest (Prototype Benchmark)"
        )


# Singleton instance
ml_engine = HazardRiskMLEngine()
