"use strict";
// Effort Multiplier Types — COCOMO-based pricing model
// Each EM maps 1:1 with a sub-parameter in the Pricing Dictionary
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmptyEMSet = createEmptyEMSet;
// Dynamic creation relying on loader definitions
function createEmptyEMSet(definitions) {
    return {
        multipliers: definitions.map(def => ({
            em_id: def.em_id,
            name: def.name,
            value: null,
            range: def.range,
            defaultValue: def.defaultValue,
            confidence: null,
            source: 'unknown_after_3_attempts',
            evidence: null,
            reasoning: null,
            status: 'empty'
        })),
        compoundMultiplier: 1.0,
        effectiveBufferPercent: '+0.0%',
        estimatedManDays: null,
        primaryRole: null,
        suggestions: [],
    };
}
