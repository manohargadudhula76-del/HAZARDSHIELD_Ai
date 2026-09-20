import json
import logging
import math
import pandas as pd
import numpy as np
try:
    import geopandas as gpd
except ImportError:
    gpd = None
from shapely.geometry import Point

from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional
from app.services.district_reconciler import normalize_string, get_canonical_state, get_canonical_district

logger = logging.getLogger("master_aggregator")

# Distance threshold for cyclone exposure to district centroids (in kilometers)
CYCLONE_DISTANCE_THRESHOLD_KM = 100.0


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates great-circle distance between two points on Earth in kilometers.
    """
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def find_column(df: pd.DataFrame, candidates: List[str]) -> Optional[str]:
    """
    Finds matching column name in DataFrame case-insensitively, ignoring spaces and underscores.
    """
    if df is None or df.empty:
        return None
    norm_map = {str(c).lower().replace("_", "").replace(" ", "").strip(): c for c in df.columns}
    for cand in candidates:
        key = cand.lower().replace("_", "").replace(" ", "").strip()
        if key in norm_map:
            return norm_map[key]
    return None


class MasterAggregator:
    """
    Domain aggregation engine for Phase 2.5 real master dataset generation.
    Processes rainfall, housing, historical disasters, landslides, cyclones, infrastructure, and GIS metrics.
    """

    @classmethod
    def aggregate_rainfall(cls, df_rain: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Aggregates daily IMD district-level rainfall data to district summaries.
        Computes average_rainfall, maximum_rainfall, annual_actual_rainfall, rainfall_departure_pct, heavy_rainfall_days.
        """
        if df_rain is None or df_rain.empty:
            return pd.DataFrame(), {"matched_rows": 0, "total_raw_rows": 0}

        df = df_rain.copy()
        raw_count = len(df)

        st_col = find_column(df, ["state", "state_name", "statename"])
        dt_col = find_column(df, ["district", "district_name", "districtname"])

        if not st_col or not dt_col:
            logger.warning("Rainfall dataset missing state or district columns.")
            return pd.DataFrame(), {"total_raw_rows": raw_count, "error": "Missing geographic columns"}

        df["state_std"] = df[st_col].apply(get_canonical_state)
        df["district_std"] = df[dt_col].apply(get_canonical_district)

        rain_col = find_column(df, ["rainfall", "actual", "daily_actual", "weekly_actual", "average_rainfall"])
        dep_col = find_column(df, ["daily_departure_per", "weekly_departure_per", "cumulative_departue_per", "departure"])

        df["rain_val"] = pd.to_numeric(df[rain_col], errors="coerce").fillna(0.0) if rain_col else 0.0
        df["dep_val"] = pd.to_numeric(df[dep_col], errors="coerce") if dep_col else np.nan

        # Compute heavy rainfall days (> 64.5 mm per IMD definition)
        df["is_heavy"] = (df["rain_val"] >= 64.5).astype(int)

        agg_dict = {
            "rain_val": ["mean", "max", "sum"],
            "dep_val": "mean",
            "is_heavy": "sum"
        }

        grouped = df.groupby(["state_std", "district_std"], as_index=False).agg(agg_dict)
        grouped.columns = [
            "state_std", "district_std",
            "average_rainfall", "maximum_rainfall", "annual_actual_rainfall",
            "rainfall_departure_pct", "heavy_rainfall_days"
        ]

        # Round numeric values
        grouped["average_rainfall"] = grouped["average_rainfall"].round(2)
        grouped["maximum_rainfall"] = grouped["maximum_rainfall"].round(2)
        grouped["annual_actual_rainfall"] = grouped["annual_actual_rainfall"].round(2)
        grouped["rainfall_departure_pct"] = grouped["rainfall_departure_pct"].round(2).fillna(0.0)

        report = {
            "total_raw_rows": raw_count,
            "aggregated_districts": len(grouped)
        }

        return grouped, report

    @classmethod
    def aggregate_housing(cls, df_housing: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Aggregates Census housing HLPCA data to district level.
        Prevents subtotal double-counting by filtering for rural_urban == 'Total'.
        Derives total_households, good_houses, livable_houses, dilapidated_houses, dilapidated_house_pct.
        """
        if df_housing is None or df_housing.empty:
            return pd.DataFrame(), {"matched_rows": 0, "total_raw_rows": 0}

        df = df_housing.copy()
        raw_count = len(df)

        st_col = find_column(df, ["state", "state_name", "statename"])
        dt_col = find_column(df, ["district", "district_name", "districtname"])

        if not st_col or not dt_col:
            return pd.DataFrame(), {"total_raw_rows": raw_count, "error": "Missing geographic columns"}

        df["state_std"] = df[st_col].apply(get_canonical_state)
        df["district_std"] = df[dt_col].apply(get_canonical_district)

        # Filter for Total category if rural_urban exists (to avoid subtotal double-counting)
        ru_col = find_column(df, ["rural_urban", "tru", "total_rural_urban"])
        if ru_col:
            df_total = df[df[ru_col].astype(str).str.strip().str.upper() == "TOTAL"].copy()
            if df_total.empty:
                df_total = df.copy()
        else:
            df_total = df.copy()

        tot_col = find_column(df_total, ["total_households", "total_number_of_residence_households", "households", "total_number_of_households"])
        good_col = find_column(df_total, ["good_houses", "total_number_of_residence_good", "total_number_of_good", "residence_good"])
        liv_col = find_column(df_total, ["livable_houses", "total_number_of_residence_livable", "total_number_of_livable", "residence_livable"])
        dilap_col = find_column(df_total, ["dilapidated_houses", "total_number_of_residence_dilapidated", "total_number_of_dilapidated", "residence_dilapidated"])

        df_total["tot_num"] = pd.to_numeric(df_total[tot_col], errors="coerce").fillna(0) if tot_col else 0
        df_total["good_num"] = pd.to_numeric(df_total[good_col], errors="coerce").fillna(0) if good_col else 0
        df_total["liv_num"] = pd.to_numeric(df_total[liv_col], errors="coerce").fillna(0) if liv_col else 0
        df_total["dilap_num"] = pd.to_numeric(df_total[dilap_col], errors="coerce").fillna(0) if dilap_col else 0

        grouped = df_total.groupby(["state_std", "district_std"], as_index=False).agg({
            "tot_num": "sum",
            "good_num": "sum",
            "liv_num": "sum",
            "dilap_num": "sum"
        })

        grouped.rename(columns={
            "tot_num": "total_households",
            "good_num": "good_houses",
            "liv_num": "livable_houses",
            "dilap_num": "dilapidated_houses"
        }, inplace=True)

        tot_h = grouped["total_households"].replace(0, np.nan)
        grouped["dilapidated_house_pct"] = ((grouped["dilapidated_houses"] / tot_h) * 100.0).round(2).fillna(0.0)
        grouped["good_house_pct"] = ((grouped["good_houses"] / tot_h) * 100.0).round(2).fillna(0.0)
        grouped["livable_house_pct"] = ((grouped["livable_houses"] / tot_h) * 100.0).round(2).fillna(0.0)

        report = {
            "total_raw_rows": raw_count,
            "filtered_total_rows": len(df_total),
            "aggregated_districts": len(grouped)
        }

        return grouped, report

    @classmethod
    def aggregate_disasters(cls, df_disaster: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Aggregates historical EM-DAT disaster catalog events.
        Computes historical_disaster_count, historical_flood_count, historical_landslide_count, historical_cyclone_count.
        """
        if df_disaster is None or df_disaster.empty:
            return pd.DataFrame(), {"total_raw_rows": 0, "matched_districts": 0}

        df = df_disaster.copy()
        raw_count = len(df)

        st_col = find_column(df, ["state", "location", "country"])
        dt_col = find_column(df, ["district", "location"])

        if not st_col or not dt_col:
            return pd.DataFrame(), {"total_raw_rows": raw_count, "error": "Missing geographic columns"}

        df["state_std"] = df[st_col].apply(get_canonical_state)
        df["district_std"] = df[dt_col].apply(get_canonical_district)

        dis_type_col = find_column(df, ["disaster_type", "disastertype", "event", "type"])
        df["dis_type_clean"] = df[dis_type_col].astype(str).str.lower() if dis_type_col else "disaster"

        df["is_flood"] = df["dis_type_clean"].str.contains("flood").astype(int)
        df["is_slide"] = df["dis_type_clean"].str.contains("slide").astype(int)
        df["is_cyclone"] = df["dis_type_clean"].str.contains("storm|cyclone").astype(int)
        df["is_disaster"] = 1

        grouped = df.groupby(["state_std", "district_std"], as_index=False).agg({
            "is_disaster": "sum",
            "is_flood": "sum",
            "is_slide": "sum",
            "is_cyclone": "sum"
        })

        grouped.rename(columns={
            "is_disaster": "historical_disaster_count",
            "is_flood": "historical_flood_count",
            "is_slide": "historical_landslide_count",
            "is_cyclone": "historical_cyclone_count"
        }, inplace=True)

        report = {
            "total_raw_rows": raw_count,
            "matched_districts": len(grouped)
        }

        return grouped, report

    @classmethod
    def aggregate_landslides_spatial(
        cls,
        df_landslides: pd.DataFrame,
        gdf_gis: gpd.GeoDataFrame
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Spatially assigns NASA landslide event points to district polygons via GeoPandas point-in-polygon.
        Computes landslide_event_count and tracks unmapped points.
        """
        if df_landslides is None or df_landslides.empty or gdf_gis is None or gdf_gis.empty:
            return pd.DataFrame(), {"total_points": 0, "mapped_points": 0, "unmapped_points": 0}

        df_ls = df_landslides.copy()
        raw_count = len(df_ls)

        lat_col = find_column(df_ls, ["latitude", "lat"])
        lon_col = find_column(df_ls, ["longitude", "lon", "lng"])

        if not lat_col or not lon_col:
            return pd.DataFrame(), {"total_points": raw_count, "error": "Missing lat/lon columns"}

        df_ls["lat_num"] = pd.to_numeric(df_ls[lat_col], errors="coerce")
        df_ls["lon_num"] = pd.to_numeric(df_ls[lon_col], errors="coerce")

        valid_points = df_ls.dropna(subset=["lat_num", "lon_num"]).copy()
        geometry = [Point(xy) for xy in zip(valid_points["lon_num"], valid_points["lat_num"])]
        gdf_points = gpd.GeoDataFrame(valid_points, geometry=geometry, crs="EPSG:4326")

        # Ensure GIS GeoDataFrame is in EPSG:4326
        if gdf_gis.crs is None or gdf_gis.crs != "EPSG:4326":
            gdf_gis_4326 = gdf_gis.to_crs("EPSG:4326")
        else:
            gdf_gis_4326 = gdf_gis

        joined = gpd.sjoin(gdf_points, gdf_gis_4326, how="inner", predicate="intersects")

        mapped_count = len(joined)
        unmapped_count = raw_count - mapped_count

        st_gis_col = find_column(joined, ["state", "state_name", "stname"])
        dt_gis_col = find_column(joined, ["district", "dtname", "district_name"])

        joined["state_std"] = joined[st_gis_col].apply(get_canonical_state) if st_gis_col else "unknown"
        joined["district_std"] = joined[dt_gis_col].apply(get_canonical_district) if dt_gis_col else "unknown"

        grouped = joined.groupby(["state_std", "district_std"], as_index=False).size()
        grouped.rename(columns={"size": "landslide_event_count"}, inplace=True)

        report = {
            "total_landslide_points": raw_count,
            "spatially_mapped_points": mapped_count,
            "unmapped_points": unmapped_count,
            "spatial_match_rate_pct": round((mapped_count / raw_count * 100), 2) if raw_count > 0 else 0.0
        }

        return grouped, report

    @classmethod
    def aggregate_cyclones_spatial(
        cls,
        df_cyclones: pd.DataFrame,
        df_centroids: pd.DataFrame,
        threshold_km: float = CYCLONE_DISTANCE_THRESHOLD_KM
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Processes IBTrACS cyclone track points and computes proximity exposure to district centroids.
        Derives cyclone_track_count, cyclone_exposure_count, max_cyclone_wind within threshold_km.
        """
        if df_cyclones is None or df_cyclones.empty or df_centroids is None or df_centroids.empty:
            return pd.DataFrame(), {"total_track_points": 0, "districts_exposed": 0}

        df_cy = df_cyclones.copy()
        raw_count = len(df_cy)

        # Handle IBTrACS header / unit row
        sid_col = find_column(df_cy, ["sid", "storm_id"])
        lat_col = find_column(df_cy, ["lat", "latitude", "usa_lat"])
        lon_col = find_column(df_cy, ["lon", "longitude", "usa_lon"])
        wind_col = find_column(df_cy, ["usa_wind", "newdelhi_wind", "wmo_wind", "wind"])

        if sid_col:
            df_cy = df_cy[df_cy[sid_col].astype(str).str.upper() != "SID"]
        if lat_col:
            df_cy = df_cy[df_cy[lat_col].astype(str).str.upper() != "LAT"]

        df_cy["lat_num"] = pd.to_numeric(df_cy[lat_col], errors="coerce") if lat_col else np.nan
        df_cy["lon_num"] = pd.to_numeric(df_cy[lon_col], errors="coerce") if lon_col else np.nan
        df_cy["wind_num"] = pd.to_numeric(df_cy[wind_col], errors="coerce").fillna(0.0) if wind_col else 0.0

        cy_valid = df_cy.dropna(subset=["lat_num", "lon_num"]).copy()

        district_exposures = []

        for idx, cent_row in df_centroids.iterrows():
            c_lat = cent_row.get("latitude")
            c_lon = cent_row.get("longitude")
            st_std = cent_row.get("state_std")
            dt_std = cent_row.get("district_std")
            dist_id = cent_row.get("district_id")

            if pd.isna(c_lat) or pd.isna(c_lon):
                continue

            # Quick bounding box filter (+/- 2.0 degrees ~ 220 km)
            sub_cy = cy_valid[
                (cy_valid["lat_num"] >= c_lat - 2.0) & (cy_valid["lat_num"] <= c_lat + 2.0) &
                (cy_valid["lon_num"] >= c_lon - 2.0) & (cy_valid["lon_num"] <= c_lon + 2.0)
            ].copy()

            if sub_cy.empty:
                continue

            distances = [
                haversine_distance_km(c_lat, c_lon, r["lat_num"], r["lon_num"])
                for _, r in sub_cy.iterrows()
            ]
            sub_cy["dist_km"] = distances
            in_range = sub_cy[sub_cy["dist_km"] <= threshold_km]

            if not in_range.empty:
                track_count = in_range[sid_col].nunique() if sid_col and sid_col in in_range.columns else len(in_range)
                exp_count = len(in_range)
                max_wind = float(in_range["wind_num"].max())

                district_exposures.append({
                    "district_id": dist_id,
                    "state_std": st_std,
                    "district_std": dt_std,
                    "cyclone_track_count": track_count,
                    "cyclone_exposure_count": exp_count,
                    "max_cyclone_wind": round(max_wind, 2)
                })

        exp_df = pd.DataFrame(district_exposures)

        report = {
            "total_ibtracs_track_points": raw_count,
            "valid_coordinates_points": len(cy_valid),
            "distance_threshold_km": threshold_km,
            "districts_exposed_count": len(exp_df)
        }

        return exp_df, report

    @classmethod
    def aggregate_infrastructure(cls, df_infra: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Aggregates hospital directory facilities to district level.
        Derives hospital_count and hospital_bed_count.
        """
        if df_infra is None or df_infra.empty:
            return pd.DataFrame(), {"total_facilities": 0, "aggregated_districts": 0}

        df = df_infra.copy()
        raw_count = len(df)

        st_col = find_column(df, ["state", "state_name", "statename"])
        dt_col = find_column(df, ["district", "district_name", "districtname"])

        if not st_col or not dt_col:
            return pd.DataFrame(), {"total_raw_facilities": raw_count, "error": "Missing geographic columns"}

        df["state_std"] = df[st_col].apply(get_canonical_state)
        df["district_std"] = df[dt_col].apply(get_canonical_district)

        bed_col = find_column(df, ["total_beds", "beds", "totalbeds", "num_beds"])
        if bed_col:
            df["total_beds_num"] = pd.to_numeric(df[bed_col], errors="coerce").fillna(0)
        else:
            df["total_beds_num"] = 0

        df["facility_count"] = 1

        grouped = df.groupby(["state_std", "district_std"], as_index=False).agg({
            "facility_count": "sum",
            "total_beds_num": "sum"
        })

        grouped.rename(columns={
            "facility_count": "hospital_count",
            "total_beds_num": "hospital_bed_count"
        }, inplace=True)

        report = {
            "total_raw_facilities": raw_count,
            "aggregated_districts": len(grouped)
        }

        return grouped, report

    @classmethod
    def extract_gis_metrics(cls, gdf_gis: gpd.GeoDataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Derives polygon centroid latitude, longitude, and calculates projected district_area_sq_km using EPSG:7755 (India Albers Equal Area).
        """
        if gdf_gis is None or gdf_gis.empty:
            return pd.DataFrame(), {"total_polygons": 0}

        gdf = gdf_gis.copy()
        raw_count = len(gdf)

        if gdf.crs is None:
            gdf = gdf.set_crs("EPSG:7755")

        # Ensure geometries are valid
        try:
            gdf["geometry"] = gdf.geometry.make_valid()
        except Exception:
            gdf["geometry"] = gdf.geometry.buffer(0)

        # Reproject to EPSG:7755 if needed for equal-area area calculation
        if str(gdf.crs).upper() != "EPSG:7755":
            gdf_proj = gdf.to_crs("EPSG:7755")
        else:
            gdf_proj = gdf

        gdf["district_area_sq_km"] = (gdf_proj.geometry.area / 1e6).round(2)

        # Calculate centroids in projected CRS EPSG:7755 and transform to EPSG:4326 lat/lon degrees
        try:
            centroids_proj = gdf_proj.geometry.centroid
            centroids_4326 = centroids_proj.to_crs("EPSG:4326")
            gdf["latitude"] = centroids_4326.y.round(6)
            gdf["longitude"] = centroids_4326.x.round(6)
        except Exception:
            gdf_4326 = gdf.to_crs("EPSG:4326")
            centroids_4326 = gdf_4326.geometry.centroid
            gdf["latitude"] = centroids_4326.y.round(6)
            gdf["longitude"] = centroids_4326.x.round(6)

        st_col = find_column(gdf, ["state", "state_name", "stname"])
        dt_col = find_column(gdf, ["district", "dtname", "district_name"])

        gdf["state_std"] = gdf[st_col].apply(get_canonical_state) if st_col else "unknown"
        gdf["district_std"] = gdf[dt_col].apply(get_canonical_district) if dt_col else "unknown"

        res_df = pd.DataFrame(gdf[["state_std", "district_std", "latitude", "longitude", "district_area_sq_km"]])
        res_df = res_df.groupby(["state_std", "district_std"], as_index=False).first()

        report = {
            "total_gis_polygons": raw_count,
            "unique_gis_districts": len(res_df),
            "projected_crs_used": "EPSG:7755 (India Albers Equal Area)"
        }

        return res_df, report
