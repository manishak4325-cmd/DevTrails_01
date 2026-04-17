import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PLANS, CITY_DATA } from '../utils/cityData';
import { calculatePremium, getExpectedLoss } from '../utils/premiumEngine';
import { giftPlan } from '../utils/realApi';

const PLAN_ICONS = { basic: '🛡️', pro: '⚡', max: '🔥' };
const PLAN_BADGES = { basic: '', pro: '✨ Popular', max: '🔥 Best' };

export default function PlanPage() {
  const { state, dispatch, navigate, addToast } = useApp();
  const { user, policy, risk, env, analytics } = state;

   const [calcCity, setCalcCity]   = useState(user.location || "");
  const [calcRisk,  setCalcRisk]  = useState('moderate');
  const [calcPlan,  setCalcPlan]  = useState('pro');
  const [calcResult,setCalcResult]= useState(null);

  const [giftReceiver, setGiftReceiver] = useState('');
  const [giftPlanId, setGiftPlanId] = useState('pro');

  // Safe Initialization
  React.useEffect(() => {
    setGiftReceiver('');
  }, []);

  async function handleGiftSubmit(e) {
    e.preventDefault();
    if (!user.isLoggedIn) { addToast('Please login first', 'warning'); return; }
    if (!giftReceiver) { addToast('Enter receiver email', 'warning'); return; }
    try {
      const data = await giftPlan(user.email || user.id || 'demo@fluxshield.com', giftReceiver, giftPlanId);
      if (data && data.success) {
        addToast(`🎁 Successfully gifted ${PLANS[giftPlanId].name} to ${giftReceiver}!`, 'success');
        setGiftReceiver('');
      } else {
        addToast(data?.message || 'Gift sent! (check inbox)', 'success');
        setGiftReceiver('');
      }
    } catch(err) {
      console.error('Gift error:', err);
      addToast('Failed to send gift. Check your connection.', 'danger');
    }
  }

  function selectPlan(planId) {
    if (!user.isLoggedIn) { addToast('Please login first', 'warning'); navigate('auth'); return; }
    const plan    = PLANS[planId];
    const aqi     = env?.aqi  || risk.level.aqi  || 0;
    const rain    = env?.rain || risk.level.rain || 0;
    const heat    = env?.temp || risk.level.temp || 25;
    const premium = calculatePremium(planId, 1.0, aqi, rain, heat, analytics.isStressTest ? 1.5 : 1.0);
    // Store selected plan so bank/transaction page can display it
    localStorage.setItem('selected_plan', JSON.stringify({ planId, planName: plan.name, premium, coverage: plan.coverage }));
    dispatch({ type:'SET_POLICY', payload:{ plan: planId, premium, coverage: plan.coverage, active: false } });
    addToast(`✅ ${plan.name} selected at ₹${premium}/week — complete payment to activate`, 'success');
    navigate('bank'); // Always go to payment/bank page
  }

  function runCalculator(e) {
    e.preventDefault();
    const riskMap = { low: 0.5, moderate: 1.0, high: 1.5, severe: 2.0 };
    const aqi     = { low:80, moderate:180, high:300, severe:420 }[calcRisk];
    const rain    = { low:5,  moderate:18,  high:35,  severe:60  }[calcRisk];
    const heat    = { low:28, moderate:34,  high:40,  severe:45  }[calcRisk];
    const premium = calculatePremium(calcPlan, riskMap[calcRisk], aqi, rain, heat, 1.0);
    const expLoss = getExpectedLoss(calcPlan, riskMap[calcRisk]);
    setCalcResult({ premium, expLoss, plan: PLANS[calcPlan]?.name, city: calcCity, risk: calcRisk });
  }

  const cities = Object.keys(CITY_DATA);

  return (
    <div className="page active" id="page-pricing">
      <div className="page-content">
        <div style={{ textAlign:'center',marginBottom:'20px' }}>
          <div className="section-badge">📋 Plans</div>
          <h2 className="section-title">Protection Plans</h2>
          <p style={{ color:'var(--text-secondary)',fontSize:'0.8rem' }}>Premium adjusts dynamically with live risk conditions</p>
        </div>

        {/* Plans */}
        <div id="pricingCards">
          {Object.values(PLANS).map(plan => {
            const isActive = policy.plan === plan.id && policy.active;
            const aqi      = env?.aqi  || 0;
            const rain     = env?.rain || 0;
            const heat     = env?.temp || 25;
            const premium  = calculatePremium(plan.id, 1.0, aqi, rain, heat, analytics.isStressTest ? 1.5 : 1.0);
            const expLoss  = getExpectedLoss(plan.id, analytics.isStressTest ? 1.5 : 1.0);

            return (
              <div key={plan.id} className={`pricing-card${isActive ? ' active-plan' : ''}${plan.id === 'pro' ? ' featured' : ''}`}>
                {PLAN_BADGES[plan.id] && <div className="plan-badge">{PLAN_BADGES[plan.id]}</div>}
                <div className="plan-header">
                  <div className="plan-icon">{PLAN_ICONS[plan.id]}</div>
                  <div>
                    <h3 className="plan-name">{plan.name}</h3>
                    <div className="plan-price">₹<span>{premium}</span>/week</div>
                  </div>
                </div>
                <div className="plan-features">
                  <div className="pf-item"><span className="pf-icon success">✅</span>Coverage: ₹{plan.coverage.toLocaleString()}</div>
                  <div className="pf-item"><span className="pf-icon warning">📊</span>Expected Loss: ₹{expLoss}/week</div>
                  <div className="pf-item"><span className="pf-icon info">🎯</span>Triggers: {plan.triggers.join(', ')}</div>
                  <div className="pf-item"><span className="pf-icon purple">🤖</span>AI Fraud Detection</div>
                  <div className="pf-item"><span className="pf-icon success">💸</span>Auto UPI Payout</div>
                </div>
                <button
                  className={`btn btn-block${isActive ? '' : (plan.id==='pro' ? ' btn-primary' : '')}`}
                  onClick={() => selectPlan(plan.id)}
                  style={isActive ? {background:'var(--success)',color:'#fff'} : {}}
                >
                  {isActive ? '✅ Active Plan' : `Choose ${plan.name} →`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Premium Calculator */}
        <div className="section-badge" style={{ marginTop:'24px',marginBottom:'8px' }}>🧮 Calculator</div>
        <div className="card">
          <h3 style={{ fontSize:'0.95rem',fontWeight:700,marginBottom:'14px' }}>📊 Dynamic Premium Calculator</h3>
          <form onSubmit={runCalculator}>
            <div className="form-group">
              <label>City</label>
              <select className="form-input" value={calcCity} onChange={e => setCalcCity(e.target.value)}>
                {cities.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Risk Level</label>
              <select className="form-input" value={calcRisk} onChange={e => setCalcRisk(e.target.value)}>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
                <option value="severe">Severe</option>
              </select>
            </div>
            <div className="form-group">
              <label>Plan</label>
              <select className="form-input" value={calcPlan} onChange={e => setCalcPlan(e.target.value)}>
                {Object.values(PLANS).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-block" style={{marginTop:'4px'}}>Calculate →</button>
          </form>

          {calcResult && (
            <div className="calc-result" style={{ marginTop:'16px',background:'var(--surface-elevated)',borderRadius:'var(--radius)',padding:'14px',border:'1px solid var(--border)' }}>
              <div style={{ fontWeight:700,marginBottom:'6px',color:'var(--accent-light)' }}>
                {calcResult.plan} · {calcResult.city} · {calcResult.risk} risk
              </div>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <div>
                  <div style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>Dynamic Premium</div>
                  <div style={{fontSize:'1.5rem',fontWeight:900,color:'var(--accent-light)'}}>₹{calcResult.premium}<span style={{fontSize:'0.7rem',fontWeight:400,color:'var(--text-muted)'}}>/week</span></div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>Expected Potential Loss</div>
                  <div style={{fontSize:'1.1rem',fontWeight:800,color:'var(--danger)'}}>₹{calcResult.expLoss}<span style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>/week</span></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Premium Gifting Feature */}
        <div className="section-badge" style={{ marginTop:'24px',marginBottom:'8px', background:'var(--purple-bg)', color:'var(--purple)' }}>🎁 Gift Plan</div>
        <div className="card">
          <h3 style={{ fontSize:'0.95rem',fontWeight:700,marginBottom:'14px' }}>Gift Premium to a Friend</h3>
          <form onSubmit={handleGiftSubmit}>
            <div className="form-group">
              <label>Friend's Email</label>
              <input type="email" className="form-input" style={{width: '100%', boxSizing:'border-box'}} placeholder="user@delivery.in" value={giftReceiver} onChange={e => setGiftReceiver(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Plan</label>
              <select className="form-input" value={giftPlanId} onChange={e => setGiftPlanId(e.target.value)}>
                {Object.values(PLANS).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-block" style={{marginTop:'4px', background:'var(--purple)'}}>Send Gift 🎁</button>
          </form>
        </div>

        {/* Feature Comparison */}
        <div className="section-badge" style={{ marginTop:'20px',marginBottom:'8px' }}>📊 Comparison</div>
        <div className="card" style={{ overflowX:'auto' }}>
          <table className="tier-table" id="tierTable">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Basic 🛡️</th>
                <th>Pro ⚡</th>
                <th>Max 🔥</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Coverage</td><td>₹2000</td><td>₹5000</td><td>₹10,000</td></tr>
              <tr><td>Rain</td><td>✅</td><td>✅</td><td>✅</td></tr>
              <tr><td>AQI</td><td>❌</td><td>✅</td><td>✅</td></tr>
              <tr><td>Heat</td><td>❌</td><td>✅</td><td>✅</td></tr>
              <tr><td>Flood</td><td>❌</td><td>❌</td><td>✅</td></tr>
              <tr><td>AI Fraud</td><td>✅</td><td>✅</td><td>✅</td></tr>
              <tr><td>Priority Support</td><td>❌</td><td>⚡</td><td>✅</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
