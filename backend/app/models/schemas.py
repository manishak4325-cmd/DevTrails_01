from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class LocationData(BaseModel):
    lat: float
    lng: float
    city: str
    zone_idx: Optional[int] = 0

class LoginRequest(BaseModel):
    name: str = "User"
    email: str
    city: str = "Bangalore"

class UserCreate(BaseModel):
    name: str
    email: str
    location: str
    platform: str = "FluxShield"
    role: str = "worker"

class PredictRiskRequest(BaseModel):
    city: str
    lat: float
    lng: float
    weather_forecast: dict # e.g. {"temp": 42, "rain": 5, "aqi": 120}

class IncomePredictRequest(BaseModel):
    worker_history: dict # historical hours worked, earnings

class FraudCheckRequest(BaseModel):
    user_id: str
    location: LocationData
    disruption_type: str
    recent_pings: int
    orders_completed: int

class TriggerCheckRequest(BaseModel):
    city: str
    zone_idx: int
    current_weather: dict # e.g. {"rain": 65, "aqi": 100, "temp": 30}

class ClaimRequest(BaseModel):
    user_id: str
    location: LocationData
    trigger_type: str
    disruption_hours: int = 0
    actual_income: float = 0 # Used for rollback protection formula

class GiftPlanRequest(BaseModel):
    sender_id: str
    receiver_id: str
    plan_id: str
    duration_weeks: int = 1

class SOSRequest(BaseModel):
    user_id: str
    location: LocationData
    emergency_type: str = "Medical/Safety"
    risk_level: str = "unknown"
    is_high_risk_zone: bool = False
    is_night_time: bool = False

class ProcessCycleRequest(BaseModel):
    user_id: str
    location: LocationData
    weather_data: dict # e.g. {"temp": 42, "rain": 5, "aqi": 120, "time_of_day": 14}
    recent_pings: int = 20
    orders_completed: int = 5
    base_income: float = 150.0
    disruption_hours: float = 2.0

