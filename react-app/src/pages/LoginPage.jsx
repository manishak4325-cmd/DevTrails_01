import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CITY_DATA } from '../utils/cityData';
import { loginUser } from '../utils/realApi';

export default function LoginPage() {
  const { dispatch, addToast, addNotification } = useApp();
  const [activeTab, setActiveTab] = useState('normal');

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");

  // Force clean reset on component mount
  React.useEffect(() => {
    setEmail("");
    setPassword("");
    setCity("");
  }, []);

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'demo') {
      setEmail('demo@fluxshield.com');
      setPassword('12345678');
      setCity('Bangalore');
      localStorage.setItem("isDemo", "true");
    } else {
      setEmail('');
      setPassword('');
      setCity('');
      localStorage.removeItem("isDemo");
    }
  };

  async function handleNormalLogin(e) {
    e.preventDefault();
    if (!email || !password) { addToast('Enter email and password', 'warning'); return; }

    const raw = email.split('@')[0];
    const name = raw.replace(/[.\-_0-9]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim() || 'User';

    addToast('Connecting to database...', 'info');
    
    fetch("http://127.0.0.1:8000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, city })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const userCity = city; // Always prioritize the user's current selection
          const coords   = CITY_DATA[userCity] || { lat: null, lng: null };
          
          localStorage.setItem("user_id", data.user.id || email);
          localStorage.setItem("isDemo", "false");
          
          // STEP 2: STORE CITY ON LOGIN
          localStorage.setItem("userLocation", JSON.stringify({
            city: userCity,
            lat: coords.lat,
            lng: coords.lng
          }));

          dispatch({ type: 'NORMAL_LOGIN', name, email, id: data.user.id || email, city: userCity });
          addToast(`Welcome, ${name}!`, 'success');
        } else {
          addToast(data.error || "Login failed", "danger");
        }
      })
      .catch(err => {
        addToast("Server not reachable", "danger");
      });
  }

  function handleDemoFormSubmit(e) {
    e.preventDefault();
    handleDemoLogin();
  }

  function handleDemoLogin() {
    setEmail("demo@fluxshield.com");
    setPassword("12345678");
    setCity("Bangalore");
    localStorage.setItem("isDemo", "true");
    
    // STEP 5: Force Bangalore in Demo Mode
    localStorage.setItem("userLocation", JSON.stringify({
      city: "Bangalore",
      lat: 12.9716,
      lng: 77.5946
    }));

    dispatch({ type: 'DEMO_LOGIN', city: 'Bangalore' });
    addToast('🚀 Entering Demo Mode...', 'success');
  }

  const cities = Object.keys(CITY_DATA);

  return (
    <div className="page active" id="page-auth">
      <div className="auth-container">
        <div className="auth-card">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--gradient-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', margin: '0 auto 10px' }}>⚡</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>FluxShield</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px' }}>Smart Insurance for Delivery Workers</p>
          </div>

          <div className="login-tabs">
            <button className={`login-tab${activeTab === 'normal' ? ' active' : ''}`} onClick={() => switchTab('normal')}>🔒 Login</button>
            <button className={`login-tab${activeTab === 'demo' ? ' active' : ''}`} onClick={() => switchTab('demo')}>🚀 Demo Login</button>
          </div>

          {activeTab === 'normal' && (
            <form onSubmit={handleNormalLogin} autoComplete="off">
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-icon-wrap">
                  <span className="input-icon">📧</span>
                  <input type="email" class="form-input form-input-icon" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label>Password</label>
                <div className="input-icon-wrap">
                  <span className="input-icon">🔑</span>
                  <input type="password" class="form-input form-input-icon" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label>Your City</label>
                <select className="form-input" value={city} onChange={e => setCity(e.target.value)} required>
                  <option value="" disabled>Select City</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-block" style={{ padding: '14px', marginTop: '4px' }}>Sign In →</button>
            </form>
          )}

          {activeTab === 'demo' && (
            <div>
              <div className="demo-hint-banner" style={{ marginBottom: '16px' }}>
                <span>🎯</span>
                <div><strong>Demo Mode</strong> — Loads from MockAPI with realistic data</div>
              </div>
              <form onSubmit={handleDemoFormSubmit} autoComplete="off">
                <div className="form-group">
                  <label>Username</label>
                  <div className="input-icon-wrap">
                    <span className="input-icon">👤</span>
                    <input type="text" class="form-input form-input-icon" placeholder="Username" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <div className="input-icon-wrap">
                    <span className="input-icon">🔑</span>
                    <input type="password" class="form-input form-input-icon" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Your City</label>
                  <select className="form-input" value={city} onChange={e => setCity(e.target.value)} required>
                    <option value="" disabled>Select City</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary btn-block" style={{ padding: '14px', marginTop: '4px' }}>Login as Ravi Kumar →</button>
              </form>
              <div className="auth-divider"><span>or</span></div>
              <button className="btn demo-login-btn" onClick={handleDemoLogin} style={{ marginTop: 0 }}>
                <span>🚀</span> Try Demo (One Click)
              </button>
            </div>
          )}

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>🔒 256-bit encryption · IRDAI Regulated</p>
        </div>
      </div>
    </div>
  );
}
