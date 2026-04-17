import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { fetchPayouts, fetchClaims, fetchRealWeather } from './utils/realApi';
import AppHeader    from './components/AppHeader';
import BottomNavbar from './components/BottomNavbar';
import ToastContainer from './components/Toast';

import LandingPage   from './pages/LandingPage';
import LoginPage     from './pages/LoginPage';
import BankPage      from './pages/BankPage';
import DashboardPage from './pages/DashboardPage';
import MapPage       from './pages/MapPage';
import ClaimsPage    from './pages/ClaimsPage';
import PlanPage      from './pages/PlanPage';
import ProfilePage   from './pages/ProfilePage';

const PAGE_COMPONENTS = {
  landing:    LandingPage,
  auth:       LoginPage,
  bank:       BankPage,
  dashboard:  DashboardPage,
  'risk-map': MapPage,
  claims:     ClaimsPage,
  pricing:    PlanPage,
  profile:    ProfilePage,
};

function AppShell() {
  const { state, dispatch } = useApp();
  const { currentPage, user } = state;

  useEffect(() => {
    if (user.isLoggedIn && user.id && !user.isDemo) {
      // Sync from Supabase ONLY for real users
      fetchPayouts(user.id).then(data => {
        if (data && data.length > 0) {
          dispatch({ type: 'SET_PAYOUTS', payouts: data });
        }
      });
      // Optionally fetch claims to hydrate them into state later if needed
    }
  }, [user.isLoggedIn, user.id, user.isDemo, dispatch]);

  // LIVE WEATHER & GPS POLLING
  useEffect(() => {
    if (user.isLoggedIn && !user.isDemo) {
      const updateLocationAndEnv = () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              // Securely patch user location so UI tracks them dynamically
              dispatch({ type: 'SET_USER', payload: { lat, lng, gpsActive: true } });

              // Fetch robust live API environment
              const envData = await fetchRealWeather(lat, lng);
              if (envData) {
                dispatch({ type: 'SET_ENV', payload: envData });
              }
            },
            (err) => console.warn('Location blocked, using fallback selected city details.', err)
          );
        }
      };

      // Initial Fetch
      updateLocationAndEnv();
      
      // Minute Tracker
      const intervalId = setInterval(updateLocationAndEnv, 60000);
      return () => clearInterval(intervalId);
    }
  }, [user.isLoggedIn, user.isDemo, dispatch]);

  const PageComponent = PAGE_COMPONENTS[currentPage] || LandingPage;
  const showNav = user.isLoggedIn || ['landing','auth'].includes(currentPage);

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main" id="appMain">
        <PageComponent />
      </main>
      {showNav && <BottomNavbar />}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
