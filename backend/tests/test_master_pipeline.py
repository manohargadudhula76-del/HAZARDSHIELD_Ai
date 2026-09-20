import pytest
import pandas as pd
import numpy as np
import geopandas as gpd
from shapely.geometry import Point, Polygon
from app.services.district_reconciler import DistrictReconciler, normalize_string, get_canonical_state, get_canonical_district
from app.services.master_aggregator import MasterAggregator, haversine_distance_km, find_column
from app.services.dataset_pipeline import DatasetPipeline


def test_normalize_string_and_aliases():
    assert normalize_string("  Andaman & Nicobar Islands  ") == "andaman and nicobar islands"
    assert get_canonical_state("ANDAMAN & NICOBAR ISLANDS") == "andaman and nicobar"
    assert get_canonical_district("hardwar") == "haridwar"
    assert get_canonical_district("Gurgaon") == "gurugram"


def test_district_reconciliation_logic():
    df_census = pd.DataFrame([
        {"District code": "1", "State name": "PUNJAB", "District name": "Sahibzada Ajit Singh Nagar", "Population": 990000},
        {"District code": "2", "State name": "UTTAR PRADESH", "District name": "Hardwar", "Population": 500000},
    ])
    gdf_gis = gpd.GeoDataFrame([
        {"state": "Punjab", "district": "SAS Nagar", "geometry": Polygon([(0, 0), (1, 0), (1, 1), (0, 1)])},
        {"state": "Uttarakhand", "district": "Haridwar", "geometry": Polygon([(2, 2), (3, 2), (3, 3), (2, 3)])},
    ], crs="EPSG:7755")

    report, df_rec = DistrictReconciler.reconcile(df_census, gdf_gis)

    assert report["reconciliation_summary"]["total_matched_count"] == 2
    assert report["reconciliation_summary"]["census_gis_match_rate_pct"] == 100.0
    assert len(df_rec) == 2
    assert df_rec.iloc[0]["gis_matched"] == True


def test_rainfall_aggregation_metrics():
    df_rain = pd.DataFrame([
        {"state": "Punjab", "district": "SAS Nagar", "rainfall": 70.0, "daily_departure_per": 10.0},
        {"state": "Punjab", "district": "SAS Nagar", "rainfall": 20.0, "daily_departure_per": -5.0},
    ])
    df_agg, rep = MasterAggregator.aggregate_rainfall(df_rain)

    assert len(df_agg) == 1
    assert df_agg.iloc[0]["average_rainfall"] == 45.0
    assert df_agg.iloc[0]["maximum_rainfall"] == 70.0
    assert df_agg.iloc[0]["annual_actual_rainfall"] == 90.0
    assert df_agg.iloc[0]["heavy_rainfall_days"] == 1


def test_housing_aggregation_without_double_counting():
    df_housing = pd.DataFrame([
        {"state": "Punjab", "district": "SAS Nagar", "rural_urban": "Total", "total_households": 100, "good_houses": 70, "livable_houses": 20, "dilapidated_houses": 10},
        {"state": "Punjab", "district": "SAS Nagar", "rural_urban": "Rural", "total_households": 60, "good_houses": 40, "livable_houses": 15, "dilapidated_houses": 5},
        {"state": "Punjab", "district": "SAS Nagar", "rural_urban": "Urban", "total_households": 40, "good_houses": 30, "livable_houses": 5, "dilapidated_houses": 5},
    ])
    df_agg, rep = MasterAggregator.aggregate_housing(df_housing)

    assert len(df_agg) == 1
    assert rep["filtered_total_rows"] == 1
    assert df_agg.iloc[0]["total_households"] == 100
    assert df_agg.iloc[0]["dilapidated_house_pct"] == 10.0


def test_landslide_spatial_assignment():
    df_ls = pd.DataFrame([
        {"latitude": 0.5, "longitude": 0.5},
        {"latitude": 10.0, "longitude": 10.0},  # outside
    ])
    gdf_gis = gpd.GeoDataFrame([
        {"state": "TestState", "district": "TestDistrict", "geometry": Polygon([(0, 0), (1, 0), (1, 1), (0, 1)])}
    ], crs="EPSG:4326")

    df_agg, rep = MasterAggregator.aggregate_landslides_spatial(df_ls, gdf_gis)

    assert rep["spatially_mapped_points"] == 1
    assert rep["unmapped_points"] == 1
    assert len(df_agg) == 1
    assert df_agg.iloc[0]["landslide_event_count"] == 1


def test_cyclone_distance_and_exposure():
    dist_km = haversine_distance_km(19.0, 72.8, 19.1, 72.9)
    assert 10.0 < dist_km < 20.0

    df_cy = pd.DataFrame([
        {"sid": "CY01", "lat": 19.0, "lon": 72.8, "usa_wind": 85.0},
    ])
    df_cents = pd.DataFrame([
        {"district_id": "DIST_01", "state_std": "maharashtra", "district_std": "mumbai", "latitude": 19.05, "longitude": 72.85}
    ])

    df_exp, rep = MasterAggregator.aggregate_cyclones_spatial(df_cy, df_cents, threshold_km=100.0)

    assert len(df_exp) == 1
    assert df_exp.iloc[0]["cyclone_track_count"] == 1
    assert df_exp.iloc[0]["max_cyclone_wind"] == 85.0


def test_hospital_aggregation():
    df_infra = pd.DataFrame([
        {"state": "Punjab", "district": "SAS Nagar", "hospital_name": "H1", "total_beds": 50},
        {"state": "Punjab", "district": "SAS Nagar", "hospital_name": "H2", "total_beds": 100},
    ])
    df_agg, rep = MasterAggregator.aggregate_infrastructure(df_infra)

    assert len(df_agg) == 1
    assert df_agg.iloc[0]["hospital_count"] == 2
    assert df_agg.iloc[0]["hospital_bed_count"] == 150


def test_master_pipeline_execution():
    pipeline = DatasetPipeline()
    res = pipeline.run_real_master_pipeline()

    assert res["status"] == "success"
    assert res["total_districts"] == 640
    assert res["quality_summary"]["validation_checks"]["one_row_per_district"] == True
    assert res["quality_summary"]["validation_checks"]["no_cartesian_duplication"] == True
