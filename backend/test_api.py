from fastapi.testclient import TestClient
import sys
import os

# Add backend directory to sys path so app modules can be imported
sys.path.insert(0, os.path.abspath("."))
from app.main import app

client = TestClient(app)

print("Starting test...")
response = client.post(
    "/api/process-cycle",
    json={
        "user_id": "test_auto_user_1",
        "location": {"lat": 12.9716, "lng": 77.5946, "city": "Bangalore"},
        "weather_data": {
            "aqi": 450,
            "rain": 70,
            "temp": 45,
            "time_of_day": 14
        },
        "recent_pings": 25,
        "orders_completed": 8,
        "base_income": 300.0,
        "disruption_hours": 3.0
    }
)
print("Response Status Code:", response.status_code)
import json
print(json.dumps(response.json(), indent=2))
