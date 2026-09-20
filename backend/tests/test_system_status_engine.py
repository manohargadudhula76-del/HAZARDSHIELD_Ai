import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.hazard_engine import hazard_engine
from app.services.carrying_capacity_engine import carrying_capacity_engine
from app.services.vulnerability_engine import vulnerability_engine
from app.services.relocation_engine import relocation_engine
from app.services.decision_support_engine import decision_support_engine
from app.services.explainability_engine import explainability_engine
from app.services.system_integration_engine import (
    system_integration_engine,
    SystemIntegrationEngine,
)
from app.schemas.system_status import PHASE_9_DISCLAIMER

client = TestClient(app)


# 1. Test engine initialization
def test_system_integration_engine_initialization():
    engine = SystemIntegrationEngine()
    assert engine is not None
    assert system_integration_engine is not None


# 2. Test component availability detection
def test_component_availability_detection():
    report = system_integration_engine.evaluate_system()
    components = report["components"]
    assert len(components) == 7

    names = [c.component_name for c in components]
    assert any("Data Pipeline" in n for n in names)
    assert any("Hazard Assessment" in n for n in names)
    assert any("Carrying Capacity" in n for n in names)
    assert any("Vulnerability" in n for n in names)
    assert any("Relocation" in n for n in names)
    assert any("Decision Support" in n for n in names)
    assert any("Explainability" in n for n in names)

    for c in components:
        assert c.component_available is True
        assert c.component_status in ["HEALTHY", "DEGRADED", "UNAVAILABLE"]
        assert len(c.validation_message) > 0


# 3. Test component status classification
def test_component_status_classification():
    report = system_integration_engine.evaluate_system()
    summary = report["summary"]
    assert summary.total_components_checked == 7
    assert summary.healthy_components >= 6
    assert summary.unavailable_components == 0


# 4. Test integration checks execution and passed status
def test_integration_checks_execution():
    report = system_integration_engine.evaluate_system()
    checks = report["integration_checks"]
    assert len(checks) == 5

    for check in checks:
        assert check.passed is True
        assert check.records_checked == 640
        assert check.discrepancy_count == 0


# 5. Test Hazard -> Vulnerability consistency
def test_hazard_to_vulnerability_consistency():
    report = system_integration_engine.evaluate_system()
    check = next(c for c in report["integration_checks"] if c.check_id == "INT-HZ-VULN")
    assert check.passed is True
    assert check.records_checked == 640
    assert check.discrepancy_count == 0


# 6. Test Carrying Capacity -> Vulnerability consistency
def test_carrying_capacity_to_vulnerability_consistency():
    report = system_integration_engine.evaluate_system()
    check = next(c for c in report["integration_checks"] if c.check_id == "INT-CC-VULN")
    assert check.passed is True
    assert check.records_checked == 640
    assert check.discrepancy_count == 0


# 7. Test Vulnerability -> Priority rank consistency
def test_vulnerability_to_priority_consistency():
    report = system_integration_engine.evaluate_system()
    check = next(c for c in report["integration_checks"] if c.check_id == "INT-VULN-PRIO")
    assert check.passed is True
    assert check.records_checked == 640
    assert check.discrepancy_count == 0


# 8. Test Relocation -> Decision Support consistency
def test_relocation_to_decision_support_consistency():
    report = system_integration_engine.evaluate_system()
    check = next(c for c in report["integration_checks"] if c.check_id == "INT-REL-DS")
    assert check.passed is True
    assert check.records_checked == 640
    assert check.discrepancy_count == 0


# 9. Test Explainability fidelity check
def test_explainability_fidelity_consistency():
    report = system_integration_engine.evaluate_system()
    check = next(c for c in report["integration_checks"] if c.check_id == "INT-EXP-FIDELITY")
    assert check.passed is True
    assert check.records_checked == 640
    assert check.discrepancy_count == 0


# 10. Test data quality checks overall
def test_data_quality_checks_overall():
    report = system_integration_engine.evaluate_system()
    dq_checks = report["data_quality_checks"]
    assert len(dq_checks) == 6

    for dq in dq_checks:
        assert dq.passed is True
        assert dq.anomalies_detected == 0


# 11. Test district ID uniqueness (0 duplicates)
def test_district_id_uniqueness():
    report = system_integration_engine.evaluate_system()
    dq = next(d for d in report["data_quality_checks"] if d.category == "IDENTIFIER")
    assert dq.passed is True
    assert dq.anomalies_detected == 0
    assert dq.records_evaluated == 640


# 12. Test coordinate bounds (latitude and longitude ranges)
def test_coordinate_bounds_validation():
    report = system_integration_engine.evaluate_system()
    lat_dq = next(d for d in report["data_quality_checks"] if "Latitude" in d.check_name)
    lon_dq = next(d for d in report["data_quality_checks"] if "Longitude" in d.check_name)
    assert lat_dq.passed is True
    assert lat_dq.anomalies_detected == 0
    assert lon_dq.passed is True
    assert lon_dq.anomalies_detected == 0


# 13. Test spatial consistency
def test_spatial_consistency():
    report = system_integration_engine.evaluate_system()
    dq = next(d for d in report["data_quality_checks"] if "Spatial Availability" in d.check_name)
    assert dq.passed is True
    assert dq.anomalies_detected == 0


# 14. Test score bounds ([0.0, 100.0])
def test_score_bounds_validation():
    report = system_integration_engine.evaluate_system()
    dq = next(d for d in report["data_quality_checks"] if d.category == "SCORES")
    assert dq.passed is True
    assert dq.anomalies_detected == 0
    assert dq.records_evaluated == 640 * 4


# 15. Test diagnostic severity classification
def test_diagnostic_severity_classification():
    report = system_integration_engine.evaluate_system()
    diags = report["diagnostics"]
    assert len(diags) > 0
    valid_severities = {"INFO", "WARNING", "ERROR", "CRITICAL"}
    for d in diags:
        assert d.severity in valid_severities
        assert len(d.message) > 0
        assert len(d.recommendation) > 0


# 16. Test system summary arithmetic consistency
def test_system_summary_arithmetic_consistency():
    report = system_integration_engine.evaluate_system()
    summary = report["summary"]
    assert summary.total_districts == 640
    assert summary.total_components_checked == (
        summary.healthy_components + summary.degraded_components + summary.unavailable_components
    )
    assert summary.integration_checks_passed + summary.integration_checks_failed == len(report["integration_checks"])
    assert summary.data_quality_checks_passed + summary.data_quality_checks_failed == len(report["data_quality_checks"])
    assert summary.prototype_readiness_level in [
        "ANALYTICALLY_READY_FOR_PROTOTYPE_USE",
        "PARTIALLY_READY_FOR_PROTOTYPE_USE",
        "NOT_READY",
    ]


# 17. Test prototype readiness classification
def test_prototype_readiness_classification():
    report = system_integration_engine.evaluate_system()
    readiness = report["readiness"]
    assert readiness.readiness_level == "ANALYTICALLY_READY_FOR_PROTOTYPE_USE"
    assert readiness.score >= 90.0
    assert len(readiness.blocking_issues) == 0
    assert len(readiness.status_rationale) > 0


# 18. Test GET /api/v1/system-status
def test_api_get_system_status():
    response = client.get("/api/v1/system-status")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "components" in data
    assert "integration_checks" in data
    assert "data_quality_checks" in data
    assert "diagnostics" in data
    assert "readiness" in data
    assert data["disclaimer"] == PHASE_9_DISCLAIMER
    assert data["summary"]["total_districts"] == 640


# 19. Test GET /api/v1/system-status/health
def test_api_get_system_health():
    response = client.get("/api/v1/system-status/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["HEALTHY", "DEGRADED"]
    assert data["components_healthy"] >= 6
    assert data["total_components"] == 7
    assert "timestamp" in data
    assert data["disclaimer"] == PHASE_9_DISCLAIMER


# 20. Test GET /api/v1/system-status/readiness
def test_api_get_system_readiness():
    response = client.get("/api/v1/system-status/readiness")
    assert response.status_code == 200
    data = response.json()
    assert data["readiness_level"] == "ANALYTICALLY_READY_FOR_PROTOTYPE_USE"
    assert data["score"] >= 90.0
    assert len(data["blocking_issues"]) == 0
    assert data["disclaimer"] == PHASE_9_DISCLAIMER


# 21. Test GET /api/v1/system-status/diagnostics with filters
def test_api_get_system_diagnostics():
    response = client.get("/api/v1/system-status/diagnostics")
    assert response.status_code == 200
    data = response.json()
    assert data["total_count"] > 0
    assert data["filtered_count"] == data["total_count"]
    assert "severity_distribution" in data
    assert data["disclaimer"] == PHASE_9_DISCLAIMER

    # Test severity filter
    res_info = client.get("/api/v1/system-status/diagnostics?severity=INFO")
    assert res_info.status_code == 200
    data_info = res_info.json()
    for d in data_info["diagnostics"]:
        assert d["severity"] == "INFO"

    # Test component filter
    res_cc = client.get("/api/v1/system-status/diagnostics?component=Carrying")
    assert res_cc.status_code == 200
    data_cc = res_cc.json()
    for d in data_cc["diagnostics"]:
        assert "carrying" in d["component"].lower()


# 22. Test OpenAPI schema still generates successfully
def test_openapi_schema_generation():
    schema = app.openapi()
    assert schema is not None
    assert "paths" in schema
    assert "/api/v1/system-status" in schema["paths"]
    assert "/api/v1/system-status/health" in schema["paths"]
    assert "/api/v1/system-status/readiness" in schema["paths"]
    assert "/api/v1/system-status/diagnostics" in schema["paths"]


# 23. Test Phase 9 does NOT mutate prior Phase 1-8 results
def test_phase_9_does_not_mutate_prior_phases():
    hz_val = hazard_engine.analyze_all_districts()[0]["overall_hazard_score"]
    cc_val = carrying_capacity_engine.analyze_all_districts()[0]["overall_carrying_capacity_score"]
    v_val = vulnerability_engine.analyze_all_districts()[0]["overall_vulnerability_score"]
    rel_status = relocation_engine.analyze_all_relocations()["results"][0]["relocation_assessment_status"]
    ds_action = decision_support_engine.analyze_all_districts()["results"][0]["primary_intervention"]
    exp_status = explainability_engine.analyze_all_districts()["results"][0].explainability_status

    # Evaluate system integration engine
    system_integration_engine.evaluate_system(force_refresh=True)

    assert hazard_engine.analyze_all_districts()[0]["overall_hazard_score"] == hz_val
    assert carrying_capacity_engine.analyze_all_districts()[0]["overall_carrying_capacity_score"] == cc_val
    assert vulnerability_engine.analyze_all_districts()[0]["overall_vulnerability_score"] == v_val
    assert relocation_engine.analyze_all_relocations()["results"][0]["relocation_assessment_status"] == rel_status
    assert decision_support_engine.analyze_all_districts()["results"][0]["primary_intervention"] == ds_action
    assert explainability_engine.analyze_all_districts()["results"][0].explainability_status == exp_status
