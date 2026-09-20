# Phase 7 Methodology: Decision Support & Intervention Prioritization Engine

## 1. Overview & Analytical Scope

Phase 7 of HazardShield AI introduces the **Decision Support & Intervention Prioritization Engine**. The engine integrates multi-disciplinary outputs from Phase 3 (Hazard Engine), Phase 4 (Carrying Capacity Engine), Phase 5 (Vulnerability Engine), and Phase 6 (Safe Relocation Recommendation Engine) into a single, deterministic, transparent analytical decision-support framework across all 640 districts in India.

> [!IMPORTANT]
> - **District Analytical Level**: All assessments operate strictly at the **DISTRICT ANALYTICAL LEVEL** based on real aggregated metrics. No individual person, household, or village-level relocation orders are generated.
> - **Prototype Analytical Disclaimer**: Every API response, schema model, and documentation file contains the explicit mandatory disclaimer:
>   > *"This is a prototype analytical decision-support assessment and does not represent an official government decision, evacuation order, or relocation policy."*

---

## 2. Integrated Feature Inputs

| Source Phase | Key Input Metrics | Purpose in Decision Support |
| :--- | :--- | :--- |
| **Phase 3: Hazard Engine** | `overall_hazard_score`, `risk_level`, `analysis_confidence`, `data_completeness_score` | Primary exposure & hazard severity filter |
| **Phase 4: Carrying Capacity Engine** | `overall_carrying_capacity_score`, `carrying_capacity_level`, `healthcare_capacity_score`, `housing_capacity_score` | Infrastructure deficit & capacity building filter |
| **Phase 5: Vulnerability Engine** | `overall_vulnerability_score`, `vulnerability_level`, `priority_index`, `priority_level`, `priority_rank` | Socio-economic vulnerability & priority level mapping |
| **Phase 6: Safe Relocation Engine** | `relocation_assessment_status`, `recommendation_scope`, `no_recommendation_available`, `recommendations` | Feasibility check for relocation recommendations |

---

## 3. Primary Intervention Categories & Decision Logic Order

Every district receives **EXACTLY ONE** primary intervention category based on deterministic, transparent rules evaluated in the following strict order:

### 1. `IMMEDIATE_RELOCATION_ASSESSMENT`
- **Trigger Rule**: `priority_level == "CRITICAL_PRIORITY"` AND hazard score $\ge 30.0$ (or `risk_level` in `["MODERATE", "HIGH", "CRITICAL"]`) AND `relocation_assessment_status` in `["RECOMMENDATIONS_AVAILABLE", "CROSS_STATE_RECOMMENDATION"]`.
- **Focus**: Detailed ground-level feasibility assessment of vulnerable habitations and destination capacity. *NOT an official evacuation or relocation order.*

### 2. `HIGH_PRIORITY_MITIGATION`
- **Trigger Rule**: `priority_level` in `["CRITICAL_PRIORITY", "HIGH_PRIORITY"]` AND immediate relocation is not selected.
- **Focus**: Localized structural risk reduction, resilient infrastructure development, emergency response preparedness, healthcare readiness.

### 3. `CAPACITY_BUILDING_REQUIRED`
- **Trigger Rule**: `carrying_capacity_level` in `["CRITICAL_CAPACITY", "LOW_CAPACITY"]` OR `healthcare_capacity_score < 40.0` OR `housing_capacity_score < 40.0`.
- **Focus**: Strengthening healthcare facilities, upgrading dilapidated housing, improving emergency infrastructure capacity.

### 4. `VULNERABILITY_REDUCTION`
- **Trigger Rule**: `vulnerability_level` in `["CRITICAL_VULNERABILITY", "HIGH_VULNERABILITY"]` AND immediate relocation is not selected.
- **Focus**: Targeted social welfare support, housing resilience, healthcare access improvement, community disaster preparedness.

### 5. `MONITOR_AND_PREPARE`
- **Trigger Rule**: `priority_level == "MODERATE_PRIORITY"` OR `risk_level == "MODERATE"` OR `vulnerability_level == "MODERATE_VULNERABILITY"`.
- **Focus**: Continuous hazard monitoring, updating district disaster management plans, periodic risk reassessment.

### 6. `ROUTINE_RESILIENCE_PLANNING`
- **Trigger Rule**: `priority_level == "LOW_PRIORITY"` AND `risk_level == "LOW"` AND no major carrying capacity deficits.
- **Focus**: Maintenance of standard disaster response systems, routine resilience planning.

---

## 4. Priority Level Mapping

Intervention priority levels map transparently from Phase 5 priority levels:

- `CRITICAL_PRIORITY` $\rightarrow$ `CRITICAL_INTERVENTION`
- `HIGH_PRIORITY` $\rightarrow$ `HIGH_INTERVENTION`
- `MODERATE_PRIORITY` $\rightarrow$ `MODERATE_INTERVENTION`
- `LOW_PRIORITY` $\rightarrow$ `LOW_INTERVENTION`

---

## 5. Decision Data Completeness & Confidence Methodology

- **Data Completeness Score**: Average of Phase 3, Phase 4, and Phase 5 completeness scores:
  $$\text{Decision Completeness} = \frac{\text{Completeness}_{\text{Hazard}} + \text{Completeness}_{\text{Capacity}} + \text{Completeness}_{\text{Vulnerability}}}{3}$$
- **Confidence Rating**:
  - `HIGH`: All three component confidences are `HIGH`.
  - `LOW`: Any component confidence is `LOW` or spatial GIS coordinates are unavailable.
  - `MEDIUM`: All other cases.

---

## 6. API Endpoints

- `GET /api/v1/decision-support`: List intervention decision support assessments (filters: `state`, `intervention_priority_level`, `primary_intervention`).
- `GET /api/v1/decision-support/priorities`: Districts sorted by `intervention_priority_level`, `priority_index` descending, and `priority_rank` ascending.
- `GET /api/v1/decision-support/{district_id}`: Complete intervention decision details for single district.
