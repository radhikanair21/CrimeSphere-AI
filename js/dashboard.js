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

  // Define Layer Groups for Toggling
  const hotspotGroup = L.layerGroup().addTo(map);
  const patrolGroup = L.layerGroup().addTo(map);
  const cctvGroup = L.layerGroup().addTo(map);
  const stationGroup = L.layerGroup().addTo(map);

  // Crime hotspot circles (Zones)
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
    }).addTo(hotspotGroup);

    // Main circle
    const circle = L.circle([zone.lat, zone.lng], {
      radius: radius,
      color: color,
      fillColor: color,
      fillOpacity: 0.18,
      weight: 2,
    }).addTo(hotspotGroup);

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
    }).addTo(hotspotGroup);
  });

  // Patrol unit markers
  const patrolMarkers = {};
  PATROL_UNITS.forEach(unit => {
    const marker = buildPatrolMarker(unit);
    marker.addTo(patrolGroup);
    patrolMarkers[unit.id] = { marker, unit: { ...unit } };
  });

  // Simulated CCTV Cameras (Computer Vision Overlay)
  const CCTV_CAMERAS = [
    { id: 'CCTV-NAV-101', name: 'Navrangpura Crossroads', lat: 23.0230, lng: 72.5700, status: 'active', people: 14, loitering: 'no', vehicle: 'none' },
    { id: 'CCTV-MAN-204', name: 'Maninagar Market Rd', lat: 22.9860, lng: 72.5960, status: 'alert', people: 47, loitering: 'YES', vehicle: 'SUSPECTED MOTORBIKE' },
    { id: 'CCTV-SGH-302', name: 'SG Highway Flyover', lat: 23.0410, lng: 72.5120, status: 'active', people: 3, loitering: 'no', vehicle: 'none' },
    { id: 'CCTV-KAL-405', name: 'Kalupur Station Gate 1', lat: 23.0235, lng: 72.5950, status: 'alert', people: 82, loitering: 'YES', vehicle: 'none' },
    { id: 'CCTV-SAT-501', name: 'Satellite Rd Mall Entrance', lat: 23.0270, lng: 72.5080, status: 'active', people: 21, loitering: 'no', vehicle: 'none' },
  ];

  CCTV_CAMERAS.forEach(cam => {
    const iconColor = cam.status === 'alert' ? '#ff5050' : '#00c8ff';
    const marker = L.marker([cam.lat, cam.lng], {
      icon: L.divIcon({
        html: `<div style="
          background:rgba(8,8,27,0.9);
          border:2px solid ${iconColor};
          color:${iconColor};
          width:30px; height:30px;
          border-radius:6px;
          display:flex; align-items:center; justify-content:center;
          font-size:12px;
          box-shadow:0 0 8px ${iconColor}30;
        ">🎥</div>`,
        className: '',
        iconAnchor: [15, 15],
      })
    });

    const popupContent = `
      <div style="font-family:'Outfit',sans-serif; font-size:13px; font-weight:700; color:${iconColor}; margin-bottom:6px;">🎥 CCTV Surveillance: ${cam.id}</div>
      <div style="font-size:11px; color:#e8eeff; font-weight:600; margin-bottom:4px;">Location: ${cam.name}</div>
      <hr style="border:0; border-top:1px solid #1a2450; margin:6px 0;">
      <div style="font-family:'JetBrains Mono',monospace; font-size:10px; line-height:1.4; color:#7a8bb5;">
        <span style="display:inline-block; width:120px;">Feed Status:</span><span style="color:${cam.status==='alert'?'#ff5050':'#32cd64'}; font-weight:700;">${cam.status.toUpperCase()}</span><br>
        <span style="display:inline-block; width:120px;">People Count:</span><span style="color:#e8eeff;">${cam.people}</span><br>
        <span style="display:inline-block; width:120px;">Crowd Density:</span><span style="color:#ffd700;">${cam.people > 40 ? 'HIGH SURGE' : 'NORMAL'}</span><br>
        <span style="display:inline-block; width:120px;">Loitering Alert:</span><span style="color:${cam.loitering==='YES'?'#ff5050':'#7a8bb5'};">${cam.loitering}</span><br>
        <span style="display:inline-block; width:120px;">Suspicious Veh:</span><span style="color:#ff5050;">${cam.vehicle}</span>
      </div>
    `;
    marker.bindPopup(popupContent, { maxWidth: 260 }).addTo(cctvGroup);
  });

  // Ahmedabad Police Precinct Stations
  const POLICE_STATIONS = [
    { name: 'Navrangpura Police Station', lat: 23.0245, lng: 72.5690 },
    { name: 'Maninagar Police Station', lat: 22.9850, lng: 72.5930 },
    { name: 'SG Highway Police Station', lat: 23.0375, lng: 72.5110 },
    { name: 'Satellite Precinct Station', lat: 23.0290, lng: 72.5070 },
  ];

  POLICE_STATIONS.forEach(station => {
    const marker = L.marker([station.lat, station.lng], {
      icon: L.divIcon({
        html: `<div style="
          background:rgba(8,8,27,0.92);
          border:2px solid #8a2be2;
          color:#8a2be2;
          width:32px; height:32px;
          border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-size:13px;
          box-shadow:0 0 10px rgba(138,43,226,0.4);
        ">🛡️</div>`,
        className: '',
        iconAnchor: [16, 16],
      })
    });

    marker.bindPopup(`
      <div style="font-family:'Outfit',sans-serif; font-size:13px; font-weight:700; color:#8a2be2; margin-bottom:4px;">🛡️ ${station.name}</div>
      <div style="font-size:11px; color:#7a8bb5;">Ahmedabad City Police Division</div>
    `).addTo(stationGroup);
  });

  // Register Leaflet Layer Control (Built-in layer toggling box)
  L.control.layers(null, {
    "<i class='fa-solid fa-fire' style='color:#ff5050'></i> Crime Hotspots": hotspotGroup,
    "<i class='fa-solid fa-car-on' style='color:#00c8ff'></i> Patrol Units": patrolGroup,
    "<i class='fa-solid fa-video' style='color:#ffd700'></i> CCTV Cameras": cctvGroup,
    "<i class='fa-solid fa-shield-halved' style='color:#8a2be2'></i> Police Stations": stationGroup
  }, { collapsed: false, position: 'topright' }).addTo(map);

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

async function animatePatrolUnits(patrolMarkers) {
  try {
    const res = await fetch('http://localhost:8000/api/patrols').then(r => r.json());
    res.patrols.forEach(unit => {
      const match = patrolMarkers[unit.id];
      if (match) {
        match.unit = { ...unit };
        match.marker.setLatLng([unit.lat, unit.lng]);
        
        match.marker.setPopupContent(`
          <div class="patrol-popup-title">🚔 Unit ${unit.id}</div>
          <div class="patrol-popup-row"><span>Officer</span><span>${unit.officer}</span></div>
          <div class="patrol-popup-row"><span>Zone</span><span>${unit.zone}</span></div>
          <div class="patrol-popup-row"><span>Status</span><span style="color:#32cd64;text-transform:uppercase">${unit.status}</span></div>
          <div class="patrol-popup-row"><span>Fuel</span><span>${unit.fuel}%</span></div>
        `);
      }
    });
  } catch (err) {
    Object.values(patrolMarkers).forEach(({ marker, unit }) => {
      const dlat = (Math.random() - 0.5) * 0.004;
      const dlng = (Math.random() - 0.5) * 0.005;
      unit.lat += dlat;
      unit.lng += dlng;
      marker.setLatLng([unit.lat, unit.lng]);
    });
  }
}

// ── Alert Feed ────────────────────────────────────────────────
async function buildAlertFeed() {
  const feed = document.getElementById('alert-feed');
  if (!feed) return;

  try {
    const data = await fetch('http://localhost:8000/api/dashboard').then(r => r.json());
    feed.innerHTML = '';
    data.active_alerts.slice(0, 5).forEach((alert, i) => {
      const item = createAlertItem(alert, (i + 1) * 4);
      feed.appendChild(item);
      FEED.items.push(item);
    });
  } catch (err) {
    const initial = [...ALERT_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, 5);
    initial.forEach((tpl, i) => {
      const item = createAlertItem(tpl, (i + 1) * 40);
      feed.appendChild(item);
      FEED.items.push(item);
    });
  }
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
  const id = setInterval(async () => {
    tick++;
    try {
      const data = await fetch('http://localhost:8000/api/dashboard').then(r => r.json());
      
      feed.innerHTML = '';
      data.active_alerts.slice(0, 12).forEach((alert, idx) => {
        const item = createAlertItem(alert, idx * 4);
        feed.appendChild(item);
      });

      const alertBadge = document.getElementById('dash-alert-count');
      const kpiAlerts  = document.getElementById('kpi-alerts');
      const prevented = document.getElementById('kpi-prevented');
      
      if (alertBadge) alertBadge.textContent = data.kpis.alerts;
      if (kpiAlerts)  kpiAlerts.textContent  = data.kpis.alerts;
      if (prevented)  prevented.textContent  = data.kpis.prevented;
      
      const dsEl = document.getElementById('ds-updated');
      if (dsEl) dsEl.textContent = 'Updated: Just now';

    } catch (err) {
      const tpl = ALERT_TEMPLATES[tick % ALERT_TEMPLATES.length];
      const item = createAlertItem(tpl, 0);
      item.style.opacity = '0';
      feed.insertBefore(item, feed.firstChild);
      requestAnimationFrame(() => { item.style.transition = 'opacity 0.4s'; item.style.opacity = '1'; });

      const rows = feed.querySelectorAll('.alert-item');
      rows.forEach((row, idx) => {
        const timeEl = row.querySelector('.alert-item-time');
        if (timeEl && idx > 0) {
          timeEl.textContent = timeAgo(idx * 4) + ' · ' + (ALERT_TEMPLATES[(tick - idx + ALERT_TEMPLATES.length) % ALERT_TEMPLATES.length]?.zone || '');
        }
      });

      if (rows.length > FEED.maxItems) rows[rows.length - 1].remove();

      const alertBadge = document.getElementById('dash-alert-count');
      const kpiAlerts  = document.getElementById('kpi-alerts');
      const alertCount = 20 + (tick % 8);
      if (alertBadge) alertBadge.textContent = alertCount;
      if (kpiAlerts)  kpiAlerts.textContent  = alertCount;

      const dsEl = document.getElementById('ds-updated');
      if (dsEl) dsEl.textContent = 'Updated: Just now';

      const prevented = document.getElementById('kpi-prevented');
      if (prevented) prevented.textContent = 147 + Math.floor(tick * 0.25);
    }
  }, 4000);
  APP.intervals.push(id);
}

// ── KPI animate ───────────────────────────────────────────────
function animateKPIs() {
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
