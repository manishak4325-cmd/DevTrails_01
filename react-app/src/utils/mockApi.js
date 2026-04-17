// ===== MOCKAPI SERVICE =====
const BASE = 'https://69d0279290cd06523d5d14eb.mockapi.io/api/v1';

export const FALLBACK_EARNINGS = [
  { day:'Mon', earnings:820,  protected:210, hoursWorked:7,  saved:160 },
  { day:'Tue', earnings:1250, protected:360, hoursWorked:9,  saved:255 },
  { day:'Wed', earnings:940,  protected:310, hoursWorked:8,  saved:205 },
  { day:'Thu', earnings:1080, protected:295, hoursWorked:9,  saved:185 },
  { day:'Fri', earnings:1380, protected:410, hoursWorked:11, saved:310 },
  { day:'Sat', earnings:1620, protected:330, hoursWorked:12, saved:225 },
  { day:'Sun', earnings:720,  protected:195, hoursWorked:6,  saved:145 },
];

export const FALLBACK_FRAUD_SCORE = {
  gpsConsistency: 0.88, activityLevel: 0.82,
  claimAccuracy: 0.91, noDuplicateClaims: 0.95, score: 0.89,
};

export const FALLBACK_CLAIMS = [
  { zone:'Koramangala', hoursWorked:8.5, fraudPercent:4,  status:'Approved', type:'Rain',  amount:320, date:'2 Apr'  },
  { zone:'Adyar',       hoursWorked:6.0, fraudPercent:2,  status:'Approved', type:'AQI',   amount:250, date:'30 Mar' },
  { zone:'Bandra',      hoursWorked:9.0, fraudPercent:31, status:'Blocked',  type:'Heat',  amount:0,   date:'28 Mar' },
  { zone:'HSR Layout',  hoursWorked:7.5, fraudPercent:18, status:'Review',   type:'Storm', amount:0,   date:'25 Mar' },
  { zone:'T.Nagar',     hoursWorked:10,  fraudPercent:6,  status:'Approved', type:'Flood', amount:410, date:'22 Mar' },
];

export const DEMO_ENV = { rain: 25, temp: 43, aqi: 178 };

async function apiGet(endpoint) {
  try {
    const r = await fetch(`${BASE}/${endpoint}`);
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    return Array.isArray(d) ? d : [d];
  } catch (e) {
    console.warn(`MockAPI /${endpoint} failed —`, e.message, '→ fallback');
    return null;
  }
}

export async function fetchMockEarnings() {
  let data = await apiGet('earnings');
  const valid = Array.isArray(data) && data.length > 0 && data[0].day;
  if (!valid) {
    data = FALLBACK_EARNINGS.map(d => ({
      ...d,
      earnings:  Math.max(400, d.earnings  + Math.round((Math.random()-0.5)*200)),
      protected: Math.max(100, d.protected + Math.round((Math.random()-0.5)*80)),
      saved:     Math.max(50,  d.saved     + Math.round((Math.random()-0.5)*60)),
    }));
  }
  return data;
}

export async function fetchMockClaims() {
  let data = await apiGet('claims');
  if (!Array.isArray(data) || !data.length) data = FALLBACK_CLAIMS;
  return data;
}

export async function fetchMockFraudScore() {
  let data = await apiGet('fraud-score');
  const valid = Array.isArray(data) && data.length > 0 && data[0].score != null;
  const rec   = valid ? data[0] : FALLBACK_FRAUD_SCORE;
  const score = rec.score != null ? parseFloat(rec.score) :
    0.30*(rec.gpsConsistency||0.8) + 0.30*(rec.activityLevel||0.75) +
    0.20*(rec.claimAccuracy||0.9)  + 0.20*(rec.noDuplicateClaims||0.95);
  return {
    score: parseFloat(score.toFixed(2)),
    gpsConsistency:    rec.gpsConsistency    || 0.8  + Math.random()*0.15,
    activityLevel:     rec.activityLevel     || 0.7  + Math.random()*0.2,
    claimAccuracy:     rec.claimAccuracy     || 0.8  + Math.random()*0.15,
    noDuplicateClaims: rec.noDuplicateClaims || 0.85 + Math.random()*0.1,
  };
}

export function generateWeekData() {
  return FALLBACK_EARNINGS.map(d => ({
    day:       d.day,
    earnings:  Math.max(400, d.earnings  + Math.round((Math.random()-0.5)*300)),
    protected: Math.max(100, d.protected + Math.round((Math.random()-0.5)*120)),
    saved:     Math.max(50,  d.saved     + Math.round((Math.random()-0.5)*100)),
  }));
}
