export type TierName = 'basic' | 'standard' | 'premium';

export type NegotiationConfidence = 'high' | 'medium' | 'low';

export type NegotiationIntentType =
  | 'budget_pushback'
  | 'feature_tradeoff'
  | 'scope_reduction'
  | 'timeline_pressure'
  | 'unknown';

export interface NegotiationCard {
  cardId: string;
  title: string;
  category: 'scope_cut' | 'risk_transfer' | 'commercial_term';
  estimatedSavingVnd: number;
  valueImpactScore: number;
  operationRiskScore: number;
  requiresClientCapability: string[];
  blocksIfMissingModules?: string[];
  mandatoryClauses: string[];
  explanationTemplate: string;
}

export interface TierQuote {
  tier: TierName;
  priceVnd: number;
  scopeModules: string[];
  clientResponsibilities: string[];
  vendorResponsibilities: string[];
  mandatoryClauses: string[];
  explanation: string[];
}

export interface TierQuotes {
  basic: TierQuote;
  standard: TierQuote;
  premium: TierQuote;
}

export interface NegotiationIntentCandidate {
  selectedTierCandidate: TierName;
  clientBudgetVnd: number | null;
  clientCapabilities: string[];
  negotiationIntent: NegotiationIntentType;
  confidence: NegotiationConfidence;
  evidenceQuotes: string[];
  suggestions: string[];
}

export interface NegotiationIntent {
  sessionId: string;
  selectedTier: TierName;
  clientBudgetVnd: number;
  clientCapabilities: string[];
  confidence: NegotiationConfidence;
  evidenceQuotes: string[];
}

export interface GuardrailResult {
  dependencyPass: boolean;
  operationPass: boolean;
  contractPass: boolean;
  pricingIntegrityPass: boolean;
  allGuardrailsPass: boolean;
}

export interface GuardrailValidationOutput {
  guardrails: GuardrailResult;
  warnings: string[];
  mandatoryClauses: string[];
  pricingFloorVnd: number;
  postDiscountPriceVnd: number;
}

export interface TradeoffRecommendation {
  recommendationId: string;
  targetGapVnd: number;
  coveredGapVnd: number;
  selectedCards: NegotiationCard[];
  mandatoryClauses: string[];
  residualGapVnd: number;
  warnings: string[];
  guardrails: GuardrailResult;
}

export interface NegotiationRecommendationResult {
  tierQuotes: TierQuotes;
  tradeoffRecommendations: TradeoffRecommendation[];
  warnings: string[];
  salesScriptDraft: string[];
}

export type NegotiationLogType =
  | 'intent_analyzed'
  | 'recommendation_generated'
  | 'playbook_confirmed';

export interface NegotiationAuditLog {
  auditId: string;
  type: NegotiationLogType;
  timestamp: Date;
  payload: unknown;
}
