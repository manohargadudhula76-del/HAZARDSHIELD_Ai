def test_get_all_alerts(client):
    response = client.get("/api/v1/alerts")
    assert response.status_code == 200
    data = response.json()
    assert data["totalCount"] == 5
    assert data["unreadCount"] == 3
    assert len(data["alerts"]) == 5


def test_get_filtered_alerts(client):
    response = client.get("/api/v1/alerts?severity=CRITICAL")
    assert response.status_code == 200
    data = response.json()
    assert data["totalCount"] == 3
    for alert in data["alerts"]:
        assert alert["severity"] == "CRITICAL"
