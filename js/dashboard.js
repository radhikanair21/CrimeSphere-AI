/**
 * dashboard.js — Screen 1: GIS Crime Intelligence Dashboard
 * CrimeSphere AI Command Platform
 */

'use strict';

// ── Alert feed state ──────────────────────────────────────────
const FEED = { items: [], maxItems: 12, tickCount: 0 };

// ── Init Dashboard ────────────────────────────────────────────
function initDashboard() {
  buildDashboardMap();
  buildAlertFeed();
  startAlertStream();
  animateKPIs();
  startDataSourcePing();
}

// ── Leaflet Map ───────────────────────────────────────────────
function buildDashboardMap() {
  const map = L.map('dashboard-map', {
    center: [23.0225, 72.5714],
    zoom: 12,
    zoomControl: true,
    attributionControl: true,
  });
  window.dashMap = map;

  darkTileLayer().addTo(map);

  // Crime hotspot circles
  ZONES.forEach(zone => {
    const color = riskColor(zone.level);
    const radius = 600 + zone.risk * 8;

    // Outer glow ring
    L.circle([zone.lat, zone.lng], {
      radius: radius * 1.4,
      color: color,
      fillColor: color,
      fillOpacity: 0.05,
      weight: 0,
    }).addTo(map);

    // Main circle
    const circle = L.circle([zone.lat, zone.lng], {
      radius: radius,
      color: color,
      fillColor: color,
      fillOpacity: 0.18,
      weight: 2,
    }).addTo(map);

    // Popup
    const popupContent = `
      <div class="cs-popup-title">⬡ ${zone.name}</div>
      <div class="cs-popup-row"><span>Risk Score</span><span style="color:${color};font-size:16px;font-weight:900">${zone.risk}/100</span></div>
      <div class="cs-popup-row"><span>Crime Type</span><span>${zone.crime}</span></div>
      <div class="cs-popup-row"><span>AI Confidence</span><span>${zone.conf}%</span></div>
      <div class="cs-popup-row"><span>Patrol Unit</span><span style="color:#00c8ff">${zone.patrol}</span></div>
      <div class="cs-popup-row"><span>Priority</span><span style="color:${color}">${zone.level.toUpperCase()}</span></div>
    `;
    circle.bindPopup(popupContent, { maxWidth: 220, className: 'cs-popup' });

    // Zone label
    L.marker([zone.lat, zone.lng], {
      icon: L.divIcon({
        html: `<div style="
          background:rgba(8,8,27,0.85);
          border:1px solid ${color};
          color:${color};
          padding:2px 7px;
          border-radius:5px;
          font-size:10px;
          font-weight:700;
          font-family:Outfit,sans-serif;
          white-space:nowrap;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
        ">${zone.name} · ${zone.risk}</div>`,
        className: '',
        iconAnchor: [0, 0],
      }),
    }).addTo(map);
  });

  // Patrol unit markers
  const patrolMarkers = {};
  PATROL_UNITS.forEach(unit => {
    const marker = buildPatrolMarker(unit);
    marker.addTo(map);
    patrolMarkers[unit.id] = { marker, unit: { ...unit } };
  });

  // Animate patrol units
  const id = setInterval(() => animatePatrolUnits(patrolMarkers), 4000);
  APP.intervals.push(id);

  // Map filter buttons
  document.getElementById('map-all')?.addEventListener('click', () => {
    map.setView([23.0225, 72.5714], 12);
    document.querySelectorAll('.map-ctrl-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('map-all').classList.add('active');
  });
  document.getElementById('map-critical')?.addEventListener('click', () => {
    map.setView([23.0225, 72.5714], 13);
    document.querySelectorAll('.map-ctrl-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('map-critical').classList.add('active');
  });
  document.getElementById('map-patrol')?.addEventListener('click', () => {
    map.setView([23.0225, 72.5714], 12.5);
    document.querySelectorAll('.map-ctrl-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('map-patrol').classList.add('active');
  });
}

function buildPatrolMarker(unit) {
  return L.marker([unit.lat, unit.lng], {
    icon: L.divIcon({
      html: `<div style="
        background:rgba(8,8,27,0.9);
        border:2px solid ${unit.color};
        color:${unit.color};
        width:36px; height:36px;
        border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        font-size:16px;
        box-shadow:0 0 12px ${unit.color}40;
        cursor:pointer;
      " title="${unit.id} — ${unit.officer}">🚔</div>`,
      className: '',
      iconAnchor: [18, 18],
    }),
  }).bindPopup(`
    <div class="patrol-popup-title">🚔 Unit ${unit.id}</div>
    <div class="patrol-popup-row"><span>Officer</span><span>${unit.officer}</span></div>
    <div class="patrol-popup-row"><span>Zone</span><span>${unit.zone}</span></div>
    <div class="patrol-popup-row"><span>Status</span><span style="color:#32cd64;text-transform:uppercase">${unit.status}</span></div>
    <div class="patrol-popup-row"><span>Fuel</span><span>${unit.fuel}%</span></div>
  `, { maxWidth: 200 });
}

function animatePatrolUnits(patrolMarkers) {
  Object.values(patrolMarkers).forEach(({ marker, unit }) => {
    const dlat = (Math.random() - 0.5) * 0.004;
    const dlng = (Math.random() - 0.5) * 0.005;
    const newLat = unit.lat + dlat;
    const newLng = unit.lng + dlng;
    unit.lat = newLat;
    unit.lng = newLng;
    marker.setLatLng([newLat, newLng]);
  });
}

// ── Alert Feed ────────────────────────────────────────────────
function buildAlertFeed() {
  const feed = document.getElementById('alert-feed');
  if (!feed) return;

  // Seed 5 initial alerts
  const initial = [...ALERT_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, 5);
  initial.forEach((tpl, i) => {
    const item = createAlertItem(tpl, (i + 1) * 40);
    feed.appendChild(item);
    FEED.items.push(item);
  });
}

function createAlertItem(tpl, ageSeconds) {
  const el = document.createElement('div');
  el.className = `alert-item ${tpl.level}`;
  el.innerHTML = `
    <i class="fa-solid ${tpl.icon} alert-item-icon"></i>
    <div class="alert-item-body">
      <div class="alert-item-title">${tpl.title}</div>
      <div class="alert-item-detail">${tpl.detail}</div>
      <div class="alert-item-time">${timeAgo(ageSeconds)} &nbsp;·&nbsp; ${tpl.zone}</div>
    </div>
  `;
  return el;
}

function startAlertStream() {
  const feed = document.getElementById('alert-feed');
  if (!feed) return;

  let tick = 0;
  const id = setInterval(() => {
    tick++;
    // New alert every 4 seconds
    const tpl = ALERT_TEMPLATES[tick % ALERT_TEMPLATES.length];
    const item = createAlertItem(tpl, 0);
    item.style.opacity = '0';
    feed.insertBefore(item, feed.firstChild);
    requestAnimationFrame(() => { item.style.transition = 'opacity 0.4s'; item.style.opacity = '1'; });

    // Update ages
    const rows = feed.querySelectorAll('.alert-item');
    rows.forEach((row, idx) => {
      const timeEl = row.querySelector('.alert-item-time');
      if (timeEl && idx > 0) {
        timeEl.textContent = timeAgo(idx * 4) + ' · ' + (ALERT_TEMPLATES[(tick - idx + ALERT_TEMPLATES.length) % ALERT_TEMPLATES.length]?.zone || '');
      }
    });

    // Trim excess
    if (rows.length > FEED.maxItems) {
      rows[rows.length - 1].remove();
    }

    // Update KPI
    const alertBadge = document.getElementById('dash-alert-count');
    const kpiAlerts  = document.getElementById('kpi-alerts');
    const alertCount = 20 + (tick % 8);
    if (alertBadge) alertBadge.textContent = alertCount;
    if (kpiAlerts)  kpiAlerts.textContent  = alertCount;

    // Update ds updated
    const dsEl = document.getElementById('ds-updated');
    if (dsEl) dsEl.textContent = 'Updated: Just now';

    // Update crimes prevented counter
    const prevented = document.getElementById('kpi-prevented');
    if (prevented) prevented.textContent = 147 + Math.floor(tick * 0.25);

  }, 4000);
  APP.intervals.push(id);
}

// ── KPI animate ───────────────────────────────────────────────
function animateKPIs() {
  // Subtle number animation on load
  const targets = [
    { id: 'kpi-alerts',    end: 24,    suffix: '' },
    { id: 'kpi-zones',     end: 8,     suffix: '' },
    { id: 'kpi-patrols',   end: 6,     suffix: '' },
    { id: 'kpi-prevented', end: 147,   suffix: '' },
  ];
  targets.forEach(({ id, end, suffix }) => {
    const el = document.getElementById(id);
    if (!el) return;
    let current = 0;
    const step = Math.ceil(end / 30);
    const timer = setInterval(() => {
      current = Math.min(current + step, end);
      el.textContent = current + suffix;
      if (current >= end) clearInterval(timer);
    }, 40);
  });
}

// ── Data source ping animation ────────────────────────────────
function startDataSourcePing() {
  const pills = document.querySelectorAll('.ds-pill.active');
  let i = 0;
  const id = setInterval(() => {
    pills.forEach(p => p.style.opacity = '0.6');
    if (pills[i]) {
      pills[i].style.opacity = '1';
      pills[i].style.borderColor = 'rgba(50,205,100,0.6)';
      setTimeout(() => { if (pills[i]) pills[i].style.borderColor = ''; }, 600);
    }
    i = (i + 1) % pills.length;
  }, 800);
  APP.intervals.push(id);
}
