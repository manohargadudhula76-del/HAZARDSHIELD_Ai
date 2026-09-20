# Phase 5 Methodology: District Vulnerability Analysis Engine & Priority Index

## 1. Purpose & Analytical Scope
- **Objective**: Synthesize Hazard Risk, Population Exposure, Housing Vulnerability, Healthcare Infrastructure, and Carrying Capacity into a composite Vulnerability Score, Vulnerability Level, Priority Index, and Intervention Priority Ranking.
- **Analytical Scope**: Operates strictly at the **DISTRICT LEVEL** based on the 2011 Census backbone (`backend/datasets/master/master_habitations.csv`). No habitation-level claims are made.
- **Zero Fabrication Standard**: Missing components are **never** populated with synthetic values. Missing metrics are excluded transparently via dynamic weight redistribution.
- **Prototype Disclaimer**: All results represent a *"prototype analytical assessment based on available datasets"* and do not constitute official government disaster management decisions.

---

## 2. Phase Dependencies & Vulnerability Components

Phase 5 integrates outputs from Phase 3 (`HazardEngine`) and Phase 4 (`CarryingCapacityEngine`), along with master dataset demographics:

1. **Hazard Exposure Vulnerability (Base Weight: 30%)**:
   - Source: `overall_hazard_score` from Phase 3.
   - Formula: $S_{\text{hazard}} = \text{overall\_hazard\_score}$ (0.0 – 100.0).

2. **Population Exposure Vulnerability (Base Weight: 20%)**:
   - Source: Census 2011 `population` and `population_density`.
   - Formula:
     $$S_{\text{population}} = 0.5 \times \text{min\_max\_scale}(\text{population}) + 0.5 \times \text{min\_max\_scale}(\text{population\_density})$$

3. **Housing Vulnerability (Base Weight: 20%)**:
   - Source: Census 2011 `dilapidated_house_pct` (HLPCA Total Households).
   - Formula:
     $$S_{\text{housing}} = \text{min\_max\_scale}(\text{dilapidated\_house\_pct})$$

4. **Healthcare Vulnerability (Base Weight: 15%)**:
   - Source: Calculated directly from `hospital_count` and `population` per 100,000 population.
   - Formula:
     $$\text{hospitals\_per\_100k} = \frac{\text{hospital\_count}}{\text{population}} \times 100,000.0$$
     $$S_{\text{healthcare}} = 100.0 - \text{min\_max\_scale}(\text{hospitals\_per\_100k})$$

5. **Carrying Capacity Vulnerability (Base Weight: 15%)**:
   - Source: Phase 4 `overall_carrying_capacity_score`.
   - Formula:
     $$S_{\text{capacity}} = 100.0 - \text{overall\_carrying\_capacity\_score}$$

---

## 3. Dynamic Weight Redistribution & Overall Vulnerability Formula

When a component is missing, its base weight is redistributed proportionally among available components so that normalized weights sum to **exactly 1.0**:

$$\text{normalized\_weight}_m = \frac{\text{base\_weight}_m}{\sum_{k \in \text{Available}} \text{base\_weight}_k}$$

$$\text{overall\_vulnerability\_score} = \sum_{m \in \text{Available}} \left( \text{normalized\_weight}_m \times S_m \right)$$

---

## 4. Vulnerability Level Classifications

| Score Range | Vulnerability Level | Description |
| :--- | :--- | :--- |
| **75.01 – 100.00** | `CRITICAL_VULNERABILITY` | Extreme compound vulnerability across hazard exposure, housing, and healthcare |
| **50.01 – 75.00** | `HIGH_VULNERABILITY` | Significant vulnerability requiring priority disaster mitigation |
| **25.01 – 50.00** | `MODERATE_VULNERABILITY` | Moderate vulnerability balance across demographic and capacity layers |
| **0.00 – 25.00** | `LOW_VULNERABILITY` | Low vulnerability with strong coping capacity and minimal hazard exposure |

---

## 5. Vulnerability Priority Index & Intervention Priority Ranking

The **Priority Index** calculates intervention urgency by combining overall vulnerability with transparent risk multipliers:

$$\text{priority\_index} = \max\left(0.0, \min\left(100.0, \text{overall\_vulnerability\_score} + \text{urgency\_additions}\right)\right)$$

### Urgency Additions:
1. **+10.0 points**: District is classified as `HIGH` or `CRITICAL` hazard risk level (Phase 3).
2. **+10.0 points**: Carrying capacity vulnerability $> 60.0$ (i.e. carrying capacity score $< 40.0$).
3. **+5.0 points**: Housing vulnerability score $> 50.0$ (high dilapidated housing ratio).
4. **+5.0 points**: Severe urban overcrowding / population density $> 2,000$ persons/sq km.

### Priority Level Classifications:
- **`CRITICAL_PRIORITY`**: Priority Index $\ge 60.0$
- **`HIGH_PRIORITY`**: $45.01 \le \text{Priority Index} < 60.0$
- **`MODERATE_PRIORITY`**: $30.01 \le \text{Priority Index} \le 45.0$
- **`LOW_PRIORITY`**: Priority Index $\le 30.0$

### Intervention Priority Ranking:
- `priority_rank`: Districts are sorted in descending order of `priority_index` (and `overall_vulnerability_score` as tiebreaker).
- **Rank 1** = Highest intervention priority in India.

---

## 6. Data Completeness & Confidence Classification

$$\text{vulnerability\_data\_completeness\_score} = \frac{\text{Available Vulnerability Components}}{5 \text{ Total Components}}$$

- **Confidence Levels**:
  - `HIGH`: Available components = 5 (Completeness = 1.0)
  - `MEDIUM`: $3 \le \text{Available Components} \le 4$ ($0.60 \le \text{Completeness} < 1.0$)
  - `LOW`: Available components $< 3$ (Completeness $< 0.60$)
