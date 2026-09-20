import csv
import io
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.hazard_engine import hazard_engine
from app.services.carrying_capacity_engine import carrying_capacity_engine
from app.services.vulnerability_engine import vulnerability_engine
from app.services.relocation_engine import relocation_engine
from app.services.decision_support_engine import decision_support_engine
from app.services.explainability_engine import explainability_engine
from app.services.system_integration_engine import system_integration_engine
from app.services.dossier_engine import dossier_engine, DossierEngine
from app.services.export_engine import export_engine, ExportEngine
from app.schemas.dossier import PHASE_10_DISCLAIMER

client = TestClient(app)


# 1. Valid district dossier returns successfully
def test_valid_district_dossier_returns_successfully():
    response = client.get("/api/v1/dossier/DIST_IND_345")
    assert response.status_code == 200
    data = response.json()

    assert "identity" in data
    assert "hazard" in data
    assert "carrying_capacity" in data
    assert "vulnerability" in data
    assert "relocation" in data
    assert "decision_support" in data
    assert "explainability" in data
    assert "disclaimer" in data

    assert data["identity"]["district_id"] == "DIST_IND_345"
    assert data["identity"]["district"] == "Purba Medinipur"
    assert data["identity"]["state"] == "WEST BENGAL"
    assert data["disclaimer"] == PHASE_10_DISCLAIMER


# 2. Invalid district ID returns 404
def test_invalid_district_id_returns_404():
    response = client.get("/api/v1/dossier/NON_EXISTENT_ID_99999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


# 3. Dossier hazard values match Phase 3 output
def test_dossier_hazard_values_match_phase3():
    hz_list = hazard_engine.analyze_all_districts()
    hz_345 = next(h for h in hz_list if h["district_id"] == "DIST_IND_345")

    dossier = dossier_engine.get_district_dossier("DIST_IND_345")
    assert dossier is not None
    assert abs(dossier.hazard.overall_hazard_score - float(hz_345["overall_hazard_score"])) < 0.001
    assert dossier.hazard.risk_level == hz_345["risk_level"]
    assert dossier.hazard.analysis_confidence == hz_345["analysis_confidence"]


# 4. Dossier capacity values match Phase 4 output
def test_dossier_capacity_values_match_phase4():
    cc_list = carrying_capacity_engine.analyze_all_districts()
    cc_345 = next(c for c in cc_list if c["district_id"] == "DIST_IND_345")

    dossier = dossier_engine.get_district_dossier("DIST_IND_345")
    assert dossier is not None
    assert abs(dossier.carrying_capacity.overall_carrying_capacity_score - float(cc_345["overall_carrying_capacity_score"])) < 0.001
    assert dossier.carrying_capacity.carrying_capacity_level == cc_345["carrying_capacity_level"]
    assert set(dossier.carrying_capacity.available_sectors) == set(cc_345["available_sectors"])


# 5. Dossier vulnerability values match Phase 5 output
def test_dossier_vulnerability_values_match_phase5():
    v_list = vulnerability_engine.analyze_all_districts()
    v_345 = next(v for v in v_list if v["district_id"] == "DIST_IND_345")

    dossier = dossier_engine.get_district_dossier("DIST_IND_345")
    assert dossier is not None
    assert abs(dossier.vulnerability.overall_vulnerability_score - float(v_345["overall_vulnerability_score"])) < 0.001
    assert dossier.vulnerability.vulnerability_level == v_345["vulnerability_level"]


# 6. Dossier priority values match Phase 5 output
def test_dossier_priority_values_match_phase5():
    v_list = vulnerability_engine.analyze_all_districts()
    v_345 = next(v for v in v_list if v["district_id"] == "DIST_IND_345")

    dossier = dossier_engine.get_district_dossier("DIST_IND_345")
    assert dossier is not None
    assert abs(dossier.vulnerability.priority_index - float(v_345["priority_index"])) < 0.001
    assert dossier.vulnerability.priority_level == v_345["priority_level"]
    assert dossier.vulnerability.priority_rank == v_345["priority_rank"]
    assert dossier.vulnerability.priority_rank == 1


# 7. Dossier relocation status matches Phase 6 output
def test_dossier_relocation_status_matches_phase6():
    rel_data = relocation_engine.analyze_all_relocations()
    rel_345 = next((r for r in rel_data["results"] if r["source_district_id"] == "DIST_IND_345"), None)

    dossier = dossier_engine.get_district_dossier("DIST_IND_345")
    assert dossier is not None
    if rel_345 is not None:
        assert dossier.relocation.relocation_assessment_status == rel_345["relocation_assessment_status"]
        assert dossier.relocation.no_recommendation_available == rel_345["no_recommendation_available"]
    else:
        assert dossier.relocation.relocation_assessment_status == "NOT_APPLICABLE"


# 8. Dossier intervention matches Phase 7 output
def test_dossier_intervention_matches_phase7():
    ds_data = decision_support_engine.analyze_all_districts()
    ds_345 = next(d for d in ds_data["results"] if d["district_id"] == "DIST_IND_345")

    dossier = dossier_engine.get_district_dossier("DIST_IND_345")
    assert dossier is not None
    assert dossier.decision_support.primary_intervention == ds_345["primary_intervention"]
    assert dossier.decision_support.intervention_priority_level == ds_345["intervention_priority_level"]
    assert len(dossier.decision_support.recommended_actions) > 0


# 9. National briefing returns successfully
def test_national_briefing_returns_successfully():
    response = client.get("/api/v1/dossier/briefing/national")
    assert response.status_code == 200
    data = response.json()

    assert data["total_districts_analyzed"] == 640
    assert "hazard_risk_distribution" in data
    assert "vulnerability_distribution" in data
    assert "priority_distribution" in data
    assert "intervention_distribution" in data
    assert "relocation_category_distribution" in data
    assert data["critical_priority_districts_count"] >= 1
    assert data["high_priority_districts_count"] >= 1

    assert "system_health" in data
    assert data["system_health"]["overall_system_status"] in ["HEALTHY", "DEGRADED"]
    assert data["system_health"]["prototype_readiness_level"] == "ANALYTICALLY_READY_FOR_PROTOTYPE_USE"
    assert len(data["top_intervention_priority_districts"]) == 10
    assert data["disclaimer"] == PHASE_10_DISCLAIMER


# 10. State briefing returns successfully for a valid state
def test_state_briefing_returns_successfully_for_valid_state():
    # Exact case
    r1 = client.get("/api/v1/dossier/briefing/state/WEST%20BENGAL")
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["state"] == "WEST BENGAL"
    assert d1["total_districts"] == 19
    assert len(d1["top_priority_districts"]) > 0
    assert d1["top_priority_districts"][0]["district"] == "Purba Medinipur"

    # Lowercase test (case-insensitive)
    r2 = client.get("/api/v1/dossier/briefing/state/west%20bengal")
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["state"] == "WEST BENGAL"
    assert d2["total_districts"] == 19


# 11. Invalid state returns 404
def test_invalid_state_returns_404():
    response = client.get("/api/v1/dossier/briefing/state/FICTIONAL_STATE_XYZ")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


# 12. CSV export returns valid CSV
def test_csv_export_returns_valid_csv():
    response = client.get("/api/v1/dossier/export/csv")
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")
    assert "Content-Disposition" in response.headers
    assert "hazardshield_district_dossier_summary.csv" in response.headers["Content-Disposition"]

    content = response.text
    assert len(content) > 0


# 13. CSV contains expected district records and columns
def test_csv_contains_expected_records_and_columns():
    response = client.get("/api/v1/dossier/export/csv")
    assert response.status_code == 200

    reader = list(csv.reader(io.StringIO(response.text)))
    # 1 header line + 640 district lines = 641 lines
    assert len(reader) == 641

    headers = reader[0]
    expected_cols = [
        "district_id",
        "state",
        "district",
        "latitude",
        "longitude",
        "overall_hazard_score",
        "risk_level",
        "overall_carrying_capacity_score",
        "overall_vulnerability_score",
        "vulnerability_level",
        "priority_index",
        "priority_level",
        "priority_rank",
        "primary_intervention",
        "intervention_priority_level",
        "relocation_assessment_status",
        "spatial_analysis_available",
    ]
    for col in expected_cols:
        assert col in headers

    # Verify first data row
    first_row = reader[1]
    assert len(first_row) == len(headers)
    assert first_row[0].startswith("DIST_IND_")


# 14. GeoJSON export is a valid FeatureCollection
def test_geojson_export_is_valid_feature_collection():
    response = client.get("/api/v1/dossier/export/geojson")
    assert response.status_code == 200
    data = response.json()

    assert data["type"] == "FeatureCollection"
    assert "metadata" in data
    assert "features" in data
    assert data["metadata"]["total_districts"] == 640
    assert data["metadata"]["features_count"] == len(data["features"])
    assert data["metadata"]["features_count"] > 500
    assert data["disclaimer"] == PHASE_10_DISCLAIMER


# 15. GeoJSON coordinates follow [longitude, latitude]
def test_geojson_coordinates_follow_longitude_latitude():
    response = client.get("/api/v1/dossier/export/geojson")
    assert response.status_code == 200
    features = response.json()["features"]

    assert len(features) > 0
    for feat in features[:50]:  # Sample check 50 features
        assert feat["type"] == "Feature"
        geom = feat["geometry"]
        assert geom["type"] == "Point"
        coords = geom["coordinates"]
        assert len(coords) == 2
        lon, lat = coords[0], coords[1]

        # Valid India centroid coordinates: Longitude ~68°E to ~98°E, Latitude ~6°N to ~38°N
        assert 68.0 <= lon <= 98.0, f"Invalid longitude: {lon}"
        assert 6.0 <= lat <= 38.0, f"Invalid latitude: {lat}"


# 16. Districts without spatial coordinates are not fabricated into GeoJSON
def test_districts_without_spatial_coordinates_not_fabricated():
    response = client.get("/api/v1/dossier/export/geojson")
    assert response.status_code == 200
    data = response.json()

    features_count = data["metadata"]["features_count"]
    excluded_count = data["metadata"]["excluded_missing_coordinates_count"]

    assert features_count == 579
    assert excluded_count == 61
    assert features_count + excluded_count == 640

    # Ensure no coordinate is dummy (0.0, 0.0) or null
    for feat in data["features"]:
        coords = feat["geometry"]["coordinates"]
        assert coords[0] != 0.0
        assert coords[1] != 0.0
        assert coords[0] is not None
        assert coords[1] is not None


# 17. Static routes do not collide with /{district_id}
def test_static_routes_do_not_collide_with_district_id():
    # /briefing/national must not be interpreted as district_id="briefing"
    r_national = client.get("/api/v1/dossier/briefing/national")
    assert r_national.status_code == 200
    assert "total_districts_analyzed" in r_national.json()

    # /export/summary must not be interpreted as district_id="export"
    r_summary = client.get("/api/v1/dossier/export/summary")
    assert r_summary.status_code == 200
    assert "districts" in r_summary.json()

    # /export/csv must not be interpreted as district_id="export"
    r_csv = client.get("/api/v1/dossier/export/csv")
    assert r_csv.status_code == 200
    assert "text/csv" in r_csv.headers["content-type"]

    # /export/geojson must not be interpreted as district_id="export"
    r_geojson = client.get("/api/v1/dossier/export/geojson")
    assert r_geojson.status_code == 200
    assert r_geojson.json()["type"] == "FeatureCollection"


# 18. Phase 10 does not mutate Phase 1-9 outputs
def test_phase10_does_not_mutate_phase1_9_outputs():
    # 1. Capture snapshot of Phase 3-7 values for a sample of districts
    sample_ids = ["DIST_IND_001", "DIST_IND_100", "DIST_IND_345", "DIST_IND_500"]

    pre_hz = {h["district_id"]: h["overall_hazard_score"] for h in hazard_engine.analyze_all_districts() if h["district_id"] in sample_ids}
    pre_v = {v["district_id"]: (v["overall_vulnerability_score"], v["priority_index"], v["priority_rank"]) for v in vulnerability_engine.analyze_all_districts() if v["district_id"] in sample_ids}
    pre_ds = {d["district_id"]: (d["primary_intervention"], d["intervention_priority_level"]) for d in decision_support_engine.analyze_all_districts()["results"] if d["district_id"] in sample_ids}

    # 2. Invoke Phase 10 dossier engine, exports, and briefings
    for sid in sample_ids:
        _ = dossier_engine.get_district_dossier(sid)
    _ = dossier_engine.get_national_briefing()
    _ = dossier_engine.get_state_briefing("WEST BENGAL")
    _ = export_engine.get_export_summary()
    _ = export_engine.generate_csv_data()
    _ = export_engine.generate_geojson()

    # 3. Re-verify Phase 3-7 values are identical
    post_hz = {h["district_id"]: h["overall_hazard_score"] for h in hazard_engine.analyze_all_districts() if h["district_id"] in sample_ids}
    post_v = {v["district_id"]: (v["overall_vulnerability_score"], v["priority_index"], v["priority_rank"]) for v in vulnerability_engine.analyze_all_districts() if v["district_id"] in sample_ids}
    post_ds = {d["district_id"]: (d["primary_intervention"], d["intervention_priority_level"]) for d in decision_support_engine.analyze_all_districts()["results"] if d["district_id"] in sample_ids}

    assert pre_hz == post_hz
    assert pre_v == post_v
    assert pre_ds == post_ds


# 19. Test summary export endpoint structure
def test_dossier_summary_export_endpoint():
    response = client.get("/api/v1/dossier/export/summary")
    assert response.status_code == 200
    data = response.json()

    assert data["total_districts"] == 640
    assert len(data["districts"]) == 640
    assert data["disclaimer"] == PHASE_10_DISCLAIMER

    first_item = data["districts"][0]
    assert first_item["priority_rank"] == 1
    assert len(first_item["primary_intervention"]) > 0


# 20. Test handling of districts with insufficient spatial data
def test_dossier_insufficient_spatial_data_handling():
    dossiers = dossier_engine.get_all_dossiers()
    missing_spatial_dossier = next((d for d in dossiers.values() if not d.identity.spatial_analysis_available), None)

    assert missing_spatial_dossier is not None
    did = missing_spatial_dossier.identity.district_id

    response = client.get(f"/api/v1/dossier/{did}")
    assert response.status_code == 200
    d_data = response.json()

    assert d_data["identity"]["spatial_analysis_available"] is False
    assert d_data["identity"]["latitude"] is None
    assert d_data["identity"]["longitude"] is None
    assert d_data["relocation"]["relocation_assessment_status"] in ["INSUFFICIENT_SPATIAL_DATA", "NOT_APPLICABLE"]
