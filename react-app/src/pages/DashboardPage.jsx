import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { PLANS, CITY_DATA } from '../utils/cityData';
import { calcZoneRisk, RISK_COLORS, RISK_EMOJIS } from '../utils/riskEngine';
import { fetchMockEarnings, generateWeekData } from '../utils/mockApi';
import { processSOS } from '../utils/realApi';
import ClaimPipeline from '../components/ClaimPipeline';
import SelfClaimPicker from '../components/SelfClaimPicker';
import UniversalSOSModal from '../components/UniversalSOSModal';

const DEMO_TRIGGERS = { rain: 25, temp: 43, aqi: 178 };

export default function DashboardPage() {
  const { state, dispatch, navigate, addToast, addNotification } = useApp();
  const { user, policy, claims, triggers, analytics, risk, env } = state;
  const chartRef  = useRef(null);
  const chartInst = useRef(null);

  const [selfClaimOpen, setSelfClaimOpen] = useState(false);
  const [pipeline, setPipeline]           = useState({ open: false, key:'', title:'', icon:'', manual: false });
  const [triggerCards, setTriggerCards]   = useState([]);

  // Compute derived values
  const totalPayouts = claims.payouts.reduce((s, p) => s + (p.amount || 0), 0);
  const plan = policy.plan ? PLANS[policy.plan] : null;
  const userRisk = calcZoneRisk(
    { rain: risk.level.rain, temp: risk.level.temp },
    { aqi: risk.level.aqi },
    risk.type
  );

  // Zone info
  const cityData = user.location ? CITY_DATA[user.location] : null;
  const safeZones = cityData ? cityData.zones.filter((_, i) => i !== (user.zoneIdx || 0)) : [];
  const safeZoneHint = safeZones.length
    ? (() => { const sz = safeZones[Math.floor(Math.random() * safeZones.length)]; const dist = (Math.sqrt(sz.dlat**2 + sz.dlng**2)*111).toFixed(1); return `🟢 Safe zone ${dist}km away: ${sz.l}`; })()
    : '';

  // Load analytics chart
  useEffect(() => {
    if (!chartRef.current || typeof window.Chart === 'undefined') return;
    setTimeout(() => buildChart(), 300);
    return () => { if (chartInst.current) { chartInst.current.destroy(); chartInst.current = null; } };
  }, []);

  // Load trigger cards
  useEffect(() => {
    const envData = user.isDemo ? DEMO_TRIGGERS : (env || {});
    const cards = [
      { type:'rain', icon:'🌧️', title:'Rain Risk', value: envData.rain||0, unit:'mm/hr', threshold:64, level: (envData.rain||0)>64?'high':(envData.rain||0)>20?'moderate':'low', triggered:(envData.rain||0)>64, desc:(envData.rain||0)>64?`Heavy rain: ${envData.rain} mm/hr — TRIGGER ACTIVE`:(envData.rain||0)>20?`Moderate rain: ${envData.rain} mm/hr — monitoring`:`Rain: ${envData.rain||0} mm/hr — safe` },
      { type:'aqi',  icon:'💨', title:'Air Quality',value: envData.aqi||0,  unit:'AQI',  threshold:300, level:(envData.aqi||0)>300?'high':(envData.aqi||0)>150?'moderate':'low', triggered:(envData.aqi||0)>300, desc:(envData.aqi||0)>300?`Hazardous AQI: ${envData.aqi} — TRIGGER ACTIVE`:(envData.aqi||0)>150?`Poor AQI: ${envData.aqi} — monitoring`:`AQI: ${envData.aqi||0} — acceptable` },
      { type:'heat', icon:'🌡️', title:'Heat Index', value:envData.temp||25, unit:'°C',   threshold:45, level:(envData.temp||0)>44?'high':(envData.temp||0)>38?'moderate':'low', triggered:(envData.temp||0)>44, desc:(envData.temp||0)>44?`Extreme heat: ${envData.temp}°C — TRIGGER ACTIVE`:(envData.temp||0)>38?`High heat: ${envData.temp}°C — monitoring`:`Temp: ${envData.temp||25}°C — safe` },
    ];
    setTriggerCards(cards);
  }, [user.isDemo, env]);

  async function buildChart() {
    if (!chartRef.current || typeof window.Chart === 'undefined') return;
    if (chartInst.current) { chartInst.current.destroy(); chartInst.current = null; }

    let data;
    if (user.isDemo) {
      data = await fetchMockEarnings();
    } else if (claims.payouts.filter(p => p.status === 'Approved').length > 0) {
      data = generateWeekData();
    } else {
      // Empty state
      data = null;
    }

    const isDarkMode = !document.body.classList.contains('light-mode');
    const gridColor  = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
    const labelColor = isDarkMode ? '#94a3b8' : '#475569';

    if (!data) {
      // Empty chart
      chartInst.current = new window.Chart(chartRef.current, {
        data: { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], datasets: [{ type:'bar', label:'Potential Earnings', data:[0,0,0,0,0,0,0], backgroundColor:'rgba(99,102,241,0.20)', borderRadius:6 }] },
        options: { responsive:true, maintainAspectRatio:true, plugins:{legend:{display:false},tooltip:{enabled:false}}, scales:{x:{grid:{color:gridColor},ticks:{color:labelColor,font:{size:11}}},y:{beginAtZero:true,max:2000,grid:{color:gridColor},ticks:{color:labelColor,callback:v=>'₹'+v}}}}
      });
      return;
    }

    chartInst.current = new window.Chart(chartRef.current, {
      data: {
        labels: data.map(d => d.day),
        datasets: [
          { type:'bar',  label:'Potential Earnings', data:data.map(d=>d.earnings), backgroundColor:'rgba(99,102,241,0.75)', borderRadius:6, order:2 },
          { type:'bar',  label:'Protected Amount',   data:data.map(d=>d.protected),backgroundColor:'rgba(16,185,129,0.75)', borderRadius:6, order:2 },
          { type:'line', label:'Loss Avoided',       data:data.map(d=>d.saved),    borderColor:'#f59e0b', backgroundColor:'rgba(245,158,11,0.12)', borderWidth:2.5, pointBackgroundColor:'#f59e0b', tension:0.4, fill:true, order:1 },
        ],
      },
      options: {
        responsive:true, maintainAspectRatio:true,
        interaction:{mode:'index',intersect:false},
        animation:{duration:800,easing:'easeOutQuart'},
        plugins:{legend:{display:false},tooltip:{backgroundColor:'rgba(17,24,39,0.95)',borderColor:'rgba(99,102,241,0.4)',borderWidth:1,padding:12,titleColor:'#f1f5f9',bodyColor:'#94a3b8',callbacks:{title:items=>`📅 ${items[0].label}`,label:item=>` ${['💰','🛡️','✅'][item.datasetIndex]} ${item.raw}`}}},
        scales:{x:{grid:{color:gridColor},ticks:{color:labelColor,font:{size:11}}},y:{beginAtZero:true,grid:{color:gridColor},ticks:{color:labelColor,callback:v=>'₹'+v}}},
      },
    });

    // Update summary cards
    const totalE = data.reduce((s,d)=>s+(d.earnings||0),0);
    const totalP = data.reduce((s,d)=>s+(d.protected||0),0);
    const totalH = data.reduce((s,d)=>s+(d.hoursWorked||d.saved/50||0),0);
    setSummary({ earnings: Math.round(totalE), protected: Math.round(totalP), hours: Math.round(totalH) });
  }

  const [summary, setSummary] = useState({ earnings: 0, protected: 0, hours: 0 });
  const [sosModalOpen, setSosModalOpen] = useState(false);

  function triggerSOS() {
    if (!user.isLoggedIn) { addToast('Please login first', 'warning'); return; }
    setSosModalOpen(true);
  }

  function runStressTest() {
    dispatch({ type: 'SET_ANALYTICS', payload: { isStressTest: true, totalClaims: analytics.totalClaims + 150000 } });
    addToast('🔥 High stress scenario: Heavy rain simulation', 'danger');
  }

  function openTriggerClaim(card) {
    if (!user.isLoggedIn) { addToast('Please login first', 'warning'); return; }
    setPipeline({ open: true, key: card.type, title: card.title, icon: card.icon, manual: false });
  }

  function openSelfClaim() {
    if (!user.isLoggedIn) { addToast('Please login first', 'warning'); return; }
    setSelfClaimOpen(true);
  }

  function onPickClaim(key, title, icon) {
    setSelfClaimOpen(false);
    setTimeout(() => setPipeline({ open: true, key, title, icon, manual: true }), 200);
  }

  const bcr = analytics.totalClaims / analytics.totalPremium;

  const [userLocation, setUserLocation] = useState({ city: user.location, lat: user.lat, lng: user.lng });

  // STEP 3: LOAD CITY IN DASHBOARD
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("userLocation"));
      if (stored && stored.city) {
        setUserLocation(stored);
        // Also sync back to context if context is empty but localStorage has it
        if (!user.location && stored.city) {
           dispatch({ type: 'SET_USER', payload: { location: stored.city, lat: stored.lat, lng: stored.lng } });
        }
      }
    } catch {}
  }, []);

  return (
    <div className="page active" id="page-dashboard">
      <div className="page-content">
        {/* Greeting */}
        <div className="dash-greeting">
          <h2 id="dashGreeting">Hello, {user.name || 'User'}! 👋</h2>
          {/* STEP 4: FIX PLAN LABEL (CRITICAL) */}
          <p id="dashStatus">{plan ? `${plan.name} • ${userLocation.city || user.location || ""}` : 'Select a plan to get started.'}</p>
          <div className="dash-location" id="dashLocation">
            📍 {userLocation.city || user.location}{user.gpsActive ? ' · GPS Active' : ''} · {(userLocation.lat || user.lat)?.toFixed(4) || '—'},{(userLocation.lng || user.lng)?.toFixed(4) || '—'}
          </div>
        </div>

        {/* ML Card (demo only) */}
        {user.isDemo && (
          <div className="ml-card" style={{ display:'flex' }}>
            <div className="ml-card-icon">🧠</div>
            <div className="ml-card-content">
              <h4>Smart Reward Engine</h4>
              <p>Our AI model rewards consistent users with lower premiums based on risk stability and claim patterns.</p>
            </div>
          </div>
        )}

        {/* Zone Risk Card */}
        <div className="user-zone-card" id="userZoneCard">
          <div style={{ fontSize:'0.7rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'4px' }}>Your Area Risk</div>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div>
              <div id="userZoneRisk" style={{ fontSize:'1.1rem',fontWeight:800,color: RISK_COLORS[userRisk] || 'var(--warning)' }}>
                {userRisk.charAt(0).toUpperCase() + userRisk.slice(1)}
              </div>
              <div id="userZoneName" style={{ fontSize:'0.8rem',color:'var(--text-secondary)' }}>
                {risk.level.desc || user.location} · {risk.level.temp}°C · AQI {risk.level.aqi}
              </div>
            </div>
            <div id="userZoneIndicator" style={{ fontSize:'2rem' }}>{RISK_EMOJIS[userRisk] || '🟡'}</div>
          </div>
          <div id="safeZoneHint" style={{ fontSize:'0.7rem',color:'var(--success)',marginTop:'6px' }}>{safeZoneHint}</div>
        </div>

        {/* Stats */}
        <div className="stat-row">
          <div className="stat-card"><div className="stat-icon" style={{background:'var(--accent-glow)',color:'var(--accent-light)'}}>💰</div><div><div className="stat-value" id="dashPremium">{plan ? `₹${policy.premium}` : '—'}</div><div className="stat-label">Premium</div></div></div>
          <div className="stat-card"><div className="stat-icon" style={{background:'var(--success-bg)',color:'var(--success)'}}>🛡️</div><div><div className="stat-value" id="dashCoverage">{plan ? `₹${plan.coverage.toLocaleString()}` : '—'}</div><div className="stat-label">Coverage</div></div></div>
        </div>
        <div className="stat-row">
          <div className="stat-card"><div className="stat-icon" style={{background:'var(--warning-bg)',color:'var(--warning)'}}>📊</div><div><div className="stat-value" id="dashPayouts">₹{totalPayouts.toLocaleString()}</div><div className="stat-label">Payouts</div></div></div>
          <div className="stat-card"><div className="stat-icon" style={{background:'var(--purple-bg)',color:'var(--purple)'}}>⚡</div><div><div className="stat-value" id="dashTriggers">{triggers.count}</div><div className="stat-label">Triggers</div></div></div>
        </div>

        {/* Tomorrow Forecast */}
        <div className="card" style={{ marginBottom:'16px' }}>
          <h3 style={{ fontSize:'0.95rem',fontWeight:700,marginBottom:'10px' }}>📅 Tomorrow Risk Forecast</h3>
          <div style={{ background:'var(--danger-bg)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'var(--radius)',padding:'12px',display:'flex',alignItems:'center',gap:'12px',marginBottom:'10px' }}>
            <div style={{ fontSize:'1.8rem' }}>🌧️</div>
            <div>
              <div style={{ fontSize:'0.9rem',fontWeight:700,color:'var(--danger)' }}>High Rain Expected</div>
              <div style={{ fontSize:'0.75rem',color:'var(--text-secondary)' }}>15 mm/hr peak at 4:00 PM</div>
            </div>
          </div>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:'8px',borderTop:'1px dashed var(--border)' }}>
            <div style={{ fontSize:'0.8rem',color:'var(--text-secondary)' }}>Expected Coverage Tomorrow</div>
            <div style={{ fontSize:'0.9rem',fontWeight:800,color:'var(--success)' }}>₹300–₹500</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-grid">
          <div className="quick-item" onClick={() => navigate('risk-map')}><div className="qi-icon">🗺️</div><div className="qi-label">Risk Map</div></div>
          <div className="quick-item" onClick={() => navigate('pricing')}><div className="qi-icon">📋</div><div className="qi-label">My Plan</div></div>
          <div className="quick-item" onClick={() => navigate('claims')}><div className="qi-icon">💳</div><div className="qi-label">Claims</div></div>
          <div className="quick-item" onClick={openSelfClaim} style={{ border:'1px solid rgba(99,102,241,0.4)' }}>
            <div className="qi-icon" style={{ background:'var(--accent-glow)' }}>💾</div>
            <div className="qi-label" style={{ color:'var(--accent-light)' }}>Self Claim</div>
          </div>
          <div className="quick-item" onClick={triggerSOS} style={{ border:'1px solid rgba(239,68,68,0.4)' }}>
            <div className="qi-icon">🚨</div>
            <div className="qi-label" style={{ color:'var(--danger)' }}>Emergency SOS</div>
          </div>
          <div className="quick-item" onClick={runStressTest} style={{ border:'1px dashed var(--warning)' }}>
            <div className="qi-icon">🔥</div>
            <div className="qi-label" style={{ color:'var(--warning)' }}>Stress Test</div>
          </div>
        </div>

        {/* Live Triggers */}
        <div className="triggers-section">
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px' }}>
            <div>
              <div className="section-badge" style={{ marginBottom:'4px' }}>⚠️ Live Triggers</div>
              <h3 style={{ fontSize:'1rem',fontWeight:800 }}>Active Risk Alerts</h3>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:'6px' }}>
              <div className="api-status-dot live" />
              <span style={{ fontSize:'0.65rem',color:'var(--text-muted)' }}>{user.isDemo ? 'Live · MockAPI' : 'Live · OpenWeather'}</span>
            </div>
          </div>
          <div id="triggerCards">
            {triggerCards.map((card, i) => (
              <div key={card.type} className={`trigger-card ${card.level}`} style={{ animationDelay:`${i*0.1}s` }}>
                <div className="trigger-icon-wrap">{card.icon}</div>
                <div className="trigger-meta">
                  <div className="trigger-title">{card.triggered ? card.title : card.type==='rain'?'🌤️ No Rain Alert':card.type==='aqi'?'💨 Clean Air':'🌡️ Normal Temperature'}</div>
                  <div className="trigger-desc">{card.desc}</div>
                </div>
                <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'6px',flexShrink:0 }}>
                  <div className="trigger-badge">{card.triggered ? (card.level === 'high' ? 'HIGH' : 'MODERATE') : 'SAFE'}</div>
                  {card.triggered && (
                    <button className="trigger-claim-btn" onClick={() => openTriggerClaim(card)}>Claim →</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics */}
        <div className="analytics-section">
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px' }}>
            <div>
              <div className="section-badge" style={{ marginBottom:'4px' }}>📊 Analytics · {user.isDemo ? 'MockAPI' : 'Live'}</div>
              <h3 style={{ fontSize:'1rem',fontWeight:800 }}>Weekly Earnings vs Protection</h3>
            </div>
            <button className="btn-icon" onClick={() => buildChart()}>🔄</button>
          </div>

          <div className="analytics-summary">
            <div className="ascard"><div className="ascard-icon" style={{background:'rgba(99,102,241,0.15)',color:'#818cf8'}}>💰</div><div className="ascard-val">₹{summary.earnings.toLocaleString()}</div><div className="ascard-label">Total Earnings</div></div>
            <div className="ascard"><div className="ascard-icon" style={{background:'rgba(16,185,129,0.15)',color:'#10b981'}}>🛡️</div><div className="ascard-val">₹{summary.protected.toLocaleString()}</div><div className="ascard-label">Protected</div></div>
            <div className="ascard"><div className="ascard-icon" style={{background:'rgba(245,158,11,0.15)',color:'#f59e0b'}}>⏱️</div><div className="ascard-val">{summary.hours}h</div><div className="ascard-label">Hours Covered</div></div>
          </div>

          <div className="chart-wrapper">
            <canvas ref={chartRef} id="earningsChart" height="220" />
          </div>

          <div className="chart-legend">
            <div className="cl-item"><span className="cl-dot" style={{background:'#6366f1'}}></span>Earnings</div>
            <div className="cl-item"><span className="cl-dot" style={{background:'#10b981'}}></span>Protected</div>
            <div className="cl-item"><span className="cl-dot" style={{background:'#f59e0b',borderRadius:'2px'}}></span>Loss Avoided</div>
          </div>
        </div>

        {/* Alerts */}
        <div className="alert-section">
          <h3>⚡ Live Alerts</h3>
          <div id="dashAlerts">
            <div className="alert-item info">
              <span className="alert-icon">ℹ️</span>
              <div><div className="alert-text">{policy.active ? 'Coverage active — monitoring your zone' : 'Select a plan to start receiving alerts'}</div><div className="alert-time">Now</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SelfClaimPicker isOpen={selfClaimOpen} onClose={() => setSelfClaimOpen(false)} onPick={onPickClaim} />
      <UniversalSOSModal isOpen={sosModalOpen} onClose={() => setSosModalOpen(false)} />
      <ClaimPipeline
        isOpen={pipeline.open}
        triggerKey={pipeline.key}
        triggerTitle={pipeline.title}
        triggerIcon={pipeline.icon}
        isManual={pipeline.manual}
        onClose={() => setPipeline(p => ({ ...p, open: false }))}
      />
    </div>
  );
}
