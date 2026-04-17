from fastapi.testclient import TestClient
import sys
import os

# Add backend directory to sys path so app modules can be imported
sys.path.insert(0, os.path.abspath("."))
from app.main import app

client = TestClient(app)

# Use a valid user ID from the database if available, otherwise a placeholder UUID
VALID_USER_ID = "ca1c055c-c681-43ee-89d7-ae56283efe22"

def test_process_cycle_success():
    print("\n--- Testing Successful Parametric Cycle ---")
    payload = {
        "user_id": VALID_USER_ID,
        "location": {"lat": 12.9716, "lng": 77.5946, "city": "Bangalore"},
        "weather_data": {
            "aqi": 250,    # Moderate AQI Trigger
            "rain": 30,    # Moderate Rain Trigger
            "temp": 45,    
            "time_of_day": 9 # Peak Hour (8-10)
        },
        "recent_pings": 150, 
        "orders_completed": 20,
        "base_income": 300.0,
        "disruption_hours": 3.0
    }
    response = client.post("/api/process-cycle", json=payload)
    print("Status Code:", response.status_code)
    try:
        data = response.json()
        print("Response Status:", data.get("status"))
        print("Risk Score:", data.get("ai_risk_score"))
        print("Payout ID:", data.get("payout", {}).get("transaction_id") if data.get("payout") else "No Payout")
    except Exception as e:
        print("Error parsing response:", e)
        print("Raw content:", response.content)

def test_process_cycle_no_trigger():
    print("\n--- Testing No Trigger Cycle ---")
    payload = {
        "user_id": VALID_USER_ID,
        "location": {"lat": 12.9716, "lng": 77.5946, "city": "Bangalore"},
        "weather_data": {
            "aqi": 50,    # No trigger
            "rain": 0,    # No trigger
            "temp": 25,   # No trigger
            "time_of_day": 10
        },
        "recent_pings": 150,
        "orders_completed": 20,
        "base_income": 300.0,
        "disruption_hours": 3.0
    }
    response = client.post("/api/process-cycle", json=payload)
    print("Status Code:", response.status_code)
    data = response.json()
    print("Response Status:", data.get("status"))

def test_process_cycle_fraud_detection():
    print("\n--- Testing Fraud Detection (Low Activity) ---")
    payload = {
        "user_id": VALID_USER_ID,
        "location": {"lat": 12.9716, "lng": 77.5946, "city": "Bangalore"},
        "weather_data": {
            "aqi": 250,
            "rain": 30,
            "temp": 45,
            "time_of_day": 14
        },
        "recent_pings": 2,    
        "orders_completed": 0, 
        "base_income": 300.0,
        "disruption_hours": 3.0
    }
    response = client.post("/api/process-cycle", json=payload)
    print("Status Code:", response.status_code)
    data = response.json()
    print("Response Status:", data.get("status"))
    print("Reason:", data.get("reason"))

if __name__ == "__main__":
    test_process_cycle_success()
    test_process_cycle_no_trigger()
    test_process_cycle_fraud_detection()
