/**
 * officerapp.js — Screen 5: Officer Mobile Application
 * CrimeSphere AI Command Platform
 */

'use strict';

function initOfficerApp() {
  buildOfficerMiniMap();
  animateRiskMeter();
  setupQuickButtons();
  startOfficerAlertCycle();
}

function buildOfficerMiniMap() {
  const map = L.map('officer-mini-map', {
    center: [23.0225, 72.5714],
    zoom: 14,
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    keyboard: false,
    touchZoom: false,
  });
  window.officerMap = map;

  darkTileLayer().addTo(map);

  // Officer position
  L.circleMarker([23.0225, 72.5714], {
    radius: 8,
    color: '#00c8ff',
    fillColor: '#00c8ff',
    fillOpacity: 0.9,
    weight: 2,
  }).addTo(map);

  // Patrol route segment
  L.polyline([
    [23.0225, 72.5714],
    [23.0240, 72.5730],
    [23.0260, 72.5710],
    [23.0250, 72.5680],
    [23.0235, 72.5700],
  ], {
    color: '#ffd700',
    weight: 3,
    opacity: 0.8,
    dashArray: '6 3',
  }).addTo(map);

  // Hotspot circle
  L.circle([23.0225, 72.5714], {
    radius: 300,
    color: '#ff5050',
    fillColor: '#ff5050',
    fillOpacity: 0.08,
    weight: 1,
    dashArray: '4 4',
  }).addTo(map);
}

function animateRiskMeter() {
  const fill = document.querySelector('.risk-meter-fill');
  if (!fill) return;
  fill.style.width = '0%';
  setTimeout(() => {
    fill.style.transition = 'width 1.5s ease';
    fill.style.width = '78%';
  }, 600);

  // Pulse animation on the meter
  let tick = 0;
  const id = setInterval(() => {
    tick++;
    if (!fill) return;
    const baseVal = 78;
    const jitter  = (Math.random() - 0.5) * 4;
    const newVal  = Math.max(72, Math.min(84, baseVal + jitter));
    fill.style.transition = 'width 1s ease';
    fill.style.width = newVal + '%';
    const valEl = document.querySelector('.risk-meter-val');
    if (valEl) valEl.textContent = Math.round(newVal) + ' / 100 · CRITICAL';
  }, 3000);
  APP.intervals.push(id);
}

function setupQuickButtons() {
  const quickBtns = document.querySelectorAll('.quick-btn');
  quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Visual feedback
      btn.style.transform = 'scale(0.95)';
      btn.style.boxShadow = '0 0 10px rgba(0,200,255,0.3)';
      setTimeout(() => {
        btn.style.transform = '';
        btn.style.boxShadow = '';
      }, 200);

      // SOS special effect
      if (btn.classList.contains('sos')) {
        btn.style.background = 'rgba(255,80,80,0.2)';
        btn.style.borderColor = '#ff5050';
        setTimeout(() => { btn.style.background = ''; btn.style.borderColor = ''; }, 1500);
      }
    });
  });
}

const OFFICER_ALERTS = [
  { title: 'Chain Snatching Alert',    detail: 'Relief Road · 2 suspects · HIGH',      color: '#ff5050' },
  { title: 'Cyber Fraud Warning',       detail: 'ATM Kalupur · Phishing active',        color: '#ff8c00' },
  { title: 'Crowd Anomaly — Naroda',   detail: 'Unusual gathering · Deploy backup',    color: '#ffd700' },
  { title: 'Patrol Checkpoint Reached', detail: 'Law Garden · All clear · Continue',   color: '#32cd64' },
  { title: 'Vehicle Theft Reported',    detail: 'SG Highway · Blue car spotted',       color: '#ff5050' },
  { title: 'OSINT Intel Update',        detail: 'Dark-web activity correlated locally', color: '#8a2be2' },
];

function startOfficerAlertCycle() {
  let alertIndex = 0;
  const titleEl  = document.querySelector('.app-alert-title');
  const detailEl = document.querySelector('.app-alert-detail');
  const card     = document.querySelector('.app-alert-card');

  const id = setInterval(() => {
    alertIndex = (alertIndex + 1) % OFFICER_ALERTS.length;
    const alert = OFFICER_ALERTS[alertIndex];
    if (titleEl)  titleEl.textContent  = alert.title;
    if (detailEl) detailEl.textContent = alert.detail;
    if (card) {
      card.style.borderColor = alert.color + '50';
      card.style.background  = alert.color + '10';
    }
    const iconEl = document.querySelector('.app-alert-icon i');
    if (iconEl) {
      iconEl.style.color = alert.color;
    }
  }, 5000);
  APP.intervals.push(id);
}
