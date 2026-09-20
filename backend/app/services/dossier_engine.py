from typing import Dict, Any, List, Optional, Union
from pathlib import Path
import pandas as pd
import numpy as np

from app.services.hazard_engine import hazard_engine, HazardEngine
from app.services.carrying_capacity_engine import carrying_capacity_engine, CarryingCapacityEngine
from app.services.vulnerability_engine import vulnerability_engine, VulnerabilityEngine
from app.services.relocation_engine import relocation_engine, RelocationEngine
from app.services.decision_support_engine import decision_support_engine, DecisionSupportEngine
from app.services.explainability_engine import explainability_engine, ExplainabilityEngine
from app.services.system_integration_engine import system_integration_engine, SystemIntegrationEngine

from app.schemas.dossier import (
    DistrictIdentitySection,
    DossierHazardSection,
    DossierCapacitySection,
    DossierVulnerabilitySection,
    DossierCandidateDestination,
    DossierRelocationSection,
    DossierDecisionSection,
    DossierExplainabilitySection,
    DistrictDossierResponse,
    TopPriorityDistrictSummary,
    SystemHealthReadinessSummary,
    NationalBriefingResponse,
    StateBriefingResponse,
    PHASE_10_DISCLAIMER,
)


class DossierEngine:
    """
    Phase 10: Unified District Dossier & Executive Briefing Engine.
    Aggregates verified, existing outputs across Phases 3 through 9 into unified,
    strongly-typed executive profiles and briefings.

    CRITICAL RULES:
    - READ-ONLY with respect to Phases 1-9 calculations.
    - Does NOT recalculate, modify, or override any underlying analytical metrics.
    - Preserves deterministic rankings, scores, and intervention decisions.
    """

    def __init__(
        self,
        hz_engine: Optional[HazardEngine] = None,
        cc_engine: Optional[CarryingCapacityEngine] = None,
        v_engine: Optional[VulnerabilityEngine] = None,
        rel_engine: Optional[RelocationEngine] = None,
        ds_engine: Optional[DecisionSupportEngine] = None,
        exp_engine: Optional[ExplainabilityEngine] = None,
        sys_engine: Optional[SystemIntegrationEngine] = None,
    ):
        self.hazard_engine = hz_engine if hz_engine else hazard_engine
        self.carrying_capacity_engine = cc_engine if cc_engine else carrying_capacity_engine
        self.vulnerability_engine = v_engine if v_engine else vulnerability_engine
        self.relocation_engine = rel_engine if rel_engine else relocation_engine
        self.decision_support_engine = ds_engine if ds_engine else decision_support_engine
        self.explainability_engine = exp_engine if exp_engine else explainability_engine
        self.system_integration_engine = sys_engine if sys_engine else system_integration_engine

        self._cached_dossiers: Optional[Dict[str, DistrictDossierResponse]] = None
        self._cached_national_briefing: Optional[NationalBriefingResponse] = None
        self._cached_state_briefings: Optional[Dict[str, StateBriefingResponse]] = None

    def _build_cache_if_needed(self) -> None:
        """Loads and builds dossiers and executive briefings from Phase 3-9 engines in read-only mode."""
        if self._cached_dossiers is not None:
            return

        # 1. Fetch pre-calculated outputs from existing engines
        hz_list = self.hazard_engine.analyze_all_districts()
        cc_list = self.carrying_capacity_engine.analyze_all_districts()
        v_list = self.vulnerability_engine.analyze_all_districts()
        rel_data = self.relocation_engine.analyze_all_relocations()
        ds_data = self.decision_support_engine.analyze_all_districts()
        exp_data = self.explainability_engine.analyze_all_districts()

        hz_lookup = {h["district_id"]: h for h in hz_list}
        cc_lookup = {c["district_id"]: c for c in cc_list}
        v_lookup = {v["district_id"]: v for v in v_list}
        rel_lookup = {r["source_district_id"]: r for r in rel_data["results"]}
        ds_lookup = {d["district_id"]: d for d in ds_data["results"]}
        exp_lookup = {e.district_id: e for e in exp_data["results"]}

        dossiers: Dict[str, DistrictDossierResponse] = {}
        state_districts_map: Dict[str, List[DistrictDossierResponse]] = {}

        # Tracking distributions for national briefing
        hazard_risk_dist: Dict[str, int] = {}
        vulnerability_dist: Dict[str, int] = {}
        priority_dist: Dict[str, int] = {}
        intervention_dist: Dict[str, int] = {}
        relocation_cat_dist: Dict[str, int] = {}

        for v_item in v_list:
            did = str(v_item["district_id"])
            st_name = str(v_item.get("state", "")).strip()
            dt_name = str(v_item.get("district", "")).strip()

            hz_item = hz_lookup.get(did, {})
            cc_item = cc_lookup.get(did, {})
            rel_item = rel_lookup.get(did)
            ds_item = ds_lookup.get(did, {})
            exp_item = exp_lookup.get(did)

            # 1. Identity Section
            lat = v_item.get("latitude")
            lon = v_item.get("longitude")
            has_spatial = bool(v_item.get("spatial_analysis_available", False))
            coords_present = not (lat is None or lon is None or pd.isna(lat) or pd.isna(lon))

            identity = DistrictIdentitySection(
                district_id=did,
                state=st_name,
                district=dt_name,
                analytical_level=str(v_item.get("analytical_level", "district")),
                latitude=float(lat) if coords_present else None,
                longitude=float(lon) if coords_present else None,
                spatial_analysis_available=has_spatial and coords_present,
            )

            # 2. Hazard Section
            def _clean_float(val: Any) -> Optional[float]:
                if val is None or pd.isna(val):
                    return None
                return float(val)

            h_score = float(hz_item.get("overall_hazard_score", 0.0))
            h_risk = str(hz_item.get("risk_level", "LOW"))
            hz_drivers = list(exp_item.hazard_summary.key_drivers) if exp_item else []

            hazard = DossierHazardSection(
                overall_hazard_score=h_score,
                risk_level=h_risk,
                flood_risk_score=_clean_float(hz_item.get("flood_risk_score")),
                landslide_risk_score=_clean_float(hz_item.get("landslide_risk_score")),
                cyclone_risk_score=_clean_float(hz_item.get("cyclone_risk_score")),
                rainfall_risk_score=_clean_float(hz_item.get("rainfall_risk_score")),
                population_exposure_score=_clean_float(hz_item.get("population_exposure_score")),
                housing_vulnerability_score=_clean_float(hz_item.get("housing_vulnerability_score")),
                infrastructure_risk_score=_clean_float(hz_item.get("infrastructure_risk_score")),
                analysis_confidence=str(hz_item.get("analysis_confidence", "MEDIUM")),
                key_hazard_drivers=hz_drivers,
            )

            # 3. Carrying Capacity Section
            cc_score = float(cc_item.get("overall_carrying_capacity_score", 0.0))
            cc_level = str(cc_item.get("carrying_capacity_level", "HIGH_CAPACITY"))
            cc_drivers = list(exp_item.carrying_capacity_summary.key_drivers) if exp_item else []
            cc_sector_scores = dict(exp_item.carrying_capacity_summary.sector_scores) if exp_item else {}

            carrying_capacity = DossierCapacitySection(
                overall_carrying_capacity_score=cc_score,
                carrying_capacity_level=cc_level,
                available_sectors=list(cc_item.get("available_sectors", [])),
                missing_sectors=list(cc_item.get("missing_sectors", [])),
                sector_scores=cc_sector_scores,
                assessment_confidence=str(cc_item.get("assessment_confidence", "MEDIUM")),
                capacity_drivers=cc_drivers,
            )

            # 4. Vulnerability Section
            v_score = float(v_item.get("overall_vulnerability_score", 0.0))
            v_level = str(v_item.get("vulnerability_level", "LOW_VULNERABILITY"))
            p_index = float(v_item.get("priority_index", 0.0))
            p_level = str(v_item.get("priority_level", "LOW_PRIORITY"))
            p_rank = int(v_item["priority_rank"]) if (v_item.get("priority_rank") is not None and not pd.isna(v_item["priority_rank"])) else None
            v_drivers = list(exp_item.vulnerability_summary.key_drivers) if exp_item else []
            v_comp_scores = dict(exp_item.vulnerability_summary.component_scores) if exp_item else {}

            vulnerability = DossierVulnerabilitySection(
                overall_vulnerability_score=v_score,
                vulnerability_level=v_level,
                priority_index=p_index,
                priority_level=p_level,
                priority_rank=p_rank,
                available_components=list(v_item.get("available_components", [])),
                missing_components=list(v_item.get("missing_components", [])),
                component_scores=v_comp_scores,
                vulnerability_drivers=v_drivers,
            )

            # 5. Relocation Section
            if rel_item is not None:
                rel_status = str(rel_item.get("relocation_assessment_status", "NOT_APPLICABLE"))
                rel_scope = str(rel_item.get("recommendation_scope", "NO_RECOMMENDATION"))
                no_rec = bool(rel_item.get("no_recommendation_available", True))
                recs = rel_item.get("recommendations", [])
                tot_cands = int(rel_item.get("total_candidates_found", len(recs)))

                top_d = recs[0]["district"] if recs else None
                top_d_st = recs[0]["state"] if recs else None
                top_s_sc = float(recs[0]["suitability_score"]) if recs else None

                cand_list = [
                    DossierCandidateDestination(
                        district_id=str(r["district_id"]),
                        district=str(r["district"]),
                        state=str(r["state"]),
                        distance_km=float(r["distance_km"]),
                        suitability_score=float(r["suitability_score"]),
                    )
                    for r in recs[:5]
                ]

                if rel_status == "INSUFFICIENT_SPATIAL_DATA":
                    rel_explanation = (
                        "Relocation distance modeling could not be evaluated due to missing centroid "
                        "geographic coordinates (INSUFFICIENT_SPATIAL_DATA)."
                    )
                else:
                    rel_explanation = str(rel_item.get("recommendation_reasoning", "Relocation assessment complete."))
            else:
                rel_status = "NOT_APPLICABLE"
                rel_scope = "NOT_EVALUATED"
                no_rec = True
                tot_cands = 0
                top_d = None
                top_d_st = None
                top_s_sc = None
                cand_list = []
                rel_explanation = (
                    "Relocation screening was not initiated as priority status does not trigger "
                    "relocation thresholds (screening restricted to CRITICAL_PRIORITY and HIGH_PRIORITY)."
                )

            relocation = DossierRelocationSection(
                relocation_assessment_status=rel_status,
                recommendation_scope=rel_scope,
                no_recommendation_available=no_rec,
                total_candidates_found=tot_cands,
                explanation=rel_explanation,
                top_destination=top_d,
                top_destination_state=top_d_st,
                top_suitability_score=top_s_sc,
                candidate_destinations=cand_list,
            )

            # 6. Decision Support Section
            primary_intervention = str(ds_item.get("primary_intervention", "ROUTINE_RESILIENCE_PLANNING"))
            intervention_priority_level = str(ds_item.get("intervention_priority_level", "LOW_INTERVENTION"))
            actions = list(ds_item.get("recommended_actions", []))
            contributing = list(ds_item.get("contributing_factors", []))
            reasoning = list(ds_item.get("intervention_reasoning", []))

            decision_support = DossierDecisionSection(
                primary_intervention=primary_intervention,
                intervention_priority_level=intervention_priority_level,
                recommended_actions=actions,
                contributing_factors=contributing,
                intervention_reasoning=reasoning,
            )

            # 7. Explainability Section
            if exp_item:
                completeness_sc = float(exp_item.data_completeness_summary.overall_completeness_score)
                dec_conf = str(exp_item.confidence_summary.overall_decision_confidence)
                audit_stat = str(exp_item.explainability_status)
                reasoning_trace = [f"{t.assessment}: {t.result}" for t in exp_item.decision_trace]
            else:
                completeness_sc = float(ds_item.get("decision_data_completeness_score", 1.0))
                dec_conf = str(ds_item.get("decision_confidence", "MEDIUM"))
                audit_stat = "COMPLETE"
                reasoning_trace = reasoning

            explainability = DossierExplainabilitySection(
                decision_data_completeness_score=completeness_sc,
                decision_confidence=dec_conf,
                explainability_audit_status=audit_stat,
                concise_reasoning_summary=reasoning_trace,
            )

            # Assembled Dossier
            dossier = DistrictDossierResponse(
                identity=identity,
                hazard=hazard,
                carrying_capacity=carrying_capacity,
                vulnerability=vulnerability,
                relocation=relocation,
                decision_support=decision_support,
                explainability=explainability,
                disclaimer=PHASE_10_DISCLAIMER,
            )

            dossiers[did] = dossier

            # Group by state
            st_key = st_name.upper()
            if st_key not in state_districts_map:
                state_districts_map[st_key] = []
            state_districts_map[st_key].append(dossier)

            # National distribution tracking
            hazard_risk_dist[h_risk] = hazard_risk_dist.get(h_risk, 0) + 1
            vulnerability_dist[v_level] = vulnerability_dist.get(v_level, 0) + 1
            priority_dist[p_level] = priority_dist.get(p_level, 0) + 1
            intervention_dist[primary_intervention] = intervention_dist.get(primary_intervention, 0) + 1
            relocation_cat_dist[rel_status] = relocation_cat_dist.get(rel_status, 0) + 1

        self._cached_dossiers = dossiers

        # Build National Briefing
        sys_report = self.system_integration_engine.evaluate_system()
        sys_summary = sys_report["summary"]
        sys_readiness = sys_report["readiness"]
        diagnostics = sys_report.get("diagnostics", [])

        diag_notes = [d.message for d in diagnostics[:5]]

        system_health = SystemHealthReadinessSummary(
            overall_system_status=sys_summary.overall_system_status,
            prototype_readiness_level=sys_readiness.readiness_level,
            prototype_readiness_score=sys_readiness.score,
            healthy_components=sys_summary.healthy_components,
            total_components=sys_summary.total_components_checked,
            diagnostics_summary=diag_notes,
        )

        # Top 10 priority districts nationally
        sorted_dossiers = sorted(
            dossiers.values(),
            key=lambda d: (
                d.vulnerability.priority_rank if d.vulnerability.priority_rank is not None else 9999,
                -d.vulnerability.priority_index,
            )
        )

        top_national_districts = [
            TopPriorityDistrictSummary(
                district_id=d.identity.district_id,
                district=d.identity.district,
                state=d.identity.state,
                priority_index=d.vulnerability.priority_index,
                priority_level=d.vulnerability.priority_level,
                priority_rank=d.vulnerability.priority_rank,
                overall_hazard_score=d.hazard.overall_hazard_score,
                overall_vulnerability_score=d.vulnerability.overall_vulnerability_score,
                primary_intervention=d.decision_support.primary_intervention,
                intervention_priority_level=d.decision_support.intervention_priority_level,
            )
            for d in sorted_dossiers[:10]
        ]

        self._cached_national_briefing = NationalBriefingResponse(
            total_districts_analyzed=len(dossiers),
            hazard_risk_distribution=hazard_risk_dist,
            vulnerability_distribution=vulnerability_dist,
            priority_distribution=priority_dist,
            intervention_distribution=intervention_dist,
            critical_priority_districts_count=priority_dist.get("CRITICAL_PRIORITY", 0),
            high_priority_districts_count=priority_dist.get("HIGH_PRIORITY", 0),
            relocation_category_distribution=relocation_cat_dist,
            system_health=system_health,
            top_intervention_priority_districts=top_national_districts,
            disclaimer=PHASE_10_DISCLAIMER,
        )

        # Build State Briefings
        state_briefings: Dict[str, StateBriefingResponse] = {}
        for st_key, st_dossiers in state_districts_map.items():
            canonical_state_name = st_dossiers[0].identity.state

            st_hz_dist: Dict[str, int] = {}
            st_vuln_dist: Dict[str, int] = {}
            st_prio_dist: Dict[str, int] = {}
            st_interv_dist: Dict[str, int] = {}
            st_rel_dist: Dict[str, int] = {}

            for sd in st_dossiers:
                hr = sd.hazard.risk_level
                vl = sd.vulnerability.vulnerability_level
                pl = sd.vulnerability.priority_level
                pi = sd.decision_support.primary_intervention
                rs = sd.relocation.relocation_assessment_status

                st_hz_dist[hr] = st_hz_dist.get(hr, 0) + 1
                st_vuln_dist[vl] = st_vuln_dist.get(vl, 0) + 1
                st_prio_dist[pl] = st_prio_dist.get(pl, 0) + 1
                st_interv_dist[pi] = st_interv_dist.get(pi, 0) + 1
                st_rel_dist[rs] = st_rel_dist.get(rs, 0) + 1

            sorted_st_dossiers = sorted(
                st_dossiers,
                key=lambda d: (
                    d.vulnerability.priority_rank if d.vulnerability.priority_rank is not None else 9999,
                    -d.vulnerability.priority_index,
                )
            )

            top_st_districts = [
                TopPriorityDistrictSummary(
                    district_id=d.identity.district_id,
                    district=d.identity.district,
                    state=d.identity.state,
                    priority_index=d.vulnerability.priority_index,
                    priority_level=d.vulnerability.priority_level,
                    priority_rank=d.vulnerability.priority_rank,
                    overall_hazard_score=d.hazard.overall_hazard_score,
                    overall_vulnerability_score=d.vulnerability.overall_vulnerability_score,
                    primary_intervention=d.decision_support.primary_intervention,
                    intervention_priority_level=d.decision_support.intervention_priority_level,
                )
                for d in sorted_st_dossiers[:10]
            ]

            state_briefings[st_key] = StateBriefingResponse(
                state=canonical_state_name,
                total_districts=len(st_dossiers),
                hazard_distribution=st_hz_dist,
                vulnerability_distribution=st_vuln_dist,
                priority_distribution=st_prio_dist,
                intervention_distribution=st_interv_dist,
                critical_priority_count=st_prio_dist.get("CRITICAL_PRIORITY", 0),
                high_priority_count=st_prio_dist.get("HIGH_PRIORITY", 0),
                relocation_category_summary=st_rel_dist,
                top_priority_districts=top_st_districts,
                disclaimer=PHASE_10_DISCLAIMER,
            )

        self._cached_state_briefings = state_briefings

    def get_district_dossier(self, district_id: str) -> Optional[DistrictDossierResponse]:
        """Retrieves a unified district dossier by district ID."""
        self._build_cache_if_needed()
        assert self._cached_dossiers is not None
        return self._cached_dossiers.get(district_id.strip())

    def get_national_briefing(self) -> NationalBriefingResponse:
        """Retrieves the national executive briefing."""
        self._build_cache_if_needed()
        assert self._cached_national_briefing is not None
        return self._cached_national_briefing

    def get_state_briefing(self, state_name: str) -> Optional[StateBriefingResponse]:
        """Retrieves a state executive briefing with case-insensitive matching."""
        self._build_cache_if_needed()
        assert self._cached_state_briefings is not None
        clean_state = state_name.strip().upper()
        return self._cached_state_briefings.get(clean_state)

    def get_all_dossiers(self) -> Dict[str, DistrictDossierResponse]:
        """Returns all cached dossiers."""
        self._build_cache_if_needed()
        assert self._cached_dossiers is not None
        return self._cached_dossiers


# Singleton instance
dossier_engine = DossierEngine()
