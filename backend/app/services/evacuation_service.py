from typing import Dict, Any, List, Optional
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
