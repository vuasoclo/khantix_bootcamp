"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeoffEngineService = void 0;
const guardrail_validator_service_1 = require("./guardrail-validator.service");
class TradeoffEngineService {
    constructor() {
        this.guardrailValidator = new guardrail_validator_service_1.GuardrailValidatorService();
    }
    recommend(input) {
        const maxRecommendations = input.maxRecommendations ?? 3;
        if (input.targetGapVnd <= 0) {
            const guardrail = this.guardrailValidator.validate({
                selectedCards: [],
                matchedModuleIds: input.matchedModuleIds,
                clientCapabilities: input.clientCapabilities,
                selectedTierPriceVnd: input.selectedTierPriceVnd,
                coveredGapVnd: 0,
                baseCostVnd: input.baseCostVnd,
                tierMandatoryClauses: input.tierMandatoryClauses,
            });
            return [
                {
                    recommendationId: 'REC-1-NO-GAP',
                    targetGapVnd: 0,
                    coveredGapVnd: 0,
                    selectedCards: [],
                    mandatoryClauses: guardrail.mandatoryClauses,
                    residualGapVnd: 0,
                    warnings: guardrail.warnings,
                    guardrails: guardrail.guardrails,
                },
            ];
        }
        const subsets = this.buildSubsets(input.cardsCatalog);
        const evaluations = subsets.map((subset) => this.evaluateSubset(subset, input));
        evaluations.sort((a, b) => a.score - b.score);
        const passing = evaluations.filter((x) => x.guardrails.allGuardrailsPass);
        const source = passing.length > 0 ? passing : evaluations;
        const selected = [];
        const seen = new Set();
        for (const evaluation of source) {
            const signature = evaluation.selectedCards.map((x) => x.cardId).sort().join('|') || 'none';
            if (seen.has(signature))
                continue;
            seen.add(signature);
            selected.push(evaluation);
            if (selected.length >= maxRecommendations)
                break;
        }
        return selected.map((evaluation, index) => ({
            recommendationId: this.buildRecommendationId(index + 1, evaluation.selectedCards),
            targetGapVnd: input.targetGapVnd,
            coveredGapVnd: evaluation.coveredGapVnd,
            selectedCards: evaluation.selectedCards,
            mandatoryClauses: evaluation.mandatoryClauses,
            residualGapVnd: evaluation.residualGapVnd,
            warnings: evaluation.warnings,
            guardrails: evaluation.guardrails,
        }));
    }
    evaluateSubset(subset, input) {
        const coveredGapVnd = subset.reduce((sum, card) => sum + card.estimatedSavingVnd, 0);
        const residualGapVnd = Math.max(0, input.targetGapVnd - coveredGapVnd);
        const guardrail = this.guardrailValidator.validate({
            selectedCards: subset,
            matchedModuleIds: input.matchedModuleIds,
            clientCapabilities: input.clientCapabilities,
            selectedTierPriceVnd: input.selectedTierPriceVnd,
            coveredGapVnd,
            baseCostVnd: input.baseCostVnd,
            tierMandatoryClauses: input.tierMandatoryClauses,
        });
        const valueImpact = subset.reduce((sum, card) => sum + card.valueImpactScore, 0);
        const operationRisk = subset.reduce((sum, card) => sum + card.operationRiskScore, 0);
        const overshootVnd = Math.max(0, coveredGapVnd - input.targetGapVnd);
        const hardFailPenalty = guardrail.guardrails.allGuardrailsPass ? 0 : 1000000000;
        const gapPenalty = residualGapVnd * 1000;
        const valuePenalty = valueImpact * 100000;
        const operationPenalty = operationRisk * 40000;
        const cardCountPenalty = subset.length * 10000;
        const overshootPenalty = Math.round(overshootVnd / 20000);
        const score = hardFailPenalty +
            gapPenalty +
            valuePenalty +
            operationPenalty +
            cardCountPenalty +
            overshootPenalty;
        return {
            selectedCards: subset,
            coveredGapVnd,
            residualGapVnd,
            score,
            warnings: guardrail.warnings,
            mandatoryClauses: guardrail.mandatoryClauses,
            guardrails: guardrail.guardrails,
        };
    }
    buildSubsets(cards) {
        const subsets = [];
        const total = cards.length;
        for (let mask = 1; mask < 1 << total; mask += 1) {
            const current = [];
            for (let i = 0; i < total; i += 1) {
                if ((mask & (1 << i)) !== 0) {
                    current.push(cards[i]);
                }
            }
            subsets.push(current);
        }
        return subsets;
    }
    buildRecommendationId(index, cards) {
        const short = cards
            .map((card) => card.cardId.replace('card-', '').slice(0, 6))
            .join('-')
            .slice(0, 24)
            .toUpperCase();
        return `REC-${index}-${short || 'BASE'}`;
    }
}
exports.TradeoffEngineService = TradeoffEngineService;
