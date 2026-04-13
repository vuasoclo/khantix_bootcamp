"use strict";
/**
 * KHantix AI CPQ — Express API Server (Copilot Edition)
 *
 * Routes:
 *   GET  /api/health              — Config summary & active sessions
 *   POST /api/profile             — Bouncer: validate project profile, pre-fill EMs
 *   POST /api/analyze-transcript  — Analyze conversation transcript, extract EMs
 *   GET  /api/base-report         — On-demand Base Price report (any time)
 *   POST /api/calculate           — Run full COCOMO Calculator on current EM set
 *   POST /api/override            — Apply Pre-sales EM overrides, log audit, recalculate
 *
 * Static files served from /public (index.html, style.css, app.js).
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const internal_configs_loader_1 = require("./config/internal-configs.loader");
const investigator_service_1 = require("./services/investigator.service");
const em_calculator_1 = require("./calculators/em.calculator");
const llm_adapter_1 = require("./llm/llm-adapter");
const heuristic_v2_loader_1 = require("./config/heuristic-v2.loader");
// ─── Startup ──────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '3000', 10);
console.log('\n╔══════════════════════════════════════════════════╗');
console.log('║   KHantix AI CPQ — COCOMO Edition Starting       ║');
console.log('╚══════════════════════════════════════════════════╝\n');
const config = (0, internal_configs_loader_1.loadInternalConfigs)();
const { definitions: emDefinitionsMap } = (0, heuristic_v2_loader_1.loadHeuristicMatrixV2)();
const emDefinitionsArr = Array.from(emDefinitionsMap.values());
console.log(`✅ Internal config loaded  (Net margin: ${(config.Margin_NetProfit * 100).toFixed(1)}%)`);
console.log(`✅ Heuristic Matrix V2 loaded (${emDefinitionsArr.length} EM parameters)`);
let callLlm;
try {
    callLlm = (0, llm_adapter_1.createLlmCaller)();
}
catch (err) {
    console.error(`\n❌ LLM provider init failed: ${err.message}`);
    console.error('   → Copy .env.example to .env and fill in your API key.\n');
    process.exit(1);
}
// ─── In-memory session store ──────────────────────────────────────────────────
const sessions = new Map();
function getOrCreateSession(sessionId) {
    if (!sessions.has(sessionId)) {
        const investigator = new investigator_service_1.InvestigatorService();
        const session = investigator.createSession(sessionId, emDefinitionsArr);
        sessions.set(sessionId, {
            session,
            investigator,
            overrideLogs: [],
            createdAt: new Date(),
        });
        console.log(`[Session] Created: ${sessionId}`);
    }
    return sessions.get(sessionId);
}
// ─── Express setup ────────────────────────────────────────────────────────────
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// ─── Route: Health ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        version: 'COCOMO-EM',
        provider: process.env.LLM_PROVIDER ?? 'gemini',
        activeSessions: sessions.size,
        config: {
            netMargin: config.Margin_NetProfit,
            riskPremium: config.Margin_RiskPremium,
            reinvestment: config.Margin_Reinvestment,
            rateSenior: config.Rate_Dev_Senior,
        },
    });
});
// ─── Route: Analyze Transcript (Copilot Turn) ──────────────────────────────
app.post('/api/analyze-transcript', async (req, res) => {
    const { sessionId, transcript } = req.body;
    if (!sessionId || !transcript?.trim()) {
        return res.status(400).json({ error: 'sessionId and transcript are required' });
    }
    const serverSession = getOrCreateSession(sessionId);
    try {
        const result = await serverSession.investigator.runTurn(transcript.trim(), serverSession.session, callLlm);
        serverSession.session = result.session;
        const filled = result.session.emSet.multipliers.filter(m => m.value !== null).length;
        const turnCount = result.session.conversationHistory.length / 2;
        console.log(`[Chat] ${sessionId} | Turn ${turnCount} | EMs: ${filled}/12 | Done: ${result.done}`);
        return res.json({
            suggestions: result.suggestions,
            effortMultipliers: result.session.emSet.multipliers,
            compoundMultiplier: result.session.emSet.compoundMultiplier,
            effectiveBufferPercent: result.session.emSet.effectiveBufferPercent,
            filledCount: filled,
            totalCount: 12,
            allSlotsFilled: result.done,
            turnCount,
        });
    }
    catch (err) {
        console.error(`[Transcript] Error in session ${sessionId}:`, err.message);
        return res.status(500).json({ error: 'LLM call failed', detail: err.message });
    }
});
// ─── Route: Confirm EM (Inline Adjust / Confirm) ──────────────────────────────
app.post('/api/confirm-em', (req, res) => {
    const { sessionId, em_id, action, newValue, reason } = req.body;
    // action: 'confirm' | 'adjust'
    const serverSession = sessions.get(sessionId);
    if (!serverSession) {
        return res.status(404).json({ error: `Session "${sessionId}" not found` });
    }
    const em = serverSession.session.emSet.multipliers.find(m => m.em_id === em_id);
    if (!em) {
        return res.status(400).json({ error: `EM ${em_id} not found` });
    }
    if (action === 'confirm') {
        em.status = 'confirmed';
        em.confirmedBy = 'pre-sales';
    }
    else if (action === 'adjust') {
        em.previousValue = em.value;
        em.value = newValue;
        em.status = 'confirmed';
        em.confirmedBy = 'pre-sales';
        em.confirmReason = reason;
    }
    let compound = 1.0;
    const riskIds = ['EM_D1', 'EM_D2', 'EM_D3', 'EM_I1', 'EM_I2', 'EM_T1', 'EM_T2'];
    for (const item of serverSession.session.emSet.multipliers) {
        if (riskIds.includes(item.em_id) && item.value !== null) {
            compound *= Math.max(item.range[0], Math.min(item.range[1], item.value));
        }
    }
    serverSession.session.emSet.compoundMultiplier = compound;
    serverSession.session.emSet.effectiveBufferPercent = `+${((compound - 1) * 100).toFixed(1)}%`;
    return res.json({
        success: true,
        effortMultipliers: serverSession.session.emSet.multipliers,
        compoundMultiplier: serverSession.session.emSet.compoundMultiplier,
        effectiveBufferPercent: serverSession.session.emSet.effectiveBufferPercent
    });
});
// ─── Route: Profile (Bouncer / Pre-qualification) ─────────────────────────────
app.post('/api/profile', async (req, res) => {
    const { sessionId, projectContext } = req.body;
    if (!projectContext?.trim()) {
        return res.status(400).json({ error: 'projectContext is required' });
    }
    const sid = sessionId || `KHX-${Date.now()}`;
    const serverSession = getOrCreateSession(sid);
    // Build a classification prompt — the Bouncer
    const bouncerPrompt = `You are a B2B Enterprise IT sales qualification system.

Analyze this project brief and determine:
1. Is this a valid B2B Enterprise project? (NOT a student project, personal tool, or budget under 150 million VND)
2. If valid, extract any Effort Multiplier values you can infer from the context.

EM DEFINITIONS (Only assign if you have DIRECT evidence):
- EM_D1: How is data STORED? (Excel/PDF = high, SQL/ERP = low). NOT about job titles.
- EM_D2: How MUCH data? (years × records). NOT about company size.
- EM_D3: Is data CLEAN? (frequent errors = high). Need explicit complaints about data quality.
- EM_I1: Does their system have APIs? Need explicit mention of API/integration capability.
- EM_I2: How OLD is their current software? Need explicit age or version info.
- EM_T1: Will end-users RESIST change? Need explicit concern about adoption.
- EM_T2: Have users used SIMILAR software before? Need explicit past experience.
- EM_B1: On-site or Remote delivery? Need explicit location discussion.
- EM_B2: Special HARDWARE needed? (barcode scanner, GPS, etc.) Need explicit requirement.
- EM_C1: How URGENT is the timeline? Need explicit deadline pressure.
- EM_C2: Enterprise SLA/Compliance requirements? Need explicit compliance discussion.
- EM_C3: Payment terms discussed? (upfront vs installments). Need EXPLICIT payment discussion.

CRITICAL: If the transcript does NOT contain direct evidence for an EM, you MUST set its value to null.
Do NOT infer from job titles, company names, or communication channels.
"I don't know" from the customer = set value to null, NOT to a default.

Project Brief:
"""
${projectContext.trim()}
"""

REJECTION KEYWORDS: If you see any of these: "sinh viên", "đồ án", "bài tập", "cá nhân", "miễn phí", "student", "personal", "homework", "free" — you MUST reject.

Return JSON only:
{
  "isValid": true or false,
  "rejectionReason": "string explaining why rejected, or null if valid",
  "effortMultipliers": [
    {
      "em_id": "EM_D1 | EM_D2 | ... | EM_C3",
      "action": "FILL",
      "value": "number or null",
      "confidence": "high | medium | low",
      "source": "ai_inference_from_context",
      "evidence": "quote from the brief",
      "reasoning": "why this value"
    }
  ],
  "estimatedManDays": "number or null",
  "primaryRole": "Junior | Senior | PM | BA | null",
  "suggestions": ["string — what to discuss first in the meeting"]
}`;
    try {
        const rawResponse = await callLlm(bouncerPrompt);
        // Try to parse JSON from the response
        let parsed;
        try {
            const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
            parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        }
        catch {
            parsed = null;
        }
        if (!parsed) {
            return res.status(500).json({ error: 'Failed to parse AI response' });
        }
        // BOUNCER: Reject invalid projects
        if (!parsed.isValid) {
            console.log(`[Profile] REJECTED session ${sid}: ${parsed.rejectionReason}`);
            return res.status(400).json({
                rejected: true,
                reason: parsed.rejectionReason || 'Hệ thống chuyên biệt B2B Enterprise, không phục vụ đồ án cá nhân.',
            });
        }
        // Valid — merge pre-extracted EMs into session
        if (parsed.effortMultipliers && Array.isArray(parsed.effortMultipliers)) {
            for (const aiEM of parsed.effortMultipliers) {
                const existing = serverSession.session.emSet.multipliers.find(m => m.em_id === aiEM.em_id);
                if (existing && aiEM.value !== null) {
                    existing.value = Math.max(existing.range[0], Math.min(existing.range[1], aiEM.value));
                    existing.confidence = aiEM.confidence ?? 'medium';
                    existing.source = aiEM.source ?? 'ai_inference_from_context';
                    existing.evidence = aiEM.evidence;
                    existing.reasoning = aiEM.reasoning;
                    existing.status = 'ai_pending';
                }
            }
        }
        if (parsed.estimatedManDays) {
            serverSession.session.emSet.estimatedManDays = parsed.estimatedManDays;
        }
        if (parsed.primaryRole) {
            serverSession.session.emSet.primaryRole = parsed.primaryRole;
        }
        if (parsed.suggestions) {
            serverSession.session.emSet.suggestions = parsed.suggestions;
        }
        // Add profile to conversation history
        serverSession.session.conversationHistory.push({
            role: 'user',
            content: `[Hồ sơ trước báo giá]: ${projectContext.trim()}`,
        });
        const filled = serverSession.session.emSet.multipliers.filter(m => m.value !== null).length;
        console.log(`[Profile] ACCEPTED session ${sid} | Pre-filled EMs: ${filled}/12`);
        return res.json({
            sessionId: sid,
            accepted: true,
            suggestions: parsed.suggestions || [],
            effortMultipliers: serverSession.session.emSet.multipliers,
            filledCount: filled,
            totalCount: 12,
            estimatedManDays: serverSession.session.emSet.estimatedManDays,
            primaryRole: serverSession.session.emSet.primaryRole,
        });
    }
    catch (err) {
        console.error(`[Profile] Error:`, err.message);
        return res.status(500).json({ error: 'Profile analysis failed', detail: err.message });
    }
});
// ─── Route: Base Report (On-demand, any time) ─────────────────────────────────
app.get('/api/base-report', (req, res) => {
    const sessionId = req.query.sessionId;
    if (!sessionId) {
        return res.status(400).json({ error: 'sessionId query param is required' });
    }
    const serverSession = sessions.get(sessionId);
    if (!serverSession) {
        return res.status(404).json({ error: `Session "${sessionId}" not found` });
    }
    const emSet = serverSession.session.emSet;
    // Categorize EMs
    const filledEMs = emSet.multipliers
        .filter(m => m.value !== null)
        .map(m => ({
        em_id: m.em_id,
        name: m.name,
        value: m.value,
        confidence: m.confidence,
        evidence: m.evidence,
        reasoning: m.reasoning,
    }));
    const missingEMs = emSet.multipliers
        .filter(m => m.value === null)
        .map(m => ({
        em_id: m.em_id,
        name: m.name,
        range: m.range,
    }));
    // Calculate Base Price (using 1.0 for missing EMs — no risk buffer)
    const manDays = emSet.estimatedManDays ?? 60;
    const role = emSet.primaryRole ?? 'Senior';
    const rateMap = {
        Junior: config.Rate_Dev_Junior,
        Senior: config.Rate_Dev_Senior,
        PM: config.Rate_PM,
        BA: config.Rate_BA,
    };
    const dailyRate = rateMap[role] || config.Rate_Dev_Senior;
    const laborCost = manDays * dailyRate;
    const serverCost = config.Server_Base_Cost_Per_1K_Users;
    const licenseCost = laborCost * 0.2 * (1 - config.Reuse_Factor_Default);
    const baseCost = laborCost + serverCost + licenseCost;
    console.log(`[BaseReport] ${sessionId} | Base: ${baseCost.toLocaleString()} VND | ManDays: ${manDays} | Role: ${role} | Filled: ${filledEMs.length}/12`);
    return res.json({
        sessionId,
        baseCost,
        estimatedManDays: manDays,
        primaryRole: role,
        dailyRate,
        laborCost,
        serverCost,
        licenseCost,
        compoundMultiplier: emSet.compoundMultiplier,
        effectiveBufferPercent: emSet.effectiveBufferPercent,
        filledEMs,
        missingEMs,
        filledCount: filledEMs.length,
        missingCount: missingEMs.length,
        suggestions: emSet.suggestions || [],
    });
});
app.post('/api/calculate', (req, res) => {
    const { sessionId, estimatedManDays, primaryRole, userCount } = req.body;
    if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
    }
    const serverSession = sessions.get(sessionId);
    if (!serverSession) {
        return res.status(404).json({ error: `Session "${sessionId}" not found` });
    }
    const input = {
        emSet: serverSession.session.emSet,
        estimatedManDays: estimatedManDays ?? serverSession.session.emSet.estimatedManDays ?? 60,
        primaryRole: primaryRole ?? serverSession.session.emSet.primaryRole ?? 'Senior',
        userCount: userCount ?? 100,
        emDefinitions: emDefinitionsMap,
    };
    try {
        const result = (0, em_calculator_1.calculateWithEM)(input, config);
        console.log(`[Calculate] ${sessionId} | Price: ${result.recommendedPrice.toLocaleString()} VND | Compound: ×${result._debug.compoundMultiplier.toFixed(3)}`);
        return res.json({ breakdown: result, params: input });
    }
    catch (err) {
        console.error(`[Calculate] Error in session ${sessionId}:`, err.message);
        return res.status(500).json({ error: 'Calculation failed', detail: err.message });
    }
});
// ─── Route: Override ─────────────────────────────────────────────────────────
app.post('/api/override', (req, res) => {
    const { sessionId, overriddenBy, emOverrides, calcOverrides, reasons } = req.body;
    if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
    }
    const serverSession = sessions.get(sessionId);
    if (!serverSession) {
        return res.status(404).json({ error: `Session "${sessionId}" not found` });
    }
    const now = new Date();
    const logs = [];
    // Apply EM overrides
    if (emOverrides && typeof emOverrides === 'object') {
        for (const [emId, newValue] of Object.entries(emOverrides)) {
            const em = serverSession.session.emSet.multipliers.find(m => m.em_id === emId);
            if (em && typeof newValue === 'number') {
                logs.push({
                    em_id: emId,
                    field: em.name,
                    originalValue: em.value,
                    newValue: newValue,
                    reason: reasons?.[emId] ?? 'No reason provided',
                    overriddenBy: overriddenBy ?? 'Pre-sales',
                    timestamp: now,
                });
                em.value = Math.max(em.range[0], Math.min(em.range[1], newValue));
                em.source = 'direct_customer_statement';
                em.confidence = 'high';
                em.presalesNote = `Overridden by ${overriddenBy ?? 'Pre-sales'}: ${reasons?.[emId] ?? ''}`;
            }
        }
    }
    serverSession.overrideLogs.push(...logs);
    // Recalculate
    const input = {
        emSet: serverSession.session.emSet,
        estimatedManDays: calcOverrides?.estimatedManDays ?? serverSession.session.emSet.estimatedManDays ?? 60,
        primaryRole: calcOverrides?.primaryRole ?? serverSession.session.emSet.primaryRole ?? 'Senior',
        userCount: calcOverrides?.userCount ?? 100,
        emDefinitions: emDefinitionsMap,
    };
    try {
        const result = (0, em_calculator_1.calculateWithEM)(input, config);
        console.log(`[Override] ${sessionId} | ${logs.length} overrides | Price: ${result.recommendedPrice.toLocaleString()} VND`);
        return res.json({
            breakdown: result,
            overrideLogs: serverSession.overrideLogs,
            effortMultipliers: serverSession.session.emSet.multipliers,
        });
    }
    catch (err) {
        return res.status(500).json({ error: 'Recalculation failed', detail: err.message });
    }
});
// ─── Fallback: Serve SPA ──────────────────────────────────────────────────────
app.get('*', (_req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public', 'index.html'));
});
// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[Server] Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});
// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀 KHantix COCOMO server running at http://localhost:${PORT}`);
    console.log(`   Frontend: http://localhost:${PORT}`);
    console.log(`   Health:   http://localhost:${PORT}/api/health\n`);
});
exports.default = app;
