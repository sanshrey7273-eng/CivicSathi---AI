from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_departments():
    response = client.get("/api/departments")
    assert response.status_code == 200
    assert len(response.json()) > 0

def test_classify_heuristic():
    response = client.post("/api/complaints/classify", json={"text": "Road has big potholes"})
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "pothole"
