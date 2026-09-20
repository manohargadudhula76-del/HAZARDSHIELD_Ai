from typing import List, Optional
from app.db.mock_data import MOCK_DASHBOARD_DATA, MOCK_ALERTS_DATA
from app.schemas.dashboard import DashboardSummaryResponse
from app.schemas.alert import AlertResponse, AlertListResponse


class DashboardService:
    @staticmethod
    def get_dashboard_summary() -> DashboardSummaryResponse:
        """
        Retrieves executive dashboard summary data.
        """
        return DashboardSummaryResponse(**MOCK_DASHBOARD_DATA)

    @staticmethod
    def get_alerts(severity: Optional[str] = None) -> AlertListResponse:
        """
        Retrieves active emergency alerts, optionally filtered by severity.
        """
        alerts_data = MOCK_ALERTS_DATA
        if severity and severity.upper() != "ALL":
            alerts_data = [
                a for a in MOCK_ALERTS_DATA
                if a["severity"].upper() == severity.upper() or a["riskLevel"].upper() == severity.upper()
            ]

        alert_models = [AlertResponse(**a) for a in alerts_data]
        unread_count = sum(1 for a in alert_models if not a.isRead)

        return AlertListResponse(
            totalCount=len(alert_models),
            unreadCount=unread_count,
            alerts=alert_models,
        )


dashboard_service = DashboardService()
