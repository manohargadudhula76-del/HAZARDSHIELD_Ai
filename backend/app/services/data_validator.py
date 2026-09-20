import pandas as pd
from typing import Dict, Any, List, Set

# Domain Specific Column Definitions (Required vs Optional)
DOMAIN_COLUMN_SCHEMAS: Dict[str, Dict[str, List[str]]] = {
    "rainfall": {
        "required": ["state", "district"],
        "required_one_of": [["rainfall", "average_rainfall", "annual_rainfall", "daily_actual", "annual"]],
        "optional": ["date", "month", "year", "maximum_rainfall"]
    },
    "population": {
        "required": ["state", "district", "population"],
        "required_one_of": [],
        "optional": ["habitation", "habitation_name", "area_sq_km", "population_density", "total_households"]
    },
    "disasters": {
        "required": [],
        "required_one_of": [
            ["state", "country"],
            ["district", "location"]
        ],
        "optional": [
            "state", "district", "disaster_type", "date", "year", "start_year",
            "latitude", "longitude", "historical_floods", "historical_landslides",
            "historical_cyclones", "total_deaths", "no_affected", "total_affected"
        ]
    },
    "landslides": {
        "required": [],
        "required_one_of": [
            ["latitude", "lat"],
            ["longitude", "lon"]
        ],
        "optional": ["state", "district", "latitude", "longitude", "event_date", "event_title", "landslide_category", "landslide_size", "fatality_count", "slope", "severity"]
    },
    "cyclones": {
        "required": [],
        "required_one_of": [
            ["latitude", "lat"],
            ["longitude", "lon"]
        ],
        "optional": ["sid", "name", "iso_time", "lat", "lon", "latitude", "longitude", "usa_wind", "dist2land", "wind_speed", "pressure_mb", "category", "date", "state", "district"]
    },
    "infrastructure": {
        "required": ["state", "district"],
        "required_one_of": [],
        "optional": ["hospital_name", "hospital_category", "total_beds", "hospital_count", "school_count", "shelter_count", "infrastructure_score", "road_access_score"]
    },
    "housing": {
        "required": ["state", "district"],
        "required_one_of": [],
        "optional": [
            "habitation", "habitation_name", "tehsil", "rural_urban",
            "total_households", "good_houses", "livable_houses", "dilapidated_houses"
        ]
    },
    "gis": {
        "required": [],
        "required_one_of": [
            ["state", "stname"],
            ["district", "dtname"],
            ["geometry", "latitude"]
        ],
        "optional": ["stname", "dtname", "stcode11", "dtcode11", "latitude", "longitude", "elevation", "slope", "habitation", "habitation_name"]
    }
}


class DataValidator:
    """
    Dataset validator service that checks required and optional schema columns per domain.
    Distinguishes strictly between missing required columns and optional columns.
    """

    @classmethod
    def validate(cls, df: pd.DataFrame, domain: str) -> Dict[str, Any]:
        """
        Validates a DataFrame against a specified domain schema.
        """
        domain = domain.lower()
        detected_cols = [str(c).lower().strip() for c in df.columns]

        if domain not in DOMAIN_COLUMN_SCHEMAS:
            return {
                "is_valid": True,
                "domain": domain,
                "detected_columns": detected_cols,
                "missing_required": [],
                "missing_optional": [],
                "present_optional": [],
                "errors": [f"Domain '{domain}' has no specific validation schema configured."],
                "warnings": []
            }

        schema = DOMAIN_COLUMN_SCHEMAS[domain]
        required_cols = schema.get("required", [])
        required_one_of = schema.get("required_one_of", [])
        optional_cols = schema.get("optional", [])

        missing_required: List[str] = []
        errors: List[str] = []
        warnings: List[str] = []

        # Check required columns
        for col in required_cols:
            if col not in detected_cols:
                missing_required.append(col)
                errors.append(f"Required column '{col}' is missing for domain '{domain}'.")

        # Check required_one_of groups
        for col_group in required_one_of:
            if not any(col in detected_cols for col in col_group):
                group_str = " or ".join([f"'{c}'" for c in col_group])
                errors.append(f"Dataset must contain at least one column from [{group_str}] for domain '{domain}'.")
                missing_required.append(f"one_of({','.join(col_group)})")

        # Check optional columns
        present_optional = [col for col in optional_cols if col in detected_cols]
        missing_optional = [col for col in optional_cols if col not in detected_cols]

        for col in missing_optional:
            warnings.append(f"Optional column '{col}' is missing for domain '{domain}'.")

        is_valid = len(missing_required) == 0 and len(errors) == 0

        return {
            "is_valid": is_valid,
            "domain": domain,
            "detected_columns": detected_cols,
            "missing_required": missing_required,
            "missing_optional": missing_optional,
            "present_optional": present_optional,
            "errors": errors,
            "warnings": warnings,
        }
