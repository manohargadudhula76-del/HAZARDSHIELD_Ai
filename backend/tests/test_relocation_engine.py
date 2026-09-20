import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.relocation_engine import (
    relocation_engine,
    compute_haversine_distance,
    RELOCATION_DISCLAIMER,
)

client = TestClient(app)


# 1. Test Haversine distance accuracy
def test_haversine_distance_calculation():
    dist = compute_haversine_distance(28.6139, 77.2090, 19.0760, 72.8777)
    assert 1140.0 <= dist <= 1160.0
    assert compute_haversine_distance(28.6139, 77.2090, 28.6139, 77.2090) == 0.0


# 2. Test Source Eligibility (CRITICAL and HIGH priority)
def test_source_eligibility_critical_and_high():
    results = relocation_engine.analyze_all_relocations()["results"]
    for r in results:
        assert r["source_priority_level"] in ["CRITICAL_PRIORITY", "HIGH_PRIORITY"]


# 3. Test Exclusion of MODERATE and LOW priority districts as sources
def test_exclusion_of_moderate_low_priority_sources():
    results = relocation_engine.analyze_all_relocations()["results"]
    source_ids = {r["source_district_id"] for r in results}

    v_districts = relocation_engine.vulnerability_engine.analyze_all_districts()
    for v in v_districts:
        if v["priority_level"] in ["MODERATE_PRIORITY", "LOW_PRIORITY"]:
            assert v["district_id"] not in source_ids


# 4. Test Exclusion of CRITICAL_PRIORITY destinations
def test_exclusion_of_critical_priority_destinations():
    results = relocation_engine.analyze_all_relocations()["results"]
    for r in results:
        for cand in r["recommendations"]:
            assert cand["priority_level"] != "CRITICAL_PRIORITY"


# 5. Test Destination Hazard Score Condition (dest < source)
def test_destination_hazard_score_condition():
    results = relocation_engine.analyze_all_relocations()["results"]
    for r in results:
        if r["spatial_analysis_available"]:
            for cand in r["recommendations"]:
                assert cand["overall_hazard_score"] < r["source_hazard_score"]


# 6. Test Destination Vulnerability Score Condition (dest < source)
def test_destination_vulnerability_score_condition():
    results = relocation_engine.analyze_all_relocations()["results"]
    for r in results:
        if r["spatial_analysis_available"]:
            for cand in r["recommendations"]:
                assert cand["overall_vulnerability_score"] < r["source_vulnerability_score"]


# 7. Test Destination Carrying Capacity Condition (dest >= source)
def test_destination_carrying_capacity_condition():
    results = relocation_engine.analyze_all_relocations()["results"]
    for r in results:
        if r["spatial_analysis_available"]:
            for cand in r["recommendations"]:
                assert cand["overall_carrying_capacity_score"] >= r["source_carrying_capacity_score"]


# 8. Test Destination Risk Level Restriction (LOW or MODERATE)
def test_destination_risk_level_restriction():
    results = relocation_engine.analyze_all_relocations()["results"]
    for r in results:
        for cand in r["recommendations"]:
            assert cand["risk_level"] in ["LOW", "MODERATE"]


# 9. Test Spatial Availability Check for Destinations
def test_spatial_availability_check():
    results = relocation_engine.analyze_all_relocations()["results"]
    for r in results:
        for cand in r["recommendations"]:
            assert cand["latitude"] is not None
            assert cand["longitude"] is not None


# 10. Test Source Missing Spatial Coordinates Handling
def test_source_missing_spatial_coordinates_handling():
    results = relocation_engine.analyze_all_relocations()["results"]
    non_spatial = [r for r in results if not r["spatial_analysis_available"]]

    assert len(non_spatial) > 0
    for ns in non_spatial:
        assert ns["relocation_assessment_status"] == "INSUFFICIENT_SPATIAL_DATA"
        assert ns["recommendation_scope"] == "NO_RECOMMENDATION"
        assert ns["no_recommendation_available"] is True
        assert len(ns["recommendations"]) == 0
        assert "lacks GIS geographic coordinates" in ns["recommendation_reasoning"]


# 11. Test Same-State Recommendation Preference
def test_same_state_recommendation_preference():
    results = relocation_engine.analyze_all_relocations()["results"]
    same_state_recs = [r for r in results if r["recommendation_scope"] == "SAME_STATE"]

    assert len(same_state_recs) > 0
    for r in same_state_recs:
        for cand in r["recommendations"]:
            assert cand["state"] == r["source_state"]


# 12. Test Cross-State Recommendation Fallback
def test_cross_state_recommendation_fallback():
    results = relocation_engine.analyze_all_relocations()["results"]
    cross_state_recs = [r for r in results if r["recommendation_scope"] == "CROSS_STATE"]

    assert len(cross_state_recs) > 0
    for r in cross_state_recs:
        for cand in r["recommendations"]:
            assert cand["state"] != r["source_state"]


# 13. Test No Recommendation Available Handling
def test_no_recommendation_available_handling():
    results = relocation_engine.analyze_all_relocations()["results"]
    for r in results:
        if r["no_recommendation_available"]:
            assert len(r["recommendations"]) == 0
            assert r["recommendation_scope"] == "NO_RECOMMENDATION"


# 14. Test Top 5 Recommendation Count Cap
def test_top_5_recommendation_count_cap():
    results = relocation_engine.analyze_all_relocations()["results"]
    for r in results:
        assert len(r["recommendations"]) <= 5


# 15. Test Deterministic Ranking by Suitability Score
def test_deterministic_ranking_by_suitability():
    results = relocation_engine.analyze_all_relocations()["results"]
    for r in results:
        recs = r["recommendations"]
        if len(recs) > 1:
            for i in range(len(recs) - 1):
                assert recs[i]["suitability_score"] >= recs[i + 1]["suitability_score"]


# 16. Test Suitability Score Range (0 - 100)
def test_suitability_score_range():
    results = relocation_engine.analyze_all_relocations()["results"]
    for r in results:
        for cand in r["recommendations"]:
            assert 0.0 <= cand["suitability_score"] <= 100.0


# 17. Test Dynamic Weight Redistribution
def test_dynamic_weight_redistribution():
    results = relocation_engine.analyze_all_relocations()["results"]
    for r in results:
        for cand in r["recommendations"]:
            bd = cand["suitability_breakdown"]
            assert "hazard_improvement" in bd
            assert "carrying_capacity" in bd
            assert "vulnerability_improvement" in bd
            assert "geographic_proximity" in bd


# 18. Test Mandatory Disclaimer Presence
def test_mandatory_disclaimer_presence():
    all_data = relocation_engine.analyze_all_relocations()
    assert RELOCATION_DISCLAIMER in all_data["disclaimer"]
    assert RELOCATION_DISCLAIMER in all_data["summary"]["disclaimer"]
    for r in all_data["results"]:
        assert RELOCATION_DISCLAIMER in r["disclaimer"]


# 19. Test API GET /api/v1/relocation Endpoint
def test_api_get_relocation_list():
    response = client.get("/api/v1/relocation")
    assert response.status_code == 200
    data = response.json()
    assert "total_count" in data
    assert "results" in data
    assert "summary" in data
    assert "disclaimer" in data
    assert data["total_count"] == len(data["results"])


# 20. Test API GET /api/v1/relocation/priorities Endpoint
def test_api_get_relocation_priorities():
    response = client.get("/api/v1/relocation/priorities")
    assert response.status_code == 200
    data = response.json()
    assert "total_eligible_source_districts" in data
    assert "critical_priority_count" in data
    assert "high_priority_count" in data
    assert "priority_sources" in data
    assert "disclaimer" in data


# 21. Test API GET /api/v1/relocation/{district_id} Endpoint
def test_api_get_relocation_single_district():
    results = relocation_engine.analyze_all_relocations()["results"]
    valid_id = results[0]["source_district_id"]

    response = client.get(f"/api/v1/relocation/{valid_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["source_district_id"] == valid_id

    bad_response = client.get("/api/v1/relocation/INVALID_ID_999")
    assert bad_response.status_code == 404


# 22. Test API Filtering by State and Recommendation Scope
def test_api_filtering_by_state_and_scope():
    results = relocation_engine.analyze_all_relocations()["results"]
    same_state_res = [r for r in results if r["recommendation_scope"] == "SAME_STATE"]
    test_state = same_state_res[0]["source_state"]

    res = client.get(f"/api/v1/relocation?state={test_state}")
    assert res.status_code == 200
    data = res.json()
    for item in data["results"]:
        assert item["source_state"].upper() == test_state.upper()

    scope_res = client.get("/api/v1/relocation?recommendation_scope=SAME_STATE")
    assert scope_res.status_code == 200
    scope_data = scope_res.json()
    for item in scope_data["results"]:
        assert item["recommendation_scope"] == "SAME_STATE"


# 23. Test Category 1: RECOMMENDATIONS_AVAILABLE classification
def test_category_1_recommendations_available_classification():
    results = relocation_engine.analyze_all_relocations()["results"]
    available_recs = [r for r in results if r["relocation_assessment_status"] == "RECOMMENDATIONS_AVAILABLE"]

    assert len(available_recs) > 0
    for r in available_recs:
        assert r["spatial_analysis_available"] is True
        assert r["source_latitude"] is not None
        assert r["source_longitude"] is not None
        assert r["recommendation_scope"] == "SAME_STATE"
        assert r["no_recommendation_available"] is False
        assert len(r["recommendations"]) > 0


# 24. Test Category 2: CROSS_STATE_RECOMMENDATION classification
def test_category_2_cross_state_recommendation_classification():
    results = relocation_engine.analyze_all_relocations()["results"]
    cross_recs = [r for r in results if r["relocation_assessment_status"] == "CROSS_STATE_RECOMMENDATION"]

    assert len(cross_recs) > 0
    for r in cross_recs:
        assert r["spatial_analysis_available"] is True
        assert r["source_latitude"] is not None
        assert r["source_longitude"] is not None
        assert r["recommendation_scope"] == "CROSS_STATE"
        assert r["no_recommendation_available"] is False
        assert len(r["recommendations"]) > 0


# 25. Test Category 3: NO_VALID_RECOMMENDATION classification
def test_category_3_no_valid_recommendation_classification():
    results = relocation_engine.analyze_all_relocations()["results"]
    no_valid_recs = [r for r in results if r["relocation_assessment_status"] == "NO_VALID_RECOMMENDATION"]

    for r in no_valid_recs:
        assert r["spatial_analysis_available"] is True
        assert r["recommendation_scope"] == "NO_RECOMMENDATION"
        assert r["no_recommendation_available"] is True
        assert len(r["recommendations"]) == 0


# 26. Test Category 4: INSUFFICIENT_SPATIAL_DATA classification
def test_category_4_insufficient_spatial_data_classification():
    results = relocation_engine.analyze_all_relocations()["results"]
    no_spatial = [r for r in results if r["relocation_assessment_status"] == "INSUFFICIENT_SPATIAL_DATA"]

    assert len(no_spatial) > 0
    for ns in no_spatial:
        assert ns["spatial_analysis_available"] is False
        assert ns["source_latitude"] is None
        assert ns["source_longitude"] is None
        assert ns["recommendation_scope"] == "NO_RECOMMENDATION"
        assert ns["no_recommendation_available"] is True
        assert len(ns["recommendations"]) == 0


# 27. Test Mutually Exclusive Rule: Every eligible source belongs to EXACTLY ONE category
def test_mutually_exclusive_categories():
    results = relocation_engine.analyze_all_relocations()["results"]
    valid_statuses = {
        "RECOMMENDATIONS_AVAILABLE",
        "CROSS_STATE_RECOMMENDATION",
        "NO_VALID_RECOMMENDATION",
        "INSUFFICIENT_SPATIAL_DATA",
    }

    status_counts = {}
    for r in results:
        status = r["relocation_assessment_status"]
        assert status in valid_statuses
        status_counts[status] = status_counts.get(status, 0) + 1

    summary = relocation_engine.analyze_all_relocations()["summary"]
    total = summary["total_eligible_source_districts"]
    cat1 = summary["recommendations_available_count"]
    cat2 = summary["cross_state_recommendation_count"]
    cat3 = summary["no_valid_recommendation_count"]
    cat4 = summary["insufficient_spatial_data_count"]

    assert cat1 == status_counts.get("RECOMMENDATIONS_AVAILABLE", 0)
    assert cat2 == status_counts.get("CROSS_STATE_RECOMMENDATION", 0)
    assert cat3 == status_counts.get("NO_VALID_RECOMMENDATION", 0)
    assert cat4 == status_counts.get("INSUFFICIENT_SPATIAL_DATA", 0)
    assert cat1 + cat2 + cat3 + cat4 == total


# 28. Test Summary Counts Add Up to Total Eligible Sources
def test_summary_arithmetic_equality():
    summary = relocation_engine.analyze_all_relocations()["summary"]
    total = summary["total_eligible_source_districts"]
    sum_cats = (
        summary["recommendations_available_count"]
        + summary["cross_state_recommendation_count"]
        + summary["no_valid_recommendation_count"]
        + summary["insufficient_spatial_data_count"]
    )
    assert sum_cats == total
