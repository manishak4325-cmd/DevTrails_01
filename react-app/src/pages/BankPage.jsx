import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function BankPage() {
  const { state, dispatch, navigate, addToast } = useApp();
  const [form, setForm] = useState({ name:'', acc:'', ifsc:'', upi:'' });

  // Safe Initialization
  React.useEffect(() => {
    if (state.user?.isDemo) {
      setForm({
        name: "Demo User",
        acc: "9999999999",
        ifsc: "DEMO0001234",
        upi: "demo@upi"
      });
    } else {
      setForm({ name: '', acc: '', ifsc: '', upi: '' });
    }
  }, [state.user?.isDemo]);

  // Read selected plan from localStorage (set by PlanPage)
  let selectedPlan = null;
  try {
    const raw = localStorage.getItem('selected_plan');
    if (raw) selectedPlan = JSON.parse(raw);
  } catch {}

  // Also fall back to state policy
  const planName    = selectedPlan?.planName || state.policy?.plan || null;
  const premium     = selectedPlan?.premium  || state.policy?.premium || null;
  const coverage    = selectedPlan?.coverage || state.policy?.coverage || null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.acc || !form.ifsc) { addToast('Fill required fields', 'warning'); return; }
    dispatch({ type: 'SET_BANK', payload: form });
    // Activate the policy now that payment details are set
    if (selectedPlan) {
      dispatch({ type:'SET_POLICY', payload:{ plan: selectedPlan.planId, premium: selectedPlan.premium, coverage: selectedPlan.coverage, active: true } });
      localStorage.removeItem('selected_plan');
    }
    addToast('Payment setup complete! Plan is now active.', 'success');
    setTimeout(() => navigate('dashboard'), 600);
  }

  const field = (key, label, type='text', placeholder='') => (
    <div className="form-group">
      <label>{label}</label>
      <input type={type} className="form-input" placeholder={placeholder}
        value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        required={key !== 'upi'} />
    </div>
  );

  return (
    <div className="page active" id="page-bank">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Payment Setup</h2>
            <p>Where should we send your payouts?</p>
          </div>

          {/* Show selected plan summary */}
          {planName && (
            <div style={{ background:'var(--surface-elevated)', border:'1px solid var(--accent)', borderRadius:'10px', padding:'12px 14px', marginBottom:'18px' }}>
              <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:'2px' }}>Selected Plan</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontWeight:800, color:'var(--accent-light)', fontSize:'0.95rem' }}>{planName}</div>
                <div style={{ fontWeight:900, color:'var(--success)', fontSize:'1.1rem' }}>₹{premium}<span style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:400 }}>/week</span></div>
              </div>
              {coverage && <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'2px' }}>Coverage: ₹{coverage?.toLocaleString()}</div>}
            </div>
          )}

          <form onSubmit={handleSubmit} id="bankForm">
            {field('name','Account Holder Name','text','As per bank records')}
            {field('acc','Account Number','password','Enter A/C Number')}
            {field('ifsc','IFSC Code','text','e.g. HDFC0001234')}
            <div className="form-group">
              <label>UPI ID (Optional)</label>
              <input type="text" className="form-input" placeholder="name@bank" value={form.upi} onChange={e => setForm(f => ({ ...f, upi: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-success btn-block" style={{ padding:'14px',background:'var(--success)',color:'#fff',marginTop:'10px' }}>
              {planName ? `Confirm & Activate ${planName} →` : 'Verify & Continue →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
