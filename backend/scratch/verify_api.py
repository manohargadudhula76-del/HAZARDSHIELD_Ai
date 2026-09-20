from fastapi.testclient import TestClient
from app.main import app
import json

client = TestClient(app)

print("--- Testing GET /api/v1/explainability ---")
res = client.get("/api/v1/explainability")
assert res.status_code == 200
data = res.json()
print(f"Status: {res.status_code}, Total count: {data['total_count']}")
print(f"Summary: {data['summary']}")
sample = data['results'][0]
print(f"Sample district: {sample['district']}, {sample['state']} (ID: {sample['district_id']})")
print(f"Explainability Status: {sample['explainability_status']}")
print(f"Decision Trace Steps count: {len(sample['decision_trace'])}")

print("\n--- Testing GET /api/v1/explainability/priorities ---")
res_prio = client.get("/api/v1/explainability/priorities")
assert res_prio.status_code == 200
data_prio = res_prio.json()
print(f"Status: {res_prio.status_code}, Total count: {data_prio['total_count']}")
top_prio = data_prio['results'][0]
print(f"Top Priority District: {top_prio['district']}, {top_prio['state']}")
print(f"Priority Level: {top_prio['vulnerability_summary']['priority_level']}, Index: {top_prio['vulnerability_summary']['priority_index']}")

print(f"\n--- Testing GET /api/v1/explainability/{sample['district_id']} ---")
res_dist = client.get(f"/api/v1/explainability/{sample['district_id']}")
assert res_dist.status_code == 200
dist_data = res_dist.json()
print(f"District explainability fetched successfully. Disclaimer present: {'prototype' in dist_data['disclaimer']}")

print("\n--- Verifying Existing Phase 1-7 APIs Still Work ---")
for ep in [
    "/api/v1/health",
    "/api/v1/dashboard/summary",
    "/api/v1/alerts",
    "/api/v1/hazard",
    "/api/v1/carrying-capacity",
    "/api/v1/vulnerability",
    "/api/v1/relocation",
    "/api/v1/relocation/priorities",
    "/api/v1/decision-support",
    "/api/v1/decision-support/priorities",
]:
    r = client.get(ep)
    print(f"Endpoint {ep}: status {r.status_code}")
    assert r.status_code == 200

print("\nAll endpoints verified successfully!")
