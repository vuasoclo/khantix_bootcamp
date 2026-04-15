"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmEm = exports.profile = exports.analyzeTranscript = exports.getModulesList = void 0;
const llm_adapter_1 = require("../llm/llm-adapter");
const session_repository_1 = require("../repositories/session.repository");
const heuristic_v2_loader_1 = require("../config/heuristic-v2.loader");
const investigator_service_1 = require("../services/investigator.service");
const module_catalog_loader_1 = require("../config/module-catalog.loader");
const getModulesList = (req, res) => {
    try {
        const catalog = (0, module_catalog_loader_1.loadModuleCatalog)();
        return res.json(catalog);
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to load modules catalog' });
    }
};
exports.getModulesList = getModulesList;
const { definitions: emDefinitionsMap, rules: emRules } = (0, heuristic_v2_loader_1.loadHeuristicMatrixV2)();
const emDefinitionsArr = Array.from(emDefinitionsMap.values());
const CARRY_OVER_TEXT_PATTERNS = [
    /carried\s+over\s+from\s+(?:the\s+)?(?:previous|prior)\s+state/i,
    /already\s+established\s+in\s+(?:the\s+)?project\s+scope/i,
];
function isCarryOverPlaceholder(text) {
    if (!text || !text.trim())
        return false;
    return CARRY_OVER_TEXT_PATTERNS.some((p) => p.test(text));
}
function sanitizeInfraSlot(incoming, existing) {
    if (!incoming)
        return incoming;
    const next = { ...incoming };
    if (isCarryOverPlaceholder(next.evidence)) {
        next.evidence = existing?.evidence ?? null;
    }
    if (isCarryOverPlaceholder(next.reasoning)) {
        next.reasoning = existing?.reasoning ?? null;
    }
    return next;
}
let callLlm;
try {
    callLlm = (0, llm_adapter_1.createLlmCaller)();
}
catch (err) {
    // It will be caught on startup in server.ts.
}
const analyzeTranscript = async (req, res) => {
    const { sessionId, transcript } = req.body;
    if (!sessionId || !transcript?.trim()) {
        return res.status(400).json({ error: 'sessionId and transcript are required' });
    }
    const serverSession = session_repository_1.sessionRepository.getOrCreate(sessionId, emDefinitionsArr);
    try {
        const result = await serverSession.investigator.runTurn(transcript.trim(), serverSession.session, callLlm, emRules);
        serverSession.session = result.session;
        session_repository_1.sessionRepository.set(sessionId, serverSession);
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
            estimatedManDays: result.session.emSet.estimatedManDays,
            primaryRole: result.session.emSet.primaryRole,
            matchedModules: result.session.emSet.matchedModules,
            roleAllocation: result.session.emSet.roleAllocation,
            userCount: result.session.emSet.userCount,
            concurrent_users: result.session.emSet.concurrent_users,
            expected_storage_gb: result.session.emSet.expected_storage_gb,
            requires_high_availability: result.session.emSet.requires_high_availability,
        });
    }
    catch (err) {
        console.error(`[Transcript] Error in session ${sessionId}:`, err.message);
        return res.status(500).json({ error: 'LLM call failed', detail: err.message });
    }
};
exports.analyzeTranscript = analyzeTranscript;
const profile = async (req, res) => {
    const { sessionId, projectContext } = req.body;
    if (!projectContext?.trim()) {
        return res.status(400).json({ error: 'projectContext is required' });
    }
    const sid = sessionId || `KHX-${Date.now()}`;
    const serverSession = session_repository_1.sessionRepository.getOrCreate(sid, emDefinitionsArr);
    let heuristicText = '';
    const ruleGroups = new Map();
    for (const r of emRules) {
        const line = `- Keywords: ${JSON.stringify(r.keywords)} -> Target Default Value: ${r.emDefault} (Min: ${r.emMin}, Max: ${r.emMax}, Reason: ${r.reasoningHint})`;
        if (!ruleGroups.has(r.emId))
            ruleGroups.set(r.emId, []);
        ruleGroups.get(r.emId).push(line);
    }
    for (const [emId, lines] of ruleGroups.entries()) {
        heuristicText += `[${emId}]\n${lines.join('\n')}\n\n`;
    }
    const bouncerPrompt = `You are a B2B Enterprise IT sales qualification system.

Analyze this project brief and determine:
1. Is this a valid B2B Enterprise project? (NOT a student project, personal tool, or budget under 150 million VND)
2. If valid, extract Effort Multiplier values ONLY when you have DIRECT EVIDENCE in the brief.

Project Brief:
"""
${projectContext.trim()}
"""

REJECTION KEYWORDS: If you see any of these: "sinh viên", "đồ án", "bài tập", "cá nhân", "miễn phí", "student", "personal", "homework", "free" — you MUST reject.

EM DEFINITIONS (CRITICAL — Only assign if DIRECT EVIDENCE exists in the brief):
- EM_D1: How is data STORED? (Excel/PDF = high, SQL/ERP = low). NOT from job titles.
- EM_D2: How MUCH data? (years × records). NOT from company size alone.
- EM_D3: Is data CLEAN? Need explicit complaint about errors/mismatch.
- EM_I1: Does system have APIs? Need explicit mention of integration.
- EM_I2: How OLD is their software? Need explicit year/version.
- EM_T1: Will users RESIST change? Need explicit adoption concern.
- EM_T2: Have users used SIMILAR B2B software? Need explicit experience.
- EM_B1: On-site or Remote? Need explicit location discussion.
- EM_B2: Special HARDWARE needed? Need explicit requirement.
- EM_C1: How URGENT? Need explicit deadline.
- EM_C2: Enterprise SLA/compliance? Need explicit mention.
- EM_C3: Payment terms? Need EXPLICIT payment discussion.

PRIORITIZE PROJECT SCOPING (USERS, ROLES, MODULES):
You MUST prioritize gathering requirements for the following 3 fields BEFORE focusing on risk EMs:
1. \`userCount\`: How many people will use the system?
2. \`matchedModules\`: Which functional areas apply?
If these scoping parameters are missing or unclear in the brief, your 'suggestions' array MUST focus on asking the customer about these aspects first. Only move to Risk EMs once Project Scoping is filled.

HEURISTIC RULES MATRIX (Use the Target Default Value if keywords match. You can adjust slightly within the [Min, Max] range if context is more/less extreme):
${heuristicText}

STRICT: If no direct evidence → value MUST be null. Job title → null. Person name → null.

Return JSON only:
{
  "isValid": true or false,
  "rejectionReason": "string or null",
  "effortMultipliers": [
    {
      "em_id": "EM_D1 | EM_D2 | ... | EM_C3",
      "action": "FILL",
      "value": "number or null",
      "confidence": "high | medium | low",
      "source": "ai_inference_from_context",
      "evidence": "exact quote from the brief, or null",
      "reasoning": "why this value, referencing EM definition"
    }
  ],
  "userCount": { "value": "number or null", "evidence": "string or null", "reasoning": "string or null" },
  "concurrent_users": { "value": "number or null", "confidence": "high|medium|low|null", "is_extracted": true|false, "evidence": "string or null", "reasoning": "string or null" },
  "expected_storage_gb": { "value": "number or null", "confidence": "high|medium|low|null", "is_extracted": true|false, "evidence": "string or null", "reasoning": "string or null" },
  "requires_high_availability": { "value": "boolean or null", "confidence": "high|medium|low|null", "is_extracted": true|false, "evidence": "string or null", "reasoning": "string or null" },
  "estimatedManDays": "number or null",
  "primaryRole": "Junior | Senior | PM | BA | null",
  "suggestions": ["string — what to discuss first in the meeting"]
}`;
    try {
        const rawResponse = await callLlm(bouncerPrompt);
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
        if (!parsed.isValid) {
            console.log(`[Profile] REJECTED session ${sid}: ${parsed.rejectionReason}`);
            return res.status(400).json({
                rejected: true,
                reason: parsed.rejectionReason || 'Hệ thống chuyên biệt B2B Enterprise, không phục vụ đồ án cá nhân.',
            });
        }
        if (parsed.effortMultipliers && Array.isArray(parsed.effortMultipliers)) {
            for (const aiEM of parsed.effortMultipliers) {
                const existing = serverSession.session.emSet.multipliers.find(m => m.em_id === aiEM.em_id);
                if (existing && aiEM.value !== null) {
                    existing.value = Math.max(existing.range[0], Math.min(existing.range[1], aiEM.value));
                    existing.confidence = aiEM.confidence ?? 'medium';
                    existing.source = aiEM.source ?? 'ai_inference_from_context';
                    existing.evidence = aiEM.evidence ?? null;
                    existing.reasoning = aiEM.reasoning ?? null;
                    existing.status = 'ai_pending';
                }
            }
        }
        if (parsed.estimatedManDays) {
            serverSession.session.emSet.estimatedManDays = parsed.estimatedManDays;
        }
        if (parsed.userCount) {
            serverSession.session.emSet.userCount = parsed.userCount;
        }
        if (parsed.concurrent_users) {
            serverSession.session.emSet.concurrent_users = sanitizeInfraSlot(parsed.concurrent_users, serverSession.session.emSet.concurrent_users);
        }
        if (parsed.expected_storage_gb) {
            serverSession.session.emSet.expected_storage_gb = sanitizeInfraSlot(parsed.expected_storage_gb, serverSession.session.emSet.expected_storage_gb);
        }
        if (parsed.requires_high_availability) {
            serverSession.session.emSet.requires_high_availability = sanitizeInfraSlot(parsed.requires_high_availability, serverSession.session.emSet.requires_high_availability);
        }
        if (parsed.primaryRole) {
            serverSession.session.emSet.primaryRole = parsed.primaryRole;
        }
        if (parsed.suggestions) {
            serverSession.session.emSet.suggestions = parsed.suggestions;
        }
        serverSession.session.conversationHistory.push({
            role: 'user',
            content: `[Hồ sơ trước báo giá]: ${projectContext.trim()}`,
        });
        session_repository_1.sessionRepository.set(sid, serverSession);
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
            matchedModules: serverSession.session.emSet.matchedModules,
            roleAllocation: serverSession.session.emSet.roleAllocation,
            userCount: serverSession.session.emSet.userCount,
            concurrent_users: serverSession.session.emSet.concurrent_users,
            expected_storage_gb: serverSession.session.emSet.expected_storage_gb,
            requires_high_availability: serverSession.session.emSet.requires_high_availability,
        });
    }
    catch (err) {
        console.error(`[Profile] Error:`, err.message);
        return res.status(500).json({ error: 'Profile analysis failed', detail: err.message });
    }
};
exports.profile = profile;
const confirmEm = (req, res) => {
    const { sessionId, em_id, action, newValue, reason } = req.body;
    if (!sessionId || !em_id || !action) {
        return res.status(400).json({ error: 'sessionId, em_id, and action are required' });
    }
    const serverSession = session_repository_1.sessionRepository.get(sessionId);
    if (!serverSession) {
        return res.status(404).json({ error: `Session "${sessionId}" not found` });
    }
    const normalizedEmId = em_id.toLowerCase().replace(/\s+/g, '');
    // Handle special scoping slots
    if (normalizedEmId === 'usercount') {
        if (action === 'adjust') {
            const parsedValue = parseInt(newValue, 10);
            if (!isNaN(parsedValue)) {
                serverSession.session.emSet.userCount = { value: parsedValue, evidence: 'Manual adjustment', reasoning: reason || 'Pre-sales override' };
            }
        }
        else if (action === 'confirm') {
            if (serverSession.session.emSet.userCount) {
                // just acknowledge the confirmation, no state mutation required for now
                console.log(`[ConfirmEM] ${sessionId} | userCount CONFIRMED at ${serverSession.session.emSet.userCount.value}`);
            }
        }
    }
    else if (normalizedEmId === 'roleallocation') {
        if (action === 'adjust' && typeof newValue === 'object') {
            serverSession.session.emSet.roleAllocation = {
                BA: { value: newValue.BA, evidence: 'Manual adjustment', reasoning: reason },
                Senior: { value: newValue.Senior, evidence: 'Manual adjustment', reasoning: reason },
                Junior: { value: newValue.Junior, evidence: 'Manual adjustment', reasoning: reason },
                PM: { value: newValue.PM, evidence: 'Manual adjustment', reasoning: reason }
            };
        }
        else if (action === 'confirm') {
            console.log(`[ConfirmEM] ${sessionId} | roleAllocation CONFIRMED`);
        }
    }
    else if (normalizedEmId === 'matchedmodules') {
        if (action === 'adjust' && Array.isArray(newValue)) {
            serverSession.session.emSet.matchedModules = newValue;
            (0, investigator_service_1.syncRoleAllocationFromModules)(serverSession.session.emSet);
            console.log(`[ConfirmEM] ${sessionId} | matchedModules ADJUSTED to length: ${newValue.length}`);
        }
        else if (action === 'confirm') {
            console.log(`[ConfirmEM] ${sessionId} | matchedModules CONFIRMED`);
        }
    }
    else if (normalizedEmId === 'concurrent_users') {
        if (action === 'adjust') {
            const parsedValue = parseInt(newValue, 10);
            if (!isNaN(parsedValue)) {
                serverSession.session.emSet.concurrent_users = {
                    value: parsedValue,
                    confidence: 'high',
                    is_extracted: true,
                    evidence: 'Manual adjustment',
                    reasoning: reason || 'Pre-sales override'
                };
                console.log(`[ConfirmEM] ${sessionId} | concurrent_users ADJUSTED to ${parsedValue}`);
            }
        }
        else if (action === 'confirm') {
            console.log(`[ConfirmEM] ${sessionId} | concurrent_users CONFIRMED`);
        }
    }
    else if (normalizedEmId === 'expected_storage_gb') {
        if (action === 'adjust') {
            const parsedValue = parseFloat(newValue);
            if (!isNaN(parsedValue)) {
                serverSession.session.emSet.expected_storage_gb = {
                    value: parsedValue,
                    confidence: 'high',
                    is_extracted: true,
                    evidence: 'Manual adjustment',
                    reasoning: reason || 'Pre-sales override'
                };
                console.log(`[ConfirmEM] ${sessionId} | expected_storage_gb ADJUSTED to ${parsedValue}`);
            }
        }
        else if (action === 'confirm') {
            console.log(`[ConfirmEM] ${sessionId} | expected_storage_gb CONFIRMED`);
        }
    }
    else if (normalizedEmId === 'requires_high_availability') {
        if (action === 'adjust') {
            const parsedValue = newValue === true || newValue === 'true';
            serverSession.session.emSet.requires_high_availability = {
                value: parsedValue,
                confidence: 'high',
                is_extracted: true,
                evidence: 'Manual adjustment',
                reasoning: reason || 'Pre-sales override'
            };
            console.log(`[ConfirmEM] ${sessionId} | requires_high_availability ADJUSTED to ${parsedValue}`);
        }
        else if (action === 'confirm') {
            console.log(`[ConfirmEM] ${sessionId} | requires_high_availability CONFIRMED`);
        }
    }
    else {
        // Handle standard EMs
        const em = serverSession.session.emSet.multipliers.find(m => m.em_id === em_id);
        if (!em) {
            return res.status(404).json({ error: `EM "${em_id}" not found` });
        }
        if (action === 'confirm') {
            em.status = 'confirmed';
            em.confirmedBy = 'pre-sales';
            console.log(`[ConfirmEM] ${sessionId} | ${em_id} CONFIRMED at ${em.value}`);
        }
        else if (action === 'adjust') {
            const adjustedValue = parseFloat(newValue);
            if (isNaN(adjustedValue)) {
                return res.status(400).json({ error: 'newValue must be a valid number' });
            }
            em.previousValue = em.value;
            em.value = Math.max(em.range[0], Math.min(em.range[1], adjustedValue));
            em.status = 'confirmed';
            em.confirmedBy = 'pre-sales';
            em.confirmReason = reason || '';
            console.log(`[ConfirmEM] ${sessionId} | ${em_id} ADJUSTED ${em.previousValue} → ${em.value} | Reason: ${reason}`);
        }
        else {
            return res.status(400).json({ error: 'action must be "confirm" or "adjust"' });
        }
    }
    const riskIds = ['EM_D1', 'EM_D2', 'EM_D3', 'EM_I1', 'EM_I2', 'EM_T1', 'EM_T2'];
    let compound = 1.0;
    for (const m of serverSession.session.emSet.multipliers) {
        if (riskIds.includes(m.em_id) && m.value !== null) {
            compound *= Math.max(m.range[0], Math.min(m.range[1], m.value));
        }
    }
    serverSession.session.emSet.compoundMultiplier = compound;
    serverSession.session.emSet.effectiveBufferPercent = `+${((compound - 1) * 100).toFixed(1)}%`;
    session_repository_1.sessionRepository.set(sessionId, serverSession);
    const filled = serverSession.session.emSet.multipliers.filter(m => m.value !== null).length;
    return res.json({
        success: true,
        effortMultipliers: serverSession.session.emSet.multipliers,
        compoundMultiplier: serverSession.session.emSet.compoundMultiplier,
        effectiveBufferPercent: serverSession.session.emSet.effectiveBufferPercent,
        filledCount: filled,
        matchedModules: serverSession.session.emSet.matchedModules || [],
        roleAllocation: serverSession.session.emSet.roleAllocation || {},
        userCount: serverSession.session.emSet.userCount || { value: null, evidence: null, reasoning: null },
        concurrent_users: serverSession.session.emSet.concurrent_users || { value: null, evidence: null, reasoning: null },
        expected_storage_gb: serverSession.session.emSet.expected_storage_gb || { value: null, evidence: null, reasoning: null },
        requires_high_availability: serverSession.session.emSet.requires_high_availability || { value: null, evidence: null, reasoning: null },
    });
};
exports.confirmEm = confirmEm;
