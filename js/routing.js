/**
 * routing.js — Screen 4: Smart Patrol Routing
 * CrimeSphere AI Command Platform
 */

'use strict';

// Patrol routes (waypoints as lat/lng arrays)
const PATROL_ROUTES = [
  {
    id: 'P-01', color: '#00c8ff',
    waypoints: [
      [23.0835, 72.6472], [23.0820, 72.6400], [23.0780, 72.6350],
      [23.0820, 72.6300], [23.0860, 72.6380], [23.0835, 72.6472],
    ],
  },
  {
    id: 'P-02', color: '#8a2be2',
    waypoints: [
      [23.0395, 72.5100], [23.0420, 72.5050], [23.0450, 72.5000],
      [23.0480, 72.5080], [23.0430, 72.5150], [23.0395, 72.5100],
    ],
  },
  {
    id: 'P-03', color: '#ffd700',
    waypoints: [
      [23.0225, 72.5714], [23.0250, 72.5750], [23.0270, 72.5700],
      [23.0240, 72.5660], [23.0210, 72.5690], [23.0225, 72.5714],
    ],
  },
  {
    id: 'P-04', color: '#32cd64',
    waypoints: [
      [22.9862, 72.5949], [22.9840, 72.5920], [22.9810, 72.5960],
      [22.9830, 72.6000], [22.9870, 72.5990], [22.9862, 72.5949],
    ],
  },
  {
    id: 'P-05', color: '#ff8c00',
    waypoints: [
      [23.0225, 72.5936], [23.0210, 72.5900], [23.0190, 72.5940],
      [23.0200, 72.5970], [23.0225, 72.5980], [23.0225, 72.5936],
    ],
  },
  {
    id: 'P-06', color: '#ff5050',
    waypoints: [
      [23.0280, 72.5260], [23.0300, 72.5220], [23.0320, 72.5260],
      [23.0310, 72.5300], [23.0285, 72.5295], [23.0280, 72.5260],
    ],
  },
];

// Unit animation state
const unitStates = {};

function initRouting() {
  buildRoutingMap();
  buildRosterList();
}

function buildRoutingMap() {
  const map = L.map('routing-map', {
    center: [23.0300, 72.5600],
    zoom: 12,
    zoomControl: true,
  });
  window.routingMap = map;

  darkTileLayer().addTo(map);

  // Draw hotspot zones (faint)
  ZONES.forEach(zone => {
    L.circle([zone.lat, zone.lng], {
      radius: 700,
      color: riskColor(zone.level),
      fillColor: riskColor(zone.level),
      fillOpacity: 0.06,
      weight: 1,
      dashArray: '6 4',
    }).addTo(map).bindPopup(
      `<div class="cs-popup-title">${zone.name}</div>
       <div class="cs-popup-row"><span>Risk</span><span>${zone.risk}/100</span></div>
       <div class="cs-popup-row"><span>Crime</span><span>${zone.crime}</span></div>`
    );
  });

  // Draw patrol routes
  PATROL_ROUTES.forEach(route => {
    // Route polyline
    L.polyline(route.waypoints, {
      color: route.color,
      weight: 3,
      opacity: 0.7,
      dashArray: '8 4',
      lineJoin: 'round',
    }).addTo(map);

    // Waypoint dots
    route.waypoints.forEach((wp, i) => {
      if (i === 0) return; // skip start (has unit marker)
      L.circleMarker(wp, {
        radius: 4,
        color: route.color,
        fillColor: route.color,
        fillOpacity: 0.8,
        weight: 1,
      }).addTo(map);
    });

    // Unit marker (animated position along route)
    const startWp = route.waypoints[0];
    const unit = PATROL_UNITS.find(u => u.id === route.id);
    const marker = L.marker(startWp, {
      icon: L.divIcon({
        html: `<div style="
          background:rgba(8,8,27,0.92);
          border:2px solid ${route.color};
          color:${route.color};
          width:38px; height:38px;
          border-radius:50%;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          font-size:16px;
          box-shadow:0 0 16px ${route.color}50;
        ">🚔
          <span style="font-size:8px;font-weight:800;color:${route.color};margin-top:-2px">${route.id}</span>
        </div>`,
        className: '',
        iconAnchor: [19, 19],
      }),
    }).bindPopup(`
      <div class="patrol-popup-title">🚔 Unit ${route.id}</div>
      <div class="patrol-popup-row"><span>Officer</span><span>${unit ? unit.officer : ''}</span></div>
      <div class="patrol-popup-row"><span>Zone</span><span>${unit ? unit.zone : ''}</span></div>
      <div class="patrol-popup-row"><span>Status</span><span style="color:#32cd64">PATROLLING</span></div>
      <div class="patrol-popup-row"><span>Algorithm</span><span style="color:#00c8ff">A* + RL</span></div>
    `, { maxWidth: 200 });
    marker.addTo(map);

    unitStates[route.id] = { marker, waypoints: route.waypoints, wpIndex: 0, progress: 0 };
  });

  // Animate units along routes
  const id = setInterval(() => animateRoutingUnits(), 3500);
  APP.intervals.push(id);
}

function animateRoutingUnits() {
  Object.values(unitStates).forEach(state => {
    state.wpIndex = (state.wpIndex + 1) % state.waypoints.length;
    const wp = state.waypoints[state.wpIndex];
    state.marker.setLatLng(wp);
  });
}

function buildRosterList() {
  const container = document.getElementById('roster-list');
  if (!container) return;

  PATROL_UNITS.forEach(unit => {
    const route = PATROL_ROUTES.find(r => r.id === unit.id);
    const item = document.createElement('div');
    item.className = 'roster-item';
    item.style.borderLeftColor = route?.color || '#1a2450';
    item.style.borderLeftWidth = '3px';

    const statusClass = unit.status === 'patrolling' ? 'patrolling' : unit.status === 'active' ? 'active' : 'standby';
    const fuelColor = unit.fuel > 70 ? '#32cd64' : unit.fuel > 40 ? '#ffd700' : '#ff5050';
    const eta = Math.floor(Math.random() * 8) + 2;

    item.innerHTML = `
      <div class="roster-unit-id" style="border-color:${route?.color}40;color:${route?.color};background:${route?.color}18">${unit.id}</div>
      <div class="roster-body">
        <div class="roster-officer">${unit.officer}</div>
        <div class="roster-zone">▸ ${unit.zone}</div>
        <div class="roster-meta">
          <span class="roster-badge ${statusClass}">${unit.status}</span>
          <span style="font-size:9px;color:#4a5578">ETA ${eta}m</span>
        </div>
      </div>
      <div class="roster-fuel">
        <span class="fuel-val" style="color:${fuelColor}">${unit.fuel}%</span>
        <div class="fuel-bar-wrap">
          <div class="fuel-bar" style="width:${unit.fuel}%;background:${fuelColor}"></div>
        </div>
      </div>
    `;

    // Click to highlight on map
    item.addEventListener('click', () => {
      const state = unitStates[unit.id];
      if (state && window.routingMap) {
        window.routingMap.setView(state.marker.getLatLng(), 14, { animate: true });
        state.marker.openPopup();
      }
      container.querySelectorAll('.roster-item').forEach(el => el.style.background = '');
      item.style.background = '#111840';
    });

    container.appendChild(item);
  });
}
