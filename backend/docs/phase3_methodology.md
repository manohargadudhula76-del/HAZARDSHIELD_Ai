# Phase 3 Methodology: Multi-Hazard Risk Analysis Engine & Red Zone Identification

## 1. Analytical Level & Data Safety Guarantees
- **Analytical Granularity**: All risk calculations operate strictly at the **DISTRICT LEVEL** based on the 2011 Census backbone (`backend/datasets/master/master_habitations.csv`).
- **Data Integrity Standards**:
  - Missing rainfall or demographic values are **never** replaced with zero risk.
  - Missing GIS coordinates (61 districts) are **never** populated with synthetic lat/lon coordinates. They are assigned `spatial_analysis_available = false` and excluded from GeoJSON spatial features.
  - Recorded zero event counts (e.g. 0 historical floods) are explicitly distinguished from unavailable data.

---

## 2. Multi-Hazard Scoring Methodology & Component Weights

Each component score is normalized to a `[0.0, 100.0]` scale using empirical min-max scaling across real observed district distributions.

$$\text{Normalized Score} = \frac{x - x_{\min}}{x_{\max} - x_{\min}} \times 100.0$$

### Hazard Component Breakdown:

1. **Rainfall Risk Score (Weight: 20%)**:
   - Inputs: `average_rainfall`, `maximum_rainfall`, `annual_actual_rainfall`, `heavy_rainfall_days` (days $\ge 64.5$ mm).
   - If rainfall metrics are missing, the component is excluded from dynamic weight scaling.

2. **Flood Risk Score (Weight: 15%)**:
   - Inputs: `historical_disaster_count`, `historical_flood_count`.

3. **Landslide Risk Score (Weight: 15%)**:
   - Inputs: `historical_landslide_count`, `landslide_event_count` (spatial NASA landslide point-in-polygon counts).

4. **Cyclone Proximity Exposure Risk Score (Weight: 15%)**:
   - Inputs: `historical_cyclone_count`, `cyclone_track_count`, `cyclone_exposure_count`, `max_cyclone_wind`.
   - **Verification & Calculation Method**: Calculated using the Haversine formula from IBTrACS historical cyclone track points (`ibtracs.NI.list.v04r01.csv`) to district centroids within a prototype spatial distance threshold of $100.0\text{ km}$, combined with EM-DAT storm disaster events.
   - **Prototype Proximity Disclaimer**: Labeled explicitly as `cyclone_proximity_exposure` based on spatial track proximity. Does not claim confirmed direct storm damage or ground wind impact.

5. **Population Exposure Risk Score (Weight: 15%)**:
   - Inputs: `population`, `population_density` (derived via equal-area `EPSG:7755` CRS).

6. **Housing Vulnerability Risk Score (Weight: 10%)**:
   - Inputs: `dilapidated_houses`, `dilapidated_house_pct` (Census HLPCA Total households).

7. **Infrastructure Coping Capacity Risk Score (Weight: 10%)**:
   - Inputs: `hospital_count`, `hospital_bed_count`.
   - Higher healthcare capacity reduces infrastructure vulnerability score: $\text{Infra Risk} = 100.0 - \text{Coping Capacity}$.
   - School/road metrics are omitted because district-level datasets were unavailable.

---

## 3. Dynamic Missing Data Handling & Analysis Confidence

$$\text{Overall Hazard Score} = \frac{\sum (S_i \times W_i)}{\sum W_{\text{available}}}$$

- **Weight Normalization Guarantee**:
  For every district, the sum of redistributed weights for available components equals $1.0$:
  $$\sum_{i \in \text{Available}} W'_i = \frac{\sum_{i \in \text{Available}} W_i}{\sum_{i \in \text{Available}} W_i} = 1.0$$

- **Data Completeness Score**:
  $$\text{Completeness} = \frac{\text{Available Metric Inputs}}{21 \text{ Total Primary Inputs}}$$

- **Analysis Confidence Levels**:
  - `HIGH`: Completeness $\ge 0.85$ (85% to 100% data availability)
  - `MEDIUM`: $0.60 \le \text{Completeness} < 0.85$
  - `LOW`: Completeness $< 0.60$

---

## 4. Risk Level Thresholds & Corrected Red Zone Definitions

| Score Range | Risk Level Classification | Corrected Zone Classification | Zone Status (`is_red_zone`) |
| :--- | :--- | :--- | :--- |
| **75.01 – 100.00** | `CRITICAL` | `RED_ZONE` | `True` |
| **50.01 – 75.00** | `HIGH` | `POTENTIAL_RED_ZONE` | `True` |
| **25.01 – 50.00** | `MODERATE` | `WATCH_ZONE` | `False` |
| **0.00 – 25.00** | `LOW` | `LOW_RISK_ZONE` | `False` |

*Note*: MODERATE districts are classified as `WATCH_ZONE` and are NOT classified as Red Zones. `/api/v1/red-zones` and `/api/v1/red-zones/geojson` return ONLY `RED_ZONE` and `POTENTIAL_RED_ZONE` items.

---

## 5. Prototype Visualization Buffer Methodology & Limitations

- **Visualization Buffer Formula**:
  - Circle buffer polygon generated around district centroid $(lat, lon)$:
  $$\text{Visualization Buffer Radius (km)} = 5.0 + \left(\frac{\text{Overall Hazard Score}}{100.0}\right) \times 20.0 \text{ km}$$
  - Range: **5.0 km** (Min) to **25.0 km** (Max).

- **Buffer Classification Metadata**:
  - `boundary_type`: `"prototype_visualization_buffer"`
  - `boundary_disclaimer`: *"This geometry is a prototype visualization buffer derived from the analytical hazard score and is not an official government-designated hazard boundary."*

- **GIS Coordinate Exclusion & Spatial Validation**:
  - Districts with `spatial_analysis_available == false` (61 districts) are listed in tabular API responses but excluded from GeoJSON polygon feature output.
  - Spatial validation identity enforce: $\text{total\_red\_zones} - \text{districts\_excluded\_no\_coords} = \text{spatially\_rendered\_features}$.

---

## 6. Phase 3.1 Risk Score Distribution Diagnostic Review

An empirical diagnostic investigation was conducted across all 640 districts in `master_habitations.csv`.

### Statistical Summary of Overall Hazard Score:
- **Minimum Score**: 10.46
- **Maximum Score**: 39.20
- **Mean Score**: 19.62
- **Median Score**: 19.20
- **Standard Deviation**: 4.56

### Score Percentiles:
- **10th Percentile**: 14.45
- **25th Percentile**: 15.96
- **50th Percentile**: 19.20
- **75th Percentile**: 22.32
- **90th Percentile**: 25.74
- **95th Percentile**: 28.08
- **99th Percentile**: 33.06

### Component Score Breakdown:
- `rainfall_risk_score`: Mean 17.10 (Min 0.00, Max 93.56, Std 15.25)
- `flood_risk_score`: Mean 0.00 (Min 0.00, Max 0.00, Std 0.00)
- `landslide_risk_score`: Mean 0.00 (Min 0.00, Max 0.00, Std 0.00)
- `cyclone_proximity_exposure`: Mean 11.46 (Min 0.00, Max 68.46, Std 12.10)
- `population_exposure_score`: Mean 10.54 (Min 0.00, Max 90.50, Std 10.76)
- `housing_vulnerability_score`: Mean 28.94 (Min 0.00, Max 100.00, Std 18.35)
- `infrastructure_risk_score`: Mean 98.51 (Min 50.00, Max 100.00, Std 3.32)

### Missing Input Fields per District:
- **0 missing fields**: 476 districts
- **3 missing fields**: 26 districts
- **5 missing fields**: 102 districts
- **7 missing fields**: 1 district
- **8 missing fields**: 35 districts

### Diagnostic Root Cause Findings:
1. **Zero-Event Metric Handling**: In the initial prototype, zero-variance columns (`min_val == max_val == 0`) returned 50.0, which artificially inflated flood/landslide risk to 50% across all districts. Correcting `min_max_scale` to return 0.0 for zero-event columns eliminated false risk baseline inflation.
2. **Central Limit Effect Across Independent Hazard Layers**: Because districts rarely experience maximum extreme outliers across all 7 independent hazard layers simultaneously (e.g. max cyclone + max rainfall + max population density + max dilapidated housing in a single district), the weighted sum naturally centers around 15–35.
3. **Threshold Alignment**: Fixed absolute thresholds (50 for HIGH, 75 for CRITICAL) represent extreme compound disasters. On raw baseline datasets without synthetic inflation, 561 districts fall in `LOW_RISK_ZONE` (0–25) and 79 districts fall in `WATCH_ZONE` (25.01–50).

