import React from 'react';
import { useApp } from '../context/AppContext';

export default function LandingPage() {
  const { navigate } = useApp();

  return (
    <div className="page active" id="page-landing">
      <div className="hero-mobile">
        <h1>Smart <span>Insurance</span> for Delivery Workers</h1>
        <p>AI-powered, location-based payouts — no claims required.</p>
        <img src="/hero_illustration.png" alt="Delivery rider" />
        <div className="hero-buttons">
          <button className="btn btn-primary" onClick={() => navigate('auth')}>🚀 Get Started</button>
          <button className="btn btn-secondary" onClick={() => navigate('auth')}>🗺️ View Risk Map</button>
        </div>
        <div className="hero-stats">
          <div><div className="hero-stat-value">50K+</div><div className="hero-stat-label">Protected</div></div>
          <div><div className="hero-stat-value">₹2Cr+</div><div className="hero-stat-label">Payouts</div></div>
          <div><div className="hero-stat-value">&lt;2hr</div><div className="hero-stat-label">Avg Time</div></div>
        </div>
      </div>

      <div className="page-content">
        {/* Features */}
        <div style={{ textAlign:'center',marginBottom:'16px' }}>
          <div className="section-badge">⚡ Features</div>
          <h2 className="section-title">Why FluxShield?</h2>
        </div>
        <div className="feature-row">
          <div className="card"><div className="card-icon accent">📡</div><h3>Live Detection</h3><p>GPS-based zone monitoring in real-time.</p></div>
          <div className="card"><div className="card-icon success">⚡</div><h3>Instant Payout</h3><p>Auto UPI transfer in under 2 hours.</p></div>
          <div className="card"><div className="card-icon warning">📅</div><h3>₹35/week</h3><p>Affordable weekly plans for gig workers.</p></div>
          <div className="card"><div className="card-icon purple">🤖</div><h3>AI Validated</h3><p>Smart fraud checks before every payout.</p></div>
        </div>

        {/* How it works */}
        <div style={{ textAlign:'center',margin:'24px 0 8px' }}>
          <div className="section-badge">🔄 Process</div>
          <h2 className="section-title">How It Works</h2>
        </div>
        <div className="steps-row">
          <div className="step-item"><div className="step-number">1</div><h3 style={{fontSize:'0.85rem'}}>Detect</h3><p style={{color:'var(--text-secondary)',fontSize:'0.7rem'}}>Live monitoring</p></div>
          <div className="step-arrow">→</div>
          <div className="step-item"><div className="step-number">2</div><h3 style={{fontSize:'0.85rem'}}>Validate</h3><p style={{color:'var(--text-secondary)',fontSize:'0.7rem'}}>AI checks</p></div>
          <div className="step-arrow">→</div>
          <div className="step-item"><div className="step-number">3</div><h3 style={{fontSize:'0.85rem'}}>Payout</h3><p style={{color:'var(--text-secondary)',fontSize:'0.7rem'}}>Instant UPI</p></div>
        </div>

        {/* Testimonials */}
        <div style={{ textAlign:'center',margin:'24px 0 12px' }}>
          <div className="section-badge">💬 Stories</div>
          <h2 className="section-title">Trusted by Riders</h2>
        </div>
        <div className="card testimonial-card">
          <p className="quote">"Got ₹150 during Mumbai monsoon without filing anything."</p>
          <div className="author">
            <div className="avatar">R</div>
            <div className="author-info"><div className="name">Rajan Kumar</div><div className="role">Zomato, Mumbai</div></div>
          </div>
        </div>
        <div className="card testimonial-card">
          <p className="quote">"₹35/week is nothing for the peace of mind it gives."</p>
          <div className="author">
            <div className="avatar">A</div>
            <div className="author-info"><div className="name">Amit Sharma</div><div className="role">Blinkit, Bangalore</div></div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign:'center',padding:'24px 0' }}>
          <h2 className="section-title">Ready?</h2>
          <p className="section-subtitle" style={{ marginBottom:'16px' }}>Join 50,000+ protected riders.</p>
          <button className="btn btn-primary" onClick={() => navigate('auth')}>🛡️ Start Coverage</button>
        </div>
      </div>
    </div>
  );
}
