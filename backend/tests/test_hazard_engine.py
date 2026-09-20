import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.hazard_engine import HazardEngine, min_max_scale

client = TestClient(app)


def test_min_max_scale_range():
    assert min_max_scale(50, 0, 100) == 50.0
    assert min_max_scale(0, 0, 100) == 0.0
    assert min_max_scale(100, 0, 100) == 100.0
    assert min_max_scale(None, 0, 100) is None


def test_hazard_engine_score_ranges_and_completeness():
    engine = HazardEngine()
    results = engine.analyze_all_districts()

    assert len(results) == 640
    for res in results:
        assert 0.0 <= res["overall_hazard_score"] <= 100.0
        assert res["risk_level"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
        assert 0.0 <= res["data_completeness_score"] <= 1.0
        assert res["analysis_confidence"] in ["HIGH", "MEDIUM", "LOW"]
        assert "spatial_analysis_available" in res


def test_missing_rainfall_not_treated_as_zero():
    engine = HazardEngine()
    results = engine.analyze_all_districts()
    missing_rain_district = [r for r in results if "average_rainfall" in r["missing_data"]]
    assert len(missing_rain_district) > 0
    sample = missing_rain_district[0]
    assert sample["rainfall_risk_score"] is None
    assert "average_rainfall" in sample["missing_data"]


def test_districts_without_coordinates_flag():
    engine = HazardEngine()
    results = engine.analyze_all_districts()
    no_coords = [r for r in results if not r["spatial_analysis_available"]]
    assert len(no_coords) == 61
    for r in no_coords:
        assert r["latitude"] is None
        assert r["longitude"] is None
        assert r["spatial_analysis_available"] == False


def test_api_hazard_list_endpoint():
    response = client.get("/api/v1/hazard")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 640
    sample = data[0]
    assert "overall_hazard_score" in sample
    assert "data_completeness_score" in sample
    assert "analysis_confidence" in sample


def test_api_hazard_filtering():
    response_st = client.get("/api/v1/hazard?state=PUNJAB")
    assert response_st.status_code == 200
    data_st = response_st.json()
    assert len(data_st) > 0
    assert all("PUNJAB" in d["state"].upper() for d in data_st)

    response_rl = client.get("/api/v1/hazard?risk_level=MODERATE")
    assert response_rl.status_code == 200
    data_rl = response_rl.json()
    assert all(d["risk_level"] == "MODERATE" for d in data_rl)


def test_api_hazard_single_district():
    response = client.get("/api/v1/hazard/DIST_IND_001")
    assert response.status_code == 200
    data = response.json()
    assert data["district_id"] == "DIST_IND_001"

    response_404 = client.get("/api/v1/hazard/INVALID_9999")
    assert response_404.status_code == 404


def test_dynamic_redistributed_weights_sum_to_one():
    engine = HazardEngine()
    results = engine.analyze_all_districts()
    for res in results:
        assert res["redistributed_weights_sum"] == pytest.approx(1.0, abs=1e-3)


def test_cyclone_methodology_implementation_matches_docs():
    engine = HazardEngine()
    results = engine.analyze_all_districts()
    for res in results:
        assert "cyclone_proximity_exposure" in res
        assert res["cyclone_proximity_exposure"] == res["cyclone_risk_score"]
        assert 0.0 <= res["cyclone_proximity_exposure"] <= 100.0

