import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PLANS } from '../utils/cityData';
import { simulateFraudScore, classifyScore, getScoreBenefit, generateActivityLogs } from '../utils/fraudEngine';
import { fetchMockFraudScore } from '../utils/mockApi';
import { calcBCR } from '../utils/premiumEngine';

export default function ProfilePage() {
  const { state, dispatch, navigate, addToast } = useApp();
  const { user, policy, bank, claims, triggers, analytics } = state;

  const [fraudData, setFraudData] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [bcrDisplay, setBcrDisplay] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    // Load fraud/trust score
    let fd;
    if (user.isDemo) {
      fd = await fetchMockFraudScore();
    } else {
      fd = simulateFraudScore(claims.payouts, new Set(claims.processedEvents), analytics.claimPenalty);
    }
    setFraudData(fd);
    setActivityLogs(generateActivityLogs());

    // BCR
    const bcr = calcBCR(analytics.totalClaims, analytics.totalPremium);
    setBcrDisplay(bcr);
  }

  function logout() {
    dispatch({ type: 'LOGOUT' });
    addToast('Logged out successfully', 'info');
    navigate('landing');
  }

  function runStressTest() {
    dispatch({ type: 'SET_ANALYTICS', payload: { isStressTest: !analytics.isStressTest } });
    addToast(analytics.isStressTest ? '🔵 Stress test stopped' : '🔥 Stress test activated — BCR +150%', 'warning');
    loadProfile();
  }

  const plan = policy.plan ? PLANS[policy.plan] : null;
  const classification = fraudData ? classifyScore(fraudData.score) : null;
  const benefit = fraudData ? getScoreBenefit(fraudData.score) : null;

  const bcrStatus = bcrDisplay != null
    ? (bcrDisplay > 0.85 ? { cls:'danger', label:'⚠️ Unsustainable', color:'var(--danger)' }
     : bcrDisplay > 0.6  ? { cls:'warning',label:'⚡ Monitor',        color:'var(--warning)' }
     :                     { cls:'success', label:'✅ Healthy',        color:'var(--success)' })
    : null;

  return (
    <div className="page active" id="page-profile">
      <div className="page-content">
        {/* User Card */}
        <div className="profile-card">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar-ring">
              <div className="profile-avatar">{(user.name||'U')[0].toUpperCase()}</div>
            </div>
          </div>
          <div className="profile-name">{user.name || 'User'}</div>
          <div className="profile-role">{user.platform || 'FluxShield'} · {user.role || 'worker'}</div>
          <div style={{ display:'flex',gap:'10px',justifyContent:'center',flexWrap:'wrap',marginTop:'8px' }}>
            {user.email && <div className="profile-chip">📧 {user.email}</div>}
            {user.phone && <div className="profile-chip">📱 {user.phone}</div>}
          </div>
          {user.isDemo && <div className="demo-badge">🎭 Demo Mode</div>}
        </div>

        {/* Policy */}
        <div className="card" style={{ marginBottom:'12px' }}>
          <h3 style={{ marginBottom:'10px' }}>📋 Policy Details</h3>
          {policy.active ? (
            <div id="policyDetails">
              <div className="profile-info-row"><span>Plan</span><strong>{plan?.name || policy.plan}</strong></div>
              <div className="profile-info-row"><span>Coverage</span><strong>₹{(plan?.coverage || 0).toLocaleString()}</strong></div>
              <div className="profile-info-row"><span>Premium</span><strong>₹{policy.premium}/week</strong></div>
              <div className="profile-info-row"><span>Status</span><span style={{color:'var(--success)',fontWeight:700}}>✅ Active</span></div>
              <div className="profile-info-row"><span>Triggers</span><strong>{plan?.triggers.join(', ')}</strong></div>
            </div>
          ) : (
            <div style={{ textAlign:'center',padding:'16px' }}>
              <p style={{color:'var(--text-muted)',marginBottom:'12px'}}>No active plan</p>
              <button className="btn btn-primary" onClick={() => navigate('pricing')}>Browse Plans →</button>
            </div>
          )}
        </div>

        {/* Bank */}
        {bank.acc && (
          <div className="card" style={{ marginBottom:'12px' }}>
            <h3 style={{ marginBottom:'10px' }}>🏦 Bank Account</h3>
            <div className="profile-info-row"><span>Bank</span><strong>{bank.name || '—'}</strong></div>
            <div className="profile-info-row"><span>Account</span><strong>●●●● {bank.acc.slice(-4)}</strong></div>
            <div className="profile-info-row"><span>IFSC</span><strong>{bank.ifsc}</strong></div>
            {bank.upi && <div className="profile-info-row"><span>UPI</span><strong>{bank.upi}</strong></div>}
          </div>
        )}

        {/* Trust Score */}
        <div className="card trust-score-card" style={{ marginBottom:'12px' }}>
          <h3 style={{ marginBottom:'14px' }}>🛡️ Eligibility Score</h3>
          {fraudData ? (
            <>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px' }}>
                <div>
                  <div className="trust-score-value" style={{ color: classification?.color }}>
                    {fraudData.score.toFixed(2)}
                  </div>
                  <div className={`trust-tier ${classification?.cls}`}>{classification?.tier}</div>
                </div>
                <div className="trust-ring-wrap">
                  <svg viewBox="0 0 36 36" className="trust-ring">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border)" strokeWidth="3"/>
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke={classification?.color||'#6366f1'} strokeWidth="3"
                      strokeDasharray={`${(fraudData.score * 100).toFixed(0)} 100`} strokeLinecap="round" transform="rotate(-90 18 18)"/>
                  </svg>
                </div>
              </div>
              <div className="trust-bars">
                {[
                  { k:'gpsConsistency', l:'GPS Consistency' },
                  { k:'activityLevel',  l:'Activity Level'  },
                  { k:'claimAccuracy',  l:'Claim Accuracy'  },
                  { k:'noDuplicateClaims', l:'No Duplicate Claims' },
                ].map(b => (
                  <div key={b.k} className="trust-bar-row">
                    <span>{b.l}</span>
                    <div className="trust-bar-bg">
                      <div className="trust-bar-fill" style={{ width:`${(fraudData[b.k]||0)*100}%`, background: classification?.color }} />
                    </div>
                    <span>{((fraudData[b.k]||0)*100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
              {benefit && (
                <div id="trustBenefit" className={`trust-benefit ${benefit.cls}`} style={{ marginTop:'10px' }}
                  dangerouslySetInnerHTML={{ __html: benefit.html }} />
              )}
            </>
          ) : (
            <div style={{ textAlign:'center',color:'var(--text-muted)',padding:'16px' }}>Loading score...</div>
          )}
        </div>

        {/* BCR Monitor */}
        <div className="card" style={{ marginBottom:'12px' }}>
          <h3 style={{ marginBottom:'10px' }}>📊 Platform BCR Monitor</h3>
          {bcrDisplay != null && (
            <>
              <div style={{ fontSize:'2rem',fontWeight:900,textAlign:'center',color: bcrStatus?.color }}>{bcrDisplay.toFixed(2)}</div>
              <div style={{ textAlign:'center',marginBottom:'10px' }}><span className={`tier-badge ${bcrStatus?.cls}`}>{bcrStatus?.label}</span></div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',textAlign:'center',background:'var(--surface)',borderRadius:'var(--radius)',padding:'10px' }}>
                <div><div style={{fontSize:'0.65rem',color:'var(--text-muted)'}}>Total Premium</div><div style={{fontWeight:700}}>₹{(analytics.totalPremium/100000).toFixed(1)}L</div></div>
                <div><div style={{fontSize:'0.65rem',color:'var(--text-muted)'}}>Total Claims</div><div style={{fontWeight:700,color:bcrStatus?.color}}>₹{(analytics.totalClaims/100000).toFixed(1)}L</div></div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={runStressTest} style={{ marginTop:'10px',width:'100%',border:'1px dashed var(--danger)',color:'var(--danger)' }}>
                {analytics.isStressTest ? '🔵 Stop Stress Test' : '🔴 Run Stress Simulation'}
              </button>
            </>
          )}
        </div>

        {/* Activity Log */}
        <div className="card" style={{ marginBottom:'12px' }}>
          <h3 style={{ marginBottom:'10px' }}>📜 Activity Log</h3>
          <div id="fraudAiLog">
            {activityLogs.slice(0, 8).map((l, i) => (
              <div key={i} className="activity-log-item">
                <div className="al-dot" />
                <div><strong>{l.event}</strong> · {l.location}</div>
                <div className="al-time">{l.time}</div>
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-ghost btn-sm" onClick={logout}
          style={{ width:'100%',border:'1px solid var(--danger)',color:'var(--danger)',padding:'14px',borderRadius:'var(--radius)',marginBottom:'80px' }}>
          Logout
        </button>
      </div>
    </div>
  );
}
