import { PLANS } from './cityData';

// Trigger thresholds
export const TRIGGER_THRESHOLDS = {
  rain:  { value: 64,    label: 'mm/hr', text: '> 64 mm/hr heavy rain'         },
  aqi:   { value: 300,   label: 'AQI',   text: '> 300 AQI hazardous air'       },
  heat:  { value: 44,    label: '°C',    text: '> 44°C extreme heat'           },
  flood: { value: 'High',label: '',      text: 'Flood risk level: High'        },
};

/**
 * Evaluate trigger conditions from live env data
 * Returns array of trigger objects for the trigger cards
 */
export function evaluateTriggers(env = {}) {
  const { aqi = 0, rain = 0, temp = 25 } = env;

  const triggers = [
    {
      type:    'rain',
      icon:    '🌧️',
      title:   'Rain Risk',
      value:   rain,
      unit:    'mm/hr',
      threshold: 64,
      level:   rain > 64 ? 'high' : rain > 20 ? 'moderate' : 'low',
      desc:    rain > 64 ? `Heavy rain: ${rain} mm/hr — TRIGGER ACTIVE`
             : rain > 20 ? `Moderate rain: ${rain} mm/hr — monitoring`
             : `Rain: ${rain} mm/hr — within safe limits`,
      triggered: rain > 64,
    },
    {
      type:    'aqi',
      icon:    '💨',
      title:   'Air Quality',
      value:   aqi,
      unit:    'AQI',
      threshold: 300,
      level:   aqi > 300 ? 'high' : aqi > 150 ? 'moderate' : 'low',
      desc:    aqi > 300 ? `Hazardous AQI: ${aqi} — TRIGGER ACTIVE`
             : aqi > 150 ? `Poor AQI: ${aqi} — monitoring`
             : `AQI: ${aqi} — acceptable levels`,
      triggered: aqi > 300,
    },
    {
      type:    'heat',
      icon:    '🌡️',
      title:   'Heat Index',
      value:   temp,
      unit:    '°C',
      threshold: 45,
      level:   temp > 44 ? 'high' : temp > 38 ? 'moderate' : 'low',
      desc:    temp > 44 ? `Extreme heat: ${temp}°C — TRIGGER ACTIVE`
             : temp > 38 ? `High heat: ${temp}°C — monitoring`
             : `Temp: ${temp}°C — safe conditions`,
      triggered: temp > 44,
    },
  ];

  return triggers;
}

/**
 * Check which triggers are active for a specific plan
 */
export function checkTriggers(riskLevel, planId) {
  if (!planId) return [];
  const plan = PLANS[planId];
  if (!plan) return [];

  const r = riskLevel;
  const t = [];
  const eid = (type) => `${type}-${Math.floor(Date.now() / 60000)}`;

  if (plan.triggers.includes('rain') && r.rain > 64)
    t.push({ type: 'rain', val: r.rain + ' mm/hr', thr: '64 mm/hr', eid: eid('rain') });
  if (plan.triggers.includes('aqi') && r.aqi > 300)
    t.push({ type: 'aqi', val: r.aqi + ' AQI', thr: '300 AQI', eid: eid('aqi') });
  if (plan.triggers.includes('heat') && r.temp > 44)
    t.push({ type: 'heat', val: r.temp + '°C', thr: '44°C', eid: eid('heat') });
  if (plan.triggers.includes('flood') && r.flood === 'High')
    t.push({ type: 'flood', val: 'High', thr: 'High', eid: eid('flood') });

  return t;
}

/**
 * Zone-based auto payout — simulates crediting all users in a disrupted zone
 * Returns list of simulated payouts
 */
export function payoutAllUsersInZone(city, zoneName, amount) {
  // Simulated user list in the zone
  const simulatedUsers = [
    { name: 'Ravi K.', upi: '9876@hdfc' },
    { name: 'Amit S.', upi: '9123@upi'  },
    { name: 'Priya M.',upi: '9345@paytm'},
    { name: 'Deepak R.',upi:'9456@gpay' },
  ];

  return simulatedUsers.map(u => ({
    user: u.name,
    upi:  u.upi,
    amount,
    zone: zoneName,
    city,
    status: 'Credited',
    time: new Date().toLocaleTimeString('en-IN'),
  }));
}

/**
 * Validate a claim for AI fraud check
 */
export function validateClaim(trigger, userRisk, policy, processedEvents) {
  const locMatch   = Math.random() > 0.08;
  const actValid   = Math.random() > 0.1;
  const policyCov  = policy.active && PLANS[policy.plan]?.triggers.includes(trigger.type);
  const noDup      = !processedEvents.has(trigger.eid);
  const inZone     = ['high', 'severe'].includes(userRisk);
  return {
    valid: locMatch && actValid && policyCov && noDup && inZone,
    locMatch, actValid, policyCov, noDup, inZone,
  };
}
