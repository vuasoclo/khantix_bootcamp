// PriceBreakdown — the new core output of the system.
// Instead of 3 tiers, we produce ONE recommended price
// along with a full, traceable justification for every number.

export interface CostLineItem {
  category: string;         // e.g. "Labor", "Server Infrastructure", "License"
  amount: number;           // VND
  explanation: string;      // plain English: what this covers and why
}

export interface RiskAdjustment {
  dimension: string;        // e.g. "Data Migration", "Integration Complexity", "Training"
  level: string;            // e.g. "HIGH", "LOW"
  bufferApplied: number;    // e.g. 0.30
  extraDays: number;        // extra man-days added because of this risk
  why: string;              // plain English: why this risk adds cost
}

export interface MarginBreakdown {
  netProfitPct: number;
  riskPremiumPct: number;
  reinvestmentPct: number;
  totalMarginPct: number;
  totalMarginAmount: number;
  why: string;              // plain English: what the margin covers
}

export interface PriceBreakdown {
  // The number
  recommendedPrice: number;          // final recommended price in VND

  // The story — ordered list of explanations Sales reads top-to-bottom
  narrative: string[];               // paragraph-level plain-English justification

  // The math — traceable line items
  costLineItems: CostLineItem[];     // sums to baseCost
  riskAdjustments: RiskAdjustment[]; // explains every buffer applied
  marginBreakdown: MarginBreakdown;  // explains profit margin

  // Intermediates — for internal audit, not shown to client
  _debug: {
    baseManDays: number;
    adjustedManDays: number;
    baseCost: number;
    adjustedCost: number;
    totalRiskMultiplier: number;
    strategy: string;
  };

  calculatedAt: Date;
}

// ─── Legacy compatibility aliases ────────────────────────────────────────────
// These exist so older scaffolded files (commercial.calculator, explain-math,
// qualifier-response) continue to compile without modification.

/** @deprecated — use PriceBreakdown instead */
export interface PricingTier {
  label: string;
  estimatedPrice: number;
  scope: string[];
  manDays: number;
  marginApplied: number;
  reasonBehind: string;
}

/** @deprecated — use PriceBreakdown instead */
export interface PricingOutput {
  basic: PricingTier;
  standard: PricingTier;
  premium: PricingTier;
  strategy: string;
}

