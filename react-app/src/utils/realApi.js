// realApi.js - Interacts with the Python FastAPI Backend
import { CONFIG } from './cityData';
const BASE_URL = 'http://localhost:8000/api';

export async function fetchRealWeather(lat, lng) {
  try {
    // Weather
    const wRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${CONFIG.OWM_KEY}&units=metric`);
    const wData = await wRes.json();
    
    // AQI
    const aRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=${CONFIG.OWM_KEY}`);
    const aData = await aRes.json();

    const aqiVal = aData.list?.[0]?.main?.aqi || 1;
    // Map 1-5 to standard Indian AQI approximate logic if needed, or multiply (1=50, 2=100, 3=150, 4=200, 5=300+)
    const scaledAqi = aqiVal * 60 + Math.floor(Math.random() * 20); 

    return {
      temp: wData.main?.temp || 28,
      rain: wData.rain?.['1h'] || 0,
      aqi: scaledAqi,
      desc: wData.weather?.[0]?.description || 'clear',
    };
  } catch(err) {
    console.error("OpenWeather API failed:", err);
    return null;
  }
}

export async function loginUser(name, email, city) {
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, city })
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function triggerPayout(userId, location, type, disruptionHours, actualIncome) {
  try {
    const res = await fetch(`${BASE_URL}/payout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        location: { lat: location.lat, lng: location.lng, city: location.city, zone_idx: location.zoneIdx },
        trigger_type: type,
        disruption_hours: disruptionHours,
        actual_income: actualIncome
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Payout failed');
    return data;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function predictRisk(city, location, weatherData) {
  try {
    const res = await fetch(`${BASE_URL}/predict-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city,
        lat: location.lat,
        lng: location.lng,
        weather_forecast: weatherData
      })
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    return null; // Graceful fallback
  }
}

export async function checkTrigger(city, zoneIdx, weatherData) {
  try {
    const res = await fetch(`${BASE_URL}/trigger-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city,
        zone_idx: zoneIdx,
        current_weather: weatherData
      })
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    return { triggered: false };
  }
}

export async function processSOS(userId, location, type, isHighRiskZone, isNight) {
  try {
    const res = await fetch(`${BASE_URL}/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        location: { lat: location.lat, lng: location.lng, city: location.city, zone_idx: location.zoneIdx },
        emergency_type: type || 'Medical/Safety',
        risk_level: isHighRiskZone ? 'high' : 'unknown',
        is_high_risk_zone: isHighRiskZone || false,
        is_night_time: isNight || false
      })
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function giftPlan(senderId, receiverId, planId) {
  try {
    const res = await fetch(`${BASE_URL}/gift-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_id: senderId,
        receiver_id: receiverId,
        plan_id: planId,
        duration_weeks: 1
      })
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function fetchUser(userId) {
  try {
    const res = await fetch(`${BASE_URL}/users/${encodeURIComponent(userId)}`);
    return await res.json();
  } catch (err) {
    console.error(err); return null;
  }
}

export async function fetchClaims(userId) {
  try {
    const res = await fetch(`${BASE_URL}/claims/${encodeURIComponent(userId)}`);
    return await res.json();
  } catch (err) {
    console.error(err); return [];
  }
}

export async function fetchPayouts(userId) {
  try {
    const res = await fetch(`${BASE_URL}/payouts/${encodeURIComponent(userId)}`);
    return await res.json();
  } catch (err) {
    console.error(err); return [];
  }
}

export async function processCycle(payload) {
  try {
    const res = await fetch(`${BASE_URL}/process-cycle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Backend Error: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn("📡 Backend offline or error. Switching to fallback mode.", err);
    throw err;
  }
}
