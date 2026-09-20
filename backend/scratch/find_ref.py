from app.main import app
import json

schema = app.openapi()
ref_key = "$ref"

print("--- Searching for direct $ref in schemas (excluding explainability) ---")
for sname, sdef in schema['components']['schemas'].items():
    if any(sname.startswith(p) for p in ['DistrictExplain', 'Explain', 'Score', 'Component']):
        continue
    for pname, pdef in sdef.get('properties', {}).items():
        if ref_key in pdef:
            print(f"{sname}.{pname} has direct $ref: {pdef}")
        elif "anyOf" in pdef:
            for opt in pdef["anyOf"]:
                if ref_key in opt:
                    print(f"{sname}.{pname} has $ref inside anyOf: {opt}")

print("--- Checking all Explainability schemas for potential issues ---")
for sname in [
    "DistrictExplainabilityResponse",
    "ExplainabilityListResponse",
    "ExplainabilitySummary",
    "HazardSummary",
    "CarryingCapacitySummary",
    "VulnerabilitySummary",
    "RelocationSummary",
    "InterventionSummary",
    "TopContributingFactors",
    "ScoreContributions",
    "ComponentContributionSection",
    "ScoreContributionItem",
    "DataCompletenessSummary",
    "ConfidenceSummary",
    "SpatialDataStatus",
    "DecisionTraceStep",
]:
    sdef = schema['components']['schemas'].get(sname)
    if not sdef:
        print(f"MISSING SCHEMA: {sname}")
        continue
    for pname, pdef in sdef.get('properties', {}).items():
        if ref_key in pdef:
            print(f"Explainability schema {sname}.{pname} has direct $ref with extra keys: {list(pdef.keys())}")
