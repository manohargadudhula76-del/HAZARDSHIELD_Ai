# Phase 8 Methodology: Decision Explainability, Audit & Transparency Engine

## 1. Phase 8 Objective
The primary objective of Phase 8 in HazardShield AI is to provide a comprehensive, deterministic, and traceable explainability and audit layer across all 640 districts in India. Phase 8 does **not** recalculate, modify, or override the analytical results produced by previous phases. Instead, it serves as an analytical transparency engine that documents how:
- Multi-hazard exposure (Phase 3),
- 7-sector carrying capacity (Phase 4),
- Composite vulnerability and priority indices (Phase 5),
- Safe relocation recommendations (Phase 6 / 6.1), and
- Multi-criteria intervention decision-support strategies (Phase 7)
cumulatively contribute to the final analytical recommendation for each district.

The engine guarantees read-only idempotency, data provenance, and strict avoidance of fabricated or post-hoc reconstructed metrics.

---

## 2. Explainability Methodology
The Explainability Engine (`ExplainabilityEngine`) synthesizes analytical records from the five preceding analytical engines through deterministic lookups on `district_id`. For every district, it compiles:
1. **Executive Summaries**: Individual summaries for Hazard Risk, Carrying Capacity, Vulnerability, Relocation, and Intervention Prioritization.
2. **Key Drivers**: Component-level drivers reflecting actual empirical scores, infrastructure deficits, and risk escalations.
3. **5-Dimensional Contributing Factors**: Non-causal analytical contributing factors spanning hazard, capacity, vulnerability, relocation, and intervention.
4. **Mathematical Score Contribution Audits**: Exact weighted contributions derived strictly where redistributed weight distributions are exposed.
5. **Quality & Confidence Metrics**: Multi-phase completeness tracking, confidence ratings, and spatial availability audits.
6. **Chronological Decision Trace**: A 6-step audit trail representing the analytical pipeline.
7. **Explainability Status**: Classification into `COMPLETE`, `PARTIAL`, or `LIMITED`.

---

## 3. Data Sources from Phases 3–7
Phase 8 integrates outputs directly from the existing engine services:
- **Phase 3 (`HazardEngine`)**:
  - `overall_hazard_score` (0–100)
  - `risk_level` (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`)
  - Component scores: `flood_risk_score`, `landslide_risk_score`, `cyclone_risk_score`, `rainfall_risk_score`, `population_exposure_score`, `housing_vulnerability_score`, `infrastructure_risk_score`
  - `data_completeness_score`, `analysis_confidence`, `missing_data`
- **Phase 4 (`CarryingCapacityEngine`)**:
  - `overall_carrying_capacity_score` (0–100)
  - `carrying_capacity_level` (`HIGH_CAPACITY`, `MODERATE_CAPACITY`, `LOW_CAPACITY`, `CRITICAL_CAPACITY`)
  - Sector scores: `population_density_capacity_score`, `housing_capacity_score`, `healthcare_capacity_score`, etc.
  - `available_sectors`, `missing_sectors`, `assessment_confidence`, `redistributed_weights`
- **Phase 5 (`VulnerabilityEngine`)**:
  - `overall_vulnerability_score` (0–100)
  - `vulnerability_level` (`LOW_VULNERABILITY` to `CRITICAL_VULNERABILITY`)
  - `priority_index` (0–100), `priority_level`, `priority_rank` (1–640)
  - Component scores: `hazard`, `population_exposure`, `housing`, `healthcare`, `carrying_capacity`
  - `available_components`, `missing_components`, `redistributed_weights`
- **Phase 6 (`RelocationEngine`)**:
  - `relocation_assessment_status` (one of the 4 Phase 6.1 mutually exclusive categories)
  - `recommendation_scope` (`SAME_STATE`, `CROSS_STATE`, `NO_RECOMMENDATION`)
  - Destination candidates, Haversine distances, suitability scores, and breakdowns
- **Phase 7 (`DecisionSupportEngine`)**:
  - `primary_intervention` (one of 6 deterministic categories)
  - `intervention_priority_level` (`CRITICAL_INTERVENTION`, `HIGH_INTERVENTION`, `MODERATE_INTERVENTION`, `LOW_INTERVENTION`)
  - `intervention_reasoning`, `contributing_factors`, `recommended_actions`, `decision_confidence`

---

## 4. Key Driver Methodology
To maintain absolute scientific fidelity without inventing causal narratives, key drivers are extracted directly from empirical component values:
- **Hazard Drivers**: Filter components with elevated risk scores (>= 50.0 or >= 25.0) in descending order of intensity (e.g., rainfall departure, cyclone track exposure, historical flood events).
- **Carrying Capacity Drivers**: Highlight infrastructure deficits where capacity scores fall below 40.0 (e.g., severe healthcare hospital shortages or housing dilapidation), while explicitly noting missing sectors.
- **Vulnerability Drivers**: Identify the highest component scores contributing to overall vulnerability, as well as compounding urgency additions (e.g., dense population > 2000/sq km, critical hazard risk) that escalated the `priority_index`.
- **Relocation Drivers**: Report candidate discovery results, candidate suitability scores, or spatial constraints.

Language constraint: All explanations use phrasing such as *"Analytical contributing factor"* rather than claiming unverified real-world causal relations.

---

## 5. Score Contribution Methodology
Where underlying engines expose both component raw scores and effective weights, Phase 8 provides a mathematical breakdown:
$$\text{Weighted Contribution} = \text{Normalized Component Score} \times \text{Effective Weight}$$

- **Vulnerability Components (Phase 5)**:
  `vulnerability_engine` exposes `redistributed_weights` for available components (`hazard`, `population_exposure`, `housing`, `healthcare`, `carrying_capacity`). Phase 8 evaluates:
  $$\text{Contribution} = \text{Score} \times \text{Weight}$$
  The sum of weights equals `redistributed_weights_sum` (1.0).
- **Carrying Capacity Sectors (Phase 4)**:
  `carrying_capacity_engine` exposes `redistributed_weights` across available sectors (`population_density`, `housing`, `healthcare`). Contributions are computed directly and transparently.

---

## 6. Dynamic Weight Transparency Rules
In adherence to zero-fabrication safety requirements:
1. When weights are dynamically redistributed due to missing data (Phases 4 and 5), the engine reports the exact weights from the `redistributed_weights` field of the respective engine.
2. If an underlying engine does not expose individual redistributed weights in its output schema (such as Phase 3 `HazardEngine`, which exposes `redistributed_weights_sum` but not an individual component weight map), Phase 8 reports:
   ```json
   {
       "contribution_available": false,
       "reason": "Phase 3 Hazard Engine exposes overall redistributed_weights_sum but does not expose an individual component redistributed_weights dictionary in its output schema. In accordance with Phase 8 transparency and zero-fabrication safety requirements, weights are not reconstructed post hoc."
   }
   ```
3. Phase 8 never guesses, retrofits, or invents post-hoc weights.

---

## 7. Missing Data Handling
Missing data is handled transparently without imputation or silent fallback values:
- **Missing Sectors (Carrying Capacity)**: Across all 640 districts, 4 sectors (`education`, `water`, `shelter`, `road_evacuation`) lack district-level open government datasets. This limitation is explicitly logged in `missing_capacity_sectors` and `missing_data_limitations`.
- **Missing Vulnerability Components**: Any missing component is logged in `missing_vulnerability_components` and handled via normalized redistribution in Phase 5.
- **Missing Hazard Inputs**: Missing meteorological or historical records are tracked in `missing_hazard_data`.

---

## 8. Confidence Handling
Phase 8 provides multi-tiered confidence visibility across all analytical layers:
- `hazard_confidence`: Derived from the ratio of available input variables (`HIGH` >= 85%, `MEDIUM` >= 60%, `LOW` < 60%).
- `carrying_capacity_confidence`: Based on sector coverage (`HIGH` >= 6 sectors, `MEDIUM` 3–5 sectors, `LOW` < 3 sectors).
- `vulnerability_confidence`: Based on available components (`HIGH` = 5 components, `MEDIUM` = 3–4, `LOW` < 3).
- `overall_decision_confidence`: Harmonized decision confidence from Phase 7 (`HIGH`, `MEDIUM`, `LOW`).

Phase 8 never artificially elevates confidence ratings.

---

## 9. Spatial Data Limitations
Spatial capabilities are strictly bounded by GIS coordinate availability:
- If `latitude` and `longitude` are present, `spatial_analysis_available` is `True`, permitting Great-Circle (Haversine) distance calculations and relocation candidate ranking.
- If coordinates are absent or NaN, `spatial_analysis_available` is `False`. The district cannot participate in geographic distance analysis, resulting in an `INSUFFICIENT_SPATIAL_DATA` relocation status and restricting the explainability status to `LIMITED`.

---

## 10. Relocation Explanation Categories
Phase 8 explains safe relocation status using the four mutually exclusive Phase 6.1 categories (plus an explicit screening status for non-eligible districts):
1. **`RECOMMENDATIONS_AVAILABLE`**:
   *"Eligible destination districts satisfying the analytical relocation constraints were identified within the same state."*
2. **`CROSS_STATE_RECOMMENDATION`**:
   *"No eligible same-state destination was identified under the current analytical constraints; eligible cross-state candidates were identified."*
3. **`NO_VALID_RECOMMENDATION`**:
   *"No destination district satisfied all current analytical eligibility constraints."*
4. **`INSUFFICIENT_SPATIAL_DATA`**:
   *"Relocation distance analysis could not be completed because required source geographic coordinates are unavailable."*
5. **`NOT_APPLICABLE`**:
   *"Relocation analysis was not triggered as the district priority level does not meet the CRITICAL_PRIORITY or HIGH_PRIORITY screening threshold."*

---

## 11. Decision Trace Methodology
Every district explanation includes a chronological 6-step decision trace representing the pipeline execution flow:
- **STEP 1: Hazard Assessment (Phase 3)** — Documents overall hazard score, risk classification, and data confidence.
- **STEP 2: Carrying Capacity Assessment (Phase 4)** — Documents capacity score, capacity level, and available infrastructure sectors.
- **STEP 3: Vulnerability Assessment (Phase 5)** — Documents overall vulnerability score, vulnerability classification, and component availability.
- **STEP 4: Priority Assessment (Phase 5)** — Documents composite priority index, priority level classification, and national priority rank.
- **STEP 5: Relocation Assessment (Phase 6)** — Documents relocation screening outcome, recommendation scope, candidate counts, and top destination.
- **STEP 6: Intervention Decision (Phase 7)** — Documents final assigned primary intervention strategy, intervention priority level, and decision confidence.

---

## 12. Explainability Status Rules
Every district is assigned an `explainability_status` reflecting the structural completeness of its explanation:
- **`LIMITED`**:
  Assigned when critical analytical inputs or spatial data are unavailable. Specifically:
  - Source coordinates are missing (`spatial_analysis_available == False`), OR
  - Relocation status is `INSUFFICIENT_SPATIAL_DATA`, OR
  - Overall `decision_confidence` is `LOW`.
- **`COMPLETE`**:
  Assigned when:
  - Spatial coordinates are present and valid, AND
  - Overall `decision_confidence` is `HIGH`, AND
  - Vulnerability component completeness is 1.0 (all 5 vulnerability components available).
- **`PARTIAL`**:
  Assigned for all remaining districts where major analytical outputs across Phases 3–7 are successfully populated, but decision confidence is `MEDIUM` or minor component data is missing.

---

## 13. Prototype Limitations
- **Analytical Scope**: All analyses are conducted strictly at the district-to-district administrative resolution. Micro-level habitation variance is not represented.
- **Dataset Boundaries**: Infrastructure metrics rely on available Census and open government records; real-time dynamic traffic or hospital bed telemetry is not modeled.
- **Non-Statutory Status**: Explanations represent algorithmic transparency for decision-support research, not statutory government findings.

---

## 14. Mandatory Disclaimer
Every Phase 8 response includes the following mandatory prototype analytical transparency disclaimer:

> *"This explainability output is a prototype analytical transparency layer based on available datasets and existing model outputs. It does not establish official causation, government policy, evacuation orders, or legally binding relocation decisions."*
