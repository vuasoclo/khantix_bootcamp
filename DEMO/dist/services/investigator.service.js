"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestigatorService = void 0;
const prompt_builder_1 = require("../builders/prompt.builder");
const investigator_strategy_1 = require("../strategies/investigator.strategy");
const effort_multiplier_types_1 = require("../types/effort-multiplier.types");
const safe_json_1 = require("../utils/safe-json");
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
// ─── InvestigatorService (COCOMO version) ─────────────────────────────────────
class InvestigatorService {
    constructor() {
        this.strategy = new investigator_strategy_1.InvestigatorStrategy();
    }
    async runTurn(userMessage, session, callLlm) {
        const contract = this.strategy.build();
        // Build state context showing filled/missing EMs
        const filledEMs = session.emSet.multipliers
            .filter(m => m.value !== null)
            .map(m => `  ${m.em_id} (${m.name}) = ${m.value} [${m.confidence}]`);
        const missingEMs = session.emSet.multipliers
            .filter(m => m.value === null)
            .map(m => `  ${m.em_id} (${m.name}) — range: [${m.range[0]}, ${m.range[1]}]`);
        const stateContext = `
Current Effort Multiplier state:
FILLED (${filledEMs.length}/12):
${filledEMs.join('\n') || '  (none yet)'}

MISSING (${missingEMs.length}/12):
${missingEMs.join('\n') || '  (all filled!)'}

Compound risk multiplier so far: ${session.emSet.compoundMultiplier.toFixed(3)}
`;
        const prompt = new prompt_builder_1.PromptBuilder()
            .withSystem(contract.systemPrompt)
            .withDeveloper(contract.developerPrompt + '\n\n' + stateContext)
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
        // Merge AI estimates into session EM set
        for (const aiEM of parsed.effortMultipliers) {
            const existing = session.emSet.multipliers.find(m => m.em_id === aiEM.em_id);
            if (!existing)
                continue;
            switch (aiEM.action) {
                case 'FILL':
                    if (existing.value === null) {
                        existing.value = clamp(aiEM.value ?? existing.defaultValue, existing.range[0], existing.range[1]);
                        existing.status = 'ai_pending';
                        existing.confidence = aiEM.confidence ?? 'medium';
                        existing.source = aiEM.source ?? 'ai_inference_from_context';
                        existing.evidence = aiEM.evidence;
                        existing.reasoning = aiEM.reasoning;
                    }
                    break;
                case 'UPDATE':
                    existing.previousValue = existing.value;
                    existing.value = clamp(aiEM.value ?? existing.defaultValue, existing.range[0], existing.range[1]);
                    existing.status = 'ai_pending';
                    existing.confidence = aiEM.confidence ?? 'medium';
                    existing.source = aiEM.source ?? 'ai_inference_from_context';
                    existing.evidence = aiEM.evidence;
                    existing.reasoning = aiEM.reasoning;
                    existing.confirmedBy = null; // Huỷ confirm cũ
                    break;
                case 'RETRACT':
                    existing.previousValue = existing.value;
                    existing.value = null;
                    existing.status = 'empty';
                    existing.confidence = null;
                    existing.evidence = null;
                    existing.reasoning = aiEM.reasoning;
                    existing.confirmedBy = null;
                    break;
            }
        }
        if (parsed.estimatedManDays) {
            session.emSet.estimatedManDays = parsed.estimatedManDays;
        }
        if (parsed.primaryRole) {
            session.emSet.primaryRole = parsed.primaryRole;
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
