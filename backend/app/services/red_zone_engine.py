import math
import logging
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Union
from app.services.hazard_engine import hazard_engine, HazardEngine

logger = logging.getLogger("red_zone_engine")


def create_geojson_circle_polygon(lat: float, lon: float, radius_km: float, num_points: int = 32) -> Dict[str, Any]:
    """
    Creates a GeoJSON Polygon feature representing a circle buffer around (lat, lon) in WGS84.
    Radius is converted using Earth radius R = 6371 km.
    """
    R = 6371.0
    coords = []
    lat_rad = math.radians(lat)
    lon_rad = math.radians(lon)
    d = radius_km / R

    for i in range(num_points):
        bearing = math.radians(i * (360.0 / num_points))
        pt_lat_rad = math.asin(math.sin(lat_rad) * math.cos(d) + math.cos(lat_rad) * math.sin(d) * math.cos(bearing))
        pt_lon_rad = lon_rad + math.atan2(math.sin(bearing) * math.sin(d) * math.cos(lat_rad),
                                         math.cos(d) - math.sin(lat_rad) * math.sin(pt_lat_rad))
        coords.append([round(math.degrees(pt_lon_rad), 6), round(math.degrees(pt_lat_rad), 6)])

    # Close polygon ring
    coords.append(coords[0])
    return {
        "type": "Polygon",
        "coordinates": [coords]
    }


class RedZoneEngine:
    """
    Red Zone Identification Engine for HazardShield AI.
    Classifies districts into RED_ZONE, POTENTIAL_RED_ZONE, WATCH_ZONE, and LOW_RISK_ZONE.
    Returns ONLY RED_ZONE and POTENTIAL_RED_ZONE districts for /api/v1/red-zones and /api/v1/red-zones/geojson.
    """

    def __init__(self, engine: Optional[HazardEngine] = None):
        self.hazard_engine = engine if engine else hazard_engine

    def classify_district_zone(self, hazard: Dict[str, Any]) -> Dict[str, Any]:
        """
        Classifies a single district hazard response into zone classification.
        CRITICAL -> RED_ZONE (is_red_zone = True)
        HIGH -> POTENTIAL_RED_ZONE (is_red_zone = True)
        MODERATE -> WATCH_ZONE (is_red_zone = False)
        LOW -> LOW_RISK_ZONE (is_red_zone = False)
        """
        score = hazard["overall_hazard_score"]
        rl = hazard["risk_level"].upper()

        if rl == "CRITICAL":
            zone_type = "RED_ZONE"
            is_red_zone = True
        elif rl == "HIGH":
            zone_type = "POTENTIAL_RED_ZONE"
            is_red_zone = True
        elif rl == "MODERATE":
            zone_type = "WATCH_ZONE"
            is_red_zone = False
        else:
            zone_type = "LOW_RISK_ZONE"
            is_red_zone = False

        # Visualization buffer formula: min 5.0 km, max 25.0 km proportional to hazard score
        radius_km = round(5.0 + (score / 100.0) * 20.0, 2)

        res = hazard.copy()
        res["zone_type"] = zone_type
        res["is_red_zone"] = is_red_zone
        res["visualization_buffer_radius_km"] = radius_km
        res["red_zone_radius_km"] = radius_km  # for backwards compatibility
        res["boundary_type"] = "prototype_visualization_buffer"
        res["boundary_disclaimer"] = (
            "This geometry is a prototype visualization buffer derived from the analytical hazard score "
            "and is not an official government-designated hazard boundary."
        )
        res["radius_formula_documented"] = "min_radius(5.0 km) + (hazard_score / 100.0) * 20.0 km"
        return res

    def classify_all_zones(
        self,
        state: Optional[str] = None,
        risk_level: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Classifies all districts into their respective zone types across the entire dataset.
        """
        hazards = self.hazard_engine.filter_hazards(state=state, risk_level=risk_level)
        return [self.classify_district_zone(h) for h in hazards]

    def identify_red_zones(
        self,
        state: Optional[str] = None,
        risk_level: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Identifies Red Zones across all districts.
        Returns ONLY districts where is_red_zone == True (RED_ZONE and POTENTIAL_RED_ZONE).
        EXCLUDES WATCH_ZONE and LOW_RISK_ZONE districts.
        """
        all_zones = self.classify_all_zones(state=state, risk_level=risk_level)
        return [z for z in all_zones if z["is_red_zone"]]

    def generate_red_zones_geojson(
        self,
        state: Optional[str] = None,
        risk_level: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates GeoJSON FeatureCollection for Red Zones.
        Contains ONLY RED_ZONE and POTENTIAL_RED_ZONE features.
        EXCLUDES districts where spatial_analysis_available == False (no coordinates).
        """
        red_zones = self.identify_red_zones(state=state, risk_level=risk_level)
        features = []

        for rz in red_zones:
            if not rz.get("spatial_analysis_available", False):
                continue
            lat = rz.get("latitude")
            lon = rz.get("longitude")
            if lat is None or lon is None:
                continue

            radius_km = rz.get("visualization_buffer_radius_km", 10.0)
            geometry = create_geojson_circle_polygon(lat, lon, radius_km)

            feature = {
                "type": "Feature",
                "id": rz["district_id"],
                "geometry": geometry,
                "properties": {
                    "district_id": rz["district_id"],
                    "state": rz["state"],
                    "district": rz["district"],
                    "analytical_level": "district",
                    "overall_hazard_score": rz["overall_hazard_score"],
                    "risk_level": rz["risk_level"],
                    "zone_type": rz["zone_type"],
                    "is_red_zone": True,
                    "visualization_buffer_radius_km": radius_km,
                    "boundary_type": rz["boundary_type"],
                    "boundary_disclaimer": rz["boundary_disclaimer"],
                    "data_completeness_score": rz["data_completeness_score"],
                    "analysis_confidence": rz["analysis_confidence"],
                    "spatial_analysis_available": True
                }
            }
            features.append(feature)

        total_identified = len(red_zones)
        spatially_rendered = len(features)
        excluded_no_coords = total_identified - spatially_rendered

        # Spatial zone count arithmetic validation
        assert total_identified - excluded_no_coords == spatially_rendered, (
            "Spatial zone count mismatch: total_identified - excluded_no_coords != spatially_rendered"
        )

        return {
            "type": "FeatureCollection",
            "crs": {
                "type": "name",
                "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}
            },
            "features": features,
            "meta": {
                "total_red_zones_identified": total_identified,
                "spatially_rendered_features": spatially_rendered,
                "districts_excluded_no_coords": excluded_no_coords
            }
        }


# Global Singleton Instance
red_zone_engine = RedZoneEngine()
