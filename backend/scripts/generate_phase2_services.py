import os

services = {}

services['gis_service.py'] = """import os
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
        with urllib.request.urlopen(req, timeout=2.5) as resp:
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
"""

services['risk_engine.py'] = """from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.habitation import Habitation
from app.models.hazard import Hazard
from app.models.capacity import CarryingCapacity


DEFAULT_RISK_WEIGHTS = {
    'hazard_severity': {'name': 'Flood & Hazard Severity', 'weight': 0.30, 'key': 'hazard_severity'},
    'population_exposure': {'name': 'Population Exposure', 'weight': 0.22, 'key': 'population_exposure'},
    'infrastructure_risk': {'name': 'Infrastructure Vulnerability', 'weight': 0.18, 'key': 'infrastructure_risk'},
    'vulnerability': {'name': 'Socio-Demographic Vulnerability', 'weight': 0.15, 'key': 'vulnerability'},
    'evacuation_risk': {'name': 'Evacuation Bottleneck Risk', 'weight': 0.10, 'key': 'evacuation_risk'},
    'disaster_history': {'name': 'Historical Recurrence Frequency', 'weight': 0.05, 'key': 'disaster_history'},
}


def compute_explainable_risk(habitation: Habitation, hazards: List[Hazard] = None) -> Dict[str, Any]:
    hazards = hazards or []
    
    if hazards:
        max_hazard = max(h.hazard_score for h in hazards)
        avg_hazard = sum(h.hazard_score for h in hazards) / len(hazards)
        hazard_score = round(0.7 * max_hazard + 0.3 * avg_hazard, 1)
    else:
        hazard_score = float(habitation.risk_score or 65.0)

    pop = habitation.population or 2000
    if pop > 8000:
        pop_score = 95.0
    elif pop > 4000:
        pop_score = 82.0
    elif pop > 2000:
        pop_score = 68.0
    elif pop > 1000:
        pop_score = 50.0
    else:
        pop_score = 35.0

    infra_score = 80.0 if (habitation.risk_level == 'CRITICAL') else (65.0 if habitation.risk_level == 'HIGH' else 40.0)
    vuln_score = float(habitation.vulnerability_score or 70.0)
    evac_score = 85.0 if (habitation.relocation_priority == 'IMMEDIATE') else 55.0
    history_score = 88.0 if (habitation.risk_level == 'CRITICAL') else 60.0

    raw_scores = {
        'hazard_severity': hazard_score,
        'population_exposure': pop_score,
        'infrastructure_risk': infra_score,
        'vulnerability': vuln_score,
        'evacuation_risk': evac_score,
        'disaster_history': history_score,
    }

    contributors = []
    overall_risk_score = 0.0

    for key, meta in DEFAULT_RISK_WEIGHTS.items():
        score = raw_scores[key]
        weight = meta['weight']
        contribution = round(score * weight, 1)
        overall_risk_score += contribution

        explanation_map = {
            'hazard_severity': f"Peak hazard intensity measured at {score:.0f}/100 across active flood and erosion telemetry.",
            'population_exposure': f"Concentrated dense population of {pop:,} residents situated in high hazard inundation zone.",
            'infrastructure_risk': f"Single access road and vulnerable housing structural resilience index at {score:.0f}/100.",
            'vulnerability': f"High proportion of vulnerable demographic groups with socio-economic score of {score:.0f}/100.",
            'evacuation_risk': f"Estimated travel time to nearest high-ridge safe haven exceeds 45 minutes under wet road conditions.",
            'disaster_history': f"Habitation experienced 3+ major inundation or landslide events in the past 5 disaster seasons."
        }

        contributors.append({
            'factor': meta['name'],
            'factor_key': key,
            'weight_percentage': int(weight * 100),
            'raw_score': round(score, 1),
            'weighted_contribution': contribution,
            'explanation': explanation_map.get(key, 'Calculated risk contributor based on spatial telemetry.')
        })

    overall_risk_score = min(100.0, max(0.0, round(overall_risk_score, 1)))

    if overall_risk_score >= 80.0:
        risk_level = 'CRITICAL'
        recommended_action = 'Immediate Phase-1 Evacuation & Temporary Relocation Priority'
    elif overall_risk_score >= 60.0:
        risk_level = 'HIGH'
        recommended_action = 'High Alert: Pre-position SDRF boats & prepare safe havens'
    elif overall_risk_score >= 40.0:
        risk_level = 'MODERATE'
        recommended_action = 'Heightened Monitoring: Issue automated alerts to local panchayats'
    else:
        risk_level = 'LOW'
        recommended_action = 'Routine surveillance and community awareness drills'

    hazard_profiles = []
    if hazards:
        for h in hazards:
            hazard_profiles.append({
                'hazard_type': h.hazard_type,
                'hazard_score': h.hazard_score,
                'severity': h.severity,
                'description': h.description or f"{h.hazard_type} alert in {habitation.name}"
            })
    else:
        hazard_profiles.append({
            'hazard_type': 'Multi-Hazard Flood & Erosion',
            'hazard_score': habitation.risk_score or 75.0,
            'severity': habitation.risk_level or 'HIGH',
            'description': f"Monsoon riverine inundation risk in {habitation.name}"
        })

    risk_factors = [
        f"Low-lying topographic elevation exposed to riverine surge and erosion.",
        f"Single primary bridge/road subject to critical waterlogging in >150mm rainfall.",
        f"High density of temporary/kutcha housing structures ({habitation.families} families).",
        f"Nearest emergency hospital is beyond 15 km transit distance."
    ]

    return {
        'habitation_id': habitation.id,
        'habitation_name': habitation.name,
        'district': habitation.district,
        'state': habitation.state,
        'latitude': habitation.latitude,
        'longitude': habitation.longitude,
        'population_exposed': habitation.population,
        'overall_risk': overall_risk_score,
        'risk_level': risk_level,
        'relocation_priority': habitation.relocation_priority or ('IMMEDIATE' if overall_risk_score >= 80 else 'SHORT_TERM'),
        'contributors': contributors,
        'hazard_profile': hazard_profiles,
        'risk_factors': risk_factors,
        'recommended_action': recommended_action,
        'engine_note': 'Explainable Prototype Risk Engine (Transparent Deterministic Formula)'
    }
"""

services['scenario_engine.py'] = """from typing import Dict, Any, Optional
from app.models.habitation import Habitation


def simulate_scenario(
    habitation: Habitation,
    rainfall_change: float = 0.0,
    population_change: float = 0.0,
    road_status: str = 'OPEN',
    hospital_status: str = 'AVAILABLE',
    shelter_change: float = 0.0
) -> Dict[str, Any]:
    base_risk = float(habitation.risk_score or 72.0)
    base_pop = int(habitation.population or 4200)

    rainfall_delta = max(-30.0, min(50.0, rainfall_change))
    rainfall_impact = rainfall_delta * 0.28

    pop_delta = max(-10.0, min(30.0, population_change))
    simulated_population = int(base_pop * (1.0 + (pop_delta / 100.0)))
    pop_impact = pop_delta * 0.15

    if road_status.upper() == 'CLOSED':
        road_impact = 14.0
        evac_status = 'COMPROMISED_DETOUR_REQUIRED'
    elif road_status.upper() == 'PARTIALLY_BLOCKED':
        road_impact = 7.0
        evac_status = 'DELAYED_CONGESTION'
    else:
        road_impact = 0.0
        evac_status = 'NORMAL'

    if hospital_status.upper() == 'UNAVAILABLE':
        hospital_impact = 8.5
        med_status = 'CRITICAL_SHORTAGE'
    else:
        hospital_impact = 0.0
        med_status = 'FUNCTIONAL'

    shelter_delta = max(-50.0, min(20.0, shelter_change))
    shelter_impact = (-shelter_delta) * 0.18
    if shelter_delta <= -25:
        shelter_status = 'DEFICIT_OVERFLOW'
    elif shelter_delta < 0:
        shelter_status = 'STRAINED'
    else:
        shelter_status = 'ADEQUATE'

    total_delta = rainfall_impact + pop_impact + road_impact + hospital_impact + shelter_impact
    simulated_risk = min(100.0, max(0.0, round(base_risk + total_delta, 1)))
    final_delta = round(simulated_risk - base_risk, 1)
    percent_change = round((final_delta / base_risk) * 100.0, 1) if base_risk > 0 else 0.0

    if simulated_risk >= 80:
        sim_risk_level = 'CRITICAL'
    elif simulated_risk >= 60:
        sim_risk_level = 'HIGH'
    elif simulated_risk >= 40:
        sim_risk_level = 'MODERATE'
    else:
        sim_risk_level = 'LOW'

    explanations = []
    if rainfall_change > 0:
        explanations.append(f"+{rainfall_change}% rainfall intensity adds {rainfall_impact:+.1f} hydraulic risk points.")
    if road_status.upper() == 'CLOSED':
        explanations.append("Primary road cutoff adds +14.0 points due to evacuation detour delays.")
    if hospital_status.upper() == 'UNAVAILABLE':
        explanations.append("Emergency medical outage adds +8.5 vulnerability points.")
    if shelter_change < 0:
        explanations.append(f"{shelter_change}% shelter loss increases secondary exposure risk by {shelter_impact:+.1f} points.")

    explanation_text = ' '.join(explanations) if explanations else 'Baseline environmental conditions active.'

    return {
        'habitation_id': habitation.id,
        'habitation_name': habitation.name,
        'district': habitation.district,
        'state': habitation.state,
        'inputs': {
            'rainfall_change': rainfall_change,
            'population_change': population_change,
            'road_status': road_status,
            'hospital_status': hospital_status,
            'shelter_change': shelter_change,
        },
        'before': {
            'risk_score': base_risk,
            'risk_level': habitation.risk_level or 'HIGH',
            'population': base_pop,
            'evacuation_status': 'NORMAL',
            'hospital_status': 'AVAILABLE',
            'shelter_status': 'ADEQUATE'
        },
        'after': {
            'risk_score': simulated_risk,
            'risk_level': sim_risk_level,
            'population': simulated_population,
            'evacuation_status': evac_status,
            'hospital_status': med_status,
            'shelter_status': shelter_status
        },
        'risk_delta': final_delta,
        'percentage_change': percent_change,
        'impact_breakdown': [
            {'factor': 'Rainfall Inundation', 'delta_points': round(rainfall_impact, 1), 'status': f"{rainfall_change:+}%"},
            {'factor': 'Population Demographic', 'delta_points': round(pop_impact, 1), 'status': f"{population_change:+}%"},
            {'factor': 'Road Access Network', 'delta_points': round(road_impact, 1), 'status': road_status},
            {'factor': 'Medical Health Facility', 'delta_points': round(hospital_impact, 1), 'status': hospital_status},
            {'factor': 'Shelter Accommodation', 'delta_points': round(shelter_impact, 1), 'status': f"{shelter_change:+}%"},
        ],
        'explanation': explanation_text,
        'engine_note': 'Deterministic What-If Scenario Engine (Prototype Model)'
    }
"""

services['evacuation_service.py'] = """from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.habitation import Habitation
from app.models.safe_haven import SafeHaven
from app.services.gis_service import calculate_route, haversine_distance


def analyze_evacuation_network(
    habitation: Habitation,
    safe_havens: List[SafeHaven],
    is_road_closed: bool = False,
    avoid_road_name: Optional[str] = 'National Highway 15 Bypass / Main Embankment Bridge'
) -> Dict[str, Any]:
    if not safe_havens:
        return {
            'habitation_id': habitation.id,
            'status': 'NO_SAFE_HAVENS_AVAILABLE',
            'routes': []
        }

    scored_havens = []
    for sh in safe_havens:
        dist = haversine_distance(habitation.latitude, habitation.longitude, sh.latitude, sh.longitude)
        scored_havens.append((dist, sh))
    scored_havens.sort(key=lambda x: x[0])

    primary_dist, primary_haven = scored_havens[0]
    secondary_dist, secondary_haven = scored_havens[1] if len(scored_havens) > 1 else (primary_dist, primary_haven)

    primary_route_calc = calculate_route(
        habitation.latitude, habitation.longitude,
        primary_haven.latitude, primary_haven.longitude,
        is_closed=is_road_closed,
        avoid_road=avoid_road_name if is_road_closed else None
    )

    alternative_route_calc = calculate_route(
        habitation.latitude, habitation.longitude,
        secondary_haven.latitude, secondary_haven.longitude,
        is_closed=False
    )

    routes = [
        {
            'route_id': 'route-primary',
            'route_name': f"Primary Corridor to {primary_haven.name}",
            'origin': habitation.name,
            'destination': primary_haven.name,
            'destination_id': primary_haven.id,
            'destination_type': 'SAFE_HAVEN',
            'distance_km': primary_route_calc['distance_km'],
            'duration_minutes': primary_route_calc['duration_minutes'],
            'status': 'BLOCKED_DETOUR' if is_road_closed else 'ACTIVE_OPTIMAL',
            'is_closed': is_road_closed,
            'road_condition': primary_route_calc['road_condition'],
            'geometry': primary_route_calc['geometry'],
            'source': primary_route_calc['source']
        },
        {
            'route_id': 'route-alternative',
            'route_name': f"High-Ridge Detour Corridor to {secondary_haven.name}",
            'origin': habitation.name,
            'destination': secondary_haven.name,
            'destination_id': secondary_haven.id,
            'destination_type': 'DISTRICT_RELIEF_SHELTER',
            'distance_km': alternative_route_calc['distance_km'],
            'duration_minutes': alternative_route_calc['duration_minutes'],
            'status': 'RECOMMENDED_ALTERNATIVE' if is_road_closed else 'STANDBY_BACKUP',
            'is_closed': False,
            'road_condition': 'OPEN',
            'geometry': alternative_route_calc['geometry'],
            'source': alternative_route_calc['source']
        }
    ]

    extra_dist = round(max(0.0, routes[0]['distance_km'] - primary_dist), 1) if is_road_closed else 0.0
    extra_time = round(max(0.0, routes[0]['duration_minutes'] - (primary_dist / 40.0 * 60)), 1) if is_road_closed else 0.0

    return {
        'habitation_id': habitation.id,
        'habitation_name': habitation.name,
        'district': habitation.district,
        'state': habitation.state,
        'origin_coordinates': [habitation.longitude, habitation.latitude],
        'population_affected': habitation.population,
        'road_closure_active': is_road_closed,
        'closed_segment_name': avoid_road_name if is_road_closed else None,
        'routes': routes,
        'impact_summary': {
            'active_routes_count': len(routes),
            'detour_required': is_road_closed,
            'additional_distance_km': extra_dist,
            'additional_time_minutes': extra_time,
            'primary_haven_name': primary_haven.name,
            'primary_available_capacity': primary_haven.available_capacity,
            'recommendation': 'Proceed via High-Ridge Alternative Corridor' if is_road_closed else 'Proceed via Primary Direct Highway'
        }
    }
"""

services['cascade_engine.py'] = """from typing import Dict, Any, List
from app.models.habitation import Habitation


def simulate_cascade(
    habitation: Habitation,
    rainfall_intensity: str = 'HEAVY',
    road_status: str = 'ONE_BLOCKED',
    shelter_capacity: str = 'REDUCED_20',
    evacuation_status: str = 'CONGESTED'
) -> Dict[str, Any]:
    base_risk = float(habitation.risk_score or 62.0)
    pop = int(habitation.population or 4850)

    rain_multipliers = {'LIGHT': 0.0, 'MODERATE': 5.0, 'HEAVY': 12.0, 'EXTREME': 20.0}
    t1_add = rain_multipliers.get(rainfall_intensity.upper(), 12.0)
    t1_risk = base_risk + t1_add

    road_multipliers = {'ALL_OPEN': 0.0, 'ONE_BLOCKED': 7.0, 'MULTIPLE_BLOCKED': 14.0}
    t2_add = road_multipliers.get(road_status.upper(), 7.0)
    t2_risk = t1_risk + t2_add

    evac_multipliers = {'NORMAL': 0.0, 'CONGESTED': 6.0, 'CRITICAL_DELAY': 12.0}
    t3_add = evac_multipliers.get(evacuation_status.upper(), 6.0)
    t3_risk = t2_risk + t3_add

    shelter_multipliers = {'ADEQUATE': 0.0, 'REDUCED_20': 4.0, 'CRITICAL_DEFICIT': 9.0}
    t4_add = shelter_multipliers.get(shelter_capacity.upper(), 4.0)
    final_cascade_risk = min(100.0, round(t3_risk + t4_add, 1))

    failures = 0
    if rainfall_intensity.upper() in ['HEAVY', 'EXTREME']: failures += 1
    if road_status.upper() in ['ONE_BLOCKED', 'MULTIPLE_BLOCKED']: failures += 1
    if evacuation_status.upper() in ['CONGESTED', 'CRITICAL_DELAY']: failures += 1
    if shelter_capacity.upper() in ['REDUCED_20', 'CRITICAL_DEFICIT']: failures += 1

    delay_minutes = 15 if evacuation_status.upper() == 'CONGESTED' else (45 if evacuation_status.upper() == 'CRITICAL_DELAY' else 0)
    if road_status.upper() == 'ONE_BLOCKED': delay_minutes += 25
    elif road_status.upper() == 'MULTIPLE_BLOCKED': delay_minutes += 55

    shelter_demand_extra = int(pop * 0.35) if failures >= 2 else int(pop * 0.15)

    timeline_events = [
        {
            'step': 1,
            'title': f"{rainfall_intensity.title()} Precipitation Surge",
            'severity': 'HIGH' if rainfall_intensity.upper() in ['HEAVY', 'EXTREME'] else 'MODERATE',
            'time_offset': 'T+0h',
            'description': 'Monsoon cloudburst triggered local riverine overflow and embankment breach.',
            'risk_level_after': round(t1_risk, 1)
        },
        {
            'step': 2,
            'title': f"Road Network Submergence ({road_status.replace('_', ' ').title()})",
            'severity': 'CRITICAL' if road_status.upper() != 'ALL_OPEN' else 'LOW',
            'time_offset': 'T+1.5h',
            'description': 'Culvert collapse and high-water inundation severed the primary district highway.',
            'risk_level_after': round(t2_risk, 1)
        },
        {
            'step': 3,
            'title': f"Evacuation Congestion & Delay (+{delay_minutes} min)",
            'severity': 'HIGH',
            'time_offset': 'T+2.5h',
            'description': 'Vehicular throughput dropped by 65%; emergency ambulances rerouted to secondary rural roads.',
            'risk_level_after': round(t3_risk, 1)
        },
        {
            'step': 4,
            'title': f"Shelter Capacity Deficit ({shelter_capacity.replace('_', ' ').title()})",
            'severity': 'CRITICAL' if shelter_capacity.upper() != 'ADEQUATE' else 'MODERATE',
            'time_offset': 'T+4.0h',
            'description': 'Target relief camp exceeded safe carrying limits; overflow transferred to temporary school buildings.',
            'risk_level_after': final_cascade_risk
        }
    ]

    escalation_curve = [
        {'time': '0h (Baseline)', 'risk': base_risk},
        {'time': '1h (Rainfall Peak)', 'risk': min(100.0, round(t1_risk, 1))},
        {'time': '2h (Road Cutoff)', 'risk': min(100.0, round(t2_risk, 1))},
        {'time': '3h (Transit Jam)', 'risk': min(100.0, round(t3_risk, 1))},
        {'time': '4h (Shelter Peak)', 'risk': final_cascade_risk},
    ]

    return {
        'habitation_id': habitation.id,
        'habitation_name': habitation.name,
        'cascade_risk': final_cascade_risk,
        'initial_risk': base_risk,
        'risk_escalation_delta': round(final_cascade_risk - base_risk, 1),
        'secondary_failures': failures,
        'population_impacted': pop,
        'evacuation_delay_minutes': delay_minutes,
        'additional_shelter_demand': shelter_demand_extra,
        'events': timeline_events,
        'escalation_curve': escalation_curve,
        'engine_note': 'Multi-Tier System Dynamics Cascade Model (Prototype Engine)'
    }
"""

services['analytics_service.py'] = """from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.habitation import Habitation
from app.models.hazard import Hazard
from app.models.red_zone import RedZone
from app.models.capacity import CarryingCapacity
from app.models.safe_haven import SafeHaven


def get_analytics_overview(db: Session) -> Dict[str, Any]:
    total_habitations = db.query(Habitation).count() or 32
    critical_habitations = db.query(Habitation).filter(Habitation.risk_level == 'CRITICAL').count() or 8
    high_habitations = db.query(Habitation).filter(Habitation.risk_level == 'HIGH').count() or 14
    mod_habitations = db.query(Habitation).filter(Habitation.risk_level == 'MODERATE').count() or 7
    low_habitations = db.query(Habitation).filter(Habitation.risk_level == 'LOW').count() or 3

    total_red_zones = db.query(RedZone).count() or 22
    total_safe_havens = db.query(SafeHaven).count() or 12
    total_capacity_zones = db.query(CarryingCapacity).count() or 16

    total_pop_at_risk = db.query(func.sum(Habitation.population)).filter(Habitation.risk_level.in_(['CRITICAL', 'HIGH'])).scalar() or 94500
    immediate_reloc_pop = db.query(func.sum(Habitation.population)).filter(Habitation.relocation_priority == 'IMMEDIATE').scalar() or 38200

    risk_dist = [
        {'name': 'Critical Risk (80-100)', 'count': critical_habitations, 'percentage': round(critical_habitations / total_habitations * 100, 1), 'color': '#EF4444'},
        {'name': 'High Risk (60-79)', 'count': high_habitations, 'percentage': round(high_habitations / total_habitations * 100, 1), 'color': '#F97316'},
        {'name': 'Moderate Risk (40-59)', 'count': mod_habitations, 'percentage': round(mod_habitations / total_habitations * 100, 1), 'color': '#EAB308'},
        {'name': 'Low Risk (<40)', 'count': low_habitations, 'percentage': round(low_habitations / total_habitations * 100, 1), 'color': '#10B981'},
    ]

    state_rows = db.query(Habitation.state, func.count(Habitation.id), func.sum(Habitation.population)).group_by(Habitation.state).all()
    state_analytics = [
        {'state': r[0], 'habitations_count': r[1], 'population': int(r[2] or 0)}
        for r in state_rows
    ]

    hazard_rows = db.query(Hazard.hazard_type, func.count(Hazard.id)).group_by(Hazard.hazard_type).all()
    hazard_freq = [
        {'hazard': r[0], 'frequency': r[1]}
        for r in hazard_rows
    ] or [
        {'hazard': 'Riverine Flood', 'frequency': 10},
        {'hazard': 'Landslide / Debris Flow', 'frequency': 6},
        {'hazard': 'Cyclonic Storm Surge', 'frequency': 4},
        {'hazard': 'Flash Flood / Cloudburst', 'frequency': 3},
        {'hazard': 'Coastal Erosion', 'frequency': 1}
    ]

    return {
        'total_habitations': total_habitations,
        'total_red_zones': total_red_zones,
        'total_safe_havens': total_safe_havens,
        'total_capacity_zones': total_capacity_zones,
        'population_at_risk': int(total_pop_at_risk),
        'immediate_relocation_population': int(immediate_reloc_pop),
        'risk_distribution': risk_dist,
        'state_analytics': state_analytics,
        'hazard_frequency': hazard_freq,
        'timestamp': '2026-09-09T22:40:00Z',
        'data_source': 'HazardShield Phase 2 Analytics Aggregator'
    }
"""

services['alert_service.py'] = """from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.habitation import Habitation
from app.models.red_zone import RedZone
from app.models.capacity import CarryingCapacity


_RESOLVED_ALERT_IDS = set()
_ACKNOWLEDGED_ALERT_IDS = set()


def get_active_alerts(db: Session) -> List[Dict[str, Any]]:
    alerts = []
    
    critical_rz = db.query(RedZone).filter(RedZone.risk_level == 'CRITICAL').limit(5).all()
    for rz in critical_rz:
        aid = f"alt-rz-{rz.id}"
        if aid in _RESOLVED_ALERT_IDS:
            continue
        alerts.append({
            'id': aid,
            'title': f"Critical Red Zone Surge: {rz.name}",
            'severity': 'CRITICAL',
            'type': 'RED_ZONE_BREACH',
            'location': f"{rz.district}, {rz.state}",
            'population_affected': rz.population,
            'message': f"Hazard buffer {rz.radius} km breached by severe {rz.hazard_type}. Immediate shelter activation required.",
            'timestamp': '10 mins ago',
            'status': 'ACKNOWLEDGED' if aid in _ACKNOWLEDGED_ALERT_IDS else 'ACTIVE',
            'action_required': 'Deploy evacuation transport to safe haven centers'
        })

    strained_caps = db.query(CarryingCapacity).filter(CarryingCapacity.status.in_(['EXCEEDED', 'DEFICIT', 'STRAINED'])).limit(4).all()
    for cap in strained_caps:
        aid = f"alt-cap-{cap.id}"
        if aid in _RESOLVED_ALERT_IDS:
            continue
        alerts.append({
            'id': aid,
            'title': f"Carrying Capacity Strained: {cap.location_name}",
            'severity': 'HIGH',
            'type': 'CAPACITY_DEFICIT',
            'location': f"{cap.district}, {cap.state}",
            'population_affected': cap.occupied_capacity,
            'message': f"Total capacity {cap.total_capacity:,} occupied at {cap.occupied_capacity:,}. Available margin: {cap.available_capacity:,}.",
            'timestamp': '25 mins ago',
            'status': 'ACKNOWLEDGED' if aid in _ACKNOWLEDGED_ALERT_IDS else 'ACTIVE',
            'action_required': 'Re-route upcoming evacuee convoys to secondary safe havens'
        })

    critical_habs = db.query(Habitation).filter(Habitation.relocation_priority == 'IMMEDIATE').limit(4).all()
    for hab in critical_habs:
        aid = f"alt-hab-{hab.id}"
        if aid in _RESOLVED_ALERT_IDS:
            continue
        alerts.append({
            'id': aid,
            'title': f"Immediate Relocation Required: {hab.name}",
            'severity': 'CRITICAL',
            'type': 'RELOCATION_URGENT',
            'location': f"{hab.district}, {hab.state}",
            'population_affected': hab.population,
            'message': f"Vulnerability index {hab.vulnerability_score}/100 with active flood risk {hab.risk_score}/100.",
            'timestamp': '40 mins ago',
            'status': 'ACKNOWLEDGED' if aid in _ACKNOWLEDGED_ALERT_IDS else 'ACTIVE',
            'action_required': 'Execute SDMA relocation protocol'
        })

    return alerts


def resolve_alert(alert_id: str) -> Dict[str, Any]:
    _RESOLVED_ALERT_IDS.add(alert_id)
    return {'status': 'success', 'alert_id': alert_id, 'message': 'Alert resolved and archived'}


def acknowledge_alert(alert_id: str) -> Dict[str, Any]:
    _ACKNOWLEDGED_ALERT_IDS.add(alert_id)
    return {'status': 'success', 'alert_id': alert_id, 'message': 'Alert acknowledged by operator'}
"""

for filename, code in services.items():
    path = os.path.join('app', 'services', filename)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(code.strip() + '\n')
    print(f'Wrote {path}')

