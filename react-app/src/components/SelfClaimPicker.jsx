import React from 'react';
import { useApp } from '../context/AppContext';

const CLAIM_TYPES = [
  { key: 'rain',    icon: '🌧️', label: 'Rain',    title: 'High Rain Risk in your zone' },
  { key: 'heat',    icon: '🔥',  label: 'Heat',    title: 'Extreme Heat Conditions' },
  { key: 'aqi',     icon: '🌫️', label: 'AQI',     title: 'Unhealthy Air Quality' },
  { key: 'flood',   icon: '🌊',  label: 'Flood',   title: 'Flood Risk Alert' },
  { key: 'storm',   icon: '⚡',  label: 'Storm',   title: 'Severe Storm Detected' },
  { key: 'traffic', icon: '🚧',  label: 'Traffic', title: 'Road Blockage Reported' },
];

export default function SelfClaimPicker({ isOpen, onClose, onPick }) {
  if (!isOpen) return null;

  return (
    <div className="claim-pipeline-overlay active" id="selfClaimPickerOverlay" onClick={e => e.target.id === 'selfClaimPickerOverlay' && onClose()}>
      <div className="claim-pipeline-modal" style={{ borderRadius: '24px 24px 0 0', padding: 0 }}>
        <div className="cp-header">
          <div className="cp-header-left">
            <div className="cp-icon">📝</div>
            <div>
              <div className="cp-title">Self Claim</div>
              <div className="cp-subtitle">Select the disruption type to file</div>
            </div>
          </div>
          <button className="cp-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '16px' }}>
            {CLAIM_TYPES.map(ct => (
              <button
                key={ct.key}
                className="scp-type"
                onClick={() => onPick(ct.key, ct.title, ct.icon)}
                style={{
                  background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 'var(--radius)',
                  padding: '14px 8px', textAlign: 'center', cursor: 'pointer', color: 'var(--text-primary)',
                  fontFamily: 'inherit', transition: 'var(--transition)',
                }}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{ct.icon}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700 }}>{ct.label}</div>
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Your claim will go through AI fraud detection before payout
          </p>
        </div>
      </div>
    </div>
  );
}
