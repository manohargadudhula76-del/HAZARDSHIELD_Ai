# Phase 4 Methodology: 7-Sector Carrying Capacity Assessment Engine

## 1. Scope & Data Integrity Guarantees
- **Analytical Granularity**: All carrying capacity evaluations operate strictly at the **DISTRICT LEVEL** based on the 2011 Census backbone (`backend/datasets/master/master_habitations.csv`). No habitation-level claims are made.
- **Zero Fabrication Standard**: Unavailable sectors (education, water, shelter, road access) are **never** populated with synthetic, default, or random values. Unavailable sectors are marked as `null` and explicitly included in `missing_sectors`.
- **Standardized Scale**: All sector capacity scores and the overall carrying capacity score operate on a standardized scale:
  - **100.0** = `EXCELLENT / HIGH CAPACITY` (high coping capacity / low crowding strain)
  - **0.0** = `VERY POOR / LOW CAPACITY` (severe infrastructure deficit / extreme overcrowding)

---

## 2. 7-Sector Breakdown & Deterministic Formulas

### 1. Population Density Capacity (Base Weight: 20%)
- **Input Metrics**: `population_density` (Census 2011 & GIS equal-area CRS `EPSG:7755`).
- **Formula**: Lower density represents higher coping capacity / lower crowding strain.
  $$\text{pop\_density\_capacity\_score} = 100.0 - \text{min\_max\_scale}(\text{population\_density})$$
- **Scale**: Highest density in India (e.g. urban Delhi/Mumbai) $\rightarrow$ 0.0; lowest density (e.g. Lahaul Spiti/Leh) $\rightarrow$ 100.0.

### 2. Housing Capacity (Base Weight: 20%)
- **Input Metrics**: `total_households`, `good_houses`, `livable_houses`, `dilapidated_houses`.
- **Formula**:
  $$\text{good\_house\_pct} = \frac{\text{good\_houses}}{\text{total\_households}} \times 100.0$$
  $$\text{livable\_house\_pct} = \frac{\text{livable\_houses}}{\text{total\_households}} \times 100.0$$
  $$\text{housing\_capacity\_score} = \min\left(100.0, \text{good\_house\_pct} + 0.5 \times \text{livable\_house\_pct}\right)$$

### 3. Healthcare Capacity (Base Weight: 15%)
- **Input Metrics**: `hospital_count`, `population`.
- **Validation Note**: Evaluated directly per 100,000 population rather than reusing composite infrastructure risk scores.
- **Formula**:
  $$\text{hospitals\_per\_100k} = \frac{\text{hospital\_count}}{\text{population}} \times 100,000.0$$
  $$\text{healthcare\_capacity\_score} = \text{min\_max\_scale}(\text{hospitals\_per\_100k})$$

### 4. Education Capacity (Base Weight: 15%)
- **Status**: `UNAVAILABLE` (No verified district-level school/college dataset exists).
- **Score**: `null` (Included in `missing_sectors`).

### 5. Water Availability (Base Weight: 10%)
- **Status**: `UNAVAILABLE` (No verified district-level water grid dataset exists).
- **Score**: `null` (Included in `missing_sectors`).

### 6. Shelter Capacity (Base Weight: 10%)
- **Status**: `UNAVAILABLE` (No verified district-level designated disaster shelter dataset exists).
- **Score**: `null` (Included in `missing_sectors`).

### 7. Road / Evacuation Access (Base Weight: 10%)
- **Status**: `UNAVAILABLE` (No verified district-level road network connectivity dataset exists).
- **Score**: `null` (Included in `missing_sectors`).

---

## 3. Dynamic Weight Redistribution

When sectors are unavailable, dynamic weight redistribution adjusts remaining weights so that available sector weights sum to **exactly 1.0**:

$$\text{normalized\_weight}_m = \frac{\text{original\_weight}_m}{\sum_{k \in \text{Available}} \text{original\_weight}_k}$$

$$\text{overall\_carrying\_capacity\_score} = \sum_{m \in \text{Available}} \left( \text{normalized\_weight}_m \times \text{sector\_score}_m \right)$$

For districts with the 3 available sectors (`population_density` [0.20], `housing` [0.20], `healthcare` [0.15]):
- Sum of available weights = $0.20 + 0.20 + 0.15 = 0.55$
- Population Density Weight = $\frac{0.20}{0.55} = 0.3636$ (36.36%)
- Housing Capacity Weight = $\frac{0.20}{0.55} = 0.3636$ (36.36%)
- Healthcare Capacity Weight = $\frac{0.15}{0.55} = 0.2727$ (27.27%)
- **Sum of Redistributed Weights**: $0.3636 + 0.3636 + 0.2727 = 1.0000$

---

## 4. Carrying Capacity Level Classification

| Score Range | Capacity Level Classification | Description |
| :--- | :--- | :--- |
| **75.01 – 100.00** | `HIGH_CAPACITY` | Strong coping capacity, high quality housing, low crowding strain |
| **50.01 – 75.00** | `MODERATE_CAPACITY` | Moderate coping capacity, adequate housing & density balance |
| **25.01 – 50.00** | `LOW_CAPACITY` | Low coping capacity, significant housing deficit or healthcare strain |
| **0.00 – 25.00** | `CRITICAL_CAPACITY` | Severe infrastructure deficit or extreme urban overcrowding |

---

## 5. Data Completeness & Assessment Confidence

$$\text{data\_completeness\_score} = \frac{\text{Available Sectors}}{7 \text{ Total Sectors}}$$

- **Confidence Levels**:
  - `HIGH`: Available sectors $\ge 6$ (Completeness $\ge 0.85$)
  - `MEDIUM`: $3 \le \text{Available sectors} \le 5$ ($0.40 \le \text{Completeness} < 0.85$)
  - `LOW`: Available sectors $< 3$ (Completeness $< 0.40$)
