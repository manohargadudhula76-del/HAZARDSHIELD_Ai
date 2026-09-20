from typing import Dict, Any, Optional
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
