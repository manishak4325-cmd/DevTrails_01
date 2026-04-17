// ============================================================
// FLUXSHIELD — MOCKAPI + CLAIM PIPELINE ENGINE
// Base: https://69d0279290cd06523d5d14eb.mockapi.io/api/v1
// ============================================================

const BACKEND_URL = "http://127.0.0.1:8000";

const MOCKAPI = {
  BASE: 'https://69d0279290cd06523d5d14eb.mockapi.io/api/v1',
  async get(endpoint) {
    try {
      const r = await fetch(`${this.BASE}/${endpoint}`);
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      return Array.isArray(d) ? d : [d];
    } catch (e) {
      console.warn(`MockAPI /${endpoint} failed —`, e.message, '→ fallback');
      return null;
    }
  },
  async post(endpoint, body) {
    try {
      const r = await fetch(`${this.BASE}/${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } catch (e) {
      console.warn(`MockAPI POST /${endpoint} failed —`, e.message);
      return null;
    }
  }
};

// ============================================================
// ════════════════════════════════════════════════════════════
//   LOGIN SYSTEM
// ════════════════════════════════════════════════════════════
// ============================================================

// Tab switcher
function switchLoginTab(tab) {
  document.getElementById('normalLoginPanel').style.display = tab === 'normal' ? '' : 'none';
  document.getElementById('demoLoginPanel').style.display   = tab === 'demo'   ? '' : 'none';
  document.getElementById('tabNormal').classList.toggle('active', tab === 'normal');
  document.getElementById('tabDemo').classList.toggle('active',   tab === 'demo');
}

// Generic modal helpers (used by manual claim, etc.)
function openModal(id) { const e = document.getElementById(id); if (e) e.classList.add('open'); }
function closeModal(id) { const e = document.getElementById(id); if (e) e.classList.remove('open'); }

// ── NORMAL LOGIN (real user, local data, NO MockAPI) ──────────────────
function handleNormalLogin(e) {
  e.preventDefault();
  const email = (document.getElementById('normalEmail')?.value || '').trim();
  const pass  = (document.getElementById('normalPassword')?.value || '').trim();
  const city  = document.getElementById('normalCity')?.value || 'Bangalore';

  if (!email || !pass) { showToast('Enter email and password', 'warning'); return; }

  // Derive a friendly name from the email
  const raw  = email.split('@')[0];
  const name = raw.replace(/[.\-_0-9]+/g, ' ')
                  .replace(/\b\w/g, c => c.toUpperCase())
                  .trim() || 'User';

  // ── CRITICAL: Normal login is NEVER demo — and never pre-assigns fake coords
  isDemoUser = false;

  // Set user state as a brand-new user (no plan, no claims yet)
  // lat/lng are null — only initGeolocation() will set real coordinates
  S.user = {
    name, email, phone: '',
    platform: 'Blinkit', location: city, role: 'worker',
    isLoggedIn: true,
    lat: null, lng: null,   // GPS will overwrite with real position
    zoneIdx: 0, gpsActive: false, subscriptionWeeks: 0,
    isDemo: false
  };
  S.policy = { plan: '', premium: 0, coverage: 0, active: false };
  S.bank   = { name: '', acc: '', ifsc: '', upi: '' };
  S.claims.payouts  = [];
  S.claims.aiLogs   = [];
  S.claims.processedEvents = new Set();
  S.claims.manualClaims    = [];
  S.triggers.count  = 0;
  S.triggers.history = [];
  S.analytics.claimPenalty = 0;
  S.analytics.trustScore   = null;
  S.env = { temp: null, rain: null, aqi: null };  // reset; GPS will populate after permission granted

  updateNav();
  showToast(`Welcome, ${name}! Choose a plan to activate coverage.`, 'success');
  addNotif(`Logged in as ${name}. Select a plan to get started.`, 'info');

  // ── Request live GPS immediately — triggers browser permission prompt ──
  // Pre-set the dashboard location to a "requesting" state
  const dashLocEl = document.getElementById('dashLocation');
  if (dashLocEl) dashLocEl.textContent = '📡 Requesting live location…';

  // Call GPS right away — no delay needed, browser handles the prompt timing
  if (typeof initGeolocation === 'function') initGeolocation();



  goTo('pricing');  // Normal flow: Login → Plan Selection → Bank → Dashboard

  // ── EMPTY analytics state — no mock data for real users ─────────────
  // renderTriggerCards and buildEarningsChart are intentionally NOT called here.
  // They are called later by goTo('dashboard') branching on isDemoUser.
  setTimeout(() => {
    // Normal login: use real env from API if available, else skip trigger cards (they'll update after GPS)
    if (S.user.isDemo) {
      renderTriggerCards(evaluateTriggers(DEMO_ENV));
    } else if (S.env && S.env.temp !== null) {
      renderTriggerCards(evaluateTriggers(S.env));
    }
    // Empty analytics — no Protected/Loss Avoided lines for new users
    if (typeof showEmptyAnalytics === 'function') showEmptyAnalytics();
  }, 500);

}

// ── DEMO AUTH FORM (ravi / 1234 → MockAPI) ──────────────────
function handleDemoAuthForm(e) {
  e.preventDefault();
  const user = (document.getElementById('loginUsername')?.value || '').trim();
  const pass = (document.getElementById('loginPassword')?.value || '').trim();
  if (!user || !pass) { showToast('Enter credentials', 'warning'); return; }
  showToast(user === 'ravi' && pass === '1234' ? '🎉 Welcome back, Ravi Kumar!' : `Welcome, ${user}! (Demo)`, 'success');
  handleDemoLogin();
}

// ── DEMO LOGIN (Ravi Kumar, MockAPI) ────────────────────────
// (handleDemoLogin lives in app.js — we extend it via bootMockAPI)

// ============================================================
// ════════════════════════════════════════════════════════════
//   FALLBACK / DEMO DATA
// ════════════════════════════════════════════════════════════
// ============================================================

const FALLBACK_EARNINGS = [
  { day:'Mon', earnings:820,  protected:210, hoursWorked:7,  saved:160 },
  { day:'Tue', earnings:1250, protected:360, hoursWorked:9,  saved:255 },
  { day:'Wed', earnings:940,  protected:310, hoursWorked:8,  saved:205 },
  { day:'Thu', earnings:1080, protected:295, hoursWorked:9,  saved:185 },
  { day:'Fri', earnings:1380, protected:410, hoursWorked:11, saved:310 },
  { day:'Sat', earnings:1620, protected:330, hoursWorked:12, saved:225 },
  { day:'Sun', earnings:720,  protected:195, hoursWorked:6,  saved:145 }
];
const FALLBACK_FRAUD_SCORE = {
  gpsConsistency:0.88, activityLevel:0.82,
  claimAccuracy:0.91,  noDuplicateClaims:0.95, score:0.89
};
const FALLBACK_CLAIMS = [
  { zone:'Koramangala', hoursWorked:8.5, fraudPercent:4,  status:'Approved', type:'Rain',  amount:320, date:'2 Apr' },
  { zone:'Adyar',       hoursWorked:6.0, fraudPercent:2,  status:'Approved', type:'AQI',   amount:250, date:'30 Mar'},
  { zone:'Bandra',      hoursWorked:9.0, fraudPercent:31, status:'Blocked',  type:'Heat',  amount:0,   date:'28 Mar'},
  { zone:'HSR Layout',  hoursWorked:7.5, fraudPercent:18, status:'Review',   type:'Storm', amount:0,   date:'25 Mar'},
  { zone:'T.Nagar',     hoursWorked:10,  fraudPercent:6,  status:'Approved', type:'Flood', amount:410, date:'22 Mar'}
];

// ============================================================
// ════════════════════════════════════════════════════════════
//   TRIGGER EVALUATION
// ════════════════════════════════════════════════════════════
// ============================================================

const TRIGGER_RULES = [
  { key:'rain',    icon:'🌧️',  title:'High Rain Risk in your zone',
    fn:(d)=>d.rain>20, severity:'high',     badge:'HIGH',
    valueLabel:(d)=>`${d.rain} mm/hr · Exceeds 20 mm/hr threshold` },
  { key:'heat',   icon:'🔥',   title:'Extreme Heat Conditions',
    fn:(d)=>d.temp>40, severity:'high',     badge:'HIGH',
    valueLabel:(d)=>`${d.temp}°C · Exceeds 40°C safety limit` },
  { key:'aqi',    icon:'🌫️',  title:'Unhealthy Air Quality',
    fn:(d)=>d.aqi>150,  severity:'moderate', badge:'MODERATE',
    valueLabel:(d)=>`AQI ${d.aqi} · Above safe limit of 150` }
];

// Demo: all 3 fire  |  Normal: only mild AQI fires
const DEMO_ENV   = { rain:25, temp:43, aqi:178 };
const NORMAL_ENV = { rain:12, temp:38, aqi:162 };

function evaluateTriggers(env) {
  return TRIGGER_RULES.map(r => ({
    ...r,
    fired: r.fn(env),
    valueLabel: r.valueLabel(env)
  }));
}

function renderTriggerCards(triggers) {
  const container = document.getElementById('triggerCards');
  if (!container) return;

  container.innerHTML = triggers.map((t, i) => {
    const fired = t.fired;
    const cls   = fired ? t.severity : 'low';
    const badge = fired ? t.badge    : 'SAFE';
    const sub   = fired ? t.valueLabel
      : t.key==='rain' ? 'Rain within safe limits'
      : t.key==='heat' ? 'Temperature normal'
      : 'Air quality acceptable';
    const claimBtn = fired
      ? `<button class="trigger-claim-btn"
           onclick="startClaimPipeline('${t.key}','${t.title}','${t.icon}')">
           Claim &rarr;
         </button>`
      : '';

    return `
      <div class="trigger-card ${cls}" style="animation:fadeInUp 0.4s ease ${i*0.1}s both;">
        <div class="trigger-icon-wrap">${t.icon}</div>
        <div class="trigger-meta">
          <div class="trigger-title">${fired ? t.title : (t.key==='rain'?'🌤️ No Rain Alert':t.key==='heat'?'🌡️ Normal Temperature':'💨 Clean Air')}</div>
          <div class="trigger-desc">${sub}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;">
          <div class="trigger-badge">${badge}</div>
          ${claimBtn}
        </div>
      </div>`;
  }).join('');

  const dot   = document.getElementById('apiStatusDot');
  const label = document.getElementById('apiStatusLabel');
  if (dot)   dot.className    = 'api-status-dot live';
  if (label) label.textContent = S.user.isDemo ? 'Live · MockAPI' : 'Local Data';
}

// ============================================================
// ════════════════════════════════════════════════════════════
//   EARNINGS (MockAPI → fallback)
// ════════════════════════════════════════════════════════════
// ============================================================

async function loadApiEarnings() {
  // ── STRICT GUARD: MockAPI earnings are for Demo users ONLY ───────────────
  if (!S.user.isDemo) {
    console.warn('loadApiEarnings() blocked — not a demo user');
    return;
  }

  let data = await MOCKAPI.get('earnings');
  const valid = Array.isArray(data) && data.length > 0 && data[0].day;

  if (!valid) {
    data = FALLBACK_EARNINGS.map(d => ({
      ...d,
      earnings:  Math.max(400, d.earnings  + Math.round((Math.random()-0.5)*200)),
      protected: Math.max(100, d.protected + Math.round((Math.random()-0.5)*80)),
      saved:     Math.max(50,  d.saved     + Math.round((Math.random()-0.5)*60))
    }));
  }

  // Remove empty-state overlay if it exists (demo always shows real data)
  const ov = document.getElementById('chartEmptyOverlay');
  if (ov) ov.remove();

  buildEarningsChart(data);
  updateAnalyticsSummaryFull(data);

  const env = data[0] || {};
  renderTriggerCards(evaluateTriggers({
    rain: env.rain ?? DEMO_ENV.rain,
    temp: env.temp ?? DEMO_ENV.temp,
    aqi:  env.aqi  ?? DEMO_ENV.aqi
  }));
  return data;
}

function updateAnalyticsSummaryFull(data) {
  const totalE = data.reduce((s,d)=>s+(d.earnings||0),0);
  const totalP = data.reduce((s,d)=>s+(d.protected||0),0);
  const totalH = data.reduce((s,d)=>s+(d.hoursWorked||d.saved/50||0),0);
  const el = (id,v) => { const e=document.getElementById(id); if(e) e.textContent=v; };
  el('asTotalEarnings',  '₹'+Math.round(totalE).toLocaleString('en-IN'));
  el('asTotalProtected', '₹'+Math.round(totalP).toLocaleString('en-IN'));
  el('asTotalHours',     Math.round(totalH)+'h');
  el('asTotalClaims', S.triggers.count||data.filter(d=>(d.protected||0)>280).length);
}

// ============================================================
// ════════════════════════════════════════════════════════════
//   FRAUD SCORE (MockAPI → fallback)
// ════════════════════════════════════════════════════════════
// ============================================================

async function loadApiFraudScore() {
  let data   = await MOCKAPI.get('fraud-score');
  const valid = Array.isArray(data) && data.length > 0 && data[0].score != null;
  const rec   = valid ? data[0] : FALLBACK_FRAUD_SCORE;

  const score = rec.score != null ? parseFloat(rec.score) :
    0.30*(rec.gpsConsistency||0.8) + 0.30*(rec.activityLevel||0.75) +
    0.20*(rec.claimAccuracy||0.9)  + 0.20*(rec.noDuplicateClaims||0.95);

  if (typeof renderTrustScore === 'function') {
    renderTrustScore({
      score: parseFloat(score.toFixed(2)),
      gpsConsistency:    rec.gpsConsistency    || 0.8  + Math.random()*0.15,
      activityLevel:     rec.activityLevel     || 0.7  + Math.random()*0.2,
      claimAccuracy:     rec.claimAccuracy     || 0.8  + Math.random()*0.15,
      noDuplicateClaims: rec.noDuplicateClaims || 0.85 + Math.random()*0.1
    });
  }
  renderDiscountBadge(score);
  return rec;
}

function renderDiscountBadge(score) {
  const b = document.getElementById('trustBenefit');
  if (!b) return;
  const html = score > 0.7
    ? `<div class="discount-badge high-discount">🎁 15% Premium Discount — Trusted Rider</div>
       <div style="font-size:0.72rem;color:var(--text-secondary);margin-top:4px;">Your score qualifies for maximum savings.</div>`
    : score >= 0.4
    ? `<div class="discount-badge med-discount">⚖️ 5% Discount — Standard Tier</div>
       <div style="font-size:0.72rem;color:var(--text-secondary);margin-top:4px;">Improve score to unlock better discounts.</div>`
    : `<div class="discount-badge no-discount">❌ No Discount — Under Review</div>
       <div style="font-size:0.72rem;color:var(--text-secondary);margin-top:4px;">Claims may be restricted.</div>`;
  b.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;">${html}</div>`;
  b.className = 'trust-benefit';
}

// ============================================================
// ════════════════════════════════════════════════════════════
//   CLAIMS TABLE (MockAPI → fallback)
// ════════════════════════════════════════════════════════════
// ============================================================

async function loadApiClaims() {
  const dot = document.getElementById('claimsApiDot');
  if (dot) dot.className = 'api-status-dot';
  let data = await MOCKAPI.get('claims');
  if (!Array.isArray(data) || !data.length) data = FALLBACK_CLAIMS;
  if (dot) dot.className = 'api-status-dot live';
  renderClaimsTable(data);
}

function renderClaimsTable(claims) {
  const c = document.getElementById('apiClaimsTable');
  if (!c) return;
  if (!claims || !claims.length) {
    c.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;font-size:0.8rem;">No claims data.</p>';
    return;
  }
  const smap = { Approved:'✅ Approved', Blocked:'🚫 Blocked', Review:'⚠️ Review',
                 approved:'✅ Approved', blocked:'🚫 Blocked', review:'⚠️ Review' };
  const rows = claims.map(r => {
    const sk   = (r.status||'review').toLowerCase();
    const st   = smap[r.status]||smap[sk]||'⚠️ Review';
    const fp   = r.fraudPercent||r.fraud_percent||Math.round(Math.random()*20);
    const zone = r.zone||r.location||'Unknown';
    const hrs  = r.hoursWorked??(r.hours_worked||(5+Math.round(Math.random()*6)));
    const amt  = r.amount||r.payout||0;
    const date = r.date||(r.createdAt||'').substring(0,10)||'—';
    const type = r.type||r.trigger||'Weather';
    return `<tr>
      <td>${date}</td>
      <td><strong>${zone}</strong><br><span style="font-size:0.65rem;color:var(--text-muted);">${type}</span></td>
      <td style="text-align:center;">${hrs}h</td>
      <td style="text-align:center;color:${fp>25?'var(--danger)':'var(--success)'};font-weight:700;">${fp}%</td>
      <td>${amt>0?`<span style="color:var(--success);font-weight:700;">₹${amt}</span>`:'—'}</td>
      <td><span class="status-pill ${sk}">${st}</span></td>
    </tr>`;
  }).join('');
  c.innerHTML = `<table class="claims-api-table">
    <thead><tr><th>Date</th><th>Zone/Type</th><th>Hours</th><th>Fraud%</th><th>Amount</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

// ============================================================
// ════════════════════════════════════════════════════════════
//   BOOT (Demo Login only)
// ════════════════════════════════════════════════════════════
// ============================================================

async function bootMockAPI() {
  console.log('🔌 MockAPI connecting...');
  try {
    await Promise.all([ loadApiEarnings(), loadApiClaims() ]);
    console.log('✅ MockAPI loaded');
  } catch(e) {
    console.warn('MockAPI boot partial fail:', e);
  }
}

function refreshAnalyticsData() {
  showToast('🔄 Fetching from MockAPI...', 'info');
  if (S.user.isDemo) loadApiEarnings();
  else {
    const w = generateWeekData();
    buildEarningsChart(w);
    updateAnalyticsSummaryFull(w);
  }
}

// ============================================================
// ════════════════════════════════════════════════════════════
//   SELF CLAIM PICKER
// ════════════════════════════════════════════════════════════
// ============================================================

function openSelfClaimPicker() {
  if (!S.user.isLoggedIn) { showToast('Please login first', 'warning'); return; }
  document.getElementById('selfClaimPickerOverlay').classList.add('active');
}

function closeSelfClaimPicker(e) {
  if (e.target === document.getElementById('selfClaimPickerOverlay'))
    document.getElementById('selfClaimPickerOverlay').classList.remove('active');
}

function pickAndClaim(key, title, icon) {
  // Close picker, open pipeline
  document.getElementById('selfClaimPickerOverlay').classList.remove('active');
  setTimeout(() => startClaimPipeline(key, title, icon), 200);
}

// ============================================================
// ════════════════════════════════════════════════════════════
//   CLAIM PIPELINE ENGINE
//   Works identically for BOTH normal and demo login.
//   Only the fraud score range differs.
// ════════════════════════════════════════════════════════════
// ============================================================

let _pipelineActive = false;
let _currentClaimKey = '';
let _currentClaimIsManual = false;  // set true when coming from manual/self-claim picker

function startClaimPipeline(triggerKey, triggerTitle, triggerIcon) {
  if (_pipelineActive) return;
  _pipelineActive  = true;
  _currentClaimKey = triggerKey;

  // ── Reset all step UI ──────────────────────────────────────
  for (let i = 1; i <= 4; i++) {
    const step = document.getElementById(`cpStep${i}`);
    const dot  = document.getElementById(`cpDot${i}`);
    const line = document.getElementById(`cpLine${i}`);
    const stat = document.getElementById(`cpStatus${i}`);
    const det  = document.getElementById(`cpDetail${i}`);
    if (step) step.className = 'cp-step';
    if (dot)  { dot.className = 'cp-step-dot'; dot.textContent = ''; }
    if (line) line.className = 'cp-step-line';
    if (stat) { stat.textContent = ''; stat.className = 'cp-step-status'; }
    if (det && i < 4) det.textContent = _defaultDetails[i];
  }

  // Reset fraud checks
  ['GPS','Cell','Platform'].forEach(k => {
    const ic  = document.getElementById(`cpCheck${k}Icon`);
    const val = document.getElementById(`cpCheck${k}Val`);
    if (ic)  ic.textContent  = '⏳';
    if (val) val.textContent = 'Scanning...';
  });
  const scoreEl = document.getElementById('cpFraudScoreVal');
  if (scoreEl) { scoreEl.textContent = '—'; scoreEl.className = 'cp-fraud-score-val'; }
  const fc = document.getElementById('cpFraudChecks');
  if (fc) fc.style.display = 'none';

  // Reset results
  const rs = document.getElementById('cpResultSuccess');
  const rf = document.getElementById('cpResultFail');
  if (rs) rs.style.display = 'none';
  if (rf) rf.style.display = 'none';
  const d4 = document.getElementById('cpDetail4');
  if (d4) d4.textContent = 'Awaiting fraud verification...';

  // Header
  const icon = document.getElementById('cpHeaderIcon');
  const name = document.getElementById('cpTriggerName');
  const desc = document.getElementById('cpTriggerDesc');
  if (icon) icon.textContent = triggerIcon;
  if (name) name.textContent = triggerTitle;
  if (desc) desc.textContent = _currentClaimIsManual
    ? 'Self-reported claim — fraud check mandatory'
    : 'IMD Alert – detected in your delivery zone';

  // Open modal
  document.getElementById('claimPipelineOverlay').classList.add('active');

  // Start
  runPipelineSteps();
}

const _defaultDetails = {
  1: 'Scanning IMD alerts for your zone...',
  2: 'Verifying active plan and zone eligibility...',
  3: 'Running multi-layer fraud verification...'
};

const _sleep = ms => new Promise(r => setTimeout(r, ms));

async function runPipelineSteps() {
  let backendData = null;
  let useFallback = false;

  // ── 0. ATTEMPT BACKEND FETCH ──────────────────────────────
  try {
    const payload = {
      user_id: S.user.email || "guest@fluxshield.com",
      location: { 
        lat: S.user.lat || 12.9716, 
        lng: S.user.lng || 77.5946, 
        city: S.user.location || "Bangalore" 
      },
      weather_data: {
        aqi: S.env.aqi ?? 50,
        rain: S.env.rain ?? 0,
        temp: S.env.temp ?? 30,
        time_of_day: new Date().getHours()
      },
      recent_pings: 180, 
      orders_completed: 12,
      base_income: 450.0,
      disruption_hours: 3.5
    };

    const response = await fetch(`${BACKEND_URL}/api/process-cycle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      backendData = await response.json();
      console.log("🚀 FluxShield Backend Response:", backendData);
    } else {
      useFallback = true;
    }
  } catch (e) {
    console.warn("📡 Backend offline. Running in Simulation Mode.");
    useFallback = true;
  }

  // ── STEP 1: Trigger Detected ──────────────────────────────
  await _activateStep(1, 'Scanning IMD alerts for your zone...');
  await _sleep(1400);

  let triggerMsg = "✅ Alert confirmed in your zone";
  if (!useFallback && backendData) {
    const trigger = backendData.trigger_event || {};
    triggerMsg = `✅ Alert confirmed: ${trigger.reason || 'Detected'}`;
  } else {
    triggerMsg = {
      rain:    '✅ Alert confirmed: Flood / Heavy Rain warning issued',
      heat:    '✅ Alert confirmed: Extreme Heat advisory active',
      aqi:     '✅ Alert confirmed: Unhealthy AQI advisory issued',
      flood:   '✅ Alert confirmed: Flood risk elevated in zone',
      storm:   '✅ Alert confirmed: Severe storm system detected',
      traffic: '✅ Alert confirmed: Major road blockage reported'
    }[_currentClaimKey] || '✅ Alert confirmed in your zone';
  }

  _completeStep(1, true, triggerMsg);

  // ── STEP 2: Policy Verified (and AI Risk) ─────────────────
  await _sleep(600);
  await _activateStep(2, 'Verifying active plan and zone eligibility...');
  await _sleep(1300);

  const riskScore = (!useFallback && backendData) ? backendData.ai_risk_score : (45 + Math.random() * 20);
  const riskMsg = `✅ Policy active. AI Risk Score: ${parseFloat(riskScore).toFixed(1)}%`;
  
  const hasPlan = S.policy?.active === true;
  _completeStep(2, hasPlan, riskMsg);

  // ── STEP 3: Fraud / Verification Check ───────────────────
  await _sleep(1000);
  await _activateStep(3, 'Running multi-layer fraud verification...');
  
  let fraudScore, passes, fraudMsg;

  if (!useFallback && backendData) {
    const fc = backendData.fraud_check || {};
    fraudScore = fc.fraud_score ?? 0.12;
    passes = !fc.is_fraud;
    fraudMsg = passes 
      ? `✅ PASS — AI Score ${fraudScore.toFixed(2)} (Trusted)`
      : `❌ FAIL — Score ${fraudScore.toFixed(2)} exceeds security threshold`;
  } else {
    // Original Simulation Logic
    fraudScore = _currentClaimIsManual ? parseFloat((0.15 + Math.random() * 0.65).toFixed(2)) : 0.00;
    passes = fraudScore < 0.40;
    fraudMsg = passes
      ? `✅ PASS — Score ${fraudScore.toFixed(2)} (below 0.40 threshold)`
      : `❌ FAIL — Score ${fraudScore.toFixed(2)} exceeds 0.40 threshold`;
  }

  const scoreEl = document.getElementById('cpFraudScoreVal');
  if (scoreEl) {
    const label = fraudScore < 0.40 ? 'CLEAN' : 'RISK';
    const labelCls = passes ? 'fraud-label-clean' : 'fraud-label-risk';
    scoreEl.innerHTML  = `${fraudScore.toFixed(2)} <span class="${labelCls}">${label}</span>`;
    scoreEl.className  = 'cp-fraud-score-val ' + (passes ? 'pass' : 'fail');
  }

  await _sleep(800);
  _completeStep(3, passes, fraudMsg);

  // ── STEP 4: Final Result ──────────────────────────────────
  await _sleep(700);
  await _activateStep(4, passes ? 'Calculating payout amount...' : 'Processing rejection notice...');
  await _sleep(1000);

  if (passes) {
    let payout = 0;
    let detail = 'Claim approved! Payout is ready.';
    
    if (!useFallback && backendData) {
      payout = backendData.payout?.amount_credited || 0;
      if (backendData.is_peak_hour) {
        detail = 'Claim approved! 🚀 Peak Hour Bonus applied.';
      }
    } else {
      payout = 200 + Math.floor(Math.random() * 601);
    }

    document.getElementById('cpPayoutAmount').textContent = `₹${payout}`;
    document.getElementById('cpDetail4').textContent = detail;
    document.getElementById('cpResultSuccess').style.display = '';
    document.getElementById('cpDot4').className = 'cp-step-dot done';
    document.getElementById('cpDot4').textContent = '✓';
    document.getElementById('cpStep4').className = 'cp-step done';

    // Record in history
    S.claims.payouts.unshift({
      type:   _currentClaimKey.charAt(0).toUpperCase() + _currentClaimKey.slice(1),
      amount: payout, status: 'Approved',
      date: 'Just now',
      trigger: _currentClaimIsManual ? 'Manual' : 'Auto',
      zone: S.user.location || 'Your Zone'
    });
    S.triggers.count = (S.triggers.count || 0) + 1;
    if (typeof updatePayoutUI === 'function') updatePayoutUI();
    addNotif(`💸 ₹${payout} payout approved for ${_currentClaimKey} claim!`, 'success');

  } else {
    const reason = (!useFallback && backendData) 
      ? (backendData.reason || 'Anomaly detected') 
      : 'Fraud score exceeds 0.40 threshold';
      
    document.getElementById('cpRejectReason').textContent = reason;
    document.getElementById('cpDetail4').textContent = 'Claim could not be processed.';
    document.getElementById('cpResultFail').style.display = '';
    document.getElementById('cpDot4').className  = 'cp-step-dot fail';
    document.getElementById('cpDot4').textContent = '✕';
    document.getElementById('cpStep4').className = 'cp-step done';
    addNotif(`❌ Claim rejected. Status: ${backendData?.status || 'Blocked'}`, 'warning');
  }

  _currentClaimIsManual = false; 
  _pipelineActive = false;
}

// ── Helpers ───────────────────────────────────────────────────

async function _activateStep(n, detail) {
  const step = document.getElementById(`cpStep${n}`);
  const dot  = document.getElementById(`cpDot${n}`);
  const det  = document.getElementById(`cpDetail${n}`);
  if (step) step.className = 'cp-step active';
  if (dot)  dot.className  = 'cp-step-dot loading';
  if (det)  det.textContent = detail;
  if (step) step.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function _completeStep(n, passed, statusText) {
  const dot  = document.getElementById(`cpDot${n}`);
  const line = document.getElementById(`cpLine${n}`);
  const stat = document.getElementById(`cpStatus${n}`);
  const step = document.getElementById(`cpStep${n}`);
  if (dot)  { dot.className = 'cp-step-dot ' + (passed?'done':'fail'); dot.textContent = passed?'✓':'✕'; }
  if (line) line.className  = 'cp-step-line ' + (passed?'filled':'');
  if (stat) { stat.textContent = statusText; stat.className = 'cp-step-status ' + (passed?'pass':'fail'); }
  if (step) step.className  = 'cp-step done';
}

async function _resolveCheck(key, passed, label) {
  const ic  = document.getElementById(`cpCheck${key}Icon`);
  const val = document.getElementById(`cpCheck${key}Val`);
  if (ic)  ic.textContent  = passed ? '✅' : '⚠️';
  if (val) val.textContent = label;
}

// ── Pipeline close helpers ────────────────────────────────────

function closePipelineModal() {
  document.getElementById('claimPipelineOverlay').classList.remove('active');
  _pipelineActive = false;
}

function closePipeline(e) {
  if (e.target === document.getElementById('claimPipelineOverlay')) closePipelineModal();
}

// ── UPI Payout action ─────────────────────────────────────────

function processUPIPayout() {
  const amt = document.getElementById('cpPayoutAmount')?.textContent || '₹0';
  showToast(`💸 ${amt} payment initiated to ${S.bank?.upi || 'registered UPI'}`, 'success');
  closePipelineModal();
  if (typeof goTo === 'function') goTo('claims');
}
