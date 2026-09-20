import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.decision_support_engine import (
    decision_support_engine,
    DECISION_SUPPORT_DISCLAIMER,
)

client = TestClient(app)


# 1. Test all districts receive exactly ONE primary intervention
def test_all_districts_receive_exactly_one_primary_intervention():
    results = decision_support_engine.analyze_all_districts()["results"]
    assert len(results) == 640
    for r in results:
        assert "primary_intervention" in r
        assert r["primary_intervention"] is not None
        assert isinstance(r["primary_intervention"], str)


# 2. Test all intervention categories are valid
def test_all_intervention_categories_valid():
    valid_categories = {
        "IMMEDIATE_RELOCATION_ASSESSMENT",
        "HIGH_PRIORITY_MITIGATION",
        "CAPACITY_BUILDING_REQUIRED",
        "VULNERABILITY_REDUCTION",
        "MONITOR_AND_PREPARE",
        "ROUTINE_RESILIENCE_PLANNING",
    }
    results = decision_support_engine.analyze_all_districts()["results"]
    for r in results:
        assert r["primary_intervention"] in valid_categories


# 3. Test priority mapping is correct (1-to-1 transparent mapping)
def test_priority_mapping_correct():
    results = decision_support_engine.analyze_all_districts()["results"]
    mapping = {
        "CRITICAL_PRIORITY": "CRITICAL_INTERVENTION",
        "HIGH_PRIORITY": "HIGH_INTERVENTION",
        "MODERATE_PRIORITY": "MODERATE_INTERVENTION",
        "LOW_PRIORITY": "LOW_INTERVENTION",
    }
    for r in results:
        expected = mapping.get(r["priority_level"])
        assert r["intervention_priority_level"] == expected


# 4. Test IMMEDIATE_RELOCATION_ASSESSMENT logic
def test_immediate_relocation_assessment_logic():
    results = decision_support_engine.analyze_all_districts()["results"]
    reloc_districts = [r for r in results if r["primary_intervention"] == "IMMEDIATE_RELOCATION_ASSESSMENT"]

    assert len(reloc_districts) > 0
    for r in reloc_districts:
        assert r["priority_level"] == "CRITICAL_PRIORITY"
        assert r["overall_hazard_score"] >= 30.0 or r["risk_level"] in ["MODERATE", "HIGH", "CRITICAL"]
        assert r["relocation_status"] in ["RECOMMENDATIONS_AVAILABLE", "CROSS_STATE_RECOMMENDATION"]
        assert "Conduct detailed ground-level habitation assessment" in r["recommended_actions"]


# 5. Test HIGH_PRIORITY_MITIGATION logic
def test_high_priority_mitigation_logic():
    results = decision_support_engine.analyze_all_districts()["results"]
    mitigation_districts = [r for r in results if r["primary_intervention"] == "HIGH_PRIORITY_MITIGATION"]

    assert len(mitigation_districts) > 0
    for r in mitigation_districts:
        assert r["priority_level"] in ["CRITICAL_PRIORITY", "HIGH_PRIORITY"]
        assert "Strengthen local disaster preparedness" in r["recommended_actions"]


# 6. Test CAPACITY_BUILDING_REQUIRED logic
def test_capacity_building_required_logic():
    results = decision_support_engine.analyze_all_districts()["results"]
    cap_districts = [r for r in results if r["primary_intervention"] == "CAPACITY_BUILDING_REQUIRED"]

    assert len(cap_districts) > 0
    for r in cap_districts:
        assert r["priority_level"] not in ["CRITICAL_PRIORITY", "HIGH_PRIORITY"]
        assert "Improve healthcare accessibility" in r["recommended_actions"]


# 7. Test VULNERABILITY_REDUCTION logic
def test_vulnerability_reduction_logic():
    results = decision_support_engine.analyze_all_districts()["results"]
    vuln_districts = [r for r in results if r["primary_intervention"] == "VULNERABILITY_REDUCTION"]

    for r in vuln_districts:
        assert r["vulnerability_level"] in ["CRITICAL_VULNERABILITY", "HIGH_VULNERABILITY"]
        assert "Improve vulnerable household support" in r["recommended_actions"]


# 8. Test MONITOR_AND_PREPARE logic
def test_monitor_and_prepare_logic():
    results = decision_support_engine.analyze_all_districts()["results"]
    monitor_districts = [r for r in results if r["primary_intervention"] == "MONITOR_AND_PREPARE"]

    for r in monitor_districts:
        assert r["priority_level"] == "MODERATE_PRIORITY" or r["risk_level"] == "MODERATE"
        assert "Monitor hazard indicators" in r["recommended_actions"]


# 9. Test ROUTINE_RESILIENCE_PLANNING logic
def test_routine_resilience_planning_logic():
    results = decision_support_engine.analyze_all_districts()["results"]
    routine_districts = [r for r in results if r["primary_intervention"] == "ROUTINE_RESILIENCE_PLANNING"]

    assert len(routine_districts) > 0
    for r in routine_districts:
        assert r["priority_level"] == "LOW_PRIORITY"
        assert "Continue resilience planning" in r["recommended_actions"]


# 10. Test no fabricated data is introduced
def test_no_fabricated_data():
    results = decision_support_engine.analyze_all_districts()["results"]
    for r in results:
        assert r["district_id"] is not None
        assert r["state"] is not None
        assert r["district"] is not None
        assert 0.0 <= r["decision_data_completeness_score"] <= 1.0
        assert r["decision_confidence"] in ["HIGH", "MEDIUM", "LOW"]


# 11. Test API GET /api/v1/decision-support List endpoint
def test_api_list_endpoint():
    response = client.get("/api/v1/decision-support")
    assert response.status_code == 200
    data = response.json()
    assert "total_count" in data
    assert "results" in data
    assert "summary" in data
    assert "disclaimer" in data
    assert data["total_count"] == 640


# 12. Test API Filtering by state, priority, and primary intervention
def test_api_filtering():
    response = client.get("/api/v1/decision-support?primary_intervention=IMMEDIATE_RELOCATION_ASSESSMENT")
    assert response.status_code == 200
    data = response.json()
    for item in data["results"]:
        assert item["primary_intervention"] == "IMMEDIATE_RELOCATION_ASSESSMENT"

    p_response = client.get("/api/v1/decision-support?intervention_priority_level=CRITICAL_INTERVENTION")
    assert p_response.status_code == 200
    p_data = p_response.json()
    for item in p_data["results"]:
        assert item["intervention_priority_level"] == "CRITICAL_INTERVENTION"


# 13. Test API GET /api/v1/decision-support/{district_id} Single district endpoint
def test_api_single_district_endpoint():
    results = decision_support_engine.analyze_all_districts()["results"]
    target_id = results[0]["district_id"]

    response = client.get(f"/api/v1/decision-support/{target_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["district_id"] == target_id
    assert "primary_intervention" in data
    assert "intervention_priority_level" in data
    assert "recommended_actions" in data


# 14. Test API GET /api/v1/decision-support/priorities Priority endpoint ordering
def test_api_priority_endpoint_ordering():
    response = client.get("/api/v1/decision-support/priorities")
    assert response.status_code == 200
    data = response.json()
    results = data["results"]
    assert len(results) == 640

    priority_map = {"CRITICAL_INTERVENTION": 0, "HIGH_INTERVENTION": 1, "MODERATE_INTERVENTION": 2, "LOW_INTERVENTION": 3}
    for i in range(len(results) - 1):
        curr_p = priority_map[results[i]["intervention_priority_level"]]
        next_p = priority_map[results[i + 1]["intervention_priority_level"]]
        assert curr_p <= next_p


# 15. Test Invalid district IDs return 404 error
def test_invalid_district_id_handling():
    response = client.get("/api/v1/decision-support/INVALID_DISTRICT_9999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


# 16. Test mandatory disclaimer presence in all responses
def test_mandatory_disclaimer_presence():
    all_data = decision_support_engine.analyze_all_districts()
    assert DECISION_SUPPORT_DISCLAIMER in all_data["disclaimer"]
    assert DECISION_SUPPORT_DISCLAIMER in all_data["summary"]["disclaimer"]
    for r in all_data["results"]:
        assert DECISION_SUPPORT_DISCLAIMER in r["disclaimer"]
