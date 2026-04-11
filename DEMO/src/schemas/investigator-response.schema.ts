import { RiskSlot } from '../types/risk-slot.types';

// InvestigatorResponse — the JSON shape the Investigator LLM returns each turn
export interface SlotInference {
  slot: string;
  inferredValue: string;
  confidence: 'low' | 'medium' | 'high';
  reason: string;
}

export interface InvestigatorResponse {
  updatedSlots: Partial<RiskSlot>;
  nextQuestionToUser: string;
  inferencesMade: SlotInference[];
  allSlotsFilled: boolean;
}
