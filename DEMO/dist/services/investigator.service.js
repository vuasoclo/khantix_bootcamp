"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestigatorService = void 0;
exports.syncRoleAllocationFromModules = syncRoleAllocationFromModules;
const prompt_builder_1 = require("../builders/prompt.builder");
const investigator_strategy_1 = require("../strategies/investigator.strategy");
const effort_multiplier_types_1 = require("../types/effort-multiplier.types");
const safe_json_1 = require("../utils/safe-json");
// ─── Session State ────────────────────────────────────────────────────────────
const module_catalog_loader_1 = require("../config/module-catalog.loader");
// ─── Helpers ──────────────────────────────────────────────────────────────────
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function computeCompound(emSet) {
    // Product of all non-null risk EMs (D1-D3, I1-I2, T1-T2)
    const riskIds = ['EM_D1', 'EM_D2', 'EM_D3', 'EM_I1', 'EM_I2', 'EM_T1', 'EM_T2'];
    let compound = 1.0;
    for (const em of emSet.multipliers) {
        if (riskIds.includes(em.em_id) && em.value !== null) {
            compound *= clamp(em.value, em.range[0], em.range[1]);
        }
    }
    emSet.compoundMultiplier = compound;
    emSet.effectiveBufferPercent = `+${((compound - 1) * 100).toFixed(1)}%`;
}
function countFilled(emSet) {
    return emSet.multipliers.filter(m => m.value !== null).length;
}
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
// ─── InvestigatorService (COCOMO version) ─────────────────────────────────────
function syncRoleAllocationFromModules(emSet) {
    if (!emSet.matchedModules || emSet.matchedModules.length === 0) {
        emSet.roleAllocation = undefined;
        return;
    }
    const catalog = (0, module_catalog_loader_1.loadModuleCatalog)();
    let totalBaseManDays = 0;
    for (const m of emSet.matchedModules) {
        const catalogEntry = catalog.find(c => c.moduleId === m.module_id);
        if (catalogEntry) {
            totalBaseManDays += catalogEntry.baseManDays;
        }
    }
    const pmDays = Math.ceil(totalBaseManDays * 0.10);
    const baDays = Math.ceil(totalBaseManDays * 0.15);
    const seniorDays = Math.ceil(totalBaseManDays * 0.50);
    const juniorDays = Math.ceil(totalBaseManDays * 0.25);
    emSet.roleAllocation = {
        PM: { value: pmDays, evidence: 'Auto-calculated from Modules', reasoning: `Based on ${totalBaseManDays} total man-days` },
        BA: { value: baDays, evidence: 'Auto-calculated from Modules', reasoning: `Based on ${totalBaseManDays} total man-days` },
        Senior: { value: seniorDays, evidence: 'Auto-calculated from Modules', reasoning: `Based on ${totalBaseManDays} total man-days` },
        Junior: { value: juniorDays, evidence: 'Auto-calculated from Modules', reasoning: `Based on ${totalBaseManDays} total man-days` }
    };
}
class InvestigatorService {
    constructor() {
        this.strategy = new investigator_strategy_1.InvestigatorStrategy();
    }
    async runTurn(userMessage, session, callLlm, heuristicRules) {
        const contract = this.strategy.build();
        // Build state context showing filled/missing EMs with status and reasonings
        const filledEMs = session.emSet.multipliers
            .filter(m => m.value !== null)
            .map(m => `  ${m.em_id} (${m.name}) = ${m.value} [${m.confidence}] status:${m.status}\n     Last reason: ${m.reasoning || '(none)'}`);
        const missingEMs = session.emSet.multipliers
            .filter(m => m.value === null)
            .map(m => `  ${m.em_id} (${m.name}) — range: [${m.range[0]}, ${m.range[1]}]`);
        // Load module catalog to inject into prompt
        const moduleCatalog = (0, module_catalog_loader_1.loadModuleCatalog)();
        const catalogContext = `
MODULE CATALOG:
${moduleCatalog.map(m => `- [${m.moduleId}] ${m.moduleName} (Base ManDays: ${m.baseManDays}) | Keywords: ${m.keywords.join(', ')}`).join('\n')}
`;
        const scopingContext = `
Project Scoping so far:
- matchedModules: ${session.emSet.matchedModules?.map(m => m.module_id).join(', ') || '(none)'}
- userCount: ${session.emSet.userCount?.value !== null && session.emSet.userCount?.value !== undefined ? session.emSet.userCount.value : '(none)'}
- concurrent_users: ${session.emSet.concurrent_users?.value !== null && session.emSet.concurrent_users?.value !== undefined ? session.emSet.concurrent_users.value : '(none)'}
- expected_storage_gb: ${session.emSet.expected_storage_gb?.value !== null && session.emSet.expected_storage_gb?.value !== undefined ? session.emSet.expected_storage_gb.value : '(none)'}
- requires_high_availability: ${session.emSet.requires_high_availability?.value !== null && session.emSet.requires_high_availability?.value !== undefined ? session.emSet.requires_high_availability.value : '(none)'}
- roleAllocation: ${session.emSet.roleAllocation && Object.values(session.emSet.roleAllocation).some(r => r && r.value !== null) ? JSON.stringify(session.emSet.roleAllocation) : '(none)'}
`;
        const stateContext = `
Current Effort Multiplier state:
FILLED (${filledEMs.length}/12):
${filledEMs.join('\n') || '  (none yet)'}

MISSING (${missingEMs.length}/12):
${missingEMs.join('\n') || '  (all filled!)'}

Compound risk multiplier so far: ${session.emSet.compoundMultiplier.toFixed(3)}
${scopingContext}
`;
        // Group heuristic rules by emId to feed to LLM
        const ruleGroups = new Map();
        for (const r of heuristicRules) {
            const line = `- Keywords: ${JSON.stringify(r.keywords)} -> Target Default Value: ${r.emDefault} (Reason: ${r.reasoningHint})`;
            if (!ruleGroups.has(r.emId))
                ruleGroups.set(r.emId, []);
            ruleGroups.get(r.emId).push(line);
        }
        let heuristicText = 'HEURISTIC RULES MATRIX (Use the Target Default Value if keywords match. You can adjust slightly within the provided missing EM range if the context is more/less extreme than the keywords):\n';
        for (const [emId, lines] of ruleGroups.entries()) {
            heuristicText += `[${emId}]\n${lines.join('\n')}\n\n`;
        }
        const prompt = new prompt_builder_1.PromptBuilder()
            .withSystem(contract.systemPrompt + '\n' + catalogContext)
            .withDeveloper(contract.developerPrompt + '\n\n' + heuristicText + stateContext)
            .withOutputFormat(contract.outputFormatPrompt)
            .withUserInput(`Transcript:\n${userMessage}`)
            .build();
        const rawResponse = await callLlm(prompt);
        const parsed = (0, safe_json_1.safeJsonParse)(rawResponse);
        if (!parsed) {
            // Graceful degradation
            return {
                session,
                suggestions: ['Yêu cầu khách mô tả lại vấn đề cốt lõi cần giải quyết'],
                done: false,
            };
        }
        // Merge AI estimates using Action Flags (FILL / UPDATE / RETRACT)
        for (const aiEM of parsed.effortMultipliers) {
            const existing = session.emSet.multipliers.find(m => m.em_id === aiEM.em_id);
            if (!existing)
                continue;
            const action = aiEM.action || 'FILL'; // backward compat
            switch (action) {
                case 'FILL':
                    if (existing.value === null && aiEM.value !== null) {
                        existing.value = clamp(aiEM.value, existing.range[0], existing.range[1]);
                        existing.confidence = aiEM.confidence ?? 'medium';
                        existing.source = aiEM.source ?? 'ai_inference_from_context';
                        existing.evidence = aiEM.evidence ?? null;
                        existing.reasoning = aiEM.reasoning ?? null;
                        if (aiEM.reasoning)
                            existing.reasoningHistory.push(aiEM.reasoning);
                        existing.status = 'ai_pending';
                    }
                    break;
                case 'UPDATE':
                    if (aiEM.value !== null) {
                        existing.previousValue = existing.value;
                        existing.value = clamp(aiEM.value, existing.range[0], existing.range[1]);
                        existing.confidence = aiEM.confidence ?? 'medium';
                        existing.source = aiEM.source ?? 'ai_inference_from_context';
                        existing.evidence = aiEM.evidence ?? null;
                        // Add to reasoning history if it's different or meaningful
                        const newReason = aiEM.reasoning;
                        if (newReason && newReason !== existing.reasoning) {
                            existing.reasoning = newReason;
                            existing.reasoningHistory.push(newReason);
                        }
                        existing.status = 'ai_pending'; // Reset to pending for re-review
                        existing.confirmedBy = null; // Invalidate previous confirmation
                    }
                    break;
                case 'RETRACT':
                    existing.previousValue = existing.value;
                    existing.value = null;
                    existing.status = 'empty';
                    existing.evidence = null;
                    if (aiEM.reasoning) {
                        existing.reasoning = `Retracted: ${aiEM.reasoning}`;
                        existing.reasoningHistory.push(`Retracted: ${aiEM.reasoning}`);
                    }
                    existing.confirmedBy = null;
                    break;
            }
        }
        if (parsed.estimatedManDays !== undefined && parsed.estimatedManDays !== null) {
            session.emSet.estimatedManDays = parsed.estimatedManDays;
        }
        if (parsed.primaryRole !== undefined && parsed.primaryRole !== null) {
            session.emSet.primaryRole = parsed.primaryRole;
        }
        if (parsed.matchedModules && parsed.matchedModules.length > 0) {
            session.emSet.matchedModules = parsed.matchedModules;
            // Auto-sync role allocation based on matched modules, overriding any LLM guesses
            syncRoleAllocationFromModules(session.emSet);
        }
        // We completely skip LLM's parsed.roleAllocation since it's deterministic now.
        if (parsed.userCount && parsed.userCount.value !== null) {
            session.emSet.userCount = parsed.userCount;
        }
        if (parsed.concurrent_users?.value !== undefined) {
            session.emSet.concurrent_users = sanitizeInfraSlot(parsed.concurrent_users, session.emSet.concurrent_users);
        }
        if (parsed.expected_storage_gb?.value !== undefined) {
            session.emSet.expected_storage_gb = sanitizeInfraSlot(parsed.expected_storage_gb, session.emSet.expected_storage_gb);
        }
        if (parsed.requires_high_availability?.value !== undefined) {
            session.emSet.requires_high_availability = sanitizeInfraSlot(parsed.requires_high_availability, session.emSet.requires_high_availability);
        }
        if (parsed.suggestions && parsed.suggestions.length > 0) {
            session.emSet.suggestions = parsed.suggestions;
        }
        // Recompute compound
        computeCompound(session.emSet);
        // Update conversation history (No assistant output anymore since it's a silent copilot)
        session.conversationHistory.push({ role: 'user', content: userMessage });
        session.updatedAt = new Date();
        const filled = countFilled(session.emSet);
        return {
            session,
            suggestions: parsed.suggestions || [],
            done: parsed.allSlotsFilled || filled >= 12,
        };
    }
    createSession(sessionId, definitions) {
        return {
            sessionId,
            emSet: (0, effort_multiplier_types_1.createEmptyEMSet)(definitions),
            conversationHistory: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
}
exports.InvestigatorService = InvestigatorService;
