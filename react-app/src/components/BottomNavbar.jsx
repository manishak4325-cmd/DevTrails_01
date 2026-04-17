import React from 'react';
import { useApp } from '../context/AppContext';

const TABS = [
  { icon: '🏠', label: 'Home',   pageAuth: 'dashboard', pagePublic: 'landing'  },
  { icon: '🗺️', label: 'Map',    pageAuth: 'risk-map',  pagePublic: 'risk-map', locked: true },
  { icon: '💳', label: 'Claims', pageAuth: 'claims',    pagePublic: 'claims',   locked: true },
  { icon: '📋', label: 'Plan',   pageAuth: 'pricing',   pagePublic: 'pricing'  },
  { icon: '👤', label: 'Profile',pageAuth: 'profile',   pagePublic: 'auth'     },
];

export default function BottomNavbar() {
  const { state, navigate } = useApp();
  const { currentPage, user, policy, bank } = state;

  const isLoggedIn = user.isLoggedIn;
  const isFullAccess = isLoggedIn && policy.active && bank.acc;
  const hasAuth = isLoggedIn;

  function getPage(tab) {
    if (tab.label === 'Home')    return isLoggedIn ? 'dashboard' : 'landing';
    if (tab.label === 'Profile') return isLoggedIn ? 'profile' : 'auth';
    return isLoggedIn ? tab.pageAuth : tab.pagePublic;
  }

  function isLocked(tab) {
    if (tab.label === 'Home' || tab.label === 'Profile' || tab.label === 'Plan') return false;
    if (tab.label === 'Map' || tab.label === 'Claims') return !isFullAccess;
    return false;
  }

  function isActive(tab) {
    const page = getPage(tab);
    return currentPage === page ||
      (tab.label === 'Home' && (currentPage === 'landing' || currentPage === 'dashboard'));
  }

  return (
    <nav className="bottom-nav" id="bottomNav">
      {TABS.map(tab => {
        const locked = isLocked(tab);
        const active = isActive(tab);
        return (
          <button
            key={tab.label}
            className={`nav-tab${active ? ' active' : ''}${locked ? ' locked' : ''}`}
            data-page={getPage(tab)}
            onClick={() => !locked && navigate(getPage(tab))}
            style={{ pointerEvents: locked ? 'none' : 'auto' }}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
