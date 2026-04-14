import { EffortMultiplierEstimate } from '../types/effort-multiplier.types';

// InvestigatorResponse — the JSON shape the Investigator LLM returns each turn
// Updated for State Reconciliation model (FILL/UPDATE/RETRACT)

export type EMAction = 'FILL' | 'UPDATE' | 'RETRACT';

export interface EMEstimateFromLLM {
  em_id: string;
  action: EMAction;                // NEW: what action to take
  value: number | null;
  confidence: 'low' | 'medium' | 'high' | null;
  source: string;
  evidence: string | null;
  reasoning: string | null;
}

export interface InvestigatorResponse {
  effortMultipliers: EMEstimateFromLLM[];
  matchedModules?: { module_id: string; reasoning: string }[];
  roleAllocation?: {
    BA?: { value: number | null; evidence: string | null; reasoning: string | null };
    Senior?: { value: number | null; evidence: string | null; reasoning: string | null };
    Junior?: { value: number | null; evidence: string | null; reasoning: string | null };
    QA?: { value: number | null; evidence: string | null; reasoning: string | null };
    PM?: { value: number | null; evidence: string | null; reasoning: string | null };
  };
  userCount?: { value: number | null; evidence: string | null; reasoning: string | null };
  concurrent_users?: {
    value: number | null;
    confidence: 'low' | 'medium' | 'high' | null;
    is_extracted: boolean;
    evidence: string | null;
    reasoning: string | null;
  };
  expected_storage_gb?: {
    value: number | null;
    confidence: 'low' | 'medium' | 'high' | null;
    is_extracted: boolean;
    evidence: string | null;
    reasoning: string | null;
  };
  requires_high_availability?: {
    value: boolean | null;
    confidence: 'low' | 'medium' | 'high' | null;
    is_extracted: boolean;
    evidence: string | null;
    reasoning: string | null;
  };
  estimatedManDays?: number | null;
  primaryRole?: 'Junior' | 'Senior' | 'PM' | 'BA' | null;
  suggestions: string[];
  allSlotsFilled: boolean;
}
