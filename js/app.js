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

// ── Ahmedabad Fallback Mock Data ──────────────────────────────
let ZONES = [];
let PATROL_UNITS = [];
let ALERT_TEMPLATES = [];

const FALLBACK_ZONES = [
  { id: 'navrangpura', name: 'Navrangpura',  lat: 23.0225, lng: 72.5714, risk: 78, level: 'critical', crime: 'Theft & Cyber Crime',     conf: 94, patrol: 'P-03' },
  { id: 'naroda',      name: 'Naroda',        lat: 23.0835, lng: 72.6472, risk: 72, level: 'critical', crime: 'Assault & Theft',         conf: 91, patrol: 'P-01' },
  { id: 'sghighway',   name: 'SG Highway',    lat: 23.0395, lng: 72.5100, risk: 65, level: 'high',     crime: 'Vehicle Crime',           conf: 89, patrol: 'P-02' },
  { id: 'maninagar',   name: 'Maninagar',     lat: 22.9862, lng: 72.5949, risk: 61, level: 'high',     crime: 'Chain Snatching',         conf: 88, patrol: 'P-04' },
  { id: 'kalupur',     name: 'Kalupur',       lat: 23.0225, lng: 72.5936, risk: 52, level: 'high',     crime: 'Fraud & Transit Crime',   conf: 86, patrol: 'P-05' },
  { id: 'satellite',   name: 'Satellite',     lat: 23.0274, lng: 72.5097, risk: 55, level: 'high',     crime: 'Cyber Fraud',             conf: 85, patrol: 'P-02' },
  { id: 'vastrapur',   name: 'Vastrapur',     lat: 23.0280, lng: 72.5260, risk: 48, level: 'medium',   crime: 'Residential Theft',       conf: 82, patrol: 'P-06' },
  { id: 'bopal',       name: 'Bopal',         lat: 23.0350, lng: 72.4700, risk: 31, level: 'medium',   crime: 'Minor Theft & Break-ins', conf: 78, patrol: 'P-06' },
];

const FALLBACK_PATROL_UNITS = [
  { id: 'P-01', officer: 'SI Rajesh Kumar',   zone: 'Naroda',       lat: 23.0820, lng: 72.6460, status: 'patrolling', fuel: 82, color: '#00c8ff' },
  { id: 'P-02', officer: 'ASI Priya Sharma',  zone: 'SG Highway',   lat: 23.0380, lng: 72.5090, status: 'patrolling', fuel: 68, color: '#8a2be2' },
  { id: 'P-03', officer: 'SI Ravi Sharma',    zone: 'Navrangpura',  lat: 23.0210, lng: 72.5700, status: 'active',     fuel: 75, color: '#ffd700' },
  { id: 'P-04', officer: 'HC Amit Patel',     zone: 'Maninagar',    lat: 22.9850, lng: 72.5940, status: 'patrolling', fuel: 91, color: '#32cd64' },
  { id: 'P-05', officer: 'SI Meera Joshi',    zone: 'Kalupur',      lat: 23.0215, lng: 72.5920, status: 'active',     fuel: 55, color: '#ff8c00' },
  { id: 'P-06', officer: 'ASI Deepak Shah',   zone: 'Vastrapur',    lat: 23.0270, lng: 72.5250, status: 'standby',    fuel: 95, color: '#ff5050' },
];

const FALLBACK_ALERT_TEMPLATES = [
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
  if (seconds < 60)    return `${Math.round(seconds)}s ago`;
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
      switchScreen(screen);
    });
  });
}

function switchScreen(screenId) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  const navEl = document.getElementById(`nav-${screenId}`);
  const screenEl = document.getElementById(`screen-${screenId}`);
  if (navEl)    navEl.classList.add('active');
  if (screenEl) screenEl.classList.add('active');

  APP.currentScreen = screenId;

  setTimeout(() => {
    if (window.dashMap    && screenId === 'dashboard') window.dashMap.invalidateSize();
    if (window.heatMap    && screenId === 'heatmap')   window.heatMap.invalidateSize();
    if (window.routingMap && screenId === 'routing')   window.routingMap.invalidateSize();
    if (window.officerMap && screenId === 'officer')   window.officerMap.invalidateSize();
  }, 80);
}

function showCustomToast(message, isAlert=false) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed; bottom:24px; right:24px;
    background:#0d1235; border:1px solid ${isAlert ? '#ff5050' : '#1a2450'};
    color:#e8eeff; padding:12px 20px;
    border-radius:10px; font-size:13px;
    box-shadow:0 8px 32px rgba(0,0,0,0.5);
    z-index:9999; animation:slideIn 0.3s ease;
    display:flex; align-items:center; gap:8px;
  `;
  toast.innerHTML = `<i class="fa-solid ${isAlert ? 'fa-triangle-exclamation' : 'fa-info-circle'}" style="color:${isAlert ? '#ff5050' : '#00c8ff'}"></i> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
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
document.addEventListener('DOMContentLoaded', async () => {
  startClock();
  initNav();

  try {
    const dashData = await fetch('http://localhost:8000/api/dashboard').then(r => r.json());
    ZONES = dashData.zones;
    PATROL_UNITS = dashData.patrols;
    
    const alertData = await fetch('http://localhost:8000/api/alerts').then(r => r.json());
    ALERT_TEMPLATES = alertData.templates;
  } catch (err) {
    console.warn("FastAPI backend is offline, running with local static mock datasets:", err);
    ZONES = FALLBACK_ZONES;
    PATROL_UNITS = FALLBACK_PATROL_UNITS;
    ALERT_TEMPLATES = FALLBACK_ALERT_TEMPLATES;
  }

  // Initialize each screen module
  if (typeof initDashboard  === 'function') initDashboard();
  if (typeof initPrediction === 'function') initPrediction();
  if (typeof initHeatmap    === 'function') initHeatmap();
  if (typeof initRouting    === 'function') initRouting();
  if (typeof initOfficerApp === 'function') initOfficerApp();
  
  // Custom Settings, Simulation, RBAC, and Voice controller
  initSettingsAndQueries();
});

// ── Settings, Simulation, RBAC & Queries Controller ────────────
function initSettingsAndQueries() {
  // Scenario Simulations
  const scenarios = {
    'sim-navratri-btn': 'navratri',
    'sim-phishing-btn': 'phishing',
    'sim-normal-btn': 'normal',
    'sim-emergency-btn': 'emergency'
  };

  Object.entries(scenarios).forEach(([btnId, scenarioKey]) => {
    document.getElementById(btnId)?.addEventListener('click', async () => {
      try {
        await fetch(`http://localhost:8000/api/simulate?event=${scenarioKey}`, { method: 'POST' });
        showCustomToast(`Scenario activated: ${scenarioKey.toUpperCase()}. Systems updated.`, false);
        
        // Reload all data streams
        const dashData = await fetch('http://localhost:8000/api/dashboard').then(r => r.json());
        ZONES = dashData.zones;
        PATROL_UNITS = dashData.patrols;
        
        // Trigger redrawing maps/tables
        if (typeof initDashboard  === 'function') initDashboard();
        if (typeof initPrediction === 'function') initPrediction();
        if (typeof initHeatmap    === 'function') initHeatmap();
        if (typeof initRouting    === 'function') initRouting();
      } catch (err) {
        showCustomToast("API offline. Scenario simulation requires running FastAPI backend.", true);
      }
    });
  });

  // RBAC User Role Select
  document.getElementById('user-role-select')?.addEventListener('change', (e) => {
    const role = e.target.value;
    const labels = {
      officer: 'Officer (SI Ravi Sharma)',
      inspector: 'Inspector (Maninagar Sector)',
      dcp: 'DCP (Zone 1 Ahmedabad)',
      commissioner: 'Commissioner of Police'
    };
    showCustomToast(`Security context shifted: Active Role set to ${labels[role]}`, false);
    loadAuditLogs(); // reload logs to capture roles
  });

  // Load audit logs
  loadAuditLogs();

  // Voice Assisted Queries Setup
  setupVoiceAssistance();
}

async function loadAuditLogs() {
  const tbody = document.getElementById('audit-table-body');
  if (!tbody) return;

  try {
    const logs = await fetch('http://localhost:8000/api/audit').then(r => r.json());
    tbody.innerHTML = '';
    logs.forEach(log => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="color:#7a8bb5; font-family:monospace;">${log.timestamp}</td>
        <td><b>${log.actor_id}</b></td>
        <td>${log.role}</td>
        <td>${log.action}</td>
        <td style="color:#e8eeff;">${log.scope}</td>
        <td style="color:#7a8bb5; font-family:monospace;">${log.ip}</td>
        <td style="color:#32cd64; font-weight:700;">${log.status}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    // Static fallback audit logs
    tbody.innerHTML = `
      <tr>
        <td style="color:#7a8bb5; font-family:monospace;">11:42:01</td>
        <td><b>SI-8902</b></td>
        <td>Officer</td>
        <td>Patrol check-in</td>
        <td style="color:#e8eeff;">Navrangpura Area</td>
        <td style="color:#7a8bb5; font-family:monospace;">10.42.12.80</td>
        <td style="color:#32cd64; font-weight:700;">SUCCESS</td>
      </tr>
      <tr>
        <td style="color:#7a8bb5; font-family:monospace;">11:15:22</td>
        <td><b>INS-4402</b></td>
        <td>Inspector</td>
        <td>CCTV CV overlay access</td>
        <td style="color:#e8eeff;">Maninagar CCTV-204</td>
        <td style="color:#7a8bb5; font-family:monospace;">10.42.8.22</td>
        <td style="color:#32cd64; font-weight:700;">SUCCESS</td>
      </tr>
    `;
  }
}

// ── Voice Assistance & Text-to-Speech (Web Speech API) ────────
function setupVoiceAssistance() {
  const input = document.getElementById('voice-query-input');
  const mic = document.getElementById('voice-query-mic');
  
  if (!input) return;

  // Listen for Enter key
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      processCommand(input.value);
    }
  });

  // Simulated Mic voice trigger
  mic?.addEventListener('click', () => {
    input.value = '';
    input.placeholder = "Listening for voice command...";
    mic.style.color = '#ff5050';
    
    // Auto populate simulated voice query after 1.8s
    setTimeout(() => {
      input.value = "closest unit to Vastrapur";
      input.placeholder = "Ask AI: e.g. 'closest unit to Vastrapur'...";
      mic.style.color = '#00c8ff';
      processCommand(input.value);
    }, 1800);
  });
}

function processCommand(query) {
  const q = query.toLowerCase().trim();
  let reply = "I'm sorry, I couldn't formulate a recommendation for that query. Try asking 'closest unit to Vastrapur' or 'system status'.";

  if (q.includes("closest") && q.includes("vastrapur")) {
    reply = "Patrol Unit P-06 under Officer ASI Deepak Shah is currently closest to Vastrapur, standby in standby status. Rerouting via A-star pathing has been initialized. ETA is three minutes.";
    // Highlight Unit P-06 on map
    if (window.dashMap) {
      window.dashMap.setView([23.0270, 72.5250], 14);
      showCustomToast("AI Route optimization computed for Unit P-06.", false);
    }
  } else if (q.includes("status") || q.includes("system")) {
    reply = "All modules operational. Spatial GNN is running with 94.2% accuracy. Security database and PostGIS are connected. Compliance status is green.";
  } else if (q.includes("threat") || q.includes("alerts")) {
    reply = "Active critical alert: ATM cyber-physical fraud correlation detected in Kalupur station sector. Patrol unit P-05 is actively monitoring.";
    switchScreen('dashboard');
  }

  // Voice feedback read aloud (Web Speech API)
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // stop previous speech
    const utterance = new SpeechSynthesisUtterance(reply);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  // Display answer in a popup toast card
  showCustomToast(`<b>Voice Agent:</b> ${reply}`, false);
}
