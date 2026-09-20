import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.carrying_capacity_engine import CarryingCapacityEngine, carrying_capacity_engine

client = TestClient(app)


def test_carrying_capacity_score_ranges_and_completeness():
    engine = CarryingCapacityEngine()
    results = engine.analyze_all_districts()
    assert len(results) == 640

    for res in results:
        assert 0.0 <= res["overall_carrying_capacity_score"] <= 100.0
        assert res["carrying_capacity_level"] in [
            "CRITICAL_CAPACITY",
            "LOW_CAPACITY",
            "MODERATE_CAPACITY",
            "HIGH_CAPACITY",
        ]
        assert 0.0 <= res["data_completeness_score"] <= 1.0
        assert res["assessment_confidence"] in ["HIGH", "MEDIUM", "LOW"]
        assert "spatial_analysis_available" in res


def test_housing_capacity_calculation():
    engine = CarryingCapacityEngine()
    results = engine.analyze_all_districts()
    valid_housing = [r for r in results if r["housing_capacity_score"] is not None]
    assert len(valid_housing) > 0
    for r in valid_housing:
        assert 0.0 <= r["housing_capacity_score"] <= 100.0


def test_healthcare_capacity_calculation():
    engine = CarryingCapacityEngine()
    results = engine.analyze_all_districts()
    valid_health = [r for r in results if r["healthcare_capacity_score"] is not None]
    assert len(valid_health) > 0
    for r in valid_health:
        assert 0.0 <= r["healthcare_capacity_score"] <= 100.0


def test_missing_sectors_handling():
    engine = CarryingCapacityEngine()
    results = engine.analyze_all_districts()
    for res in results:
        missing = res["missing_sectors"]
        assert "water" in missing
        assert "education" in missing
        assert "shelter" in missing
        assert "road_evacuation" in missing
        assert res["water_capacity_score"] is None
        assert res["education_capacity_score"] is None
        assert res["shelter_capacity_score"] is None
        assert res["road_evacuation_capacity_score"] is None


def test_dynamic_weight_redistribution_sum_equals_one():
    engine = CarryingCapacityEngine()
    results = engine.analyze_all_districts()
    for res in results:
        assert res["redistributed_weights_sum"] == pytest.approx(1.0, abs=1e-3)
        assert sum(res["redistributed_weights"].values()) == pytest.approx(1.0, abs=1e-3)


def test_api_carrying_capacity_list_endpoint():
    response = client.get("/api/v1/carrying-capacity")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 640
    sample = data[0]
    assert "overall_carrying_capacity_score" in sample
    assert "carrying_capacity_level" in sample
    assert "available_sectors" in sample
    assert "missing_sectors" in sample


def test_api_carrying_capacity_alias_endpoint():
    response = client.get("/api/v1/capacity")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 640


def test_api_carrying_capacity_filtering_by_state():
    response = client.get("/api/v1/carrying-capacity?state=KERALA")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert all("KERALA" in d["state"].upper() for d in data)


def test_api_carrying_capacity_filtering_by_level():
    response = client.get("/api/v1/carrying-capacity?carrying_capacity_level=MODERATE_CAPACITY")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert all(d["carrying_capacity_level"] == "MODERATE_CAPACITY" for d in data)


def test_api_carrying_capacity_single_district():
    response = client.get("/api/v1/carrying-capacity/DIST_IND_001")
    assert response.status_code == 200
    data = response.json()
    assert data["district_id"] == "DIST_IND_001"

    response_404 = client.get("/api/v1/carrying-capacity/INVALID_9999")
    assert response_404.status_code == 404
