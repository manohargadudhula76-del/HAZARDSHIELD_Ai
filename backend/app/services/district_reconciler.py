import json
import logging
import re
from pathlib import Path
from typing import Dict, Any, List, Tuple, Set, Optional
from difflib import SequenceMatcher
import pandas as pd

logger = logging.getLogger("district_reconciler")

# Explicit State Aliases (normalized key -> canonical normalized value)
STATE_ALIASES: Dict[str, str] = {
    "andaman and nicobar islands": "andaman and nicobar",
    "andaman and nicobar": "andaman and nicobar",
    "dadra and nagar haveli": "dadra and nagar haveli and daman and diu",
    "daman and diu": "dadra and nagar haveli and daman and diu",
    "dadra and nagar haveli and daman and diu": "dadra and nagar haveli and daman and diu",
    "orissa": "odisha",
    "pondicherry": "puducherry",
    "telangana": "telangana",
    "jammu and kashmir": "jammu and kashmir",
    "laddakh": "ladakh",
    "stately uttar pradesh": "uttar pradesh"
}

# Explicit District Aliases (normalized district name -> canonical normalized district name)
DISTRICT_ALIASES: Dict[str, str] = {
    "lahul and spiti": "lahaul and spiti",
    "lahaul and spiti": "lahaul and spiti",
    "hardwar": "haridwar",
    "haridwar": "haridwar",
    "purba medinipur": "east medinipur",
    "purbi medinipur": "east medinipur",
    "east medinipur": "east medinipur",
    "paschim medinipur": "west medinipur",
    "pashchimi medinipur": "west medinipur",
    "west medinipur": "west medinipur",
    "purbi singhbhum": "east singhbhum",
    "pashchimi singhbhum": "west singhbhum",
    "purbi champaran": "east champaran",
    "purba champaran": "east champaran",
    "pashchimi champaran": "west champaran",
    "paschim champaran": "west champaran",
    "the dangs": "dangs",
    "dangs": "dangs",
    "sant ravidas nagar bhadohi": "bhadohi",
    "sant ravidas nagar": "bhadohi",
    "bhadohi": "bhadohi",
    "jyotiba phule nagar": "amroha",
    "amroha": "amroha",
    "kheri": "lakhimpur kheri",
    "lakhimpur kheri": "lakhimpur kheri",
    "kanpur dehat": "kanpur rural",
    "kanpur nagar": "kanpur urban",
    "sahibzada ajit singh nagar": "sas nagar",
    "mohali": "sas nagar",
    "sas nagar": "sas nagar",
    "anugul": "angul",
    "baleshwar": "balasore",
    "baudh": "boudh",
    "debagarh": "deogarh",
    "jajapur": "jajpur",
    "jharasuguda": "jharsuguda",
    "subarnapur": "sonepur",
    "shrawasti": "shravasti",
    "siddharth nagar": "siddharthnagar",
    "kadamamut ahmednagar": "ahmednagar",
    "ahmadnagar": "ahmednagar",
    "ahmednagar": "ahmednagar",
    "faizabad": "ayodhya",
    "allahabad": "prayagraj",
    "firozpur": "ferozepur",
    "muktsar": "sri muktsar sahib",
    "badgam": "budgam",
    "punch": "poonch",
    "baramula": "baramulla",
    "bandipore": "bandipora",
    "shupiyan": "shopian",
    "gurgaon": "gurugram",
    "mewat": "nuh",
    "jhunjhunun": "jhunjhunu",
    "dhaulpur": "dholpur",
    "jalor": "jalore",
    "chittaurgarh": "chittorgarh",
    "mahamaya nagar": "hathras",
    "bara banki": "barabanki",
    "kanshiram nagar": "kasganj",
    "mahrajganj": "maharajganj",
    "north district": "north sikkim",
    "south district": "south sikkim",
    "east district": "east sikkim",
    "west district": "west sikkim",
    "garhwal": "pauri garhwal",
    "udham singh nagar": "udhamsingh nagar",
    "marigaon": "morigaon",
    "sibsagar": "sivasagar",
    "the nilgiris": "nilgiris",
    "narsimhapur": "narsinghpur",
    "central": "central delhi",
    "east": "east delhi",
    "north": "north delhi",
    "north east": "north east delhi",
    "north west": "north west delhi",
    "south": "south delhi",
    "south west": "south west delhi",
    "west": "west delhi"
}


def normalize_string(name: str) -> str:
    """
    Standardizes a state or district name string:
    - Lowercase & strip
    - Replace '&' with 'and'
    - Remove punctuation (hyphens, commas, dots, quotes)
    - Collapse extra whitespace
    """
    if not name or pd.isna(name):
        return ""
    text = str(name).lower().strip()
    text = re.sub(r'\s*&\s*', ' and ', text)
    text = re.sub(r'[\-\,\.\'\"\(\)]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def get_canonical_state(state: str) -> str:
    norm = normalize_string(state)
    return STATE_ALIASES.get(norm, norm)


def get_canonical_district(district: str) -> str:
    norm = normalize_string(district)
    return DISTRICT_ALIASES.get(norm, norm)


class DistrictReconciler:
    """
    Reconciles Census 2011 district records with GIS NWIC district polygons.
    Maintains exact match, alias match, unmatched lists, and fuzzy suggestions.
    Generates backend/datasets/district_reconciliation_report.json.
    """

    @classmethod
    def reconcile(
        cls,
        df_census: pd.DataFrame,
        df_gis: pd.DataFrame,
        state_col_census: str = "State name",
        district_col_census: str = "District name",
        state_col_gis: str = "state",
        district_col_gis: str = "district"
    ) -> Tuple[Dict[str, Any], pd.DataFrame]:
        """
        Reconciles Census 2011 districts (baseline backbone) with GIS districts.
        Returns reconciliation report dict and an enriched Census DataFrame with matched GIS metadata.
        """
        # Build normalized keys
        census_records = []
        for idx, row in df_census.iterrows():
            st_raw = str(row.get(state_col_census, ""))
            dt_raw = str(row.get(district_col_census, ""))
            st_norm = get_canonical_state(st_raw)
            dt_norm = get_canonical_district(dt_raw)
            code = row.get("District code", idx + 1)
            dist_id = f"DIST_IND_{int(code):03d}" if str(code).isdigit() else f"DIST_IND_{idx + 1:03d}"

            census_records.append({
                "district_id": dist_id,
                "census_state_raw": st_raw,
                "census_district_raw": dt_raw,
                "norm_state": st_norm,
                "norm_district": dt_norm,
                "census_index": idx,
                "row_data": row.to_dict()
            })

        gis_records = []
        for idx, row in df_gis.iterrows():
            st_raw = str(row.get(state_col_gis, row.get("state_name", "")))
            dt_raw = str(row.get(district_col_gis, ""))
            st_norm = get_canonical_state(st_raw)
            dt_norm = get_canonical_district(dt_raw)

            gis_records.append({
                "gis_state_raw": st_raw,
                "gis_district_raw": dt_raw,
                "norm_state": st_norm,
                "norm_district": dt_norm,
                "gis_index": idx,
                "geometry": getattr(row, "geometry", None)
            })

        # Match logic
        exact_matches = []
        alias_matches = []
        unmatched_census = []
        matched_gis_indices = set()

        # Index GIS by (norm_state, norm_district) and (norm_district)
        gis_by_state_dist: Dict[Tuple[str, str], List[Dict[str, Any]]] = {}
        gis_by_dist: Dict[str, List[Dict[str, Any]]] = {}

        for g in gis_records:
            key_sd = (g["norm_state"], g["norm_district"])
            gis_by_state_dist.setdefault(key_sd, []).append(g)
            gis_by_dist.setdefault(g["norm_district"], []).append(g)

        census_matched_map: Dict[int, Dict[str, Any]] = {}

        for c in census_records:
            sd_key = (c["norm_state"], c["norm_district"])
            c_idx = c["census_index"]

            # 1. Exact match on (norm_state, norm_district)
            if sd_key in gis_by_state_dist:
                match_g = gis_by_state_dist[sd_key][0]
                matched_gis_indices.add(match_g["gis_index"])
                census_matched_map[c_idx] = match_g
                exact_matches.append({
                    "district_id": c["district_id"],
                    "state": c["census_state_raw"],
                    "district": c["census_district_raw"],
                    "gis_state": match_g["gis_state_raw"],
                    "gis_district": match_g["gis_district_raw"],
                    "match_type": "EXACT"
                })

            # 2. District name alias match across state boundaries if state split
            elif c["norm_district"] in gis_by_dist:
                match_g = gis_by_dist[c["norm_district"]][0]
                matched_gis_indices.add(match_g["gis_index"])
                census_matched_map[c_idx] = match_g
                alias_matches.append({
                    "district_id": c["district_id"],
                    "state": c["census_state_raw"],
                    "district": c["census_district_raw"],
                    "gis_state": match_g["gis_state_raw"],
                    "gis_district": match_g["gis_district_raw"],
                    "match_type": "ALIAS"
                })
            else:
                unmatched_census.append(c)

        unmatched_gis = [g for g in gis_records if g["gis_index"] not in matched_gis_indices]

        # Generate fuzzy suggestions (NON-MUTATING, report only)
        fuzzy_suggestions = []
        gis_dist_names = [(g["norm_district"], g["gis_district_raw"], g["gis_state_raw"]) for g in unmatched_gis]

        for c in unmatched_census:
            c_dt = c["norm_district"]
            best_score = 0.0
            best_match = None
            for g_dt_norm, g_dt_raw, g_st_raw in gis_dist_names:
                score = SequenceMatcher(None, c_dt, g_dt_norm).ratio()
                if score > best_score:
                    best_score = score
                    best_match = (g_dt_raw, g_st_raw)

            if best_score >= 0.70 and best_match:
                fuzzy_suggestions.append({
                    "census_district": c["census_district_raw"],
                    "census_state": c["census_state_raw"],
                    "suggested_gis_district": best_match[0],
                    "suggested_gis_state": best_match[1],
                    "similarity_score": round(best_score, 3)
                })

        total_census = len(census_records)
        matched_census = len(exact_matches) + len(alias_matches)
        match_rate = round((matched_census / total_census * 100), 2) if total_census > 0 else 0.0

        report = {
            "reconciliation_summary": {
                "census_district_count": total_census,
                "gis_district_count": len(gis_records),
                "exact_matches_count": len(exact_matches),
                "alias_matches_count": len(alias_matches),
                "total_matched_count": matched_census,
                "unmatched_census_count": len(unmatched_census),
                "unmatched_gis_count": len(unmatched_gis),
                "census_gis_match_rate_pct": match_rate
            },
            "exact_matches": exact_matches[:50],
            "alias_matches": alias_matches,
            "unmatched_census_districts": [
                {"district_id": c["district_id"], "state": c["census_state_raw"], "district": c["census_district_raw"]}
                for c in unmatched_census
            ],
            "unmatched_gis_districts": [
                {"state": g["gis_state_raw"], "district": g["gis_district_raw"]}
                for g in unmatched_gis[:50]
            ],
            "fuzzy_suggestions_report_only": fuzzy_suggestions
        }

        # Build Census merged DataFrame
        merged_rows = []
        for c in census_records:
            c_idx = c["census_index"]
            r_dict = c["row_data"].copy()
            r_dict["district_id"] = c["district_id"]
            r_dict["state_std"] = c["norm_state"]
            r_dict["district_std"] = c["norm_district"]

            if c_idx in census_matched_map:
                match_g = census_matched_map[c_idx]
                r_dict["gis_matched"] = True
                r_dict["gis_state"] = match_g["gis_state_raw"]
                r_dict["gis_district"] = match_g["gis_district_raw"]
                r_dict["gis_geometry"] = match_g["geometry"]
            else:
                r_dict["gis_matched"] = False
                r_dict["gis_state"] = None
                r_dict["gis_district"] = None
                r_dict["gis_geometry"] = None

            merged_rows.append(r_dict)

        merged_df = pd.DataFrame(merged_rows)
        return report, merged_df
