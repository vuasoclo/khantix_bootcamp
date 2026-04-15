import {
  NegotiationCard,
  TradeoffRecommendation,
} from '../types/negotiation.types';
import { GuardrailValidatorService } from './guardrail-validator.service';

export interface TradeoffEngineInput {
  targetGapVnd: number;
  selectedTierPriceVnd: number;
  baseCostVnd: number;
  matchedModuleIds: string[];
  clientCapabilities: string[];
  cardsCatalog: NegotiationCard[];
  tierMandatoryClauses?: string[];
  maxRecommendations?: number;
}

interface CandidateEvaluation {
  selectedCards: NegotiationCard[];
  coveredGapVnd: number;
  residualGapVnd: number;
  score: number;
  warnings: string[];
  mandatoryClauses: string[];
  guardrails: {
    dependencyPass: boolean;
    operationPass: boolean;
    contractPass: boolean;
    pricingIntegrityPass: boolean;
    allGuardrailsPass: boolean;
  };
}

export class TradeoffEngineService {
  private guardrailValidator = new GuardrailValidatorService();

  recommend(input: TradeoffEngineInput): TradeoffRecommendation[] {
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

    const selected: CandidateEvaluation[] = [];
    const seen = new Set<string>();

    for (const evaluation of source) {
      const signature = evaluation.selectedCards.map((x) => x.cardId).sort().join('|') || 'none';
      if (seen.has(signature)) continue;
      seen.add(signature);
      selected.push(evaluation);
      if (selected.length >= maxRecommendations) break;
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

  private evaluateSubset(subset: NegotiationCard[], input: TradeoffEngineInput): CandidateEvaluation {
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

    const hardFailPenalty = guardrail.guardrails.allGuardrailsPass ? 0 : 1_000_000_000;
    const gapPenalty = residualGapVnd * 1_000;
    const valuePenalty = valueImpact * 100_000;
    const operationPenalty = operationRisk * 40_000;
    const cardCountPenalty = subset.length * 10_000;
    const overshootPenalty = Math.round(overshootVnd / 20_000);

    const score =
      hardFailPenalty +
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

  private buildSubsets(cards: NegotiationCard[]): NegotiationCard[][] {
    const subsets: NegotiationCard[][] = [];
    const total = cards.length;

    for (let mask = 1; mask < 1 << total; mask += 1) {
      const current: NegotiationCard[] = [];
      for (let i = 0; i < total; i += 1) {
        if ((mask & (1 << i)) !== 0) {
          current.push(cards[i]);
        }
      }
      subsets.push(current);
    }

    return subsets;
  }

  private buildRecommendationId(index: number, cards: NegotiationCard[]): string {
    const short = cards
      .map((card) => card.cardId.replace('card-', '').slice(0, 6))
      .join('-')
      .slice(0, 24)
      .toUpperCase();

    return `REC-${index}-${short || 'BASE'}`;
  }
}
