# Phase 6 Methodology: Safe Relocation Recommendation Engine & Category Classification (Phase 6.1)

## 1. Overview & Analytical Scope

Phase 6 of HazardShield AI introduces the **Safe Relocation Recommendation Engine**. The engine provides transparent, deterministic, decision-support recommendations to guide safe relocation from high-vulnerability disaster-prone districts to adjacent or proximate low-risk destination districts.

Phase 6.1 enforces **4 Mutually Exclusive Assessment Categories** for every eligible source district.

> [!IMPORTANT]
> - **Analytical Scope**: All calculations operate strictly at the **DISTRICT $\rightarrow$ DISTRICT ANALYTICAL RECOMMENDATION LEVEL** based on real district centroid coordinates and outputs from Phase 3 (Hazard Engine), Phase 4 (Carrying Capacity Engine), and Phase 5 (Vulnerability Engine).
> - **Prototype Disclaimer**:
>   > *"DISCLAIMER: This relocation recommendation is a prototype analytical assessment generated for research and decision-support purposes only. It does NOT represent official government evacuation orders or official relocation policy."*

---

## 2. Mutually Exclusive Assessment Categories

Every eligible source district (Phase 5 `priority_level` of `CRITICAL_PRIORITY` or `HIGH_PRIORITY`) is classified into **EXACTLY ONE** of the following four mutually exclusive categories:

### Category 1: `RECOMMENDATIONS_AVAILABLE`
- **Definition**: The source district has valid spatial coordinates and at least one valid destination district in the **same state**.
- **Requirements**:
  - `spatial_analysis_available == true` (non-null latitude and longitude).
  - Same-state eligible destination candidates $\ge 1$.
- **Response Fields**:
  - `relocation_assessment_status = "RECOMMENDATIONS_AVAILABLE"`
  - `recommendation_scope = "SAME_STATE"`
  - `no_recommendation_available = false`

### Category 2: `CROSS_STATE_RECOMMENDATION`
- **Definition**: The source district has valid spatial coordinates but no valid destination in the same state. At least one valid destination exists in another state.
- **Requirements**:
  - `spatial_analysis_available == true` (non-null latitude and longitude).
  - Same-state eligible destination candidates $== 0$.
  - Cross-state eligible destination candidates $\ge 1$.
- **Response Fields**:
  - `relocation_assessment_status = "CROSS_STATE_RECOMMENDATION"`
  - `recommendation_scope = "CROSS_STATE"`
  - `no_recommendation_available = false`

### Category 3: `NO_VALID_RECOMMENDATION`
- **Definition**: The source district has valid spatial coordinates, but no destination district anywhere meets all safety, vulnerability reduction, and carrying capacity criteria.
- **Requirements**:
  - `spatial_analysis_available == true` (non-null latitude and longitude).
  - Same-state eligible destination candidates $== 0$.
  - Cross-state eligible destination candidates $== 0$.
- **Response Fields**:
  - `relocation_assessment_status = "NO_VALID_RECOMMENDATION"`
  - `recommendation_scope = "NO_RECOMMENDATION"`
  - `no_recommendation_available = true`
  - `recommendations = []`

### Category 4: `INSUFFICIENT_SPATIAL_DATA`
- **Definition**: The source district lacks GIS centroid coordinates (`spatial_analysis_available == false` or null lat/lon).
- **Requirements**:
  - `spatial_analysis_available == false` or `latitude` is null or `longitude` is null.
- **Response Fields**:
  - `relocation_assessment_status = "INSUFFICIENT_SPATIAL_DATA"`
  - `recommendation_scope = "NO_RECOMMENDATION"`
  - `no_recommendation_available = true`
  - `recommendations = []`

---

## 3. Mutually Exclusive Arithmetic Validation Rule

The following equality is strictly enforced across the dataset summary:

$$\text{total\_eligible\_source\_districts} = \text{recommendations\_available\_count} + \text{cross\_state\_recommendation\_count} + \text{no\_valid\_recommendation\_count} + \text{insufficient\_spatial\_data\_count}$$

---

## 4. Decision Logic Sequence

The engine evaluates eligible source districts in the following strict order:

```
STEP 1: Check source spatial coordinates (lat/lon)
        ├── If NULL / False ──> INSUFFICIENT_SPATIAL_DATA [STOP]
        └── If Valid ──> Proceed to STEP 2

STEP 2: Filter candidate destinations in SAME STATE
        ├── If candidates >= 1 ──> RECOMMENDATIONS_AVAILABLE [STOP]
        └── If candidates == 0 ──> Proceed to STEP 3

STEP 3: Filter candidate destinations in OTHER STATES
        ├── If candidates >= 1 ──> CROSS_STATE_RECOMMENDATION [STOP]
        └── If candidates == 0 ──> Proceed to STEP 4

STEP 4: NO_VALID_RECOMMENDATION [STOP]
```

---

## 5. Destination Eligibility Criteria & Suitability Scoring

### Destination Eligibility Constraints:
1. `spatial_analysis_available == true` (non-null lat/lon).
2. `risk_level` in `["LOW", "MODERATE"]` (Phase 3).
3. `priority_level != "CRITICAL_PRIORITY"` (Phase 5).
4. `overall_hazard_score < source.overall_hazard_score` (Phase 3).
5. `overall_vulnerability_score < source.overall_vulnerability_score` (Phase 5).
6. `overall_carrying_capacity_score >= source.overall_carrying_capacity_score` (Phase 4).

### Composite Suitability Score (0 – 100):
- **Hazard Improvement (30%)**: $\min\left(100, \max\left(0, \frac{S.hz - D.hz}{S.hz} \times 100\right)\right)$
- **Carrying Capacity Score (25%)**: $D.\text{overall\_carrying\_capacity\_score}$
- **Vulnerability Improvement (20%)**: $\min\left(100, \max\left(0, \frac{S.vuln - D.vuln}{S.vuln} \times 100\right)\right)$
- **Healthcare Capacity (10%)**: $D.\text{healthcare\_capacity\_score}$
- **Housing Capacity (10%)**: $D.\text{housing\_capacity\_score}$
- **Geographic Proximity (5%)**: $\max\left(0, 100 - \frac{d}{10.0}\right)$ (Great-circle Haversine formula)

---

## 6. API Endpoints

- `GET /api/v1/relocation`: List relocation recommendations and dynamic category summary metadata.
- `GET /api/v1/relocation/priorities`: Summary of high-priority relocation source districts (**Registered before `/{district_id}`**).
- `GET /api/v1/relocation/{district_id}`: Single source district relocation recommendation details.
