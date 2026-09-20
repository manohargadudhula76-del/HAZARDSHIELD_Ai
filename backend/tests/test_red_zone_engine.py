import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.red_zone_engine import red_zone_engine

client = TestClient(app)


def test_zone_type_classification_rules():
    all_classified = red_zone_engine.classify_all_zones()
    assert len(all_classified) == 640

    for z in all_classified:
        rl = z["risk_level"].upper()
        zt = z["zone_type"]
        if rl == "CRITICAL":
            assert zt == "RED_ZONE"
            assert z["is_red_zone"] == True
        elif rl == "HIGH":
            assert zt == "POTENTIAL_RED_ZONE"
            assert z["is_red_zone"] == True
        elif rl == "MODERATE":
            assert zt == "WATCH_ZONE"
            assert z["is_red_zone"] == False
        elif rl == "LOW":
            assert zt == "LOW_RISK_ZONE"
            assert z["is_red_zone"] == False


def test_moderate_districts_not_returned_in_red_zones_endpoint():
    red_zones = red_zone_engine.identify_red_zones()
    for rz in red_zones:
        assert rz["zone_type"] in ["RED_ZONE", "POTENTIAL_RED_ZONE"]
        assert rz["zone_type"] != "WATCH_ZONE"
        assert rz["zone_type"] != "LOW_RISK_ZONE"
        assert rz["is_red_zone"] == True


def test_red_zones_geojson_generation_and_metadata():
    geojson = red_zone_engine.generate_red_zones_geojson()
    assert geojson["type"] == "FeatureCollection"
    assert "features" in geojson

    meta = geojson["meta"]
    assert meta["districts_excluded_no_coords"] == meta["total_red_zones_identified"] - meta["spatially_rendered_features"]

    for feature in geojson["features"]:
        assert feature["type"] == "Feature"
        assert feature["geometry"]["type"] == "Polygon"
        props = feature["properties"]
        assert props["zone_type"] in ["RED_ZONE", "POTENTIAL_RED_ZONE"]
        assert props["zone_type"] not in ["Safe / Operational Zone", "WATCH_ZONE", "LOW_RISK_ZONE"]
        assert props["boundary_type"] == "prototype_visualization_buffer"
        assert "prototype visualization buffer" in props["boundary_disclaimer"]
        assert props["spatial_analysis_available"] == True


def test_api_red_zones_tabular_endpoint():
    response = client.get("/api/v1/red-zones")
    assert response.status_code == 200
    data = response.json()
    for item in data:
        assert item["is_red_zone"] == True
        assert item["zone_type"] in ["RED_ZONE", "POTENTIAL_RED_ZONE"]


def test_api_red_zones_geojson_endpoint():
    response = client.get("/api/v1/red-zones/geojson")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"

    meta = data["meta"]
    assert meta["districts_excluded_no_coords"] == meta["total_red_zones_identified"] - meta["spatially_rendered_features"]

    for feature in data["features"]:
        props = feature["properties"]
        assert props["zone_type"] in ["RED_ZONE", "POTENTIAL_RED_ZONE"]
        assert props["boundary_type"] == "prototype_visualization_buffer"


