import { PricingOutput } from '../types/pricing-output.types';

// QualifierResponse — the JSON shape the Qualifier LLM returns
// Mirrors output-format.prompt.md in the qualifier prompt folder

export interface HiddenTechnicalRisk {
  title: string;
  whyItMatters: string;
  impactAreas: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidenceOrReason: string;
}

export interface MissingInfo {
  item: string;
  whyItMatters: string;
}

export interface DiscoveryQuestion {
  priority: number;
  question: string;
  riskReducedIfAnswered: string;
}

export interface QualifierResponse {
  customerObjective: {
    statedGoal: string;
    likelyUnderlyingOutcome: string;
  };
  factsObserved: string[];
  inferredAssumptions: string[];
  hiddenTechnicalRisks: HiddenTechnicalRisk[];
  missingCriticalInformation: MissingInfo[];
  discoveryQuestionsToAskNext: DiscoveryQuestion[];
  overallPresalesAssessment: {
    confidenceLevel: 'low' | 'medium' | 'high';
    recommendedPosture: 'proceed' | 'proceed with caution' | 'do not commit yet';
    rationale: string;
  };
  immediateNextActions: {
    sales: string[];
    solutionTeam: string[];
    customerValidation: string[];
  };
  pricingOutput: PricingOutput | null; // null until Calculator tier runs
}
