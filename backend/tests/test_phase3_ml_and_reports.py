import unittest
from app.services.ml_engine import ml_engine
from app.schemas.ml import MLPredictionInput
from app.database import get_db
from app.models.habitation import Habitation
from app.services.risk_engine import compute_explainable_risk

class TestPhase3MLEngineAndReports(unittest.TestCase):
    """
    Test suite for Phase 3 ML Model inference, evaluation metrics, and Decision Support Reports.
    """

    def test_ml_model_metrics(self):
        metrics = ml_engine.get_metrics()
        self.assertEqual(metrics.model_version, "v1.2.0-rf")
        self.assertGreaterEqual(metrics.accuracy, 0.70)
        self.assertGreaterEqual(metrics.f1_score_macro, 0.60)
        self.assertEqual(len(metrics.features), 6)
        self.assertEqual(len(metrics.target_classes), 4)
        self.assertIn("average_rainfall_mm", metrics.feature_importances)

    def test_ml_prediction_critical(self):
        input_critical = MLPredictionInput(
            habitation_name="Rampur Village Flood Zone",
            average_rainfall_mm=3800.0,
            distance_from_river_km=0.2,
            elevation_meters=20.0,
            population_density=2500.0,
            historical_disaster_frequency=12,
            infrastructure_score=20.0
        )
        res = ml_engine.predict(input_critical)
        self.assertIn(res.predicted_risk_level, ["CRITICAL", "HIGH"])
        self.assertGreaterEqual(res.confidence_score, 0.40)
        self.assertIn("CRITICAL", res.probability_distribution)
        self.assertIsNotNone(res.primary_risk_driver)
        self.assertIsNotNone(res.secondary_risk_driver)

    def test_ml_prediction_low_risk(self):
        input_safe = MLPredictionInput(
            habitation_name="Plateau Safe Haven",
            average_rainfall_mm=600.0,
            distance_from_river_km=25.0,
            elevation_meters=450.0,
            population_density=100.0,
            historical_disaster_frequency=0,
            infrastructure_score=95.0
        )
        res = ml_engine.predict(input_safe)
        self.assertIn(res.predicted_risk_level, ["LOW", "MODERATE"])

    def test_database_single_source_of_truth(self):
        db = next(get_db())
        habs = db.query(Habitation).all()
        self.assertGreaterEqual(len(habs), 1)
        first_hab = habs[0]
        self.assertIsNotNone(first_hab.name)
        self.assertIsNotNone(first_hab.district)
        self.assertIsNotNone(first_hab.state)
        self.assertGreater(first_hab.population, 0)
        self.assertIn(first_hab.relocation_priority, ["IMMEDIATE", "SHORT_TERM", "MEDIUM_TERM", "MONITOR"])

if __name__ == "__main__":
    unittest.main()
