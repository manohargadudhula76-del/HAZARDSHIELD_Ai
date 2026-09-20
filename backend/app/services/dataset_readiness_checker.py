import json
import logging
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List, Union
from app.services.data_loader import DataLoader
from app.services.data_cleaner import DataCleaner
from app.services.data_validator import DataValidator

logger = logging.getLogger("dataset_readiness_checker")

DOMAINS = ["rainfall", "population", "disasters", "landslides", "cyclones", "infrastructure", "housing", "gis"]


class DatasetReadinessChecker:
    """
    Dataset Integration Readiness Checker for HazardShield AI.
    Inspects raw datasets, checks required & optional schema columns, verifies
    geospatial coordinate availability, and evaluates readiness for future analytics modules.
    """

    def __init__(self, base_dir: Union[str, Path] = "datasets"):
        self.base_dir = Path(base_dir)
        self.raw_dir = self.base_dir / "raw"

    def check_domain_readiness(self, domain: str) -> Dict[str, Any]:
        """
        Inspects raw data files for a specific domain directory.
        Iterates across files in domain directory to find valid candidates.
        """
        domain_dir = self.raw_dir / domain
        files_found = []

        if domain_dir.exists():
            for f in domain_dir.iterdir():
                if f.is_file() and not f.name.startswith("."):
                    files_found.append(f)

        if not files_found:
            return {
                "domain": domain,
                "status": "REAL DATASETS REQUIRED",
                "ready_for_processing": False,
                "files_found": [],
                "format": None,
                "row_count": 0,
                "columns_detected": [],
                "required_columns_available": [],
                "missing_required_columns": DataValidator.validate(pd.DataFrame(), domain).get("missing_required", []),
                "optional_columns_available": [],
                "missing_value_pct": 0.0,
                "duplicate_row_count": 0,
                "geographic_coordinates_available": False,
                "notes": f"No data files found in '{domain_dir}'. Place CSV/JSON/GeoJSON datasets here."
            }

        def file_priority(f: Path) -> int:
            ext = f.suffix.lower()
            if ext in ['.geojson', '.json', '.csv']:
                return 0
            if ext == '.zip':
                return 1
            return 2

        files_found.sort(key=file_priority)

        # Evaluate candidate files to find the best valid candidate
        best_report = None
        for target_file in files_found:
            fmt = DataLoader.detect_format(target_file)

            try:
                df_raw = DataLoader.load_file(target_file)
                df_clean, clean_report = DataCleaner.clean_dataframe(df_raw, missing_strategy="keep")
                val_report = DataValidator.validate(df_clean, domain=domain)

                cols_lower = [str(c).lower().strip() for c in df_clean.columns]
                has_coords = ("latitude" in cols_lower and "longitude" in cols_lower) or (
                    hasattr(df_clean, "geometry") and getattr(df_clean, "geometry", None) is not None
                )

                total_cells = df_clean.size
                missing_cells = df_clean.isna().sum().sum()
                missing_pct = round((missing_cells / total_cells * 100), 2) if total_cells > 0 else 0.0

                is_ready = val_report["is_valid"] and len(df_clean) > 0

                report = {
                    "domain": domain,
                    "status": "READY FOR PROCESSING" if is_ready else "SCHEMA VALIDATION FAILED",
                    "ready_for_processing": is_ready,
                    "files_found": [f.name for f in files_found],
                    "selected_file": target_file.name,
                    "format": fmt,
                    "row_count": len(df_clean),
                    "columns_detected": list(df_clean.columns),
                    "required_columns_available": [c for c in val_report["detected_columns"] if c not in val_report["missing_required"]],
                    "missing_required_columns": val_report["missing_required"],
                    "optional_columns_available": val_report["present_optional"],
                    "missing_value_pct": missing_pct,
                    "duplicate_row_count": clean_report["duplicates_removed"],
                    "geographic_coordinates_available": has_coords,
                    "validation_errors": val_report["errors"],
                    "validation_warnings": val_report["warnings"],
                }

                if is_ready:
                    best_report = report
                    break
                elif best_report is None:
                    best_report = report
            except Exception as e:
                if best_report is None:
                    best_report = {
                        "domain": domain,
                        "status": "FILE PARSE ERROR",
                        "ready_for_processing": False,
                        "files_found": [f.name for f in files_found],
                        "selected_file": target_file.name,
                        "format": fmt,
                        "row_count": 0,
                        "columns_detected": [],
                        "required_columns_available": [],
                        "missing_required_columns": [],
                        "optional_columns_available": [],
                        "missing_value_pct": 0.0,
                        "duplicate_row_count": 0,
                        "geographic_coordinates_available": False,
                        "error_detail": str(e)
                    }

        return best_report

    def verify_future_module_requirements(self, domain_reports: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """
        Verifies dataset readiness against requirements for future analytical engines.
        """
        pop_ready = domain_reports.get("population", {}).get("ready_for_processing", False)
        rain_ready = domain_reports.get("rainfall", {}).get("ready_for_processing", False)
        disaster_ready = domain_reports.get("disasters", {}).get("ready_for_processing", False)
        gis_ready = domain_reports.get("gis", {}).get("ready_for_processing", False)
        infra_ready = domain_reports.get("infrastructure", {}).get("ready_for_processing", False)
        housing_ready = domain_reports.get("housing", {}).get("ready_for_processing", False)

        has_coords = (
            domain_reports.get("gis", {}).get("geographic_coordinates_available", False) or
            domain_reports.get("landslides", {}).get("geographic_coordinates_available", False) or
            domain_reports.get("cyclones", {}).get("geographic_coordinates_available", False) or
            domain_reports.get("disasters", {}).get("geographic_coordinates_available", False) or
            domain_reports.get("population", {}).get("geographic_coordinates_available", False)
        )

        hazard_engine = {
            "module": "HAZARD ENGINE",
            "ready": bool(rain_ready and pop_ready and (disaster_ready or gis_ready)),
            "required_domains": ["rainfall", "population", "disasters / gis"],
            "missing_domains": [d for d in ["rainfall", "population"] if not domain_reports.get(d, {}).get("ready_for_processing", False)]
        }

        red_zone_engine = {
            "module": "RED ZONE ENGINE",
            "ready": bool(hazard_engine["ready"] and has_coords),
            "required_inputs": ["hazard_score_inputs", "latitude", "longitude", "population"],
            "coordinates_available": has_coords
        }

        infra_cols = domain_reports.get("infrastructure", {}).get("columns_detected", [])
        pop_cols = domain_reports.get("population", {}).get("columns_detected", [])
        housing_cols = domain_reports.get("housing", {}).get("columns_detected", [])

        carrying_capacity_engine = {
            "module": "CARRYING CAPACITY ENGINE",
            "ready": bool(pop_ready),
            "required_inputs": ["population"],
            "optional_sector_inputs": {
                "housing": housing_ready or "dilapidated_houses" in pop_cols or "households" in pop_cols or "total_households" in pop_cols,
                "water": "water_supply" in infra_cols or "main_source_of_drinking_water_tapwater_households" in pop_cols,
                "healthcare": "hospital_count" in infra_cols,
                "education": "school_count" in infra_cols or "total_education" in pop_cols,
                "shelter": "shelter_count" in infra_cols,
                "road_access": "road_access_score" in infra_cols,
            }
        }

        relocation_engine = {
            "module": "RELOCATION ENGINE",
            "ready": bool(pop_ready and has_coords),
            "required_inputs": [
                "affected_habitation_coordinates",
                "candidate_safe_location_coordinates",
                "population_capacity",
                "infrastructure_information"
            ],
            "coordinates_available": has_coords
        }

        return {
            "hazard_engine": hazard_engine,
            "red_zone_engine": red_zone_engine,
            "carrying_capacity_engine": carrying_capacity_engine,
            "relocation_engine": relocation_engine,
        }

    def generate_readiness_report(self, save_json: bool = True) -> Dict[str, Any]:
        """
        Generates full readiness assessment report across all domains and saves dataset_readiness_report.json.
        """
        domain_reports = {}
        ready_count = 0
        total_domains = len(DOMAINS)

        for domain in DOMAINS:
            rep = self.check_domain_readiness(domain)
            domain_reports[domain] = rep
            if rep.get("ready_for_processing", False):
                ready_count += 1

        module_requirements = self.verify_future_module_requirements(domain_reports)

        if ready_count == 0:
            overall_status = "REAL DATASETS REQUIRED"
            ready_for_phase_3 = False
            message = "No real datasets are available in backend/datasets/raw/. Real datasets required before Phase 3."
        elif ready_count < total_domains:
            overall_status = "PARTIAL DATASETS AVAILABLE"
            ready_for_phase_3 = module_requirements["hazard_engine"]["ready"] and module_requirements["red_zone_engine"]["ready"]
            message = f"{ready_count}/{total_domains} domain datasets are available and ready."
        else:
            overall_status = "ALL DATASETS READY FOR PROCESSING"
            ready_for_phase_3 = True
            message = "All domain datasets are loaded, validated, and ready for Phase 3."

        report = {
            "overall_status": overall_status,
            "ready_for_phase_3": ready_for_phase_3,
            "domains_ready_count": f"{ready_count}/{total_domains}",
            "summary_message": message,
            "domain_reports": domain_reports,
            "future_module_readiness": module_requirements,
        }

        if save_json:
            self.base_dir.mkdir(parents=True, exist_ok=True)
            report_path = self.base_dir / "dataset_readiness_report.json"
            with open(report_path, "w", encoding="utf-8") as f:
                json.dump(report, f, indent=2, default=str)
            logger.info(f"Saved dataset readiness report to '{report_path}'.")

        return report


if __name__ == "__main__":
    checker = DatasetReadinessChecker()
    res = checker.generate_readiness_report(save_json=True)
    print(f"Readiness Check Completed. Status: {res['overall_status']}, Domains Ready: {res['domains_ready_count']}")

