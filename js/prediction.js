/**
 * prediction.js — Screen 2: Crime Prediction Engine
 * CrimeSphere AI Command Platform
 */

'use strict';

const SHAP_FACTORS = [
  { label: 'Festival Activity (Navratri)', value: 22, maxVal: 25 },
  { label: 'Cyber Fraud Spike (ATM link)', value: 18, maxVal: 25 },
  { label: 'Historical Theft Pattern',     value: 14, maxVal: 25 },
  { label: 'Crowd Density (Mobile data)',  value: 11, maxVal: 25 },
  { label: 'Traffic Congestion',           value: 7,  maxVal: 25 },
  { label: 'Weather Correlation',          value: 6,  maxVal: 25 },
];

const RISK_TABLE_DATA = [
  { zone: 'Navrangpura', crime: 'Theft & Cyber',    risk: 78, level: 'critical', conf: 94, priority: 'P1 — Immediate', model: 'XGBoost+LSTM',   status: 'ACTIVE ALERT'  },
  { zone: 'Naroda',      crime: 'Assault & Theft',  risk: 72, level: 'critical', conf: 91, priority: 'P1 — Immediate', model: 'XGBoost',       status: 'ACTIVE ALERT'  },
  { zone: 'SG Highway',  crime: 'Vehicle Crime',    risk: 65, level: 'high',     conf: 89, priority: 'P2 — High',     model: 'GNN+LSTM',      status: 'MONITORING'    },
  { zone: 'Maninagar',   crime: 'Chain Snatching',  risk: 61, level: 'high',     conf: 88, priority: 'P2 — High',     model: 'Random Forest', status: 'MONITORING'    },
  { zone: 'Satellite',   crime: 'Cyber Fraud',      risk: 55, level: 'high',     conf: 85, priority: 'P2 — High',     model: 'XGBoost',       status: 'WATCH'         },
  { zone: 'Kalupur',     crime: 'Transit Fraud',    risk: 52, level: 'high',     conf: 86, priority: 'P2 — High',     model: 'LSTM',          status: 'WATCH'         },
  { zone: 'Vastrapur',   crime: 'Residential Theft',risk: 48, level: 'medium',   conf: 82, priority: 'P3 — Medium',   model: 'Random Forest', status: 'NORMAL'        },
  { zone: 'Bopal',       crime: 'Minor Theft',      risk: 31, level: 'medium',   conf: 78, priority: 'P3 — Medium',   model: 'XGBoost',       status: 'NORMAL'        },
];

function initPrediction() {
  buildRiskCards();
  buildModelAccuracyChart();
  buildCrimeTrendChart();
  buildSHAPPanel();
  buildRiskTable();
}

// ── Risk Cards ────────────────────────────────────────────────
function buildRiskCards() {
  const container = document.getElementById('risk-cards-row');
  if (!container) return;

  const topZones = ZONES.slice(0, 5);
  topZones.forEach(zone => {
    const card = document.createElement('div');
    card.className = `risk-card ${zone.level}`;
    card.innerHTML = `
      <div class="risk-zone-name">${zone.name}</div>
      <div class="risk-crime-type"><i class="fa-solid fa-triangle-exclamation"></i> ${zone.crime}</div>
      <div class="risk-score-wrap">
        <span class="risk-score-num">${zone.risk}</span>
        <span class="risk-score-max">/100</span>
      </div>
      <div class="risk-bar">
        <div class="risk-bar-fill" style="width:${zone.risk}%"></div>
      </div>
      <div class="risk-meta">
        <div class="risk-meta-row"><span>Confidence</span><span>${zone.conf}%</span></div>
        <div class="risk-meta-row"><span>AI Models</span><span>XGBoost·LSTM</span></div>
        <div class="risk-meta-row"><span>Patrol</span><span style="color:#00c8ff">${zone.patrol}</span></div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ── Model Accuracy Chart ──────────────────────────────────────
function buildModelAccuracyChart() {
  const ctx = document.getElementById('model-accuracy-chart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['XGBoost', 'GNN', 'Random Forest', 'LSTM'],
      datasets: [{
        label: 'Accuracy (%)',
        data: [94.2, 92.1, 91.8, 89.5],
        backgroundColor: [
          'rgba(0,200,255,0.7)',
          'rgba(138,43,226,0.7)',
          'rgba(50,205,100,0.7)',
          'rgba(255,215,0,0.7)',
        ],
        borderColor: [
          '#00c8ff', '#8a2be2', '#32cd64', '#ffd700',
        ],
        borderWidth: 1.5,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0d1235',
          borderColor: '#1a2450',
          borderWidth: 1,
          titleColor: '#00c8ff',
          bodyColor: '#e8eeff',
          callbacks: {
            label: ctx => ` ${ctx.parsed.y}% accuracy`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#7a8bb5', font: { family: 'Outfit', size: 11 } },
          grid:  { color: '#1a2450', drawBorder: false },
        },
        y: {
          min: 85,
          max: 97,
          ticks: { color: '#7a8bb5', font: { family: 'Outfit', size: 10 }, callback: v => v + '%' },
          grid:  { color: '#1a2450', drawBorder: false },
        },
      },
    },
  });
}

// ── Crime Trend Chart (7-day line) ────────────────────────────
function buildCrimeTrendChart() {
  const ctx = document.getElementById('crime-trend-chart');
  if (!ctx) return;

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const makeData = (base, variance) => days.map(() => base + (Math.random() - 0.5) * variance);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: days,
      datasets: [
        {
          label: 'Theft',
          data: makeData(42, 20),
          borderColor: '#ff5050',
          backgroundColor: 'rgba(255,80,80,0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#ff5050',
        },
        {
          label: 'Cyber',
          data: makeData(28, 14),
          borderColor: '#00c8ff',
          backgroundColor: 'rgba(0,200,255,0.06)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#00c8ff',
        },
        {
          label: 'Vehicle',
          data: makeData(18, 10),
          borderColor: '#ffd700',
          backgroundColor: 'rgba(255,215,0,0.04)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#ffd700',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#7a8bb5', font: { family: 'Outfit', size: 10 }, boxWidth: 10 },
        },
        tooltip: {
          backgroundColor: '#0d1235',
          borderColor: '#1a2450',
          borderWidth: 1,
          titleColor: '#00c8ff',
          bodyColor: '#e8eeff',
        },
      },
      scales: {
        x: {
          ticks: { color: '#7a8bb5', font: { family: 'Outfit', size: 10 } },
          grid:  { color: '#1a2450', drawBorder: false },
        },
        y: {
          ticks: { color: '#7a8bb5', font: { family: 'Outfit', size: 10 } },
          grid:  { color: '#1a2450', drawBorder: false },
        },
      },
    },
  });
}

// ── SHAP Explainability Panel ─────────────────────────────────
function buildSHAPPanel() {
  const container = document.getElementById('shap-factors');
  if (!container) return;

  SHAP_FACTORS.forEach(factor => {
    const pct = (factor.value / factor.maxVal) * 100;
    const row = document.createElement('div');
    row.className = 'shap-row';
    row.innerHTML = `
      <div class="shap-label">${factor.label}</div>
      <div class="shap-bar-track">
        <div class="shap-bar-fill" style="width:0%" data-target="${pct}"></div>
      </div>
      <div class="shap-val">+${factor.value}</div>
    `;
    container.appendChild(row);
  });

  // Animate bars after a brief delay
  setTimeout(() => {
    container.querySelectorAll('.shap-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.target + '%';
    });
  }, 400);
}

// ── Risk Table ────────────────────────────────────────────────
function buildRiskTable() {
  const tbody = document.getElementById('risk-table-body');
  if (!tbody) return;

  const priorityClass = { 'P1 — Immediate': 'p1', 'P2 — High': 'p2', 'P3 — Medium': 'p3' };
  const statusColor   = { 'ACTIVE ALERT': '#ff5050', 'MONITORING': '#ff8c00', 'WATCH': '#ffd700', 'NORMAL': '#32cd64' };

  RISK_TABLE_DATA.forEach((row, i) => {
    const tr = document.createElement('tr');
    const confPct = row.conf;
    const pClass  = priorityClass[row.priority] || 'p3';
    const sColor  = statusColor[row.status] || '#7a8bb5';

    tr.innerHTML = `
      <td>${String(i + 1).padStart(2, '0')}</td>
      <td style="color:#e8eeff;font-weight:600">${row.zone}</td>
      <td>${row.crime}</td>
      <td>
        <span class="risk-badge ${row.level}">${row.risk}/100</span>
      </td>
      <td>
        <div class="conf-bar">
          <div class="conf-bar-track">
            <div class="conf-bar-fill" style="width:${confPct}%"></div>
          </div>
          <span class="conf-val">${confPct}%</span>
        </div>
      </td>
      <td><span class="priority-badge ${pClass}">${row.priority}</span></td>
      <td style="color:#7a8bb5;font-family:'JetBrains Mono',monospace;font-size:11px">${row.model}</td>
      <td style="color:${sColor};font-weight:700;font-size:10px">${row.status}</td>
    `;
    tbody.appendChild(tr);
  });
}
