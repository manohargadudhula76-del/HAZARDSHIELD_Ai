# HazardShield AI — Dataset Management & Preprocessing Pipeline

This directory contains the dataset repository for the **HazardShield AI** disaster intelligence platform (SIH26191).

---

## Directory Structure

```
backend/datasets/
├── raw/                            # Raw incoming data files (CSV, JSON, GeoJSON)
│   ├── rainfall/                   # Precipitation and monsoon monitoring data
│   ├── population/                 # Demographics, habitation settlements & density data
│   ├── housing/                    # Household counts, building condition & dilapidated housing data
│   ├── disasters/                  # Historical flood, landslide, cyclone & earthquake logs
│   ├── landslides/                 # Landslide inventory & slope stability markers
│   ├── cyclones/                   # Coastal cyclone track data & storm surge records
│   ├── infrastructure/             # Hospitals, schools, shelters & evacuation road access data
│   └── gis/                        # Spatial GIS shapefiles, GeoJSON boundaries & elevation grids
├── processed/                      # Cleaned, normalized & validated individual datasets
├── master/                         # Final merged master habitations dataset
└── README.md                       # Documentation and column specifications
```

---

## Folder Usage & Column Specifications

### 1. `raw/rainfall/`
- **Purpose**: Stores regional precipitation records and monsoon rainfall metrics.
- **Formats**: `.csv`, `.json`, `.geojson`
- **Required Columns**: `state`, `district`, `rainfall` (or `average_rainfall` / `daily_actual`)
- **Optional Columns**: `date`, `month`, `year`, `maximum_rainfall`

### 2. `raw/population/`
- **Purpose**: Stores settlement demographics and population figures.
- **Formats**: `.csv`, `.json`, `.geojson`
- **Required Columns**: `state`, `district`, `population`
- **Optional Columns**: `habitation`, `habitation_name`, `area_sq_km`, `population_density`, `total_households`

### 3. `raw/housing/`
- **Purpose**: Stores household safety, occupied census house conditions, and structural vulnerability indicators.
- **Formats**: `.csv`, `.json`, `.geojson`
- **Required Columns**: `state`, `district`
- **Optional Columns**: `tehsil`, `habitation`, `rural_urban`, `total_households`, `good_houses`, `livable_houses`, `dilapidated_houses`

### 4. `raw/disasters/`
- **Purpose**: Stores historical disaster occurrence logs and impact metrics.
- **Formats**: `.csv`, `.json`, `.geojson`
- **Required Columns**: `state` (or `country`), `district` (or `location`)
- **Optional Columns**: `disaster_type`, `date`, `start_year`, `latitude`, `longitude`, `historical_floods`, `historical_landslides`, `historical_cyclones`, `total_deaths`, `no_affected`

### 5. `raw/landslides/`
- **Purpose**: Stores landslide susceptibility inventory and spatial event logs.
- **Formats**: `.csv`, `.json`, `.geojson`
- **Optional Columns**: `state`, `district`, `latitude`, `longitude`, `date`, `slope`, `severity`

### 6. `raw/cyclones/`
- **Purpose**: Stores cyclone tracks, wind speed measurements, and coastal exposure.
- **Formats**: `.csv`, `.json`, `.geojson`
- **Optional Columns**: `date`, `latitude`, `longitude`, `wind_speed`, `pressure_mb`, `category`

### 7. `raw/infrastructure/`
- **Purpose**: Stores civic infrastructure counts and evacuation arterial accessibility ratings.
- **Formats**: `.csv`, `.json`, `.geojson`
- **Required Columns**: `state`, `district`
- **Optional Columns**: `hospital_count`, `school_count`, `shelter_count`, `infrastructure_score`, `road_access_score`

### 8. `raw/gis/`
- **Purpose**: Stores geospatial terrain profiles, digital elevation models (DEM), and habitation boundary polygons.
- **Formats**: `.csv`, `.json`, `.geojson`
- **Required Columns**: `state`, `district`
- **Optional Columns**: `latitude`, `longitude`, `elevation`, `slope`

---

## Processed & Master Datasets

- **Processed Datasets (`datasets/processed/`)**: Individual cleaned datasets with normalized column names, trimmed strings, deduplicated rows, and handled missing values.
- **Master Dataset (`datasets/master/master_habitations.csv`)**: Consolidated master dataset containing merged geospatial, demographic, housing, hazard, capacity, and infrastructure metrics per habitation.

---

## How Master Dataset is Generated

1. Data loader reads files from `raw/` subdirectories (`DataLoader.load_file`).
2. Data cleaner normalizes column names, maps aliases (e.g. `state_name` $\rightarrow$ `state`, `district_name` $\rightarrow$ `district`, `condition_of_occupied_census_houses_dilapidated_households` $\rightarrow$ `dilapidated_houses`), trims text, handles missing values, and removes duplicate records (`DataCleaner.clean_dataframe`).
3. Data validator verifies required and optional columns per domain (`DataValidator.validate`).
4. Dataset merge service performs strict validation to prevent many-to-many row duplication and merges datasets on (`state`, `district`, `habitation`) keys (`DatasetMergeService.build_master_dataset`).
5. Output is saved to `datasets/master/master_habitations.csv` with a comprehensive execution report.
