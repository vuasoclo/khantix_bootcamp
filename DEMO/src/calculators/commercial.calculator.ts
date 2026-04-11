import { InternalConfig } from '../types/internal-config.types';
import { RiskSlot } from '../types/risk-slot.types';
import { PricingTier } from '../types/pricing-output.types';

// Layer 3: Commercial Strategy Calculator
// Formula (from Hybrid System doc):
//   Price_Final = Cost_Total / (1 - TargetMargin%) - Discount
// Generates 3 tiers by adjusting scope and margin per tier.

export type CommercialStrategy = 'HUNTER' | 'FARMER';

export interface CommercialInput {
  adjustedCost: number;      // post-risk total cost
  adjustedManDays: number;
  slots: RiskSlot;
  strategy: CommercialStrategy;
  riskSummary: string[];     // passed from Layer 2, woven into reasonBehind
}

export interface CommercialResult {
  basic: PricingTier;
  standard: PricingTier;
  premium: PricingTier;
  strategy: CommercialStrategy;
}

function deriveTargetMargin(config: InternalConfig): number {
  return config.Margin_NetProfit + config.Margin_RiskPremium + config.Margin_Reinvestment;
}

function applyLogoDiscount(slots: RiskSlot, config: InternalConfig): number {
  return slots.Client_Logo_Size === 'ENTERPRISE'
    ? 1 - (1 - config.K_Strategy_Enterprise_Logo)  // enterprise logo discount baked in
    : 1.0;
}

function applyPaymentDiscount(slots: RiskSlot, config: InternalConfig): number {
  return slots.Payment_Term === 'UPFRONT' ? config.Discount_Full_Payment : 0;
}

export function calculateCommercialTiers(
  input: CommercialInput,
  config: InternalConfig
): CommercialResult {
  const targetMargin = deriveTargetMargin(config);
  const logoFactor = applyLogoDiscount(input.slots, config);
  const paymentDiscount = applyPaymentDiscount(input.slots, config);

  // Price floor before discount
  const priceFloor = input.adjustedCost / (1 - targetMargin);

  // Each tier adjusts scope coverage: Basic 70%, Standard 100%, Premium 130%
  const tierCoverage = { basic: 0.70, standard: 1.00, premium: 1.30 };

  const buildTier = (
    label: string,
    coverage: number,
    extraScope: string[],
    tierMarginBoost: number
  ): PricingTier => {
    const scopedCost = priceFloor * coverage * logoFactor;
    const finalPrice = scopedCost - scopedCost * paymentDiscount + tierMarginBoost;

    const riskLines = input.riskSummary.length > 0
      ? `Risk adjustments applied: ${input.riskSummary.join('; ')}.`
      : 'No significant risk buffers applied.';

    const paymentLine = input.slots.Payment_Term === 'UPFRONT'
      ? ` A ${(paymentDiscount * 100).toFixed(0)}% full-payment discount was applied.`
      : '';

    const strategyLine = input.strategy === 'FARMER'
      ? ' Pricing structured as recurring subscription to maximise long-term contract value.'
      : ' Pricing structured to maximise upfront revenue.';

    return {
      label,
      estimatedPrice: Math.round(finalPrice),
      scope: [
        `${Math.round(input.adjustedManDays * coverage)} man-days of delivery effort`,
        ...extraScope,
      ],
      manDays: Math.round(input.adjustedManDays * coverage),
      marginApplied: targetMargin + tierMarginBoost / finalPrice,
      reasonBehind: `${label} tier covers ${(coverage * 100).toFixed(0)}% of the standard scope. ${riskLines}${paymentLine}${strategyLine}`,
    };
  };

  return {
    basic: buildTier('Basic', tierCoverage.basic, ['Core features only', 'Email support'], 0),
    standard: buildTier('Standard', tierCoverage.standard, ['All core features', 'Priority support', 'Basic training'], priceFloor * 0.05),
    premium: buildTier('Premium', tierCoverage.premium, ['All features + customisation', 'Dedicated PM', 'Full onsite training', 'SLA guarantee'], priceFloor * 0.15),
    strategy: input.strategy,
  };
}
