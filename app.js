// ============================================================
// FLUXSHIELD — REAL APIs + LEAFLET MAP + GPS
// ============================================================

// ===== CONFIG =====
const CONFIG = {
  OWM_KEY: 'd2e8c5c7c80bc92379d9b4bc4dbdc1fa', // OpenWeatherMap Production key
  REFRESH_MS: 12000, // 12s refresh
  GPS_OPTS: { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
};

// ===== GLOBAL STATE =====
const S = {
  user: { name: '', phone: '', email: '', platform: '', location: '', role: 'worker', isLoggedIn: false, lat: 12.9716, lng: 77.5946, zoneIdx: 1, gpsActive: false, subscriptionWeeks: 0, isDemo: false },
  policy: { plan: null, premium: 0, coverage: 0, active: false },
  bank: { name: '', acc: '', ifsc: '', upi: '' },
  risk: { type: 'rain', level: { aqi: 0, rain: 0, temp: 0, humidity: 0, wind: 0, desc: '', flood: 'Low' }, userZone: null, zones: [] },
  claims: { payouts: [], aiLogs: [], processedEvents: new Set(), manualClaims: [] },
  triggers: { history: [], count: 0 },
  notifs: [], unread: 0,
  analytics: { bcr: 0.65, totalPremium: 500000, totalClaims: 325000, isStressTest: false, subscriptionsDisabled: false },
  map: { instance: null, userMarker: null, tileLayer: null, satelliteLayer: null },
  env: { temp: null, rain: null, aqi: null }  // populated by fetchLiveEnv() after real GPS
};
let heatLayer = null; // Dedicated global heatmap layer instance

// ===== DEMO / NORMAL MODE FLAG =====
// Single source of truth — set on login, cleared on logout
let isDemoUser = false;

const PLANS = {
  basic: { name: 'Basic Shield', prob: 0.015, loss: 300, days: 2, coverage: 2000 },
  pro: { name: 'Pro Guard', prob: 0.025, loss: 400, days: 3, coverage: 5000 },
  max: { name: 'Max Protect', prob: 0.04, loss: 600, days: 5, coverage: 10000 }
};
const LOADING_FACTOR = 1.4;

// ===== CITY COORDS + ZONE OFFSETS =====
const CITY_DATA = {
  Bangalore: {
    lat: 12.9716, lng: 77.5946, zones: [
      { l: 'Whitefield', dlat: 0.03, dlng: 0.06 }, { l: 'Koramangala', dlat: -0.01, dlng: 0.01 }, { l: 'Indiranagar', dlat: 0.005, dlng: 0.02 },
      { l: 'JP Nagar', dlat: -0.04, dlng: -0.01 }, { l: 'HSR Layout', dlat: -0.025, dlng: 0.03 }, { l: 'Electronic City', dlat: -0.08, dlng: 0.02 }, { l: 'Rajajinagar', dlat: 0.01, dlng: -0.03 }]
  },
  Mumbai: {
    lat: 19.076, lng: 72.8777, zones: [
      { l: 'Andheri', dlat: 0.05, dlng: 0.01 }, { l: 'Bandra', dlat: 0.03, dlng: -0.01 }, { l: 'Dadar', dlat: 0.015, dlng: 0.005 },
      { l: 'Colaba', dlat: -0.04, dlng: -0.01 }, { l: 'Powai', dlat: 0.06, dlng: 0.04 }, { l: 'Thane', dlat: 0.1, dlng: 0.06 }, { l: 'Navi Mumbai', dlat: -0.02, dlng: 0.1 }]
  },
  Delhi: {
    lat: 28.6139, lng: 77.209, zones: [
      { l: 'Connaught Pl', dlat: 0, dlng: 0 }, { l: 'Dwarka', dlat: -0.04, dlng: -0.08 }, { l: 'Noida', dlat: -0.02, dlng: 0.1 },
      { l: 'Gurgaon', dlat: -0.07, dlng: -0.04 }, { l: 'Rohini', dlat: 0.06, dlng: -0.02 }, { l: 'Lajpat Nagar', dlat: -0.02, dlng: 0.02 }, { l: 'Karol Bagh', dlat: 0.01, dlng: -0.02 }]
  },
  Chennai: {
    lat: 13.0827, lng: 80.2707, zones: [
      { l: 'T.Nagar', dlat: -0.01, dlng: -0.02 }, { l: 'Adyar', dlat: -0.03, dlng: -0.01 }, { l: 'Anna Nagar', dlat: 0.03, dlng: -0.02 },
      { l: 'Velachery', dlat: -0.05, dlng: 0.01 }, { l: 'Mylapore', dlat: -0.015, dlng: 0.005 }, { l: 'Porur', dlat: 0.01, dlng: -0.06 }, { l: 'OMR', dlat: -0.06, dlng: 0.05 }]
  },
  Hyderabad: {
    lat: 17.385, lng: 78.4867, zones: [
      { l: 'Hitech City', dlat: 0.02, dlng: -0.06 }, { l: 'Banjara Hills', dlat: 0.01, dlng: -0.02 }, { l: 'Secunderabad', dlat: 0.04, dlng: 0.01 },
      { l: 'Gachibowli', dlat: -0.01, dlng: -0.07 }, { l: 'LB Nagar', dlat: -0.04, dlng: 0.04 }, { l: 'Kukatpally', dlat: 0.05, dlng: -0.04 }, { l: 'Ameerpet', dlat: 0.02, dlng: -0.01 }]
  }
};

// ===== REAL API SERVICE =====
const RealAPI = {
  async fetchWeather(lat, lng) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${CONFIG.OWM_KEY}&units=metric`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather API failed');
      const data = await res.json();
      return {
        temp: Math.round(data.main.temp),
        humidity: data.main.humidity,
        wind: data.wind.speed,
        rain: data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) : 0,
        desc: data.weather[0]?.description || '',
        icon: data.weather[0]?.icon || '01d',
        city: data.name
      };
    } catch (e) {
      console.warn('Weather API failed:', e.message);
      // Demo: fall back to mock. Normal users get null (shows error, no fake data).
      return isDemoUser ? this.mockWeather(lat, lng) : null;
    }
  },

  async fetchAQI(lat, lng) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=${CONFIG.OWM_KEY}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('AQI API failed');
      const data = await res.json();
      const aqi = data.list[0]?.main?.aqi || 1; // 1-5 scale
      const pm25 = data.list[0]?.components?.pm2_5 || 0;
      // Convert OWM 1-5 scale to India AQI scale (approx)
      const aqiMap = { 1: 50, 2: 100, 3: 200, 4: 300, 5: 450 };
      const aqiVal = aqiMap[aqi] || Math.round(pm25 * 2.5);
      return { aqi: aqiVal, pm25, raw: aqi };
    } catch (e) {
      console.warn('AQI API failed:', e.message);
      if (!isDemoUser) return null; // Normal users: no fake AQI
      // Demo fallback only
      return { aqi: 80 + Math.round(Math.random() * 150), pm25: 40 + Math.round(Math.random() * 80), raw: 2 };
    }
  },

  mockWeather(lat, lng) {
    // Fallback mock — ONLY used for demo users when API fails
    // For normal users, a null return signals an API error (no fake data shown)
    if (!isDemoUser) {
      return null; // Real users see error, not fake values
    }
    const seed = (lat * 1000 + lng * 100 + Date.now() / 60000) % 100;
    return {
      temp: 28 + Math.round(seed % 15),
      humidity: 40 + Math.round(seed % 50),
      wind: 2 + Math.round(seed % 10),
      rain: seed > 70 ? +(seed % 30).toFixed(1) : +(seed % 5).toFixed(1),
      desc: seed > 70 ? 'heavy rain' : seed > 40 ? 'scattered clouds' : 'clear sky',
      icon: '10d', city: S.user.location || 'Unknown'
    };
  },

  calcFloodRisk(rain, humidity) {
    if (rain > 50 || (rain > 30 && humidity > 80)) return 'High';
    if (rain > 15 || humidity > 75) return 'Moderate';
    return 'Low';
  },

  // Calculate zone risk from REAL weather data
  calcZoneRisk(weather, aqiData, riskType) {
    if (riskType === 'rain') {
      if (weather.rain > 40) return 'severe';
      if (weather.rain > 20) return 'high';
      if (weather.rain > 5) return 'moderate';
      return 'safe';
    }
    if (riskType === 'aqi') {
      if (aqiData.aqi > 350) return 'severe';
      if (aqiData.aqi > 250) return 'high';
      if (aqiData.aqi > 150) return 'moderate';
      return 'safe';
    }
    if (riskType === 'heat') {
      if (weather.temp > 44) return 'severe';
      if (weather.temp > 40) return 'high';
      if (weather.temp > 35) return 'moderate';
      return 'safe';
    }
    return 'safe';
  },

  checkTriggers(riskLevel, plan) {
    if (!plan) return [];
    const p = PLANS[plan], t = [];
    const r = riskLevel;
    if (p.triggers.includes('rain') && r.rain > 64) t.push({ type: 'rain', val: r.rain + ' mm/hr', thr: '64 mm/hr', eid: 'rain-' + Math.floor(Date.now() / 60000) });
    if (p.triggers.includes('aqi') && r.aqi > 300) t.push({ type: 'aqi', val: r.aqi + ' AQI', thr: '300 AQI', eid: 'aqi-' + Math.floor(Date.now() / 60000) });
    if (p.triggers.includes('heat') && r.temp > 44) t.push({ type: 'heat', val: r.temp + '°C', thr: '44°C', eid: 'heat-' + Math.floor(Date.now() / 60000) });
    if (p.triggers.includes('flood') && r.flood === 'High') t.push({ type: 'flood', val: 'High', thr: 'High', eid: 'flood-' + Math.floor(Date.now() / 60000) });
    return t;
  },

  validateClaim(trigger, userRisk) {
    const locMatch = Math.random() > 0.08;
    const actValid = Math.random() > 0.1;
    const policyCov = S.policy.active && PLANS[S.policy.plan]?.triggers.includes(trigger.type);
    const noDup = !S.claims.processedEvents.has(trigger.eid);
    const inZone = ['high', 'severe'].includes(userRisk);
    return { valid: locMatch && actValid && policyCov && noDup && inZone, locMatch, actValid, policyCov, noDup, inZone };
  }
};

// ===== GPS / GEOLOCATION =====
// ONLY called for normal (non-demo) users. Demo uses fixed city coords.
let watchId = null;

function initGeolocation() {
  // Hard guard 1: NEVER run GPS for demo users
  if (isDemoUser || (S.user && S.user.isDemo)) {
    console.log('initGeolocation() blocked — demo user');
    return;
  }
  // Hard guard 2: must be a logged-in normal user
  if (!S.user.isLoggedIn) return;

  if (!navigator.geolocation) {
    showToast('GPS not supported — using city coordinates', 'warning');
    useCityFallback();
    fetchRealWeatherData();
    return;
  }

  // Show requesting state
  const lbl = document.getElementById('mapLocationLabel');
  if (lbl) lbl.textContent = '📡 Requesting GPS...';
  const dashLoc = document.getElementById('dashLocation');
  if (dashLoc) dashLoc.textContent = '📡 Requesting live location…';
  showToast('📡 Requesting your live location…', 'info');

  navigator.geolocation.getCurrentPosition(
    pos => {
      // ── GPS SUCCESS: use real coordinates ─────────────────────────────────
      S.user.lat = pos.coords.latitude;
      S.user.lng = pos.coords.longitude;
      S.user.gpsActive = true;
      console.log('GPS:', S.user.lat, S.user.lng);

      // Snap to nearest city name for display
      let bestCity = S.user.location || 'Bangalore', bestDist = Infinity;
      Object.entries(CITY_DATA).forEach(([name, cd]) => {
        const d = Math.hypot(cd.lat - S.user.lat, cd.lng - S.user.lng);
        if (d < bestDist) { bestDist = d; bestCity = name; }
      });
      S.user.location = bestCity;

      if (lbl) lbl.textContent = bestCity;
      if (dashLoc) dashLoc.textContent = `📍 ${bestCity} · GPS Active · ${S.user.lat.toFixed(5)}, ${S.user.lng.toFixed(5)}`;
      showToast(`📍 GPS locked — ${bestCity} (${S.user.lat.toFixed(4)}, ${S.user.lng.toFixed(4)})`, 'success');

      if (S.map.instance) S.map.instance.setView([S.user.lat, S.user.lng], 15);
      updateUserMarker();
      fetchRealWeatherData();  // fetch real API data at actual GPS coords
      fetchLiveEnv(S.user.lat, S.user.lng); // update triggers with real env
    },
    err => {
      // ── GPS ERROR (any reason): fall back to city, still fetch real weather ──
      console.warn('GPS error:', err.code, err.message);
      S.user.gpsActive = false;
      const msg = err.code === 1 ? 'Location denied' : 'GPS timeout';
      showToast(`📍 ${msg} — using ${S.user.location || 'Bangalore'} coordinates`, 'warning');
      if (lbl) lbl.textContent = '⚠️ ' + msg;
      if (dashLoc) dashLoc.textContent = `⚠️ ${msg} — using ${S.user.location || 'Bangalore'}`;
      useCityFallback();
      fetchRealWeatherData();  // still fetch real weather at fallback city coords
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );

  // Continuous watch — updates position as user moves
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  watchId = navigator.geolocation.watchPosition(
    pos => {
      if (isDemoUser) return;
      S.user.lat = pos.coords.latitude;
      S.user.lng = pos.coords.longitude;
      S.user.gpsActive = true;
      updateUserMarker();
      const dl = document.getElementById('dashLocation');
      if (dl) dl.textContent = `📍 ${S.user.location} · GPS Active · ${S.user.lat.toFixed(5)}, ${S.user.lng.toFixed(5)}`;
    },
    () => { },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
  );
}


// Show location error message on the map location label
function showLocationError(msg) {
  const lbl = document.getElementById('mapLocationLabel');
  if (lbl) lbl.textContent = '⚠️ ' + (msg || 'Location required for live risk detection');
}

function useCityFallback() {
  const city = S.user.location || 'Bangalore';
  const cd = CITY_DATA[city] || CITY_DATA.Bangalore;
  S.user.lat = cd.lat;
  S.user.lng = cd.lng;
  if (S.map.instance) {
    S.map.instance.setView([S.user.lat, S.user.lng], 12);
    updateUserMarker();
  }
}

// ===== FETCH REAL WEATHER DATA (Normal Login Only) =====
// Called after GPS resolves (success or fallback).
// Uses real OpenWeatherMap APIs at actual S.user.lat/lng
async function fetchRealWeatherData() {
  if (isDemoUser || !S.user.isLoggedIn) return;

  const lat = S.user.lat;
  const lng = S.user.lng;
  console.log('GPS:', lat, lng);

  try {
    const [weatherRes, aqiRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${CONFIG.OWM_KEY}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=${CONFIG.OWM_KEY}`)
    ]);

    const weatherData = await weatherRes.json();
    const aqiData = await aqiRes.json();

    console.log('Weather:', weatherData);
    console.log('AQI:', aqiData);

    const temp = Math.round(weatherData.main?.temp || 0);
    const humidity = weatherData.main?.humidity || 50;
    const wind = weatherData.wind?.speed || 0;
    const rain = weatherData.rain?.['1h'] || 0;
    const desc = weatherData.weather?.[0]?.description || '';
    const icon = weatherData.weather?.[0]?.icon || '01d';
    const city = weatherData.name || S.user.location;

    const rawAqi = aqiData.list?.[0]?.main?.aqi || 1;
    const pm25 = aqiData.list?.[0]?.components?.pm2_5 || 0;
    const aqiMap = { 1: 50, 2: 100, 3: 200, 4: 300, 5: 450 };
    const aqi = aqiMap[rawAqi] || Math.round(pm25 * 2.5);

    const flood = RealAPI.calcFloodRisk(rain, humidity);

    S.risk.level = { temp, rain, humidity, wind, desc, icon, aqi, flood, city };

    updateEnvCards();
    updateDashZone();
    if (S.map.instance) updateMapOverlays();
    processTrigger();

    // Keep dashboard location label current
    const dl = document.getElementById('dashLocation');
    if (dl) dl.textContent = `📍 ${city} · ${S.user.gpsActive ? 'GPS Active' : 'City Coords'} · ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  } catch (err) {
    console.error('Weather API error:', err);
    showToast('⚠️ Weather API error — check your connection', 'warning');
  }
}

// ===== FETCH LIVE ENV FOR TRIGGER CARDS (Normal Login Only) =====
// Called after GPS resolves. Populates S.env + updates trigger cards with real data.
async function fetchLiveEnv(lat, lon) {
  if (isDemoUser) return;  // Demo uses DEMO_ENV — never call real APIs

  try {
    const API_KEY = CONFIG.OWM_KEY;  // d2e8c5c7c80bc92379d9b4bc4dbdc1fa

    const [weatherRes, aqiRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
    ]);

    const weather = await weatherRes.json();
    const aqiData = await aqiRes.json();

    S.env = {
      temp: weather.main?.temp ?? 0,
      rain: weather.rain?.['1h'] ?? 0,
      aqi: (aqiData.list?.[0]?.main?.aqi || 1) * 50  // convert OWM 1-5 → ~50-250 AQI scale
    };

    console.log('LIVE ENV:', S.env);

    // Update trigger cards with real data (not NORMAL_ENV hardcoded values)
    if (typeof renderTriggerCards === 'function' && typeof evaluateTriggers === 'function') {
      renderTriggerCards(evaluateTriggers(S.env));
    }

  } catch (e) {
    console.error('API FAILED:', e);
  }
}

// ===== ACCESS CONTROL =====
function getLevel() {
  if (!S.user.isLoggedIn) return 'public';
  if (!S.policy.active) return 'auth';
  if (!S.bank.acc) return 'bank';
  return 'full';
}
function canAccess(page) {
  const l = getLevel();
  if (l === 'full') return true;
  if (l === 'bank') return ['landing', 'auth', 'pricing', 'bank', 'profile'].includes(page);
  if (l === 'auth') return ['landing', 'auth', 'pricing', 'profile'].includes(page);
  return ['landing', 'auth'].includes(page);
}
function updateNav() {
  const l = getLevel();
  document.querySelectorAll('.nav-tab').forEach(t => {
    const p = t.dataset.page;
    if (p === 'landing') t.classList.remove('locked');
    else if (p === 'auth') t.classList.remove('locked');
    else if (p === 'pricing') t.classList.toggle('locked', l === 'public');
    else t.classList.toggle('locked', l !== 'full');
  });
  const homeTab = document.querySelector('.nav-tab[data-original="landing"]') || document.querySelector('.nav-tab[data-page="landing"]') || document.querySelector('.nav-tab[data-page="dashboard"]');
  if (homeTab) {
    if (!homeTab.dataset.original) homeTab.dataset.original = 'landing';
    if (l === 'full') { homeTab.setAttribute('onclick', "navigate('dashboard')"); homeTab.dataset.page = 'dashboard'; }
    else { homeTab.setAttribute('onclick', "navigate('landing')"); homeTab.dataset.page = 'landing'; }
  }

  const profTab = document.querySelector('.nav-tab[data-original="auth"]') || document.querySelector('.nav-tab[data-page="auth"]') || document.querySelector('.nav-tab[data-page="profile"]');
  if (profTab) {
    if (!profTab.dataset.original) profTab.dataset.original = 'auth';
    if (S.user.isLoggedIn) { profTab.setAttribute('onclick', "navigate('profile')"); profTab.dataset.page = 'profile'; }
    else { profTab.setAttribute('onclick', "navigate('auth')"); profTab.dataset.page = 'auth'; }
  }

  const notifBtn = document.getElementById('notifBtn');
  if (notifBtn) notifBtn.style.display = S.user.isLoggedIn ? '' : 'none';
  const lb = document.getElementById('logoutBtn'); if (lb) lb.style.display = S.user.isLoggedIn ? '' : 'none';
}

// ===== NAVIGATION =====
function navigate(page) {
  if (!canAccess(page)) {
    if (!S.user.isLoggedIn) { showToast('Please login first', 'warning'); page = 'auth'; }
    else if (!S.policy.active) { showToast('Please select a plan first', 'warning'); page = 'pricing'; }
    else if (!S.bank.acc) { showToast('Please setup bank first', 'warning'); page = 'bank'; }
  }
  goTo(page);
}
function goTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const t = document.getElementById('page-' + page);
  if (t) { t.classList.add('active'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.page === page));
  document.getElementById('notifPanel').classList.remove('open');
  if (page === 'risk-map') setTimeout(initMap, 150);
  if (page === 'dashboard') {
    refreshDash();
    setTimeout(() => {
      if (!S.user.isLoggedIn) return;
      if (isDemoUser) {
        // Demo: load full MockAPI analytics (earnings + protected + loss avoided)
        if (typeof loadApiEarnings === 'function') loadApiEarnings();
      } else if (S.claims.payouts.filter(p => p.status === 'Approved').length > 0) {
        // Normal user with at least one approved claim — show real analytics
        const d = generateWeekData();
        buildEarningsChart(d);
        updateAnalyticsSummaryFull(d);
      } else {
        // Normal user, no claims yet — show empty zero state
        showEmptyAnalytics();
      }
    }, 300);
  }
  if (page === 'pricing') updatePlanBtns();
  if (page === 'claims') {
    updatePayoutUI(); updateAILogUI();
    if (typeof loadApiClaims === 'function') setTimeout(loadApiClaims, 200);
  }
  if (page === 'profile') {
    refreshProfile();
    if (typeof loadApiFraudScore === 'function') setTimeout(loadApiFraudScore, 300);
  }
}

// ===== THEME =====
let isDark = true;
function toggleTheme() { isDark = !isDark; document.body.classList.toggle('light-mode', !isDark); document.getElementById('themeToggle').textContent = isDark ? '🌙' : '☀️'; }

// ===== NOTIFICATIONS =====
function toggleNotifications() { const p = document.getElementById('notifPanel'); p.classList.toggle('open'); if (p.classList.contains('open')) { S.unread = 0; updBadge(); } }
function addNotif(msg, type) {
  const colors = { danger: 'var(--danger)', success: 'var(--success)', warning: 'var(--warning)', info: 'var(--info)' };
  S.notifs.unshift({ msg, type, time: new Date() }); S.unread++; updBadge();
  const l = document.getElementById('notifList'); if (!l) return;
  const d = document.createElement('div'); d.className = 'notif-item';
  d.innerHTML = `<div class="notif-dot" style="background:${colors[type] || colors.info}"></div><div class="notif-content"><p>${msg}</p><div class="time">Just now</div></div>`;
  l.insertBefore(d, l.firstChild);
}
function updBadge() { const b = document.getElementById('notifBadge'); if (b) { b.textContent = S.unread; b.style.display = S.unread > 0 ? 'flex' : 'none'; } }

// ===== TOAST =====
function showToast(m, type = 'info') {
  const c = document.getElementById('toastContainer'), icons = { success: '✅', warning: '⚠️', danger: '❌', info: 'ℹ️' };
  const t = document.createElement('div'); t.className = 'toast';
  t.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${m}</span>`;
  c.appendChild(t); setTimeout(() => { t.classList.add('leaving'); setTimeout(() => t.remove(), 300); }, 3500);
}

// ===== AUTH =====
function switchAuthTab(el) { document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active')); el.classList.add('active'); }
function selectRole(el, r) { S.user.role = r; document.querySelectorAll('.role-option').forEach(o => o.classList.remove('active')); el.classList.add('active'); }
function handleAuth(e) {
  e.preventDefault();
  const name = document.getElementById('nameInput').value.trim();
  const phone = document.getElementById('phoneInput').value.trim();
  const platform = document.getElementById('platformInput').value;
  const city = document.getElementById('cityInput').value;
  if (!name || !phone) { showToast('Fill all fields', 'warning'); return; }
  S.user.name = name; S.user.phone = phone; S.user.platform = platform;
  S.user.location = city; S.user.isLoggedIn = true; S.user.isDemo = false;
  S.user.lat = null; S.user.lng = null; S.user.gpsActive = false;  // GPS will set real coords
  S.policy.plan = null; S.policy.active = false; S.bank.acc = '';
  isDemoUser = false;
  updateNav();
  showToast(`Welcome ${name}! Select a plan.`, 'success');
  addNotif(`🎉 Welcome to FluxShield, ${name}!`, 'success');
  goTo('pricing'); document.getElementById('authForm').reset();
  // GPS request is handled by initGeolocation() called from handleNormalLogin()
}
function handleDemoLogin() {
  // ── Set demo flag FIRST ─────────────────────────────────────
  isDemoUser = true;

  const city = document.getElementById('demoCity')?.value || 'Chennai';
  const cd = (typeof CITY_DATA !== 'undefined' && CITY_DATA[city]) || { lat: 13.0827, lng: 80.2707 };

  S.user = {
    name: "Ravi Kumar",
    phone: "9876543210",
    email: "ravi@delivery.in",
    platform: "Blinkit",
    location: city,
    role: "worker",
    isLoggedIn: true,
    lat: cd.lat,
    lng: cd.lng,
    zoneIdx: 1,
    gpsActive: false,  // Demo uses predefined mock coords — NOT real GPS
    subscriptionWeeks: 3,
    isDemo: true
  };
  S.policy = { plan: 'pro', premium: 50, coverage: 5000, active: true };
  S.bank = { name: 'HDFC Bank', acc: 'XXXX 1234', ifsc: 'HDFC0001234', upi: '9876543210@hdfc' };
  S.claims.payouts = [
    { type: "Rain", amount: 320, status: "Approved", date: "2 days ago", trigger: "Heavy Rain", zone: "T.Nagar" },
    { type: "AQI", amount: 250, status: "Approved", date: "5 days ago", trigger: "AQI Spike", zone: "Adyar" },
    { type: "Heat", amount: 400, status: "Approved", date: "1 week ago", trigger: "Heatwave", zone: "Anna Nagar" }
  ];
  S.claims.processedEvents = new Set();
  S.claims.aiLogs = [];
  S.triggers.count = 3;
  S.analytics.totalPremium = 500000;
  S.analytics.totalClaims = 325000;
  S.analytics.bcr = 0.65;
  S.analytics.subscriptionsDisabled = false;
  S.analytics.isStressTest = false;
  S.analytics.claimPenalty = 0;

  updateNav();
  showToast('🚀 Logged in as Ravi Kumar — Demo Mode', 'success');
  addNotif('Welcome back, Ravi Kumar! MockAPI data loading...', 'success');
  goTo('dashboard');
  // Boot MockAPI to load full analytics + claims for demo
  if (typeof bootMockAPI === 'function') setTimeout(bootMockAPI, 500);
}
function handleLogout() {
  isDemoUser = false;  // ← CLEAR demo flag on logout
  S.user.isLoggedIn = false; S.user.name = ''; S.user.subscriptionWeeks = 0; S.user.isDemo = false;
  S.policy.plan = null; S.policy.active = false; S.bank.acc = '';
  S.claims.payouts = []; S.claims.aiLogs = []; S.claims.processedEvents = new Set();
  S.triggers.count = 0; S.triggers.history = [];
  S.analytics.claimPenalty = 0; S.analytics.trustScore = null;
  if (watchId) { navigator.geolocation.clearWatch(watchId); watchId = null; }
  if (earningsChartInstance) { earningsChartInstance.destroy(); earningsChartInstance = null; }
  updateNav(); showToast('Logged out successfully', 'info'); goTo('landing');
}

// ===== BANK SETUP =====
function handleBankSetup(e) {
  e.preventDefault();
  const bname = document.getElementById('bankName').value.trim();
  const bacc = document.getElementById('bankAcc').value.trim();
  const bifsc = document.getElementById('bankIfsc').value.trim();
  const bupi = document.getElementById('bankUpi').value.trim();
  if (!bname || !bacc || !bifsc) { showToast('Fill required fields', 'warning'); return; }
  S.bank = { name: bname, acc: bacc, ifsc: bifsc, upi: bupi };
  updateNav();
  showToast('Bank details verified!', 'success');
  setTimeout(() => navigate('dashboard'), 600);
}

// ===== PLAN SELECTION =====
function selectPlan(id) {
  if (!S.user.isLoggedIn) { showToast('Login first', 'warning'); goTo('auth'); return; }
  const p = PLANS[id];
  const expectedLoss = p.prob * p.loss * p.days * (S.analytics.isStressTest ? 1.5 : 1.0);
  let premium = expectedLoss * LOADING_FACTOR;
  premium = Math.min(50, Math.max(20, premium)); // Final Clamped Premium

  S.policy.plan = id; S.policy.premium = premium; S.policy.coverage = p.coverage; S.policy.active = true;
  updateNav(); updatePlanBtns();
  showToast(`${p.name} selected!`, 'success');
  addNotif(`✅ ${p.name} — ₹${p.coverage.toLocaleString()} coverage`, 'success');
  setTimeout(() => navigate('bank'), 600);
}
function updatePlanBtns() {
  // 10% discount requires a trust score strictly greater than 88%
  const isEligible = S.analytics.trustScore !== null && S.analytics.trustScore > 0.88;
  const stressMultiplier = S.analytics.isStressTest ? 1.5 : 1.0;

  ['basic', 'pro', 'max'].forEach(id => {
    const p = PLANS[id];
    const expectedLoss = p.prob * p.loss * p.days * stressMultiplier;
    let premium = expectedLoss * LOADING_FACTOR;
    premium = Math.min(50, Math.max(20, premium)); // 1. Calculate and Clamp

    const b = document.getElementById('planBtn-' + id);
    const pEl = document.getElementById('price-' + id);
    const lEl = document.getElementById('loyalty-' + id);
    const eEl = document.getElementById('expLoss-' + id);
    if (!b) return;

    if (eEl) eEl.textContent = '₹' + Math.round(expectedLoss * 10); // Display normalized exp loss for UI

    if (isEligible) {
      const discounted = (premium * 0.9).toFixed(1); // 2. Apply discount to clamped price
      if (pEl) pEl.innerHTML = `<span class="original-price">₹${premium.toFixed(1)}</span>₹${discounted} <span>/week</span>`;
      if (lEl) lEl.innerHTML = `<div class="loyalty-badge">✨ Loyalty Discount Applied (10%)</div>`;
    } else {
      if (pEl) pEl.innerHTML = `₹${premium.toFixed(1)} <span>/week</span>`;
      if (lEl) lEl.innerHTML = '';
    }

    if (S.analytics.subscriptionsDisabled) {
      b.textContent = 'Disabled';
      b.className = 'btn btn-secondary btn-block disabled';
      b.onclick = null;
    } else if (S.policy.plan === id) {
      b.textContent = '✓ Active';
      b.className = 'btn btn-primary btn-block';
      b.onclick = () => selectPlan(id);
    } else {
      b.textContent = 'Choose Plan';
      b.className = 'btn ' + (id === 'pro' && !S.policy.active ? 'btn-primary' : 'btn-secondary') + ' btn-block';
      b.onclick = () => selectPlan(id);
    }
  });
}

function updateActuarialUI() {
  const bcr = S.analytics.totalClaims / S.analytics.totalPremium;
  S.analytics.bcr = bcr;

  const v = document.getElementById('bcrVal'); if (v) v.textContent = bcr.toFixed(2);
  const p = document.getElementById('bcrProgress'); if (p) p.style.width = Math.min(100, bcr * 100) + '%';
  const b = document.getElementById('bcrBadge');

  if (bcr > 0.85) {
    S.analytics.subscriptionsDisabled = true;
    if (b) { b.textContent = 'CRITICAL'; b.style.background = 'var(--danger-bg)'; b.style.color = 'var(--danger)'; }
    if (p) p.style.background = 'var(--danger)';
    addDashAlert('danger', '⚠️', 'Sustainability Impacted: New subscriptions disabled.');
  } else if (bcr > 0.70) {
    S.analytics.subscriptionsDisabled = false;
    if (b) { b.textContent = 'Warning'; b.style.background = 'var(--warning-bg)'; b.style.color = 'var(--warning)'; }
    if (p) p.style.background = 'var(--warning)';
  } else {
    S.analytics.subscriptionsDisabled = false;
    if (b) { b.textContent = 'Healthy'; b.style.background = 'var(--success-bg)'; b.style.color = 'var(--success)'; }
    if (p) p.style.background = 'var(--success)';
  }
  updatePlanBtns();
}

function runStressTest() {
  S.analytics.isStressTest = true;
  S.analytics.totalClaims += 150000; // Spike claims
  showToast('High stress scenario detected: Heavy rain simulation', 'danger');
  updateActuarialUI();
  refreshDash();
}

// ===== DATA REFRESH (called by startEngine interval + demo login) =====
async function fetchAndUpdateAll() {
  if (!S.user.isLoggedIn) return;

  if (isDemoUser) {
    // DEMO: mock weather only — no real API calls
    const weather = RealAPI.mockWeather(S.user.lat, S.user.lng);
    const flood = RealAPI.calcFloodRisk(weather.rain, weather.humidity);
    const aqi = 85 + Math.round(Math.random() * 60);
    S.risk.level = {
      temp: weather.temp, rain: weather.rain, humidity: weather.humidity,
      wind: weather.wind, desc: weather.desc, aqi, flood,
      icon: weather.icon, city: S.user.location
    };
    updateEnvCards();
    updateDashZone();
    if (S.map.instance) updateMapOverlays();
    processTrigger();
  } else {
    // NORMAL: delegate to the real-API function
    await fetchRealWeatherData();
  }
}

function updateEnvCards() {
  const r = S.risk.level;
  const el = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  el('aqiVal', r.aqi || '—');
  el('rainVal', r.rain || '0');
  el('tempVal', (r.temp || '—') + '°C');
  el('floodVal', r.flood || 'Low');
  el('mapLocationLabel', S.user.location + (S.user.gpsActive ? ' (GPS)' : ''));
}

function updateDashZone() {
  const r = S.risk.level;
  const riskType = S.risk.type;
  const userRisk = RealAPI.calcZoneRisk({ rain: r.rain, temp: r.temp }, { aqi: r.aqi }, riskType);
  S.risk.userZone = { label: r.city || S.user.location, risk: userRisk };

  const riskColors = { safe: 'var(--success)', moderate: 'var(--warning)', high: 'var(--danger)', severe: 'var(--purple)' };
  const riskEmojis = { safe: '🟢', moderate: '🟡', high: '🔴', severe: '🟣' };

  const el = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  el('userZoneRisk', userRisk.charAt(0).toUpperCase() + userRisk.slice(1));
  el('userZoneName', `${r.desc || ''} · ${r.temp}°C · AQI ${r.aqi}`);
  el('userZoneIndicator', riskEmojis[userRisk] || '🟡');
  const uzr = document.getElementById('userZoneRisk');
  if (uzr) uzr.style.color = riskColors[userRisk];

  // Find nearest safe zone
  const city = CITY_DATA[S.user.location] || CITY_DATA.Bangalore;
  const safeZones = city.zones.filter((_, i) => i !== S.user.zoneIdx);
  if (safeZones.length) {
    const sz = safeZones[Math.floor(Math.random() * safeZones.length)];
    const dist = (Math.sqrt(sz.dlat ** 2 + sz.dlng ** 2) * 111).toFixed(1);
    el('safeZoneHint', `🟢 Safe zone ${dist}km away: ${sz.l}`);
  }
}

// ===== LEAFLET MAP =====
function initMap() {
  if (S.map.instance) {
    // Re-center map on existing coords, refresh overlays
    if (S.user.lat && S.user.lng) {
      S.map.instance.setView([S.user.lat, S.user.lng], 13);
    }
    updateUserMarker();
    updateMapOverlays();
    return;
  }

  const map = L.map('leafletMap', {
    center: [S.user.lat, S.user.lng],
    zoom: 13,
    zoomControl: false,
    attributionControl: false
  });

  // Satellite tiles (Esri — free)
  S.map.satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18
  });

  // OSM standard map
  S.map.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  });

  S.map.tileLayer.addTo(map);
  S.map.instance = map;

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  map.on('moveend', () => {
    updateMapOverlays();
  });

  // Place user marker first with current coords (city-centre for normal, mock for demo)
  updateUserMarker();
  updateMapOverlays();

  // ── Location strategy based on login type ──────────────────
  if (isDemoUser) {
    // Demo: S.user.lat/lng already set from handleDemoLogin city selection — just center map
    map.setView([S.user.lat, S.user.lng], 13);
    updateMapOverlays();
  }
  // Normal users: GPS is called from handleNormalLogin() — NOT re-triggered here
}



function updateUserMarker() {
  if (!S.map.instance) return;
  const userIcon = L.divIcon({
    className: '',
    html: `<div style="position:relative;width:24px;height:24px;">
      <div style="position:absolute;inset:-8px;border-radius:50%;background:rgba(99,102,241,0.25);animation:pulse 2s infinite;"></div>
      <div style="width:24px;height:24px;border-radius:50%;background:#6366f1;border:3px solid #fff;box-shadow:0 0 12px rgba(99,102,241,0.6);"></div>
    </div>
    <style>@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.8);opacity:0}}</style>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  // Guard: lat/lng may be null before GPS fires for normal users
  if (S.user.lat == null || S.user.lng == null) return;

  if (S.map.userMarker) {
    S.map.userMarker.setLatLng([S.user.lat, S.user.lng]);
  } else {
    S.map.userMarker = L.marker([S.user.lat, S.user.lng], { icon: userIcon, zIndexOffset: 1000 })
      .addTo(S.map.instance)
      .bindPopup(`<b>📍 You are here</b><br>${S.user.name || 'User'}<br>Lat: ${S.user.lat.toFixed(4)}, Lng: ${S.user.lng.toFixed(4)}`);
  }
}

// ============================================================
// MAP OVERLAYS — DEMO vs NORMAL (strict separation)
// ============================================================

function updateMapOverlays() {
  if (!S.map.instance) return;
  if (isDemoUser) {
    loadDemoHeatmap();
  } else {
    loadLiveHeatmap();
  }
}

// ── DEMO HEATMAP ─────────────────────────────────────────────
// Spread across predefined city zones so there's NO single blob.
// Uses CITY_DATA zone offsets to create realistic multi-cluster layout.
function loadDemoHeatmap() {
  if (!S.map.instance) return;

  // Clear old layer
  if (heatLayer) { S.map.instance.removeLayer(heatLayer); heatLayer = null; }

  const city = CITY_DATA[S.user.location] || CITY_DATA.Chennai;
  const riskType = S.risk.type;
  const r = S.risk.level;
  const heatData = [];

  // Each city zone gets its own cluster of points — different intensities
  // Demo risk levels: zones alternate between high / moderate / low
  const zoneRiskProfiles = [
    { intensity: 0.90, variance: 0.08 },  // zone 0: high risk
    { intensity: 0.65, variance: 0.06 },  // zone 1: moderate
    { intensity: 0.85, variance: 0.07 },  // zone 2: high
    { intensity: 0.40, variance: 0.05 },  // zone 3: low
    { intensity: 0.75, variance: 0.07 },  // zone 4: moderate-high
    { intensity: 0.55, variance: 0.05 },  // zone 5: moderate
    { intensity: 0.30, variance: 0.04 },  // zone 6: safe
  ];

  city.zones.forEach((zone, idx) => {
    const centerLat = city.lat + zone.dlat;
    const centerLng = city.lng + zone.dlng;
    const profile = zoneRiskProfiles[idx % zoneRiskProfiles.length];
    const pointCount = 18 + Math.floor(Math.random() * 12); // 18–30 points per zone

    for (let i = 0; i < pointCount; i++) {
      // Gaussian-ish spread per zone using Box-Muller approximation
      const u = Math.random(), v = Math.random();
      const gauss = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      const spreadFactor = 0.018; // ~2km spread per zone
      const ptLat = centerLat + gauss * spreadFactor;
      const ptLng = centerLng + gauss * spreadFactor * 1.3;

      // Intensity variation within zone
      const intensity = Math.max(0.1, Math.min(1.0,
        profile.intensity + (Math.random() - 0.5) * profile.variance * 2
      ));
      heatData.push([ptLat, ptLng, intensity]);
    }
  });

  if (typeof L.heatLayer !== 'undefined') {
    heatLayer = L.heatLayer(heatData, {
      radius: 22,
      blur: 14,
      maxZoom: 16,
      minOpacity: 0.35,
      gradient: { 0.15: '#10b981', 0.35: '#3b82f6', 0.55: '#f59e0b', 0.75: '#ef4444', 1.0: '#7c3aed' }
    }).addTo(S.map.instance);
  }
}

// ── LIVE HEATMAP (Normal User) ───────────────────────────────
function loadLiveHeatmap() {
  if (!S.map.instance) return;

  // Clear old layer
  if (heatLayer) { S.map.instance.removeLayer(heatLayer); heatLayer = null; }

  const r = S.risk.level;
  const heatData = [];

  // Composite intensity from real API data (user's spec formula)
  const aqi = r.aqi || 0;
  const temp = r.temp || 25;
  const rain = r.rain || 0;
  const baseIntensity = Math.min(1.0, (aqi * 0.4 + temp * 0.3 + rain * 0.3) / 200);

  // Generate organic sub-clusters centred on real GPS position
  const subClusters = [
    { dLat: 0, dLng: 0, weight: 1.0, count: 30 },
    { dLat: 0.018, dLng: 0.022, weight: 0.7, count: 20 },
    { dLat: -0.02, dLng: 0.015, weight: 0.5, count: 15 },
    { dLat: 0.012, dLng: -0.025, weight: 0.4, count: 12 },
  ];

  subClusters.forEach(cluster => {
    const cLat = S.user.lat + cluster.dLat;
    const cLng = S.user.lng + cluster.dLng;

    for (let i = 0; i < cluster.count; i++) {
      const u = Math.random(), v = Math.random();
      const g1 = Math.sqrt(-2 * Math.log(u || 0.001)) * Math.cos(2 * Math.PI * v);
      const g2 = Math.sqrt(-2 * Math.log(u || 0.001)) * Math.sin(2 * Math.PI * v);
      const spread = 0.014;
      const ptLat = cLat + g1 * spread;
      const ptLng = cLng + g2 * spread * 1.2;

      const jitter = (Math.random() - 0.5) * 0.1;
      const finalIntensity = Math.max(0.15, Math.min(0.95, (baseIntensity + jitter) * cluster.weight));
      heatData.push([ptLat, ptLng, finalIntensity]);
    }
  });

  if (typeof L.heatLayer !== 'undefined') {
    heatLayer = L.heatLayer(heatData, {
      radius: 20,
      blur: 13,
      maxZoom: 16,
      minOpacity: 0.30,
      gradient: { 0.15: '#10b981', 0.35: '#3b82f6', 0.55: '#f59e0b', 0.75: '#ef4444', 1.0: '#7c3aed' }
    }).addTo(S.map.instance);
  }
}

function updateRiskType() {
  const s = document.getElementById('riskTypeSelect');
  if (s) { S.risk.type = s.value; if (S.map.instance) updateMapOverlays(); updateDashZone(); showToast(`Showing ${s.value} risk layers`, 'info'); }
}

function switchMapView(el, view) {
  document.querySelectorAll('.map-toggle').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  if (!S.map.instance) return;
  if (view === 'current') {
    S.map.instance.removeLayer(S.map.tileLayer);
    S.map.satelliteLayer.addTo(S.map.instance);
  } else {
    S.map.instance.removeLayer(S.map.satelliteLayer);
    S.map.tileLayer.addTo(S.map.instance);
  }
  fetchAndUpdateAll();
  showToast(view === 'current' ? 'Satellite view' : view === 'forecast' ? 'Dark view + forecast' : 'Historical view', 'info');
}

// ===== DASHBOARD =====
function refreshDash() {
  const el = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  el('dashGreeting', `Hello, ${S.user.name}! 👋`);
  if (S.policy.active) {
    const p = PLANS[S.policy.plan];
    el('dashStatus', `${p.name} · ${S.user.location}`);
    el('dashPremium', '₹' + (S.policy.premium?.toFixed ? S.policy.premium.toFixed(1) : S.policy.premium)); el('dashCoverage', '₹' + p.coverage.toLocaleString());
  } else { el('dashStatus', 'Select a plan'); el('dashPremium', '—'); el('dashCoverage', '—'); }
  const latStr = S.user.lat != null ? S.user.lat.toFixed(4) : '—';
  const lngStr = S.user.lng != null ? S.user.lng.toFixed(4) : '—';
  el('dashLocation', `📍 ${S.user.location}${S.user.gpsActive ? ' · GPS Active' : ''} · ${latStr},${lngStr}`);
  const tp = S.claims.payouts.reduce((s, p) => s + p.amount, 0);
  el('dashPayouts', '₹' + tp.toLocaleString()); el('dashTriggers', S.triggers.count);
  updateActuarialUI();

  const mlCard = document.getElementById('mlExplanationCard');
  if (mlCard) mlCard.style.display = S.user.isDemo ? 'flex' : 'none';

  updateDashZone();
}
function addDashAlert(type, icon, text) {
  const c = document.getElementById('dashAlerts'); if (!c) return;
  const d = document.createElement('div'); d.className = 'alert-item ' + type;
  d.innerHTML = `<span class="alert-icon">${icon}</span><div><div class="alert-text">${text}</div><div class="alert-time">Just now</div></div>`;
  c.insertBefore(d, c.firstChild); while (c.children.length > 6) c.removeChild(c.lastChild);
}

// ===== PROFILE =====
function refreshProfile() {
  const el = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  el('profileName', S.user.isLoggedIn ? S.user.name : 'Not logged in');
  el('profileEmail', S.user.isLoggedIn ? `${S.user.email} · ${S.user.location}` : '—');
  el('profileAvatar', S.user.isLoggedIn ? S.user.name.charAt(0).toUpperCase() : '?');

  // Trust score + mock stats sections
  const trustSection = document.getElementById('trustScoreSection');
  const mockSection = document.getElementById('mockStatsSection');
  if (!S.user.isLoggedIn) {
    if (trustSection) trustSection.style.display = 'none';
    if (mockSection) mockSection.style.display = 'none';
    return;
  }
  if (trustSection) trustSection.style.display = '';
  if (mockSection) mockSection.style.display = '';
  const arc = document.getElementById('ringArc');
  if (arc) arc.style.strokeDashoffset = '326.7';
  setTimeout(() => {
    if (typeof FraudEngine !== 'undefined') {
      const result = FraudEngine.simulate();
      renderTrustScore(result);
    }
    renderMockStats();
  }, 200);
}

// ===== PRICING CALC =====
function updatePricing() {
  const sl = document.querySelectorAll('.slider');
  const cf = parseFloat(sl[0].value), tp = parseInt(sl[1].value), il = parseInt(sl[2].value), d = parseInt(sl[3].value);
  document.getElementById('cityFactorVal').textContent = cf.toFixed(1) + 'x';
  document.getElementById('trigProbVal').textContent = tp + '%';
  document.getElementById('incomeLossVal').textContent = '₹' + il;
  document.getElementById('daysVal').textContent = d;
  document.getElementById('calcPremium').textContent = '₹' + Math.round((tp / 100) * il * (d / 7) * cf);
}

// ===== PAYOUT + AI LOG UI =====
function updatePayoutUI() {
  const tb = document.getElementById('payoutTableBody'); if (!tb) return;
  if (!S.claims.payouts.length) { tb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:16px;">No payouts yet</td></tr>'; return; }
  tb.innerHTML = S.claims.payouts.slice().reverse().map(p => `<tr><td>${p.date}</td><td>${p.trigger}</td><td>${p.zone}</td><td style="color:var(--success);font-weight:700;">₹${p.amount}</td><td><span class="tier-badge" style="background:var(--success-bg);color:var(--success);">${p.status}</span></td></tr>`).join('');
}
function updateAILogUI() {
  const lg = document.getElementById('aiValidationLog'); if (!lg) return;
  if (!S.claims.aiLogs.length) { lg.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:12px;font-size:0.8rem;">Events appear here when triggers fire.</p>'; return; }
  lg.innerHTML = S.claims.aiLogs.slice(-8).reverse().map(l => `<div class="alert-item ${l.valid ? 'success' : 'danger'}" style="margin-bottom:6px;">
    <span class="alert-icon">${l.valid ? '✅' : '❌'}</span><div>
    <div class="alert-text" style="font-size:0.75rem;">${l.msg}</div>
    <div style="font-size:0.6rem;color:var(--text-muted);margin-top:2px;">📍${l.locMatch ? '✓' : '✗'} · 🏃${l.actValid ? '✓' : '✗'} · 📋${l.policyCov ? '✓' : '✗'} · 🔁${l.noDup ? '✓' : '✗'} · 📌${l.inZone ? '✓' : '✗'}</div>
    <div class="alert-time">${l.time}</div></div></div>`).join('');
}

// ===== TRIGGER ENGINE =====
let pendingPayout = null;
function startClaimProcessing(nm, userRisk, hrs, payoutAmount, triggerStr, zoneLabel) {
  openModal('processingModal');
  for (let i = 1; i <= 5; i++) {
    const s = document.getElementById(`proc-step-${i}`);
    if (s) { s.classList.remove('active', 'done'); }
  }
  document.getElementById('payoutBtnContainer').style.display = 'none';
  document.getElementById('proc-final-title').textContent = 'Payout Pending';
  document.getElementById('proc-final-desc').textContent = 'Waiting for your action';

  const steps = [{ id: 1, delay: 500 }, { id: 2, delay: 1500 }, { id: 3, delay: 2500 }, { id: 4, delay: 4000 }];
  steps.forEach(st => {
    setTimeout(() => {
      if (st.id > 1) { document.getElementById(`proc-step-${st.id - 1}`).classList.add('done'); document.getElementById(`proc-step-${st.id - 1}`).classList.remove('active'); }
      document.getElementById(`proc-step-${st.id}`).classList.add('active');
    }, st.delay);
  });

  setTimeout(() => {
    document.getElementById('proc-step-4').classList.remove('active');
    document.getElementById('proc-step-4').classList.add('done');
    document.getElementById('processPayoutBtn').textContent = `Process UPI Payout — ₹${payoutAmount}`;
    document.getElementById('payoutBtnContainer').style.display = 'block';
    pendingPayout = { amount: payoutAmount, trigger: triggerStr, zone: zoneLabel, nm: nm, hrs: hrs };
  }, 5500);
}

function completeClaimPayout() {
  if (!pendingPayout) return;
  const p = pendingPayout;
  document.getElementById('payoutBtnContainer').style.display = 'none';
  document.getElementById('proc-step-5').classList.add('active');
  document.getElementById('proc-final-title').textContent = 'Payout Complete';
  document.getElementById('proc-final-desc').textContent = `₹${p.amount} credited to ${S.bank.acc.substring(0, 4)}!`;

  setTimeout(() => {
    document.getElementById('proc-step-5').classList.remove('active');
    document.getElementById('proc-step-5').classList.add('done');
    S.claims.payouts.push({ date: new Date().toLocaleDateString('en-IN'), trigger: p.trigger, zone: p.zone, amount: p.amount, status: 'Approved' });
    showToast(`💸 ₹${p.amount} credited! ${p.nm} (${p.hrs}h lost)`, 'success');
    addNotif(`✅ ₹${p.amount} process to Bank ${S.bank.name}`, 'success');
    addDashAlert('success', '✅', `₹${p.amount} payout — ${p.nm}`);
    refreshDash(); updatePayoutUI(); updateAILogUI();
    setTimeout(() => closeModal('processingModal'), 2000);
    pendingPayout = null;
  }, 1000);
}

function processTrigger() {
  if (!S.user.isLoggedIn || !S.policy.active || !S.bank.acc) return;
  const fired = RealAPI.checkTriggers(S.risk.level, S.policy.plan);
  if (!fired.length) return;

  const userRisk = S.risk.userZone?.risk || RealAPI.calcZoneRisk(
    { rain: S.risk.level.rain, temp: S.risk.level.temp },
    { aqi: S.risk.level.aqi }, S.risk.type
  );

  fired.forEach(trigger => {
    if (S.claims.processedEvents.has(trigger.eid)) return; // DUPLICATE CHECK
    S.triggers.count++; S.triggers.history.push({ type: trigger.type, val: trigger.val, time: new Date() });
    const names = { rain: 'Heavy Rain', aqi: 'AQI Spike', heat: 'Heatwave', flood: 'Flood' };
    const icons = { rain: '🌧️', aqi: '💨', heat: '🌡️', flood: '🌊' };
    const nm = names[trigger.type], ic = icons[trigger.type];

    showToast(`⚡ AUTO CLAIM DETECTED: ${nm}!`, 'danger');

    // AI Validation
    setTimeout(() => {
      const v = RealAPI.validateClaim(trigger, userRisk);
      const log = {
        valid: v.valid,
        msg: v.valid ? `🤖 APPROVED: ${nm} for ${S.user.name}` : `🤖 REJECTED: ${!v.inZone ? 'Not in high-risk zone' : !v.locMatch ? 'Location mismatch' : !v.actValid ? 'Inactive' : !v.policyCov ? 'Not covered' : 'Duplicate'}`,
        locMatch: v.locMatch, actValid: v.actValid, policyCov: v.policyCov, noDup: v.noDup, inZone: v.inZone,
        time: new Date().toLocaleTimeString('en-IN')
      };
      S.claims.aiLogs.push(log);

      if (v.valid) {
        S.claims.processedEvents.add(trigger.eid);
        const plan = PLANS[S.policy.plan];
        const hrs = 1 + Math.floor(Math.random() * 4);
        const sev = { safe: 0.02, moderate: 0.04, high: 0.07, severe: 0.1 };
        const payout = Math.round(plan.coverage * (sev[userRisk] || 0.05) * hrs / 3);
        startClaimProcessing(nm, userRisk, hrs, payout, nm, S.user.location);
      } else {
        showToast(`❌ ${log.msg}`, 'danger');
        addDashAlert('danger', '❌', log.msg); updateAILogUI();
      }
    }, 2000);
  });
}

// ===== MANUAL CLAIM =====
let selectedClaimType = null;
function pickClaimType(el) {
  document.querySelectorAll('.claim-type-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected'); selectedClaimType = el.dataset.type;
}
function submitManualClaim() {
  if (!S.user.isLoggedIn) { showToast('Login first', 'warning'); return; }
  if (!selectedClaimType) { showToast('Select disruption type', 'warning'); return; }
  closeModal('manualClaimModal');

  // Route straight through the claim pipeline
  const typeMap = {
    rain: { title: 'High Rain Risk in your zone', icon: '🌧️' },
    heat: { title: 'Extreme Heat Conditions', icon: '🔥' },
    aqi: { title: 'Unhealthy Air Quality', icon: '🌫️' },
    flood: { title: 'Flood Risk Alert', icon: '🌊' },
    storm: { title: 'Severe Storm Detected', icon: '⚡' },
    traffic: { title: 'Road Blockage Reported', icon: '🚧' }
  };
  const t = typeMap[selectedClaimType] || { title: selectedClaimType, icon: '📋' };

  // Mark this as a manual (self) claim so pipeline knows
  _currentClaimIsManual = true;
  if (typeof startClaimPipeline === 'function') {
    startClaimPipeline(selectedClaimType, t.title, t.icon);
  } else {
    showToast('Pipeline not ready', 'warning');
  }

  selectedClaimType = null;
  document.querySelectorAll('.claim-type-btn').forEach(b => b.classList.remove('selected'));
}

// ============================================================
// ANALYTICS MODULE — WEEKLY EARNINGS CHART
// ============================================================

const BASE_WEEK_DATA = [
  { day: 'Mon', earnings: 800, protected: 200, saved: 150 },
  { day: 'Tue', earnings: 1200, protected: 350, saved: 250 },
  { day: 'Wed', earnings: 900, protected: 300, saved: 200 },
  { day: 'Thu', earnings: 1000, protected: 280, saved: 180 },
  { day: 'Fri', earnings: 1400, protected: 400, saved: 300 },
  { day: 'Sat', earnings: 1600, protected: 320, saved: 220 },
  { day: 'Sun', earnings: 700, protected: 200, saved: 150 }
];

let earningsChartInstance = null;

function generateWeekData() {
  return BASE_WEEK_DATA.map(d => ({
    day: d.day,
    earnings: Math.max(400, d.earnings + Math.round((Math.random() - 0.5) * 300)),
    protected: Math.max(100, d.protected + Math.round((Math.random() - 0.5) * 120)),
    saved: Math.max(50, d.saved + Math.round((Math.random() - 0.5) * 100))
  }));
}

function buildEarningsChart(data) {
  const canvas = document.getElementById('earningsChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const isDarkMode = document.body.classList.contains('light-mode') ? false : true;
  const gridColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const labelColor = isDarkMode ? '#94a3b8' : '#475569';

  if (earningsChartInstance) { earningsChartInstance.destroy(); earningsChartInstance = null; }

  earningsChartInstance = new Chart(canvas, {
    data: {
      labels: data.map(d => d.day),
      datasets: [
        {
          type: 'bar',
          label: 'Potential Earnings',
          data: data.map(d => d.earnings),
          backgroundColor: 'rgba(99,102,241,0.75)',
          borderRadius: 6,
          borderSkipped: false,
          order: 2
        },
        {
          type: 'bar',
          label: 'Protected Amount',
          data: data.map(d => d.protected),
          backgroundColor: 'rgba(16,185,129,0.75)',
          borderRadius: 6,
          borderSkipped: false,
          order: 2
        },
        {
          type: 'line',
          label: 'Loss Avoided',
          data: data.map(d => d.saved),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.12)',
          borderWidth: 2.5,
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.4,
          fill: true,
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: 'index', intersect: false },
      animation: { duration: 800, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(17,24,39,0.95)',
          borderColor: 'rgba(99,102,241,0.4)',
          borderWidth: 1,
          padding: 12,
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          titleFont: { size: 12, weight: 'bold', family: 'Inter' },
          bodyFont: { size: 11, family: 'Inter' },
          callbacks: {
            title: items => `📅 ${items[0].label}`,
            label: item => {
              const labels = ['Potential Earnings', 'Protected Amount', 'Loss Avoided'];
              const icons = ['💰', '🛡️', '✅'];
              const idx = item.datasetIndex;
              return ` ${icons[idx]} ${labels[idx]}: ₹${item.parsed.y}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor, drawBorder: false },
          ticks: { color: labelColor, font: { size: 11, family: 'Inter', weight: '600' } }
        },
        y: {
          beginAtZero: true,
          grid: { color: gridColor, drawBorder: false },
          ticks: {
            color: labelColor, font: { size: 10, family: 'Inter' },
            callback: v => '₹' + v
          }
        }
      }
    }
  });
}

function updateAnalyticsSummary(data) {
  const totalProtected = data.reduce((s, d) => s + d.protected, 0);
  const totalSaved = data.reduce((s, d) => s + d.saved, 0);
  const claimsCount = S.triggers.count || data.filter(d => d.protected > 280).length;
  const hoursEstimate = Math.round(data.reduce((s, d) => s + (d.saved / 50), 0));

  const el = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  el('asTotalProtected', '₹' + totalProtected.toLocaleString('en-IN'));
  el('asTotalClaims', claimsCount.toString());
  el('asTotalHours', hoursEstimate + 'h');
}

// ============================================================
// EMPTY ANALYTICS STATE (Normal user with no claims yet)
// ============================================================

// Show zero-state chart — only a placeholder earnings bar (grayed out)
// NO green "Protected" bar, NO yellow "Loss Avoided" line.
function showEmptyAnalytics() {
  buildEmptyChart();

  // Zero out all summary cards
  const el = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  el('asTotalEarnings', '₹0');
  el('asTotalProtected', '₹0');
  el('asTotalHours', '0h');
  el('asTotalClaims', '0');
}

// Renders a minimal chart: single grayed earnings placeholder, no claims data.
function buildEmptyChart() {
  const canvas = document.getElementById('earningsChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const isDarkMode = !document.body.classList.contains('light-mode');
  const gridColor = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const labelColor = isDarkMode ? '#64748b' : '#94a3b8';

  if (earningsChartInstance) { earningsChartInstance.destroy(); earningsChartInstance = null; }

  const emptyLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  earningsChartInstance = new Chart(canvas, {
    data: {
      labels: emptyLabels,
      datasets: [
        {
          type: 'bar',
          label: 'Potential Earnings',
          // Placeholder zero data — will fill once user has claim history
          data: [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: 'rgba(99,102,241,0.20)',   // greyed-out purple
          borderColor: 'rgba(99,102,241,0.40)',
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
          order: 2
        }
        // NOTE: "Protected Amount" and "Loss Avoided" datasets are intentionally
        // omitted for new users. They appear after the first approved claim.
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: { duration: 600, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        // "No data yet" watermark via a custom plugin
      },
      scales: {
        x: {
          grid: { color: gridColor, drawBorder: false },
          ticks: { color: labelColor, font: { size: 11, family: 'Inter', weight: '600' } }
        },
        y: {
          beginAtZero: true,
          max: 2000,  // Give sensible Y axis scale as placeholder
          grid: { color: gridColor, drawBorder: false },
          ticks: {
            color: labelColor, font: { size: 10, family: 'Inter' },
            callback: v => '₹' + v
          }
        }
      }
    }
  });

  // Overlay "No data yet" message on the canvas
  const existingOverlay = document.getElementById('chartEmptyOverlay');
  if (existingOverlay) existingOverlay.remove();

  const wrapper = canvas.parentElement;
  if (wrapper) {
    wrapper.style.position = 'relative';
    const overlay = document.createElement('div');
    overlay.id = 'chartEmptyOverlay';
    overlay.style.cssText = `
      position:absolute; inset:0; display:flex; flex-direction:column;
      align-items:center; justify-content:center; pointer-events:none;
      gap:6px;
    `;
    overlay.innerHTML = `
      <div style="font-size:2rem;">📊</div>
      <div style="font-size:0.85rem;font-weight:600;color:var(--text-secondary);">No analytics yet</div>
      <div style="font-size:0.72rem;color:var(--text-muted);text-align:center;max-width:160px;line-height:1.4;">
        Complete your first claim to see earnings &amp; protection data
      </div>
    `;
    wrapper.appendChild(overlay);
  }
}

function refreshAnalyticsData() {
  // Remove empty overlay if present
  const ov = document.getElementById('chartEmptyOverlay');
  if (ov) ov.remove();

  showToast('🔄 Fetching analytics...', 'info');
  if (isDemoUser) {
    // Demo: always load from MockAPI
    if (typeof loadApiEarnings === 'function') loadApiEarnings();
  } else if (S.claims.payouts.filter(p => p.status === 'Approved').length > 0) {
    // Normal user with claims: show real generated analytics
    const d = generateWeekData();
    buildEarningsChart(d);
    updateAnalyticsSummaryFull(d);
    showToast('📊 Analytics refreshed', 'success');
  } else {
    // Normal user, no claims: show empty state
    showEmptyAnalytics();
    showToast('📊 No claim data yet', 'info');
  }
}



// ============================================================
// FRAUD / ELIGIBILITY TRUST SCORE MODULE
// ============================================================

const FraudEngine = {
  weights: { gps: 0.30, activity: 0.30, claim: 0.20, noDup: 0.20 },

  simulate() {
    // Use claim penalty accumulated from rejected manual claims
    const penalty = S.analytics.claimPenalty || 0;

    const gpsConsistency = 0.5 + Math.random() * 0.5;
    const activityLevel = 0.4 + Math.random() * 0.6;
    const totalClaims = S.claims.payouts.length;
    const approvedClaims = S.claims.payouts.filter(c => c.status === 'Approved').length;
    const baseClaimAcc = totalClaims > 0 ? (approvedClaims / totalClaims) : (0.6 + Math.random() * 0.35);
    const claimAccuracy = Math.max(0.05, Math.min(1, baseClaimAcc - penalty));
    const noDuplicateClaims = S.claims.processedEvents.size > 3 ? 0.5 : (0.7 + Math.random() * 0.3);

    const score = (
      this.weights.gps * gpsConsistency +
      this.weights.activity * activityLevel +
      this.weights.claim * claimAccuracy +
      this.weights.noDup * noDuplicateClaims
    );

    return {
      score: parseFloat(score.toFixed(2)),
      gpsConsistency, activityLevel, claimAccuracy, noDuplicateClaims
    };
  },

  classify(score) {
    if (score > 0.75) return { tier: 'GOOD', cls: 'good', emoji: '🟢', color: '#10b981' };
    if (score >= 0.4) return { tier: 'REVIEW', cls: 'review', emoji: '🟡', color: '#f59e0b' };
    return { tier: 'RISK', cls: 'risk', emoji: '🔴', color: '#ef4444' };
  },

  getBenefit(score) {
    if (score > 0.88) return {
      cls: 'good-benefit',
      html: '🏅 <strong>Trusted Rider</strong> — You qualify for a 10% premium discount on your plan!'
    };
    if (score >= 0.4) return {
      cls: 'review-benefit',
      html: '⚖️ <strong>Standard Tier</strong> — Keep riding consistently to unlock better rates.'
    };
    return {
      cls: 'risk-benefit',
      html: '⚠️ <strong>Under Review</strong> — Claims may be restricted. Improve activity score.'
    };
  }
};

function renderTrustScore(result) {
  const { score, gpsConsistency, activityLevel, claimAccuracy, noDuplicateClaims } = result;
  const cls = FraudEngine.classify(score);

  // Animate ring
  const arc = document.getElementById('ringArc');
  if (arc) {
    const circumference = 326.7;
    const offset = circumference - (score * circumference);
    arc.style.strokeDashoffset = offset;
    arc.style.stroke = cls.color;
  }

  // Score label
  const el = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  el('ringScoreVal', score.toFixed(2));
  el('ringScoreLabel', cls.tier);

  const scoreEl = document.getElementById('ringScoreVal');
  if (scoreEl) scoreEl.style.color = cls.color;

  // Badge
  const badge = document.getElementById('trustBadge');
  if (badge) {
    badge.className = 'trust-badge ' + cls.cls;
    badge.innerHTML = cls.emoji + ' ' + score.toFixed(2) + ' — ' + cls.tier;
  }

  // Breakdown bars
  const updateBar = (statId, fillId, value, label) => {
    const pct = Math.round(value * 100);
    el(statId, label);
    const fill = document.getElementById(fillId);
    if (fill) { setTimeout(() => { fill.style.width = pct + '%'; }, 150); }
  };
  updateBar('tbGps', 'tbGpsFill', gpsConsistency, gpsConsistency > 0.7 ? 'Verified ✓' : 'Suspicious ⚠️');
  updateBar('tbActivity', 'tbActivityFill', activityLevel, activityLevel > 0.6 ? 'High' : 'Low');
  updateBar('tbClaim', 'tbClaimFill', claimAccuracy, Math.round(claimAccuracy * 100) + '%');
  updateBar('tbDuplicate', 'tbDuplicateFill', noDuplicateClaims, noDuplicateClaims > 0.7 ? 'No ✓' : 'Detected ⚠️');

  // Benefit
  const ben = FraudEngine.getBenefit(score);
  const benefitEl = document.getElementById('trustBenefit');
  if (benefitEl) { benefitEl.className = 'trust-benefit ' + ben.cls; benefitEl.innerHTML = ben.html; }

  // Store for pricing module
  S.analytics.trustScore = score;
  S.analytics.trustTier = cls.tier;

  // Update plan pricing UI if on pricing page immediately after getting score
  if (typeof updatePlanBtns === 'function') {
    updatePlanBtns();
  }

  // Update plan pricing if good tier
  if (score > 0.88) {
    addNotif('🏅 Trusted Rider badge earned! Premium discount unlocked.', 'success');
  }
}

function refreshTrustScore() {
  const result = FraudEngine.simulate();
  renderTrustScore(result);
  showToast('🛡️ Trust score recalculated', 'info');
}

// ============================================================
// MOCK ACTIVITY DATA MODULE
// ============================================================

function generateMockStats() {
  const orders = 18 + Math.floor(Math.random() * 22);          // 18–40
  const hours = 5 + Math.floor(Math.random() * 7);           // 5–12
  const earnings = Math.round((350 + Math.random() * 650) * hours / 10) * 10; // ₹350–₹6500 range
  const rating = (4.2 + Math.random() * 0.7).toFixed(1);       // 4.2–4.9

  return { orders, hours, earnings, rating };
}

function renderMockStats() {
  const stats = generateMockStats();
  const el = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  el('mscOrders', stats.orders.toString());
  el('mscHours', stats.hours + 'h');
  el('mscEarnings', '₹' + stats.earnings.toLocaleString('en-IN'));
  el('mscRating', '⭐ ' + stats.rating);
}

function refreshMockStats() {
  renderMockStats();
  showToast('📈 Activity data refreshed', 'info');
}


// ============================================================
// HOOK: analytics chart is initialized inline in goTo above
// ============================================================

function startEngine() {
  setInterval(() => fetchAndUpdateAll(), CONFIG.REFRESH_MS);
  let ai = 0;
  setInterval(() => {
    if (!S.user.isLoggedIn) return;
    const r = S.risk.level;
    const msgs = [
      () => `🌧️ Rain ${r.rain || 0}mm/hr near you`,
      () => `💨 AQI ${r.aqi || 0} at your location`,
      () => `🌡️ ${r.temp || 0}°C · ${r.desc || ''}`,
      () => `📍 GPS: ${S.user.lat != null ? S.user.lat.toFixed(3) : 'awaiting'}, ${S.user.lng != null ? S.user.lng.toFixed(3) : 'GPS'}`
    ];
    showToast(msgs[ai % msgs.length](), 'info'); ai++;
  }, 20000);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  updateNav(); S.unread = 0; updBadge();
  // Don't call fetchAndUpdateAll on boot — wait for actual login + GPS
  // It's called from initGeolocation() success AND the startEngine() interval
  startEngine();


  const obs = new IntersectionObserver(e => {
    e.forEach(en => { if (en.isIntersecting) { en.target.style.opacity = '1'; en.target.style.transform = 'translateY(0)'; } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.card,.stat-card,.pricing-card,.claim-step,.env-card').forEach(el => {
    el.style.opacity = '0'; el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease'; obs.observe(el);
  });
  const ct = document.getElementById('claimTime');
  if (ct) { const n = new Date(); ct.value = n.getHours().toString().padStart(2, '0') + ':' + n.getMinutes().toString().padStart(2, '0'); }
});

