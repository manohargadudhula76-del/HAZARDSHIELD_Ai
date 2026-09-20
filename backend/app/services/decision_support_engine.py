import math
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional, Union
from app.services.hazard_engine import hazard_engine, HazardEngine
from app.services.carrying_capacity_engine import carrying_capacity_engine, CarryingCapacityEngine
from app.services.vulnerability_engine import vulnerability_engine, VulnerabilityEngine
from app.services.relocation_engine import relocation_engine, RelocationEngine

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MASTER_DATASET_PATH = BASE_DIR / "datasets" / "master" / "master_habitations.csv"

DECISION_SUPPORT_DISCLAIMER = (
    "This is a prototype analytical decision-support assessment and does not represent an "
    "official government decision, evacuation order, or relocation policy."
)


class DecisionSupportEngine:
    """
    Decision Support and Intervention Prioritization Engine for HazardShield AI (Phase 7).
    Combines Hazard Risk (Phase 3), Carrying Capacity (Phase 4), Vulnerability Index (Phase 5),
    and Relocation Recommendations (Phase 6) to assign deterministic, rule-based primary intervention
    strategies, action plans, and priority rankings across all 640 districts in India.
    Operates strictly at the District-to-District analytical level.
    """

    RECOMMENDED_ACTIONS_MAP = {
        "IMMEDIATE_RELOCATION_ASSESSMENT": [
            "Conduct detailed ground-level habitation assessment",
            "Verify carrying capacity of recommended destination areas",
            "Perform official environmental and social impact assessment",
            "Engage disaster management authorities",
            "Validate relocation suitability through field surveys",
        ],
        "HIGH_PRIORITY_MITIGATION": [
            "Strengthen local disaster preparedness",
            "Improve resilient infrastructure",
            "Prepare emergency response resources",
            "Improve healthcare readiness",
        ],
        "CAPACITY_BUILDING_REQUIRED": [
            "Improve healthcare accessibility",
            "Strengthen housing conditions",
            "Improve emergency infrastructure capacity",
        ],
        "VULNERABILITY_REDUCTION": [
            "Improve vulnerable household support",
            "Strengthen housing resilience",
            "Improve healthcare accessibility",
            "Develop local disaster preparedness programs",
        ],
        "MONITOR_AND_PREPARE": [
            "Monitor hazard indicators",
            "Update district disaster preparedness plans",
            "Conduct periodic vulnerability assessment",
        ],
        "ROUTINE_RESILIENCE_PLANNING": [
            "Continue resilience planning",
            "Maintain disaster preparedness systems",
            "Periodically reassess hazard indicators",
        ],
    }

    PRIORITY_LEVEL_MAPPING = {
        "CRITICAL_PRIORITY": "CRITICAL_INTERVENTION",
        "HIGH_PRIORITY": "HIGH_INTERVENTION",
        "MODERATE_PRIORITY": "MODERATE_INTERVENTION",
        "LOW_PRIORITY": "LOW_INTERVENTION",
    }

    def __init__(
        self,
        dataset_path: Optional[Union[str, Path]] = None,
        hz_engine: Optional[HazardEngine] = None,
        cc_engine: Optional[CarryingCapacityEngine] = None,
        v_engine: Optional[VulnerabilityEngine] = None,
        rel_engine: Optional[RelocationEngine] = None,
    ):
        self.dataset_path = Path(dataset_path) if dataset_path else MASTER_DATASET_PATH
        self.hazard_engine = hz_engine if hz_engine else hazard_engine
        self.carrying_capacity_engine = cc_engine if cc_engine else carrying_capacity_engine
        self.vulnerability_engine = v_engine if v_engine else vulnerability_engine
        self.relocation_engine = rel_engine if rel_engine else relocation_engine
        self._cached_results: Optional[Dict[str, Any]] = None

    def analyze_all_districts(self) -> Dict[str, Any]:
        if self._cached_results is not None:
            return self._cached_results

        hz_list = self.hazard_engine.analyze_all_districts()
        cc_list = self.carrying_capacity_engine.analyze_all_districts()
        v_list = self.vulnerability_engine.analyze_all_districts()
        rel_data = self.relocation_engine.analyze_all_relocations()

        hz_lookup = {h["district_id"]: h for h in hz_list}
        cc_lookup = {c["district_id"]: c for c in cc_list}
        rel_lookup = {r["source_district_id"]: r for r in rel_data["results"]}

        district_results = []
        category_counts: Dict[str, int] = {k: 0 for k in self.RECOMMENDED_ACTIONS_MAP.keys()}
        priority_counts: Dict[str, int] = {
            "CRITICAL_INTERVENTION": 0,
            "HIGH_INTERVENTION": 0,
            "MODERATE_INTERVENTION": 0,
            "LOW_INTERVENTION": 0,
        }

        for v in v_list:
            did = str(v["district_id"])
            hz = hz_lookup.get(did, {})
            cc = cc_lookup.get(did, {})
            rel = rel_lookup.get(did, {})

            p_level = v.get("priority_level", "LOW_PRIORITY")
            p_index = float(v.get("priority_index", 0.0))
            p_rank = v.get("priority_rank")
            v_score = float(v.get("overall_vulnerability_score", 0.0))
            v_level = v.get("vulnerability_level", "LOW_VULNERABILITY")
            v_conf = v.get("vulnerability_assessment_confidence", "MEDIUM")

            h_score = float(hz.get("overall_hazard_score", 0.0))
            h_risk = hz.get("risk_level", "LOW")
            h_conf = hz.get("analysis_confidence", "MEDIUM")
            h_comp = float(hz.get("data_completeness_score", 1.0))

            cc_score = float(cc.get("overall_carrying_capacity_score", 0.0))
            cc_level = cc.get("carrying_capacity_level", "HIGH_CAPACITY")
            cc_conf = cc.get("assessment_confidence", "MEDIUM")
            cc_comp = float(cc.get("data_completeness_score", 1.0))
            hosp_s = cc.get("healthcare_capacity_score")
            hous_s = cc.get("housing_capacity_score")

            rel_status = rel.get("relocation_assessment_status", "NOT_APPLICABLE")
            rel_considered = p_level in ["CRITICAL_PRIORITY", "HIGH_PRIORITY"]

            lat = v.get("latitude")
            lon = v.get("longitude")
            has_spatial = bool(v.get("spatial_analysis_available", False))

            # 1. Deterministic Primary Intervention Logic
            if (
                p_level == "CRITICAL_PRIORITY"
                and (h_score >= 30.0 or h_risk in ["MODERATE", "HIGH", "CRITICAL"])
                and rel_status in ["RECOMMENDATIONS_AVAILABLE", "CROSS_STATE_RECOMMENDATION"]
            ):
                primary_intervention = "IMMEDIATE_RELOCATION_ASSESSMENT"
                reasoning = [
                    f"District classified as CRITICAL_PRIORITY with significant hazard score ({h_score:.2f}).",
                    "Valid safe destination options identified within relocation assessment.",
                    "Field feasibility assessment recommended for vulnerable habitations.",
                ]
                factors = [
                    "Critical priority index ranking",
                    f"Elevated hazard risk score ({h_score:.2f})",
                    "Availability of viable destination districts",
                ]
            elif p_level in ["CRITICAL_PRIORITY", "HIGH_PRIORITY"]:
                primary_intervention = "HIGH_PRIORITY_MITIGATION"
                reasoning = [
                    f"District identified with elevated priority level ({p_level}).",
                    "Immediate relocation is either unviable or secondary to localized structural mitigation.",
                    "High-priority disaster risk reduction and infrastructure resilience required.",
                ]
                factors = [
                    f"Priority level: {p_level}",
                    f"Overall vulnerability score: {v_score:.2f}",
                    "Need for localized hazard mitigation",
                ]
            elif (
                cc_level in ["CRITICAL_CAPACITY", "LOW_CAPACITY"]
                or (hosp_s is not None and hosp_s < 40.0)
                or (hous_s is not None and hous_s < 40.0)
            ):
                primary_intervention = "CAPACITY_BUILDING_REQUIRED"
                reasoning = [
                    f"District carrying capacity level is {cc_level} (score: {cc_score:.2f}).",
                    "Deficits detected in healthcare or housing infrastructure.",
                    "Priority focus on capacity building and healthcare/housing strengthening.",
                ]
                factors = [
                    f"Carrying capacity score: {cc_score:.2f} ({cc_level})",
                    "Healthcare infrastructure deficits" if (hosp_s is not None and hosp_s < 40.0) else "Housing infrastructure deficits",
                ]
            elif v_level in ["CRITICAL_VULNERABILITY", "HIGH_VULNERABILITY"]:
                primary_intervention = "VULNERABILITY_REDUCTION"
                reasoning = [
                    f"District vulnerability level is {v_level} (score: {v_score:.2f}).",
                    "Structural and demographic vulnerability reduction programs required.",
                ]
                factors = [
                    f"Vulnerability level: {v_level}",
                    f"Vulnerability score: {v_score:.2f}",
                ]
            elif p_level == "MODERATE_PRIORITY" or h_risk == "MODERATE" or v_level == "MODERATE_VULNERABILITY":
                primary_intervention = "MONITOR_AND_PREPARE"
                reasoning = [
                    "Moderate hazard and vulnerability conditions identified.",
                    "Continuous hazard monitoring and district preparedness updates recommended.",
                ]
                factors = [
                    f"Hazard risk level: {h_risk}",
                    f"Priority level: {p_level}",
                ]
            else:
                primary_intervention = "ROUTINE_RESILIENCE_PLANNING"
                reasoning = [
                    "Low overall hazard risk and vulnerability levels.",
                    "Routine disaster resilience planning and periodic monitoring recommended.",
                ]
                factors = [
                    f"Low hazard risk score ({h_score:.2f})",
                    f"Low priority index ({p_index:.2f})",
                ]

            category_counts[primary_intervention] = category_counts.get(primary_intervention, 0) + 1

            # 2. Priority Level Mapping
            intervention_priority_level = self.PRIORITY_LEVEL_MAPPING.get(p_level, "LOW_INTERVENTION")
            priority_counts[intervention_priority_level] = priority_counts.get(intervention_priority_level, 0) + 1

            # 3. Recommended Actions
            rec_actions = self.RECOMMENDED_ACTIONS_MAP[primary_intervention]

            # 4. Data Completeness & Decision Confidence
            v_comp = float(v.get("vulnerability_data_completeness_score", 1.0))
            decision_data_completeness_score = round((h_comp + cc_comp + v_comp) / 3.0, 2)

            if h_conf == "HIGH" and cc_conf in ["HIGH", "MEDIUM"] and v_conf == "HIGH":
                decision_confidence = "HIGH"
            elif h_conf == "LOW" or cc_conf == "LOW" or not has_spatial:
                decision_confidence = "LOW"
            else:
                decision_confidence = "MEDIUM"

            district_results.append({
                "district_id": did,
                "state": str(v["state"]),
                "district": str(v["district"]),
                "analytical_level": "district",
                "overall_hazard_score": h_score,
                "risk_level": h_risk,
                "overall_carrying_capacity_score": cc_score,
                "carrying_capacity_level": cc_level,
                "overall_vulnerability_score": v_score,
                "vulnerability_level": v_level,
                "priority_index": p_index,
                "priority_level": p_level,
                "priority_rank": p_rank,
                "primary_intervention": primary_intervention,
                "intervention_priority_level": intervention_priority_level,
                "intervention_reasoning": reasoning,
                "contributing_factors": factors,
                "recommended_actions": rec_actions,
                "relocation_considered": rel_considered,
                "relocation_status": rel_status,
                "decision_data_completeness_score": decision_data_completeness_score,
                "decision_confidence": decision_confidence,
                "latitude": float(lat) if (lat is not None and not pd.isna(lat)) else None,
                "longitude": float(lon) if (lon is not None and not pd.isna(lon)) else None,
                "spatial_analysis_available": has_spatial,
                "disclaimer": DECISION_SUPPORT_DISCLAIMER,
            })

        priority_order = {"CRITICAL_INTERVENTION": 0, "HIGH_INTERVENTION": 1, "MODERATE_INTERVENTION": 2, "LOW_INTERVENTION": 3}
        priority_sorted_districts = sorted(
            district_results,
            key=lambda x: (
                priority_order.get(x["intervention_priority_level"], 4),
                -x["priority_index"],
                x["priority_rank"] if x["priority_rank"] is not None else 9999
            )
        )

        summary = {
            "total_districts_analyzed": len(district_results),
            "intervention_category_distribution": category_counts,
            "intervention_priority_distribution": priority_counts,
            "disclaimer": DECISION_SUPPORT_DISCLAIMER,
        }

        self._cached_results = {
            "total_count": len(district_results),
            "results": district_results,
            "priorities": priority_sorted_districts,
            "summary": summary,
            "disclaimer": DECISION_SUPPORT_DISCLAIMER,
        }
        return self._cached_results

    def get_decision_for_district(self, district_id: str) -> Optional[Dict[str, Any]]:
        all_data = self.analyze_all_districts()
        for d in all_data["results"]:
            if d["district_id"] == district_id:
                return d
        return None


# Global singleton instance
decision_support_engine = DecisionSupportEngine()
