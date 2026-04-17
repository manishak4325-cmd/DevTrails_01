import React from 'react';
import { useApp } from '../context/AppContext';

export default function AppHeader() {
  const { state, dispatch, navigate } = useApp();
  const { currentPage, user, notifications } = state;
  const [isDark, setIsDark] = React.useState(true);
  const [notifOpen, setNotifOpen] = React.useState(false);

  function toggleTheme() {
    setIsDark(d => !d);
    document.body.classList.toggle('light-mode');
  }

  function toggleNotifs() {
    setNotifOpen(o => !o);
    if (!notifOpen) dispatch({ type: 'CLEAR_UNREAD' });
  }

  return (
    <>
      <header className="app-header" id="appHeader">
        <div className="header-brand" onClick={() => navigate('landing')} style={{ cursor: 'pointer' }}>
          <svg viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="url(#g1)" strokeWidth="2.5"/>
            <path d="M16 8l6 12H10l6-12z" fill="url(#g1)"/>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#6366f1"/>
                <stop offset="1" stopColor="#a855f7"/>
              </linearGradient>
            </defs>
          </svg>
          FluxShield
        </div>
        <div className="header-actions">
          <button className="btn-icon" onClick={toggleTheme}>{isDark ? '🌙' : '☀️'}</button>
          {user.isLoggedIn && (
            <button className="btn-icon" onClick={toggleNotifs} style={{ position: 'relative' }}>
              🔔
              {notifications.unread > 0 && (
                <span className="notif-badge" style={{ display: 'flex' }}>{notifications.unread}</span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Notifications Panel */}
      {notifOpen && (
        <div className="notif-panel open" id="notifPanel">
          <div className="notif-header">
            <h3>🔔 Notifications</h3>
            <button className="btn-ghost btn-sm" onClick={toggleNotifs}>✕</button>
          </div>
          <div id="notifList">
            {notifications.list.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '12px' }}>No notifications yet.</p>
            ) : (
              notifications.list.map((n, i) => (
                <div key={i} className="notif-item">
                  <div className="notif-dot" style={{ background: n.type === 'success' ? 'var(--success)' : n.type === 'danger' ? 'var(--danger)' : 'var(--info)' }} />
                  <div className="notif-content">
                    <p>{n.msg}</p>
                    <div className="time">Just now</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
