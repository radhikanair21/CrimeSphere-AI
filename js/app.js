/**
 * app.js — Global App Controller
 * CrimeSphere AI Command Platform
 */

'use strict';

// ── Global State ──────────────────────────────────────────────
const APP = {
  currentScreen: 'dashboard',
  mapsInitialized: {},
  intervals: [],
};

// ── Ahmedabad Mock Data ───────────────────────────────────────
const ZONES = [
  { id: 'navrangpura', name: 'Navrangpura',  lat: 23.0225, lng: 72.5714, risk: 78, level: 'critical', crime: 'Theft & Cyber Crime',     conf: 94, patrol: 'P-03' },
  { id: 'naroda',      name: 'Naroda',        lat: 23.0835, lng: 72.6472, risk: 72, level: 'critical', crime: 'Assault & Theft',         conf: 91, patrol: 'P-01' },
  { id: 'sghighway',   name: 'SG Highway',    lat: 23.0395, lng: 72.5100, risk: 65, level: 'high',     crime: 'Vehicle Crime',           conf: 89, patrol: 'P-02' },
  { id: 'maninagar',   name: 'Maninagar',     lat: 22.9862, lng: 72.5949, risk: 61, level: 'high',     crime: 'Chain Snatching',         conf: 88, patrol: 'P-04' },
  { id: 'kalupur',     name: 'Kalupur',       lat: 23.0225, lng: 72.5936, risk: 52, level: 'high',     crime: 'Fraud & Transit Crime',   conf: 86, patrol: 'P-05' },
  { id: 'satellite',   name: 'Satellite',     lat: 23.0274, lng: 72.5097, risk: 55, level: 'high',     crime: 'Cyber Fraud',             conf: 85, patrol: 'P-02' },
  { id: 'vastrapur',   name: 'Vastrapur',     lat: 23.0280, lng: 72.5260, risk: 48, level: 'medium',   crime: 'Residential Theft',       conf: 82, patrol: 'P-06' },
  { id: 'bopal',       name: 'Bopal',         lat: 23.0350, lng: 72.4700, risk: 31, level: 'medium',   crime: 'Minor Theft & Break-ins', conf: 78, patrol: 'P-06' },
];

const PATROL_UNITS = [
  { id: 'P-01', officer: 'SI Rajesh Kumar',   zone: 'Naroda',       lat: 23.0820, lng: 72.6460, status: 'patrolling', fuel: 82, color: '#00c8ff' },
  { id: 'P-02', officer: 'ASI Priya Sharma',  zone: 'SG Highway',   lat: 23.0380, lng: 72.5090, status: 'patrolling', fuel: 68, color: '#8a2be2' },
  { id: 'P-03', officer: 'SI Ravi Sharma',    zone: 'Navrangpura',  lat: 23.0210, lng: 72.5700, status: 'active',     fuel: 75, color: '#ffd700' },
  { id: 'P-04', officer: 'HC Amit Patel',     zone: 'Maninagar',    lat: 22.9850, lng: 72.5940, status: 'patrolling', fuel: 91, color: '#32cd64' },
  { id: 'P-05', officer: 'SI Meera Joshi',    zone: 'Kalupur',      lat: 23.0215, lng: 72.5920, status: 'active',     fuel: 55, color: '#ff8c00' },
  { id: 'P-06', officer: 'ASI Deepak Shah',   zone: 'Vastrapur',    lat: 23.0270, lng: 72.5250, status: 'standby',   fuel: 95, color: '#ff5050' },
];

const ALERT_TEMPLATES = [
  { level: 'critical', icon: 'fa-siren-on',         title: 'Chain Snatching — Active',       detail: 'Navrangpura, near Law Garden · 2 suspects on bike',     zone: 'Navrangpura' },
  { level: 'critical', icon: 'fa-triangle-exclamation', title: 'ATM Fraud Alert — CRITICAL',  detail: 'Kalupur · Cyber-physical link detected · Alert P-05',   zone: 'Kalupur'     },
  { level: 'high',     icon: 'fa-car-burst',         title: 'Vehicle Theft — SG Highway',    detail: 'Near GIFT City bypass · Suspect vehicle spotted',         zone: 'SG Highway'  },
  { level: 'high',     icon: 'fa-shield-virus',      title: 'Phishing Campaign Active',      detail: 'OTP-based fraud targeting Maninagar residents',           zone: 'Maninagar'   },
  { level: 'high',     icon: 'fa-people-robbery',    title: 'Crowd Anomaly — Naroda',        detail: 'Unusual gathering detected · Festival risk spike',        zone: 'Naroda'      },
  { level: 'medium',   icon: 'fa-video',             title: 'CCTV Blind Spot Report',        detail: 'Camera 147 offline — Satellite Zone, Ambawadi Rd',       zone: 'Satellite'   },
  { level: 'medium',   icon: 'fa-brain',             title: 'AI Prediction — Bopal',         detail: 'Night theft risk +23% · Deploy P-06 to Bopal sector',    zone: 'Bopal'       },
  { level: 'low',      icon: 'fa-circle-check',      title: 'Patrol Check-in — P-04',        detail: 'HC Amit Patel · Maninagar East · All clear',             zone: 'Maninagar'   },
  { level: 'low',      icon: 'fa-wind',              title: 'Weather Update',                 detail: 'High wind tonight may affect CCTV coverage in Bopal',    zone: 'Bopal'       },
  { level: 'critical', icon: 'fa-wifi',              title: 'OSINT Threat Intelligence',     detail: 'Dark web forum activity near Vastrapur correlated',       zone: 'Vastrapur'   },
];

// ── Utility: format time ──────────────────────────────────────
function formatTime(date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
function formatDate(date) {
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}
function timeAgo(seconds) {
  if (seconds < 60)    return `${seconds}s ago`;
  if (seconds < 3600)  return `${Math.floor(seconds/60)}m ago`;
  return `${Math.floor(seconds/3600)}h ago`;
}

// ── Live Clock ────────────────────────────────────────────────
function startClock() {
  function tick() {
    const now = new Date();
    const timeEl = document.getElementById('live-time');
    const dateEl = document.getElementById('live-date');
    const appTimeEl = document.getElementById('app-time');
    if (timeEl) timeEl.textContent = formatTime(now);
    if (dateEl) dateEl.textContent = formatDate(now);
    if (appTimeEl) appTimeEl.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  tick();
  const id = setInterval(tick, 1000);
  APP.intervals.push(id);
}

// ── Navigation ────────────────────────────────────────────────
function initNav() {
  const navItems = document.querySelectorAll('.nav-item[data-screen]');
  navItems.forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const screen = item.dataset.screen;
      if (screen === 'settings') { showSettingsToast(); return; }
      switchScreen(screen);
    });
  });
}

function switchScreen(screenId) {
  // Remove active from all nav + screens
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  // Activate target
  const navEl = document.getElementById(`nav-${screenId}`);
  const screenEl = document.getElementById(`screen-${screenId}`);
  if (navEl)    navEl.classList.add('active');
  if (screenEl) screenEl.classList.add('active');

  APP.currentScreen = screenId;

  // Trigger map invalidation after transition
  setTimeout(() => {
    if (window.dashMap    && screenId === 'dashboard') window.dashMap.invalidateSize();
    if (window.heatMap    && screenId === 'heatmap')   window.heatMap.invalidateSize();
    if (window.routingMap && screenId === 'routing')   window.routingMap.invalidateSize();
    if (window.officerMap && screenId === 'officer')   window.officerMap.invalidateSize();
  }, 80);
}

function showSettingsToast() {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed; bottom:24px; right:24px;
    background:#0d1235; border:1px solid #1a2450;
    color:#e8eeff; padding:12px 20px;
    border-radius:10px; font-size:13px;
    box-shadow:0 8px 32px rgba(0,0,0,0.5);
    z-index:9999; animation:slideIn 0.3s ease;
    display:flex; align-items:center; gap:8px;
  `;
  toast.innerHTML = '<i class="fa-solid fa-gear" style="color:#00c8ff"></i> Settings panel — available in production build';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ── Risk level helpers ────────────────────────────────────────
function riskColor(level) {
  return { critical: '#ff5050', high: '#ff8c00', medium: '#ffd700', low: '#32cd64' }[level] || '#7a8bb5';
}
function riskLabel(score) {
  if (score >= 70) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

// ── Dark map tile ─────────────────────────────────────────────
function darkTileLayer() {
  return L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    {
      attribution: '&copy; <a href="https://carto.com">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }
  );
}

// ── Init everything ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  startClock();
  initNav();

  // Initialize each screen module
  if (typeof initDashboard  === 'function') initDashboard();
  if (typeof initPrediction === 'function') initPrediction();
  if (typeof initHeatmap    === 'function') initHeatmap();
  if (typeof initRouting    === 'function') initRouting();
  if (typeof initOfficerApp === 'function') initOfficerApp();
});
