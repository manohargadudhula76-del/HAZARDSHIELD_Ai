import urllib.request
import json
import sys

endpoints = [
    # Phase 1 Core APIs
    ('/api/health', 'Health Check', 'GET', None),
    ('/api/health/db', 'Database Health', 'GET', None),
    ('/api/dashboard/summary', 'Dashboard KPIs', 'GET', None),
    ('/api/map/locations', 'Map Geo Layers', 'GET', None),
    ('/api/habitations', 'Habitations List', 'GET', None),
    ('/api/habitations/1', 'Habitation Detail (ID=1)', 'GET', None),
    ('/api/hazards', 'Hazards List', 'GET', None),
    ('/api/hazards/1', 'Hazard Detail (ID=1)', 'GET', None),
    ('/api/red-zones', 'Red Zones List', 'GET', None),
    ('/api/red-zones/1', 'Red Zone Detail (ID=1)', 'GET', None),
    ('/api/capacity', 'Carrying Capacity Zones', 'GET', None),
    ('/api/capacity/1', 'Capacity Zone Detail (ID=1)', 'GET', None),
    ('/api/safe-havens', 'Safe Havens List', 'GET', None),
    ('/api/safe-havens/1', 'Safe Haven Detail (ID=1)', 'GET', None),
    ('/api/relocation/1', 'Relocation Recommendation (Habitation 1)', 'GET', None),
    
    # Phase 2 Intelligence & GIS APIs
    ('/api/risk/1', 'Explainable Multi-Hazard Risk (ID=1)', 'GET', None),
    ('/api/risk/', 'All Explainable Risks List', 'GET', None),
    ('/api/scenarios/simulate', 'What-If Disaster Simulation', 'POST', {'habitation_id': 1, 'rainfall_change': 30, 'population_change': 15, 'road_status': 'CLOSED', 'hospital_status': 'AVAILABLE', 'shelter_change': -20}),
    ('/api/evacuation/network/1?road_closed=false', 'Evacuation Network Analysis', 'GET', None),
    ('/api/evacuation/network/1?road_closed=true', 'Evacuation Detour with Road Blockage', 'GET', None),
    ('/api/cascade/simulate', 'Cascading Impact Simulation', 'POST', {'habitation_id': 1, 'rainfall_intensity': 'HEAVY', 'road_status': 'ONE_BLOCKED', 'shelter_capacity': 'REDUCED_20', 'evacuation_status': 'CONGESTED'}),
    ('/api/gis/routes', 'GIS Route Endpoints', 'GET', None),
    ('/api/gis/route', 'GIS OSRM Driving Route Calculation', 'POST', {'start_latitude': 26.4521, 'start_longitude': 92.0345, 'end_latitude': 26.9826, 'end_longitude': 94.6425, 'is_closed': False}),
    ('/api/gis/red-zones', 'GIS Red Zone Overlay Buffers', 'GET', None),
    ('/api/gis/habitations', 'GIS Habitation Point Layer', 'GET', None),
    ('/api/gis/safe-havens', 'GIS Safe Haven Destination Layer', 'GET', None),
    ('/api/analytics/overview', 'Analytics Summary Overview', 'GET', None),
    ('/api/analytics/risk-distribution', 'Analytics Risk Distribution', 'GET', None),
    ('/api/analytics/hazard-frequency', 'Analytics Hazard Frequencies', 'GET', None),
    ('/api/alerts', 'Active Disaster Alerts Feed', 'GET', None),

    # Phase 3 AI / ML & Decision Support Reports
    ('/api/ml/metrics', 'Scikit-Learn ML Model Evaluation Scorecard', 'GET', None),
    ('/api/ml/predict', 'Real-Time ML Hazard Risk Inference', 'POST', {
        'habitation_name': 'Rampur Village',
        'average_rainfall_mm': 2400.0,
        'distance_from_river_km': 0.6,
        'elevation_meters': 38.0,
        'population_density': 420.0,
        'historical_disaster_frequency': 7,
        'infrastructure_score': 45.0
    }),
    ('/api/reports/dossier/1', 'Complete Habitation Decision Support Dossier (ID=1)', 'GET', None),
    ('/api/reports/export-csv', 'Regional Disaster Decision Summary CSV Export', 'GET', None),
]

print('========================================================================')
print(' HAZARDSHIELD AI - COMPLETE API VERIFICATION SUITE (34 ENDPOINTS)')
print('========================================================================')

passed = 0
failed = 0

for item in endpoints:
    ep = item[0]
    desc = item[1]
    method = item[2]
    payload = item[3] if len(item) > 3 else None
    
    url = f'http://127.0.0.1:8000{ep}'
    try:
        if method == 'POST':
            req_data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(url, data=req_data, headers={'Content-Type': 'application/json'}, method='POST')
        else:
            req = urllib.request.Request(url)
            
        with urllib.request.urlopen(req, timeout=5) as res:
            raw_content = res.read()
            if 'text/csv' in res.headers.get('Content-Type', ''):
                count = len(raw_content.decode().splitlines())
            else:
                data = json.loads(raw_content.decode())
                count = len(data) if isinstance(data, (list, dict)) else 1
            print(f'[PASS] {method:<4} {ep:<40} | HTTP {res.status} | {desc} (items: {count})')
            passed += 1
    except Exception as e:
        print(f'[FAIL] {method:<4} {ep:<40} | Error: {e}')
        failed += 1

print('========================================================================')
print(f'Results: {passed} Passed, {failed} Failed out of {len(endpoints)} endpoints tested.')
if failed == 0:
    print('ALL PHASE 1, PHASE 2, & PHASE 3 BACKEND ENDPOINTS OPERATIONAL AND VERIFIED!')
else:
    print('Check the backend server logs for any unhandled routes or exceptions.')
print('========================================================================')
