"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateWithEM = calculateWithEM;
// ─── Helpers ──────────────────────────────────────────────────────────────────
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
/** Resolve an EM value: use AI estimate if present, else default */
function resolveEM(em, emDefinitions) {
    if (em.value !== null) {
        return clamp(em.value, em.range[0], em.range[1]);
    }
    return emDefinitions.get(em.em_id)?.defaultValue ?? 1.0;
}
function getEM(emSet, id) {
    return emSet.multipliers.find(m => m.em_id === id);
}
function getEMValue(emSet, id, emDefinitions) {
    return resolveEM(getEM(emSet, id), emDefinitions);
}
const formatVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
// ─── Main Calculator ─────────────────────────────────────────────────────────
function calculateWithEM(input, config) {
    const { emSet, estimatedManDays, primaryRole, userCount } = input;
    // ── Layer 1: Base Cost ────────────────────────────────────────────────────
    const rateMap = {
        Junior: config.Rate_Dev_Junior,
        Senior: config.Rate_Dev_Senior,
        PM: config.Rate_PM,
        BA: config.Rate_BA,
    };
    const dailyRate = rateMap[primaryRole];
    // EM_B1: Deployment Location multiplier applied to labor
    const deploymentEM = getEMValue(emSet, 'EM_B1', input.emDefinitions);
    const laborCost = estimatedManDays * dailyRate * deploymentEM;
    // Server cost
    const userBuckets = Math.ceil(userCount / 1000);
    const hwDependencyEM = getEMValue(emSet, 'EM_B2', input.emDefinitions);
    const serverCost = Math.max(1, userBuckets) * config.Server_Base_Cost_Per_1K_Users * hwDependencyEM;
    // License cost
    const rawLicenseCost = laborCost * 0.2;
    const licenseCost = rawLicenseCost * (1 - config.Reuse_Factor_Default);
    const baseCost = laborCost + serverCost + licenseCost;
    // ── Layer 2: Risk-adjusted Effort (COCOMO compound multiplication) ──────
    const riskEMIds = ['EM_D1', 'EM_D2', 'EM_D3', 'EM_I1', 'EM_I2', 'EM_T1', 'EM_T2'];
    let riskCompound = 1.0;
    for (const id of riskEMIds) {
        riskCompound *= getEMValue(emSet, id, input.emDefinitions);
    }
    const adjustedManDays = estimatedManDays * riskCompound;
    const adjustedCost = (adjustedManDays / estimatedManDays) * baseCost;
    // ── Layer 3: Commercial ─────────────────────────────────────────────────
    const totalMarginPct = config.Margin_NetProfit + config.Margin_RiskPremium + config.Margin_Reinvestment;
    // EM_C1: Rush Factor
    const rushEM = getEMValue(emSet, 'EM_C1', input.emDefinitions);
    // EM_C2: Client Logo (discount multiplier, <1 means discount)
    const logoEM = getEMValue(emSet, 'EM_C2', input.emDefinitions);
    // EM_C3: Payment Term Discount
    const paymentDiscount = getEMValue(emSet, 'EM_C3', input.emDefinitions);
    const priceBeforeDiscount = (adjustedCost / (1 - totalMarginPct)) * rushEM * logoEM;
    const recommendedPrice = Math.round(priceBeforeDiscount * (1 - paymentDiscount));
    // ── Build cost line items ──────────────────────────────────────────────
    const costLineItems = [
        {
            category: 'Labor',
            amount: laborCost,
            explanation: `${estimatedManDays} man-days × ${formatVND(dailyRate)}/day${deploymentEM > 1 ? ` × ${deploymentEM} onsite multiplier` : ''}.`,
        },
        {
            category: 'Server & Infrastructure',
            amount: serverCost,
            explanation: `Server cost for ~${userCount} users${hwDependencyEM > 1 ? `, with ×${hwDependencyEM.toFixed(2)} for additional dependencies (SMS, 3rd-party APIs)` : ''}.`,
        },
        {
            category: 'License & Reuse',
            amount: licenseCost,
            explanation: `License cost reduced by ${(config.Reuse_Factor_Default * 100).toFixed(0)}% reuse factor.`,
        },
    ];
    // ── Build risk adjustments (evidence-based) ────────────────────────────
    const riskAdjustments = [];
    for (const id of riskEMIds) {
        const em = getEM(emSet, id);
        const emValue = resolveEM(em, input.emDefinitions);
        if (emValue > 1.0) {
            riskAdjustments.push({
                dimension: em.name,
                level: em.confidence ?? 'default',
                bufferApplied: emValue - 1,
                extraDays: Math.round(estimatedManDays * (emValue - 1)),
                why: em.evidence && em.reasoning
                    ? `${em.reasoning} (Evidence: "${em.evidence}")`
                    : `Default estimate applied: ×${emValue.toFixed(2)} for ${em.name}.`,
            });
        }
    }
    // ── Build margin breakdown ─────────────────────────────────────────────
    const totalMarginAmount = adjustedCost * (totalMarginPct / (1 - totalMarginPct));
    const marginBreakdown = {
        netProfitPct: config.Margin_NetProfit,
        riskPremiumPct: config.Margin_RiskPremium,
        reinvestmentPct: config.Margin_Reinvestment,
        totalMarginPct,
        totalMarginAmount,
        why: `Total margin: ${(totalMarginPct * 100).toFixed(1)}% (${(config.Margin_NetProfit * 100).toFixed(1)}% profit + ${(config.Margin_RiskPremium * 100).toFixed(1)}% risk premium + ${(config.Margin_Reinvestment * 100).toFixed(1)}% reinvestment).`,
    };
    // ── Build narrative (evidence-driven, not template) ────────────────────
    const narrative = [];
    narrative.push(`The recommended price for this project is ${formatVND(recommendedPrice)}. ` +
        `This was calculated using the COCOMO Effort Multiplier model with ${riskAdjustments.length} risk factors identified.`);
    narrative.push(`Base cost is ${formatVND(baseCost)}, covering labor (${Math.round(laborCost / baseCost * 100)}%), ` +
        `infrastructure (${Math.round(serverCost / baseCost * 100)}%), and licensing.`);
    if (riskAdjustments.length > 0) {
        const compoundPct = ((riskCompound - 1) * 100).toFixed(1);
        narrative.push(`Risk analysis identified ${riskAdjustments.length} compound risk factors, ` +
            `increasing delivery effort by +${compoundPct}% ` +
            `(from ${estimatedManDays} to ${Math.round(adjustedManDays)} man-days). ` +
            `Key risks: ${riskAdjustments.map(r => r.dimension).join(', ')}.`);
    }
    if (rushEM > 1.0) {
        narrative.push(`Rush delivery (×${rushEM.toFixed(2)}) applied due to compressed timeline.`);
    }
    if (logoEM < 1.0) {
        narrative.push(`Strategic enterprise discount (×${logoEM.toFixed(2)}) applied for long-term partnership value.`);
    }
    if (paymentDiscount > 0) {
        narrative.push(`${(paymentDiscount * 100).toFixed(0)}% early payment discount applied.`);
    }
    narrative.push(marginBreakdown.why);
    return {
        recommendedPrice,
        narrative,
        costLineItems,
        riskAdjustments,
        marginBreakdown,
        _debug: {
            baseManDays: estimatedManDays,
            adjustedManDays,
            baseCost,
            adjustedCost,
            compoundMultiplier: riskCompound,
        },
        calculatedAt: new Date(),
    };
}
