import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { CITY_DATA, DEMO_USER, DEMO_PAYOUTS } from '../utils/cityData';

// ===== INITIAL STATE =====
const INITIAL_STATE = {
  currentPage: 'landing',
  user: {
    id: '', name: '', phone: '', email: '', platform: '', location: '',
    role: 'worker', isLoggedIn: false, isDemo: false,
    lat: null, lng: null, zoneIdx: 0, gpsActive: false, subscriptionWeeks: 0,
  },
  policy: { plan: null, premium: 0, coverage: 0, active: false },
  bank:   { name: '', acc: '', ifsc: '', upi: '' },
  risk: {
    type: 'rain',
    level: { aqi: 0, rain: 0, temp: 25, humidity: 50, wind: 0, desc: '', flood: 'Low', city: '' },
    userZone: null,
  },
  claims: {
    payouts: [],
    aiLogs: [],
    processedEvents: [],   // array (serializable), used as Set in logic
    manualClaims: [],
  },
  triggers:  { history: [], count: 0 },
  analytics: {
    bcr: 0.65, totalPremium: 500000, totalClaims: 325000,
    isStressTest: false, subscriptionsDisabled: false,
    claimPenalty: 0, trustScore: null,
  },
  notifications: { list: [], unread: 0 },
  toasts: [],
  env: { temp: null, rain: null, aqi: null },
};

const DEMO_LOCATION = {
  city: "Bangalore",
  lat: 12.9716,
  lng: 77.5946
};

// ===== REDUCER =====
function reducer(state, action) {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, currentPage: action.page };

    case 'SET_USER':
      return { ...state, user: { ...state.user, ...action.payload } };

    case 'SET_POLICY':
      return { ...state, policy: { ...state.policy, ...action.payload } };

    case 'SET_BANK':
      return { ...state, bank: { ...state.bank, ...action.payload } };

    case 'SET_RISK_LEVEL':
      return { ...state, risk: { ...state.risk, level: { ...state.risk.level, ...action.payload } } };

    case 'SET_RISK_TYPE':
      return { ...state, risk: { ...state.risk, type: action.riskType } };

    case 'SET_USER_ZONE':
      return { ...state, risk: { ...state.risk, userZone: action.zone } };

    case 'ADD_PAYOUT':
      return { ...state, claims: { ...state.claims, payouts: [action.payout, ...state.claims.payouts] } };

    case 'SET_PAYOUTS':
      return { ...state, claims: { ...state.claims, payouts: action.payouts } };

    case 'ADD_AI_LOG':
      return { ...state, claims: { ...state.claims, aiLogs: [...state.claims.aiLogs, action.log] } };

    case 'ADD_PROCESSED_EVENT':
      return { ...state, claims: { ...state.claims, processedEvents: [...state.claims.processedEvents, action.eid] } };

    case 'SET_TRIGGERS':
      return { ...state, triggers: { ...state.triggers, ...action.payload } };

    case 'INCREMENT_TRIGGER':
      return { ...state, triggers: { ...state.triggers, count: state.triggers.count + 1 } };

    case 'SET_ANALYTICS':
      return { ...state, analytics: { ...state.analytics, ...action.payload } };

    case 'ADD_NOTIFICATION': {
      const newList = [action.notif, ...state.notifications.list].slice(0, 20);
      return { ...state, notifications: { list: newList, unread: state.notifications.unread + 1 } };
    }

    case 'CLEAR_UNREAD':
      return { ...state, notifications: { ...state.notifications, unread: 0 } };

    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.toast] };

    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) };

    case 'SET_ENV': {
      const p = action.payload;
      return {
        ...state,
        env: { ...state.env, ...p },
        risk: {
          ...state.risk,
          level: {
            ...state.risk.level,
            ...(p.temp != null ? { temp: Math.round(p.temp) } : {}),
            ...(p.rain != null ? { rain: p.rain } : {}),
            ...(p.aqi  != null ? { aqi: p.aqi } : {}),
            ...(p.desc ? { desc: p.desc } : {}),
          },
        },
      };
    }

    case 'DEMO_LOGIN': {
      // Step 5: Force Bangalore in Demo Mode
      localStorage.setItem("userLocation", JSON.stringify({
        city: "Bangalore",
        lat: DEMO_LOCATION.lat,
        lng: DEMO_LOCATION.lng
      }));

      return {
        ...state,
        currentPage: 'dashboard',
        user: { 
          ...DEMO_USER, 
          location: "Bangalore", 
          lat: DEMO_LOCATION.lat, 
          lng: DEMO_LOCATION.lng 
        },
        policy: { plan: 'pro', premium: 50, coverage: 5000, active: true },
        bank:   { name: 'HDFC Bank', acc: 'XXXX 1234', ifsc: 'HDFC0001234', upi: '9876543210@hdfc' },
        claims: { ...INITIAL_STATE.claims, payouts: [...DEMO_PAYOUTS] },
        triggers:  { history: [], count: 3 },
        analytics: { ...INITIAL_STATE.analytics, bcr: 0.65, totalPremium: 500000, totalClaims: 325000 },
        env: { temp: 43, rain: 25, aqi: 178 },
      };
    }

    case 'NORMAL_LOGIN': {
      const city = action.city;
      const cd   = city ? (CITY_DATA[city] || CITY_DATA.Bangalore) : { lat: null, lng: null };
      
      // Persist as requested in Step 2
      localStorage.setItem("userLocation", JSON.stringify({
        city,
        lat: cd.lat,
        lng: cd.lng
      }));

      return {
        ...state,
        currentPage: 'pricing',
        user: {
          id: action.id || action.email, 
          name: action.name, 
          email: action.email, 
          phone: '', 
          platform: 'Blinkit',
          location: city || '', 
          role: 'worker', 
          isLoggedIn: true, 
          isDemo: false,
          lat: cd.lat, 
          lng: cd.lng, 
          zoneIdx: 0, 
          gpsActive: false, 
          subscriptionWeeks: 0,
        },
        policy: { plan: null, premium: 0, coverage: 0, active: false },
        bank:   { name: '', acc: '', ifsc: '', upi: '' },
        claims: INITIAL_STATE.claims,
        triggers: INITIAL_STATE.triggers,
        analytics: INITIAL_STATE.analytics,
        env: INITIAL_STATE.env,
      };
    }

    case 'LOGOUT':
      return {
        ...INITIAL_STATE,
        currentPage: 'landing',
        notifications: INITIAL_STATE.notifications,
      };

    default:
      return state;
  }
}

// ===== CONTEXT =====
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE, (init) => {
    // Rehydrate from localStorage
    try {
      const saved = localStorage.getItem('fluxshield_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Always start on landing after page refresh
        return { ...init, ...parsed, currentPage: 'landing', toasts: [] };
      }
    } catch {}
    return init;
  });

  // Persist key state to localStorage
  useEffect(() => {
    try {
      const { user, policy, bank, claims, triggers, analytics } = state;
      localStorage.setItem('fluxshield_state', JSON.stringify({ user, policy, bank, claims, triggers, analytics }));
    } catch {}
  }, [state.user, state.policy, state.bank, state.claims, state.triggers, state.analytics]);

  // ACTION HELPERS
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    dispatch({ type: 'ADD_TOAST', toast: { id, message, type } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), 3800);
  }, []);

  const addNotification = useCallback((msg, type = 'info') => {
    dispatch({ type: 'ADD_NOTIFICATION', notif: { msg, type, time: new Date() } });
  }, []);

  const navigate = useCallback((page) => {
    const { user, policy, bank } = state;
    const getLevel = () => {
      if (!user.isLoggedIn) return 'public';
      if (!policy.active)  return 'auth';
      if (!bank.acc)       return 'bank';
      return 'full';
    };
    const level = getLevel();
    const canAccess = (p) => {
      if (level === 'full') return true;
      if (level === 'bank') return ['landing','auth','pricing','bank','profile'].includes(p);
      if (level === 'auth') return ['landing','auth','pricing','profile'].includes(p);
      return ['landing','auth'].includes(p);
    };

    const LOCKED_PAGES = ['risk-map', 'claims'];
    let targetPage = page;
    if (!user.isLoggedIn && !['landing','auth'].includes(page)) {
      const id = Date.now();
      dispatch({ type:'ADD_TOAST', toast:{ id, message:'Please login first', type:'warning' }});
      setTimeout(() => dispatch({ type:'REMOVE_TOAST', id }), 3800);
      targetPage = 'auth';
    } else if (user.isLoggedIn && LOCKED_PAGES.includes(page) && !policy.active) {
      const id = Date.now();
      dispatch({ type:'ADD_TOAST', toast:{ id, message:'Select a plan to access this', type:'warning' }});
      setTimeout(() => dispatch({ type:'REMOVE_TOAST', id }), 3800);
      targetPage = 'pricing';
    }
    dispatch({ type: 'NAVIGATE', page: targetPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.user, state.policy, state.bank]);

  return (
    <AppContext.Provider value={{ state, dispatch, navigate, addToast, addNotification }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
