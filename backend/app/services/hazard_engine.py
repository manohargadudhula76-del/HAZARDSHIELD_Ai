import os
import json
import logging
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple, Union

logger = logging.getLogger("hazard_engine")

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MASTER_DATASET_PATH = BASE_DIR / "datasets" / "master" / "master_habitations.csv"


def min_max_scale(val: float, min_val: float, max_val: float) -> Optional[float]:
    """
    Min-max scales a value to [0.0, 100.0].
    Handles zero division safely. Returns None if value is missing/NaN.
    When min_val == max_val == 0 (e.g. 0 hazard events recorded), returns 0.0.
    """
    if val is None or pd.isna(val):
        return None
    if max_val <= min_val:
        return 0.0 if min_val == 0.0 else 50.0
    scaled = (float(val) - float(min_val)) / (float(max_val) - float(min_val)) * 100.0
    return max(0.0, min(100.0, round(scaled, 2)))


class HazardEngine:
    """
    Multi-Hazard Risk Analysis Engine for HazardShield AI.
    Operates on district-level master analytical data (master_habitations.csv).
    Computes transparent rule-based hazard risk scores, handles missing data dynamically,
    and computes data completeness & confidence scores.
    """

    def __init__(self, dataset_path: Optional[Union[str, Path]] = None):
        self.dataset_path = Path(dataset_path) if dataset_path else MASTER_DATASET_PATH
        self._master_df: Optional[pd.DataFrame] = None
        self._analyzed_results: Optional[List[Dict[str, Any]]] = None

    def load_dataset(self) -> pd.DataFrame:
        if self._master_df is not None:
            return self._master_df
        if not self.dataset_path.exists():
            raise FileNotFoundError(f"Master dataset not found at path: '{self.dataset_path}'")
        self._master_df = pd.read_csv(self.dataset_path)
        return self._master_df

    def analyze_all_districts(self) -> List[Dict[str, Any]]:
        """
        Runs multi-hazard risk analysis for all districts in the master dataset.
        Returns a list of district hazard analysis dictionaries.
        """
        if self._analyzed_results is not None:
            return self._analyzed_results

        df = self.load_dataset().copy()

        # Compute empirical min/max bounds across dataset for normalization
        bounds = {
            "avg_rain": (df["average_rainfall"].min(), df["average_rainfall"].max()),
            "max_rain": (df["maximum_rainfall"].min(), df["maximum_rainfall"].max()),
            "ann_rain": (df["annual_actual_rainfall"].min(), df["annual_actual_rainfall"].max()),
            "heavy_days": (df["heavy_rainfall_days"].min(), df["heavy_rainfall_days"].max()),
            "disasters": (df["historical_disaster_count"].min(), df["historical_disaster_count"].max()),
            "floods": (df["historical_flood_count"].min(), df["historical_flood_count"].max()),
            "landslide_hist": (df["historical_landslide_count"].min(), df["historical_landslide_count"].max()),
            "landslide_pts": (df["landslide_event_count"].min(), df["landslide_event_count"].max()),
            "cyclone_hist": (df["historical_cyclone_count"].min(), df["historical_cyclone_count"].max()),
            "cyclone_tracks": (df["cyclone_track_count"].min(), df["cyclone_track_count"].max()),
            "cyclone_exp": (df["cyclone_exposure_count"].min(), df["cyclone_exposure_count"].max()),
            "cyclone_wind": (df["max_cyclone_wind"].min(), df["max_cyclone_wind"].max()),
            "pop": (df["population"].min(), df["population"].max()),
            "pop_dens": (df["population_density"].min(), df["population_density"].max()),
            "dilap_houses": (df["dilapidated_houses"].min(), df["dilapidated_houses"].max()),
            "dilap_pct": (df["dilapidated_house_pct"].min(), df["dilapidated_house_pct"].max()),
            "hospitals": (df["hospital_count"].min(), df["hospital_count"].max()),
            "beds": (df["hospital_bed_count"].min(), df["hospital_bed_count"].max()),
        }

        results = []

        for _, row in df.iterrows():
            dist_id = str(row.get("district_id", ""))
            state = str(row.get("state", ""))
            district = str(row.get("district", ""))
            lat = row.get("latitude")
            lon = row.get("longitude")

            has_coords = not (pd.isna(lat) or pd.isna(lon))
            spatial_available = bool(has_coords)

            missing_data = []

            # Track primary metric inputs for completeness
            primary_inputs = [
                ("average_rainfall", row.get("average_rainfall")),
                ("maximum_rainfall", row.get("maximum_rainfall")),
                ("annual_actual_rainfall", row.get("annual_actual_rainfall")),
                ("rainfall_departure_pct", row.get("rainfall_departure_pct")),
                ("heavy_rainfall_days", row.get("heavy_rainfall_days")),
                ("historical_disaster_count", row.get("historical_disaster_count")),
                ("historical_flood_count", row.get("historical_flood_count")),
                ("historical_landslide_count", row.get("historical_landslide_count")),
                ("landslide_event_count", row.get("landslide_event_count")),
                ("historical_cyclone_count", row.get("historical_cyclone_count")),
                ("cyclone_track_count", row.get("cyclone_track_count")),
                ("cyclone_exposure_count", row.get("cyclone_exposure_count")),
                ("max_cyclone_wind", row.get("max_cyclone_wind")),
                ("population", row.get("population")),
                ("population_density", row.get("population_density")),
                ("dilapidated_houses", row.get("dilapidated_houses")),
                ("dilapidated_house_pct", row.get("dilapidated_house_pct")),
                ("hospital_count", row.get("hospital_count")),
                ("hospital_bed_count", row.get("hospital_bed_count")),
                ("latitude", lat),
                ("longitude", lon),
            ]

            for name, val in primary_inputs:
                if pd.isna(val) or val is None:
                    missing_data.append(name)

            total_inputs = len(primary_inputs)
            available_inputs = total_inputs - len(missing_data)
            data_completeness = round(available_inputs / total_inputs, 2)

            if data_completeness >= 0.85:
                confidence = "HIGH"
            elif data_completeness >= 0.60:
                confidence = "MEDIUM"
            else:
                confidence = "LOW"

            # 1. Rainfall Risk (Base Weight: 0.20)
            r_avg = min_max_scale(row.get("average_rainfall"), *bounds["avg_rain"])
            r_max = min_max_scale(row.get("maximum_rainfall"), *bounds["max_rain"])
            r_ann = min_max_scale(row.get("annual_actual_rainfall"), *bounds["ann_rain"])
            r_heavy = min_max_scale(row.get("heavy_rainfall_days"), *bounds["heavy_days"])

            rain_vals = [v for v in [r_avg, r_max, r_ann, r_heavy] if not pd.isna(v)]
            rainfall_risk_score = round(float(np.mean(rain_vals)), 2) if rain_vals else np.nan

            # 2. Flood / Disaster Risk (Base Weight: 0.15)
            f_dis = min_max_scale(row.get("historical_disaster_count"), *bounds["disasters"])
            f_fl = min_max_scale(row.get("historical_flood_count"), *bounds["floods"])
            flood_vals = [v for v in [f_dis, f_fl] if not pd.isna(v)]
            flood_risk_score = round(float(np.mean(flood_vals)), 2) if flood_vals else 0.0

            # 3. Landslide Risk (Base Weight: 0.15)
            ls_h = min_max_scale(row.get("historical_landslide_count"), *bounds["landslide_hist"])
            ls_p = min_max_scale(row.get("landslide_event_count"), *bounds["landslide_pts"])
            ls_vals = [v for v in [ls_h, ls_p] if not pd.isna(v)]
            landslide_risk_score = round(float(np.mean(ls_vals)), 2) if ls_vals else 0.0

            # 4. Cyclone Proximity Exposure Risk (Base Weight: 0.15)
            cy_h = min_max_scale(row.get("historical_cyclone_count"), *bounds["cyclone_hist"])
            cy_t = min_max_scale(row.get("cyclone_track_count"), *bounds["cyclone_tracks"])
            cy_e = min_max_scale(row.get("cyclone_exposure_count"), *bounds["cyclone_exp"])
            cy_w = min_max_scale(row.get("max_cyclone_wind"), *bounds["cyclone_wind"])
            cy_vals = [v for v in [cy_h, cy_t, cy_e, cy_w] if not pd.isna(v)]
            cyclone_risk_score = round(float(np.mean(cy_vals)), 2) if cy_vals else 0.0

            # 5. Population Exposure Risk (Base Weight: 0.15)
            p_pop = min_max_scale(row.get("population"), *bounds["pop"])
            p_dens = min_max_scale(row.get("population_density"), *bounds["pop_dens"])
            p_vals = [v for v in [p_pop, p_dens] if not pd.isna(v)]
            pop_exposure_score = round(float(np.mean(p_vals)), 2) if p_vals else 0.0

            # 6. Housing Vulnerability Risk (Base Weight: 0.10)
            h_dil = min_max_scale(row.get("dilapidated_houses"), *bounds["dilap_houses"])
            h_pct = min_max_scale(row.get("dilapidated_house_pct"), *bounds["dilap_pct"])
            h_vals = [v for v in [h_dil, h_pct] if not pd.isna(v)]
            housing_vulnerability_score = round(float(np.mean(h_vals)), 2) if h_vals else 0.0

            # 7. Infrastructure Risk / Coping Capacity (Base Weight: 0.10)
            # Higher hospital/bed count = higher coping capacity = lower infrastructure risk score
            i_hosp = min_max_scale(row.get("hospital_count"), *bounds["hospitals"])
            i_beds = min_max_scale(row.get("hospital_bed_count"), *bounds["beds"])
            i_vals = [v for v in [i_hosp, i_beds] if not pd.isna(v)]
            coping_capacity_score = float(np.mean(i_vals)) if i_vals else 0.0
            infrastructure_risk_score = round(max(0.0, 100.0 - coping_capacity_score), 2)

            # Combine weighted hazard components with dynamic weight adjustment for missing components
            component_weights = [
                (rainfall_risk_score, 0.20),
                (flood_risk_score, 0.15),
                (landslide_risk_score, 0.15),
                (cyclone_risk_score, 0.15),
                (pop_exposure_score, 0.15),
                (housing_vulnerability_score, 0.10),
                (infrastructure_risk_score, 0.10),
            ]

            valid_weighted_scores = [(score, weight) for score, weight in component_weights if not pd.isna(score)]

            if valid_weighted_scores:
                total_weight = sum(w for _, w in valid_weighted_scores)
                weighted_sum = sum(s * w for s, w in valid_weighted_scores)
                overall_hazard_score = round(weighted_sum / total_weight, 2)
                redistributed_weights_sum = round(sum(w / total_weight for _, w in valid_weighted_scores), 4)
            else:
                overall_hazard_score = 0.0
                redistributed_weights_sum = 0.0

            # Determine Risk Level
            if overall_hazard_score >= 75.01:
                risk_level = "CRITICAL"
            elif overall_hazard_score >= 50.01:
                risk_level = "HIGH"
            elif overall_hazard_score >= 25.01:
                risk_level = "MODERATE"
            else:
                risk_level = "LOW"

            results.append({
                "district_id": dist_id,
                "state": state,
                "district": district,
                "latitude": float(lat) if not pd.isna(lat) else None,
                "longitude": float(lon) if not pd.isna(lon) else None,
                "analytical_level": "district",
                "flood_risk_score": flood_risk_score,
                "landslide_risk_score": landslide_risk_score,
                "cyclone_risk_score": cyclone_risk_score,
                "cyclone_proximity_exposure": cyclone_risk_score,  # explicitly labeled proximity exposure metric
                "rainfall_risk_score": rainfall_risk_score if not pd.isna(rainfall_risk_score) else None,
                "population_exposure_score": pop_exposure_score,
                "housing_vulnerability_score": housing_vulnerability_score,
                "infrastructure_risk_score": infrastructure_risk_score,
                "overall_hazard_score": overall_hazard_score,
                "risk_level": risk_level,
                "data_completeness_score": data_completeness,
                "analysis_confidence": confidence,
                "redistributed_weights_sum": redistributed_weights_sum,
                "missing_data": missing_data,
                "spatial_analysis_available": spatial_available,
            })

        self._analyzed_results = results
        return results

    def get_district_hazard(self, district_id: str) -> Optional[Dict[str, Any]]:
        results = self.analyze_all_districts()
        for res in results:
            if res["district_id"].upper() == district_id.upper():
                return res
        return None

    def filter_hazards(
        self,
        state: Optional[str] = None,
        district: Optional[str] = None,
        risk_level: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        results = self.analyze_all_districts()
        filtered = results

        if state:
            st_clean = state.strip().lower()
            filtered = [r for r in filtered if st_clean in r["state"].lower()]

        if district:
            dt_clean = district.strip().lower()
            filtered = [r for r in filtered if dt_clean in r["district"].lower()]

        if risk_level:
            rl_clean = risk_level.strip().upper()
            filtered = [r for r in filtered if r["risk_level"].upper() == rl_clean]

        return filtered


# Global Singleton Instance
hazard_engine = HazardEngine()
