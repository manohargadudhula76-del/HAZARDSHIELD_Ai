# Phase 10: Executive Reporting, District Dossier & Multi-Format Data Export Engine Methodology

## 1. Executive Summary & Purpose

Phase 10 delivers a centralized, unified reporting and export architecture for HazardShield AI. It synthesizes pre-computed analytical results across all previous phases (Phase 3 Hazard Assessment, Phase 4 Carrying Capacity, Phase 5 Vulnerability & Priority Index, Phase 6 Safe Relocation, Phase 7 Decision Support, Phase 8 Explainability & Audit, and Phase 9 System Readiness) into cohesive district dossiers, national briefings, state briefings, and multi-format data exports.

### Core Non-Mutation Principle
> **CRITICAL ARCHITECTURAL GUARANTEE:**  
> Phase 10 is a **strictly read-only presentation and export layer**. It does **NOT** compute, recalculate, alter, calibrate, or modify any hazard scores, carrying capacity metrics, vulnerability indices, priority rankings, relocation recommendations, or decision pathways. All values presented originate directly and deterministically from verified upstream engines (Phases 3–9).

---

## 2. Integrated Data Sources & Phase Lineage

The District Dossier and Executive Briefings aggregate data from the following verified services:

| Component | Upstream Service | Source Phase | Primary Outputs Integrated |
|---|---|---|---|
| **District Identity & Coordinates** | `vulnerability_engine.py` / `master_habitations.csv` | Phases 1–2, 5 | `district_id`, `state`, `district`, `latitude`, `longitude`, `spatial_analysis_available` |
| **Hazard Risk Profile** | `hazard_engine.py` | Phase 3 | `overall_hazard_score`, `risk_level`, flood, landslide, cyclone, rainfall, exposure, infrastructure scores, confidence |
| **Carrying Capacity Profile** | `carrying_capacity_engine.py` | Phase 4 | `overall_carrying_capacity_score`, `carrying_capacity_level`, available & missing sectors, sector capacity scores, confidence |
| **Vulnerability & National Priority** | `vulnerability_engine.py` | Phase 5 | `overall_vulnerability_score`, `vulnerability_level`, `priority_index`, `priority_level`, `priority_rank` (1–640) |
| **Safe Relocation Screening** | `relocation_engine.py` | Phase 6 | `relocation_assessment_status`, `recommendation_scope`, `no_recommendation_available`, candidate destinations, distance (km), suitability score |
| **Decision Support & Action Plan** | `decision_support_engine.py` | Phase 7 | `primary_intervention`, `intervention_priority_level`, `recommended_actions`, `contributing_factors`, `intervention_reasoning` |
| **Explainability & Audit** | `explainability_engine.py` | Phase 8 | `decision_data_completeness_score`, `decision_confidence`, `explainability_audit_status`, concise reasoning trace |
| **System Readiness & Health** | `system_integration_engine.py` | Phase 9 | `overall_system_status`, `prototype_readiness_level`, `readiness_score`, healthy components, diagnostic notes |

---

## 3. District Dossier Methodology

The unified District Dossier provides a single, strongly-typed profile (`DistrictDossierResponse`) for any of India's 640 districts:

1. **Identity & Spatial Verification**:
   - Validates district identifiers against the master registry (`DIST_IND_001` through `DIST_IND_640`).
   - Verifies whether GPS centroid coordinates are present and within valid Indian boundaries.
   - Non-existent IDs deterministically raise HTTP 404.

2. **Multi-Hazard Risk Section**:
   - Reflects the multi-hazard synthesis including flood, landslide, cyclone, rainfall anomaly, and infrastructure exposure.
   - Preserves normalized 0–100 scales and categorical risk ratings (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`).

3. **Carrying Capacity Section**:
   - Reflects the 7-sector carrying capacity assessment with dynamic weight redistribution for sectors lacking empirical district datasets (education, water, shelter, road evacuation).

4. **Vulnerability & National Priority Section**:
   - Features the composite vulnerability score, priority index, and strict 1-to-640 national priority ranking.

5. **Relocation Section**:
   - Directly maps the Phase 6 status (`RECOMMENDATIONS_AVAILABLE`, `CROSS_STATE_RECOMMENDATION`, `NO_VALID_RECOMMENDATION`, `INSUFFICIENT_SPATIAL_DATA`, `NOT_APPLICABLE`).
   - For districts lacking geographic coordinates, gracefully reports `INSUFFICIENT_SPATIAL_DATA` with a clear explanatory notice.

6. **Decision Support & Recommended Actions**:
   - Presents deterministic policy and engineering interventions alongside multi-stage rationale and contributing risk factors.

7. **Explainability & Transparency**:
   - Provides audit status, decision confidence, completeness ratio, and chronological assessment steps.

8. **Mandatory Prototype Disclaimer**:
   - Every dossier response embeds the standard legal research disclaimer.

---

## 4. National & State Executive Briefings

### National Executive Briefing (`GET /api/v1/dossier/briefing/national`)
Aggregates macro-level distributions across all 640 districts:
- **Risk & Vulnerability Distributions**: Counts of districts by hazard risk tier and vulnerability classification.
- **Priority Tier Counts**: Breakdown of national priorities, specifically highlighting `CRITICAL_PRIORITY` and `HIGH_PRIORITY` counts.
- **Intervention Pathway Distribution**: Breakdown of assigned policy interventions.
- **Relocation Feasibility Overview**: Distribution of relocation screening outcomes.
- **Top 10 Intervention-Priority Districts**: Highest urgency districts sorted by national priority rank.
- **Phase 9 System Health & Readiness**: Operational status, component counts, prototype readiness classification (`ANALYTICALLY_READY_FOR_PROTOTYPE_USE`), and diagnostic notes.

### State Executive Briefing (`GET /api/v1/dossier/briefing/state/{state_name}`)
Tailored regional briefing for individual States and Union Territories:
- **Case-Insensitive State Matching**: Strips whitespace and normalizes text casing (e.g., `west bengal`, `WEST BENGAL`, `West Bengal`).
- **404 Validation**: Non-existent states return HTTP 404 with an informative error message.
- **Statewide Aggregations**: Total districts, hazard distribution, vulnerability distribution, priority distribution, intervention breakdown, and state-specific relocation feasibility counts.
- **State Priority Leaderboard**: Top priority districts within the state sorted by priority rank and index.

---

## 5. Multi-Format Data Export Engine

### 1. JSON Multi-Indicator Summary (`GET /api/v1/dossier/export/summary`)
Returns a structured JSON payload containing all 640 district records with standardized indicator columns, export timestamp, and legal disclaimer.

### 2. Tabular CSV Download (`GET /api/v1/dossier/export/csv`)
Provides downloadable tabular data with standard CSV headers:
- `district_id`, `state`, `district`
- `latitude`, `longitude` (formatted to 6 decimal places, empty if missing)
- `overall_hazard_score`, `risk_level`
- `overall_carrying_capacity_score`
- `overall_vulnerability_score`, `vulnerability_level`
- `priority_index`, `priority_level`, `priority_rank`
- `primary_intervention`, `intervention_priority_level`
- `relocation_assessment_status`, `spatial_analysis_available`

**Implementation Details**:
- Returns `Response` with `media_type="text/csv"`.
- Sets `Content-Disposition: attachment; filename="hazardshield_district_dossier_summary.csv"`.
- Escapes special characters properly using Python's standard `csv.writer`.

### 3. RFC 7946 GeoJSON FeatureCollection (`GET /api/v1/dossier/export/geojson`)
Provides GIS-ready vector data following the RFC 7946 GeoJSON specification.

#### Spatial Coordinate Rules:
- **Coordinate Order**: Strictly `[longitude, latitude]` per GeoJSON standards.
- **Zero Coordinate Fabrication**: Only districts with verified GPS coordinates (`spatial_analysis_available == true` and non-null `latitude`/`longitude`) are included as Features.
- **Excluded Records Handling**:
  - Exactly **579 districts** possess verified GPS coordinates and are emitted as Point features.
  - Exactly **61 districts** lack GPS coordinates and are excluded from the geometry array.
  - The exclusion count is explicitly recorded in `metadata.excluded_missing_coordinates_count`.
- **CRS Reference**: WGS84 (`urn:ogc:def:crs:OGC:1.3:CRS84`).

---

## 6. Routing Architecture & Collision Prevention

In FastAPI, parameterized path operations like `/{district_id}` greedily capture path segments. To prevent collision with static briefing and export routes, the endpoint registration order in `app/api/v1/endpoints/dossier.py` is strictly:

1. `GET /briefing/national`
2. `GET /briefing/state/{state_name}`
3. `GET /export/summary`
4. `GET /export/csv`
5. `GET /export/geojson`
6. `GET /{district_id}`

This ensures routes such as `/api/v1/dossier/briefing/national` and `/api/v1/dossier/export/csv` are never mistakenly dispatched as `district_id = "briefing"` or `district_id = "export"`.

---

## 7. OpenAPI / Swagger UI Compatibility

Following the lessons from Phase 8:
- Pydantic models referencing nested `BaseModel` types omit redundant sibling `Field(..., description=...)` metadata.
- All response schemas use explicit typed models rather than arbitrary `Dict[str, Any]` schemas.
- Validated with 0 `$ref` sibling issues, ensuring Swagger UI renders all Phase 10 endpoints without `Could not render responses_Responses` errors.

---

## 8. Known Prototype Limitations & Mandatory Disclaimer

### Known Limitations:
1. **Administrative Unit Aggregation**: Calculations represent district-level administrative centroids; localized intra-district topographical variance is not captured.
2. **Missing Secondary Sector Datasets**: 4 of 7 infrastructure sectors (education, water, shelter, evacuation routes) currently utilize dynamic mathematical weight redistribution.
3. **Spatial Coordinate Coverage**: 61 districts currently lack precise centroid GPS coordinates and are omitted from GIS GeoJSON exports while utilizing non-spatial fallbacks in analytical engines.

### Mandatory Legal Disclaimer:
> **HazardShield AI is an analytical research and decision-support prototype. It does not constitute an official government evacuation order, relocation order, or disaster management directive. All outputs must be validated by relevant disaster management authorities.**
