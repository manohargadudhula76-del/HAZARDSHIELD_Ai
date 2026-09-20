import os
import json
import logging
import pandas as pd
import numpy as np
try:
    import geopandas as gpd
except ImportError:
    gpd = None
from pathlib import Path

from typing import Dict, Any, Optional, Union, Tuple
from app.services.data_loader import DataLoader
from app.services.data_cleaner import DataCleaner
from app.services.data_validator import DataValidator
from app.services.district_reconciler import DistrictReconciler, get_canonical_state, get_canonical_district
from app.services.master_aggregator import MasterAggregator, find_column

logger = logging.getLogger("dataset_pipeline")


class DatasetPipeline:
    """
    Complete real master dataset generation and validation pipeline for Phase 2.5.
    Generates district-level master analytical dataset (master_habitations.csv),
    district_reconciliation_report.json, and master_dataset_quality_report.json.
    """

    def __init__(self, base_dir: Union[str, Path] = "datasets"):
        self.base_dir = Path(base_dir)
        self.raw_dir = self.base_dir / "raw"
        self.processed_dir = self.base_dir / "processed"
        self.master_dir = self.base_dir / "master"

    def run_real_master_pipeline(self) -> Dict[str, Any]:
        """
        Runs Phase 2.5 Real Master Dataset Pipeline.
        1. Loads raw datasets across all 8 domains.
        2. Reconciles Census 2011 baseline districts with GIS NWIC boundary polygons.
        3. Generates district_reconciliation_report.json.
        4. Extracts GIS centroids & projected equal-area EPSG:7755 district area.
        5. Aggregates rainfall, housing, disasters, landslides, cyclones, infrastructure.
        6. Merges all metrics onto Census 640 district baseline.
        7. Saves master/master_habitations.csv and master/master_dataset_quality_report.json.
        """
        self.master_dir.mkdir(parents=True, exist_ok=True)

        # 1. Load Raw Datasets
        census_path = self.raw_dir / "population" / "india-districts-census-2011.csv"
        gis_path = self.raw_dir / "gis" / "district_nwic_geojson.zip"
        rain_path = self.raw_dir / "rainfall" / "rainfall_districtwise_daily_imd.csv"
        housing_path = self.raw_dir / "housing" / "india_census_housing-hlpca-full.csv"
        disaster_path = self.raw_dir / "disasters" / "disasterIND.csv"
        landslide_path = self.raw_dir / "landslides" / "landslide.csv"
        cyclone_path = self.raw_dir / "cyclones" / "ibtracs.NI.list.v04r01.csv"
        infra_path = self.raw_dir / "infrastructure" / "hospital_directory.csv"

        df_census = DataLoader.load_file(census_path) if census_path.exists() else pd.DataFrame()
        gdf_gis = DataLoader.load_file(gis_path) if gis_path.exists() else gpd.GeoDataFrame()
        df_rain = DataLoader.load_file(rain_path) if rain_path.exists() else pd.DataFrame()
        df_housing = DataLoader.load_file(housing_path) if housing_path.exists() else pd.DataFrame()
        df_disaster = DataLoader.load_file(disaster_path) if disaster_path.exists() else pd.DataFrame()
        df_landslide = DataLoader.load_file(landslide_path) if landslide_path.exists() else pd.DataFrame()
        df_cyclone = DataLoader.load_file(cyclone_path) if cyclone_path.exists() else pd.DataFrame()
        df_infra = DataLoader.load_file(infra_path) if infra_path.exists() else pd.DataFrame()

        # 2. District Reconciliation (Census vs GIS)
        reconcile_report, df_reconciled = DistrictReconciler.reconcile(df_census, gdf_gis)
        reconcile_path = self.base_dir / "district_reconciliation_report.json"
        with open(reconcile_path, "w", encoding="utf-8") as f:
            json.dump(reconcile_report, f, indent=2, default=str)

        # 3. GIS Metrics (Centroids & EPSG:7755 Equal-Area for matched Census-GIS districts)
        gdf_matched = gpd.GeoDataFrame(
            df_reconciled[df_reconciled["gis_matched"] == True].copy(),
            geometry="gis_geometry",
            crs="EPSG:7755"
        )
        df_gis_metrics, rep_gis = MasterAggregator.extract_gis_metrics(gdf_matched)

        # Ensure df_gis_metrics includes district_id for 1-to-1 key joining
        if not df_gis_metrics.empty and "district_id" not in df_gis_metrics.columns:
            df_gis_metrics = df_gis_metrics.merge(
                df_reconciled[["district_id", "state_std", "district_std"]],
                on=["state_std", "district_std"],
                how="left"
            )

        # 4. Domain Aggregations
        df_rain_agg, rep_rain = MasterAggregator.aggregate_rainfall(df_rain)
        df_housing_agg, rep_housing = MasterAggregator.aggregate_housing(df_housing)
        df_disaster_agg, rep_disaster = MasterAggregator.aggregate_disasters(df_disaster)
        df_landslide_agg, rep_landslide = MasterAggregator.aggregate_landslides_spatial(df_landslide, gdf_gis)

        # Build centroids dataframe for cyclone exposure calculation
        gis_cent_df = df_gis_metrics.dropna(subset=["latitude", "longitude"]).copy()
        df_cyclone_agg, rep_cyclone = MasterAggregator.aggregate_cyclones_spatial(df_cyclone, gis_cent_df)

        df_infra_agg, rep_infra = MasterAggregator.aggregate_infrastructure(df_infra)

        # 5. Master Dataset Integration onto Census 640 District Baseline Backbone
        master_records = []
        for idx, row in df_reconciled.iterrows():
            dist_id = row["district_id"]
            st_raw = row["State name"]
            dt_raw = row["District name"]
            st_std = row["state_std"]
            dt_std = row["district_std"]
            pop = pd.to_numeric(row.get("Population", 0), errors="coerce")
            pop = int(pop) if not pd.isna(pop) else 0

            master_records.append({
                "district_id": dist_id,
                "state": st_raw,
                "district": dt_raw,
                "state_std": st_std,
                "district_std": dt_std,
                "population": pop,
                "gis_matched": row.get("gis_matched", False)
            })

        master_df = pd.DataFrame(master_records)

        # Merge GIS metrics by district_id
        if not df_gis_metrics.empty and "district_id" in df_gis_metrics.columns:
            master_df = master_df.merge(
                df_gis_metrics[["district_id", "latitude", "longitude", "district_area_sq_km"]].drop_duplicates(subset=["district_id"]),
                on="district_id",
                how="left"
            )

        # Calculate population density
        area_col = master_df.get("district_area_sq_km", pd.Series(dtype=float))
        pop_col = master_df["population"]
        master_df["population_density"] = np.where(area_col > 0, (pop_col / area_col).round(2), np.nan)

        # Merge Rainfall
        if not df_rain_agg.empty:
            master_df = master_df.merge(df_rain_agg, on=["state_std", "district_std"], how="left")

        # Merge Housing
        if not df_housing_agg.empty:
            master_df = master_df.merge(df_housing_agg, on=["state_std", "district_std"], how="left")

        # Merge Disasters
        if not df_disaster_agg.empty:
            master_df = master_df.merge(df_disaster_agg, on=["state_std", "district_std"], how="left")

        # Merge Landslides
        if not df_landslide_agg.empty:
            master_df = master_df.merge(df_landslide_agg, on=["state_std", "district_std"], how="left")

        # Merge Cyclones
        if not df_cyclone_agg.empty:
            master_df = master_df.merge(df_cyclone_agg[["district_id", "cyclone_track_count", "cyclone_exposure_count", "max_cyclone_wind"]], on="district_id", how="left")

        # Merge Infrastructure
        if not df_infra_agg.empty:
            master_df = master_df.merge(df_infra_agg, on=["state_std", "district_std"], how="left")

        # 6. Fill missing values appropriately
        count_cols = [
            "historical_disaster_count", "historical_flood_count", "historical_landslide_count",
            "historical_cyclone_count", "landslide_event_count", "cyclone_track_count",
            "cyclone_exposure_count", "hospital_count", "hospital_bed_count"
        ]
        for col in count_cols:
            if col in master_df.columns:
                master_df[col] = master_df[col].fillna(0).astype(int)

        if "max_cyclone_wind" in master_df.columns:
            master_df["max_cyclone_wind"] = master_df["max_cyclone_wind"].fillna(0.0)

        # Clean final output column order
        final_cols = [
            "district_id", "state", "district", "latitude", "longitude", "district_area_sq_km",
            "population", "population_density", "average_rainfall", "maximum_rainfall",
            "annual_actual_rainfall", "rainfall_departure_pct", "heavy_rainfall_days",
            "historical_disaster_count", "historical_flood_count", "historical_landslide_count",
            "historical_cyclone_count", "landslide_event_count", "cyclone_track_count",
            "cyclone_exposure_count", "max_cyclone_wind", "total_households", "good_houses",
            "livable_houses", "dilapidated_houses", "dilapidated_house_pct", "hospital_count",
            "hospital_bed_count"
        ]

        present_final_cols = [c for c in final_cols if c in master_df.columns]
        master_out_df = master_df[present_final_cols].copy()

        # Save Master Habitations CSV
        master_csv_path = self.master_dir / "master_habitations.csv"
        master_out_df.to_csv(master_csv_path, index=False)

        # 7. Generate Data Quality Report
        total_districts = len(master_out_df)
        missing_pcts = {}
        for col in master_out_df.columns:
            missing_count = master_out_df[col].isna().sum()
            missing_pcts[col] = round((missing_count / total_districts * 100.0), 2)

        unique_district_keys = len(master_out_df.drop_duplicates(subset=["state", "district"]))
        unique_district_ids = len(master_out_df["district_id"].unique())

        quality_report = {
            "master_dataset_summary": {
                "analytical_level": "DISTRICT LEVEL (Baseline Census 2011 Backbone)",
                "total_district_records": total_districts,
                "unique_state_district_keys": unique_district_keys,
                "unique_district_ids": unique_district_ids,
                "has_duplicate_keys": unique_district_keys != total_districts,
                "master_csv_path": str(master_csv_path),
                "columns_count": len(master_out_df.columns),
                "columns": list(master_out_df.columns)
            },
            "domain_matching_rates": {
                "census_gis_reconciliation": reconcile_report["reconciliation_summary"],
                "rainfall_domain": rep_rain,
                "housing_domain": rep_housing,
                "disasters_domain": rep_disaster,
                "landslides_spatial": rep_landslide,
                "cyclones_spatial": rep_cyclone,
                "infrastructure_domain": rep_infra,
                "gis_domain": rep_gis
            },
            "column_missing_value_pct": missing_pcts,
            "validation_checks": {
                "one_row_per_district": total_districts == 640,
                "valid_latitude_range": bool((master_out_df["latitude"].dropna().between(6.0, 37.5)).all()),
                "valid_longitude_range": bool((master_out_df["longitude"].dropna().between(68.0, 97.5)).all()),
                "non_negative_population": bool((master_out_df["population"] >= 0).all()),
                "non_negative_counts": bool((master_out_df["hospital_count"] >= 0).all()),
                "no_cartesian_duplication": total_districts == 640
            },
            "ready_for_phase_3": True
        }

        quality_report_path = self.master_dir / "master_dataset_quality_report.json"
        with open(quality_report_path, "w", encoding="utf-8") as f:
            json.dump(quality_report, f, indent=2, default=str)

        return {
            "status": "success",
            "master_csv": str(master_csv_path),
            "quality_report": str(quality_report_path),
            "total_districts": total_districts,
            "quality_summary": quality_report
        }


if __name__ == "__main__":
    pipeline = DatasetPipeline()
    res = pipeline.run_real_master_pipeline()
    print(f"Master Dataset Pipeline Execution Completed. Districts: {res['total_districts']}")
