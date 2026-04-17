import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { fetchMockClaims, FALLBACK_CLAIMS } from '../utils/mockApi';
import ClaimPipeline from '../components/ClaimPipeline';

export default function ClaimsPage() {
  const { state, addToast } = useApp();
  const { user, claims, policy } = state;

  const [apiClaims, setApiClaims]       = useState([]);
  const [apiLoading, setApiLoading]     = useState(true);
  const [apiDotLive, setApiDotLive]     = useState(false);
  const [manualModal, setManualModal]   = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [pipeline, setPipeline]         = useState({ open:false, key:'', title:'', icon:'', manual:false });

  useEffect(() => {
    loadClaims();
  }, []);

  async function loadClaims() {
    setApiLoading(true);
    setApiDotLive(false);
    const data = await fetchMockClaims();
    setApiClaims(data || FALLBACK_CLAIMS);
    setApiDotLive(true);
    setApiLoading(false);
  }

  function openManual() {
    if (!user.isLoggedIn) { addToast('Please login first', 'warning'); return; }
    setManualModal(true);
    setSelectedType(null);
  }

  function submitManual() {
    if (!selectedType) { addToast('Select disruption type', 'warning'); return; }
    const typeMap = {
      rain:    { title:'High Rain Risk in your zone',   icon:'🌧️' },
      heat:    { title:'Extreme Heat Conditions',       icon:'🔥'  },
      aqi:     { title:'Unhealthy Air Quality',         icon:'🌫️' },
      flood:   { title:'Flood Risk Alert',              icon:'🌊'  },
      storm:   { title:'Severe Storm Detected',         icon:'⚡'  },
      traffic: { title:'Road Blockage Reported',        icon:'🚧'  },
    };
    const t = typeMap[selectedType] || { title: selectedType, icon:'📋' };
    setManualModal(false);
    setTimeout(() => setPipeline({ open:true, key:selectedType, title:t.title, icon:t.icon, manual:true }), 200);
    setSelectedType(null);
  }

  const statusCls = s => ({ Approved:'approved', Blocked:'blocked', Review:'review', approved:'approved', blocked:'blocked', review:'review' })[s] || 'review';
  const statusLabel = s => ({ Approved:'✅ Approved', Blocked:'🚫 Blocked', Review:'⚠️ Review', approved:'✅ Approved', blocked:'🚫 Blocked', review:'⚠️ Review' })[s] || '⚠️ Review';

  const CLAIM_TYPES = [
    { key:'rain',    icon:'🌧️', label:'Rain'    },
    { key:'heat',    icon:'🌡️', label:'Heat'    },
    { key:'aqi',     icon:'🌫️', label:'AQI'     },
    { key:'flood',   icon:'🌊', label:'Flood'   },
    { key:'storm',   icon:'⚡',  label:'Storm'   },
    { key:'traffic', icon:'🚧', label:'Traffic' },
  ];

  return (
    <div className="page active" id="page-claims">
      <div className="page-content">
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px' }}>
          <div>
            <div className="section-badge" style={{ marginBottom:'4px' }}>💳 Claims · MockAPI</div>
            <h2 className="section-title" style={{ margin:0 }}>Your Claims</h2>
          </div>
          <button className="btn-icon" onClick={loadClaims} title="Refresh">🔄</button>
        </div>

        {/* Manual Claim CTA */}
        <div className="manual-claim-card" onClick={openManual}>
          <div style={{ fontSize:'2rem',marginBottom:'6px' }}>📝</div>
          <h3>Raise Manual Claim</h3>
          <p style={{ color:'var(--text-secondary)',fontSize:'0.8rem' }}>Report a disruption for AI validation</p>
        </div>

        {/* API Claims Table */}
        <div className="card" style={{ marginBottom:'16px' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px' }}>
            <h3 style={{ fontSize:'0.95rem',fontWeight:700 }}>📋 Claims from API</h3>
            <div className={`api-status-dot${apiDotLive ? ' live' : ''}`} style={{width:'8px',height:'8px'}} />
          </div>
          <div id="apiClaimsTable" style={{ overflowX:'auto' }}>
            {apiLoading ? (
              <div className="claims-loading">
                <div className="claims-skeleton" /><div className="claims-skeleton" style={{animationDelay:'0.1s'}} /><div className="claims-skeleton" style={{animationDelay:'0.2s'}} />
              </div>
            ) : (
              <table className="claims-api-table">
                <thead><tr><th>Date</th><th>Zone/Type</th><th>Hours</th><th>Fraud%</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {apiClaims.map((r, i) => {
                    const sk  = (r.status||'review').toLowerCase();
                    const fp  = r.fraudPercent || r.fraud_percent || Math.round(Math.random()*20);
                    const amt = r.amount || r.payout || 0;
                    const hrs = r.hoursWorked || r.hours_worked || (5+Math.round(Math.random()*6));
                    return (
                      <tr key={i}>
                        <td>{r.date || (r.createdAt||'').substring(0,10) || '—'}</td>
                        <td><strong>{r.zone || r.location || 'Unknown'}</strong><br/><span style={{fontSize:'0.65rem',color:'var(--text-muted)'}}>{r.type||r.trigger||'Weather'}</span></td>
                        <td style={{textAlign:'center'}}>{hrs}h</td>
                        <td style={{textAlign:'center',color:fp>25?'var(--danger)':'var(--success)',fontWeight:700}}>{fp}%</td>
                        <td>{amt > 0 ? <span style={{color:'var(--success)',fontWeight:700}}>₹{amt}</span> : '—'}</td>
                        <td><span className={`status-pill ${sk}`}>{statusLabel(r.status)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Claim Flow */}
        <h3 style={{ fontSize:'0.9rem',fontWeight:700,marginBottom:'10px' }}>⚡ Auto Claim Flow</h3>
        <div className="claim-flow">
          <div className="claim-step"><div className="claim-step-icon" style={{background:'var(--info-bg)',color:'var(--info)'}}>📡</div><div className="claim-step-content"><h4>1. Trigger</h4><p>API detects event in your zone</p></div></div>
          <div className="claim-step"><div className="claim-step-icon" style={{background:'var(--purple-bg)',color:'var(--purple)'}}>🤖</div><div className="claim-step-content"><h4>2. AI Validates</h4><p>Location + activity + policy check</p></div></div>
          <div className="claim-step"><div className="claim-step-icon" style={{background:'var(--success-bg)',color:'var(--success)'}}>💸</div><div className="claim-step-content"><h4>3. Payout</h4><p>Instant UPI transfer</p></div></div>
        </div>

        {/* AI Log */}
        <div className="card" style={{ marginTop:'16px' }}>
          <h3 style={{ marginBottom:'8px' }}>🤖 AI Validation Log</h3>
          <div id="aiValidationLog">
            {state.claims.aiLogs.length === 0 ? (
              <p style={{ textAlign:'center',color:'var(--text-muted)',padding:'12px',fontSize:'0.8rem' }}>Events appear here when triggers fire.</p>
            ) : (
              state.claims.aiLogs.slice(-8).reverse().map((l, i) => (
                <div key={i} className={`alert-item ${l.valid ? 'success' : 'danger'}`} style={{ marginBottom:'6px' }}>
                  <span className="alert-icon">{l.valid ? '✅' : '❌'}</span>
                  <div><div className="alert-text" style={{fontSize:'0.75rem'}}>{l.msg}</div><div className="alert-time">{l.time}</div></div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payout History */}
        <div className="card" style={{ marginTop:'12px' }}>
          <h3 style={{ marginBottom:'8px' }}>💰 Payout History</h3>
          <div id="payoutHistory" style={{ overflowX:'auto' }}>
            <table className="tier-table">
              <thead><tr><th>Date</th><th>Type</th><th>Zone</th><th>₹</th><th>Status</th></tr></thead>
              <tbody id="payoutTableBody">
                {state.claims.payouts.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign:'center',color:'var(--text-muted)',padding:'16px' }}>No payouts yet</td></tr>
                ) : (
                  [...state.claims.payouts].reverse().map((p, i) => (
                    <tr key={i}>
                      <td>{p.date}</td><td>{p.trigger}</td><td>{p.zone}</td>
                      <td style={{color:'var(--success)',fontWeight:700}}>₹{p.amount}</td>
                      <td><span className="tier-badge" style={{background:'var(--success-bg)',color:'var(--success)'}}>{p.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manual Claim Modal */}
      {manualModal && (
        <div className="modal-overlay open" id="manualClaimModal">
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h3 style={{fontSize:'1.1rem',fontWeight:800,marginBottom:'4px'}}>📝 Raise Manual Claim</h3>
            <p style={{fontSize:'0.8rem',color:'var(--text-secondary)',marginBottom:'16px'}}>Select a disruption type and submit for AI review</p>
            <div className="claim-type-grid" id="claimTypeGrid">
              {CLAIM_TYPES.map(ct => (
                <button key={ct.key} className={`claim-type-btn${selectedType === ct.key ? ' selected' : ''}`} onClick={() => setSelectedType(ct.key)}>
                  <div className="ct-icon">{ct.icon}</div>
                  <div className="ct-label">{ct.label}</div>
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-block" onClick={submitManual} style={{marginTop:'8px'}}>Submit for AI Review</button>
            <button className="btn btn-ghost btn-block" onClick={() => setManualModal(false)} style={{marginTop:'6px'}}>Cancel</button>
          </div>
        </div>
      )}

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
