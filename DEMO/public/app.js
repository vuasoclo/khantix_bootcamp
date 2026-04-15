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
  moduleCatalog: [],
  phase: 'pre_base',
  reportTab: 'base',
  baseReportData: null,
  negotiation: {
    analysis: null,
    intent: null,
    intentConfirmed: false,
    tierQuotes: null,
    cardsCatalog: [],
    selectedCardIds: [],
    lastOutcome: null,
  }
};

function setReportTab(tabName) {
  state.reportTab = tabName === 'three-tier' ? 'three-tier' : 'base';

  const tabBase = document.getElementById('report-tab-base');
  const tabThreeTier = document.getElementById('report-tab-three-tier');
  const baseContent = document.getElementById('base-report-content');
  const threeTierContent = document.getElementById('three-tier-report-content');

  const isBase = state.reportTab === 'base';

  if (tabBase) tabBase.classList.toggle('active', isBase);
  if (tabThreeTier) tabThreeTier.classList.toggle('active', !isBase);
  if (baseContent) baseContent.hidden = !isBase;
  if (threeTierContent) threeTierContent.hidden = isBase;
}

function setThreeTierAvailability(available) {
  const tabThreeTier = document.getElementById('report-tab-three-tier');
  const quoteSection = document.getElementById('phase3-quote-section');
  const emptyState = document.getElementById('three-tier-empty');

  if (tabThreeTier) tabThreeTier.disabled = !available;
  if (quoteSection) quoteSection.hidden = !available;
  if (emptyState) emptyState.hidden = !!available;
}

function setupReportTabs() {
  document.getElementById('report-tab-base')?.addEventListener('click', () => setReportTab('base'));
  document.getElementById('report-tab-three-tier')?.addEventListener('click', () => {
    const tab = document.getElementById('report-tab-three-tier');
    if (tab?.disabled) return;
    setReportTab('three-tier');
  });
}

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

function isCarryOverPlaceholderText(text) {
  if (!text || !String(text).trim()) return false;
  const s = String(text);
  return /carried\s+over\s+from\s+(the\s+)?(previous|prior)\s+state/i.test(s) ||
         /already\s+established\s+in\s+(the\s+)?project\s+scope/i.test(s);
}

function displayEvidenceText(text) {
  return isCarryOverPlaceholderText(text) ? '—' : (text || '—');
}

function displayReasoningText(text) {
  return isCarryOverPlaceholderText(text) ? '—' : (text || '—');
}

function uniq(items) {
  return [...new Set((items || []).filter(Boolean))];
}

function parseBudgetVnd(text) {
  if (!text || !String(text).trim()) return null;
  const normalized = String(text).toLowerCase();

  const parseRawNumber = (raw) => {
    const v = parseFloat(String(raw).replace(',', '.'));
    return Number.isNaN(v) ? null : v;
  };

  let m = normalized.match(/(\d+(?:[.,]\d+)?)\s*(tỷ|ty|tỉ|ti)\b/i);
  if (m) {
    const n = parseRawNumber(m[1]);
    if (n !== null) return Math.round(n * 1_000_000_000);
  }

  m = normalized.match(/(\d+(?:[.,]\d+)?)\s*(triệu|trieu|tr|m)\b/i);
  if (m) {
    const n = parseRawNumber(m[1]);
    if (n !== null) return Math.round(n * 1_000_000);
  }

  m = normalized.match(/\b(\d{7,12})\b/);
  if (m) {
    const n = parseInt(m[1], 10);
    return Number.isNaN(n) ? null : n;
  }

  return null;
}

function parseTierCandidate(text) {
  const s = String(text || '').toLowerCase();
  if (/premium|cao cấp|toàn diện|turn\s*-?\s*key/i.test(s)) return 'premium';
  if (/basic|mvp|cơ bản/i.test(s)) return 'basic';
  return 'standard';
}

function extractCapabilities(text) {
  const s = String(text || '').toLowerCase();
  const caps = [];

  if (/team\s*it|it nội bộ|it noi bo|đội\s*kỹ\s*thuật|doi\s*ky\s*thuat|in-house|dev\s*team|developer/i.test(s)) {
    caps.push('it_team');
  }
  if (/data\s*team|đội\s*data|doi\s*data|analyst|data\s*engineer|bi\s*team/i.test(s)) {
    caps.push('data_team');
  }
  if (/ops|hạ tầng|ha tang|infra/i.test(s)) {
    caps.push('infra_team');
  }

  return uniq(caps);
}

function badge(pass, yes = 'ĐẠT', no = 'KHÔNG ĐẠT') {
  return `<span class="guard-badge ${pass ? 'pass' : 'fail'}">${pass ? yes : no}</span>`;
}

function setPhase(nextPhase) {
  state.phase = nextPhase;

  const isBaseReady = nextPhase === 'base_ready' || nextPhase === 'negotiation_active';
  const startBtn = document.getElementById('btn-start-negotiation');
  const negotiationStep = document.getElementById('negotiation-step-container');
  const tabNeg = document.getElementById('tab-negotiation');

  if (startBtn) startBtn.hidden = !isBaseReady;
  if (tabNeg) tabNeg.disabled = !isBaseReady;

  if (negotiationStep) {
    negotiationStep.hidden = nextPhase !== 'negotiation_active';
  }

  if (nextPhase !== 'negotiation_active') {
    showEMTab();
  }
}

function showEMTab() {
  const emTab = document.getElementById('tab-em');
  const negTab = document.getElementById('tab-negotiation');
  const emProgress = document.getElementById('slot-progress-wrap');
  const emCards = document.getElementById('slot-cards');
  const negPanel = document.getElementById('negotiation-controls-panel');
  const panelTitle = document.querySelector('#slot-panel .panel-title');

  if (emTab) emTab.classList.add('active');
  if (negTab) negTab.classList.remove('active');
  if (emProgress) emProgress.hidden = false;
  if (emCards) emCards.hidden = false;
  if (negPanel) negPanel.hidden = true;
  if (panelTitle) panelTitle.innerHTML = '<span class="icon">🧠</span> Hệ số nỗ lực';
}

function showNegotiationTab() {
  const emTab = document.getElementById('tab-em');
  const negTab = document.getElementById('tab-negotiation');
  if (negTab?.disabled) return;

  const emProgress = document.getElementById('slot-progress-wrap');
  const emCards = document.getElementById('slot-cards');
  const negPanel = document.getElementById('negotiation-controls-panel');
  const panelTitle = document.querySelector('#slot-panel .panel-title');

  if (emTab) emTab.classList.remove('active');
  if (negTab) negTab.classList.add('active');
  if (emProgress) emProgress.hidden = true;
  if (emCards) emCards.hidden = true;
  if (negPanel) negPanel.hidden = false;
  if (panelTitle) panelTitle.innerHTML = '<span class="icon">🤝</span> Không gian đàm phán';
}

function setupSlotTabs() {
  const emTab = document.getElementById('tab-em');
  const negTab = document.getElementById('tab-negotiation');
  emTab?.addEventListener('click', showEMTab);
  negTab?.addEventListener('click', showNegotiationTab);
}

function buildLocalNegotiationAnalysis(transcript) {
  const parsedBudget = parseBudgetVnd(transcript);
  const budget = parsedBudget || 280_000_000;
  const tier = parseTierCandidate(transcript);
  const caps = extractCapabilities(transcript);
  const quote = String(transcript || '').trim().slice(0, 220);

  const suggestions = [];
  suggestions.push(`Xác nhận lại ngân sách ${formatVND(budget)} với khách trước khi chốt phương án.`);
  suggestions.push('Giải thích rõ: giảm giá đi kèm cắt scope hoặc chuyển trách nhiệm cho khách.');
  if (!caps.includes('it_team')) {
    suggestions.push('Khách chưa thể hiện có team IT nội bộ, hạn chế đề xuất card chuyển giao kỹ thuật.');
  }

  return {
    selectedTierCandidate: tier,
    clientBudgetVnd: budget,
    clientCapabilities: caps,
    confidence: caps.length > 0 ? 'high' : 'medium',
    evidenceQuotes: [quote || 'Bên em có thể cân trong khoảng 260 đến 300 triệu nếu giảm phần làm sạch dữ liệu và tinh gọn phạm vi tích hợp.'],
    suggestions,
  };
}

function createMockTierQuotesFromBudget(intent) {
  const budget = Number(intent?.clientBudgetVnd || 0);
  const anchor = budget > 0 ? Math.round(budget * 1.18) : 320_000_000;
  return createTierQuotes({ totalRecommendedPrice: anchor, baseCost: Math.round(anchor * 0.86) });
}

function ensureMockNegotiationDefaults() {
  if (!state.negotiation.analysis) {
    state.negotiation.analysis = {
      selectedTierCandidate: 'standard',
      clientBudgetVnd: 280_000_000,
      clientCurrentOfferVnd: 250_000_000,
      clientCapabilities: ['data_team'],
      confidence: 'medium',
      evidenceQuotes: ['Nếu có phương án tinh gọn phạm vi, bên anh có thể chốt mức 250 triệu trong quý này.'],
      suggestions: ['Ưu tiên giảm hạng mục làm sạch dữ liệu nâng cao và tinh gọn tích hợp realtime.'],
    };
  }
  if (!state.negotiation.intent) {
    state.negotiation.intent = {
      selectedTier: 'standard',
      clientBudgetVnd: 280_000_000,
      clientCapabilities: ['data_team'],
    };
  }
}

function normalizeNegotiationAnalyze(raw, transcript) {
  if (!raw) return buildLocalNegotiationAnalysis(transcript);
  const intent = raw.intentCandidates || raw.intent || raw;

  return {
    selectedTierCandidate:
      intent.selectedTier ||
      intent.selectedTierCandidate ||
      parseTierCandidate(transcript),
    clientBudgetVnd:
      intent.clientBudgetVnd ||
      intent.clientBudget ||
      parseBudgetVnd(transcript),
    clientCapabilities:
      intent.clientCapabilities ||
      extractCapabilities(transcript),
    confidence:
      raw.confidence ||
      intent.confidence ||
      'medium',
    evidenceQuotes:
      raw.evidence ||
      intent.evidenceQuotes ||
      intent.evidence ||
      [String(transcript || '').trim().slice(0, 220)],
    suggestions:
      raw.suggestions ||
      intent.suggestions ||
      buildLocalNegotiationAnalysis(transcript).suggestions,
  };
}

function updateNegotiationSuggestions(analysis) {
  const ul = document.getElementById('ai-negotiation-suggestions');
  const script = document.getElementById('sales-script-preview');
  if (!ul || !script) return;

  const tips = analysis?.suggestions || [];
  ul.innerHTML = tips.length
    ? tips.map((x) => `<li>${esc(x)}</li>`).join('')
    : '<li>Chưa có gợi ý đàm phán.</li>';

  const tierText = analysis?.selectedTierCandidate || 'standard';
  const budgetText = formatVND(Number(analysis?.clientBudgetVnd || 280_000_000));
  script.innerHTML = `
    <strong>Kịch bản mở đầu:</strong> Dạ em hiểu bên mình đang cân ngân sách quanh <strong>${esc(budgetText)}</strong> cho gói <strong>${esc(tierText)}</strong>.<br/>
    Em đề xuất mình đi theo hướng tối ưu phạm vi và trách nhiệm triển khai để giữ hiệu quả vận hành mà vẫn khớp ngân sách.
  `;
}

function renderIntentCandidates(analysis) {
  const tierEl = document.getElementById('neg-param-tier');
  const budgetEl = document.getElementById('neg-param-budget');
  const offerEl = document.getElementById('neg-param-current-offer');
  const confidenceEl = document.getElementById('neg-param-confidence');
  const evidenceEl = document.getElementById('neg-evidence-list');

  const tier = analysis?.selectedTierCandidate || 'standard';
  const budget = Number(analysis?.clientBudgetVnd || 280_000_000);
  const currentOffer = Number(analysis?.clientCurrentOfferVnd || Math.round(budget * 0.9));
  const confidence = analysis?.confidence || 'medium';
  const evidenceRows = (analysis?.evidenceQuotes && analysis.evidenceQuotes.length)
    ? analysis.evidenceQuotes
    : ['Nếu có phương án tinh gọn, bên anh có thể chốt quanh mức 250 triệu trong quý này.'];

  if (tierEl) tierEl.textContent = tier === 'basic' ? 'Cơ bản' : tier === 'premium' ? 'Nâng cao' : 'Tiêu chuẩn';
  if (budgetEl) budgetEl.textContent = formatVND(budget);
  if (offerEl) offerEl.textContent = formatVND(currentOffer);
  if (confidenceEl) confidenceEl.textContent = confidence;
  if (evidenceEl) {
    evidenceEl.innerHTML = evidenceRows.map((x) => `<li>${esc(x)}</li>`).join('');
  }

  const reportTier = document.getElementById('report-neg-tier');
  const reportBudget = document.getElementById('report-neg-budget');
  const reportOffer = document.getElementById('report-neg-offer');
  const reportEvidence = document.getElementById('report-neg-evidence');
  const phase3Analysis = document.getElementById('phase3-analysis-section');
  const threeTierEmpty = document.getElementById('three-tier-empty');

  if (reportTier) reportTier.textContent = tier === 'basic' ? 'Cơ bản' : tier === 'premium' ? 'Nâng cao' : 'Tiêu chuẩn';
  if (reportBudget) reportBudget.textContent = formatVND(budget);
  if (reportOffer) reportOffer.textContent = formatVND(currentOffer);
  if (reportEvidence) {
    reportEvidence.innerHTML = evidenceRows.map((x) => `<li>${esc(x)}</li>`).join('');
  }
  if (phase3Analysis) phase3Analysis.hidden = false;
  if (threeTierEmpty) threeTierEmpty.hidden = true;
}

function createTierQuotes(baseData) {
  const anchorPrice = Math.round(baseData?.totalRecommendedPrice || baseData?.baseCost || 0);
  const matchedModules = (baseData?.pricingEvidence?.matchedModules || [])
    .map((x) => x.module_id || x.moduleId)
    .filter(Boolean);

  const scopeSeed = matchedModules.length ? matchedModules.slice(0, 3) : ['Core CPQ Engine', 'Báo cáo cơ bản'];

  return {
    basic: {
      tier: 'basic',
      priceVnd: Math.round(anchorPrice * 0.85),
      scopeModules: [scopeSeed[0] || 'Core CPQ Engine'],
      clientResponsibilities: ['Khách tự làm sạch data theo template', 'Khách tự vận hành import/export'],
      vendorResponsibilities: ['Triển khai core workflow', 'Training 1 buổi online'],
      mandatoryClauses: ['Vendor không chịu trách nhiệm data rác đầu vào'],
    },
    standard: {
      tier: 'standard',
      priceVnd: Math.round(anchorPrice * 1.0),
      scopeModules: scopeSeed,
      clientResponsibilities: ['Khách chuẩn hóa dữ liệu theo form thống nhất'],
      vendorResponsibilities: ['Triển khai đầy đủ scope chuẩn', 'Hỗ trợ onboarding'],
      mandatoryClauses: ['Cam kết timeline bàn giao dữ liệu đầu vào'],
    },
    premium: {
      tier: 'premium',
      priceVnd: Math.round(anchorPrice * 1.2),
      scopeModules: uniq([...scopeSeed, 'Advanced Analytics']),
      clientResponsibilities: ['Bố trí đầu mối nghiệp vụ duyệt UAT'],
      vendorResponsibilities: ['Ôm full tích hợp và migration', 'SLA ưu tiên cao'],
      mandatoryClauses: ['SLA phản hồi và phạm vi hỗ trợ được ghi rõ phụ lục'],
    },
  };
}

function renderTierCard(cardId, data, selected) {
  const card = document.getElementById(cardId);
  if (!card || !data) return;

  card.classList.toggle('tier-selected', !!selected);
  const price = card.querySelector('.tier-price');
  if (price) price.textContent = formatVND(data.priceVnd || 0);

  const scopeEl = card.querySelector('[data-role="scope"]');
  const clientEl = card.querySelector('[data-role="client"]');
  const clauseEl = card.querySelector('[data-role="clause"]');

  if (scopeEl) scopeEl.innerHTML = (data.scopeModules || []).slice(0, 2).map((x) => `<li>• Phạm vi: ${esc(x)}</li>`).join('') || '<li>• Phạm vi: —</li>';
  if (clientEl) clientEl.innerHTML = (data.clientResponsibilities || []).slice(0, 2).map((x) => `<li>• Trách nhiệm khách hàng: ${esc(x)}</li>`).join('') || '<li>• Trách nhiệm khách hàng: —</li>';
  if (clauseEl) clauseEl.innerHTML = (data.mandatoryClauses || []).slice(0, 2).map((x) => `<li>• Điều khoản: ${esc(x)}</li>`).join('') || '<li>• Điều khoản: —</li>';
}

function renderTierQuotes(tiers, selectedTier) {
  if (!tiers) return;
  renderTierCard('quote-tier-basic', tiers.basic, selectedTier === 'basic');
  renderTierCard('quote-tier-standard', tiers.standard, selectedTier === 'standard');
  renderTierCard('quote-tier-premium', tiers.premium, selectedTier === 'premium');
}

function buildLocalTradeoffCatalog(selectedTierPrice) {
  return [
    {
      cardId: 'card-data-clean',
      title: 'Khách tự làm sạch dữ liệu theo template chuẩn',
      category: 'risk_transfer',
      estimatedSavingVnd: Math.round(selectedTierPrice * 0.12),
      valueImpactScore: 3,
      operationRiskScore: 8,
      requiresClientCapability: ['data_team'],
      mandatoryClauses: ['Khách phải bàn giao data sạch trước M1, trễ hạn tính phát sinh timeline.'],
    },
    {
      cardId: 'card-legacy-batch',
      title: 'Đổi tích hợp realtime sang batch file hằng ngày',
      category: 'risk_transfer',
      estimatedSavingVnd: Math.round(selectedTierPrice * 0.10),
      valueImpactScore: 4,
      operationRiskScore: 7,
      requiresClientCapability: ['it_team'],
      mandatoryClauses: ['Phạm vi tích hợp chỉ dừng ở import/export batch trong phase hiện tại.'],
    },
    {
      cardId: 'card-cut-analytics',
      title: 'Cắt module Analytics nâng cao ở phase hiện tại',
      category: 'scope_cut',
      estimatedSavingVnd: Math.round(selectedTierPrice * 0.08),
      valueImpactScore: 6,
      operationRiskScore: 3,
      requiresClientCapability: [],
      mandatoryClauses: ['Analytics nâng cao được tách sang phase tiếp theo nếu cần.'],
    },
    {
      cardId: 'card-sla-downgrade',
      title: 'Giảm SLA từ 24/7 về giờ hành chính',
      category: 'commercial_term',
      estimatedSavingVnd: Math.round(selectedTierPrice * 0.05),
      valueImpactScore: 2,
      operationRiskScore: 2,
      requiresClientCapability: [],
      mandatoryClauses: ['SLA hỗ trợ áp dụng theo giờ hành chính trong hợp đồng.'],
    },
  ];
}

function selectCardsForGap(cards, gap) {
  if (!cards?.length || gap <= 0) return [];
  const sorted = [...cards].sort((a, b) => b.estimatedSavingVnd - a.estimatedSavingVnd);
  const selected = [];
  let covered = 0;
  for (const card of sorted) {
    selected.push(card.cardId);
    covered += card.estimatedSavingVnd;
    if (covered >= gap) break;
  }
  return selected;
}

function renderTradeoffCards(cards, selectedIds) {
  const wrap = document.getElementById('negotiation-cards-list');
  const reportWrap = document.getElementById('report-adjustment-list');
  if (!wrap) return;
  if (!cards?.length) {
    wrap.innerHTML = '<div class="neg-empty">Không có trade-off cards.</div>';
    if (reportWrap) reportWrap.innerHTML = '<div class="neg-empty">Chưa có đề xuất điều chỉnh.</div>';
    return;
  }

  const selectedSet = new Set(selectedIds || []);
  wrap.innerHTML = cards.map((card) => {
    const reqCaps = (card.requiresClientCapability || []).join(', ') || 'Không yêu cầu';
    return `
      <label class="trade-card">
        <input type="checkbox" class="trade-card-toggle" data-card-id="${esc(card.cardId)}" ${selectedSet.has(card.cardId) ? 'checked' : ''} />
        <div class="trade-card-body">
          <div class="trade-card-title">${esc(card.title)}</div>
          <div class="trade-card-meta">
            <span>Tiết kiệm: <strong>${formatVND(card.estimatedSavingVnd)}</strong></span>
            <span>Ảnh hưởng: ${esc(card.valueImpactScore)}</span>
            <span>Rủi ro vận hành: ${esc(card.operationRiskScore)}</span>
          </div>
          <div class="trade-card-cap">Yêu cầu năng lực: ${esc(reqCaps)}</div>
        </div>
      </label>
    `;
  }).join('');

  if (reportWrap) {
    const evidence = (state.negotiation.analysis?.evidenceQuotes || [])[0];
    reportWrap.innerHTML = cards.map((card) => `
      <div class="report-adjustment-item">
        <strong>${esc(card.title)}</strong>
        <div class="meta">Điều chỉnh dự kiến: ${formatVND(card.estimatedSavingVnd)} | Ảnh hưởng: ${esc(card.valueImpactScore)} | Rủi ro vận hành: ${esc(card.operationRiskScore)}</div>
        <div class="meta">Lý do: Tối ưu phạm vi theo mức ngân sách hiện tại và năng lực triển khai của khách.</div>
        <div class="meta">Trích dẫn: ${evidence ? `"${esc(evidence)}"` : '"Bên em có thể linh hoạt nếu giữ mốc nghiệm thu và phạm vi tích hợp theo batch."'} </div>
      </div>
    `).join('');
  }
}

function evaluateNegotiationOutcome() {
  const intent = state.negotiation.intent;
  const tiers = state.negotiation.tierQuotes;
  const cardsCatalog = state.negotiation.cardsCatalog || [];

  if (!intent || !tiers || !tiers[intent.selectedTier]) return null;

  const selectedTierPrice = tiers[intent.selectedTier].priceVnd;
  const targetGapVnd = Math.max(0, selectedTierPrice - intent.clientBudgetVnd);
  const selectedSet = new Set(state.negotiation.selectedCardIds || []);
  const selectedCards = cardsCatalog.filter((x) => selectedSet.has(x.cardId));
  const coveredGapVnd = selectedCards.reduce((sum, x) => sum + (x.estimatedSavingVnd || 0), 0);
  const residualGapVnd = Math.max(0, targetGapVnd - coveredGapVnd);

  const matchedModules = (state.baseReportData?.pricingEvidence?.matchedModules || [])
    .map((x) => `${x.module_id || x.moduleId || ''}`.toLowerCase());
  const hasAnalyticsModule = matchedModules.some((x) => /analytic|dashboard|báo\s*cáo|bao\s*cao/i.test(x));

  let dependencyPass = true;
  const dependencyWarnings = [];
  if (selectedSet.has('card-cut-analytics') && !hasAnalyticsModule) {
    dependencyPass = false;
    dependencyWarnings.push('Card cắt Analytics đang được chọn nhưng scope hiện tại không có module Analytics để cắt.');
  }

  const capabilitySet = new Set(intent.clientCapabilities || []);
  let operationPass = true;
  const operationWarnings = [];
  for (const card of selectedCards) {
    const reqCaps = card.requiresClientCapability || [];
    const missing = reqCaps.filter((cap) => !capabilitySet.has(cap));
    if (missing.length > 0) {
      operationPass = false;
      operationWarnings.push(`${card.title}: thiếu capability ${missing.join(', ')}.`);
    }
  }

  const mandatoryClauses = uniq(selectedCards.flatMap((x) => x.mandatoryClauses || []));
  const riskTransferCount = selectedCards.filter((x) => x.category === 'risk_transfer').length;
  const contractPass = riskTransferCount === 0 || mandatoryClauses.length > 0;

  const pricingFloor = Math.round((state.baseReportData?.baseCost || 0) * 1.03);
  const postDiscountPrice = selectedTierPrice - coveredGapVnd;
  const pricingIntegrityPass = postDiscountPrice >= pricingFloor;

  const allGuardrailsPass = dependencyPass && operationPass && contractPass && pricingIntegrityPass;
  const warnings = [...dependencyWarnings, ...operationWarnings];

  return {
    selectedTierPrice,
    targetGapVnd,
    coveredGapVnd,
    residualGapVnd,
    selectedCards,
    mandatoryClauses,
    guardrails: {
      dependencyPass,
      operationPass,
      contractPass,
      pricingIntegrityPass,
      allGuardrailsPass,
    },
    warnings,
  };
}

function renderNegotiationChecklist(outcome) {
  const exportBtn = document.getElementById('btn-export-quotation');
  if (!exportBtn) return;
  exportBtn.disabled = !(outcome && state.negotiation.tierQuotes);
}

function refreshNegotiationUI() {
  const outcome = evaluateNegotiationOutcome();
  state.negotiation.lastOutcome = outcome;
  renderNegotiationChecklist(outcome);

  if (state.negotiation.tierQuotes && state.negotiation.intent?.selectedTier) {
    renderTierQuotes(state.negotiation.tierQuotes, state.negotiation.intent.selectedTier);
  }
}

async function submitNegotiationAnalyze() {
  const input = document.getElementById('negotiation-transcript-input');
  const btn = document.getElementById('btn-negotiation-analyze');
  const text = input?.value?.trim();
  if (!text) {
    updateStatus('Vui lòng nhập transcript đàm phán trước khi phân tích.', 'warning');
    return;
  }

  btn.disabled = true;
  btn.textContent = '⏳ Đang phân tích...';
  updateStatus('Đang phân tích transcript đàm phán...', 'working');

  try {
    const analysis = buildLocalNegotiationAnalysis(text);

    state.negotiation.analysis = analysis;
    state.negotiation.intent = {
      selectedTier: analysis.selectedTierCandidate || 'standard',
      clientBudgetVnd: Number(analysis.clientBudgetVnd) > 0 ? Number(analysis.clientBudgetVnd) : 0,
      clientCapabilities: analysis.clientCapabilities || [],
    };
    state.negotiation.intentConfirmed = true;
    renderIntentCandidates(analysis);
    updateNegotiationSuggestions(analysis);

    const mockAnchor = state.baseReportData?.totalRecommendedPrice
      || (state.negotiation.intent.clientBudgetVnd > 0 ? Math.round(state.negotiation.intent.clientBudgetVnd * 1.15) : 300_000_000);
    const mockCards = buildLocalTradeoffCatalog(mockAnchor);
    state.negotiation.cardsCatalog = mockCards;
    state.negotiation.selectedCardIds = [];
    renderTradeoffCards(mockCards, []);

    const recommendBtn = document.getElementById('btn-generate-recommendation');
    if (recommendBtn) recommendBtn.disabled = false;
    const reportTabThreeTier = document.getElementById('report-tab-three-tier');
    if (reportTabThreeTier) reportTabThreeTier.disabled = false;
    setReportTab('three-tier');
    renderNegotiationChecklist(null);
    updateStatus('Đã phân tích transcript và cập nhật tham số đàm phán. Nhấn "Tạo 3 báo giá" để sinh báo giá.', 'success');
  } catch (err) {
    updateStatus(`Lỗi phân tích đàm phán: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Phân tích Ý định đàm phán';
  }
}

async function generateNegotiationRecommendation() {
  ensureMockNegotiationDefaults();

  const btn = document.getElementById('btn-generate-recommendation');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Đang tạo...';
  }
  updateStatus('Đang tạo đề xuất điều chỉnh và 3 báo giá...', 'working');

  try {
    const intent = state.negotiation.intent;
    if (!state.negotiation.tierQuotes) {
      state.negotiation.tierQuotes = state.baseReportData
        ? createTierQuotes(state.baseReportData)
        : createMockTierQuotesFromBudget(intent);
    }

    const selectedTierPrice = state.negotiation.tierQuotes?.[intent.selectedTier]?.priceVnd || 0;
    const targetGap = Math.max(0, selectedTierPrice - intent.clientBudgetVnd);
    const cardsCatalog = buildLocalTradeoffCatalog(selectedTierPrice);
    const selectedCardIds = selectCardsForGap(cardsCatalog, targetGap);

    state.negotiation.cardsCatalog = cardsCatalog;
    state.negotiation.selectedCardIds = selectedCardIds;
    setThreeTierAvailability(!!state.negotiation.tierQuotes);
    if (state.negotiation.tierQuotes) {
      setReportTab('three-tier');
    }

    renderTradeoffCards(cardsCatalog, selectedCardIds);
    refreshNegotiationUI();

    updateStatus('Đã tạo đề xuất báo giá 3 gói từ nội dung đàm phán.', 'success');
  } catch (err) {
    updateStatus(`Lỗi tạo recommendation: ${err.message}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '⚙️ Tạo 3 báo giá';
    }
  }
}

function exportNegotiationQuotation() {
  const outcome = state.negotiation.lastOutcome;
  const tiers = state.negotiation.tierQuotes;
  const intent = state.negotiation.intent;
  if (!outcome || !tiers || !intent) {
    updateStatus('Chưa đủ dữ liệu để xuất báo giá.', 'warning');
    return;
  }

  const md = [
    '# KHantix - Báo giá giai đoạn 3',
    '',
    `- Mã phiên: ${state.sessionId}`,
    `- Gói đã chọn: ${intent.selectedTier}`,
    `- Ngân sách khách hàng: ${formatVND(intent.clientBudgetVnd)}`,
    `- Chênh lệch còn lại: ${formatVND(outcome.residualGapVnd)}`,
    '',
    '## Giá theo 3 gói',
    `- Cơ bản: ${formatVND(tiers.basic.priceVnd)}`,
    `- Tiêu chuẩn: ${formatVND(tiers.standard.priceVnd)}`,
    `- Nâng cao: ${formatVND(tiers.premium.priceVnd)}`,
    '',
    '## Phương án đánh đổi đã chọn',
    ...(outcome.selectedCards.length
      ? outcome.selectedCards.map((x) => `- ${x.title} (Tiết kiệm: ${formatVND(x.estimatedSavingVnd)})`)
      : ['- (không có)']),
    '',
    '## Điều khoản bắt buộc',
    ...(outcome.mandatoryClauses.length
      ? outcome.mandatoryClauses.map((x) => `- ${x}`)
      : ['- (không có)']),
    '',
    '## Nguyên tắc kiểm soát',
    `- Phụ thuộc kỹ thuật: ${outcome.guardrails.dependencyPass ? 'ĐẠT' : 'KHÔNG ĐẠT'}`,
    `- Khả năng vận hành: ${outcome.guardrails.operationPass ? 'ĐẠT' : 'KHÔNG ĐẠT'}`,
    `- Điều khoản hợp đồng: ${outcome.guardrails.contractPass ? 'ĐẠT' : 'KHÔNG ĐẠT'}`,
    `- Tính toàn vẹn định giá: ${outcome.guardrails.pricingIntegrityPass ? 'ĐẠT' : 'KHÔNG ĐẠT'}`,
  ].join('\n');

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `khantix-quotation-${state.sessionId}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  updateStatus('Đã xuất báo giá 3 tiers thành file markdown.', 'success');
}

function setupNegotiationInteractions() {
  document.getElementById('btn-start-negotiation')?.addEventListener('click', () => {
    setPhase('negotiation_active');
    showNegotiationTab();
    updateStatus('Đã chuyển sang giai đoạn đàm phán giá. Vui lòng dán transcript đàm phán.', 'info');
  });

  document.getElementById('btn-negotiation-analyze')?.addEventListener('click', submitNegotiationAnalyze);
  document.getElementById('btn-generate-recommendation')?.addEventListener('click', generateNegotiationRecommendation);
  document.getElementById('btn-export-quotation')?.addEventListener('click', exportNegotiationQuotation);

  document.getElementById('negotiation-cards-list')?.addEventListener('change', (e) => {
    if (!e.target.classList.contains('trade-card-toggle')) return;
    const cardId = e.target.dataset.cardId;
    const selected = new Set(state.negotiation.selectedCardIds || []);
    if (e.target.checked) {
      selected.add(cardId);
    } else {
      selected.delete(cardId);
    }
    state.negotiation.selectedCardIds = [...selected];
    refreshNegotiationUI();
  });
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
    
    document.getElementById('inp-concurrent-users').placeholder = `Dự kiến: ${Math.ceil(data.userCount.value * 0.1)}`;
    if (userCard.dataset.status !== 'confirmed') userCard.dataset.status = 'ai_pending';
  } else if (userCard) {
    userCard.dataset.status = 'empty';
    document.getElementById('users-value').textContent = '—';
    document.getElementById('users-conf').textContent = '';
    document.getElementById('users-evidence-text').textContent = '—';
    document.getElementById('users-reasoning-text').textContent = '—';
  }

  // ==== INFRASTRUCTURE VARIABLES ====
  const ccuCard = document.getElementById('slot-infra-concurrent');
  if (ccuCard && data.concurrent_users && data.concurrent_users.value !== null && data.concurrent_users.value !== undefined) {
    document.getElementById('concurrent_users-value').textContent = data.concurrent_users.value;
    document.getElementById('concurrent_users-conf').textContent = `${CONFIDENCE_BADGE[data.concurrent_users.confidence] || ''} ${data.concurrent_users.confidence || ''}`;
    document.getElementById('concurrent_users-evidence-text').textContent = displayEvidenceText(data.concurrent_users.evidence);
    document.getElementById('concurrent_users-reasoning-text').textContent = displayReasoningText(data.concurrent_users.reasoning);
    const inp = document.getElementById('inp-concurrent-users');
    if (inp) inp.value = data.concurrent_users.value;
    if (ccuCard.dataset.status !== 'confirmed') ccuCard.dataset.status = 'ai_pending';
  } else if (ccuCard) {
    document.getElementById('concurrent_users-value').textContent = '—';
    ccuCard.dataset.status = 'empty';
  }

  const storageCard = document.getElementById('slot-infra-storage');
  if (storageCard && data.expected_storage_gb && data.expected_storage_gb.value !== null && data.expected_storage_gb.value !== undefined) {
    document.getElementById('expected_storage_gb-value').textContent = `${data.expected_storage_gb.value} GB`;
    document.getElementById('expected_storage_gb-conf').textContent = `${CONFIDENCE_BADGE[data.expected_storage_gb.confidence] || ''} ${data.expected_storage_gb.confidence || ''}`;
    document.getElementById('expected_storage_gb-evidence-text').textContent = displayEvidenceText(data.expected_storage_gb.evidence);
    document.getElementById('expected_storage_gb-reasoning-text').textContent = displayReasoningText(data.expected_storage_gb.reasoning);
    const inp = document.getElementById('inp-storage-gb');
    if (inp) inp.value = data.expected_storage_gb.value;
    if (storageCard.dataset.status !== 'confirmed') storageCard.dataset.status = 'ai_pending';
  } else if (storageCard) {
    document.getElementById('expected_storage_gb-value').textContent = '—';
    storageCard.dataset.status = 'empty';
  }

  const haCard = document.getElementById('slot-infra-ha');
  if (haCard && data.requires_high_availability && data.requires_high_availability.value !== undefined) {
    document.getElementById('requires_high_availability-value').textContent = data.requires_high_availability.value ? 'Bật (x1.5 Cost)' : 'Tắt';
    document.getElementById('requires_high_availability-conf').textContent = `${CONFIDENCE_BADGE[data.requires_high_availability.confidence] || ''} ${data.requires_high_availability.confidence || ''}`;
    document.getElementById('requires_high_availability-evidence-text').textContent = displayEvidenceText(data.requires_high_availability.evidence);
    document.getElementById('requires_high_availability-reasoning-text').textContent = displayReasoningText(data.requires_high_availability.reasoning);
    const chk = document.getElementById('chk-high-availability');
    if (chk) chk.checked = data.requires_high_availability.value;
    if (haCard.dataset.status !== 'confirmed') haCard.dataset.status = 'ai_pending';
  } else if (haCard) {
    document.getElementById('requires_high_availability-value').textContent = '—';
    haCard.dataset.status = 'empty';
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
  setReportTab('base');

  // Hero: Recommended Price (adjusted for risk)
  document.getElementById('price-amount').textContent = formatVND(data.totalRecommendedPrice || data.baseCost);
  document.getElementById('price-note').textContent =
    `Giá đề xuất (đã tính rủi ro) | Giá cơ sở: ${formatVND(data.baseCost)}`;

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
    <p class="narrative-para" style="margin-top: 8px; color: var(--risk-medium);">Hệ số rủi ro gộp: <strong>×${data.compoundMultiplier.toFixed(3)}</strong> (${data.effectiveBufferPercent})</p>
  `;

  const formatComp = (comp) => {
    const value = typeof comp.value === 'number' && comp.value > 10 ? formatVND(comp.value) : esc(String(comp.value));
    return `<div class="cost-sub" style="border-left: 2px solid var(--border-card); padding-left: 8px; margin-top: 4px;"><strong>${esc(comp.name)}</strong>: ${value}<br><span style="color:#aaa">Lý do: ${esc(comp.reason || '—')}</span><br><span style="color:#5bc0de">Trích dẫn: ${esc(comp.citation || 'Config/fallback nội bộ')}</span></div>`;
  };

  const infraDetail = (data.infrastructureBreakdown || []).map(formatComp).join('');
  const licenseDetail = (data.licenseBreakdown || []).map(formatComp).join('');
  if (infraDetail || licenseDetail) {
    narrativeEl.innerHTML += `
      <div class="narrative-para" style="margin-top:10px;">
        <strong>Giải trình cấu phần Server:</strong>
        ${infraDetail || '<div class="cost-sub">—</div>'}
      </div>
      <div class="narrative-para" style="margin-top:10px;">
        <strong>Giải trình cấu phần License:</strong>
        ${licenseDetail || '<div class="cost-sub">—</div>'}
      </div>
    `;
  }

  // Cost items — filled EMs with REASONING HISTORY
  const costEl = document.getElementById('cost-items');
  if (data.filledEMs && data.filledEMs.length > 0) {
    costEl.innerHTML = data.filledEMs.map(em => {
      const historyHtml = (em.reasoningHistory || [])
        .map((r, i) => `<div class="cost-sub" style="border-left: 2px solid var(--border-card); padding-left: 8px; margin-top: 4px;">Lượt ${i+1}: ${esc(r)}</div>`)
        .join('');

      return `
        <div class="cost-row" style="flex-direction: column; align-items: flex-start; gap: 4px;">
          <div style="display: flex; justify-content: space-between; width: 100%;">
            <div class="cost-label">✅ ${esc(em.em_id)} — ${esc(em.name)}</div>
            <div class="cost-amount">×${em.value?.toFixed(2) || '—'} <span style="font-size:10px;">${CONFIDENCE_BADGE[em.confidence] || ''}</span></div>
          </div>
          <div class="history-block" style="width: 100%;">
            ${historyHtml || `<div class="cost-sub">${esc(em.reasoning || 'AI estimated')}</div>`}
            ${em.evidence ? `<div class="cost-sub" style="font-style:italic; color: #5bc0de; margin-top: 4px;">Nguồn: "${esc(em.evidence)}"</div>` : ''}
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
          <span class="risk-tag" style="background:rgba(255,107,107,0.2);color:#ff6b6b;">THIẾU DỮ LIỆU</span>
        </div>
        <div class="risk-why">Range: [${em.range[0]}, ${em.range[1]}] — Tạm tính = 1.0</div>
      </div>
    `).join('');
  } else {
    riskEl.innerHTML = '<p style="font-size:12px;color:var(--risk-low)">✅ Tất cả tham số đã được điền!</p>';
  }

  // Margin — hide for base report
  const marginEl = document.getElementById('margin-items');
  marginEl.innerHTML = '<p style="font-size:12px;color:var(--text-secondary)">Biên lợi nhuận và vùng đệm sẽ được tính ở giai đoạn chốt giá.</p>';

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
    document.getElementById('provider-name').textContent = 'MẤT KẾT NỐI';
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
    } else if (emId === 'concurrent_users') {
      const inp = card.querySelector('#inp-concurrent-users');
      newValue = inp ? parseInt(inp.value, 10) : null;
      reason = 'Pre-sales adjustment for infrastructure sizing';
    } else if (emId === 'expected_storage_gb') {
      const sel = card.querySelector('#sel-storage-preset');
      const inp = card.querySelector('#inp-storage-gb');
      if (sel && sel.value) inp.value = sel.value;
      newValue = inp ? parseFloat(inp.value) : null;
      reason = 'Pre-sales storage override';
    } else if (emId === 'requires_high_availability') {
      const chk = card.querySelector('#chk-high-availability');
      newValue = chk ? chk.checked : false;
      reason = 'Pre-sales infrastructure availability requirement';
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
  const concurrentUsers = document.getElementById('inp-concurrent-users')?.value;
  const storageGb = document.getElementById('inp-storage-gb')?.value;
  const hasHA = document.getElementById('chk-high-availability')?.checked;

  let query = `/api/base-report?sessionId=${encodeURIComponent(state.sessionId)}`;
  if (users) query += `&userCount=${users}`;
  if (concurrentUsers) query += `&concurrent_users=${encodeURIComponent(concurrentUsers)}`;
  if (storageGb) query += `&expected_storage_gb=${encodeURIComponent(storageGb)}`;
  if (hasHA !== undefined) query += `&requires_high_availability=${encodeURIComponent(String(hasHA))}`;

  btn.disabled = true;
  btn.textContent = '⏳ Đang tính toán...';
  updateStatus('Đang tổng hợp báo cáo giá cơ sở...', 'working');

  try {
    const data = await apiGet(query);
    state.baseReportData = data;
    state.negotiation.tierQuotes = null;
    showBaseReport(data);
    setThreeTierAvailability(false);
    setPhase('base_ready');
    renderNegotiationChecklist(null);
    updateStatus(`Giá cơ sở: ${formatVND(data.baseCost)} (${data.filledCount}/${data.filledCount + data.missingCount} EM đã điền)`, 'success');
  } catch (err) {
    updateStatus(`Lỗi: ${err.message}`, 'error');
  } finally {
    btn.textContent = '⚡ Tính giá cơ sở nhanh';
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

  setPhase('pre_base');

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
  setupSlotTabs();
  setupReportTabs();
  setupNegotiationInteractions();
  setThreeTierAvailability(false);
  setReportTab('base');
  renderNegotiationChecklist(null);
  ensureMockNegotiationDefaults();
  renderIntentCandidates(state.negotiation.analysis);
  renderTradeoffCards(buildLocalTradeoffCatalog(330_000_000), []);

  console.log('[KHantix] Copilot Edition initialized. Session:', state.sessionId);
}

document.addEventListener('DOMContentLoaded', init);
