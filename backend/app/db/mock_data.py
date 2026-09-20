"""
SIH Baseline Mock Datasets for Phase 1 Prototype
"""

MOCK_DASHBOARD_DATA = {
    "topMetrics": {
        "criticalRedZones": 24,
        "populationAtRisk": 18450,
        "capacityExceeded": 12,
        "immediateRelocation": 6780,
    },
    "riskDistribution": [
        {"name": "Critical Red Zone", "count": 24, "color": "#EF4444"},
        {"name": "High Risk", "count": 42, "color": "#F97316"},
        {"name": "Moderate Risk", "count": 68, "color": "#F59E0B"},
        {"name": "Safe / Low Risk", "count": 115, "color": "#10B981"},
    ],
    "districtVulnerability": [
        {"district": "Darrang", "state": "Assam", "populationAtRisk": 4850, "criticalZonesCount": 4},
        {"district": "South 24 Parganas", "state": "West Bengal", "populationAtRisk": 4120, "criticalZonesCount": 5},
        {"district": "Rudraprayag", "state": "Uttarakhand", "populationAtRisk": 2980, "criticalZonesCount": 3},
        {"district": "Krishna", "state": "Andhra Pradesh", "populationAtRisk": 2600, "criticalZonesCount": 2},
        {"district": "Idukki", "state": "Kerala", "populationAtRisk": 2100, "criticalZonesCount": 3},
        {"district": "Ganjam", "state": "Odisha", "populationAtRisk": 1800, "criticalZonesCount": 2},
        {"district": "Kinnaur", "state": "Himachal Pradesh", "populationAtRisk": 0, "criticalZonesCount": 0},
    ],
    "hazardDistribution": [
        {"hazardType": "Flood", "count": 52, "percentage": 38.0},
        {"hazardType": "Landslide", "count": 34, "percentage": 25.0},
        {"hazardType": "Cyclone", "count": 26, "percentage": 19.0},
        {"hazardType": "Coastal Erosion", "count": 15, "percentage": 11.0},
        {"hazardType": "Earthquake", "count": 10, "percentage": 7.0},
    ],
    "capacityStatus": [
        {"status": "Exceeded (>100%)", "count": 12, "percentage": 40.0, "color": "#EF4444"},
        {"status": "Near Limit (85-100%)", "count": 11, "percentage": 37.0, "color": "#F59E0B"},
        {"status": "Safe (<85%)", "count": 7, "percentage": 23.0, "color": "#10B981"},
    ],
    "relocationPriority": [
        {"level": "Immediate (Critical)", "peopleCount": 6780, "habitationsCount": 3, "color": "#EF4444"},
        {"level": "High Priority", "peopleCount": 4200, "habitationsCount": 5, "color": "#F97316"},
        {"level": "Moderate Priority", "peopleCount": 2100, "habitationsCount": 6, "color": "#F59E0B"},
    ],
    "aiExecutiveSummary": """EXECUTIVE AI DISASTER INTELLIGENCE BRIEFING (NATIONAL SYNTHESIS)

1. RISK CLUSTER PATTERNS:
- Critical vulnerability is heavily concentrated along eastern riverine floodplains (Assam Brahmaputra basin, West Bengal Sunderbans estuarine delta) and northern active geological thrust zones (Uttarakhand Rudraprayag).

2. CARRYING CAPACITY STRESS:
- 12 habitations are operating significantly beyond safe resource limits (>100% carrying capacity). Emergency medical services and flood shelters in these habitations present severe bottleneck vulnerabilities.

3. IMMEDIATE ACTION REQUIRED:
- Priority 1 immediate relocation is recommended for 6,780 individuals across Rampur Village (Assam), Devipur (Uttarakhand), and Sunderbans Outpost (West Bengal).""",
}

MOCK_ALERTS_DATA = [
    {
        "id": "alt-101",
        "habitationId": "hab-001",
        "habitationName": "Rampur Village",
        "district": "Darrang",
        "state": "Assam",
        "title": "Critical Flood Threshold Exceeded",
        "severity": "CRITICAL",
        "riskLevel": "CRITICAL",
        "description": "Brahmaputra basin water monitoring stations report water level rise exceeding 2.4m past emergency mark. Immediate inundation expected within 4 hours.",
        "populationAtRisk": 4850,
        "actionRequired": "Immediate Relocation Assessment and Rapid Evacuation Order",
        "timestamp": "2026-09-05T06:55:00Z",
        "timeAgo": "10 minutes ago",
        "isRead": False,
    },
    {
        "id": "alt-102",
        "habitationId": "hab-002",
        "habitationName": "Devipur",
        "district": "Rudraprayag",
        "state": "Uttarakhand",
        "title": "Active Geological Slope Slip Detected",
        "severity": "CRITICAL",
        "riskLevel": "CRITICAL",
        "description": "Borehole tiltmeter sensors registered 14mm slope displacement in North Ridge sector following continuous 180mm rain event.",
        "populationAtRisk": 2980,
        "actionRequired": "Deploy NDRF Relocation Taskforce to Devipur North Zone",
        "timestamp": "2026-09-05T06:30:00Z",
        "timeAgo": "35 minutes ago",
        "isRead": False,
    },
    {
        "id": "alt-103",
        "habitationId": "hab-003",
        "habitationName": "Krishna Nagar",
        "district": "Krishna",
        "state": "Andhra Pradesh",
        "title": "Carrying Capacity Exceeded 120%",
        "severity": "HIGH PRIORITY",
        "riskLevel": "HIGH",
        "description": "Refugee flow and coastal surge risk elevated carrying capacity pressure to 118%. Infrastructure bottleneck observed.",
        "populationAtRisk": 6200,
        "actionRequired": "Infrastructure relief dispatch and secondary safe haven activation",
        "timestamp": "2026-09-05T05:45:00Z",
        "timeAgo": "1 hour ago",
        "isRead": True,
    },
    {
        "id": "alt-104",
        "habitationId": "hab-007",
        "habitationName": "Sunderbans Outpost",
        "district": "South 24 Parganas",
        "state": "West Bengal",
        "title": "High Storm Surge Alert",
        "severity": "CRITICAL",
        "riskLevel": "CRITICAL",
        "description": "Bay of Bengal deep depression intensified into Severe Cyclonic Storm. Coastal embankments breached at 2 points.",
        "populationAtRisk": 4120,
        "actionRequired": "Initiate Waterborne Evacuation to Inland Shelters",
        "timestamp": "2026-09-05T05:00:00Z",
        "timeAgo": "2 hours ago",
        "isRead": False,
    },
    {
        "id": "alt-105",
        "habitationId": "hab-004",
        "habitationName": "Munnar Hills Settlement",
        "district": "Idukki",
        "state": "Kerala",
        "title": "Heavy Rainfall Warning - Landslide Hazard",
        "severity": "HIGH PRIORITY",
        "riskLevel": "HIGH",
        "description": "Cumulative 24hr precipitation reached 210mm. Debris flow warning issued for western slope hamlets.",
        "populationAtRisk": 3420,
        "actionRequired": "Issue Precautionary Shelter Shift Notice for 950 High-Exposure Residents",
        "timestamp": "2026-09-05T03:15:00Z",
        "timeAgo": "4 hours ago",
        "isRead": True,
    },
]
