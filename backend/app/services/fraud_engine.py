from sklearn.ensemble import IsolationForest
import numpy as np

# Initialize the model with a higher sensitivity
model = IsolationForest(contamination=0.15, random_state=42)

def detect_fraud(data):
    """
    Advanced Fraud Detection using Isolation Forest ML + Hard Business Rules
    """
    # 1. Feature Engineering
    features = np.array([[
        data.get("risk_score", 0),
        data.get("rainfall", 0),
        data.get("aqi", 0),
        data.get("movement", 0),
        data.get("claims_last_hour", 0)
    ]])

    # 2. ML Anomaly Detection (Note: In a real scenario, the model would be fit on historical data)
    # For demonstration, we fit a small dummy set at startup or per-request if data is small
    # To simulate ML behavior we use fit_predict
    # We typically wouldn't fit every request, but here we define the bounds
    dummy_data = np.array([
        [50, 25, 180, 0.5, 1], # Normal
        [10, 0, 50, 0.4, 0],   # Normal
        [90, 60, 300, 0.6, 2], # Normal
        [10, 0, 50, 0.0, 5],   # Anomaly Example
    ])
    full_data = np.vstack([dummy_data, features])
    scores = model.fit_predict(full_data)
    
    # Check the result for the last item (current request)
    current_score = scores[-1]

    if current_score == -1:
        return {
            "is_fraud": True,
            "reason": "Anomalous behavior detected by ML Fraud Engine"
        }

    # 3. HARD RULES (CRITICAL)
    if data.get("movement", 0) < 0.01:
        return {"is_fraud": True, "reason": "No movement detected. Verification failed."}

    if data.get("claims_last_hour", 0) > 3:
        return {"is_fraud": True, "reason": "Claim velocity limit reached (Too many claims)."}

    if data.get("risk_score", 0) < 20 and data.get("rainfall", 0) < 5:
        return {"is_fraud": True, "reason": "Environmental data mismatch for triggered claim."}

    return {
        "is_fraud": False,
        "reason": "Valid claim verified"
    }

# Backward compatibility wrapper for conduct_fraud_check
def conduct_fraud_check(user_id, location, trigger_type, recent_pings, orders_completed):
    # Map arguments to detect_fraud fields
    data = {
        "risk_score": 50, # Mocked or derived
        "rainfall": 25 if trigger_type == 'rain' else 0,
        "aqi": 180 if trigger_type == 'aqi' else 50,
        "movement": recent_pings / 100.0 if recent_pings > 0 else 0, # Scaled proxy for movement
        "claims_last_hour": 1
    }
    return detect_fraud(data)
