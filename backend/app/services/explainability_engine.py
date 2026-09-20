import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional, Union

from app.services.hazard_engine import hazard_engine, HazardEngine
from app.services.carrying_capacity_engine import carrying_capacity_engine, CarryingCapacityEngine
from app.services.vulnerability_engine import vulnerability_engine, VulnerabilityEngine
from app.services.relocation_engine import relocation_engine, RelocationEngine
from app.services.decision_support_engine import decision_support_engine, DecisionSupportEngine
from app.schemas.explainability import (
    HazardSummary,
    CarryingCapacitySummary,
    VulnerabilitySummary,
    CandidateDestinationSummary,
    RelocationSummary,
    InterventionSummary,
    TopContributingFactors,
    ScoreContributionItem,
    ComponentContributionSection,
    ScoreContributions,
    DataCompletenessSummary,
    ConfidenceSummary,
    SpatialDataStatus,
    DecisionTraceStep,
    DistrictExplainabilityResponse,
    ExplainabilitySummary,
    PHASE_8_DISCLAIMER,
)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MASTER_DATASET_PATH = BASE_DIR / "datasets" / "master" / "master_habitations.csv"


class ExplainabilityEngine:
    """
    Decision Explainability, Audit & Transparency Engine for HazardShield AI (Phase 8).
    Provides a clear, deterministic, and traceable explanation of how existing
    Phase 3 (Hazard Risk), Phase 4 (Carrying Capacity), Phase 5 (Vulnerability Index),
    Phase 6 (Safe Relocation), and Phase 7 (Intervention Decision Support) analytical
    outputs contributed to the final analytical recommendation for each district.
    
    CRITICAL:
    - READ-ONLY with respect to Phases 3-7 calculations.
    - Does not alter scores, classifications, or mathematical weights.
    - Reports exact score contributions only where dynamically redistributed weights are exposed.
    - Front-end untouched; operates strictly at the district analytical level.
    """

    RELOCATION_STATUS_EXPLANATIONS = {
        "RECOMMENDATIONS_AVAILABLE": (
            "Eligible destination districts satisfying the analytical relocation constraints "
            "were identified within the same state."
        ),
        "CROSS_STATE_RECOMMENDATION": (
            "No eligible same-state destination was identified under the current analytical "
            "constraints; eligible cross-state candidates were identified."
        ),
        "NO_VALID_RECOMMENDATION": (
            "No destination district satisfied all current analytical eligibility constraints."
        ),
        "INSUFFICIENT_SPATIAL_DATA": (
            "Relocation distance analysis could not be completed because required source "
            "geographic coordinates are unavailable."
        ),
        "NOT_APPLICABLE": (
            "Relocation analysis was not triggered as the district priority level does not meet "
            "the CRITICAL_PRIORITY or HIGH_PRIORITY screening threshold."
        ),
    }

    PRIORITY_LEVEL_ORDER = {
        "CRITICAL_PRIORITY": 0,
        "HIGH_PRIORITY": 1,
        "MODERATE_PRIORITY": 2,
        "LOW_PRIORITY": 3,
    }

    def __init__(
        self,
        dataset_path: Optional[Union[str, Path]] = None,
        hz_engine: Optional[HazardEngine] = None,
        cc_engine: Optional[CarryingCapacityEngine] = None,
        v_engine: Optional[VulnerabilityEngine] = None,
        rel_engine: Optional[RelocationEngine] = None,
        ds_engine: Optional[DecisionSupportEngine] = None,
    ):
        self.dataset_path = Path(dataset_path) if dataset_path else MASTER_DATASET_PATH
        self.hazard_engine = hz_engine if hz_engine else hazard_engine
        self.carrying_capacity_engine = cc_engine if cc_engine else carrying_capacity_engine
        self.vulnerability_engine = v_engine if v_engine else vulnerability_engine
        self.relocation_engine = rel_engine if rel_engine else relocation_engine
        self.decision_support_engine = ds_engine if ds_engine else decision_support_engine
        self._cached_results: Optional[Dict[str, Any]] = None

    def analyze_all_districts(self) -> Dict[str, Any]:
        """
        Generates explainability and transparency reports for all 640 districts in India.
        Combines and traces existing outputs from Phases 3, 4, 5, 6, and 7 without modifying them.
        """
        if self._cached_results is not None:
            return self._cached_results

        # 1. Fetch existing outputs from singleton engines
        hz_list = self.hazard_engine.analyze_all_districts()
        cc_list = self.carrying_capacity_engine.analyze_all_districts()
        v_list = self.vulnerability_engine.analyze_all_districts()
        rel_data = self.relocation_engine.analyze_all_relocations()
        ds_data = self.decision_support_engine.analyze_all_districts()

        hz_lookup = {h["district_id"]: h for h in hz_list}
        cc_lookup = {c["district_id"]: c for c in cc_list}
        v_lookup = {v["district_id"]: v for v in v_list}
        rel_lookup = {r["source_district_id"]: r for r in rel_data["results"]}
        ds_lookup = {d["district_id"]: d for d in ds_data["results"]}

        district_explanations: List[DistrictExplainabilityResponse] = []
        status_counts: Dict[str, int] = {"COMPLETE": 0, "PARTIAL": 0, "LIMITED": 0}
        priority_counts: Dict[str, int] = {
            "CRITICAL_PRIORITY": 0,
            "HIGH_PRIORITY": 0,
            "MODERATE_PRIORITY": 0,
            "LOW_PRIORITY": 0,
        }
        relocation_counts: Dict[str, int] = {
            "RECOMMENDATIONS_AVAILABLE": 0,
            "CROSS_STATE_RECOMMENDATION": 0,
            "NO_VALID_RECOMMENDATION": 0,
            "INSUFFICIENT_SPATIAL_DATA": 0,
            "NOT_APPLICABLE": 0,
        }

        for v in v_list:
            did = str(v["district_id"])
            state = str(v.get("state", ""))
            district = str(v.get("district", ""))

            hz = hz_lookup.get(did, {})
            cc = cc_lookup.get(did, {})
            rel = rel_lookup.get(did)
            ds = ds_lookup.get(did, {})

            # --- A. HAZARD SUMMARY (Phase 3) ---
            h_score = float(hz.get("overall_hazard_score", 0.0))
            h_risk = str(hz.get("risk_level", "LOW"))
            h_conf = str(hz.get("analysis_confidence", "MEDIUM"))
            h_comp = float(hz.get("data_completeness_score", 1.0))

            hz_comp_scores: Dict[str, Optional[float]] = {
                "flood_risk": hz.get("flood_risk_score"),
                "landslide_risk": hz.get("landslide_risk_score"),
                "cyclone_risk": hz.get("cyclone_risk_score"),
                "rainfall_risk": hz.get("rainfall_risk_score"),
                "population_exposure": hz.get("population_exposure_score"),
                "housing_vulnerability": hz.get("housing_vulnerability_score"),
                "infrastructure_risk": hz.get("infrastructure_risk_score"),
            }

            # Identify key hazard drivers from actual scores
            hz_drivers: List[str] = []
            valid_hz_comps = [
                (k, v_sc) for k, v_sc in hz_comp_scores.items()
                if v_sc is not None and not pd.isna(v_sc)
            ]
            valid_hz_comps.sort(key=lambda x: x[1], reverse=True)

            for comp_name, sc_val in valid_hz_comps[:2]:
                if sc_val >= 50.0:
                    hz_drivers.append(f"Elevated {comp_name.replace('_', ' ')} score of {sc_val:.2f}/100")
                elif sc_val >= 25.0:
                    hz_drivers.append(f"Moderate {comp_name.replace('_', ' ')} score of {sc_val:.2f}/100")

            if not hz_drivers and valid_hz_comps:
                top_comp, top_val = valid_hz_comps[0]
                hz_drivers.append(f"Low overall hazard indicators (highest: {top_comp.replace('_', ' ')} at {top_val:.2f}/100)")

            hz_clean_scores: Dict[str, float] = {
                k: float(v_sc) for k, v_sc in hz_comp_scores.items()
                if v_sc is not None and not pd.isna(v_sc)
            }

            hazard_summary = HazardSummary(
                overall_hazard_score=h_score,
                risk_level=h_risk,
                key_drivers=hz_drivers,
                component_scores=hz_clean_scores,
            )

            # --- B. CARRYING CAPACITY SUMMARY (Phase 4) ---
            cc_score = float(cc.get("overall_carrying_capacity_score", 0.0))
            cc_level = str(cc.get("carrying_capacity_level", "HIGH_CAPACITY"))
            cc_conf = str(cc.get("assessment_confidence", "MEDIUM"))
            cc_comp = float(cc.get("data_completeness_score", 1.0))
            avail_sectors = list(cc.get("available_sectors", []))
            miss_sectors = list(cc.get("missing_sectors", []))

            cc_sector_scores: Dict[str, Optional[float]] = {
                "population_density": cc.get("population_density_capacity_score"),
                "housing": cc.get("housing_capacity_score"),
                "healthcare": cc.get("healthcare_capacity_score"),
                "education": cc.get("education_capacity_score"),
                "water": cc.get("water_capacity_score"),
                "shelter": cc.get("shelter_capacity_score"),
                "road_evacuation": cc.get("road_evacuation_capacity_score"),
            }

            cc_drivers: List[str] = []
            hosp_s = cc.get("healthcare_capacity_score")
            hous_s = cc.get("housing_capacity_score")
            dens_s = cc.get("population_density_capacity_score")

            if hosp_s is not None and not pd.isna(hosp_s) and hosp_s < 40.0:
                cc_drivers.append(f"Severe healthcare infrastructure deficit (capacity score: {hosp_s:.2f}/100)")
            if hous_s is not None and not pd.isna(hous_s) and hous_s < 40.0:
                cc_drivers.append(f"Housing infrastructure deficit with high dilapidation (capacity score: {hous_s:.2f}/100)")
            if dens_s is not None and not pd.isna(dens_s) and dens_s < 40.0:
                cc_drivers.append(f"High population density restricting local absorption capacity (score: {dens_s:.2f}/100)")
            if not cc_drivers:
                cc_drivers.append(f"Carrying capacity classified as {cc_level} (overall score: {cc_score:.2f}/100)")
            if miss_sectors:
                cc_drivers.append(f"{len(miss_sectors)} of 7 infrastructure sectors lack empirical district datasets")

            cc_clean_scores: Dict[str, float] = {
                k: float(v_sc) for k, v_sc in cc_sector_scores.items()
                if v_sc is not None and not pd.isna(v_sc)
            }

            carrying_capacity_summary = CarryingCapacitySummary(
                overall_carrying_capacity_score=cc_score,
                carrying_capacity_level=cc_level,
                available_sectors=avail_sectors,
                missing_sectors=miss_sectors,
                assessment_confidence=cc_conf,
                sector_scores=cc_clean_scores,
                key_drivers=cc_drivers,
            )

            # --- C. VULNERABILITY SUMMARY (Phase 5) ---
            v_score = float(v.get("overall_vulnerability_score", 0.0))
            v_level = str(v.get("vulnerability_level", "LOW_VULNERABILITY"))
            p_index = float(v.get("priority_index", 0.0))
            p_level = str(v.get("priority_level", "LOW_PRIORITY"))
            p_rank = v.get("priority_rank")
            v_conf = str(v.get("vulnerability_assessment_confidence", "MEDIUM"))
            v_comp_score = float(v.get("vulnerability_data_completeness_score", 1.0))
            avail_v_comp = list(v.get("available_components", []))
            miss_v_comp = list(v.get("missing_components", []))

            v_comp_scores: Dict[str, Optional[float]] = {
                "hazard": v.get("hazard_vulnerability_score"),
                "population_exposure": v.get("population_exposure_vulnerability_score"),
                "housing": v.get("housing_vulnerability_score"),
                "healthcare": v.get("healthcare_vulnerability_score"),
                "carrying_capacity": v.get("carrying_capacity_vulnerability_score"),
            }

            v_drivers: List[str] = []
            valid_v_comps = [
                (k, sc) for k, sc in v_comp_scores.items()
                if sc is not None and not pd.isna(sc)
            ]
            valid_v_comps.sort(key=lambda x: x[1], reverse=True)

            for c_name, c_val in valid_v_comps[:2]:
                if c_val >= 50.0:
                    v_drivers.append(f"Elevated {c_name.replace('_', ' ')} vulnerability score of {c_val:.2f}/100")
            if not v_drivers and valid_v_comps:
                v_drivers.append(f"Vulnerability level classified as {v_level} (overall score: {v_score:.2f}/100)")
            if p_index > v_score:
                v_drivers.append(f"Priority index escalated by +{p_index - v_score:.2f} due to compounding risk urgency additions")

            v_clean_scores: Dict[str, float] = {
                k: float(v_sc) for k, v_sc in v_comp_scores.items()
                if v_sc is not None and not pd.isna(v_sc)
            }

            vulnerability_summary = VulnerabilitySummary(
                overall_vulnerability_score=v_score,
                vulnerability_level=v_level,
                priority_index=p_index,
                priority_level=p_level,
                priority_rank=p_rank,
                available_components=avail_v_comp,
                missing_components=miss_v_comp,
                key_drivers=v_drivers,
                component_scores=v_clean_scores,
            )

            # --- D. RELOCATION SUMMARY (Phase 6) ---
            if rel is not None:
                rel_status = str(rel.get("relocation_assessment_status", "NOT_APPLICABLE"))
                rel_scope = str(rel.get("recommendation_scope", "NO_RECOMMENDATION"))
                no_rec = bool(rel.get("no_recommendation_available", True))
                recs = rel.get("recommendations", [])
                tot_cands = int(rel.get("total_candidates_found", len(recs)))

                top_d = recs[0]["district"] if recs else None
                top_d_st = recs[0]["state"] if recs else None
                top_s_sc = recs[0]["suitability_score"] if recs else None

                cand_summaries = [
                    CandidateDestinationSummary(
                        district_id=r["district_id"],
                        district=r["district"],
                        state=r["state"],
                        distance_km=float(r["distance_km"]),
                        suitability_score=float(r["suitability_score"]),
                    )
                    for r in recs[:3]
                ]
                explanation_text = self.RELOCATION_STATUS_EXPLANATIONS.get(
                    rel_status,
                    rel.get("recommendation_reasoning", "Relocation assessment complete.")
                )
            else:
                rel_status = "NOT_APPLICABLE"
                rel_scope = "NOT_EVALUATED"
                no_rec = True
                tot_cands = 0
                top_d = None
                top_d_st = None
                top_s_sc = None
                cand_summaries = []
                explanation_text = self.RELOCATION_STATUS_EXPLANATIONS["NOT_APPLICABLE"]

            relocation_summary = RelocationSummary(
                relocation_assessment_status=rel_status,
                recommendation_scope=rel_scope,
                no_recommendation_available=no_rec,
                total_candidates_found=tot_cands,
                explanation=explanation_text,
                top_destination=top_d,
                top_destination_state=top_d_st,
                top_suitability_score=top_s_sc,
                candidate_summary=cand_summaries,
            )

            # --- E. INTERVENTION SUMMARY (Phase 7) ---
            primary_intervention = str(ds.get("primary_intervention", "ROUTINE_RESILIENCE_PLANNING"))
            intervention_priority_level = str(ds.get("intervention_priority_level", "LOW_INTERVENTION"))
            reasoning = list(ds.get("intervention_reasoning", []))
            contributing = list(ds.get("contributing_factors", []))
            actions = list(ds.get("recommended_actions", []))
            decision_confidence = str(ds.get("decision_confidence", "MEDIUM"))

            intervention_summary = InterventionSummary(
                primary_intervention=primary_intervention,
                intervention_priority_level=intervention_priority_level,
                intervention_reasoning=reasoning,
                contributing_factors=contributing,
                recommended_actions=actions,
                decision_confidence=decision_confidence,
            )

            # --- F. TOP CONTRIBUTING FACTORS (5 Dimensions) ---
            hazard_factors = [
                f"Analytical contributing factor: Overall hazard score is {h_score:.2f} ({h_risk} risk level)."
            ]
            for d in hz_drivers:
                hazard_factors.append(f"Analytical contributing factor: {d}.")

            capacity_limitations = [
                f"Analytical contributing factor: Carrying capacity level is {cc_level} (score: {cc_score:.2f}/100)."
            ]
            for d in cc_drivers:
                capacity_limitations.append(f"Analytical contributing factor: {d}.")

            vulnerability_factors = [
                f"Analytical contributing factor: Overall vulnerability score is {v_score:.2f} ({v_level}).",
                f"Analytical contributing factor: Priority index of {p_index:.2f} assigned priority classification {p_level}.",
            ]
            for d in v_drivers:
                vulnerability_factors.append(f"Analytical contributing factor: {d}.")

            relocation_factors = [
                f"Analytical contributing factor: Relocation assessment status is {rel_status} (Scope: {rel_scope})."
            ]
            if rel_status in ["RECOMMENDATIONS_AVAILABLE", "CROSS_STATE_RECOMMENDATION"] and top_d:
                relocation_factors.append(
                    f"Analytical contributing factor: Identified {tot_cands} candidate destinations; "
                    f"top candidate is {top_d} ({top_d_st}) with suitability score {top_s_sc:.2f}."
                )
            elif rel_status == "INSUFFICIENT_SPATIAL_DATA":
                relocation_factors.append(
                    "Analytical contributing factor: Source geographic centroid coordinates are unavailable, "
                    "preventing spatial distance modeling."
                )
            elif rel_status == "NO_VALID_RECOMMENDATION":
                relocation_factors.append(
                    "Analytical contributing factor: No destination district met all safety, vulnerability reduction, "
                    "and carrying capacity criteria."
                )

            intervention_decision_factors = [
                f"Analytical contributing factor: Primary intervention strategy assigned: {primary_intervention}.",
                f"Analytical contributing factor: Intervention priority level mapped to {intervention_priority_level}.",
                f"Analytical contributing factor: Decision confidence evaluated as {decision_confidence}.",
            ]

            top_contributing_factors = TopContributingFactors(
                hazard_factors=hazard_factors,
                capacity_limitations=capacity_limitations,
                vulnerability_factors=vulnerability_factors,
                relocation_factors=relocation_factors,
                intervention_decision_factors=intervention_decision_factors,
            )

            # --- G. SCORE CONTRIBUTION TRANSPARENCY ---
            # 1. Vulnerability Contributions
            v_redist_w = v.get("redistributed_weights", {})
            v_items: List[ScoreContributionItem] = []
            for comp_name, w in v_redist_w.items():
                sc_raw = v_comp_scores.get(comp_name)
                w_val = float(w)
                weighted_val = round(sc_raw * w_val, 2) if sc_raw is not None and not pd.isna(sc_raw) else None
                v_items.append(
                    ScoreContributionItem(
                        component=comp_name,
                        score=sc_raw,
                        weight=w_val,
                        weighted_contribution=weighted_val,
                    )
                )

            v_section = ComponentContributionSection(
                contribution_available=True,
                reason="Derived from Phase 5 dynamic redistributed weights and normalized component scores.",
                weights_redistributed=len(miss_v_comp) > 0,
                redistributed_weights_sum=v.get("redistributed_weights_sum"),
                items=v_items,
            )

            # 2. Carrying Capacity Contributions
            cc_redist_w = cc.get("redistributed_weights", {})
            cc_items: List[ScoreContributionItem] = []
            for sec_name, w in cc_redist_w.items():
                sc_raw = cc_sector_scores.get(sec_name)
                w_val = float(w)
                weighted_val = round(sc_raw * w_val, 2) if sc_raw is not None and not pd.isna(sc_raw) else None
                cc_items.append(
                    ScoreContributionItem(
                        component=sec_name,
                        score=sc_raw,
                        weight=w_val,
                        weighted_contribution=weighted_val,
                    )
                )

            cc_section = ComponentContributionSection(
                contribution_available=True,
                reason="Derived from Phase 4 dynamic redistributed weights across available sectors.",
                weights_redistributed=len(miss_sectors) > 0,
                redistributed_weights_sum=cc.get("redistributed_weights_sum"),
                items=cc_items,
            )

            # 3. Hazard Contributions
            # Per critical safety rule: Phase 3 engine output exposes redistributed_weights_sum
            # but does not expose individual component redistributed_weights dictionary.
            # We report contribution_available = false and do NOT fabricate weights post hoc.
            hz_section = ComponentContributionSection(
                contribution_available=False,
                reason=(
                    "Phase 3 Hazard Engine exposes overall redistributed_weights_sum but does not expose an "
                    "individual component redistributed_weights dictionary in its output schema. "
                    "In accordance with Phase 8 transparency and zero-fabrication safety requirements, "
                    "weights are not reconstructed post hoc."
                ),
                weights_redistributed=hz.get("redistributed_weights_sum") is not None,
                redistributed_weights_sum=hz.get("redistributed_weights_sum"),
                items=[],
            )

            score_contributions = ScoreContributions(
                vulnerability_contributions=v_section,
                carrying_capacity_contributions=cc_section,
                hazard_contributions=hz_section,
            )

            # --- H. DATA QUALITY & CONFIDENCE TRANSPARENCY ---
            overall_comp = float(ds.get("decision_data_completeness_score", round((h_comp + cc_comp + v_comp_score) / 3.0, 2)))
            missing_hz = list(hz.get("missing_data", []))

            data_completeness_summary = DataCompletenessSummary(
                overall_completeness_score=overall_comp,
                hazard_completeness_score=h_comp,
                carrying_capacity_completeness_score=cc_comp,
                vulnerability_completeness_score=v_comp_score,
                missing_hazard_data=missing_hz,
                missing_capacity_sectors=miss_sectors,
                missing_vulnerability_components=miss_v_comp,
            )

            confidence_summary = ConfidenceSummary(
                overall_decision_confidence=decision_confidence,
                hazard_confidence=h_conf,
                carrying_capacity_confidence=cc_conf,
                vulnerability_confidence=v_conf,
            )

            lat = v.get("latitude")
            lon = v.get("longitude")
            has_spatial = bool(v.get("spatial_analysis_available", False))
            coords_present = not (pd.isna(lat) or pd.isna(lon) or lat is None or lon is None)

            if coords_present and has_spatial:
                spatial_explanation = f"Centroid coordinates available ({float(lat):.4f}, {float(lon):.4f}); spatial distance calculations fully supported."
            else:
                spatial_explanation = "Centroid coordinates unavailable; relocation distance modeling is constrained (INSUFFICIENT_SPATIAL_DATA)."

            spatial_data_status = SpatialDataStatus(
                spatial_analysis_available=has_spatial,
                latitude=float(lat) if coords_present else None,
                longitude=float(lon) if coords_present else None,
                coordinates_present=coords_present,
                status_explanation=spatial_explanation,
            )

            missing_data_limitations: List[str] = [
                "Carrying capacity assessment is restricted to 3 available sectors; 4 sectors (education, water, shelter, road/evacuation) lack empirical district datasets.",
                "District-level aggregation models administrative units; intra-district micro-topographical hazard variance is not captured.",
                "Prototype analytical layer; does not constitute official evacuation instructions, statutory disaster declaration, or policy mandate.",
            ]
            if not coords_present:
                missing_data_limitations.append(
                    "District lacks geographic coordinates in master registry; spatial proximity modeling is disabled."
                )
            if missing_hz:
                missing_data_limitations.append(
                    f"Hazard assessment missing {len(missing_hz)} empirical observation variables."
                )

            # --- I. CHRONOLOGICAL DECISION TRACE (Steps 1-6) ---
            trace: List[DecisionTraceStep] = [
                DecisionTraceStep(
                    step=1,
                    assessment="Hazard Assessment",
                    result=f"Overall hazard score evaluated at {h_score:.2f} ({h_risk} risk level, {h_conf} confidence).",
                    source_phase="Phase 3",
                ),
                DecisionTraceStep(
                    step=2,
                    assessment="Carrying Capacity Assessment",
                    result=f"Carrying capacity evaluated at {cc_score:.2f} ({cc_level}, {len(avail_sectors)}/7 sectors available).",
                    source_phase="Phase 4",
                ),
                DecisionTraceStep(
                    step=3,
                    assessment="Vulnerability Assessment",
                    result=f"Overall vulnerability evaluated at {v_score:.2f} ({v_level}, {len(avail_v_comp)}/5 components available).",
                    source_phase="Phase 5",
                ),
                DecisionTraceStep(
                    step=4,
                    assessment="Priority Assessment",
                    result=f"Priority index calculated at {p_index:.2f} ({p_level}, National Rank: #{p_rank if p_rank is not None else 'N/A'}).",
                    source_phase="Phase 5",
                ),
                DecisionTraceStep(
                    step=5,
                    assessment="Relocation Assessment",
                    result=(
                        f"Status: {rel_status} (Scope: {rel_scope}, {tot_cands} candidates identified)."
                        if rel_status != "NOT_APPLICABLE"
                        else "Status: NOT_APPLICABLE (District priority does not trigger relocation analysis)."
                    ),
                    source_phase="Phase 6",
                ),
                DecisionTraceStep(
                    step=6,
                    assessment="Intervention Decision",
                    result=f"Primary intervention assigned: {primary_intervention} ({intervention_priority_level}, Confidence: {decision_confidence}).",
                    source_phase="Phase 7",
                ),
            ]

            # --- J. EXPLAINABILITY STATUS ---
            # Rules:
            # - LIMITED: If spatial coordinates are missing or relocation status is INSUFFICIENT_SPATIAL_DATA or decision_confidence is LOW.
            # - COMPLETE: If spatial data is present, decision_confidence is HIGH, and vulnerability completeness is complete (1.0).
            # - PARTIAL: Other cases where major outputs exist but confidence is MEDIUM or some components are missing.
            if not has_spatial or not coords_present or rel_status == "INSUFFICIENT_SPATIAL_DATA" or decision_confidence == "LOW":
                explainability_status = "LIMITED"
            elif decision_confidence == "HIGH" and v_comp_score >= 1.0:
                explainability_status = "COMPLETE"
            else:
                explainability_status = "PARTIAL"

            # Update distribution counters
            status_counts[explainability_status] = status_counts.get(explainability_status, 0) + 1
            priority_counts[p_level] = priority_counts.get(p_level, 0) + 1
            relocation_counts[rel_status] = relocation_counts.get(rel_status, 0) + 1

            # Construct full response object
            district_obj = DistrictExplainabilityResponse(
                district_id=did,
                state=state,
                district=district,
                analytical_level="district",
                hazard_summary=hazard_summary,
                carrying_capacity_summary=carrying_capacity_summary,
                vulnerability_summary=vulnerability_summary,
                relocation_summary=relocation_summary,
                intervention_summary=intervention_summary,
                top_contributing_factors=top_contributing_factors,
                score_contributions=score_contributions,
                data_completeness_summary=data_completeness_summary,
                confidence_summary=confidence_summary,
                missing_data_limitations=missing_data_limitations,
                spatial_data_status=spatial_data_status,
                decision_trace=trace,
                explainability_status=explainability_status,
                disclaimer=PHASE_8_DISCLAIMER,
            )
            district_explanations.append(district_obj)

        # Prioritized ordering (Phase 5 / Phase 7 alignment):
        # 1. CRITICAL_PRIORITY, 2. HIGH_PRIORITY, 3. MODERATE_PRIORITY, 4. LOW_PRIORITY
        # Then priority_index descending
        # Then priority_rank ascending
        prioritized_explanations = sorted(
            district_explanations,
            key=lambda x: (
                self.PRIORITY_LEVEL_ORDER.get(x.vulnerability_summary.priority_level, 4),
                -x.vulnerability_summary.priority_index,
                x.vulnerability_summary.priority_rank if x.vulnerability_summary.priority_rank is not None else 9999,
            ),
        )

        summary = ExplainabilitySummary(
            total_districts_explained=len(district_explanations),
            explainability_status_distribution=status_counts,
            priority_level_distribution=priority_counts,
            relocation_status_distribution=relocation_counts,
            disclaimer=PHASE_8_DISCLAIMER,
        )

        self._cached_results = {
            "total_count": len(district_explanations),
            "results": district_explanations,
            "priorities": prioritized_explanations,
            "summary": summary,
            "disclaimer": PHASE_8_DISCLAIMER,
        }
        return self._cached_results

    def get_district_explanation(self, district_id: str) -> Optional[DistrictExplainabilityResponse]:
        """
        Retrieves complete explainability report for a single specific district by district_id.
        """
        all_data = self.analyze_all_districts()
        target = district_id.strip().upper()
        for d in all_data["results"]:
            if d.district_id.upper() == target:
                return d
        return None

    def filter_explanations(
        self,
        state: Optional[str] = None,
        explainability_status: Optional[str] = None,
        priority_level: Optional[str] = None,
    ) -> List[DistrictExplainabilityResponse]:
        """
        Filters explainability reports by state, status, or priority level.
        """
        all_data = self.analyze_all_districts()
        results = all_data["results"]

        if state:
            st_clean = state.strip().upper()
            results = [r for r in results if r.state.upper() == st_clean]

        if explainability_status:
            stat_clean = explainability_status.strip().upper()
            results = [r for r in results if r.explainability_status.upper() == stat_clean]

        if priority_level:
            prio_clean = priority_level.strip().upper()
            results = [r for r in results if r.vulnerability_summary.priority_level.upper() == prio_clean]

        return results


# Global singleton instance
explainability_engine = ExplainabilityEngine()
