import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─────────────────────────────────────────────
// Fetch nearby places via Overpass API
// ─────────────────────────────────────────────
async function fetchNearby(lat, lng, tags, limit = 12) {
  const radius = 4000;
  const tagArray = Array.isArray(tags) ? tags : [`"amenity"~"${tags}"`];
  let tagQueries = tagArray.map(t => `node[${t}](around:${radius},${lat},${lng});way[${t}](around:${radius},${lat},${lng});`).join('');
  const query = `[out:json][timeout:15];(${tagQueries});out center ${limit};`;
  try {
    const res  = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
    });
    return (data.elements || []).map(el => {
      let typeLabel = '';
      if (el.tags?.highway === 'bus_stop') typeLabel = 'Bus Stop';
      else if (el.tags?.railway === 'station') typeLabel = 'Train Station';
      else if (el.tags?.amenity === 'police') typeLabel = 'Police Station';
      else if (el.tags?.amenity === 'hospital' || el.tags?.amenity === 'clinic') typeLabel = 'Medical Facility';
      else if (el.tags?.amenity === 'fire_station') typeLabel = 'Fire Station';

      return {
        name:  el.tags?.name || `Nearby ${typeLabel || 'Safe Location'}`,
        phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
        lat:   el.lat || el.center?.lat,
        lng:   el.lon || el.center?.lon,
        typeLabel: typeLabel
      };
    }).filter(e => e.lat);
  } catch { return []; }
}

function distKm(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lat2) return '?';
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
}

function callNumber(num) {
  window.location.href = `tel:${num.replace(/\s+/g, '').replace(/[()+-]/g, '')}`;
}

function openGoogleMaps(lat, lng, keyword) {
  const q = `${keyword} near ${lat},${lng}`;
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`, '_blank');
}

function shareLocation(lat, lng) {
  const text = `🆘 Emergency Alert — My live location: https://maps.google.com/?q=${lat},${lng}`;
  if (navigator.share) {
    navigator.share({ title: 'SOS Location', text }).catch(() => {
      navigator.clipboard?.writeText(text);
    });
  } else {
    navigator.clipboard?.writeText(text);
    alert('Location copied to clipboard. Share it with your contacts.');
  }
}

import { CITY_DATA } from '../utils/cityData';

// ─────────────────────────────────────────────
// SOS MAP COMPONENT
// ─────────────────────────────────────────────
function SOSMap({ lat, lng, services = [], amenityIcon = '🚨' }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);

  useEffect(() => {
    if (!mapContainer.current || typeof window === 'undefined' || !window.L) return;
    if (!lat || !lng) return;

    if (!mapRef.current) {
      mapRef.current = window.L.map(mapContainer.current, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapRef.current);
    } else {
      mapRef.current.setView([lat, lng], mapRef.current.getZoom());
    }

    // User marker
    const userIcon = window.L.divIcon({
      className: '',
      html: `<div style="position:relative;width:18px;height:18px;">
        <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(239,68,68,0.3);animation:pulse 2s infinite;"></div>
        <div style="width:18px;height:18px;border-radius:50%;background:var(--danger);border:2px solid #fff;box-shadow:0 0 10px rgba(239,68,68,0.8);"></div>
      </div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });

    if (userMarkerRef.current) {
       userMarkerRef.current.setLatLng([lat, lng]);
    } else {
       userMarkerRef.current = window.L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(mapRef.current);
    }

    // Clear old services
    markersRef.current.forEach(m => mapRef.current.removeLayer(m));
    markersRef.current = [];

    // Add new services
    const sIcon = window.L.divIcon({
      className: '',
      html: `<div style="width:24px;height:24px;background:var(--surface-elevated);border:2px solid var(--info);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 0 8px rgba(0,0,0,0.5);">${amenityIcon}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    services.forEach(s => {
      if (s.lat && s.lng) {
        const popupContent = `
          <div style="font-family:sans-serif;min-width:140px;">
            ${s.typeLabel ? `<div style="color:#2563eb;font-weight:bold;font-size:10px;text-transform:uppercase;margin-bottom:2px;">${s.typeLabel}</div>` : ''}
            <div style="font-weight:bold;margin-bottom:4px;font-size:13px;">${s.name}</div>
            <div style="color:#666;font-size:11px;margin-bottom:8px;">📍 ${distKm(lat, lng, s.lat, s.lng)} km away</div>
            <a href="tel:${s.phone || '112'}" style="display:block;text-align:center;background:var(--danger);color:#fff;padding:6px;border-radius:6px;text-decoration:none;font-weight:bold;">
              📞 Call ${s.phone ? s.phone : 'Emergency'}
            </a>
          </div>
        `;
        const m = window.L.marker([s.lat, s.lng], { icon: sIcon })
          .bindPopup(popupContent)
          .addTo(mapRef.current);
        markersRef.current.push(m);
      }
    });

    // Fix for modals: invalidateSize
    const timer = setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 250);

    return () => clearTimeout(timer);
  }, [lat, lng, services, amenityIcon]);

  return (
    <div style={{ position:'relative', width:'100%', height:'220px', borderRadius:'12px', overflow:'hidden', border:'1px solid var(--border)', marginBottom:'16px', zIndex: 1, backgroundColor: 'var(--surface-elevated)' }}>
       <div ref={mapContainer} style={{ width:'100%', height:'100%', position:'absolute', top:0, left:0 }} />
    </div>
  );
}

// ─────────────────────────────────────────────
// SERVICE LIST component (shared)
// ─────────────────────────────────────────────
function ServiceList({ services, loading, fallbackNumber, fallbackLabel, lat, lng }) {
  if (loading) return <div style={{ color:'var(--text-muted)', fontSize:'0.78rem', padding:'8px 0' }}>🔍 Finding nearest services...</div>;
  if (!services.length) return (
    <div style={{ marginBottom:'8px' }}>
      <button
        onClick={() => callNumber(fallbackNumber)}
        style={{ padding:'10px 14px', background:'var(--danger)', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:700, fontSize:'0.85rem', width:'100%' }}>
        📞 {fallbackLabel} ({fallbackNumber})
      </button>
    </div>
  );
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'10px' }}>
      {services.map((s, i) => (
        <div key={i} style={{ background:'var(--surface-elevated)', border:'1px solid var(--border)', borderRadius:'8px', padding:'10px 12px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontWeight:700, fontSize:'0.82rem', color:'var(--text-primary)' }}>{s.name}</div>
              {s.typeLabel && <div style={{ fontSize:'0.7rem', color:'var(--info)', fontWeight:600, marginBottom:'2px', marginTop:'2px' }}>{s.typeLabel}</div>}
              <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>
                {distKm(lat, lng, s.lat, s.lng)} km away
                {s.phone ? ` · ${s.phone}` : ' · Contact not available'}
              </div>
            </div>
            <button
              onClick={() => callNumber(s.phone || fallbackNumber)}
              style={{ padding:'6px 12px', background:'var(--danger)', color:'#fff', border:'none', borderRadius:'20px', cursor:'pointer', fontWeight:700, fontSize:'0.78rem', whiteSpace:'nowrap' }}>
              📞 Call
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// TYPE PANELS
// ─────────────────────────────────────────────
function HarassmentPanel({ lat, lng, onConfirm }) {
  const [police, setPolice]   = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!lat || !lng || fetchedRef.current) return;
    fetchedRef.current = true;
    fetchNearby(lat, lng, ['"amenity"~"police"'], 10).then(r => {
      if (r && r.length > 0) setPolice(r);
      setLoading(false);
    });
  }, [lat, lng]);

  return (
    <div style={{ padding:'0 16px 16px' }}>
      <SOSMap lat={lat} lng={lng} services={police} amenityIcon="👮" />
      <div style={{ background:'var(--danger-bg)', border:'1px solid var(--danger)', borderRadius:'8px', padding:'10px', marginBottom:'12px', fontSize:'0.8rem', color:'var(--danger)' }}>
        ⚠️ Live location active · Alerting safety network
      </div>

      <div style={{ fontWeight:700, fontSize:'0.82rem', marginBottom:'8px', color:'var(--text-secondary)' }}>Nearest Police Stations</div>
      <ServiceList services={police} loading={loading} fallbackNumber="100" fallbackLabel="Police" lat={lat} lng={lng} />

      <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginTop:'4px' }}>
        <button
          onClick={() => openGoogleMaps(lat, lng, 'police')}
          style={{ padding:'11px', background:'var(--surface-elevated)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-primary)', cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>
          📍 See Nearby Services
        </button>
        <button
          onClick={() => shareLocation(lat, lng)}
          style={{ padding:'11px', background:'var(--accent-glow, rgba(99,102,241,0.15))', border:'1px solid var(--accent)', borderRadius:'8px', color:'var(--accent-light)', cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>
          📤 Send Location to Emergency Contacts
        </button>
        <button
          onClick={() => callNumber('100')}
          style={{ padding:'11px', background:'var(--danger)', border:'none', borderRadius:'8px', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>
          📞 Call Police Emergency (100)
        </button>
        <button className="btn btn-primary btn-block" onClick={onConfirm} style={{ padding:'11px' }}>
          🚨 Alert Control Center
        </button>
      </div>
    </div>
  );
}

function MedicalPanel({ lat, lng, onConfirm }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [symptom, setSymptom]     = useState('');
  const fetchedRef = useRef(false);

  const firstAid = {
    'Breathing Issue': ['Loosen clothes', 'Sit upright, lean forward', 'Inhaler if available', 'Call 108 now'],
    'Unconscious':     ['Check breathing — if absent, start CPR', '30 compressions, 2 breaths', 'Do not leave alone', 'Call 108 now'],
    'Bleeding':        ['Apply firm pressure with cloth', 'Keep elevated above heart', 'Do not remove cloth', 'Call 108 if severe'],
    'Chest Pain':      ['Sit or lie comfortably', 'Loosen tight clothing', 'Call 108 immediately'],
  };

  useEffect(() => {
    if (!lat || !lng || fetchedRef.current) return;
    fetchedRef.current = true;
    fetchNearby(lat, lng, ['"amenity"~"hospital|clinic"'], 10).then(r => {
      if (r && r.length > 0) setHospitals(r);
      setLoading(false);
    });
  }, [lat, lng]);

  return (
    <div style={{ padding:'0 16px 16px' }}>
      <SOSMap lat={lat} lng={lng} services={hospitals} amenityIcon="🏥" />
      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'10px' }}>
        {Object.keys(firstAid).map(s => (
          <button key={s} onClick={() => setSymptom(symptom === s ? '' : s)}
            style={{ padding:'5px 10px', borderRadius:'20px', border:`1px solid ${symptom===s?'var(--warning)':'var(--border)'}`, background: symptom===s?'var(--warning-bg)':'var(--surface)', color:'var(--text-primary)', fontSize:'0.72rem', cursor:'pointer' }}>
            {s}
          </button>
        ))}
      </div>

      {symptom && (
        <div style={{ background:'var(--surface-elevated)', border:'1px solid var(--border)', borderRadius:'8px', padding:'10px', marginBottom:'10px' }}>
          <div style={{ fontWeight:700, fontSize:'0.8rem', marginBottom:'5px', color:'var(--warning)' }}>🩺 {symptom}</div>
          {firstAid[symptom].map((step, i) => (
            <div key={i} style={{ fontSize:'0.74rem', color:'var(--text-secondary)', marginBottom:'2px' }}>• {step}</div>
          ))}
        </div>
      )}

      <div style={{ fontWeight:700, fontSize:'0.82rem', marginBottom:'8px', color:'var(--text-secondary)' }}>Nearest Hospitals / Clinics</div>
      <ServiceList services={hospitals} loading={loading} fallbackNumber="108" fallbackLabel="Ambulance" lat={lat} lng={lng} />

      <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginTop:'4px' }}>
        <button
          onClick={() => openGoogleMaps(lat, lng, 'hospitals')}
          style={{ padding:'11px', background:'var(--surface-elevated)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-primary)', cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>
          📍 See Nearby Services
        </button>
        <button onClick={() => callNumber('108')}
          style={{ padding:'11px', background:'var(--danger)', border:'none', borderRadius:'8px', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>
          🚑 Call Ambulance (108)
        </button>
        <button onClick={() => shareLocation(lat, lng)}
          style={{ padding:'10px', background:'var(--surface-elevated)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-primary)', cursor:'pointer', fontSize:'0.82rem' }}>
          📤 Share Live Location
        </button>
        <button className="btn btn-primary btn-block" onClick={onConfirm} style={{ padding:'11px' }}>
          🚨 Send Location to Control Center
        </button>
      </div>
    </div>
  );
}

function AccidentPanel({ lat, lng, onConfirm }) {
  const [hospitals, setHospitals] = useState([]);
  const [police,    setPolice]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [injured, setInjured]     = useState(1);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!lat || !lng || fetchedRef.current) return;
    fetchedRef.current = true;
    Promise.all([
      fetchNearby(lat, lng, ['"amenity"~"hospital|clinic"'], 6),
      fetchNearby(lat, lng, ['"amenity"~"police"'], 6),
    ]).then(([h, p]) => {
      if (h && h.length > 0) setHospitals(h);
      if (p && p.length > 0) setPolice(p);
      setLoading(false);
    });
  }, [lat, lng]);

  const allServices = [...hospitals, ...police];

  return (
    <div style={{ padding:'0 16px 16px' }}>
      <SOSMap lat={lat} lng={lng} services={allServices} amenityIcon="🚑" />
      <div style={{ marginBottom:'12px' }}>
        <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginBottom:'6px' }}>People injured: {injured}</div>
        <input type="range" min="1" max="10" value={injured} onChange={e => setInjured(+e.target.value)}
          style={{ width:'100%', accentColor:'var(--warning)' }} />
      </div>

      <div style={{ fontWeight:700, fontSize:'0.82rem', marginBottom:'8px', color:'var(--text-secondary)' }}>Nearest Emergency Services</div>
      <ServiceList services={allServices} loading={loading} fallbackNumber="108" fallbackLabel="Ambulance" lat={lat} lng={lng} />

      <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginTop:'4px' }}>
        <button
          onClick={() => openGoogleMaps(lat, lng, 'hospitals')}
          style={{ padding:'11px', background:'var(--surface-elevated)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-primary)', cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>
          📍 See Nearby Services
        </button>
        <button onClick={() => callNumber('108')}
          style={{ padding:'11px', background:'var(--danger)', border:'none', borderRadius:'8px', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>
          🚑 Call Ambulance (108)
        </button>
        <button onClick={() => callNumber('100')}
          style={{ padding:'10px', background:'var(--surface-elevated)', border:'1px solid var(--danger)', borderRadius:'8px', color:'var(--danger)', cursor:'pointer', fontWeight:700, fontSize:'0.82rem' }}>
          👮 Call Police (100)
        </button>
        <button onClick={() => shareLocation(lat, lng)}
          style={{ padding:'10px', background:'var(--surface-elevated)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-primary)', cursor:'pointer', fontSize:'0.82rem' }}>
          📤 Share Live Location
        </button>
        <button className="btn btn-primary btn-block" onClick={onConfirm} style={{ padding:'11px' }}>
          🚨 Alert Control Center
        </button>
      </div>
    </div>
  );
}

function FirePanel({ lat, lng, onConfirm }) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!lat || !lng || fetchedRef.current) return;
    fetchedRef.current = true;
    fetchNearby(lat, lng, ['"amenity"~"fire_station"'], 10).then(r => {
      if (r && r.length > 0) setStations(r);
      setLoading(false);
    });
  }, [lat, lng]);

  return (
    <div style={{ padding:'0 16px 16px' }}>
      <SOSMap lat={lat} lng={lng} services={stations} amenityIcon="🔥" />
      <div style={{ fontWeight:700, fontSize:'0.82rem', marginBottom:'8px', color:'var(--text-secondary)' }}>Nearest Fire Stations</div>
      <ServiceList services={stations} loading={loading} fallbackNumber="101" fallbackLabel="Fire Dept" lat={lat} lng={lng} />

      <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginTop:'4px' }}>
        <button
          onClick={() => openGoogleMaps(lat, lng, 'fire station')}
          style={{ padding:'11px', background:'var(--surface-elevated)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-primary)', cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>
          📍 See Nearby Services
        </button>
        <button onClick={() => callNumber('101')} style={{ padding:'11px', background:'var(--danger)', border:'none', borderRadius:'8px', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>
          🔥 Call Fire Dept (101)
        </button>
        <button className="btn btn-primary btn-block" onClick={onConfirm} style={{ padding:'11px' }}>
          🚨 Alert Control Center
        </button>
      </div>
    </div>
  );
}

function LostStuckPanel({ lat, lng, onConfirm }) {
  const [transit, setTransit] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!lat || !lng || fetchedRef.current) return;
    fetchedRef.current = true;
    fetchNearby(lat, lng, ['"highway"~"bus_stop"', '"railway"~"station"'], 15).then(r => {
      if (r && r.length > 0) setTransit(r);
      setLoading(false);
    });
  }, [lat, lng]);

  return (
    <div style={{ padding:'0 16px 16px' }}>
      <SOSMap lat={lat} lng={lng} services={transit} amenityIcon="🧭" />
      <div style={{ fontWeight:700, fontSize:'0.82rem', marginBottom:'8px', color:'var(--text-secondary)' }}>Nearby Transit Options</div>
      <ServiceList services={transit} loading={loading} fallbackNumber="112" fallbackLabel="Emergency" lat={lat} lng={lng} />

      <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginTop:'4px' }}>
        <div style={{ display:'flex', gap:'8px' }}>
          <button
            onClick={() => openGoogleMaps(lat, lng, 'bus stop')}
            style={{ flex:1, padding:'11px', background:'var(--surface-elevated)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-primary)', cursor:'pointer', fontWeight:700, fontSize:'0.75rem' }}>
            🚌 Nearby Bus Stops
          </button>
          <button
            onClick={() => openGoogleMaps(lat, lng, 'train station')}
            style={{ flex:1, padding:'11px', background:'var(--surface-elevated)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-primary)', cursor:'pointer', fontWeight:700, fontSize:'0.75rem' }}>
            🚆 Nearby Train Stations
          </button>
        </div>
        <button onClick={() => shareLocation(lat, lng)} style={{ padding:'11px', background:'var(--surface-elevated)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-primary)', cursor:'pointer', fontSize:'0.85rem' }}>
          📤 Share Live Location
        </button>
        <button className="btn btn-primary btn-block" onClick={onConfirm} style={{ padding:'11px' }}>
          🚨 Request Rescue Team
        </button>
      </div>
    </div>
  );
}

function UnsafeAreaPanel({ lat, lng, onConfirm }) {
  const [safeZones, setSafeZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!lat || !lng || fetchedRef.current) return;
    fetchedRef.current = true;
    fetchNearby(lat, lng, ['"amenity"~"police"', '"amenity"~"cafe|restaurant"'], 15).then(r => {
      if (r && r.length > 0) setSafeZones(r);
      setLoading(false);
    });
  }, [lat, lng]);

  return (
    <div style={{ padding:'0 16px 16px' }}>
      <SOSMap lat={lat} lng={lng} services={safeZones} amenityIcon="🛡️" />
      <div style={{ fontWeight:700, fontSize:'0.82rem', marginBottom:'8px', color:'var(--text-secondary)' }}>Nearby Safe Zones / Crowds</div>
      <ServiceList services={safeZones} loading={loading} fallbackNumber="100" fallbackLabel="Police" lat={lat} lng={lng} />

      <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginTop:'4px' }}>
        <button
          onClick={() => openGoogleMaps(lat, lng, 'police')}
          style={{ padding:'11px', background:'var(--surface-elevated)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-primary)', cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>
          📍 See Nearby Services
        </button>
        <button onClick={() => callNumber('100')} style={{ padding:'11px', background:'var(--danger)', border:'none', borderRadius:'8px', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>
          👮 Call Police (100)
        </button>
        <button onClick={() => shareLocation(lat, lng)} style={{ padding:'11px', background:'var(--surface-elevated)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-primary)', cursor:'pointer', fontSize:'0.85rem' }}>
          📤 Alert Emergency Contacts
        </button>
        <button className="btn btn-primary btn-block" onClick={onConfirm} style={{ padding:'11px' }}>
          🚨 Send Location to Control Center
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN MODAL
// ─────────────────────────────────────────────
export default function UniversalSOSModal({ isOpen, onClose }) {
  const { state, dispatch, addToast } = useApp();
  const { user } = state;

  const [screen,     setScreen]     = useState(1);
  const [isPressing, setIsPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const pressTimer = useRef(null);

  const [connectionStage, setConnectionStage] = useState(0);
  const [isHighRisk,      setIsHighRisk]      = useState(false);
  const [activeType,      setActiveType]      = useState(null);

  const [lat, setLat] = useState(user.lat || null);
  const [lng, setLng] = useState(user.lng || null);

  useEffect(() => {
    if (isOpen) {
      setScreen(1); setConnectionStage(0); setIsHighRisk(false);
      setPressProgress(0); setActiveType(null);
      
      // Centralized Location Logic:
      // 1. If Demo -> strictly use stored user location (now Bangalore)
      // 2. If Real -> attempt navigator.geolocation fallback to user state
      if (user.isDemo) {
        setLat(user.lat || 12.9716);
        setLng(user.lng || 77.5946);
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            const curLat = pos.coords.latitude;
            const curLng = pos.coords.longitude;
            setLat(curLat);
            setLng(curLng);
            dispatch({ type:'SET_USER', payload:{ lat: curLat, lng: curLng } });
          },
          () => { 
            setLat(user.lat || 12.9716); 
            setLng(user.lng || 77.5946); 
          }
        );
      } else {
        setLat(user.lat || 12.9716);
        setLng(user.lng || 77.5946);
      }
    }
  }, [isOpen]);

  // Long press
  useEffect(() => {
    if (isPressing && screen === 1) {
      let progress = 0;
      pressTimer.current = setInterval(() => {
        progress += 10;
        setPressProgress(progress);
        if (progress >= 100) {
          clearInterval(pressTimer.current);
          setIsPressing(false);
          triggerSequence('Discreetly Activated');
        }
      }, 100);
    } else {
      clearInterval(pressTimer.current);
      if (pressProgress < 100) setPressProgress(0);
    }
    return () => clearInterval(pressTimer.current);
  }, [isPressing, screen]);

  // Live GPS watch while SOS active
  useEffect(() => {
    let watchId = null;
    if (screen >= 2 && navigator.geolocation && !user.isDemo) {
      watchId = navigator.geolocation.watchPosition(
        pos => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          dispatch({ type:'SET_USER', payload:{ lat: pos.coords.latitude, lng: pos.coords.longitude } });
        },
        err => console.error('Tracking error:', err),
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    }
    return () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId); };
  }, [screen, user.isDemo]);

  async function triggerSequence(defaultType = null) {
    setScreen(2); setConnectionStage(1);
    await sleep(1500);
    setConnectionStage(2);
    const hour   = new Date().getHours();
    const isNight = hour >= 21 || hour < 5;
    const isRisk  = user.zoneIdx === 1 || user.zoneIdx === 3 || isNight;
    setIsHighRisk(isRisk);
    await sleep(2000);
    setConnectionStage(3);
    await sleep(1500);
    if (defaultType) { activateSOS('Discreet'); } else { setScreen(3); }
  }

  function activateSOS(type) {
    addToast('🚨 SOS Active — Safety network alerted', 'danger');
    // Send location to backend (fire and forget)
    fetch('http://127.0.0.1:8000/api/sos', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        user_id: user.id || 'guest',
        location: { lat: lat || 0, lng: lng || 0, city: user.location || '', zone_idx: user.zoneIdx || 0 },
        emergency_type: type,
        risk_level: isHighRisk ? 'high' : 'medium',
        is_high_risk_zone: isHighRisk,
        is_night_time: new Date().getHours() >= 21 || new Date().getHours() < 5,
      }),
    }).catch(() => {});
    setScreen(4);
  }

  function selectType(type) { setActiveType(type); setScreen(3.5); }

  if (!isOpen) return null;

  const typeComponents = {
    'Harassment / Threat': HarassmentPanel,
    'Medical Emergency':   MedicalPanel,
    'Accident':            AccidentPanel,
    'Fire':                FirePanel,
    'Lost / Stuck':        LostStuckPanel,
    'Unsafe Area':         UnsafeAreaPanel,
  };
  const TypePanel = activeType ? typeComponents[activeType] : null;

  return (
    <div className="sos-overlay active">
      <div className="sos-modal">
        <button className="cp-close" style={{ top:'16px', right:'16px', zIndex:10 }} onClick={onClose}>✕</button>

        {/* SCREEN 1: START */}
        {screen === 1 && (
          <div className="sos-screen" style={{ textAlign:'center', paddingTop:'40px' }}>
            <h2 style={{ fontSize:'2rem', marginBottom:'10px' }}>Emergency SOS</h2>
            <p style={{ color:'var(--text-secondary)', marginBottom:'40px' }}>Your safety is our priority.</p>
            <div
              className="sos-big-btn"
              onMouseDown={() => setIsPressing(true)}
              onMouseUp={() => setIsPressing(false)}
              onMouseLeave={() => setIsPressing(false)}
              onTouchStart={() => setIsPressing(true)}
              onTouchEnd={() => setIsPressing(false)}
              onClick={() => { if (pressProgress < 100) triggerSequence(); }}
              style={{ position:'relative', margin:'0 auto', width:'180px', height:'180px', borderRadius:'50%', background:'var(--danger)', border:'10px solid var(--danger-bg)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 40px rgba(239,68,68,0.4)', transition:'transform 0.2s', transform: isPressing ? 'scale(0.95)' : 'scale(1)', userSelect:'none', cursor:'pointer' }}>
              <span style={{ fontSize:'1.8rem', fontWeight:'900', color:'#fff', zIndex:2 }}>SOS</span>
              {pressProgress > 0 && (
                <div style={{ position:'absolute', top:'-10px', left:'-10px', right:'-10px', bottom:'-10px', borderRadius:'50%', background:`conic-gradient(#fff ${pressProgress}%, transparent 0)`, opacity:0.3 }} />
              )}
            </div>
            <p style={{ marginTop:'30px', fontSize:'0.85rem', color:'var(--text-muted)' }}>
              Tap to activate, or <strong>long-press</strong> for silent discreet mode.
            </p>
          </div>
        )}

        {/* SCREEN 2: CONNECTING */}
        {screen === 2 && (
          <div className="sos-screen" style={{ textAlign:'center', paddingTop:'40px' }}>
            <div className="sos-radar" style={{ position:'relative', margin:'0 auto 40px auto', width:'120px', height:'120px', border:'2px solid var(--success)', borderRadius:'50%', boxShadow:'0 0 20px rgba(16,185,129,0.2)' }}>
              <div className="radar-sweep" style={{ background:'linear-gradient(90deg, rgba(16,185,129,0.5) 0%, transparent 100%)' }} />
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:'2rem' }}>📍</div>
            </div>
            <h3 style={{ fontSize:'1.2rem', marginBottom:'20px' }}>
              {connectionStage === 1 && 'Detecting your location...'}
              {connectionStage === 2 && 'Analyzing surroundings...'}
              {connectionStage === 3 && 'Connecting to safety network...'}
            </h3>
            {lat && <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'10px' }}>📍 {lat?.toFixed(5)}, {lng?.toFixed(5)}</div>}
            {isHighRisk && connectionStage >= 2 && (
              <div style={{ background:'var(--danger-bg)', color:'var(--danger)', margin:'0 auto', padding:'10px', borderRadius:'var(--radius)', border:'1px solid var(--danger)', fontSize:'0.9rem', maxWidth:'80%' }}>
                ⚠️ High-risk zone detected. Escalating priority.
              </div>
            )}
          </div>
        )}

        {/* SCREEN 3: TYPE SELECTION */}
        {screen === 3 && (
          <div className="sos-screen" style={{ paddingTop:'20px' }}>
            <h3 style={{ textAlign:'center', marginBottom:'10px' }}>What is the emergency?</h3>
            <p style={{ textAlign:'center', fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:'20px' }}>
              Live location active · {lat?.toFixed(4)}, {lng?.toFixed(4)}
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px', padding:'0 20px' }}>
              <button className="btn" style={{ background:'var(--surface-elevated)', border:'1px solid var(--danger)', color:'var(--text-primary)', padding:'12px', borderRadius:'8px', textAlign:'left', display:'flex', alignItems:'center', gap:'12px' }} onClick={() => selectType('Harassment / Threat')}>
                <span style={{ fontSize:'1.3rem' }}>⚠️</span> Harassment / Threat
              </button>
              <button className="btn" style={{ background:'var(--surface-elevated)', border:'1px solid var(--warning)', color:'var(--text-primary)', padding:'12px', borderRadius:'8px', textAlign:'left', display:'flex', alignItems:'center', gap:'12px' }} onClick={() => selectType('Medical Emergency')}>
                <span style={{ fontSize:'1.3rem' }}>🚑</span> Medical Emergency
              </button>
              <button className="btn" style={{ background:'var(--surface-elevated)', border:'1px solid var(--warning)', color:'var(--text-primary)', padding:'12px', borderRadius:'8px', textAlign:'left', display:'flex', alignItems:'center', gap:'12px' }} onClick={() => selectType('Accident')}>
                <span style={{ fontSize:'1.3rem' }}>💥</span> Accident
              </button>
              <div style={{ display:'flex', justifyContent:'space-between', gap:'10px' }}>
                <div className="btn" style={{ flex:1, background:'var(--surface-elevated)', border:'1px solid rgba(255,255,255,0.1)', color:'var(--text-primary)', padding:'12px', borderRadius:'8px', textAlign:'left', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer' }} onClick={() => selectType('Unsafe Area')}>
                  <span style={{ fontSize:'1.3rem' }}>🌑</span> Unsafe Area
                </div>
                <div className="btn" style={{ flex:1, background:'var(--surface-elevated)', border:'1px solid var(--danger)', color:'var(--text-primary)', padding:'12px', borderRadius:'8px', textAlign:'left', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer' }} onClick={() => selectType('Fire')}>
                  <span style={{ fontSize:'1.3rem' }}>🔥</span> Fire
                </div>
              </div>
              <div className="btn" style={{ background:'var(--surface-elevated)', border:'1px solid rgba(255,255,255,0.1)', color:'var(--text-primary)', padding:'12px', borderRadius:'8px', textAlign:'left', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer' }} onClick={() => selectType('Lost / Stuck')}>
                <span style={{ fontSize:'1.3rem' }}>🧭</span> Lost / Stuck
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 3.5: TYPE DETAIL PANEL */}
        {screen === 3.5 && TypePanel && (
          <div className="sos-screen" style={{ paddingTop:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'0 16px', marginBottom:'12px' }}>
              <button onClick={() => setScreen(3)} style={{ background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer', fontSize:'1.1rem', padding:'0' }}>←</button>
              <h3 style={{ margin:0, fontSize:'1rem' }}>{activeType}</h3>
            </div>
            <TypePanel lat={lat} lng={lng} onConfirm={() => activateSOS(activeType)} />
          </div>
        )}

        {/* SCREEN 4: ACTIVE */}
        {screen === 4 && (
          <div className="sos-screen" style={{ textAlign:'center', paddingTop:'30px', paddingLeft:'20px', paddingRight:'20px' }}>
            <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:'rgba(16,185,129,0.15)', border:'2px solid var(--success)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem', margin:'0 auto 20px auto' }}>
              🛡️
            </div>
            <h2 style={{ color:'var(--success)', marginBottom:'10px' }}>Safety Network Active</h2>
            <p style={{ color:'var(--text-secondary)', marginBottom:'6px', fontSize:'0.9rem' }}>
              Your live location is being monitored by our control center.
            </p>
            {lat && <p style={{ color:'var(--text-muted)', marginBottom:'20px', fontSize:'0.78rem' }}>📍 {lat?.toFixed(5)}, {lng?.toFixed(5)}</p>}
            <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'20px' }}>
              <button onClick={() => callNumber('112')} style={{ padding:'11px', background:'var(--danger)', border:'none', borderRadius:'8px', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>
                📞 Call National Emergency (112)
              </button>
              <button onClick={() => shareLocation(lat, lng)} style={{ padding:'10px', background:'var(--surface-elevated)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-primary)', cursor:'pointer', fontSize:'0.82rem' }}>
                📤 Share Location Again
              </button>
            </div>
            <button className="btn btn-block" style={{ background:'var(--danger)', color:'#fff' }} onClick={onClose}>
              End Emergency Mode
            </button>
          </div>
        )}
      </div>

      <style>{`
        .sos-overlay {
          position: fixed; top:0; left:0; width:100%; height:100%;
          background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
          z-index: 1000; opacity: 0; pointer-events: none; transition: opacity 0.3s;
          display: flex; align-items: center; justify-content: center;
        }
        .sos-overlay.active { opacity: 1; pointer-events: auto; }
        .sos-modal {
          background: var(--surface-light);
          width: 90%; max-width: 400px; max-height: 90vh; overflow-y: auto;
          border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          position: relative; border: 1px solid var(--border);
        }
        .radar-sweep {
          position: absolute; width: 50%; height: 50%; top: 0; left: 50%;
          transform-origin: 0% 100%; animation: radarSpin 2s linear infinite;
        }
        @keyframes radarSpin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
