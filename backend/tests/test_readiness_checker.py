import pytest
import pandas as pd
from app.services.dataset_readiness_checker import DatasetReadinessChecker


def test_empty_datasets_readiness(tmp_path):
    # Setup empty dataset structure
    raw_dir = tmp_path / "raw"
    for domain in ["rainfall", "population", "disasters", "landslides", "cyclones", "infrastructure", "gis"]:
        (raw_dir / domain).mkdir(parents=True, exist_ok=True)

    checker = DatasetReadinessChecker(base_dir=tmp_path)
    report = checker.generate_readiness_report(save_json=True)

    assert report["overall_status"] == "REAL DATASETS REQUIRED"
    assert report["ready_for_phase_3"] is False
    assert (tmp_path / "dataset_readiness_report.json").exists()


def test_domain_readiness_with_valid_file(tmp_path):
    pop_dir = tmp_path / "raw" / "population"
    pop_dir.mkdir(parents=True, exist_ok=True)

    df_pop = pd.DataFrame({
        "state": ["Assam"],
        "district": ["Darrang"],
        "population": [4850],
        "latitude": [26.45],
        "longitude": [92.03]
    })
    df_pop.to_csv(pop_dir / "population_2026.csv", index=False)

    checker = DatasetReadinessChecker(base_dir=tmp_path)
    pop_report = checker.check_domain_readiness("population")

    assert pop_report["ready_for_processing"] is True
    assert pop_report["status"] == "READY FOR PROCESSING"
    assert pop_report["row_count"] == 1
    assert pop_report["geographic_coordinates_available"] is True
