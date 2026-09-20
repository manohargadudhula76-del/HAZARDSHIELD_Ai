import os
import math
import time
import logging
import urllib.request
import json
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger('hazardshield.gis')

ROUTING_API_URL = os.getenv('ROUTING_API_URL', 'https://router.project-osrm.org')
GEOCODING_API_URL = os.getenv('GEOCODING_API_URL', 'https://nominatim.openstreetmap.org')

_ROUTE_CACHE: Dict[str, Tuple[float, Dict[str, Any]]] = {}
CACHE_TTL_SECONDS = 3600


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(r * c, 2)


def generate_fallback_geometry(
    lat1: float, lon1: float, lat2: float, lon2: float, detour_offset: float = 0.0, steps: int = 12
) -> List[List[float]]:
    coords = []
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    perp_lat = -dlon * 0.15 + (detour_offset * 0.05)
    perp_lon = dlat * 0.15 + (detour_offset * 0.05)

    for i in range(steps + 1):
        t = i / steps
        curve = math.sin(t * math.pi)
        lat = lat1 + t * dlat + curve * perp_lat
        lon = lon1 + t * dlon + curve * perp_lon
        coords.append([round(lon, 6), round(lat, 6)])
    return coords


def calculate_route(
    start_lat: float,
    start_lon: float,
    end_lat: float,
    end_lon: float,
    is_closed: bool = False,
    avoid_road: Optional[str] = None
) -> Dict[str, Any]:
    cache_key = f"{start_lat:.4f},{start_lon:.4f}_{end_lat:.4f},{end_lon:.4f}_{is_closed}_{avoid_road}"
    now = time.time()
    if cache_key in _ROUTE_CACHE:
        cache_time, cached_val = _ROUTE_CACHE[cache_key]
        if now - cache_time < CACHE_TTL_SECONDS:
            return cached_val

    base_dist = haversine_distance(start_lat, start_lon, end_lat, end_lon)

    if is_closed:
        detour_factor = 1.35
        detour_dist = round(base_dist * detour_factor, 2)
        detour_time = round((detour_dist / 32.0) * 60 + 15, 1)
        coords = generate_fallback_geometry(start_lat, start_lon, end_lat, end_lon, detour_offset=1.5, steps=16)

        result = {
            'distance_km': detour_dist,
            'duration_minutes': detour_time,
            'status': 'ALTERNATIVE_DETOUR',
            'is_detour': True,
            'road_condition': 'CLOSED_AVOIDED',
            'closure_reason': avoid_road or 'Simulated high-water flash flood / landslide submergence',
            'geometry': {
                'type': 'LineString',
                'coordinates': coords
            },
            'source': 'Prototype Detour Engine (OSM Grid)'
        }
        _ROUTE_CACHE[cache_key] = (now, result)
        return result

    osrm_url = f"{ROUTING_API_URL}/route/v1/driving/{start_lon},{start_lat};{end_lon},{end_lat}?overview=full&geometries=geojson"
    try:
        req = urllib.request.Request(osrm_url, headers={'User-Agent': 'HazardShield-AI/1.0'})
        with urllib.request.urlopen(req, timeout=1.0) as resp:
            data = json.loads(resp.read().decode())
            if data.get('code') == 'Ok' and data.get('routes'):
                primary_route = data['routes'][0]
                dist_km = round(primary_route.get('distance', 0) / 1000.0, 2)
                dur_min = round(primary_route.get('duration', 0) / 60.0, 1)
                geom = primary_route.get('geometry', {})

                result = {
                    'distance_km': dist_km if dist_km > 0 else base_dist,
                    'duration_minutes': dur_min if dur_min > 0 else round((base_dist / 40.0) * 60, 1),
                    'status': 'OPTIMAL',
                    'is_detour': False,
                    'road_condition': 'OPEN',
                    'geometry': geom if geom.get('coordinates') else {
                        'type': 'LineString',
                        'coordinates': generate_fallback_geometry(start_lat, start_lon, end_lat, end_lon)
                    },
                    'source': 'OpenStreetMap OSRM'
                }
                _ROUTE_CACHE[cache_key] = (now, result)
                return result
    except Exception as ex:
        logger.info(f"OSRM fallback: {ex}")

    est_duration = round((base_dist / 38.0) * 60, 1)
    fallback_result = {
        'distance_km': base_dist,
        'duration_minutes': est_duration,
        'status': 'OPTIMAL',
        'is_detour': False,
        'road_condition': 'OPEN',
        'geometry': {
            'type': 'LineString',
            'coordinates': generate_fallback_geometry(start_lat, start_lon, end_lat, end_lon)
        },
        'source': 'Geodesic Spatial Interpolator'
    }
    _ROUTE_CACHE[cache_key] = (now, fallback_result)
    return fallback_result
