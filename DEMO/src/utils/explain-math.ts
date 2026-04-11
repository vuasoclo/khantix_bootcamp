import { PricingOutput, PricingTier } from '../types/pricing-output.types';

// Formats a PricingTier's numbers into a plain-English sentence
// used as the reasonBehind field value.
// The LLM does NOT generate this — backend math does.

export function formatTierReason(
  tier: PricingTier,
  riskSummary: string[]
): string {
  const priceFormatted = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(tier.estimatedPrice);

  const riskLine =
    riskSummary.length > 0
      ? `The price includes extra time set aside for: ${riskSummary.join('; ')}.`
      : 'No significant risk adjustments were needed for this project.';

  return (
    `The ${tier.label} tier covers ${tier.manDays} working days of effort at a total of ${priceFormatted}. ` +
    `${riskLine} ` +
    `A ${(tier.marginApplied * 100).toFixed(1)}% margin is included to cover company overhead and reinvestment.`
  );
}

// Applies plain-English reasons to all tiers in a PricingOutput (mutates in place)
export function annotateReasons(
  output: PricingOutput,
  riskSummary: string[]
): PricingOutput {
  output.basic.reasonBehind    = formatTierReason(output.basic, riskSummary);
  output.standard.reasonBehind = formatTierReason(output.standard, riskSummary);
  output.premium.reasonBehind  = formatTierReason(output.premium, riskSummary);
  return output;
}
