import json
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

endpoints = [
    ("/api/v1/dossier/DIST_IND_345", 200),
    ("/api/v1/dossier/briefing/national", 200),
    ("/api/v1/dossier/briefing/state/WEST%20BENGAL", 200),
    ("/api/v1/dossier/export/summary", 200),
    ("/api/v1/dossier/export/csv", 200),
    ("/api/v1/dossier/export/geojson", 200),
    ("/openapi.json", 200),
    ("/docs", 200),
]

print("=" * 60)
print("PHASE 10 LIVE API ENDPOINT VERIFICATION")
print("=" * 60)

for ep, exp_code in endpoints:
    r = client.get(ep)
    ct = r.headers.get("content-type", "")
    print(f"{ep:<45} -> Status: {r.status_code} (Exp: {exp_code}) | Type: {ct}")
    assert r.status_code == exp_code, f"Failed on {ep}: got {r.status_code}"

# 1. Verify DIST_IND_345 Dossier details
r_dossier = client.get("/api/v1/dossier/DIST_IND_345")
d_json = r_dossier.json()
print("\n--- DIST_IND_345 Dossier Sample ---")
print(f"District: {d_json['identity']['district']}, {d_json['identity']['state']}")
print(f"Hazard Score: {d_json['hazard']['overall_hazard_score']}, Level: {d_json['hazard']['risk_level']}")
print(f"Carrying Capacity: {d_json['carrying_capacity']['overall_carrying_capacity_score']}, Level: {d_json['carrying_capacity']['carrying_capacity_level']}")
print(f"Vulnerability Score: {d_json['vulnerability']['overall_vulnerability_score']}, Priority: {d_json['vulnerability']['priority_level']}, Rank: {d_json['vulnerability']['priority_rank']}")
print(f"Relocation Status: {d_json['relocation']['relocation_assessment_status']}")
print(f"Primary Intervention: {d_json['decision_support']['primary_intervention']}")
print(f"Explainability Audit: {d_json['explainability']['explainability_audit_status']}")

# 2. Verify National Briefing details
r_nb = client.get("/api/v1/dossier/briefing/national")
nb_json = r_nb.json()
print("\n--- National Briefing Sample ---")
print(f"Total Districts Analyzed: {nb_json['total_districts_analyzed']}")
print(f"Critical Priority Districts: {nb_json['critical_priority_districts_count']}")
print(f"High Priority Districts: {nb_json['high_priority_districts_count']}")
print(f"System Status: {nb_json['system_health']['overall_system_status']}, Readiness: {nb_json['system_health']['prototype_readiness_level']}")

# 3. Verify State Briefing details
r_sb = client.get("/api/v1/dossier/briefing/state/WEST%20BENGAL")
sb_json = r_sb.json()
print("\n--- West Bengal State Briefing Sample ---")
print(f"State: {sb_json['state']}, Districts: {sb_json['total_districts']}")
print(f"Top Priority District: {sb_json['top_priority_districts'][0]['district']}, Rank: {sb_json['top_priority_districts'][0]['priority_rank']}")

# 4. Verify CSV details
r_csv = client.get("/api/v1/dossier/export/csv")
lines = r_csv.text.splitlines()
print("\n--- CSV Export Sample ---")
print(f"CSV Header: {lines[0]}")
print(f"CSV Total Rows: {len(lines)}")
print(f"CSV Row 1: {lines[1]}")

# 5. Verify GeoJSON details
r_gj = client.get("/api/v1/dossier/export/geojson")
gj_json = r_gj.json()
print("\n--- GeoJSON Export Sample ---")
print(f"Type: {gj_json['type']}")
print(f"Features Included: {gj_json['metadata']['features_count']}")
print(f"Features Excluded (no GPS): {gj_json['metadata']['excluded_missing_coordinates_count']}")
print(f"Sample Coordinates (Feature 0): {gj_json['features'][0]['geometry']['coordinates']} (Order: [lon, lat])")

# 6. Verify OpenAPI schema for any Swagger issues
r_openapi = client.get("/openapi.json")
schemas = r_openapi.json()["components"]["schemas"]
sibling_issues = []
for s_name, s_def in schemas.items():
    props = s_def.get("properties", {})
    for p_name, p_def in props.items():
        if "$ref" in p_def and len(p_def) > 1:
            sibling_issues.append((s_name, p_name))

print("\n--- Swagger / OpenAPI Schema Check ---")
print(f"Total Schemas in OpenAPI: {len(schemas)}")
print(f"Schemas with $ref sibling issues: {len(sibling_issues)}")
assert len(sibling_issues) == 0, f"Found $ref sibling issues: {sibling_issues}"

print("\nALL VERIFICATIONS COMPLETED SUCCESSFULLY WITH ZERO ERRORS!")
