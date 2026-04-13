import { EffortMultiplierEstimate } from '../types/effort-multiplier.types';

// InvestigatorResponse — the JSON shape the Investigator LLM returns each turn
// Updated for COCOMO Effort Multiplier model

export interface EMEstimateFromLLM {
  em_id: string;
  value: number | null;
  confidence: 'low' | 'medium' | 'high' | null;
  source: string;
  evidence: string | null;
  reasoning: string | null;
}

export interface InvestigatorResponse {
  effortMultipliers: EMEstimateFromLLM[];
  estimatedManDays?: number | null;
  primaryRole?: 'Junior' | 'Senior' | 'PM' | 'BA' | null;
  suggestions: string[];
  allSlotsFilled: boolean;
}
