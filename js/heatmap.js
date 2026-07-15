/**
 * heatmap.js — Screen 3: Crime Heatmap
 * CrimeSphere AI Command Platform
 */

'use strict';

let heatLayer = null;
let currentType = 'all';
let currentRange = '24h';

// Raw local fallback data in case FastAPI backend is offline
const FALLBACK_HEAT_DATA = {
  theft: [
    [23.0225, 72.5714, 0.9], [23.0240, 72.5730, 0.7], [23.0210, 72.5700, 0.8],
    [23.0835, 72.6472, 0.85],[23.0850, 72.6480, 0.6], [23.0820, 72.6460, 0.7],
    [22.9862, 72.5949, 0.7], [22.9850, 72.5960, 0.6], [22.9870, 72.5940, 0.65],
    [23.0280, 72.5260, 0.5], [23.0295, 72.5275, 0.45],[23.0270, 72.5250, 0.5],
    [23.0180, 72.5800, 0.6], [23.0350, 72.5900, 0.55],[23.0100, 72.5650, 0.5],
    [23.0450, 72.5600, 0.4], [23.0300, 72.5400, 0.45],[23.0150, 72.5500, 0.4],
  ],
  cyber: [
    [23.0225, 72.5714, 0.8], [23.0274, 72.5097, 0.75],[23.0395, 72.5100, 0.6],
    [23.0225, 72.5936, 0.7], [23.0210, 72.5920, 0.65],[23.0240, 72.5950, 0.6],
    [23.0500, 72.5800, 0.55],[23.0600, 72.5200, 0.5], [22.9900, 72.5800, 0.5],
    [23.0700, 72.6000, 0.45],[23.0400, 72.5700, 0.5], [23.0300, 72.5600, 0.45],
  ],
  vehicle: [
    [23.0395, 72.5100, 0.9], [23.0410, 72.5115, 0.75],[23.0380, 72.5090, 0.8],
    [23.0350, 72.4700, 0.4], [23.0450, 72.5300, 0.55],[23.0520, 72.5400, 0.5],
    [22.9800, 72.5600, 0.45],[23.0600, 72.5800, 0.4], [23.0200, 72.4900, 0.45],
  ],
  assault: [
    [23.0835, 72.6472, 0.95],[23.0820, 72.6460, 0.8], [23.0850, 72.6490, 0.75],
    [22.9862, 72.5949, 0.6], [23.0100, 72.6000, 0.55],[23.0700, 72.6200, 0.5],
    [23.0500, 72.6000, 0.45],[22.9900, 72.5500, 0.4], [23.0050, 72.5800, 0.45],
  ],
  fraud: [
    [23.0225, 72.5936, 0.85],[23.0240, 72.5945, 0.7], [23.0215, 72.5920, 0.75],
    [23.0225, 72.5714, 0.7], [23.0274, 72.5097, 0.65],[23.0395, 72.5100, 0.55],
    [23.0280, 72.5260, 0.5], [23.0500, 72.5500, 0.45],[23.0150, 72.5700, 0.5],
    [23.0600, 72.5900, 0.4], [22.9950, 72.6000, 0.45],[23.0400, 72.6100, 0.4],
  ],
};
FALLBACK_HEAT_DATA.all = Object.values(FALLBACK_HEAT_DATA).flat();

const FALLBACK_HEAT_STATS = {
  all:     { events: 1247, predictions: 89, coverage: '94%', danger: 'Naroda' },
  theft:   { events: 482,  predictions: 34, coverage: '91%', danger: 'Navrangpura' },
  cyber:   { events: 318,  predictions: 22, coverage: '88%', danger: 'Kalupur' },
  vehicle: { events: 214,  predictions: 15, coverage: '87%', danger: 'SG Highway' },
  assault: { events: 143,  predictions: 11, coverage: '89%', danger: 'Naroda' },
  fraud:   { events: 290,  predictions: 18, coverage: '85%', danger: 'Kalupur' },
};

function initHeatmap() {
  buildHeatmapMap();
  buildHeatmapControls();
}

function buildHeatmapMap() {
  const map = L.map('heatmap-map', {
    center: [23.0225, 72.5714],
    zoom: 12,
    zoomControl: true,
  });
  window.heatMap = map;

  darkTileLayer().addTo(map);

  // Zone boundary circles (subtle)
  ZONES.forEach(zone => {
    L.circle([zone.lat, zone.lng], {
      radius: 400,
      color: riskColor(zone.level),
      fillColor: riskColor(zone.level),
      fillOpacity: 0.03,
      weight: 1,
      dashArray: '4 4',
    }).addTo(map);
  });

  // Initial heatmap
  renderHeatLayer(map, 'all');
}

async function renderHeatLayer(map, type) {
  if (heatLayer) { map.removeLayer(heatLayer); heatLayer = null; }

  try {
    const res = await fetch(`http://localhost:8000/api/heatmap?crime_type=${type}&time_range=${currentRange}`).then(r => r.json());
    
    heatLayer = L.heatLayer(res.data, {
      radius: 18,
      blur: 10,
      maxZoom: 14,
      max: 1.0,
      gradient: {
        0.2: '#2196F3',
        0.4: '#4CAF50',
        0.6: '#FFEB3B',
        0.8: '#FF9800',
        1.0: '#F44336',
      },
    });
    heatLayer.addTo(map);
    
    // Update stats from backend
    const ev = document.getElementById('hm-events');
    const pr = document.getElementById('hm-predictions');
    const co = document.getElementById('hm-coverage');
    const dg = document.getElementById('hm-dangerous');
    if (ev) ev.textContent = res.stats.events.toLocaleString();
    if (pr) pr.textContent = res.stats.predictions;
    if (co) co.textContent = res.stats.coverage;
    if (dg) dg.textContent = res.stats.danger;

    const label = document.getElementById('hm-type-label');
    const names = { all: 'All Crimes', theft: 'Theft', cyber: 'Cyber Crime', vehicle: 'Vehicle Crime', assault: 'Assault', fraud: 'Fraud' };
    if (label) label.textContent = 'Showing: ' + (names[type] || type);

  } catch (err) {
    // Local fallback
    const data = FALLBACK_HEAT_DATA[type] || FALLBACK_HEAT_DATA.all;
    const multiplier = { '24h': 1.0, '7d': 1.4, '30d': 1.8 }[currentRange] || 1.0;
    const scaled = data.map(([lat, lng, val]) => [lat, lng, Math.min(val * multiplier, 1.0)]);
    
    heatLayer = L.heatLayer(scaled, {
      radius: 18,
      blur: 10,
      maxZoom: 14,
      max: 1.0,
      gradient: {
        0.2: '#2196F3',
        0.4: '#4CAF50',
        0.6: '#FFEB3B',
        0.8: '#FF9800',
        1.0: '#F44336',
      },
    });
    heatLayer.addTo(map);
    
    const stats = FALLBACK_HEAT_STATS[type] || FALLBACK_HEAT_STATS.all;
    const rm = { '24h': 1, '7d': 7, '30d': 30 }[currentRange] || 1;
    const ev = document.getElementById('hm-events');
    const pr = document.getElementById('hm-predictions');
    const co = document.getElementById('hm-coverage');
    const dg = document.getElementById('hm-dangerous');
    
    if (ev) ev.textContent = Math.round(stats.events * rm * 0.85).toLocaleString();
    if (pr) pr.textContent = stats.predictions;
    if (co) co.textContent = stats.coverage;
    if (dg) dg.textContent = stats.danger;

    const label = document.getElementById('hm-type-label');
    const names = { all: 'All Crimes', theft: 'Theft', cyber: 'Cyber Crime', vehicle: 'Vehicle Crime', assault: 'Assault', fraud: 'Fraud' };
    if (label) label.textContent = 'Showing: ' + (names[type] || type);
  }
}

function buildHeatmapControls() {
  // Crime type buttons
  document.querySelectorAll('#crime-type-btns .ctrl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#crime-type-btns .ctrl-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.dataset.type;
      if (window.heatMap) renderHeatLayer(window.heatMap, currentType);
    });
  });

  // Time range buttons
  document.querySelectorAll('#time-range-btns .ctrl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#time-range-btns .ctrl-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRange = btn.dataset.range;
      if (window.heatMap) renderHeatLayer(window.heatMap, currentType);
    });
  });
}
