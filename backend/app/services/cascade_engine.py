from typing import Dict, Any, List
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
