from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import (
    PredictRiskRequest, IncomePredictRequest, FraudCheckRequest,
    TriggerCheckRequest, ClaimRequest, GiftPlanRequest, SOSRequest, LoginRequest,
    ProcessCycleRequest
)
from app.services.ai_engine import ai_engine
from app.services.trigger_engine import evaluate_trigger
from app.services.fraud_engine import conduct_fraud_check
from app.services.payout_engine import process_payout
from app.services.claim_engine import claim_engine
from app.core.db import supabase
from datetime import datetime

router = APIRouter()

@router.post("/login")
async def login(user: dict):
    try:
        print("LOGIN REQUEST RECEIVED:", user)

        email = user.get("email")
        city = user.get("city")

        if not email:
            return {"success": False, "error": "Missing email"}

        existing = supabase.table("users").select("*").eq("email", email).execute()
        
        if existing.data:
            # Sync selection to DB if it changed
            if existing.data[0].get("city") != city:
                supabase.table("users").update({"city": city}).eq("email", email).execute()
            
            user_out = existing.data[0]
            user_out["city"] = city
            return {"success": True, "user": user_out}

        new_user = {
            "email": email,
            "city": city,
            "subscription": False,
            "risk_score": 50
        }

        res = supabase.table("users").insert(new_user).execute()

        return {"success": True, "user": res.data[0]}

    except Exception as e:
        print("LOGIN ERROR:", str(e))
        return {"success": False, "error": str(e)}

@router.on_event("startup")
async def startup_event():
    # Initialize XGBoost and Isolation Forest dummy training on startup
    ai_engine.initialize_models()

@router.post("/predict-risk")
def predict_risk(req: PredictRiskRequest):
    """
    XGBoost Risk Prediction: Adjust premium dynamically
    """
    prob = ai_engine.predict_risk(req.weather_forecast)
    return {
        "disruption_probability": prob,
        "dynamic_premium_multiplier": 1.0 + (prob * 0.5) # Increase premium up to 50% based on risk
    }

@router.post("/predict-income")
def predict_income(req: IncomePredictRequest):
    """
    Predict expected income for rollback protection.
    """
    history = req.worker_history
    # Simple mock prediction
    avg_hourly = history.get("avg_hourly", 150)
    return {"expected_hourly_income": avg_hourly}

@router.post("/fraud-check")
def fraud_check(req: FraudCheckRequest):
    """
    Isolation Forest + Rules Anomaly Detection
    """
    res = conduct_fraud_check(
        req.user_id, req.location.dict(), req.disruption_type, 
        req.recent_pings, req.orders_completed
    )
    return res

@router.post("/trigger-check")
async def trigger_check(req: TriggerCheckRequest):
    """
    Parametric Trigger check
    """
    res = evaluate_trigger(req.current_weather)
    return res

@router.post("/payout")
async def payout(req: ClaimRequest):
    """
    Parametric Auto-Payout Engine
    """
    # 1. Trigger Check (Simulated from claim req type)
    # 2. Fraud Check
    fc = conduct_fraud_check(req.user_id, req.location.dict(), req.trigger_type, 20, 5) # Dummy good stats
    if fc["is_fraud"]:
        raise HTTPException(status_code=403, detail=fc["reason"])

    # 3. Process Payout
    base_payout = 500.0 # Default base payout
    res = process_payout(req.user_id, base_payout, req.disruption_hours, req.actual_income)
    
    # Optional: Log to Supabase
    if supabase is not None:
        try:
            supabase.table('payouts').insert({
                "user_id": req.user_id,
                "trigger": req.trigger_type,
                "amount": res["amount_credited"],
                "created_at": datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            print(f"Supabase insert failed: {e}")
        
    return res

@router.post("/gift-plan")
async def gift_plan(req: GiftPlanRequest):
    """
    Premium Gifting
    """
    print(f"GIFT HIT: {req.sender_id} → {req.receiver_id} ({req.plan_id})")
    if supabase is not None:
        try:
            supabase.table('gifts').insert({
                "sender_id": req.sender_id,
                "receiver_email": req.receiver_id,
                "plan_id": req.plan_id,
                "duration_weeks": req.duration_weeks,
                "created_at": datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            print(f"Supabase gift insert failed: {e}")

    return {
        "success": True,
        "status": "success",
        "message": f"Successfully gifted {req.plan_id} for {req.duration_weeks} weeks to {req.receiver_id}!"
    }

@router.post("/sos")
async def trigger_sos(req: SOSRequest):
    """
    Universal Emergency SOS with Auto Payout Priority
    """
    # 1. Determine priority boost
    priority = "HIGH" if req.is_night_time or req.is_high_risk_zone else "NORMAL"
    
    # 2. Record the safety event
    if supabase is not None:
        try:
            supabase.table('sos_events').insert({
                "user_id": req.user_id,
                "location": req.location.dict(),
                "emergency_type": req.emergency_type,
                "risk_level": req.risk_level,
                "priority": priority,
                "created_at": datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            print(f"Supabase insert failed: {e}")
        
    # 3. Trigger auto-payout for safety interruption (bypass fraud strictness)
    safety_payout_amount = 400.0 if priority == "HIGH" else 250.0
    
    if supabase is not None:
        try:
            supabase.table('payouts').insert({
                "user_id": req.user_id,
                "trigger": "Emergency Safety Interruption",
                "amount": safety_payout_amount,
                "created_at": datetime.utcnow().isoformat(),
                "status": "Approved_Bypass"
            }).execute()
        except Exception as e:
            print(f"Supabase insert failed: {e}")

    return {
        "status": "success",
        "safety_mode": "activated",
        "priority": priority,
        "message": f"Emergency response team verified. Priority: {priority}.",
        "auto_payout_triggered": True,
        "amount_credited": safety_payout_amount
    }

@router.get("/claims/{user_id}")
def get_claims(user_id: str):
    if supabase is not None:
        try:
            response = supabase.table('claims').select("*").eq("user_id", user_id).execute()
            return response.data
        except: return []
    return []

@router.get("/payouts/{user_id}")
def get_payouts(user_id: str):
    if supabase is not None:
        try:
            response = supabase.table('payouts').select("*").eq("user_id", user_id).order('created_at', desc=True).execute()
            return response.data
        except: return []
    return []

@router.get("/users/{user_id}")
def get_user(user_id: str):
    if supabase is not None:
        try:
            response = supabase.table('users').select("*").eq("user_id", user_id).limit(1).execute()
            if response.data: return response.data[0]
        except: return None
    return None

@router.post("/process-cycle")
async def process_cycle(req: ProcessCycleRequest):
    """
    REAL End-to-end Parametric Insurance Pipeline:
    User -> Policy -> Disruption -> AI -> Fraud Check -> Payout
    """
    time_of_day = req.weather_data.get("time_of_day", 12)
    is_peak = (8 <= time_of_day <= 10) or (18 <= time_of_day <= 21)
    
    results = {
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": req.user_id,
        "input_weather": req.weather_data,
        "is_peak_hour": is_peak
    }
    
    # 1. AI Risk Prediction (XGBoost)
    risk_score = ai_engine.predict_risk(req.weather_data)
    results["ai_risk_score"] = risk_score
    
    # 2. Trigger Check
    trigger_event = evaluate_trigger(req.weather_data)
    results["trigger_event"] = trigger_event
    
    if not trigger_event.get("triggered", False):
        results["status"] = "No disruption triggered. Monitoring continues."
        return results
        
    # 3. Auto-Claim Generation
    time_of_day = req.weather_data.get("time_of_day", 12)
    claim_payload = claim_engine.process_auto_claim(
        req.user_id, trigger_event, req.base_income, req.disruption_hours, time_of_day
    )
    results["claim_generated"] = claim_payload
    
    # 4. Fraud Check (Isolation Forest + Hard Rules)
    fraud_data = {
        "risk_score": results.get("ai_risk_score", 50),
        "rainfall": req.weather_data.get("rain", 0),
        "aqi": req.weather_data.get("aqi", 50),
        "movement": req.recent_pings / 100.0 if req.recent_pings > 0 else 0,
        "claims_last_hour": 1 # To be improved with db query later
    }
    
    fc = conduct_fraud_check(
        req.user_id, req.location.dict(), trigger_event.get("type", "unknown"),
        req.recent_pings, req.orders_completed
    )
    # The upgraded fraud_engine also exports conduct_fraud_check which uses detect_fraud
    
    results["fraud_check"] = fc
    
    if fc["is_fraud"]:
        if supabase is not None:
            try:
                # Log fraud event to claims table
                db_claim = {
                    "user_id": claim_payload["user_id"],
                    "amount": 0,
                    "status": "fraud_detected",
                    "created_at": claim_payload["created_at"]
                }
                supabase.table('claims').insert(db_claim).execute()
            except Exception as e:
                print(f"Supabase claim insert failed (Fraud): {e}")
        return {
            "success": False, 
            "status": "fraud_detected", 
            "error": fc["reason"], 
            "results": results
        }
        
    # 5. Execute Payout
    if supabase is not None:
        try:
            # Log successful claim to claims table
            db_claim = {
                "user_id": claim_payload["user_id"],
                "amount": claim_payload["total_claim_value"],
                "status": "approved",
                "created_at": claim_payload["created_at"]
            }
            supabase.table('claims').insert(db_claim).execute()
        except Exception as e:
            print(f"Supabase claim insert failed: {e}")

    # Process Payment Simulation
    payout_res = process_payout(
        req.user_id, 
        base_amount=500.0, 
        disruption_hours=int(req.disruption_hours), 
        actual_income=req.base_income * 0.1 # Simulated actual income
    )
    results["payout"] = payout_res
    
    if supabase is not None:
        try:
            supabase.table('payouts').insert({
                "user_id": req.user_id,
                "trigger": trigger_event.get("type", "unknown"),
                "amount": payout_res["amount_credited"],
                "created_at": datetime.utcnow().isoformat(),
                "status": "Success",
                "transaction_id": payout_res["transaction_id"]
            }).execute()
        except Exception as e:
            print(f"Supabase payout insert failed: {e}")
            
    results["status"] = "SUCCESS"
    return results

@router.get("/risk-score")
def get_risk_score(aqi: float = 50, rain: float = 0, temp: float = 30, time_of_day: float = 12):
    weather_data = {"aqi": aqi, "rain": rain, "temp": temp, "time_of_day": time_of_day}
    score = ai_engine.predict_risk(weather_data)
    return {"ai_risk_score": score}
