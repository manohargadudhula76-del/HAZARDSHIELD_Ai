import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional, Union

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MASTER_DATASET_PATH = BASE_DIR / "datasets" / "master" / "master_habitations.csv"


def min_max_scale(val: float, min_val: float, max_val: float) -> Optional[float]:
    """
    Min-max scales a value to [0.0, 100.0].
    Handles zero division safely. Returns None if value is missing/NaN.
    """
    if val is None or pd.isna(val):
        return None
    if max_val <= min_val:
        return 0.0 if min_val == 0.0 else 50.0
    scaled = (float(val) - float(min_val)) / (float(max_val) - float(min_val)) * 100.0
    return max(0.0, min(100.0, round(scaled, 2)))


class CarryingCapacityEngine:
    """
    7-Sector Carrying Capacity Assessment Engine for HazardShield AI.
    Calculates capacity scores on a standardized 0 (very poor) to 100 (excellent) scale.
    Dynamically redistributes weights for available sectors and handles missing sectors transparently.
    """

    SECTOR_WEIGHTS = {
        "population_density": 0.20,
        "housing": 0.20,
        "healthcare": 0.15,
        "education": 0.15,
        "water": 0.10,
        "shelter": 0.10,
        "road_evacuation": 0.10,
    }

    ALL_SECTORS = [
        "population_density",
        "housing",
        "healthcare",
        "education",
        "water",
        "shelter",
        "road_evacuation",
    ]

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
        if self._analyzed_results is not None:
            return self._analyzed_results

        df = self.load_dataset().copy()

        # Compute empirical bounds for scaling
        pop_dens_min = df["population_density"].min()
        pop_dens_max = df["population_density"].max()

        # Hospitals per 100k population
        df["hospitals_per_100k"] = df.apply(
            lambda r: (r["hospital_count"] / r["population"] * 100000.0)
            if not pd.isna(r["population"]) and r["population"] > 0 and not pd.isna(r.get("hospital_count"))
            else np.nan,
            axis=1
        )
        hosp_min = df["hospitals_per_100k"].min()
        hosp_max = df["hospitals_per_100k"].max()

        results = []

        for _, row in df.iterrows():
            dist_id = str(row.get("district_id", ""))
            state = str(row.get("state", ""))
            district = str(row.get("district", ""))
            lat = row.get("latitude")
            lon = row.get("longitude")
            has_coords = not (pd.isna(lat) or pd.isna(lon))

            # 1. Population Density Capacity (lower density = higher capacity score)
            pop_dens = row.get("population_density")
            if not pd.isna(pop_dens):
                scaled_dens = min_max_scale(pop_dens, pop_dens_min, pop_dens_max)
                pop_dens_score = round(100.0 - scaled_dens, 2) if scaled_dens is not None else None
            else:
                pop_dens_score = None

            # 2. Housing Capacity (good_house_pct + 0.5 * livable_house_pct)
            tot_h = row.get("total_households")
            good_h = row.get("good_houses")
            livable_h = row.get("livable_houses")

            if not pd.isna(tot_h) and tot_h > 0:
                g_pct = (good_h / tot_h * 100.0) if not pd.isna(good_h) else 0.0
                l_pct = (livable_h / tot_h * 100.0) if not pd.isna(livable_h) else 0.0
                housing_score = max(0.0, min(100.0, round(g_pct + 0.5 * l_pct, 2)))
            else:
                housing_score = None

            # 3. Healthcare Capacity (hospitals per 100k)
            hosp_per_100k = row.get("hospitals_per_100k")
            if not pd.isna(hosp_per_100k):
                healthcare_score = min_max_scale(hosp_per_100k, hosp_min, hosp_max)
            else:
                healthcare_score = None

            # 4. Education Capacity (UNAVAILABLE - no district dataset)
            education_score = None

            # 5. Water Availability (UNAVAILABLE - no district dataset)
            water_score = None

            # 6. Shelter Capacity (UNAVAILABLE - no district dataset)
            shelter_score = None

            # 7. Road / Evacuation Access (UNAVAILABLE - no district dataset)
            road_score = None

            # Dynamic weight redistribution
            sector_scores = {
                "population_density": pop_dens_score,
                "housing": housing_score,
                "healthcare": healthcare_score,
                "education": education_score,
                "water": water_score,
                "shelter": shelter_score,
                "road_evacuation": road_score,
            }

            available_sectors = [sec for sec, sc in sector_scores.items() if sc is not None and not pd.isna(sc)]
            missing_sectors = [sec for sec in self.ALL_SECTORS if sec not in available_sectors]

            if available_sectors:
                sum_avail_weights = sum(self.SECTOR_WEIGHTS[sec] for sec in available_sectors)
                redistributed_weights = {
                    sec: round(self.SECTOR_WEIGHTS[sec] / sum_avail_weights, 4)
                    for sec in available_sectors
                }
                weighted_sum = sum(sector_scores[sec] * redistributed_weights[sec] for sec in available_sectors)
                overall_score = round(weighted_sum, 2)
                redistributed_weights_sum = round(sum(redistributed_weights.values()), 4)
            else:
                overall_score = 0.0
                redistributed_weights = {}
                redistributed_weights_sum = 0.0

            # Level classification
            if overall_score >= 75.01:
                level = "HIGH_CAPACITY"
            elif overall_score >= 50.01:
                level = "MODERATE_CAPACITY"
            elif overall_score >= 25.01:
                level = "LOW_CAPACITY"
            else:
                level = "CRITICAL_CAPACITY"

            completeness = round(len(available_sectors) / 7.0, 2)

            if len(available_sectors) >= 6:
                confidence = "HIGH"
            elif len(available_sectors) >= 3:
                confidence = "MEDIUM"
            else:
                confidence = "LOW"

            results.append({
                "district_id": dist_id,
                "state": state,
                "district": district,
                "analytical_level": "district",
                "population_density_capacity_score": pop_dens_score,
                "housing_capacity_score": housing_score,
                "healthcare_capacity_score": healthcare_score,
                "education_capacity_score": education_score,
                "water_capacity_score": water_score,
                "shelter_capacity_score": shelter_score,
                "road_evacuation_capacity_score": road_score,
                "overall_carrying_capacity_score": overall_score,
                "carrying_capacity_level": level,
                "available_sectors": available_sectors,
                "missing_sectors": missing_sectors,
                "data_completeness_score": completeness,
                "assessment_confidence": confidence,
                "redistributed_weights": redistributed_weights,
                "redistributed_weights_sum": redistributed_weights_sum,
                "latitude": float(lat) if not pd.isna(lat) else None,
                "longitude": float(lon) if not pd.isna(lon) else None,
                "spatial_analysis_available": bool(has_coords),
            })

        self._analyzed_results = results
        return results

    def get_district_capacity(self, district_id: str) -> Optional[Dict[str, Any]]:
        results = self.analyze_all_districts()
        for res in results:
            if res["district_id"].upper() == district_id.upper():
                return res
        return None

    def filter_capacities(
        self,
        state: Optional[str] = None,
        carrying_capacity_level: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        results = self.analyze_all_districts()
        filtered = results

        if state:
            st_clean = state.strip().lower()
            filtered = [r for r in filtered if st_clean in r["state"].lower()]

        if carrying_capacity_level:
            lvl_clean = carrying_capacity_level.strip().upper()
            filtered = [r for r in filtered if r["carrying_capacity_level"].upper() == lvl_clean]

        return filtered


carrying_capacity_engine = CarryingCapacityEngine()
