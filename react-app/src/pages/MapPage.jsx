import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { CITY_DATA } from '../utils/cityData';

const ZONE_RISK_PROFILES = [
  { intensity: 0.90, variance: 0.08 },
  { intensity: 0.65, variance: 0.06 },
  { intensity: 0.85, variance: 0.07 },
  { intensity: 0.40, variance: 0.05 },
  { intensity: 0.75, variance: 0.07 },
  { intensity: 0.55, variance: 0.05 },
  { intensity: 0.30, variance: 0.04 },
];

export default function MapPage() {
  const { state, dispatch } = useApp();
  const { user, risk } = state;

  const mapContainerRef = useRef(null);
  const mapInstance     = useRef(null);
  const userMarker      = useRef(null);
  const heatLayerRef    = useRef(null);
  const tileLayer       = useRef(null);
  const satLayer        = useRef(null);

  // Fallback to first available city if user.location is missing
  const [riskType,     setRiskType]     = useState('rain');
  const [activeView,   setActiveView]   = useState('current');
  const [selectedCity, setSelectedCity] = useState(user.location || "");
  const [envVals, setEnvVals]           = useState({ aqi:'—', rain:'0', temp:'—', flood:'Low' });

  // Determine the initial map center
  function getMapCenter() {
    if (user.lat && user.lng) {
      return { lat: user.lat, lng: user.lng };
    }
    const city = CITY_DATA[selectedCity] || CITY_DATA[user.location] || Object.values(CITY_DATA)[0];
    return { lat: city.lat, lng: city.lng };
  }

  // Init map once
  useEffect(() => {
    if (!mapContainerRef.current || typeof window.L === 'undefined') return;
    if (mapInstance.current) return;

    const center = getMapCenter();
    const cityData = user.isDemo
      ? (CITY_DATA[selectedCity] || Object.values(CITY_DATA)[0])
      : (CITY_DATA[user.location] || Object.values(CITY_DATA)[0]);

    const map = window.L.map(mapContainerRef.current, {
      center: [center.lat, center.lng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    satLayer.current  = window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18 });
    tileLayer.current = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 });
    tileLayer.current.addTo(map);
    window.L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstance.current = map;
    placeUserMarker(center.lat, center.lng);
    buildHeatmap(cityData, riskType, risk.level);

    return () => {
      map.remove();
      mapInstance.current = null;
      userMarker.current  = null;
      heatLayerRef.current = null;
    };
  }, []);

  // Real user: GPS polling every 60 seconds
  useEffect(() => {
    if (user.isDemo) return;
    
    function fetchGPS() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            const { latitude, longitude } = pos.coords;
            dispatch({ type: 'SET_USER', payload: { lat: latitude, lng: longitude, gpsActive: true } });
          },
          () => {} // silent fallback
        );
      }
    }
    
    fetchGPS(); // fetch immediately
    const gpsInterval = setInterval(fetchGPS, 60000); // 60s
    return () => clearInterval(gpsInterval);
  }, [user.isDemo, dispatch]);

  // Demo: re-center map when user changes city dropdown
  useEffect(() => {
    if (!mapInstance.current) return;
    if (!user.isDemo) return; // real users: map follows GPS, not dropdown
    const city = CITY_DATA[selectedCity] || Object.values(CITY_DATA)[0];
    mapInstance.current.setView([city.lat, city.lng], 13);
    placeUserMarker(city.lat, city.lng);
    buildHeatmap(city, riskType, risk.level);
  }, [selectedCity, user.isDemo]);

  // Real user: re-center map when GPS updates (user.lat/lng changes in state)
  useEffect(() => {
    if (!mapInstance.current) return;
    if (user.isDemo) return;
    if (!user.lat || !user.lng) return;
    mapInstance.current.setView([user.lat, user.lng], 13);
    placeUserMarker(user.lat, user.lng);
    const cityData = CITY_DATA[user.location] || Object.values(CITY_DATA)[0];
    buildHeatmap(cityData, riskType, risk.level, user.lat, user.lng);
  }, [user.lat, user.lng, user.isDemo]);

  // Update heatmap when risk type changes
  useEffect(() => {
    if (!mapInstance.current) return;
    const cityData = CITY_DATA[selectedCity] || CITY_DATA[defaultCity];
    const center = getMapCenter();
    buildHeatmap(cityData, riskType, risk.level, center.lat, center.lng);
  }, [riskType]);

  // Update env cards when risk.level changes
  useEffect(() => {
    setEnvVals({
      aqi:   risk.level.aqi  || '—',
      rain:  risk.level.rain || '0',
      temp:  (risk.level.temp || '—') + '°C',
      flood: risk.level.flood || 'Low',
    });
  }, [risk.level]);

  function placeUserMarker(lat, lng) {
    if (!mapInstance.current) return;
    const icon = window.L.divIcon({
      className: '',
      html: `<div style="position:relative;width:24px;height:24px;">
        <div style="position:absolute;inset:-8px;border-radius:50%;background:rgba(99,102,241,0.25);animation:pulse 2s infinite;"></div>
        <div style="width:24px;height:24px;border-radius:50%;background:#6366f1;border:3px solid #fff;box-shadow:0 0 12px rgba(99,102,241,0.6);"></div>
      </div>
      <style>@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.8);opacity:0}}</style>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (userMarker.current) {
      userMarker.current.setLatLng([lat, lng]);
    } else {
      userMarker.current = window.L.marker([lat, lng], { icon, zIndexOffset: 1000 })
        .addTo(mapInstance.current)
        .bindPopup(`<b>📍 You are here</b><br>${user.name || 'User'}`);
    }
  }

  function buildHeatmap(cityData, type, riskLevel, centerLat, centerLng) {
    if (!mapInstance.current || typeof window.L.heatLayer === 'undefined') {
      setTimeout(() => buildHeatmap(cityData, type, riskLevel, centerLat, centerLng), 500);
      return;
    }

    if (heatLayerRef.current) {
      mapInstance.current.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    const heatData = [];

    if (user.isDemo || !user.isLoggedIn) {
      // Demo: zone-based multi-cluster using city zone data
      cityData.zones.forEach((zone, idx) => {
        const cLat    = cityData.lat + zone.dlat;
        const cLng    = cityData.lng + zone.dlng;
        const profile = ZONE_RISK_PROFILES[idx % ZONE_RISK_PROFILES.length];
        const count   = 18 + Math.floor(Math.random() * 12);

        for (let i = 0; i < count; i++) {
          const u  = Math.random(), v = Math.random();
          const g  = Math.sqrt(-2 * Math.log(u || 0.001)) * Math.cos(2 * Math.PI * v);
          const s  = 0.018;
          const pt = [cLat + g * s, cLng + g * s * 1.3];
          const intensity = Math.max(0.1, Math.min(1.0,
            profile.intensity + (Math.random() - 0.5) * profile.variance * 2
          ));
          heatData.push([...pt, intensity]);
        }
      });
    } else {
      // Real user: clusters around live GPS coordinates
      const lat  = centerLat || (cityData?.lat) || user.lat;
      const lng  = centerLng || (cityData?.lng) || user.lng;
      const aqi  = riskLevel.aqi  || 0;
      const temp = riskLevel.temp || 25;
      const rain = riskLevel.rain || 0;
      const base = Math.min(1.0, (aqi * 0.4 + temp * 0.3 + rain * 0.3) / 200);

      const clusters = [
        { dLat:0,      dLng:0,      w:1.0, count:30 },
        { dLat:0.018,  dLng:0.022,  w:0.7, count:20 },
        { dLat:-0.02,  dLng:0.015,  w:0.5, count:15 },
        { dLat:0.012,  dLng:-0.025, w:0.4, count:12 },
      ];

      clusters.forEach(c => {
        for (let i = 0; i < c.count; i++) {
          const u = Math.random(), v = Math.random();
          const g1 = Math.sqrt(-2 * Math.log(u || 0.001)) * Math.cos(2 * Math.PI * v);
          const g2 = Math.sqrt(-2 * Math.log(u || 0.001)) * Math.sin(2 * Math.PI * v);
          const sp = 0.014;
          const intensity = Math.max(0.15, Math.min(0.95, (base + (Math.random()-0.5)*0.1) * c.w));
          heatData.push([lat + c.dLat + g1*sp, lng + c.dLng + g2*sp*1.2, intensity]);
        }
      });
    }

    heatLayerRef.current = window.L.heatLayer(heatData, {
      radius: 22, blur: 14, maxZoom: 16, minOpacity: 0.35,
      gradient: { 0.15:'#10b981', 0.35:'#3b82f6', 0.55:'#f59e0b', 0.75:'#ef4444', 1.0:'#7c3aed' },
    }).addTo(mapInstance.current);
  }

  function switchMapView(view) {
    setActiveView(view);
    if (!mapInstance.current) return;
    if (view === 'current') {
      if (tileLayer.current) mapInstance.current.removeLayer(tileLayer.current);
      if (satLayer.current)  satLayer.current.addTo(mapInstance.current);
    } else {
      if (satLayer.current)  mapInstance.current.removeLayer(satLayer.current);
      if (tileLayer.current) tileLayer.current.addTo(mapInstance.current);
    }
  }

  function handleCityChange(e) {
    setSelectedCity(e.target.value);
  }

  const cities = Object.keys(CITY_DATA);
  const displayCity = user.isDemo ? selectedCity : (user.gpsActive ? 'Live GPS tracking' : 'Locating...');

  return (
    <div className="page active" id="page-risk-map">
      <div className="page-content">
        <h2 className="section-title" style={{ marginBottom:'4px' }}>🗺️ Live Risk Map</h2>
        <p style={{ color:'var(--text-secondary)',fontSize:'0.8rem',marginBottom:'12px' }}>
          Zone-level monitoring · <span id="mapLocationLabel">{displayCity}</span>
        </p>

        <div className="map-controls">
          <div className="map-toggles">
            {['current','forecast','historical'].map(v => (
              <button key={v} className={`map-toggle${activeView === v ? ' active' : ''}`} onClick={() => switchMapView(v)}>
                {v === 'current' ? 'Live' : v === 'forecast' ? 'Forecast' : 'History'}
              </button>
            ))}
          </div>
          <select className="form-input" style={{ width:'auto',padding:'7px 10px',fontSize:'0.75rem' }} value={riskType} onChange={e => setRiskType(e.target.value)}>
            <option value="rain">🌧️ Rain</option>
            <option value="aqi">💨 AQI</option>
            <option value="heat">🌡️ Heat</option>
          </select>
          {/* City selector: only visually affects map in demo mode */}
          {user.isDemo && (
            <select className="form-input" style={{ width:'auto',padding:'7px 10px',fontSize:'0.75rem' }} value={selectedCity} onChange={handleCityChange}>
              {cities.map(c => <option key={c}>{c}</option>)}
            </select>
          )}
        </div>

        <div className="map-wrapper">
          <div ref={mapContainerRef} id="leafletMap" style={{ width:'100%',height:'100%',borderRadius:'inherit' }} />
        </div>

        <div className="map-legend">
          <div className="legend-item"><div className="legend-dot safe" />Safe</div>
          <div className="legend-item"><div className="legend-dot moderate" />Moderate</div>
          <div className="legend-item"><div className="legend-dot high" />High</div>
          <div className="legend-item"><div className="legend-dot severe" />Severe</div>
          <div className="legend-item"><div className="legend-dot" style={{background:'var(--accent)'}} />You</div>
        </div>

        <div className="env-cards">
          <div className="env-card"><div className="env-value" style={{color:'var(--warning)'}} id="aqiVal">{envVals.aqi}</div><div className="env-label">AQI</div></div>
          <div className="env-card"><div className="env-value" style={{color:'var(--info)'}} id="rainVal">{envVals.rain}</div><div className="env-label">Rain mm/hr</div></div>
          <div className="env-card"><div className="env-value" style={{color:'var(--danger)'}} id="tempVal">{envVals.temp}</div><div className="env-label">Temp</div></div>
          <div className="env-card"><div className="env-value" style={{color:'var(--success)'}} id="floodVal">{envVals.flood}</div><div className="env-label">Flood</div></div>
        </div>
      </div>
    </div>
  );
}
