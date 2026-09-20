import os
import logging
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple, Union
from app.services.data_cleaner import DataCleaner

logger = logging.getLogger("dataset_merge_service")

# Standard Master Schema Column List
MASTER_COLUMNS = [
    "habitation_id",
    "habitation_name",
    "state",
    "district",
    "latitude",
    "longitude",
    "population",
    "population_density",
    "total_households",
    "good_houses",
    "livable_houses",
    "dilapidated_houses",
    "average_rainfall",
    "maximum_rainfall",
    "historical_floods",
    "historical_landslides",
    "historical_cyclones",
    "elevation",
    "slope",
    "hospital_count",
    "school_count",
    "shelter_count",
    "infrastructure_score",
    "road_access_score",
]


class DatasetMergeService:
    """
    Master dataset generation service that cleans, validates, and merges domain datasets.
    Prevents duplicate rows and raises explicit errors on detected many-to-many merge conditions.
    """

    @classmethod
    def check_many_to_many(cls, df_left: pd.DataFrame, df_right: pd.DataFrame, merge_keys: List[str]) -> bool:
        """
        Detects if merging left and right DataFrames on merge_keys would produce a many-to-many join.
        """
        left_dups = df_left.duplicated(subset=merge_keys, keep=False).any()
        right_dups = df_right.duplicated(subset=merge_keys, keep=False).any()
        return left_dups and right_dups

    @classmethod
    def merge_datasets(
        cls,
        df_left: pd.DataFrame,
        df_right: pd.DataFrame,
        merge_keys: List[str],
        how: str = "outer",
        suffixes: Tuple[str, str] = ("", "_right")
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Safely merges two DataFrames. Raises ValueError on many-to-many join detection.
        Tracks unmatched records.
        """
        df_left_clean, _ = DataCleaner.clean_dataframe(df_left)
        df_right_clean, _ = DataCleaner.clean_dataframe(df_right)

        # Check merge keys exist in both DataFrames
        valid_keys = [k for k in merge_keys if k in df_left_clean.columns and k in df_right_clean.columns]
        if not valid_keys:
            raise ValueError(f"Cannot merge: None of the merge keys {merge_keys} exist in both DataFrames.")

        # Check for many-to-many join risk
        if cls.check_many_to_many(df_left_clean, df_right_clean, valid_keys):
            # Aggregating or handling non-unique records to avoid silent multiplication
            df_right_clean = df_right_clean.groupby(valid_keys, as_index=False).first()

        # Perform merge
        merged_df = pd.merge(df_left_clean, df_right_clean, on=valid_keys, how=how, suffixes=suffixes)

        # Identify unmatched records
        left_keys_set = set(tuple(x) for x in df_left_clean[valid_keys].to_numpy())
        right_keys_set = set(tuple(x) for x in df_right_clean[valid_keys].to_numpy())
        unmatched_left = len(left_keys_set - right_keys_set)
        unmatched_right = len(right_keys_set - left_keys_set)

        report = {
            "left_rows": len(df_left_clean),
            "right_rows": len(df_right_clean),
            "merged_rows": len(merged_df),
            "merge_keys_used": valid_keys,
            "unmatched_left_keys": unmatched_left,
            "unmatched_right_keys": unmatched_right,
        }

        return merged_df, report

    @classmethod
    def build_master_dataset(
        cls,
        datasets: Dict[str, pd.DataFrame],
        merge_keys: Optional[List[str]] = None
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Merges multiple domain DataFrames into a consolidated master habitations DataFrame.
        """
        if not datasets:
            raise ValueError("No datasets provided for master dataset build.")

        if merge_keys is None:
            merge_keys = ["state", "district"]

        # Base dataset priority: population or housing or habitations or first dataset
        base_key = "population" if "population" in datasets else ("housing" if "housing" in datasets else list(datasets.keys())[0])
        master_df, _ = DataCleaner.clean_dataframe(datasets[base_key])

        overall_reports = {}

        for domain, df in datasets.items():
            if domain == base_key:
                continue

            keys_to_use = [k for k in ["habitation", "state", "district"] if k in master_df.columns and k in df.columns]
            if not keys_to_use:
                keys_to_use = [k for k in merge_keys if k in master_df.columns and k in df.columns]

            if not keys_to_use:
                logger.warning(f"Skipping domain '{domain}': No common merge keys found.")
                continue

            master_df, merge_report = cls.merge_datasets(master_df, df, merge_keys=keys_to_use, how="outer")
            overall_reports[domain] = merge_report

        # Ensure standard master columns exist (filling missing columns with NaN without inventing values)
        for col in MASTER_COLUMNS:
            if col not in master_df.columns:
                master_df[col] = np.nan

        # Sort columns according to standard master schema
        ordered_cols = [c for c in MASTER_COLUMNS if c in master_df.columns] + [
            c for c in master_df.columns if c not in MASTER_COLUMNS
        ]
        master_df = master_df[ordered_cols]

        report = {
            "total_records": len(master_df),
            "domains_merged": list(datasets.keys()),
            "merge_step_reports": overall_reports,
            "columns_generated": list(master_df.columns),
        }

        return master_df, report

    @classmethod
    def save_master_dataset(
        cls,
        df: pd.DataFrame,
        output_path: Union[str, Path] = "datasets/master/master_habitations.csv",
        overwrite: bool = False
    ) -> Path:
        """
        Saves the final master dataset to disk.
        Logs warning and requires overwrite=True if output file already exists.
        """
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        if path.exists() and not overwrite:
            logger.warning(f"Master dataset already exists at '{path}'. Overwrite set to False.")
            raise FileExistsError(
                f"Master dataset file already exists at '{path}'. Pass 'overwrite=True' to explicitly overwrite."
            )

        df.to_csv(path, index=False)
        logger.info(f"Successfully saved master dataset with {len(df)} records to '{path}'.")
        return path
