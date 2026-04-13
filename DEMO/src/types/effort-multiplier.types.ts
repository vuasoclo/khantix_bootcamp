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

export interface EffortMultiplierEstimate {
  em_id: EM_ID;
  name: string;
  value: number | null;          // AI estimate (e.g. 1.15), null if unknown
  range: [number, number];       // [EM_Min, EM_Max] from heuristic CSV
  confidence: Confidence | null;
  source: EvidenceSource;
  evidence: string | null;       // Direct quote from customer
  reasoning: string | null;      // Why AI chose this number
  presalesNote?: string;         // Note for Pre-sales if manual review needed
}

export interface EffortMultiplierSet {
  multipliers: EffortMultiplierEstimate[];
  compoundMultiplier: number;    // Product of all non-null EM values
  effectiveBufferPercent: string; // e.g. "+57.1%"
}

// Dynamic creation relying on loader definitions
export function createEmptyEMSet(definitions: Array<{ em_id: EM_ID; name: string; range: [number, number]; defaultValue: number }>): EffortMultiplierSet {
  return {
    multipliers: definitions.map(def => ({
      em_id: def.em_id,
      name: def.name,
      value: null,
      range: def.range,
      confidence: null,
      source: 'unknown_after_3_attempts' as EvidenceSource,
      evidence: null,
      reasoning: null,
    })),
    compoundMultiplier: 1.0,
    effectiveBufferPercent: '+0.0%',
  };
}
