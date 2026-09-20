import re
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, List, Tuple

# Standard State Name Mapping dictionary
STATE_NAME_MAPPINGS = {
    "up": "Uttar Pradesh",
    "u.p.": "Uttar Pradesh",
    "uttar pradesh": "Uttar Pradesh",
    "uk": "Uttarakhand",
    "u.k.": "Uttarakhand",
    "uttrakhand": "Uttarakhand",
    "uttarakhand": "Uttarakhand",
    "wb": "West Bengal",
    "w.b.": "West Bengal",
    "west bengal": "West Bengal",
    "ap": "Andhra Pradesh",
    "a.p.": "Andhra Pradesh",
    "andhra pradesh": "Andhra Pradesh",
    "kl": "Kerala",
    "kerala": "Kerala",
    "as": "Assam",
    "assam": "Assam",
    "or": "Odisha",
    "orissa": "Odisha",
    "odisha": "Odisha",
    "hp": "Himachal Pradesh",
    "himachal pradesh": "Himachal Pradesh",
    "tn": "Tamil Nadu",
    "tamil nadu": "Tamil Nadu",
    "mh": "Maharashtra",
    "maharashtra": "Maharashtra",
    "rj": "Rajasthan",
    "rajasthan": "Rajasthan",
}

DISTRICT_NAME_MAPPINGS = {
    "darrang": "Darrang",
    "rudraprayag": "Rudraprayag",
    "krishna": "Krishna",
    "idukki": "Idukki",
    "south 24 parganas": "South 24 Parganas",
    "s24 pgs": "South 24 Parganas",
    "ganjam": "Ganjam",
    "kinnaur": "Kinnaur",
}

# Column Name Aliases Mapping for automatic normalization
COLUMN_ALIAS_MAPPINGS = {
    "state_name": "state",
    "st_name": "state",
    "state_ut_name": "state",
    "state_name_english": "state",
    "district_name": "district",
    "dist_name": "district",
    "district_name_english": "district",
    "tehsil_name": "tehsil",
    "ruralurban": "rural_urban",
    "daily_actual": "rainfall",
    "daily_normal": "normal_rainfall",
    "annual": "average_rainfall",
    "households": "total_households",
    "total_household": "total_households",
    "total_households_count": "total_households",
    "total_number_of_households": "total_households",
    "total_number_of_good": "good_houses",
    "total_number_of_livable": "livable_houses",
    "total_number_of_dilapidated": "dilapidated_houses",
    "condition_of_occupied_census_houses_dilapidated_households": "dilapidated_houses",
    "condition_of_occupied_census_houses_good_households": "good_houses",
    "condition_of_occupied_census_houses_livable_households": "livable_houses",
    "contition_t_good": "good_houses",
    "contition_t_livable": "livable_houses",
    "contition_t_dilapidated": "dilapidated_houses",
    "contition_t_total": "total_households",
    "dilapidated_households": "dilapidated_houses",
    "good_households": "good_houses",
    "livable_households": "livable_houses",
}


class DataCleaner:
    """
    Data cleaning service for column normalization, deduplication, string trimming,
    geographical name standardization, column alias mapping, and configurable missing value handling.
    """

    @staticmethod
    def normalize_column_name(col: str) -> str:
        """
        Converts column name to lowercase, trims whitespace, replaces spaces & hyphens with underscores.
        """
        col = str(col).strip().lower()
        col = re.sub(r'[\s\/\-]+', '_', col)
        col = re.sub(r'[^a-z0-9_]', '', col)
        return col

    @classmethod
    def normalize_columns(cls, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, str]]:
        """
        Normalizes all column names in a DataFrame, applies alias mappings, and handles duplicates.
        """
        df = df.copy()
        renamed = {}
        new_cols = []
        counts = {}

        for col in df.columns:
            norm = cls.normalize_column_name(col)
            norm = COLUMN_ALIAS_MAPPINGS.get(norm, norm)

            if norm in counts:
                counts[norm] += 1
                unique_norm = f"{norm}_{counts[norm]}"
            else:
                counts[norm] = 0
                unique_norm = norm

            renamed[col] = unique_norm
            new_cols.append(unique_norm)

        df.columns = new_cols
        return df, renamed

    @staticmethod
    def standardize_geo_names(df: pd.DataFrame) -> pd.DataFrame:
        """
        Standardizes state and district text values using explicit mappings without altering geographic intent.
        """
        df = df.copy()

        if "state" in df.columns:
            def clean_state(val):
                if pd.isna(val) or val is None:
                    return val
                s = str(val).strip()
                if not s or s.lower() == "nan":
                    return np.nan
                return STATE_NAME_MAPPINGS.get(s.lower(), s.title())

            df["state"] = df["state"].apply(clean_state)

        if "district" in df.columns:
            def clean_district(val):
                if pd.isna(val) or val is None:
                    return val
                s = str(val).strip()
                if not s or s.lower() == "nan":
                    return np.nan
                return DISTRICT_NAME_MAPPINGS.get(s.lower(), s.title())

            df["district"] = df["district"].apply(clean_district)

        if "habitation" in df.columns:
            df["habitation"] = df["habitation"].apply(lambda x: str(x).strip() if pd.notna(x) else x)

        if "habitation_name" in df.columns:
            df["habitation_name"] = df["habitation_name"].apply(lambda x: str(x).strip() if pd.notna(x) else x)

        return df

    @staticmethod
    def generate_missing_report(df: pd.DataFrame) -> Dict[str, Any]:
        """
        Generates detailed report of missing values across all columns.
        """
        total_rows = len(df)
        report = {}

        for col in df.columns:
            missing_count = int(df[col].isna().sum())
            missing_pct = round((missing_count / total_rows * 100), 2) if total_rows > 0 else 0.0
            is_numeric = bool(pd.api.types.is_numeric_dtype(df[col]))

            report[col] = {
                "missing_count": missing_count,
                "missing_pct": missing_pct,
                "is_numeric": is_numeric,
                "dtype": str(df[col].dtype)
            }

        return report

    @classmethod
    def handle_missing_values(
        cls,
        df: pd.DataFrame,
        strategy: str = "keep",
        constant_value: Any = 0,
        fill_dict: Optional[Dict[str, Any]] = None
    ) -> pd.DataFrame:
        """
        Applies missing value strategy to numerical columns.
        PROTECTION: Never fills missing latitude/longitude coordinates automatically.
        """
        df = df.copy()
        numeric_cols = [c for c in df.select_dtypes(include=[np.number]).columns if c not in ['latitude', 'longitude']]

        if fill_dict:
            for col, val in fill_dict.items():
                if col in df.columns and col not in ['latitude', 'longitude']:
                    df[col] = df[col].fillna(val)
            return df

        if strategy == "keep":
            return df
        elif strategy == "mean":
            for col in numeric_cols:
                if df[col].isna().any():
                    mean_val = df[col].mean()
                    df[col] = df[col].fillna(mean_val)
        elif strategy == "median":
            for col in numeric_cols:
                if df[col].isna().any():
                    median_val = df[col].median()
                    df[col] = df[col].fillna(median_val)
        elif strategy == "mode":
            for col in df.columns:
                if col not in ['latitude', 'longitude'] and df[col].isna().any():
                    mode_vals = df[col].mode()
                    if not mode_vals.empty:
                        df[col] = df[col].fillna(mode_vals[0])
        elif strategy == "constant":
            for col in numeric_cols:
                if df[col].isna().any():
                    df[col] = df[col].fillna(constant_value)

        return df

    @classmethod
    def clean_dataframe(
        cls,
        df: pd.DataFrame,
        missing_strategy: str = "keep",
        constant_fill_value: Any = 0,
        fill_dict: Optional[Dict[str, Any]] = None
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Complete cleaning pipeline:
        1. Normalize column names & apply alias mapping
        2. Remove completely empty rows
        3. Trim string columns
        4. Standardize geographical names safely
        5. Generate missing report before cleaning
        6. Remove duplicate rows
        7. Apply missing value strategy (protecting lat/lng)
        8. Generate missing report after cleaning & return final execution report.
        """
        rows_before = len(df)
        cols_before = list(df.columns)

        # 1. Normalize column names & apply alias mapping
        df_clean, renamed_cols = cls.normalize_columns(df)

        # 2. Remove completely empty rows
        df_clean = df_clean.dropna(how='all')

        # 3. Trim string columns
        for col in df_clean.select_dtypes(include=['object', 'string']).columns:
            df_clean[col] = df_clean[col].apply(lambda x: x.strip() if isinstance(x, str) else x)

        # 4. Standardize state/district names
        df_clean = cls.standardize_geo_names(df_clean)

        # 5. Missing report before filling
        missing_before = cls.generate_missing_report(df_clean)

        # 6. Remove duplicate rows
        duplicates_removed = int(df_clean.duplicated().sum())
        df_clean = df_clean.drop_duplicates()

        # 7. Missing value strategy
        df_clean = cls.handle_missing_values(
            df_clean,
            strategy=missing_strategy,
            constant_value=constant_fill_value,
            fill_dict=fill_dict
        )

        # 8. Missing report after cleaning
        missing_after = cls.generate_missing_report(df_clean)

        report = {
            "rows_before": rows_before,
            "rows_after": len(df_clean),
            "duplicates_removed": duplicates_removed,
            "columns_before": cols_before,
            "columns_after": list(df_clean.columns),
            "renamed_columns": renamed_cols,
            "missing_report_before": missing_before,
            "missing_report_after": missing_after,
            "missing_strategy_applied": missing_strategy
        }

        return df_clean, report
