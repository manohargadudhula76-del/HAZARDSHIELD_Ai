def test_dashboard_summary(client):
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "topMetrics" in data
    assert data["topMetrics"]["criticalRedZones"] == 24
    assert data["topMetrics"]["populationAtRisk"] == 18450
    assert len(data["riskDistribution"]) > 0
    assert len(data["districtVulnerability"]) > 0
    assert len(data["hazardDistribution"]) > 0
    assert len(data["capacityStatus"]) > 0
    assert len(data["relocationPriority"]) > 0
    assert "EXECUTIVE AI DISASTER INTELLIGENCE BRIEFING" in data["aiExecutiveSummary"]
