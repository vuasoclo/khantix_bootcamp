"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmNegotiationPlaybook = exports.recommendNegotiation = exports.analyzeNegotiation = void 0;
const internal_configs_loader_1 = require("../config/internal-configs.loader");
const heuristic_v2_loader_1 = require("../config/heuristic-v2.loader");
const negotiation_cards_loader_1 = require("../config/negotiation-cards.loader");
const em_calculator_1 = require("../calculators/em.calculator");
const session_repository_1 = require("../repositories/session.repository");
const negotiation_advisor_service_1 = require("../services/negotiation-advisor.service");
const tier_pricing_service_1 = require("../services/tier-pricing.service");
const tradeoff_engine_service_1 = require("../services/tradeoff-engine.service");
const config = (0, internal_configs_loader_1.loadInternalConfigs)();
const { definitions: emDefinitionsMap } = (0, heuristic_v2_loader_1.loadHeuristicMatrixV2)();
const emDefinitionsArr = Array.from(emDefinitionsMap.values());
const advisorService = new negotiation_advisor_service_1.NegotiationAdvisorService();
const tierPricingService = new tier_pricing_service_1.TierPricingService();
const tradeoffEngineService = new tradeoff_engine_service_1.TradeoffEngineService();
function createAuditId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
function normalizeTier(rawTier) {
    const tier = String(rawTier || '').toLowerCase();
    if (tier === 'basic')
        return 'basic';
    if (tier === 'premium')
        return 'premium';
    return 'standard';
}
function unique(values) {
    const seen = new Set();
    const out = [];
    for (const value of values) {
        const normalized = value.trim();
        if (!normalized || seen.has(normalized))
            continue;
        seen.add(normalized);
        out.push(normalized);
    }
    return out;
}
function normalizeCapabilities(raw) {
    if (!Array.isArray(raw))
        return [];
    const allowed = new Set(['data_team', 'it_team', 'product_owner', 'qa_team', 'ops_team']);
    const normalized = raw
        .map((x) => String(x || '').toLowerCase().trim())
        .filter((x) => allowed.has(x));
    return unique(normalized);
}
function normalizeIntent(sessionId, raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    const clientBudgetVnd = Number(raw.clientBudgetVnd);
    if (!Number.isFinite(clientBudgetVnd) || clientBudgetVnd <= 0) {
        return null;
    }
    return {
        sessionId,
        selectedTier: normalizeTier(raw.selectedTier),
        clientBudgetVnd: Math.round(clientBudgetVnd),
        clientCapabilities: normalizeCapabilities(raw.clientCapabilities),
        confidence: raw.confidence === 'high' || raw.confidence === 'low' ? raw.confidence : 'medium',
        evidenceQuotes: Array.isArray(raw.evidenceQuotes)
            ? unique(raw.evidenceQuotes.map((x) => String(x || '').trim()).filter(Boolean))
            : [],
    };
}
function deriveCalculatorInput(serverSession) {
    const emSet = serverSession.session.emSet;
    const roleAllocationFromSession = emSet.roleAllocation
        ? {
            BA: Number(emSet.roleAllocation.BA?.value || 0),
            Senior: Number(emSet.roleAllocation.Senior?.value || 0),
            Junior: Number(emSet.roleAllocation.Junior?.value || 0),
            PM: Number(emSet.roleAllocation.PM?.value || 0),
        }
        : null;
    const roleAllocation = roleAllocationFromSession &&
        Number.isFinite(roleAllocationFromSession.BA) &&
        Number.isFinite(roleAllocationFromSession.Senior) &&
        Number.isFinite(roleAllocationFromSession.Junior) &&
        Number.isFinite(roleAllocationFromSession.PM)
        ? roleAllocationFromSession
        : {
            BA: 0,
            Senior: emSet.estimatedManDays ?? 60,
            Junior: 0,
            PM: 0,
        };
    const userCount = typeof emSet.userCount?.value === 'number' && emSet.userCount.value > 0
        ? emSet.userCount.value
        : 100;
    return {
        emSet,
        roleAllocation,
        userCount,
        emDefinitions: emDefinitionsMap,
    };
}
function getLastRecommendationLog(serverSession) {
    const logs = serverSession.negotiationLogs;
    for (let i = logs.length - 1; i >= 0; i -= 1) {
        if (logs[i].type === 'recommendation_generated') {
            return logs[i];
        }
    }
    return null;
}
const analyzeNegotiation = async (req, res) => {
    const { sessionId, transcript, targetTierHint } = req.body || {};
    if (!sessionId || !String(transcript || '').trim()) {
        return res.status(400).json({ error: 'sessionId and transcript are required' });
    }
    const serverSession = session_repository_1.sessionRepository.getOrCreate(sessionId, emDefinitionsArr);
    try {
        const analysis = await advisorService.analyzeIntent(String(transcript).trim(), targetTierHint);
        const auditEntry = {
            auditId: createAuditId('NEG-INTENT'),
            type: 'intent_analyzed',
            timestamp: new Date(),
            payload: {
                transcript: String(transcript).trim(),
                analysis,
            },
        };
        serverSession.negotiationLogs.push(auditEntry);
        session_repository_1.sessionRepository.set(sessionId, serverSession);
        return res.json({
            sessionId,
            intentCandidates: analysis,
            confidence: analysis.confidence,
            evidence: analysis.evidenceQuotes,
            suggestions: analysis.suggestions,
            requiresHumanConfirm: true,
            auditLogId: auditEntry.auditId,
        });
    }
    catch (err) {
        console.error(`[Negotiation][Analyze] ${sessionId}:`, err.message);
        return res.status(500).json({ error: 'Negotiation analyze failed', detail: err.message });
    }
};
exports.analyzeNegotiation = analyzeNegotiation;
const recommendNegotiation = (req, res) => {
    const { sessionId, confirmedIntent } = req.body || {};
    if (!sessionId || !confirmedIntent) {
        return res.status(400).json({ error: 'sessionId and confirmedIntent are required' });
    }
    const serverSession = session_repository_1.sessionRepository.get(sessionId);
    if (!serverSession) {
        return res.status(404).json({ error: `Session "${sessionId}" not found` });
    }
    const intent = normalizeIntent(sessionId, confirmedIntent);
    if (!intent) {
        return res.status(400).json({
            error: 'confirmedIntent must include selectedTier and clientBudgetVnd > 0',
        });
    }
    try {
        const calcInput = deriveCalculatorInput(serverSession);
        const calculation = (0, em_calculator_1.calculateWithEM)(calcInput, config);
        const matchedModuleIds = (serverSession.session.emSet.matchedModules || [])
            .map((x) => x.module_id)
            .filter(Boolean);
        const tierQuotes = tierPricingService.build({
            baseCostVnd: calculation._debug.baseCost,
            recommendedPriceVnd: calculation.recommendedPrice,
            matchedModuleIds,
        });
        const selectedTierQuote = tierQuotes[intent.selectedTier];
        const targetGapVnd = Math.max(0, selectedTierQuote.priceVnd - intent.clientBudgetVnd);
        const cardsCatalog = (0, negotiation_cards_loader_1.loadNegotiationCards)().map((card) => ({
            ...card,
            estimatedSavingVnd: card.estimatedSavingVnd > 0 && card.estimatedSavingVnd < 1
                ? Math.round(selectedTierQuote.priceVnd * card.estimatedSavingVnd)
                : Math.round(card.estimatedSavingVnd),
        }));
        const tradeoffRecommendations = tradeoffEngineService.recommend({
            targetGapVnd,
            selectedTierPriceVnd: selectedTierQuote.priceVnd,
            baseCostVnd: calculation._debug.baseCost,
            matchedModuleIds,
            clientCapabilities: intent.clientCapabilities,
            cardsCatalog,
            tierMandatoryClauses: selectedTierQuote.mandatoryClauses,
            maxRecommendations: 3,
        });
        const warningSet = new Set();
        for (const recommendation of tradeoffRecommendations) {
            for (const warning of recommendation.warnings) {
                warningSet.add(warning);
            }
        }
        const bestRecommendation = tradeoffRecommendations[0];
        const salesScriptDraft = advisorService.buildSalesScript(intent, selectedTierQuote, bestRecommendation);
        const auditEntry = {
            auditId: createAuditId('NEG-REC'),
            type: 'recommendation_generated',
            timestamp: new Date(),
            payload: {
                intent,
                tierQuotes,
                tradeoffRecommendations,
                salesScriptDraft,
            },
        };
        serverSession.negotiationLogs.push(auditEntry);
        session_repository_1.sessionRepository.set(sessionId, serverSession);
        return res.json({
            sessionId,
            tierQuotes,
            tradeoffRecommendations,
            warnings: Array.from(warningSet),
            salesScriptDraft,
            requiresHumanConfirm: true,
            auditLogId: auditEntry.auditId,
            pricingContext: {
                baseCostVnd: calculation._debug.baseCost,
                recommendedPriceVnd: calculation.recommendedPrice,
                selectedTierPriceVnd: selectedTierQuote.priceVnd,
                targetGapVnd,
            },
        });
    }
    catch (err) {
        console.error(`[Negotiation][Recommend] ${sessionId}:`, err.message);
        return res.status(500).json({ error: 'Negotiation recommendation failed', detail: err.message });
    }
};
exports.recommendNegotiation = recommendNegotiation;
const confirmNegotiationPlaybook = (req, res) => {
    const { sessionId, selectedRecommendationId, salesNotes } = req.body || {};
    if (!sessionId || !selectedRecommendationId) {
        return res.status(400).json({
            error: 'sessionId and selectedRecommendationId are required',
        });
    }
    const serverSession = session_repository_1.sessionRepository.get(sessionId);
    if (!serverSession) {
        return res.status(404).json({ error: `Session "${sessionId}" not found` });
    }
    const latestRecommendationLog = getLastRecommendationLog(serverSession);
    if (!latestRecommendationLog) {
        return res.status(400).json({
            error: 'No negotiation recommendation found. Please run /api/negotiation/recommend first.',
        });
    }
    const payload = latestRecommendationLog.payload;
    const recommendations = payload?.tradeoffRecommendations || [];
    const selectedRecommendation = recommendations.find((x) => x.recommendationId === selectedRecommendationId);
    if (!selectedRecommendation) {
        return res.status(404).json({
            error: `Recommendation "${selectedRecommendationId}" not found in latest recommendation set`,
        });
    }
    const finalPlaybook = {
        sessionId,
        selectedRecommendationId,
        intent: payload.intent,
        selectedCards: selectedRecommendation.selectedCards || [],
        mandatoryClauses: selectedRecommendation.mandatoryClauses || [],
        warnings: selectedRecommendation.warnings || [],
        salesScriptDraft: payload.salesScriptDraft || [],
        salesNotes: salesNotes ? String(salesNotes).trim() : '',
    };
    const auditEntry = {
        auditId: createAuditId('NEG-PLAYBOOK'),
        type: 'playbook_confirmed',
        timestamp: new Date(),
        payload: finalPlaybook,
    };
    serverSession.negotiationLogs.push(auditEntry);
    session_repository_1.sessionRepository.set(sessionId, serverSession);
    return res.json({
        success: true,
        auditLogId: auditEntry.auditId,
        playbook: finalPlaybook,
    });
};
exports.confirmNegotiationPlaybook = confirmNegotiationPlaybook;
