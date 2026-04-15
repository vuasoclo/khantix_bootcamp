"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateWithEM = calculateWithEM;
const module_catalog_loader_1 = require("../config/module-catalog.loader");
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
    const { emSet, roleAllocation, userCount } = input;
    const moduleCatalog = (0, module_catalog_loader_1.loadModuleCatalog)();
    const matchedModules = emSet.matchedModules || [];
    const matchedCatalogEntries = matchedModules
        .map((m) => ({
        match: m,
        catalog: moduleCatalog.find((c) => c.moduleId === m.module_id),
    }))
        .filter((x) => x.catalog);
    const estimatedManDays = roleAllocation.BA + roleAllocation.Senior + roleAllocation.Junior + roleAllocation.PM;
    // ── Layer 1: Base Cost ────────────────────────────────────────────────────
    const baseLaborCostRaw = (roleAllocation.Junior * config.Rate_Dev_Junior) +
        (roleAllocation.Senior * config.Rate_Dev_Senior) +
        (roleAllocation.PM * config.Rate_PM) +
        (roleAllocation.BA * config.Rate_BA);
    // EM_B1: Deployment Location multiplier applied to labor
    const deploymentEM = getEMValue(emSet, 'EM_B1', input.emDefinitions);
    const laborCost = baseLaborCostRaw * deploymentEM;
    // Server cost (Infrastructure model)
    const concurrentUsers = typeof emSet.concurrent_users?.value === 'number' && emSet.concurrent_users.value > 0
        ? emSet.concurrent_users.value
        : Math.max(1, Math.ceil(userCount * 0.1));
    const userBuckets = Math.max(1, Math.ceil(concurrentUsers / 100));
    const moduleEstimatedStorageGB = matchedCatalogEntries.reduce((sum, x) => sum + (x.catalog?.storageQuotaGBPerUser || 0) * userCount, 0);
    const expectedStorageGB = typeof emSet.expected_storage_gb?.value === 'number' && emSet.expected_storage_gb.value > 0
        ? emSet.expected_storage_gb.value
        : moduleEstimatedStorageGB;
    const requiresHA = emSet.requires_high_availability?.value === true;
    const availabilityMultiplier = requiresHA ? 1.5 : 1.0;
    const baseInfraCost = config.Server_Base_Infra_Cost;
    const computeScaleCost = userBuckets * config.Server_Cost_Per_100_Users;
    const storageCost = expectedStorageGB * config.Storage_Cost_Per_GB;
    const hwDependencyEM = getEMValue(emSet, 'EM_B2', input.emDefinitions);
    const rawServerCost = (baseInfraCost + computeScaleCost + storageCost) * availabilityMultiplier;
    const serverCost = rawServerCost * hwDependencyEM;
    // License cost (module catalog model)
    const rawLicenseCostFromModules = matchedCatalogEntries.reduce((sum, x) => sum + (x.catalog?.licenseCostBase || 0), 0);
    const fallbackRawLicense = laborCost * 0.2;
    const rawLicenseCost = rawLicenseCostFromModules > 0 ? rawLicenseCostFromModules : fallbackRawLicense;
    const licenseCost = rawLicenseCost * (1 - config.Reuse_Factor_Default);
    const baseCost = laborCost + serverCost + licenseCost;
    // ── Layer 2: Risk-adjusted Effort (COCOMO compound multiplication) ──────
    const riskEMIds = ['EM_D1', 'EM_D2', 'EM_D3', 'EM_I1', 'EM_I2', 'EM_T1', 'EM_T2'];
    let riskCompound = 1.0;
    for (const id of riskEMIds) {
        riskCompound *= getEMValue(emSet, id, input.emDefinitions);
    }
    const adjustedManDays = estimatedManDays * riskCompound;
    const adjustedCost = estimatedManDays > 0
        ? (adjustedManDays / estimatedManDays) * baseCost
        : baseCost;
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
            explanation: `${estimatedManDays} man-days (BA: ${roleAllocation.BA}, PM: ${roleAllocation.PM}, Senior: ${roleAllocation.Senior}, Junior: ${roleAllocation.Junior})${deploymentEM > 1 ? ` × ${deploymentEM} onsite multiplier` : ''}.`,
            components: [
                {
                    name: 'Role Allocation Cost',
                    value: Math.round(baseLaborCostRaw),
                    reason: `BA/PM/Senior/Junior rates from internal config`,
                    citation: `Role allocation from matched modules and pre-sales overrides`,
                },
                {
                    name: 'Deployment Multiplier (EM_B1)',
                    value: deploymentEM,
                    reason: deploymentEM > 1 ? 'Onsite / special deployment increases labor cost' : 'Default remote deployment',
                    citation: getEM(emSet, 'EM_B1').evidence || 'EM_B1 default from heuristic matrix',
                },
            ],
        },
        {
            category: 'Server & Infrastructure',
            amount: serverCost,
            explanation: `Base infra + compute by concurrent users + storage usage${requiresHA ? ' + high availability uplift' : ''}` +
                `${hwDependencyEM > 1 ? `, multiplied by EM_B2 ×${hwDependencyEM.toFixed(2)}.` : '.'}`,
            components: [
                {
                    name: 'Base Infra Cost',
                    value: Math.round(baseInfraCost),
                    reason: 'Always-on cloud baseline (VM/DB/Network minimum)',
                    citation: 'internal_configs.Server_Base_Infra_Cost',
                },
                {
                    name: 'Compute Scale Cost',
                    value: Math.round(computeScaleCost),
                    reason: `${userBuckets} bucket(s) from concurrent users (${concurrentUsers} CCU)`,
                    citation: emSet.concurrent_users?.evidence ||
                        `Derived fallback = 10% of total users (${userCount})`,
                },
                {
                    name: 'Storage Cost',
                    value: Math.round(storageCost),
                    reason: `${Math.round(expectedStorageGB)} GB × ${config.Storage_Cost_Per_GB.toLocaleString('vi-VN')} VND/GB`,
                    citation: emSet.expected_storage_gb?.evidence ||
                        (matchedCatalogEntries.length > 0
                            ? 'Estimated from matched module storage quotas'
                            : 'Default storage fallback (no module quota available)'),
                },
                {
                    name: 'High Availability Multiplier',
                    value: availabilityMultiplier,
                    reason: requiresHA ? 'HA required (multi-zone/failover)' : 'Standard availability',
                    citation: emSet.requires_high_availability?.evidence || 'HA default = off',
                },
                {
                    name: 'Hardware Dependency Multiplier (EM_B2)',
                    value: hwDependencyEM,
                    reason: hwDependencyEM > 1 ? 'Special hardware / infra dependency detected' : 'No extra hardware dependency',
                    citation: getEM(emSet, 'EM_B2').evidence || 'EM_B2 default from heuristic matrix',
                },
            ],
        },
        {
            category: 'License & Reuse',
            amount: licenseCost,
            explanation: rawLicenseCostFromModules > 0
                ? `Sum of matched module license base prices, reduced by ${(config.Reuse_Factor_Default * 100).toFixed(1)}% reuse factor.`
                : `Fallback: ${Math.round(fallbackRawLicense).toLocaleString('vi-VN')} VND (20% labor baseline) reduced by reuse factor because no priced modules were matched.`,
            components: [
                {
                    name: 'Module License Base Sum',
                    value: Math.round(rawLicenseCost),
                    reason: rawLicenseCostFromModules > 0
                        ? `${matchedCatalogEntries.length} matched module(s) contribute to license value`
                        : 'No priced module matched, using temporary fallback model',
                    citation: rawLicenseCostFromModules > 0
                        ? matchedCatalogEntries
                            .slice(0, 4)
                            .map((x) => `${x.catalog?.moduleId}: ${x.match.reasoning || 'matched by AI'}`)
                            .join(' | ')
                        : 'Matched modules not available',
                },
                {
                    name: 'Reuse Factor Discount',
                    value: config.Reuse_Factor_Default,
                    reason: 'Discount for reusable internal assets/components',
                    citation: 'internal_configs.Reuse_Factor_Default',
                },
            ],
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
