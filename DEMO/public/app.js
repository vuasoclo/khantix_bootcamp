/**
 * KHantix AI CPQ — Pre-sales Copilot Edition
 *
 * Flow:
 *  1. Pre-sales loads a project profile (Bouncer gate)
 *  2. Pre-sales pastes conversation transcripts (Round 1, 2...)
 *  3. AI silently extracts EMs, shows suggestions
 *  4. Pre-sales can generate Base Price report at any time
 *  5. Override Console for manual EM adjustments
 */

'use strict';

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  sessionId: null,
  profileLoaded: false,
  effortMultipliers: [],
  compoundMultiplier: 1.0,
  allSlotsFilled: false,
  priceBreakdown: null,
  originalPrice: null,
  transcriptRound: 0,
  moduleCatalog: []
};

// ─── Utilities ────────────────────────────────────────────────────────────────

// Fetch module catalog
fetch('/api/modules')
  .then(res => res.json())
  .then(data => {
    state.moduleCatalog = data;
  });

function setupModuleEventListeners() {
  document.getElementById('btn-add-module')?.addEventListener('click', () => {
    if (!state.moduleCatalog || state.moduleCatalog.length === 0) return;
    const html = `
      <div class="module-edit-item" style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dotted rgba(255,255,255,0.1); display: flex; gap: 4px; align-items: stretch; flex-direction: column;">
        <select class="mod-select" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 4px; border-radius: 4px; font-size: 11px;">
          ${state.moduleCatalog.map(cat => `<option value="${cat.moduleId}">${cat.moduleId} - ${cat.moduleName}</option>`).join('')}
        </select>
        <div style="display: flex; gap: 4px; align-items: stretch;">
          <input type="text" class="mod-reason" placeholder="Lý do thêm (tuỳ chọn)..." style="flex:1; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 4px; border-radius: 4px; font-size: 11px;">
          <button class="btn-remove-mod" style="background: rgba(255,0,0,0.2); border: none; color: red; cursor: pointer; border-radius: 4px; padding: 4px 8px; font-size: 11px;">X</button>
        </div>
      </div>
    `;
    document.getElementById('modules-edit-list').insertAdjacentHTML('beforeend', html);
  });

  document.getElementById('modules-edit-list')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-remove-mod')) {
      e.target.closest('.module-edit-item').remove();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupModuleEventListeners();
});

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

// ─── API Helpers ──────────────────────────────────────────────────────────────

async function apiGet(path) {
  const res = await fetch(path);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.reason || `GET ${path} → ${res.status}`);
  }
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? data.reason ?? `POST ${path} → ${res.status}`);
  return data;
}

// ─── UI: EM Tracker ───────────────────────────────────────────────────────────

const CONFIDENCE_BADGE = {
  high: '🟢',
  medium: '🟡',
  low: '🔴',
  null: '',
};

function updateEMTracker(multipliers, filledCount, compoundMultiplier, effectiveBufferPercent) {
  for (const em of multipliers) {
    const card = document.getElementById(`slot-${em.em_id}`);
    if (!card) continue;

    const valueEl = card.querySelector('.slot-value');
    const confEl = card.querySelector('.slot-confidence');
    const evidenceEl = card.querySelector('.slot-evidence-text');
    const reasoningEl = card.querySelector('.slot-reasoning-text');
    const slider = card.querySelector('.slot-slider');
    const sliderVal = card.querySelector('.slot-slider-val');
    const wasEmpty = card.dataset.status === 'empty';

    if (em.value !== null && em.value !== undefined) {
      valueEl.textContent = `×${em.value.toFixed(2)}`;
      if (confEl) confEl.textContent = `${CONFIDENCE_BADGE[em.confidence] || ''} ${em.confidence || ''}`;
      
      // Set status from server (ai_pending / confirmed)
      const status = em.status || 'ai_pending';
      card.dataset.status = status;
      
      // Populate expand panel with history
      if (evidenceEl) evidenceEl.textContent = em.evidence || '— không có trích dẫn';
      if (reasoningEl) {
        if (em.reasoningHistory && em.reasoningHistory.length > 0) {
          reasoningEl.innerHTML = em.reasoningHistory
            .map((r, i) => `<div style="margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.05);"><strong>H${i+1}:</strong> ${esc(r)}</div>`)
            .join('');
        } else {
          reasoningEl.textContent = em.reasoning || '—';
        }
      }
      
      if (slider) {
        slider.value = em.value;
        if (sliderVal) sliderVal.textContent = em.value.toFixed(2);
      }

      if (wasEmpty) {
        card.classList.add('filled');
        setTimeout(() => card.classList.remove('filled'), 500);
      }
    } else {
      valueEl.textContent = '—';
      if (confEl) confEl.textContent = '';
      card.dataset.status = 'empty';
      card.classList.remove('expanded');
      if (evidenceEl) evidenceEl.textContent = '—';
      if (reasoningEl) reasoningEl.textContent = '—';
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

// ─── UI: Project Scoping ──────────────────────────────────────────────────────

function updateProjectScoping(data) {
  // Modules
  const modCard = document.getElementById('slot-scope-modules');
  if (modCard && data.matchedModules) {
    const valEl = document.getElementById('modules-value');
    const rsnEl = document.getElementById('modules-reasoning-text');
    if (data.matchedModules.length > 0) {
      valEl.textContent = `${data.matchedModules.length} Modules`;
      rsnEl.innerHTML = data.matchedModules.map(m => `<div style="margin-bottom:6px; padding-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.05);"><strong>${esc(m.module_id)}</strong>: ${esc(m.reasoning)}</div>`).join('');
      // Giữ lại 'confirmed' nếu trước đó đã có
      if (modCard.dataset.status !== 'confirmed') modCard.dataset.status = 'ai_pending';
    } else {
      valEl.textContent = 'None';
      rsnEl.textContent = '—';
      modCard.dataset.status = 'empty';
    }

    const editList = document.getElementById('modules-edit-list');
    if (editList && state.moduleCatalog) {
      editList.innerHTML = (data.matchedModules || []).map((m, idx) => `
        <div class="module-edit-item" style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dotted rgba(255,255,255,0.1); display: flex; gap: 4px; align-items: center;">
          <strong style="color: #5bc0de; width: 80px; font-size: 11px;">${esc(m.module_id)}</strong>
          <input type="hidden" class="mod-select" value="${esc(m.module_id)}">
          <input type="text" class="mod-reason" placeholder="Lý do..." value="${esc(m.reasoning || '')}" style="flex:1; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 4px; border-radius: 4px; font-size: 11px;">
          <button class="btn-remove-mod" style="background: rgba(255,0,0,0.2); border: none; color: red; cursor: pointer; border-radius: 4px; padding: 4px 8px; font-size: 11px;">X</button>
        </div>
      `).join('');
    }
  }

  // Roles
  const roleCard = document.getElementById('slot-scope-roles');
  if (roleCard && data.roleAllocation) {
    const rAlloc = data.roleAllocation;
    const valEl = document.getElementById('roles-value');
    const rsnEl = document.getElementById('roles-reasoning-text');
    
    let totalDays = 0;
    const rolesHtml = [];
    ['BA', 'PM', 'Senior', 'Junior'].forEach(r => {
      const slot = rAlloc[r];
      if (slot && slot.value) {
        totalDays += slot.value;
        rolesHtml.push(`<div style="margin-bottom:6px; padding-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.05);"><strong>${r}</strong>: ${slot.value} days<br><span style="color:#aaa;font-size:10px;">${esc(slot.reasoning)}</span></div>`);
      }
      
      const inp = document.getElementById(`inp-role-${r.toLowerCase()}`);
      if (inp) inp.value = slot?.value || 0;
    });

    if (totalDays > 0) {
      valEl.textContent = `${totalDays} MDs`;
      rsnEl.innerHTML = rolesHtml.join('');
      if (roleCard.dataset.status !== 'confirmed') roleCard.dataset.status = 'ai_pending';
    } else {
      valEl.textContent = '—';
      rsnEl.textContent = '—';
      roleCard.dataset.status = 'empty';
    }
  }

  // Users
  const userCard = document.getElementById('slot-scope-users');
  if (userCard && data.userCount && data.userCount.value) {
    document.getElementById('users-value').textContent = data.userCount.value;
    document.getElementById('users-conf').textContent = `${CONFIDENCE_BADGE[data.userCount.confidence] || ''} ${data.userCount.confidence || ''}`;
    document.getElementById('users-evidence-text').textContent = data.userCount.evidence || '—';
    document.getElementById('users-reasoning-text').textContent = data.userCount.reasoning || '—';
    const inp = document.getElementById('inp-usercount');
    if (inp) inp.value = data.userCount.value;
    if (userCard.dataset.status !== 'confirmed') userCard.dataset.status = 'ai_pending';
  } else if (userCard) {
    userCard.dataset.status = 'empty';
    document.getElementById('users-value').textContent = '—';
    document.getElementById('users-conf').textContent = '';
    document.getElementById('users-evidence-text').textContent = '—';
    document.getElementById('users-reasoning-text').textContent = '—';
  }

  checkScopingComplete();
}

function checkScopingComplete() {
  const modulesCard = document.getElementById('slot-scope-modules');
  const rolesCard = document.getElementById('slot-scope-roles');
  const usersCard = document.getElementById('slot-scope-users');
  
  const m = modulesCard?.dataset.status;
  const r = rolesCard?.dataset.status;
  const u = usersCard?.dataset.status;

  const isComplete = (m === 'ai_pending' || m === 'confirmed') &&
                     (r === 'ai_pending' || r === 'confirmed') &&
                     (u === 'ai_pending' || u === 'confirmed');

  const btn = document.getElementById('btn-base-price');
  if (btn) {
    if (isComplete) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.textContent = '⚡ Tính Base Price Nhanh';
    } else {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.textContent = '🔒 Project Scoping chưa hoàn tất';
    }
  }
}

// ─── UI: Suggestions ──────────────────────────────────────────────────────────

function updateSuggestions(suggestions) {
  const ul = document.getElementById('ai-suggestions');
  if (!ul) return;

  if (!suggestions || suggestions.length === 0) {
    ul.innerHTML = '<li style="color: var(--risk-low);">✅ Không còn câu hỏi cần hỏi thêm.</li>';
    return;
  }

  ul.innerHTML = suggestions
    .map(s => `<li>${esc(s)}</li>`)
    .join('');
}

// ─── UI: Status Log ───────────────────────────────────────────────────────────

function updateStatus(message, type = 'info') {
  const bar = document.getElementById('inline-status-bar');
  const icon = document.getElementById('inline-status-icon');
  const text = document.getElementById('inline-status-text');
  
  if (!bar) return;

  const config = {
    info: { icon: '⚪', color: 'var(--text-muted)' },
    working: { icon: '⏳', color: '#5bc0de' },
    success: { icon: '✅', color: 'var(--risk-low)' },
    error: { icon: '⚠️', color: 'var(--risk-high)' },
    warning: { icon: '💡', color: '#f0ad4e' },
  };

  const curr = config[type] || config.info;
  icon.textContent = curr.icon;
  text.textContent = message;
  text.style.color = curr.color;
  
  // Flash effect
  bar.style.backgroundColor = 'rgba(255,255,255,0.05)';
  setTimeout(() => {
    bar.style.backgroundColor = 'rgba(0,0,0,0.4)';
  }, 200);
}

// ─── UI: Base Report ──────────────────────────────────────────────────────────

function showBaseReport(data) {
  document.getElementById('report-placeholder').style.display = 'none';
  document.getElementById('report-content').hidden = false;

  // Hero: Recommended Price (adjusted for risk)
  document.getElementById('price-amount').textContent = formatVND(data.totalRecommendedPrice || data.baseCost);
  document.getElementById('price-note').textContent =
    `Recommended Price (Đã tính rủi ro) | Base: ${formatVND(data.baseCost)}`;

  // Delta badge
  const deltaEl = document.getElementById('price-delta');
  deltaEl.className = '';
  deltaEl.textContent = '';

  // Narrative — show labor/server/license breakdown
  const narrativeEl = document.getElementById('narrative-list');
  let roleBreakdown = '';
  if (data.roleAllocation) {
    const roles = Object.entries(data.roleAllocation)
      .filter(([r, days]) => days > 0)
      .map(([r, days]) => `${r}: ${days}d`)
      .join(', ');
    roleBreakdown = `(${data.estimatedManDays} ngày: ${roles})`;
  } else {
    roleBreakdown = `(${data.estimatedManDays} ngày)`;
  }

  narrativeEl.innerHTML = `
    <p class="narrative-para">Chi phí Nhân công: <strong>${formatVND(data.laborCost)}</strong> <span style="font-size:12px; color:var(--text-secondary)">${roleBreakdown}</span></p>
    <p class="narrative-para">Chi phí Server: <strong>${formatVND(data.serverCost)}</strong></p>
    <p class="narrative-para">Chi phí License: <strong>${formatVND(data.licenseCost)}</strong></p>
    <p class="narrative-para" style="margin-top: 8px; color: var(--risk-medium);">Compound Risk Multiplier: <strong>×${data.compoundMultiplier.toFixed(3)}</strong> (${data.effectiveBufferPercent})</p>
  `;

  // Cost items — filled EMs with REASONING HISTORY
  const costEl = document.getElementById('cost-items');
  if (data.filledEMs && data.filledEMs.length > 0) {
    costEl.innerHTML = data.filledEMs.map(em => {
      const historyHtml = (em.reasoningHistory || [])
        .map((r, i) => `<div class="cost-sub" style="border-left: 2px solid var(--border-card); padding-left: 8px; margin-top: 4px;">Turn ${i+1}: ${esc(r)}</div>`)
        .join('');

      return `
        <div class="cost-row" style="flex-direction: column; align-items: flex-start; gap: 4px;">
          <div style="display: flex; justify-content: space-between; width: 100%;">
            <div class="cost-label">✅ ${esc(em.em_id)} — ${esc(em.name)}</div>
            <div class="cost-amount">×${em.value?.toFixed(2) || '—'} <span style="font-size:10px;">${CONFIDENCE_BADGE[em.confidence] || ''}</span></div>
          </div>
          <div class="history-block" style="width: 100%;">
            ${historyHtml || `<div class="cost-sub">${esc(em.reasoning || 'AI estimated')}</div>`}
            ${em.evidence ? `<div class="cost-sub" style="font-style:italic; color: #5bc0de; margin-top: 4px;">Source: "${esc(em.evidence)}"</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  } else {
    costEl.innerHTML = '<p style="font-size:12px;color:var(--text-secondary)">Chưa có tham số nào được điền.</p>';
  }

  // Risk items — missing EMs
  const riskEl = document.getElementById('risk-items');
  if (data.missingEMs && data.missingEMs.length > 0) {
    riskEl.innerHTML = data.missingEMs.map(em => `
      <div class="risk-row">
        <div class="risk-row-header">
          <span class="risk-dimension">❌ ${esc(em.em_id)} — ${esc(em.name)}</span>
          <span class="risk-tag" style="background:rgba(255,107,107,0.2);color:#ff6b6b;">MISSING</span>
        </div>
        <div class="risk-why">Range: [${em.range[0]}, ${em.range[1]}] — Tạm tính = 1.0</div>
      </div>
    `).join('');
  } else {
    riskEl.innerHTML = '<p style="font-size:12px;color:var(--risk-low)">✅ Tất cả tham số đã được điền!</p>';
  }

  // Margin — hide for base report
  const marginEl = document.getElementById('margin-items');
  marginEl.innerHTML = '<p style="font-size:12px;color:var(--text-secondary)">Margin/Buffer sẽ được tính ở giai đoạn Finalize Price.</p>';

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

// ─── API: Profile (Bouncer) ───────────────────────────────────────────────────

async function submitProfile() {
  const input = document.getElementById('profile-input');
  const btn = document.getElementById('btn-profile');
  const text = input.value.trim();

  if (!text) {
    input.style.borderColor = '#ff6b6b';
    setTimeout(() => { input.style.borderColor = ''; }, 1500);
    return;
  }

  btn.disabled = true;
  btn.textContent = '⏳ Đang phân tích...';
  updateStatus('Đang nạp hồ sơ và kiểm tra Bouncer...', 'working');

  try {
    const data = await apiPost('/api/profile', {
      sessionId: state.sessionId,
      projectContext: text,
    });

    if (data.rejected) {
      updateStatus(`TỪ CHỐI: ${data.reason}`, 'error');
      btn.textContent = '⛔ Bị từ chối — Nhập lại';
      btn.disabled = false;
      return;
    }

    // Success
    state.sessionId = data.sessionId || state.sessionId;
    state.profileLoaded = true;
    state.effortMultipliers = data.effortMultipliers || [];

    updateEMTracker(
      data.effortMultipliers || [],
      data.filledCount || 0,
      1.0,
      '+0.0%'
    );
    updateProjectScoping(data);
    updateSuggestions(data.suggestions);

    updateStatus(`✅ Hồ sơ hợp lệ. Pre-filled ${data.filledCount}/12 EMs. ManDays: ${data.estimatedManDays || 'N/A'}`, 'success');

    btn.textContent = '✅ Đã nạp hồ sơ';
    btn.disabled = true;
    
    // UI Transitions (Wizard)
    document.getElementById('step-0-container').style.opacity = '0.5';
    document.getElementById('profile-input').disabled = true;
    document.getElementById('btn-upload-profile').style.display = 'none';
    
    // Reveal next step
    const step1 = document.getElementById('step-1-container');
    step1.style.display = 'flex';
    setTimeout(() => {
      document.getElementById('transcript-input').focus();
    }, 100);

  } catch (err) {
    updateStatus(`Lỗi: ${err.message}`, 'error');
    btn.textContent = 'Nạp Hồ Sơ & Kiểm tra';
    btn.disabled = false;
  }
}

// ─── API: Analyze Transcript ──────────────────────────────────────────────────

async function submitTranscript() {
  const input = document.getElementById('transcript-input');
  const btn = document.getElementById('btn-transcript');
  const text = input.value.trim();

  if (!text) {
    input.style.borderColor = '#ff6b6b';
    setTimeout(() => { input.style.borderColor = ''; }, 1500);
    return;
  }

  state.transcriptRound++;
  btn.disabled = true;
  btn.textContent = `⏳ Đang phân tích...`;
  
  // UI update for round
  document.getElementById('round-counter').textContent = state.transcriptRound;
  updateStatus(`Đang bóc tách transcript hiệp ${state.transcriptRound}...`, 'working');

  try {
    const data = await apiPost('/api/analyze-transcript', {
      sessionId: state.sessionId,
      transcript: text,
    });

    // Update state
    state.effortMultipliers = data.effortMultipliers || [];
    state.compoundMultiplier = data.compoundMultiplier || 1.0;
    state.allSlotsFilled = data.allSlotsFilled;

    updateEMTracker(
      data.effortMultipliers || [],
      data.filledCount || 0,
      data.compoundMultiplier || 1.0,
      data.effectiveBufferPercent || '+0.0%'
    );
    updateProjectScoping(data);
    updateSuggestions(data.suggestions);

    updateStatus(`Hoàn tất hiệp ${state.transcriptRound}: ${data.filledCount}/12 EMs đã điền`, 'success');

    if (data.allSlotsFilled) {
      updateStatus('🎉 Đã đủ 12 tham số! Thông tin đã sẵn sàng để tạo báo cáo chốt giá.', 'success');
    }

    // Clear transcript for next round
    input.value = '';
    
  } catch (err) {
    updateStatus(`Lỗi phân tích: ${err.message}`, 'error');
  } finally {
    btn.textContent = 'Phân tích Transcript';
    btn.disabled = false;
    document.getElementById('round-counter').textContent = state.transcriptRound + 1;
  }
}

// ─── Inline Confirm/Adjust EM ─────────────────────────────────────────────────────

async function confirmEM(emId, action, newValue = null, reason = '') {
  updateStatus(`Đang xác nhận ${emId}...`, 'working');
  try {
    const data = await apiPost('/api/confirm-em', {
      sessionId: state.sessionId,
      em_id: emId,
      action,       // 'confirm' | 'adjust'
      newValue,
      reason,
    });

    if (data.effortMultipliers) {
      updateEMTracker(
        data.effortMultipliers,
        data.filledCount || data.effortMultipliers.filter(m => m.value !== null).length,
        data.compoundMultiplier || 1.0,
        data.effectiveBufferPercent || '+0.0%'
      );
      updateProjectScoping(data);
    }

    // Collapse card after confirm
    const cardId = `slot-${emId}`;
    const cardScopeId = `slot-scope-${emId.replace('Allocation', 's').replace('matched', '').replace('userCount', 'users').replace('role', 'roles').toLowerCase()}`;
    const card = document.getElementById(cardId) || document.getElementById(cardScopeId) || document.querySelector(`[data-scope="${emId}"]`);
    if (card) {
       card.classList.remove('expanded');
       card.dataset.status = 'confirmed';
    }

    checkScopingComplete();

    updateStatus(`${emId} đã ${action === 'confirm' ? 'xác nhận' : 'điều chỉnh'} thành công.`, 'success');
  } catch (err) {
    updateStatus(`Lỗi ${emId}: ${err.message}`, 'error');
  }
}

function setupCardInteractions() {
  const container = document.getElementById('slot-cards');
  if (!container) return;

  // Click header to toggle expand
  container.addEventListener('click', (e) => {
    // Ignore clicks inside the expand panel completely so it doesn't accidentally close
    if (e.target.closest('.slot-expand-panel')) return;

    const header = e.target.closest('.slot-card-header');
    if (!header) return;

    const card = header.closest('.slot-card');
    if (!card) return;

    // Only expand cards that have a value
    if (card.dataset.status === 'empty') return;

    // Toggle — close others first
    const wasExpanded = card.classList.contains('expanded');
    container.querySelectorAll('.slot-card.expanded').forEach(c => c.classList.remove('expanded'));
    if (!wasExpanded) card.classList.add('expanded');
  });

  // Slider live preview
  container.addEventListener('input', (e) => {
    if (!e.target.classList.contains('slot-slider')) return;
    const card = e.target.closest('.slot-card');
    if (!card) return;
    const valDisplay = card.querySelector('.slot-slider-val');
    if (valDisplay) valDisplay.textContent = parseFloat(e.target.value).toFixed(2);
  });

  // Confirm button
  container.addEventListener('click', (e) => {
    if (!e.target.classList.contains('btn-confirm-em')) return;
    const card = e.target.closest('.slot-card');
    if (!card) return;
    const emId = card.dataset.em || card.dataset.scope;
    confirmEM(emId, 'confirm');
  });

  // Adjust button
  container.addEventListener('click', (e) => {
    if (!e.target.classList.contains('btn-adjust-em')) return;
    const card = e.target.closest('.slot-card');
    if (!card) return;
    const emId = card.dataset.em || card.dataset.scope;
    
    let newValue = null;
    let reason = '';
    
    if (emId === 'userCount') {
      const inp = card.querySelector('#inp-usercount');
      newValue = inp ? parseInt(inp.value, 10) : null;
      reason = 'Pre-sales adjustment for internal norms';
    } else if (emId === 'roleAllocation') {
      const sr = card.querySelector('#inp-role-senior');
      const jr = card.querySelector('#inp-role-junior');
      const ba = card.querySelector('#inp-role-ba');
      const pm = card.querySelector('#inp-role-pm');
      newValue = {
        Senior: sr ? parseInt(sr.value,10) : 0,
        Junior: jr ? parseInt(jr.value,10) : 0,
        BA: ba ? parseInt(ba.value,10) : 0,
        PM: pm ? parseInt(pm.value,10) : 0
      };
      reason = 'Pre-sales manual distribution';
    } else if (emId === 'matchedModules') {
      const items = Array.from(card.querySelectorAll('.module-edit-item'));
      newValue = items.map(el => {
        const sel = el.querySelector('.mod-select');
        const inp = el.querySelector('.mod-reason');
        return {
          module_id: sel ? sel.value : '',
          reasoning: inp ? inp.value : ''
        };
      }).filter(m => m.module_id);
      reason = 'Pre-sales manual modules update';
    } else {
      const slider = card.querySelector('.slot-slider');
      const reasonInput = card.querySelector('.slot-reason-input');
      newValue = slider ? parseFloat(slider.value) : null;
      reason = reasonInput ? reasonInput.value.trim() : '';
    }
    
    confirmEM(emId, 'adjust', newValue, reason);
  });
}

// ─── API: Base Report ─────────────────────────────────────────────────────────

async function generateBaseReport() {
  const btn = document.getElementById('btn-base-price');
  
  // Collect overrides
  const users = document.getElementById('inp-usercount').value;

  let query = `/api/base-report?sessionId=${encodeURIComponent(state.sessionId)}`;
  if (users) query += `&userCount=${users}`;

  btn.disabled = true;
  btn.textContent = '⏳ Đang tính toán...';
  updateStatus('Đang tổng hợp báo cáo Base Price...', 'working');

  try {
    const data = await apiGet(query);
    showBaseReport(data);
    updateStatus(`Base Price: ${formatVND(data.baseCost)} (${data.filledCount}/${data.filledCount + data.missingCount} EMs)`, 'success');
  } catch (err) {
    updateStatus(`Lỗi: ${err.message}`, 'error');
  } finally {
    btn.textContent = '⚡ Tính Base Price Nhanh';
    btn.disabled = false;
  }
}

// ─── File Upload Helpers ──────────────────────────────────────────────────────

function setupFileUpload(btnId, inputId, textareaId) {
  const btn = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  const textarea = document.getElementById(textareaId);
  
  if (!btn || !input || !textarea) return;

  btn.addEventListener('click', () => {
    input.click();
  });

  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      textarea.value = evt.target.result;
      updateStatus(`Đã upload file: ${file.name}`, 'info');
      // Reset input so the same file could be picked again if needed
      input.value = '';
    };
    reader.onerror = () => {
      updateStatus('Không thể đọc file', 'error');
    };
    reader.readAsText(file);
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
  state.sessionId = generateSessionId();
  document.getElementById('session-badge').textContent = state.sessionId;

  checkHealth();

  // Profile button
  document.getElementById('btn-profile').addEventListener('click', submitProfile);

  // Transcript button
  document.getElementById('btn-transcript').addEventListener('click', submitTranscript);

  // Base Price button
  document.getElementById('btn-base-price').addEventListener('click', generateBaseReport);

  // Setup File Uploaders
  setupFileUpload('btn-upload-profile', 'profile-file-upload', 'profile-input');
  setupFileUpload('btn-upload-transcript', 'transcript-file-upload', 'transcript-input');

  // Setup EM card click-to-expand + confirm/adjust
  setupCardInteractions();

  console.log('[KHantix] Copilot Edition initialized. Session:', state.sessionId);
}

document.addEventListener('DOMContentLoaded', init);
