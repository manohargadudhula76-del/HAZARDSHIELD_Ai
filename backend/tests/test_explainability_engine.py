import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.hazard_engine import hazard_engine
from app.services.carrying_capacity_engine import carrying_capacity_engine
from app.services.vulnerability_engine import vulnerability_engine
from app.services.relocation_engine import relocation_engine
from app.services.decision_support_engine import decision_support_engine
from app.services.explainability_engine import (
    explainability_engine,
    PHASE_8_DISCLAIMER,
)

client = TestClient(app)


# 1. Test explainability generation for all 640 districts
def test_explainability_generation_all_districts():
    data = explainability_engine.analyze_all_districts()
    assert data["total_count"] == 640
    results = data["results"]
    assert len(results) == 640

    sample = results[0]
    assert sample.district_id is not None
    assert sample.state is not None
    assert sample.district is not None
    assert sample.analytical_level == "district"
    assert sample.hazard_summary is not None
    assert sample.carrying_capacity_summary is not None
    assert sample.vulnerability_summary is not None
    assert sample.relocation_summary is not None
    assert sample.intervention_summary is not None
    assert sample.top_contributing_factors is not None
    assert sample.score_contributions is not None
    assert sample.data_completeness_summary is not None
    assert sample.confidence_summary is not None
    assert sample.spatial_data_status is not None
    assert sample.decision_trace is not None
    assert sample.explainability_status in ["COMPLETE", "PARTIAL", "LIMITED"]
    assert sample.disclaimer == PHASE_8_DISCLAIMER


# 2. Test valid single district explanation retrieval
def test_valid_district_explanation():
    data = explainability_engine.analyze_all_districts()
    target_id = data["results"][0].district_id
    report = explainability_engine.get_district_explanation(target_id)
    assert report is not None
    assert report.district_id == target_id
    assert report.state == data["results"][0].state
    assert report.district == data["results"][0].district


# 3. Test invalid district handling returns None in engine and 404 in API
def test_invalid_district_handling():
    report = explainability_engine.get_district_explanation("INVALID_DISTRICT_XYZ_999")
    assert report is None

    response = client.get("/api/v1/explainability/INVALID_DISTRICT_XYZ_999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


# 4. Test hazard summary correctness matches Phase 3
def test_hazard_summary_correctness():
    hz_list = hazard_engine.analyze_all_districts()
    hz_map = {h["district_id"]: h for h in hz_list}

    data = explainability_engine.analyze_all_districts()
    for exp in data["results"][:20]:
        hz = hz_map[exp.district_id]
        assert exp.hazard_summary.overall_hazard_score == float(hz["overall_hazard_score"])
        assert exp.hazard_summary.risk_level == hz["risk_level"]
        assert isinstance(exp.hazard_summary.key_drivers, list)
        assert len(exp.hazard_summary.key_drivers) > 0


# 5. Test carrying capacity summary correctness matches Phase 4
def test_carrying_capacity_summary_correctness():
    cc_list = carrying_capacity_engine.analyze_all_districts()
    cc_map = {c["district_id"]: c for c in cc_list}

    data = explainability_engine.analyze_all_districts()
    for exp in data["results"][:20]:
        cc = cc_map[exp.district_id]
        assert exp.carrying_capacity_summary.overall_carrying_capacity_score == float(cc["overall_carrying_capacity_score"])
        assert exp.carrying_capacity_summary.carrying_capacity_level == cc["carrying_capacity_level"]
        assert exp.carrying_capacity_summary.available_sectors == cc["available_sectors"]
        assert exp.carrying_capacity_summary.missing_sectors == cc["missing_sectors"]
        assert isinstance(exp.carrying_capacity_summary.key_drivers, list)


# 6. Test vulnerability summary correctness matches Phase 5
def test_vulnerability_summary_correctness():
    v_list = vulnerability_engine.analyze_all_districts()
    v_map = {v["district_id"]: v for v in v_list}

    data = explainability_engine.analyze_all_districts()
    for exp in data["results"][:20]:
        v = v_map[exp.district_id]
        assert exp.vulnerability_summary.overall_vulnerability_score == float(v["overall_vulnerability_score"])
        assert exp.vulnerability_summary.vulnerability_level == v["vulnerability_level"]
        assert exp.vulnerability_summary.priority_index == float(v["priority_index"])
        assert exp.vulnerability_summary.priority_level == v["priority_level"]
        assert exp.vulnerability_summary.priority_rank == v["priority_rank"]
        assert exp.vulnerability_summary.available_components == v["available_components"]
        assert exp.vulnerability_summary.missing_components == v["missing_components"]


# 7. Test relocation explanation accuracy and standard texts
def test_relocation_explanation_correctness():
    data = explainability_engine.analyze_all_districts()
    for exp in data["results"]:
        rel = exp.relocation_summary
        status = rel.relocation_assessment_status
        assert status in [
            "RECOMMENDATIONS_AVAILABLE",
            "CROSS_STATE_RECOMMENDATION",
            "NO_VALID_RECOMMENDATION",
            "INSUFFICIENT_SPATIAL_DATA",
            "NOT_APPLICABLE",
        ]

        if status == "RECOMMENDATIONS_AVAILABLE":
            assert "Eligible destination districts satisfying the analytical relocation constraints were identified within the same state." in rel.explanation
        elif status == "CROSS_STATE_RECOMMENDATION":
            assert "No eligible same-state destination was identified under the current analytical constraints; eligible cross-state candidates were identified." in rel.explanation
        elif status == "NO_VALID_RECOMMENDATION":
            assert "No destination district satisfied all current analytical eligibility constraints." in rel.explanation
        elif status == "INSUFFICIENT_SPATIAL_DATA":
            assert "Relocation distance analysis could not be completed because required source geographic coordinates are unavailable." in rel.explanation
        elif status == "NOT_APPLICABLE":
            assert "Relocation analysis was not triggered" in rel.explanation


# 8. Test all four Phase 6.1 relocation statuses where present in dataset
def test_all_four_relocation_statuses_represented():
    data = explainability_engine.analyze_all_districts()
    statuses = {exp.relocation_summary.relocation_assessment_status for exp in data["results"]}
    
    # We must have candidates for the applicable categories in the 640 districts
    assert "RECOMMENDATIONS_AVAILABLE" in statuses
    assert "CROSS_STATE_RECOMMENDATION" in statuses
    assert "INSUFFICIENT_SPATIAL_DATA" in statuses
    assert "NOT_APPLICABLE" in statuses


# 9. Test decision trace structure (exactly 6 steps in sequential order)
def test_decision_trace_generation():
    data = explainability_engine.analyze_all_districts()
    sample = data["results"][0]
    trace = sample.decision_trace
    assert len(trace) == 6

    step_phases = [
        (1, "Hazard Assessment", "Phase 3"),
        (2, "Carrying Capacity Assessment", "Phase 4"),
        (3, "Vulnerability Assessment", "Phase 5"),
        (4, "Priority Assessment", "Phase 5"),
        (5, "Relocation Assessment", "Phase 6"),
        (6, "Intervention Decision", "Phase 7"),
    ]

    for item, (expected_step, expected_name, expected_phase) in zip(trace, step_phases):
        assert item.step == expected_step
        assert item.assessment == expected_name
        assert item.source_phase == expected_phase
        assert len(item.result) > 0


# 10. Test score contribution arithmetic where contributions are available
def test_score_contribution_arithmetic():
    data = explainability_engine.analyze_all_districts()
    for exp in data["results"][:20]:
        sc = exp.score_contributions

        # 1. Vulnerability contributions
        v_contrib = sc.vulnerability_contributions
        assert v_contrib.contribution_available is True
        for item in v_contrib.items:
            if item.score is not None and item.weight is not None:
                expected = round(item.score * item.weight, 2)
                assert abs(item.weighted_contribution - expected) <= 0.02

        # 2. Carrying capacity contributions
        cc_contrib = sc.carrying_capacity_contributions
        assert cc_contrib.contribution_available is True
        for item in cc_contrib.items:
            if item.score is not None and item.weight is not None:
                expected = round(item.score * item.weight, 2)
                assert abs(item.weighted_contribution - expected) <= 0.02

        # 3. Hazard contributions: zero-fabrication safety rule
        hz_contrib = sc.hazard_contributions
        assert hz_contrib.contribution_available is False
        assert "zero-fabrication" in hz_contrib.reason.lower() or "not expose" in hz_contrib.reason.lower()
        assert len(hz_contrib.items) == 0


# 11. Test missing data handling
def test_missing_data_reporting():
    data = explainability_engine.analyze_all_districts()
    for exp in data["results"][:10]:
        comp_summary = exp.data_completeness_summary
        assert isinstance(comp_summary.missing_capacity_sectors, list)
        assert len(comp_summary.missing_capacity_sectors) == 4  # education, water, shelter, road_evacuation
        assert isinstance(comp_summary.missing_hazard_data, list)
        assert isinstance(comp_summary.missing_vulnerability_components, list)
        assert len(exp.missing_data_limitations) > 0


# 12. Test INSUFFICIENT_SPATIAL_DATA handling
def test_insufficient_spatial_data_handling():
    data = explainability_engine.analyze_all_districts()
    missing_coords = [
        exp for exp in data["results"]
        if exp.spatial_data_status.coordinates_present is False
    ]
    assert len(missing_coords) > 0
    for exp in missing_coords:
        assert exp.spatial_data_status.spatial_analysis_available is False
        assert exp.spatial_data_status.latitude is None
        assert exp.spatial_data_status.longitude is None
        assert exp.explainability_status == "LIMITED"
        if exp.relocation_summary.relocation_assessment_status != "NOT_APPLICABLE":
            assert exp.relocation_summary.relocation_assessment_status == "INSUFFICIENT_SPATIAL_DATA"


# 13. Test explainability status classification (all 3 statuses exist)
def test_explainability_status_classification():
    data = explainability_engine.analyze_all_districts()
    statuses = {exp.explainability_status for exp in data["results"]}
    assert "COMPLETE" in statuses
    assert "PARTIAL" in statuses
    assert "LIMITED" in statuses

    summary = data["summary"]
    assert summary.explainability_status_distribution["COMPLETE"] > 0
    assert summary.explainability_status_distribution["PARTIAL"] > 0
    assert summary.explainability_status_distribution["LIMITED"] > 0
    assert (
        summary.explainability_status_distribution["COMPLETE"]
        + summary.explainability_status_distribution["PARTIAL"]
        + summary.explainability_status_distribution["LIMITED"]
    ) == 640


# 14. Test priority ordering
def test_priority_ordering():
    data = explainability_engine.analyze_all_districts()
    priorities = data["priorities"]
    assert len(priorities) == 640

    order_map = {
        "CRITICAL_PRIORITY": 0,
        "HIGH_PRIORITY": 1,
        "MODERATE_PRIORITY": 2,
        "LOW_PRIORITY": 3,
    }

    for i in range(len(priorities) - 1):
        curr_lvl = priorities[i].vulnerability_summary.priority_level
        next_lvl = priorities[i + 1].vulnerability_summary.priority_level

        curr_rank_tier = order_map[curr_lvl]
        next_rank_tier = order_map[next_lvl]

        assert curr_rank_tier <= next_rank_tier
        if curr_rank_tier == next_rank_tier:
            assert priorities[i].vulnerability_summary.priority_index >= priorities[i + 1].vulnerability_summary.priority_index


# 15. Test API endpoints
def test_api_endpoints():
    # 1. GET /api/v1/explainability
    res1 = client.get("/api/v1/explainability")
    assert res1.status_code == 200
    json1 = res1.json()
    assert json1["total_count"] == 640
    assert len(json1["results"]) == 640
    assert "summary" in json1
    assert json1["disclaimer"] == PHASE_8_DISCLAIMER

    # 2. GET /api/v1/explainability with filters
    res2 = client.get("/api/v1/explainability?explainability_status=COMPLETE")
    assert res2.status_code == 200
    json2 = res2.json()
    assert json2["total_count"] > 0
    for r in json2["results"]:
        assert r["explainability_status"] == "COMPLETE"

    # 3. GET /api/v1/explainability/priorities
    res3 = client.get("/api/v1/explainability/priorities")
    assert res3.status_code == 200
    json3 = res3.json()
    assert json3["total_count"] == 640
    first_item = json3["results"][0]
    assert first_item["vulnerability_summary"]["priority_level"] == "CRITICAL_PRIORITY"

    # 4. GET /api/v1/explainability/{district_id}
    target_id = json1["results"][0]["district_id"]
    res4 = client.get(f"/api/v1/explainability/{target_id}")
    assert res4.status_code == 200
    json4 = res4.json()
    assert json4["district_id"] == target_id
    assert json4["disclaimer"] == PHASE_8_DISCLAIMER


# 16. Test mandatory disclaimer presence
def test_mandatory_disclaimer_presence():
    data = explainability_engine.analyze_all_districts()
    assert data["disclaimer"] == PHASE_8_DISCLAIMER
    assert data["summary"].disclaimer == PHASE_8_DISCLAIMER
    for exp in data["results"][:10]:
        assert exp.disclaimer == PHASE_8_DISCLAIMER


# 17. Test Phase 8 does NOT mutate existing Phase 3-7 results
def test_phase_8_does_not_mutate_prior_phases():
    # Capture results before explainability
    hz_before = hazard_engine.analyze_all_districts()[0]["overall_hazard_score"]
    cc_before = carrying_capacity_engine.analyze_all_districts()[0]["overall_carrying_capacity_score"]
    v_before = vulnerability_engine.analyze_all_districts()[0]["overall_vulnerability_score"]
    rel_before = relocation_engine.analyze_all_relocations()["results"][0]["relocation_assessment_status"]
    ds_before = decision_support_engine.analyze_all_districts()["results"][0]["primary_intervention"]

    # Run explainability engine
    explainability_engine.analyze_all_districts()

    # Capture results after explainability
    hz_after = hazard_engine.analyze_all_districts()[0]["overall_hazard_score"]
    cc_after = carrying_capacity_engine.analyze_all_districts()[0]["overall_carrying_capacity_score"]
    v_after = vulnerability_engine.analyze_all_districts()[0]["overall_vulnerability_score"]
    rel_after = relocation_engine.analyze_all_relocations()["results"][0]["relocation_assessment_status"]
    ds_after = decision_support_engine.analyze_all_districts()["results"][0]["primary_intervention"]

    assert hz_before == hz_after
    assert cc_before == cc_after
    assert v_before == v_after
    assert rel_before == rel_after
    assert ds_before == ds_after
