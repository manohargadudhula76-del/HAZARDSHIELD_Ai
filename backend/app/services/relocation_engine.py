import math
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional, Union, Tuple
from app.services.hazard_engine import hazard_engine, HazardEngine
from app.services.carrying_capacity_engine import carrying_capacity_engine, CarryingCapacityEngine
from app.services.vulnerability_engine import vulnerability_engine, VulnerabilityEngine

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MASTER_DATASET_PATH = BASE_DIR / "datasets" / "master" / "master_habitations.csv"

RELOCATION_DISCLAIMER = (
    "DISCLAIMER: This relocation recommendation is a prototype analytical assessment generated for "
    "research and decision-support purposes only. It does NOT represent official government "
    "evacuation orders or official relocation policy."
)


def compute_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes the great-circle distance between two geographic points (lat1, lon1) and (lat2, lon2)
    in kilometers using the Haversine formula.
    """
    R = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)


class RelocationEngine:
    """
    Safe Relocation Recommendation Engine for HazardShield AI (Phase 6 / Phase 6.1).
    Recommends safe, suitable destination districts for high-vulnerability source districts
    based on Hazard Risk, Vulnerability Index, Carrying Capacity, and Geographic Distance.
    Operates strictly at the District-to-District analytical level.
    """

    BASE_WEIGHTS = {
        "hazard_improvement": 0.30,
        "carrying_capacity": 0.25,
        "vulnerability_improvement": 0.20,
        "healthcare_capacity": 0.10,
        "housing_capacity": 0.10,
        "geographic_proximity": 0.05,
    }

    def __init__(
        self,
        dataset_path: Optional[Union[str, Path]] = None,
        hz_engine: Optional[HazardEngine] = None,
        cc_engine: Optional[CarryingCapacityEngine] = None,
        v_engine: Optional[VulnerabilityEngine] = None,
    ):
        self.dataset_path = Path(dataset_path) if dataset_path else MASTER_DATASET_PATH
        self.hazard_engine = hz_engine if hz_engine else hazard_engine
        self.carrying_capacity_engine = cc_engine if cc_engine else carrying_capacity_engine
        self.vulnerability_engine = v_engine if v_engine else vulnerability_engine
        self._cached_results: Optional[Dict[str, Any]] = None

    def _load_all_district_metrics(self) -> List[Dict[str, Any]]:
        hz_lookup = {h["district_id"]: h for h in self.hazard_engine.analyze_all_districts()}
        cc_lookup = {c["district_id"]: c for c in self.carrying_capacity_engine.analyze_all_districts()}
        v_list = self.vulnerability_engine.analyze_all_districts()

        merged_districts = []
        for v in v_list:
            did = str(v["district_id"])
            hz = hz_lookup.get(did, {})
            cc = cc_lookup.get(did, {})

            merged_districts.append({
                "district_id": did,
                "state": str(v.get("state", "")),
                "district": str(v.get("district", "")),
                "latitude": v.get("latitude"),
                "longitude": v.get("longitude"),
                "spatial_analysis_available": bool(v.get("spatial_analysis_available", False)),
                "priority_level": v.get("priority_level", "LOW_PRIORITY"),
                "priority_rank": v.get("priority_rank"),
                "overall_vulnerability_score": float(v.get("overall_vulnerability_score", 0.0)),
                "overall_hazard_score": float(hz.get("overall_hazard_score", 0.0)),
                "risk_level": hz.get("risk_level", "LOW"),
                "overall_carrying_capacity_score": float(cc.get("overall_carrying_capacity_score", 0.0)),
                "healthcare_capacity_score": cc.get("healthcare_capacity_score"),
                "housing_capacity_score": cc.get("housing_capacity_score"),
            })
        return merged_districts

    def _calculate_suitability_score(
        self,
        source: Dict[str, Any],
        candidate: Dict[str, Any],
        distance_km: float,
    ) -> Tuple[float, Dict[str, float]]:
        s_hz = source["overall_hazard_score"]
        c_hz = candidate["overall_hazard_score"]
        hazard_imp = 100.0 if s_hz <= 0 else min(100.0, max(0.0, ((s_hz - c_hz) / s_hz) * 100.0))

        cc_score = min(100.0, max(0.0, candidate["overall_carrying_capacity_score"]))

        s_vuln = source["overall_vulnerability_score"]
        c_vuln = candidate["overall_vulnerability_score"]
        vuln_imp = 100.0 if s_vuln <= 0 else min(100.0, max(0.0, ((s_vuln - c_vuln) / s_vuln) * 100.0))

        hosp_score = candidate.get("healthcare_capacity_score")
        housing_score = candidate.get("housing_capacity_score")

        prox_score = max(0.0, 100.0 - (distance_km / 10.0))

        raw_scores: Dict[str, Optional[float]] = {
            "hazard_improvement": round(hazard_imp, 2),
            "carrying_capacity": round(cc_score, 2),
            "vulnerability_improvement": round(vuln_imp, 2),
            "healthcare_capacity": round(hosp_score, 2) if (hosp_score is not None and not pd.isna(hosp_score)) else None,
            "housing_capacity": round(housing_score, 2) if (housing_score is not None and not pd.isna(housing_score)) else None,
            "geographic_proximity": round(prox_score, 2),
        }

        # Dynamic weight redistribution
        available_weights = {}
        for key, base_w in self.BASE_WEIGHTS.items():
            if raw_scores[key] is not None:
                available_weights[key] = base_w

        total_weight = sum(available_weights.values())
        if total_weight <= 0:
            return 0.0, {}

        redistributed_weights = {k: v / total_weight for k, v in available_weights.items()}

        final_suitability = 0.0
        breakdown = {}
        for key, r_w in redistributed_weights.items():
            val = raw_scores[key]
            if val is not None:
                final_suitability += r_w * val
                breakdown[key] = val

        return round(final_suitability, 2), breakdown

    def analyze_all_relocations(self) -> Dict[str, Any]:
        if self._cached_results is not None:
            return self._cached_results

        all_districts = self._load_all_district_metrics()

        # Eligible source districts: CRITICAL_PRIORITY or HIGH_PRIORITY
        eligible_sources = [
            d for d in all_districts
            if d["priority_level"] in ["CRITICAL_PRIORITY", "HIGH_PRIORITY"]
        ]

        recommendations_by_source = []

        recommendations_available_count = 0
        cross_state_recommendation_count = 0
        no_valid_recommendation_count = 0
        insufficient_spatial_data_count = 0

        for source in eligible_sources:
            s_id = source["district_id"]
            s_state = source["state"]
            s_dist = source["district"]
            s_spatial = source["spatial_analysis_available"]

            # STEP 1: Check whether source district has valid spatial coordinates
            if not s_spatial or source["latitude"] is None or source["longitude"] is None or pd.isna(source["latitude"]) or pd.isna(source["longitude"]):
                insufficient_spatial_data_count += 1
                recommendations_by_source.append({
                    "source_district_id": s_id,
                    "source_state": s_state,
                    "source_district": s_dist,
                    "source_latitude": None,
                    "source_longitude": None,
                    "source_priority_level": source["priority_level"],
                    "source_hazard_score": source["overall_hazard_score"],
                    "source_vulnerability_score": source["overall_vulnerability_score"],
                    "source_carrying_capacity_score": source["overall_carrying_capacity_score"],
                    "spatial_analysis_available": False,
                    "relocation_assessment_status": "INSUFFICIENT_SPATIAL_DATA",
                    "recommendation_scope": "NO_RECOMMENDATION",
                    "no_recommendation_available": True,
                    "recommendation_reasoning": "Source district lacks GIS geographic coordinates required for distance calculations.",
                    "total_candidates_found": 0,
                    "recommendations": [],
                    "disclaimer": RELOCATION_DISCLAIMER,
                })
                continue

            s_lat = float(source["latitude"])
            s_lon = float(source["longitude"])
            s_hz = source["overall_hazard_score"]
            s_vuln = source["overall_vulnerability_score"]
            s_cc = source["overall_carrying_capacity_score"]

            # Filter candidate destination districts
            eligible_candidates = []
            for cand in all_districts:
                if cand["district_id"] == s_id:
                    continue
                if not cand["spatial_analysis_available"] or cand["latitude"] is None or cand["longitude"] is None or pd.isna(cand["latitude"]) or pd.isna(cand["longitude"]):
                    continue
                if cand["risk_level"] not in ["LOW", "MODERATE"]:
                    continue
                if cand["priority_level"] == "CRITICAL_PRIORITY":
                    continue
                if cand["overall_hazard_score"] >= s_hz:
                    continue
                if cand["overall_vulnerability_score"] >= s_vuln:
                    continue
                if cand["overall_carrying_capacity_score"] < s_cc:
                    continue

                dist_km = compute_haversine_distance(s_lat, s_lon, float(cand["latitude"]), float(cand["longitude"]))
                suit_score, breakdown = self._calculate_suitability_score(source, cand, dist_km)

                eligible_candidates.append({
                    "district_id": cand["district_id"],
                    "state": cand["state"],
                    "district": cand["district"],
                    "latitude": float(cand["latitude"]),
                    "longitude": float(cand["longitude"]),
                    "distance_km": dist_km,
                    "overall_hazard_score": cand["overall_hazard_score"],
                    "risk_level": cand["risk_level"],
                    "overall_vulnerability_score": cand["overall_vulnerability_score"],
                    "priority_level": cand["priority_level"],
                    "overall_carrying_capacity_score": cand["overall_carrying_capacity_score"],
                    "suitability_score": suit_score,
                    "suitability_breakdown": breakdown,
                })

            # Evaluate decision logic order
            same_state_cands = [c for c in eligible_candidates if c["state"] == s_state]
            cross_state_cands = [c for c in eligible_candidates if c["state"] != s_state]

            # STEP 2: Search SAME-STATE destinations
            if same_state_cands:
                status = "RECOMMENDATIONS_AVAILABLE"
                scope = "SAME_STATE"
                no_rec = False
                target_pool = same_state_cands
                recommendations_available_count += 1
                reasoning = f"Found {len(same_state_cands)} suitable candidate destinations within the same state ({s_state})."
            # STEP 3: Search CROSS-STATE destinations
            elif cross_state_cands:
                status = "CROSS_STATE_RECOMMENDATION"
                scope = "CROSS_STATE"
                no_rec = False
                target_pool = cross_state_cands
                cross_state_recommendation_count += 1
                reasoning = (
                    f"No suitable destination found in same state ({s_state}). "
                    f"Identified {len(cross_state_cands)} cross-state candidate destinations."
                )
            # STEP 4: NO_VALID_RECOMMENDATION
            else:
                status = "NO_VALID_RECOMMENDATION"
                scope = "NO_RECOMMENDATION"
                no_rec = True
                target_pool = []
                no_valid_recommendation_count += 1
                reasoning = (
                    "No destination district met all safety, vulnerability reduction, and carrying capacity criteria."
                )

            # Sort top 5 candidate destinations: suitability DESC, distance ASC, district_id ASC
            sorted_candidates = sorted(
                target_pool,
                key=lambda x: (-x["suitability_score"], x["distance_km"], x["district_id"])
            )[:5]

            recommendations_by_source.append({
                "source_district_id": s_id,
                "source_state": s_state,
                "source_district": s_dist,
                "source_latitude": s_lat,
                "source_longitude": s_lon,
                "source_priority_level": source["priority_level"],
                "source_hazard_score": s_hz,
                "source_vulnerability_score": s_vuln,
                "source_carrying_capacity_score": s_cc,
                "spatial_analysis_available": True,
                "relocation_assessment_status": status,
                "recommendation_scope": scope,
                "no_recommendation_available": no_rec,
                "recommendation_reasoning": reasoning,
                "total_candidates_found": len(target_pool),
                "recommendations": sorted_candidates,
                "disclaimer": RELOCATION_DISCLAIMER,
            })

        critical_cnt = sum(1 for s in eligible_sources if s["priority_level"] == "CRITICAL_PRIORITY")
        high_cnt = sum(1 for s in eligible_sources if s["priority_level"] == "HIGH_PRIORITY")

        # Mutually exclusive verification assertion
        total_eligible = len(eligible_sources)
        sum_categories = (
            recommendations_available_count
            + cross_state_recommendation_count
            + no_valid_recommendation_count
            + insufficient_spatial_data_count
        )
        assert sum_categories == total_eligible, (
            f"Categorization mismatch: {sum_categories} != {total_eligible}"
        )

        summary = {
            "total_eligible_source_districts": total_eligible,
            "critical_priority_count": critical_cnt,
            "high_priority_count": high_cnt,
            "recommendations_available_count": recommendations_available_count,
            "cross_state_recommendation_count": cross_state_recommendation_count,
            "no_valid_recommendation_count": no_valid_recommendation_count,
            "insufficient_spatial_data_count": insufficient_spatial_data_count,
            # Backwards-compatible aliases
            "districts_with_same_state_options": recommendations_available_count,
            "districts_with_cross_state_options": cross_state_recommendation_count,
            "districts_with_no_options": no_valid_recommendation_count,
            "districts_lacking_spatial_data": insufficient_spatial_data_count,
            "priority_sources": [
                {
                    "source_district_id": r["source_district_id"],
                    "state": r["source_state"],
                    "district": r["source_district"],
                    "priority_level": r["source_priority_level"],
                    "relocation_assessment_status": r["relocation_assessment_status"],
                    "recommendation_scope": r["recommendation_scope"],
                    "top_destination": r["recommendations"][0]["district"] if r["recommendations"] else None,
                    "top_destination_state": r["recommendations"][0]["state"] if r["recommendations"] else None,
                    "top_suitability_score": r["recommendations"][0]["suitability_score"] if r["recommendations"] else None,
                }
                for r in sorted(
                    recommendations_by_source,
                    key=lambda x: (
                        0 if x["source_priority_level"] == "CRITICAL_PRIORITY" else 1,
                        x["source_district_id"]
                    )
                )
            ],
            "disclaimer": RELOCATION_DISCLAIMER,
        }

        self._cached_results = {
            "total_count": len(recommendations_by_source),
            "results": recommendations_by_source,
            "summary": summary,
            "disclaimer": RELOCATION_DISCLAIMER,
        }
        return self._cached_results

    def get_relocation_for_district(self, district_id: str) -> Optional[Dict[str, Any]]:
        all_data = self.analyze_all_relocations()
        for r in all_data["results"]:
            if r["source_district_id"] == district_id:
                return r
        return None


# Global singleton instance
relocation_engine = RelocationEngine()
