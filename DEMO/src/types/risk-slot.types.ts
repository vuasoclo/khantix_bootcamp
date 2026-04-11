// Risk slot types — derived from heuristic_matrix.csv Slot_Target columns
// These are the "variables" the Investigator tier collects and the Calculator consumes.

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'FALLBACK';
export type HardwareTier = 'TIER_SMALL' | 'TIER_LARGE';
export type ScopeSize = 'SMALL' | 'ENTERPRISE';
export type ClientSize = 'SMB' | 'ENTERPRISE';
export type PaymentTerm = 'UPFRONT' | 'INSTALLMENT';
export type RushLevel = 'LOW' | 'HIGH';

export interface RiskSlot {
  Data_Risk: RiskLevel | null;
  Integration_Risk: RiskLevel | null;
  Tech_Literacy_Risk: RiskLevel | null;
  Hardware_Sizing: HardwareTier | null;
  Scope_Granularity: ScopeSize | null;
  Rush_Factor: RushLevel | null;
  Client_Logo_Size: ClientSize | null;
  Payment_Term: PaymentTerm | null;
}

// A session tracks the conversation state across turns
export interface SessionState {
  sessionId: string;
  slots: RiskSlot;
  filledSlots: Array<keyof RiskSlot>;
  missingSlots: Array<keyof RiskSlot>;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  createdAt: Date;
  updatedAt: Date;
}

export const EMPTY_SLOTS: RiskSlot = {
  Data_Risk: null,
  Integration_Risk: null,
  Tech_Literacy_Risk: null,
  Hardware_Sizing: null,
  Scope_Granularity: null,
  Rush_Factor: null,
  Client_Logo_Size: null,
  Payment_Term: null,
};
