// ===== CONSTANTS =====
export const CONFIG = {
  OWM_KEY: 'd2e8c5c7c80bc92379d9b4bc4dbdc1fa',
  REFRESH_MS: 12000,
};

export const PLANS = {
  basic: { id: 'basic', name: 'Basic Shield', prob: 0.015, loss: 300, days: 2, coverage: 2000, triggers: ['rain'] },
  pro:   { id: 'pro',   name: 'Pro Guard',    prob: 0.025, loss: 400, days: 3, coverage: 5000, triggers: ['rain','aqi','heat'] },
  max:   { id: 'max',   name: 'Max Protect',  prob: 0.04,  loss: 600, days: 5, coverage: 10000,triggers: ['rain','aqi','heat','flood'] },
};

export const LOADING_FACTOR = 1.4;

export const CITY_DATA = {
  Bangalore: {
    lat: 12.9716, lng: 77.5946,
    zones: [
      { l: 'Whitefield',     dlat: 0.03,  dlng: 0.06  },
      { l: 'Koramangala',    dlat: -0.01, dlng: 0.01  },
      { l: 'Indiranagar',    dlat: 0.005, dlng: 0.02  },
      { l: 'JP Nagar',       dlat: -0.04, dlng: -0.01 },
      { l: 'HSR Layout',     dlat: -0.025,dlng: 0.03  },
      { l: 'Electronic City',dlat: -0.08, dlng: 0.02  },
      { l: 'Rajajinagar',    dlat: 0.01,  dlng: -0.03 },
    ],
  },
  Mumbai: {
    lat: 19.076, lng: 72.8777,
    zones: [
      { l: 'Andheri',    dlat: 0.05,  dlng: 0.01  },
      { l: 'Bandra',     dlat: 0.03,  dlng: -0.01 },
      { l: 'Dadar',      dlat: 0.015, dlng: 0.005 },
      { l: 'Colaba',     dlat: -0.04, dlng: -0.01 },
      { l: 'Powai',      dlat: 0.06,  dlng: 0.04  },
      { l: 'Thane',      dlat: 0.1,   dlng: 0.06  },
      { l: 'Navi Mumbai',dlat: -0.02, dlng: 0.1   },
    ],
  },
  Delhi: {
    lat: 28.6139, lng: 77.209,
    zones: [
      { l: 'Connaught Pl',dlat: 0,     dlng: 0     },
      { l: 'Dwarka',      dlat: -0.04, dlng: -0.08 },
      { l: 'Noida',       dlat: -0.02, dlng: 0.1   },
      { l: 'Gurgaon',     dlat: -0.07, dlng: -0.04 },
      { l: 'Rohini',      dlat: 0.06,  dlng: -0.02 },
      { l: 'Lajpat Nagar',dlat: -0.02, dlng: 0.02  },
      { l: 'Karol Bagh',  dlat: 0.01,  dlng: -0.02 },
    ],
  },
  Chennai: {
    lat: 13.0827, lng: 80.2707,
    zones: [
      { l: 'T.Nagar',   dlat: -0.01, dlng: -0.02 },
      { l: 'Adyar',     dlat: -0.03, dlng: -0.01 },
      { l: 'Anna Nagar',dlat: 0.03,  dlng: -0.02 },
      { l: 'Velachery', dlat: -0.05, dlng: 0.01  },
      { l: 'Mylapore',  dlat: -0.015,dlng: 0.005 },
      { l: 'Porur',     dlat: 0.01,  dlng: -0.06 },
      { l: 'OMR',       dlat: -0.06, dlng: 0.05  },
    ],
  },
  Hyderabad: {
    lat: 17.385, lng: 78.4867,
    zones: [
      { l: 'Hitech City',  dlat: 0.02,  dlng: -0.06 },
      { l: 'Banjara Hills',dlat: 0.01,  dlng: -0.02 },
      { l: 'Secunderabad', dlat: 0.04,  dlng: 0.01  },
      { l: 'Gachibowli',   dlat: -0.01, dlng: -0.07 },
      { l: 'LB Nagar',     dlat: -0.04, dlng: 0.04  },
      { l: 'Kukatpally',   dlat: 0.05,  dlng: -0.04 },
      { l: 'Ameerpet',     dlat: 0.02,  dlng: -0.01 },
    ],
  },
  Pune: {
    lat: 18.5204, lng: 73.8567,
    zones: [
      { l: 'Koregaon Park',dlat: 0.02,  dlng: 0.02  },
      { l: 'Kothrud',      dlat: -0.01, dlng: -0.04 },
      { l: 'Hadapsar',     dlat: -0.04, dlng: 0.04  },
      { l: 'Wakad',        dlat: 0.03,  dlng: -0.06 },
      { l: 'Viman Nagar',  dlat: 0.01,  dlng: 0.05  },
      { l: 'Camp',         dlat: 0.0,   dlng: 0.01  },
      { l: 'Magarpatta',   dlat: -0.03, dlng: 0.03  },
    ],
  },
};

export const DEMO_USER = {
  name: 'Ravi Kumar',
  phone: '9876543210',
  email: 'ravi@delivery.in',
  platform: 'Blinkit',
  role: 'worker',
  isLoggedIn: true,
  isDemo: true,
  subscriptionWeeks: 3,
  zoneIdx: 1,
  gpsActive: false,
};

export const DEMO_PAYOUTS = [
  { type: 'Rain',  amount: 320, status: 'Approved', date: '2 days ago',  trigger: 'Heavy Rain', zone: 'T.Nagar'    },
  { type: 'AQI',   amount: 250, status: 'Approved', date: '5 days ago',  trigger: 'AQI Spike',  zone: 'Adyar'      },
  { type: 'Heat',  amount: 400, status: 'Approved', date: '1 week ago',  trigger: 'Heatwave',   zone: 'Anna Nagar' },
];
