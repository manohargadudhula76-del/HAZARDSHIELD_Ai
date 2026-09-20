import csv
import io
import datetime
from typing import Dict, Any, List, Optional

from app.services.dossier_engine import dossier_engine, DossierEngine
from app.schemas.dossier import (
    DossierExportDistrictItem,
    DossierExportSummaryResponse,
    GeoJSONPointGeometry,
    GeoJSONDistrictProperties,
    GeoJSONDistrictFeature,
    GeoJSONFeatureCollectionMetadata,
    GeoJSONExportResponse,
    PHASE_10_DISCLAIMER,
)


class ExportEngine:
    """
    Phase 10: Multi-Format Data Export Engine.
    Provides read-only export interfaces for JSON summary, CSV tabular download,
    and valid GeoJSON spatial FeatureCollections.

    CRITICAL RULES:
    - READ-ONLY with respect to Phases 1-9 analytical outputs.
    - Zero fabrication of spatial coordinates.
    - Coordinates in GeoJSON strictly adhere to RFC 7946 standard: [longitude, latitude].
    - Districts lacking GPS coordinates are excluded from GeoJSON and tracked in metadata.
    """

    def __init__(self, d_engine: Optional[DossierEngine] = None):
        self.dossier_engine = d_engine if d_engine else dossier_engine

    def get_export_summary(self) -> DossierExportSummaryResponse:
        """Generates a standardized JSON summary export across all 640 districts."""
        dossiers = self.dossier_engine.get_all_dossiers()
        exported_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Sort predictably by priority rank, then priority index descending
        sorted_dossiers = sorted(
            dossiers.values(),
            key=lambda d: (
                d.vulnerability.priority_rank if d.vulnerability.priority_rank is not None else 9999,
                -d.vulnerability.priority_index,
            )
        )

        items = [
            DossierExportDistrictItem(
                district_id=d.identity.district_id,
                state=d.identity.state,
                district=d.identity.district,
                latitude=d.identity.latitude,
                longitude=d.identity.longitude,
                overall_hazard_score=d.hazard.overall_hazard_score,
                risk_level=d.hazard.risk_level,
                overall_carrying_capacity_score=d.carrying_capacity.overall_carrying_capacity_score,
                overall_vulnerability_score=d.vulnerability.overall_vulnerability_score,
                vulnerability_level=d.vulnerability.vulnerability_level,
                priority_index=d.vulnerability.priority_index,
                priority_level=d.vulnerability.priority_level,
                priority_rank=d.vulnerability.priority_rank,
                primary_intervention=d.decision_support.primary_intervention,
                intervention_priority_level=d.decision_support.intervention_priority_level,
                relocation_assessment_status=d.relocation.relocation_assessment_status,
                spatial_analysis_available=d.identity.spatial_analysis_available,
            )
            for d in sorted_dossiers
        ]

        return DossierExportSummaryResponse(
            total_districts=len(items),
            exported_at=exported_at,
            districts=items,
            disclaimer=PHASE_10_DISCLAIMER,
        )

    def generate_csv_data(self) -> str:
        """
        Generates CSV formatted tabular text containing essential analytical indicators
        across all 640 districts.
        """
        summary = self.get_export_summary()
        output = io.StringIO()
        writer = csv.writer(output, lineterminator="\n")

        headers = [
            "district_id",
            "state",
            "district",
            "latitude",
            "longitude",
            "overall_hazard_score",
            "risk_level",
            "overall_carrying_capacity_score",
            "overall_vulnerability_score",
            "vulnerability_level",
            "priority_index",
            "priority_level",
            "priority_rank",
            "primary_intervention",
            "intervention_priority_level",
            "relocation_assessment_status",
            "spatial_analysis_available",
        ]
        writer.writerow(headers)

        for item in summary.districts:
            writer.writerow([
                item.district_id,
                item.state,
                item.district,
                f"{item.latitude:.6f}" if item.latitude is not None else "",
                f"{item.longitude:.6f}" if item.longitude is not None else "",
                f"{item.overall_hazard_score:.2f}",
                item.risk_level,
                f"{item.overall_carrying_capacity_score:.2f}",
                f"{item.overall_vulnerability_score:.2f}",
                item.vulnerability_level,
                f"{item.priority_index:.2f}",
                item.priority_level,
                item.priority_rank if item.priority_rank is not None else "",
                item.primary_intervention,
                item.intervention_priority_level,
                item.relocation_assessment_status,
                "true" if item.spatial_analysis_available else "false",
            ])

        return output.getvalue()

    def generate_geojson(self) -> GeoJSONExportResponse:
        """
        Generates a valid RFC 7946 GeoJSON FeatureCollection.
        Includes strictly those districts with verified centroid coordinates.
        Excludes districts lacking coordinates without fabrication.
        Coordinates order: [longitude, latitude].
        """
        dossiers = self.dossier_engine.get_all_dossiers()
        exported_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

        features: List[GeoJSONDistrictFeature] = []
        excluded_count = 0

        for d in dossiers.values():
            lat = d.identity.latitude
            lon = d.identity.longitude
            has_spatial = d.identity.spatial_analysis_available

            if has_spatial and lat is not None and lon is not None:
                # GeoJSON standard: [longitude, latitude]
                geom = GeoJSONPointGeometry(
                    type="Point",
                    coordinates=[float(lon), float(lat)],
                )
                props = GeoJSONDistrictProperties(
                    district_id=d.identity.district_id,
                    state=d.identity.state,
                    district=d.identity.district,
                    overall_hazard_score=d.hazard.overall_hazard_score,
                    risk_level=d.hazard.risk_level,
                    overall_carrying_capacity_score=d.carrying_capacity.overall_carrying_capacity_score,
                    overall_vulnerability_score=d.vulnerability.overall_vulnerability_score,
                    vulnerability_level=d.vulnerability.vulnerability_level,
                    priority_index=d.vulnerability.priority_index,
                    priority_level=d.vulnerability.priority_level,
                    primary_intervention=d.decision_support.primary_intervention,
                    intervention_priority_level=d.decision_support.intervention_priority_level,
                )
                features.append(
                    GeoJSONDistrictFeature(
                        type="Feature",
                        geometry=geom,
                        properties=props,
                    )
                )
            else:
                excluded_count += 1

        metadata = GeoJSONFeatureCollectionMetadata(
            total_districts=len(dossiers),
            features_count=len(features),
            excluded_missing_coordinates_count=excluded_count,
            coordinate_reference_system="urn:ogc:def:crs:OGC:1.3:CRS84",
            exported_at=exported_at,
        )

        return GeoJSONExportResponse(
            type="FeatureCollection",
            metadata=metadata,
            features=features,
            disclaimer=PHASE_10_DISCLAIMER,
        )


# Singleton instance
export_engine = ExportEngine()
