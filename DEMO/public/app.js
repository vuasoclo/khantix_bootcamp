/**
 * KHantix AI CPQ — Client-side Application
 *
 * Manages:
 *  1. Session state (sessionId, slots, conversation)
 *  2. API calls: /api/health, /api/chat, /api/calculate, /api/override
 *  3. UI: slot tracker updates, chat rendering, price report reveal
 *  4. Override Console: collects changes, sends to /api/override, re-renders
 */

'use strict';

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  sessionId: null,
  slots: {},
  filledSlots: [],
  missingSlots: [],
  allSlotsFilled: false,
  priceBreakdown: null,
  originalPrice: null,       // baseline price before any override
  isWaiting: false,          // true while awaiting LLM response
  calcParams: {
    estimatedManDays: null,  // null = auto-derive from slots
    primaryRole: 'Senior',
    userCount: null,
    includesOnsite: false,
    strategy: 'HUNTER',
  },
};

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Generate a readable session ID */
function generateSessionId() {
  const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `KHX-${ts}-${rand}`;
}

/** Format a number as Vietnamese Dong */
function formatVND(n) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n);
}

/** Format a decimal as percentage */
function fmtPct(n) {
  return `${(n * 100).toFixed(1)}%`;
}

/** Escape HTML to prevent injection */
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Auto-resize textarea as user types */
function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

// ─── API Helpers ──────────────────────────────────────────────────────────────

async function apiGet(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `POST ${path} → ${res.status}`);
  return data;
}

// ─── UI: Chat ─────────────────────────────────────────────────────────────────

function appendMessage(role, content) {
  const welcome = document.getElementById('chat-welcome');
  if (welcome) welcome.remove();

  const messages = document.getElementById('messages');
  const indicator = document.getElementById('typing-indicator');

  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.innerHTML = `
    <div class="msg-label">${role === 'ai' ? '🤖 KHantix AI' : '👤 You'}</div>
    <div class="msg-bubble">${esc(content)}</div>
  `;
  messages.insertBefore(div, indicator);
  messages.scrollTop = messages.scrollHeight;
}

function showTyping() {
  document.getElementById('typing-indicator').classList.add('visible');
  const messages = document.getElementById('messages');
  messages.scrollTop = messages.scrollHeight;
}

function hideTyping() {
  document.getElementById('typing-indicator').classList.remove('visible');
}

function setInputEnabled(enabled) {
  const input = document.getElementById('user-input');
  const btn = document.getElementById('send-btn');
  input.disabled = !enabled;
  btn.disabled = !enabled;
  state.isWaiting = !enabled;
}

// ─── UI: Slot Tracker ─────────────────────────────────────────────────────────

const SLOT_DISPLAY_MAP = {
  Data_Risk:          { label: 'Data Migration Quality', icon: '🗄️' },
  Integration_Risk:   { label: 'System Integration',     icon: '🔌' },
  Tech_Literacy_Risk: { label: 'User Tech Literacy',     icon: '👩‍🏫' },
  Hardware_Sizing:    { label: 'Hardware Tier',           icon: '🖥️' },
  Scope_Granularity:  { label: 'Scope Granularity',      icon: '📐' },
  Rush_Factor:        { label: 'Rush Factor',             icon: '⚡' },
  Client_Logo_Size:   { label: 'Client Size',            icon: '🏢' },
  Payment_Term:       { label: 'Payment Term',            icon: '💳' },
};

const VALUE_DISPLAY = {
  HIGH:        'HIGH ▲',
  MEDIUM:      'MEDIUM ●',
  LOW:         'LOW ▼',
  FALLBACK:    'UNKNOWN ⚠',
  TIER_LARGE:  'LARGE TIER',
  TIER_SMALL:  'SMALL TIER',
  ENTERPRISE:  'ENTERPRISE',
  SMALL:       'SMALL',
  SMB:         'SMB',
  UPFRONT:     'UPFRONT 💰',
  INSTALLMENT: 'INSTALLMENT',
};

function updateSlotTracker(slots, filledSlots) {
  let filledCount = 0;

  for (const [key, val] of Object.entries(slots)) {
    const card = document.getElementById(`slot-${key}`);
    if (!card) continue;

    const valueEl = card.querySelector('.slot-value');
    const wasEmpty = card.dataset.risk === 'null';

    if (val !== null && val !== undefined) {
      filledCount++;
      const displayVal = VALUE_DISPLAY[val] ?? val;
      valueEl.textContent = displayVal;
      card.dataset.risk = val;

      if (wasEmpty) {
        card.classList.add('filled');
        setTimeout(() => card.classList.remove('filled'), 500);
      }
    } else {
      valueEl.textContent = '—';
      card.dataset.risk = 'null';
    }
  }

  // Update progress
  const total = Object.keys(SLOT_DISPLAY_MAP).length;
  document.getElementById('progress-count').textContent = `${filledCount} / ${total}`;
  const pct = (filledCount / total) * 100;
  const fill = document.getElementById('progress-bar-fill');
  fill.style.width = `${pct}%`;
  fill.setAttribute('aria-valuenow', filledCount);

  // Update override console current-value labels
  updateOverrideCurrentVals(slots);
}

function updateOverrideCurrentVals(slots) {
  const mapping = {
    'ov-data-risk-cur': slots.Data_Risk,
    'ov-int-risk-cur':  slots.Integration_Risk,
    'ov-tech-risk-cur': slots.Tech_Literacy_Risk,
  };
  for (const [id, val] of Object.entries(mapping)) {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? '—';
  }
}

// ─── UI: Price Report ─────────────────────────────────────────────────────────

function showPriceReport(breakdown, delta = null) {
  document.getElementById('report-placeholder').style.display = 'none';
  document.getElementById('report-content').hidden = false;

  // Hero price
  document.getElementById('price-amount').textContent = formatVND(breakdown.recommendedPrice);

  const strategyNote = breakdown._debug?.strategy === 'FARMER'
    ? 'Recurring subscription pricing (FARMER strategy)'
    : 'Upfront revenue pricing (HUNTER strategy)';
  document.getElementById('price-note').textContent = strategyNote;

  // Price delta badge
  const deltaEl = document.getElementById('price-delta');
  if (delta && delta.delta !== 0) {
    const sign = delta.delta > 0 ? '+' : '';
    deltaEl.textContent = `Override Δ: ${sign}${formatVND(delta.delta)} (${delta.deltaPercent})`;
    deltaEl.className = `visible ${delta.delta < 0 ? 'negative' : 'positive'}`;
  } else {
    deltaEl.className = '';
  }

  // Narrative
  const narrativeEl = document.getElementById('narrative-list');
  narrativeEl.innerHTML = breakdown.narrative
    .map(p => `<p class="narrative-para">${esc(p)}</p>`)
    .join('');

  // Cost items
  const costEl = document.getElementById('cost-items');
  const items = breakdown.costLineItems ?? [];
  const total = items.reduce((s, i) => s + i.amount, 0);

  costEl.innerHTML = items.map(item => `
    <div class="cost-row">
      <div>
        <div class="cost-label">${esc(item.category)}</div>
        <div class="cost-sub">${esc(item.explanation)}</div>
      </div>
      <div class="cost-amount">${formatVND(item.amount)}</div>
    </div>
  `).join('') + `
    <div class="cost-total-row">
      <div class="cost-label">Total Base Cost</div>
      <div class="cost-amount">${formatVND(total)}</div>
    </div>
  `;

  // Risk adjustments
  const riskEl = document.getElementById('risk-items');
  const risks = breakdown.riskAdjustments ?? [];
  if (risks.length === 0) {
    riskEl.innerHTML = '<p style="font-size:12px;color:var(--text-secondary)">No risk adjustments applied.</p>';
  } else {
    riskEl.innerHTML = risks.map(r => `
      <div class="risk-row">
        <div class="risk-row-header">
          <span class="risk-dimension">${esc(r.dimension)}</span>
          <div style="display:flex;gap:6px;align-items:center">
            <span class="risk-tag ${esc(r.level)}">${esc(r.level)}</span>
            <span class="risk-buffer">+${fmtPct(r.bufferApplied)} / +${r.extraDays}d</span>
          </div>
        </div>
        <div class="risk-why">${esc(r.why)}</div>
      </div>
    `).join('');
  }

  // Margin
  const m = breakdown.marginBreakdown;
  const marginEl = document.getElementById('margin-items');
  marginEl.innerHTML = `
    <div class="margin-row">
      <span class="margin-name">Net Profit</span>
      <span class="margin-pct">${fmtPct(m.netProfitPct)}</span>
    </div>
    <div class="margin-row">
      <span class="margin-name">Risk Premium</span>
      <span class="margin-pct">${fmtPct(m.riskPremiumPct)}</span>
    </div>
    <div class="margin-row">
      <span class="margin-name">Reinvestment</span>
      <span class="margin-pct">${fmtPct(m.reinvestmentPct)}</span>
    </div>
    <div class="margin-row margin-total">
      <span class="margin-name">Total Margin</span>
      <span class="margin-pct">${fmtPct(m.totalMarginPct)} &nbsp;(${formatVND(m.totalMarginAmount)})</span>
    </div>
    <div class="margin-why">${esc(m.why)}</div>
  `;

  // Scroll report into view
  document.getElementById('report-scroll').scrollTop = 0;
}

// ─── UI: Audit Log ────────────────────────────────────────────────────────────

function appendAuditLogs(logs) {
  if (!logs || logs.length === 0) return;

  const card = document.getElementById('audit-log-card');
  const container = document.getElementById('audit-log');
  card.hidden = false;

  // Only append the newest entry (last in array)
  const log = logs[logs.length - 1];
  const entry = document.createElement('div');
  entry.className = 'audit-entry';
  entry.innerHTML = `
    <div class="audit-field">${esc(log.field)}</div>
    <div class="audit-change">
      ${esc(String(log.aiOriginalValue ?? 'auto'))} → <strong>${esc(String(log.overriddenValue))}</strong>
      &nbsp;by ${esc(log.overriddenBy)}
    </div>
    <div class="audit-reason">${esc(log.reason)}</div>
  `;
  container.appendChild(entry);
}

// ─── API: Health check ────────────────────────────────────────────────────────

async function checkHealth() {
  try {
    const data = await apiGet('/api/health');
    document.getElementById('provider-name').textContent =
      `${data.provider} / ${data.model ?? 'default'}`;
    console.log('[KHantix] Health OK:', data);
  } catch (err) {
    document.getElementById('provider-name').textContent = 'OFFLINE';
    document.getElementById('provider-badge').style.borderColor = 'rgba(255,107,107,0.4)';
    document.querySelector('#provider-badge .status-dot').style.background = '#ff6b6b';
    console.error('[KHantix] Health check failed:', err.message);
  }
}

// ─── API: Chat ────────────────────────────────────────────────────────────────

async function sendChat(message) {
  setInputEnabled(false);
  showTyping();
  appendMessage('user', message);

  try {
    const data = await apiPost('/api/chat', {
      sessionId: state.sessionId,
      message,
    });

    hideTyping();
    appendMessage('ai', data.nextQuestion);

    // Update state
    state.slots = data.updatedSlots;
    state.filledSlots = data.filledSlots;
    state.missingSlots = data.missingSlots;
    state.allSlotsFilled = data.allSlotsFilled;

    updateSlotTracker(data.updatedSlots, data.filledSlots);

    // If all slots are filled, auto-calculate
    if (data.allSlotsFilled) {
      await runCalculate();
    }
  } catch (err) {
    hideTyping();
    appendMessage('ai', `⚠️ Error: ${err.message}. Please try again.`);
    console.error('[Chat] Error:', err);
  } finally {
    setInputEnabled(true);
    document.getElementById('user-input').focus();
  }
}

// ─── API: Calculate ───────────────────────────────────────────────────────────

async function runCalculate() {
  const payload = {
    sessionId: state.sessionId,
    ...state.calcParams,
  };

  // Remove null values so server uses smart defaults
  for (const key of Object.keys(payload)) {
    if (payload[key] === null) delete payload[key];
  }

  try {
    const data = await apiPost('/api/calculate', payload);
    state.priceBreakdown = data.breakdown;
    state.originalPrice = data.breakdown.recommendedPrice;
    showPriceReport(data.breakdown);

    // Sync override defaults
    syncOverrideDefaults(data.params ?? {});
  } catch (err) {
    console.error('[Calculate] Error:', err);
    appendMessage('ai', '⚠️ Price calculation encountered an error. Please check the server.');
  }
}

function syncOverrideDefaults(params) {
  if (params.estimatedManDays) {
    document.getElementById('ov-mandays').placeholder = params.estimatedManDays;
  }
  if (params.primaryRole) {
    document.getElementById('ov-role').value = params.primaryRole;
  }
  document.getElementById('ov-strategy').value = params.strategy ?? 'HUNTER';
  document.getElementById('ov-strategy-cur').textContent = params.strategy ?? 'HUNTER';
}

// ─── API: Override ────────────────────────────────────────────────────────────

async function applyOverride() {
  const reason = document.getElementById('ov-reason').value.trim();
  if (!reason) {
    document.getElementById('ov-reason').focus();
    document.getElementById('ov-reason').style.borderColor = 'var(--risk-high-border)';
    setTimeout(() => {
      document.getElementById('ov-reason').style.borderColor = '';
    }, 1500);
    return;
  }

  const dataRisk    = document.getElementById('ov-data-risk').value;
  const intRisk     = document.getElementById('ov-int-risk').value;
  const techRisk    = document.getElementById('ov-tech-risk').value;
  const strategy    = document.getElementById('ov-strategy').value;
  const manDaysVal  = document.getElementById('ov-mandays').value;
  const role        = document.getElementById('ov-role').value;

  const slotOverrides = {};
  if (dataRisk) slotOverrides['Data_Risk'] = dataRisk;
  if (intRisk)  slotOverrides['Integration_Risk'] = intRisk;
  if (techRisk) slotOverrides['Tech_Literacy_Risk'] = techRisk;

  const calcOverrides = { strategy, primaryRole: role };
  if (manDaysVal) calcOverrides['estimatedManDays'] = parseInt(manDaysVal, 10);

  const reasons = {};
  for (const field of Object.keys(slotOverrides)) reasons[field] = reason;
  for (const field of Object.keys(calcOverrides)) reasons[field] = reason;

  const btn = document.getElementById('override-apply-btn');
  btn.disabled = true;
  btn.textContent = '⏳ Recalculating...';

  try {
    const data = await apiPost('/api/override', {
      sessionId:    state.sessionId,
      overriddenBy: 'Pre-sales',
      slotOverrides,
      calcOverrides,
      reasons,
    });

    state.priceBreakdown = data.breakdown;

    // Update slot tracker with effective slots
    if (data.effectiveSlots) {
      updateSlotTracker(data.effectiveSlots, Object.keys(data.effectiveSlots));
    }

    showPriceReport(data.breakdown, data.priceDelta);
    appendAuditLogs(data.overrideLogs);

    // Update override current-val labels
    document.getElementById('ov-strategy-cur').textContent = strategy;

    // Clear reason field
    document.getElementById('ov-reason').value = '';
  } catch (err) {
    console.error('[Override] Error:', err);
    alert(`Override failed: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>⚡</span> Apply Override & Recalculate';
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
  // Generate session
  state.sessionId = generateSessionId();
  document.getElementById('session-badge').textContent = state.sessionId;

  // Health check to get provider name
  checkHealth();

  // ── Event: Send button ──
  document.getElementById('send-btn').addEventListener('click', () => {
    const input = document.getElementById('user-input');
    const msg = input.value.trim();
    if (!msg || state.isWaiting) return;
    input.value = '';
    autoResize(input);
    sendChat(msg);
  });

  // ── Event: Enter key (Shift+Enter = newline) ──
  document.getElementById('user-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.getElementById('send-btn').click();
    }
  });

  // ── Event: Auto-resize textarea ──
  document.getElementById('user-input').addEventListener('input', (e) => {
    autoResize(e.target);
  });

  // ── Event: Override apply ──
  document.getElementById('override-apply-btn').addEventListener('click', applyOverride);

  // ── Event: Strategy select real-time update ──
  document.getElementById('ov-strategy').addEventListener('change', (e) => {
    document.getElementById('ov-strategy-cur').textContent = e.target.value;
  });

  console.log('[KHantix] App initialized. Session:', state.sessionId);
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
