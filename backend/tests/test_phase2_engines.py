import unittest
from app.models.habitation import Habitation
from app.models.hazard import Hazard
from app.models.safe_haven import SafeHaven
from app.services.gis_service import haversine_distance, calculate_route, generate_fallback_geometry
from app.services.risk_engine import compute_explainable_risk, DEFAULT_RISK_WEIGHTS
from app.services.scenario_engine import simulate_scenario
from app.services.evacuation_service import analyze_evacuation_network
from app.services.cascade_engine import simulate_cascade


class TestPhase2Engines(unittest.TestCase):

    def setUp(self):
        self.mock_habitation = Habitation(
            id=1,
            name="Rampur River Basin",
            district="Darrang",
            state="Assam",
            latitude=26.4521,
            longitude=92.0345,
            population=4850,
            families=980,
            risk_score=78.5,
            risk_level="HIGH",
            vulnerability_score=72.0,
            relocation_priority="IMMEDIATE"
        )
        self.mock_hazard = Hazard(
            id=1,
            habitation_id=1,
            hazard_type="Riverine Flood",
            hazard_score=85.0,
            severity="CRITICAL",
            description="Severe embankment erosion"
        )
        self.mock_haven = SafeHaven(
            id=1,
            name="Sivasagar Multi-Purpose Shelter",
            district="Sivasagar",
            state="Assam",
            latitude=26.9826,
            longitude=94.6425,
            total_capacity=5000,
            occupied_capacity=1200,
            available_capacity=3800,
            safety_score=94.0,
            road_access_score=88.0,
            healthcare_score=90.0,
            suitability_score=92.0,
            status="AVAILABLE"
        )

    def test_gis_haversine(self):
        dist = haversine_distance(26.4521, 92.0345, 26.9826, 94.6425)
        self.assertGreater(dist, 100.0)
        self.assertLess(dist, 400.0)

    def test_gis_route_geometry(self):
        route = calculate_route(26.4521, 92.0345, 26.9826, 94.6425, is_closed=False)
        self.assertIn("geometry", route)
        self.assertEqual(route["geometry"]["type"], "LineString")
        self.assertGreater(len(route["geometry"]["coordinates"]), 2)
        self.assertFalse(route["is_detour"])

    def test_gis_route_closure_detour(self):
        detour = calculate_route(26.4521, 92.0345, 26.9826, 94.6425, is_closed=True, avoid_road="Bridge 4")
        self.assertTrue(detour["is_detour"])
        self.assertEqual(detour["status"], "ALTERNATIVE_DETOUR")

    def test_risk_weights_sum_to_one(self):
        total_weight = sum(meta["weight"] for meta in DEFAULT_RISK_WEIGHTS.values())
        self.assertAlmostEqual(total_weight, 1.0, places=2)

    def test_explainable_risk_calculation(self):
        result = compute_explainable_risk(self.mock_habitation, [self.mock_hazard])
        self.assertEqual(result["habitation_id"], 1)
        self.assertGreaterEqual(result["overall_risk"], 0.0)
        self.assertLessEqual(result["overall_risk"], 100.0)
        self.assertEqual(len(result["contributors"]), 6)
        self.assertIn("recommended_action", result)

    def test_scenario_simulation_rainfall_stress(self):
        res = simulate_scenario(self.mock_habitation, rainfall_change=30.0, road_status="CLOSED")
        self.assertGreater(res["after"]["risk_score"], res["before"]["risk_score"])
        self.assertEqual(res["after"]["evacuation_status"], "COMPROMISED_DETOUR_REQUIRED")
        self.assertLessEqual(res["after"]["risk_score"], 100.0)

    def test_evacuation_network_analysis(self):
        analysis = analyze_evacuation_network(self.mock_habitation, [self.mock_haven], is_road_closed=False)
        self.assertEqual(len(analysis["routes"]), 2)
        self.assertFalse(analysis["road_closure_active"])

    def test_cascade_dynamics(self):
        cascade = simulate_cascade(self.mock_habitation, rainfall_intensity="EXTREME", road_status="MULTIPLE_BLOCKED")
        self.assertGreater(cascade["cascade_risk"], cascade["initial_risk"])
        self.assertGreaterEqual(cascade["secondary_failures"], 2)
        self.assertEqual(len(cascade["events"]), 4)
        self.assertEqual(len(cascade["escalation_curve"]), 5)


if __name__ == "__main__":
    unittest.main()