/**
 * KHantix AI CPQ — Client-side Application (COCOMO Edition)
 *
 * Manages:
 *  1. Session state (sessionId, effortMultipliers, conversation)
 *  2. API calls: /api/health, /api/chat, /api/calculate, /api/override
 *  3. UI: EM tracker updates, chat rendering, price report reveal
 *  4. Override Console: collects changes, sends to /api/override, re-renders
 */

'use strict';

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  sessionId: null,
  effortMultipliers: [],
  compoundMultiplier: 1.0,
  allSlotsFilled: false,
  priceBreakdown: null,
  originalPrice: null,
  isWaiting: false,
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function generateSessionId() {
  const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `KHX-${ts}-${rand}`;
}

function formatVND(n) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtPct(n) {
  return `${(n * 100).toFixed(1)}%`;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

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

// ─── UI: EM Tracker ───────────────────────────────────────────────────────────

const CONFIDENCE_BADGE = {
  high:   '🟢',
  medium: '🟡',
  low:    '🔴',
  null:   '',
};

function updateEMTracker(multipliers, filledCount, compoundMultiplier, effectiveBufferPercent) {
  for (const em of multipliers) {
    const card = document.getElementById(`slot-${em.em_id}`);
    if (!card) continue;

    const valueEl = card.querySelector('.slot-value');
    const confEl = card.querySelector('.slot-confidence');
    const wasEmpty = card.dataset.status === 'empty';

    if (em.value !== null && em.value !== undefined) {
      valueEl.textContent = `×${em.value.toFixed(2)}`;
      if (confEl) confEl.textContent = `${CONFIDENCE_BADGE[em.confidence] || ''} ${em.confidence || ''}`;
      card.dataset.status = 'filled';
      card.dataset.risk = em.confidence || 'medium';

      if (wasEmpty) {
        card.classList.add('filled');
        setTimeout(() => card.classList.remove('filled'), 500);
      }
    } else {
      valueEl.textContent = '—';
      if (confEl) confEl.textContent = '';
      card.dataset.status = 'empty';
      card.dataset.risk = 'null';
    }
  }

  // Update progress bar
  const total = 12;
  document.getElementById('progress-count').textContent = `${filledCount} / ${total}`;
  const pct = (filledCount / total) * 100;
  const fill = document.getElementById('progress-bar-fill');
  fill.style.width = `${pct}%`;
  fill.setAttribute('aria-valuenow', filledCount);

  // Update compound display
  const compoundEl = document.getElementById('compound-display');
  if (compoundEl) {
    compoundEl.textContent = `Compound: ×${compoundMultiplier.toFixed(3)} (${effectiveBufferPercent})`;
  }
}

// ─── UI: Price Report ─────────────────────────────────────────────────────────

function showPriceReport(breakdown) {
  document.getElementById('report-placeholder').style.display = 'none';
  document.getElementById('report-content').hidden = false;

  // Hero price
  document.getElementById('price-amount').textContent = formatVND(breakdown.recommendedPrice);
  document.getElementById('price-note').textContent = `COCOMO Compound Multiplier: ×${breakdown._debug?.compoundMultiplier?.toFixed(3) || '—'}`;

  // Price delta badge
  const deltaEl = document.getElementById('price-delta');
  deltaEl.className = '';

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

  document.getElementById('report-scroll').scrollTop = 0;
}

// ─── UI: Audit Log ────────────────────────────────────────────────────────────

function appendAuditLogs(logs) {
  if (!logs || logs.length === 0) return;

  const card = document.getElementById('audit-log-card');
  const container = document.getElementById('audit-log');
  card.hidden = false;

  const log = logs[logs.length - 1];
  const entry = document.createElement('div');
  entry.className = 'audit-entry';
  entry.innerHTML = `
    <div class="audit-field">${esc(log.field)}</div>
    <div class="audit-change">
      ${esc(String(log.originalValue ?? 'auto'))} → <strong>${esc(String(log.newValue))}</strong>
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
      `${data.provider} / ${data.version ?? 'default'}`;
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

    // Update state with COCOMO EM data
    state.effortMultipliers = data.effortMultipliers || [];
    state.compoundMultiplier = data.compoundMultiplier || 1.0;
    state.allSlotsFilled = data.allSlotsFilled;

    updateEMTracker(
      data.effortMultipliers || [],
      data.filledCount || 0,
      data.compoundMultiplier || 1.0,
      data.effectiveBufferPercent || '+0.0%'
    );

    // If all EMs are filled, auto-calculate
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
  const manDaysVal = document.getElementById('ov-mandays')?.value;
  const roleVal = document.getElementById('ov-role')?.value;

  const payload = {
    sessionId: state.sessionId,
    estimatedManDays: manDaysVal ? parseInt(manDaysVal, 10) : undefined,
    primaryRole: roleVal || 'Senior',
  };

  // Remove undefined values
  for (const key of Object.keys(payload)) {
    if (payload[key] === undefined) delete payload[key];
  }

  try {
    const data = await apiPost('/api/calculate', payload);
    state.priceBreakdown = data.breakdown;
    state.originalPrice = data.breakdown.recommendedPrice;
    showPriceReport(data.breakdown);
  } catch (err) {
    console.error('[Calculate] Error:', err);
    appendMessage('ai', '⚠️ Price calculation encountered an error. Please check the server.');
  }
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

  const manDaysVal = document.getElementById('ov-mandays').value;
  const role = document.getElementById('ov-role').value;

  const calcOverrides = { primaryRole: role };
  if (manDaysVal) calcOverrides['estimatedManDays'] = parseInt(manDaysVal, 10);

  const reasons = {};
  for (const field of Object.keys(calcOverrides)) reasons[field] = reason;

  const btn = document.getElementById('override-apply-btn');
  btn.disabled = true;
  btn.textContent = '⏳ Recalculating...';

  try {
    const data = await apiPost('/api/override', {
      sessionId: state.sessionId,
      overriddenBy: 'Pre-sales',
      calcOverrides,
      reasons,
    });

    state.priceBreakdown = data.breakdown;
    showPriceReport(data.breakdown);
    appendAuditLogs(data.overrideLogs);

    // Update EM tracker if server returns updated multipliers
    if (data.effortMultipliers) {
      const filled = data.effortMultipliers.filter(m => m.value !== null).length;
      updateEMTracker(data.effortMultipliers, filled, state.compoundMultiplier, '');
    }

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
  state.sessionId = generateSessionId();
  document.getElementById('session-badge').textContent = state.sessionId;

  checkHealth();

  document.getElementById('send-btn').addEventListener('click', () => {
    const input = document.getElementById('user-input');
    const msg = input.value.trim();
    if (!msg || state.isWaiting) return;
    input.value = '';
    autoResize(input);
    sendChat(msg);
  });

  document.getElementById('user-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.getElementById('send-btn').click();
    }
  });

  document.getElementById('user-input').addEventListener('input', (e) => {
    autoResize(e.target);
  });

  document.getElementById('override-apply-btn').addEventListener('click', applyOverride);

  console.log('[KHantix] COCOMO Edition initialized. Session:', state.sessionId);
}

document.addEventListener('DOMContentLoaded', init);
