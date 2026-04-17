// ===== RISK ENGINE =====

/**
 * Calculate composite risk score from environmental data
 * Returns 0.0 (safe) → 1.0 (severe)
 */
export function getRiskScore(aqi = 0, rain = 0, heat = 25) {
  const aqiScore  = Math.min(1, aqi / 400);
  const rainScore = Math.min(1, rain / 30);
  const heatScore = Math.min(1, Math.max(0, (heat - 30) / 20));
  return parseFloat((aqiScore * 0.4 + rainScore * 0.3 + heatScore * 0.3).toFixed(3));
}

/**
 * Categorize zone risk level based on weather data and risk type
 */
export function calcZoneRisk(weather, aqiData, riskType) {
  if (riskType === 'rain') {
    const rain = weather.rain || 0;
    if (rain > 40) return 'severe';
    if (rain > 20) return 'high';
    if (rain > 5)  return 'moderate';
    return 'safe';
  }
  if (riskType === 'aqi') {
    const aqi = aqiData?.aqi || 0;
    if (aqi > 350) return 'severe';
    if (aqi > 250) return 'high';
    if (aqi > 150) return 'moderate';
    return 'safe';
  }
  if (riskType === 'heat') {
    const temp = weather.temp || 25;
    if (temp > 44) return 'severe';
    if (temp > 40) return 'high';
    if (temp > 35) return 'moderate';
    return 'safe';
  }
  return 'safe';
}

/**
 * Calculate flood risk from rain + humidity
 */
export function calcFloodRisk(rain, humidity) {
  if (rain > 50 || (rain > 30 && humidity > 80)) return 'High';
  if (rain > 15 || humidity > 75) return 'Moderate';
  return 'Low';
}

/**
 * Convert OWM AQI scale (1-5) to India AQI scale
 */
export function convertAQI(owmAqi, pm25 = 0) {
  const aqiMap = { 1: 50, 2: 100, 3: 200, 4: 300, 5: 450 };
  return aqiMap[owmAqi] || Math.round(pm25 * 2.5);
}

/**
 * Risk color and emoji helpers
 */
export const RISK_COLORS = {
  safe:     'var(--success)',
  moderate: 'var(--warning)',
  high:     'var(--danger)',
  severe:   'var(--purple)',
};

export const RISK_EMOJIS = {
  safe:     '🟢',
  moderate: '🟡',
  high:     '🔴',
  severe:   '🟣',
};
