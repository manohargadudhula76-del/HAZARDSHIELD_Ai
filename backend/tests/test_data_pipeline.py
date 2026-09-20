import json
import pytest
import pandas as pd
from pathlib import Path
from app.services.data_loader import DataLoader
from app.services.data_cleaner import DataCleaner
from app.services.data_validator import DataValidator
from app.services.dataset_merge_service import DatasetMergeService
from app.services.dataset_pipeline import DatasetPipeline


@pytest.fixture
def sample_csv_file(tmp_path):
    file_path = tmp_path / "sample_population.csv"
    data = """State , District , Habitation Name, Population , Area Sq Km
Assam , Darrang , Rampur Village , 4850 , 12.4
Uttarakhand , Rudraprayag , Devipur , 2980 , 6.8
Assam , Darrang , Rampur Village , 4850 , 12.4
"""
    file_path.write_text(data, encoding="utf-8")
    return file_path


@pytest.fixture
def sample_json_file(tmp_path):
    file_path = tmp_path / "sample_rainfall.json"
    data = [
        {"State": "U.P.", "District": "darrang", "Rainfall": 1450.5, "Date": "2026-08-01"},
        {"State": "West Bengal", "District": "south 24 parganas", "Rainfall": 2100.0, "Date": "2026-08-01"}
    ]
    file_path.write_text(json.dumps(data), encoding="utf-8")
    return file_path


@pytest.fixture
def sample_geojson_file(tmp_path):
    file_path = tmp_path / "sample_gis.geojson"
    data = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [92.0315, 26.4521]},
                "properties": {"State": "Assam", "District": "Darrang", "Elevation": 45}
            }
        ]
    }
    file_path.write_text(json.dumps(data), encoding="utf-8")
    return file_path


# 1. CSV Loading
def test_csv_loading(sample_csv_file):
    df = DataLoader.load_csv(sample_csv_file)
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 3


# 2. JSON Loading
def test_json_loading(sample_json_file):
    df = DataLoader.load_json(sample_json_file)
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 2


# 3. GeoJSON Loading
def test_geojson_loading(sample_geojson_file):
    gdf = DataLoader.load_geojson(sample_geojson_file)
    assert len(gdf) == 1
    assert "longitude" in gdf.columns or hasattr(gdf, "geometry")


# 4. Invalid File Handling
def test_invalid_file_handling(tmp_path):
    corrupt_file = tmp_path / "corrupt.json"
    corrupt_file.write_text("{ invalid json content }", encoding="utf-8")

    with pytest.raises(ValueError, match="Invalid or corrupted JSON file"):
        DataLoader.load_json(corrupt_file)


# 5. Missing File Handling
def test_missing_file_handling(tmp_path):
    missing_file = tmp_path / "non_existent.csv"
    with pytest.raises(FileNotFoundError, match="Dataset file not found"):
        DataLoader.load_csv(missing_file)


# 6. Column Normalization & Alias Mapping
def test_column_normalization():
    raw_df = pd.DataFrame(columns=[" State Name ", "DISTRICT-ID", "Condition_of_occupied_census_houses_Dilapidated_Households", "Households"])
    clean_df, renamed = DataCleaner.normalize_columns(raw_df)
    assert list(clean_df.columns) == ["state", "district_id", "dilapidated_houses", "total_households"]


# 7. Duplicate Removal
def test_duplicate_removal(sample_csv_file):
    df = DataLoader.load_csv(sample_csv_file)
    df_clean, report = DataCleaner.clean_dataframe(df)
    assert report["duplicates_removed"] == 1
    assert len(df_clean) == 2


# 8. Missing Value Reporting
def test_missing_value_reporting():
    df = pd.DataFrame({
        "state": ["Assam", "Kerala", None],
        "rainfall": [1200.0, None, 1800.0],
        "latitude": [26.45, None, 10.08]
    })
    report = DataCleaner.generate_missing_report(df)
    assert report["state"]["missing_count"] == 1
    assert report["rainfall"]["missing_count"] == 1

    # Ensure missing lat/lng is NOT filled automatically
    df_filled = DataCleaner.handle_missing_values(df, strategy="mean")
    assert df_filled["latitude"].isna().sum() == 1  # Latitude missing count preserved
    assert df_filled["rainfall"].isna().sum() == 0  # Rainfall filled with mean


# 9. Required Column Validation
def test_required_column_validation():
    df_valid = pd.DataFrame({"state": ["Assam"], "district": ["Darrang"], "population": [4850]})
    res_valid = DataValidator.validate(df_valid, domain="population")
    assert res_valid["is_valid"] is True
    assert len(res_valid["missing_required"]) == 0

    df_invalid = pd.DataFrame({"state": ["Assam"], "district": ["Darrang"]})
    res_invalid = DataValidator.validate(df_invalid, domain="population")
    assert res_invalid["is_valid"] is False
    assert "population" in res_invalid["missing_required"]


# 10. Optional Column Validation
def test_optional_column_validation():
    df = pd.DataFrame({"state": ["Assam"], "district": ["Darrang"], "population": [4850]})
    res = DataValidator.validate(df, domain="population")
    assert res["is_valid"] is True
    assert "habitation" in res["missing_optional"]


# 11. Housing Domain Validation
def test_housing_domain_validation():
    df_housing = pd.DataFrame({
        "State Name": ["Assam"],
        "District Name": ["Darrang"],
        "Households": [1100],
        "Total Number of Dilapidated": [150]
    })
    df_clean, _ = DataCleaner.clean_dataframe(df_housing)
    res = DataValidator.validate(df_clean, domain="housing")
    assert res["is_valid"] is True
    assert "total_households" in res["present_optional"]
    assert "dilapidated_houses" in res["present_optional"]


# 12. Dataset Merging & Unmatched Records
def test_dataset_merging_and_unmatched():
    df_pop = pd.DataFrame({
        "state": ["Assam", "Uttarakhand"],
        "district": ["Darrang", "Rudraprayag"],
        "population": [4850, 2980]
    })

    df_rain = pd.DataFrame({
        "state": ["Assam", "Kerala"],
        "district": ["Darrang", "Idukki"],
        "average_rainfall": [2200.0, 1900.0]
    })

    merged_df, report = DatasetMergeService.merge_datasets(df_pop, df_rain, merge_keys=["state", "district"], how="outer")
    assert len(merged_df) == 3
    assert report["unmatched_left_keys"] == 1
    assert report["unmatched_right_keys"] == 1


# 13. Prevention of Many-to-Many Merge Errors
def test_prevention_of_many_to_many_merge_errors():
    df1 = pd.DataFrame({
        "state": ["Assam", "Assam"],
        "district": ["Darrang", "Darrang"],
        "val1": [10, 20]
    })

    df2 = pd.DataFrame({
        "state": ["Assam", "Assam"],
        "district": ["Darrang", "Darrang"],
        "val2": [100, 200]
    })

    # Detection logic prevents Cartesian product silent expansion
    is_m2m = DatasetMergeService.check_many_to_many(df1, df2, merge_keys=["state", "district"])
    assert bool(is_m2m) is True


# 14. Master Dataset Generation with Housing Metrics
def test_master_dataset_generation_with_housing(tmp_path):
    df_pop = pd.DataFrame({
        "State Name": ["Assam"],
        "District Name": ["Darrang"],
        "Habitation Name": ["Rampur Village"],
        "Population": [4850]
    })

    df_housing = pd.DataFrame({
        "State Name": ["Assam"],
        "District Name": ["Darrang"],
        "Households": [1100],
        "Total Number of Dilapidated": [150]
    })

    datasets = {"population": df_pop, "housing": df_housing}
    master_df, report = DatasetMergeService.build_master_dataset(datasets)

    assert "state" in master_df.columns
    assert "population" in master_df.columns
    assert "total_households" in master_df.columns
    assert "dilapidated_houses" in master_df.columns
    assert len(master_df) == 1

    out_file = tmp_path / "master_habitations.csv"
    DatasetMergeService.save_master_dataset(master_df, out_file, overwrite=True)
    assert out_file.exists()
