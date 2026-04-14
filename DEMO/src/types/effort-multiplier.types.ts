// Effort Multiplier Types — COCOMO-based pricing model
// Each EM maps 1:1 with a sub-parameter in the Pricing Dictionary

export type EM_ID =
  | 'EM_D1' // Data Format
  | 'EM_D2' // Data Volume
  | 'EM_D3' // Data Integrity
  | 'EM_I1' // API Availability
  | 'EM_I2' // Legacy System Age
  | 'EM_T1' // End-user Age
  | 'EM_T2' // Prior System Experience
  | 'EM_B1' // Deployment Location
  | 'EM_B2' // Hardware Dependency
  | 'EM_C1' // Rush Factor
  | 'EM_C2' // Client Logo Size
  | 'EM_C3'; // Payment Term (discount, not multiplier)

export type Confidence = 'high' | 'medium' | 'low';

export type EvidenceSource =
  | 'direct_customer_statement'
  | 'ai_inference_from_industry'
  | 'ai_inference_from_context'
  | 'unknown_after_3_attempts';

export interface AISlotEstimate {
  value: number | null;
  evidence: string | null;
  reasoning: string | null;
}

// ─── State Reconciliation: EM Lifecycle ───────────────────────────────────────
// EMPTY → AI_PENDING (AI filled, awaiting Pre-sales review)
//       → CONFIRMED (Pre-sales approved or adjusted)
//       → AI_PENDING (AI updated with new evidence from later round)

export type EMStatus = 'empty' | 'ai_pending' | 'confirmed';

export interface EffortMultiplierEstimate {
  em_id: EM_ID;
  name: string;
  value: number | null;          // AI estimate (e.g. 1.15), null if unknown
  range: [number, number];       // [EM_Min, EM_Max] from heuristic CSV
  defaultValue: number;
  confidence: Confidence | null;
  source: EvidenceSource;
  evidence: string | null;       // Direct quote from customer
  reasoning: string | null;      // Current (latest) reasoning
  reasoningHistory: string[];    // Array of all reasonings recorded for this EM
  status: EMStatus;              // Lifecycle state
  confirmedBy: string | null;    // 'pre-sales' or null
  confirmReason: string | null;  // Reason when Pre-sales adjusts
  previousValue: number | null;  // Value before last UPDATE (for audit trail)
}

export interface EffortMultiplierSet {
  multipliers: EffortMultiplierEstimate[];
  compoundMultiplier: number;    // Product of all non-null EM values
  effectiveBufferPercent: string; // e.g. "+57.1%"
  matchedModules?: { module_id: string; reasoning: string }[];
  roleAllocation?: { [key: string]: AISlotEstimate };
  userCount?: AISlotEstimate;
  estimatedManDays?: number | null;
  primaryRole?: 'Junior' | 'Senior' | 'PM' | 'BA' | null;
  suggestions?: string[];
}

// Dynamic creation relying on loader definitions
export function createEmptyEMSet(definitions: Array<{ em_id: EM_ID; name: string; range: [number, number]; defaultValue: number }>): EffortMultiplierSet {
  return {
    multipliers: definitions.map(def => ({
      em_id: def.em_id,
      name: def.name,
      value: null,
      range: def.range,
      defaultValue: def.defaultValue,
      confidence: null,
      source: 'unknown_after_3_attempts' as EvidenceSource,
      evidence: null,
      reasoning: null,
      reasoningHistory: [],
      status: 'empty' as EMStatus,
      confirmedBy: null,
      confirmReason: null,
      previousValue: null,
    })),
    compoundMultiplier: 1.0,
    effectiveBufferPercent: '+0.0%',
    estimatedManDays: null,
    primaryRole: null,
    suggestions: [],
  };
}
