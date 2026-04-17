def evaluate_trigger(weather_data: dict) -> dict:
    """
    Evaluates physical weather risks against defined thresholds.
    Triggers: AQI > 400, Rain > 64mm/hr, Temp > 44C
    Returns dict with triggered=bool, reason=str
    """
    aqi = weather_data.get('aqi', 0)
    rain = weather_data.get('rain', 0)
    temp = weather_data.get('temp', 25)

    if aqi > 200:
        severity = "Severe" if aqi > 300 else "Moderate"
        return {"triggered": True, "reason": f"{severity} AQI ({aqi})", "type": "aqi"}
    if rain > 20:
        severity = "Severe" if rain > 50 else "Moderate"
        return {"triggered": True, "reason": f"{severity} Rain ({rain} mm/hr)", "type": "rain"}
    if temp > 44:
        return {"triggered": True, "reason": f"Extreme Heat ({temp}°C)", "type": "heat"}

    return {"triggered": False, "reason": "Conditions normal", "type": None}
