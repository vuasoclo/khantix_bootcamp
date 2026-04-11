import { InternalConfig } from '../types/internal-config.types';
import { RiskSlot } from '../types/risk-slot.types';
import { PriceBreakdown, CostLineItem, RiskAdjustment, MarginBreakdown } from '../types/pricing-output.types';
import { BaseCostResult, calculateBaseCost } from './base-cost.calculator';
import { RiskMultiplierResult, applyRiskMultipliers } from './risk-multiplier.calculator';
import { BaseCostInput } from './base-cost.calculator';

export type CommercialStrategy = 'HUNTER' | 'FARMER';

export interface OrchestratorInput {
  slots: RiskSlot;
  estimatedManDays: number;
  primaryRole: BaseCostInput['primaryRole'];
  userCount: number;
  includesOnsite: boolean;
  strategy: CommercialStrategy;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCostLineItems(base: BaseCostResult, includesOnsite: boolean, config: InternalConfig): CostLineItem[] {
  return [
    {
      category: 'Labor',
      amount: base.laborCost,
      explanation: `Delivery effort cost. Calculated from the estimated man-days multiplied by the standard daily rate${includesOnsite ? ', with an onsite multiplier of ×' + config.Location_Onsite_Multiplier + ' applied because the team will work at the client\'s premises' : ''}.`,
    },
    {
      category: 'Server & Infrastructure',
      amount: base.serverCost,
      explanation: `Cloud/server cost based on the estimated user count. Scaled by ${config.Server_Base_Cost_Per_1K_Users.toLocaleString('vi-VN')} ₫ per 1,000 users.`,
    },
    {
      category: 'License & Reuse Allowance',
      amount: base.licenseCost,
      explanation: `Software license cost, reduced by a ${(config.Reuse_Factor_Default * 100).toFixed(0)}% reuse credit for components we can adapt from existing work rather than building from scratch.`,
    },
  ];
}

function buildRiskAdjustments(risk: RiskMultiplierResult, slots: RiskSlot, baseManDays: number): RiskAdjustment[] {
  const adjustments: RiskAdjustment[] = [];

  if (risk.dataRiskBuffer > 0) {
    const extraDays = Math.round(baseManDays * risk.dataRiskBuffer);
    adjustments.push({
      dimension: 'Data Migration Quality',
      level: slots.Data_Risk ?? 'FALLBACK',
      bufferApplied: risk.dataRiskBuffer,
      extraDays,
      why: slots.Data_Risk === 'HIGH'
        ? `The customer's existing data is stored in formats like Excel files, handwritten records, or USB drives. Cleaning, validating, and migrating this data is labour-intensive and error-prone, so we add ${extraDays} extra days to cover the data preparation work.`
        : `Data migration carries a moderate level of effort based on the information provided, adding ${extraDays} contingency days.`,
    });
  }

  if (risk.integrationRiskBuffer > 0) {
    const extraDays = Math.round(baseManDays * risk.integrationRiskBuffer);
    adjustments.push({
      dimension: 'System Integration Complexity',
      level: slots.Integration_Risk ?? 'FALLBACK',
      bufferApplied: risk.integrationRiskBuffer,
      extraDays,
      why: slots.Integration_Risk === 'HIGH'
        ? `The project requires connecting to existing third-party software (e.g. MISA, KiotViet, or closed systems without public APIs). These integrations are unpredictable — vendors may be uncooperative, documentation may be missing, and custom bridges need to be built. This adds ${extraDays} extra days.`
        : `Some integration work is expected, adding ${extraDays} contingency days.`,
    });
  }

  if (risk.techLiteracyRiskBuffer > 0) {
    const extraDays = Math.round(baseManDays * risk.techLiteracyRiskBuffer);
    adjustments.push({
      dimension: 'User Training & Adoption',
      level: slots.Tech_Literacy_Risk ?? 'FALLBACK',
      bufferApplied: risk.techLiteracyRiskBuffer,
      extraDays,
      why: slots.Tech_Literacy_Risk === 'HIGH'
        ? `The end users (e.g. warehouse staff, factory workers, or older employees unfamiliar with digital tools) require intensive onboarding. Training sessions, support calls, and revision cycles after go-live add ${extraDays} extra days to our delivery effort.`
        : `Standard training is included, adding ${extraDays} days.`,
    });
  }

  if (risk.rushFactorMultiplier > 1.0) {
    adjustments.push({
      dimension: 'Rush Delivery',
      level: 'HIGH',
      bufferApplied: risk.rushFactorMultiplier - 1,
      extraDays: Math.round(risk.adjustedManDays - (risk.adjustedManDays / risk.rushFactorMultiplier)),
      why: `The customer requires delivery within a compressed timeline. Rush delivery means the team must work in parallel streams and may require overtime, which increases coordination costs and reduces the ability to course-correct mistakes. A ×${risk.rushFactorMultiplier} multiplier is applied to the total effort.`,
    });
  }

  return adjustments;
}

function buildMarginBreakdown(adjustedCost: number, config: InternalConfig): MarginBreakdown {
  const totalMarginPct = config.Margin_NetProfit + config.Margin_RiskPremium + config.Margin_Reinvestment;
  const totalMarginAmount = adjustedCost * (totalMarginPct / (1 - totalMarginPct));

  return {
    netProfitPct: config.Margin_NetProfit,
    riskPremiumPct: config.Margin_RiskPremium,
    reinvestmentPct: config.Margin_Reinvestment,
    totalMarginPct,
    totalMarginAmount,
    why: `The price includes a ${(totalMarginPct * 100).toFixed(1)}% margin, which is made up of: ${(config.Margin_NetProfit * 100).toFixed(1)}% net profit for the company, ${(config.Margin_RiskPremium * 100).toFixed(1)}% risk premium to absorb unforeseen issues that do not appear in the scope, and ${(config.Margin_Reinvestment * 100).toFixed(1)}% reinvestment into tooling, training, and infrastructure.`,
  };
}

function buildNarrative(
  slots: RiskSlot,
  base: BaseCostResult,
  risk: RiskMultiplierResult,
  margin: MarginBreakdown,
  finalPrice: number,
  strategy: CommercialStrategy
): string[] {
  const formatVND = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

  const paragraphs: string[] = [];

  paragraphs.push(
    `The recommended price for this project is ${formatVND(finalPrice)}. ` +
    `This figure was not estimated — it was calculated step by step from the technical realities of this specific project.`
  );

  paragraphs.push(
    `We start from a base cost of ${formatVND(base.totalBaseCost)}, which covers ${Math.round(base.laborCost / base.totalBaseCost * 100)}% in team labor, ` +
    `${Math.round(base.serverCost / base.totalBaseCost * 100)}% in server infrastructure for the expected user volume, and the remainder in software licensing.`
  );

  if (risk.riskSummary.length > 0) {
    paragraphs.push(
      `However, several risk factors specific to this project require us to add contingency time. ` +
      `${risk.riskSummary.join('. ')}. ` +
      `Combined, these risks multiply the base effort by ×${risk.totalRiskMultiplier.toFixed(2)}, ` +
      `bringing the adjusted delivery effort from ${risk.adjustedManDays / risk.totalRiskMultiplier | 0} days to ${Math.round(risk.adjustedManDays)} days.`
    );
  } else {
    paragraphs.push(`No significant risk adjustments were required for this project. The base estimate stands as-is.`);
  }

  paragraphs.push(margin.why);

  if (strategy === 'FARMER') {
    paragraphs.push(
      `Note: This price is structured as a recurring subscription. The setup cost is subsidised in exchange for a multi-year contract commitment, which benefits the customer through lower upfront spend and benefits us through predictable long-term revenue.`
    );
  }

  if (slots.Payment_Term === 'UPFRONT') {
    paragraphs.push(`A 5% early-payment discount has been applied because the customer confirmed they will pay the full amount upfront.`);
  }

  return paragraphs;
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

export function orchestratePricing(input: OrchestratorInput, config: InternalConfig): PriceBreakdown {
  const base = calculateBaseCost(
    {
      slots: input.slots,
      estimatedManDays: input.estimatedManDays,
      primaryRole: input.primaryRole,
      userCount: input.userCount,
      includesOnsite: input.includesOnsite,
    },
    config
  );

  const risk = applyRiskMultipliers(input.slots, input.estimatedManDays, config);

  const adjustedCost = (risk.adjustedManDays / input.estimatedManDays) * base.totalBaseCost;

  const margin = buildMarginBreakdown(adjustedCost, config);
  const paymentDiscount = input.slots.Payment_Term === 'UPFRONT' ? config.Discount_Full_Payment : 0;
  const totalMarginPct = config.Margin_NetProfit + config.Margin_RiskPremium + config.Margin_Reinvestment;
  const priceBeforeDiscount = adjustedCost / (1 - totalMarginPct);
  const recommendedPrice = Math.round(priceBeforeDiscount * (1 - paymentDiscount));

  const costLineItems = buildCostLineItems(base, input.includesOnsite, config);
  const riskAdjustments = buildRiskAdjustments(risk, input.slots, input.estimatedManDays);
  const narrative = buildNarrative(
    input.slots, base, risk, margin, recommendedPrice, input.strategy
  );

  return {
    recommendedPrice,
    narrative,
    costLineItems,
    riskAdjustments,
    marginBreakdown: margin,
    _debug: {
      baseManDays: input.estimatedManDays,
      adjustedManDays: risk.adjustedManDays,
      baseCost: base.totalBaseCost,
      adjustedCost,
      totalRiskMultiplier: risk.totalRiskMultiplier,
      strategy: input.strategy,
    },
    calculatedAt: new Date(),
  };
}
