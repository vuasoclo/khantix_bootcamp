"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuardrailValidatorService = void 0;
class GuardrailValidatorService {
    validate(input) {
        const normalizedModuleIds = input.matchedModuleIds.map((x) => x.toUpperCase());
        const capabilitySet = new Set(input.clientCapabilities.map((x) => x.toLowerCase()));
        let dependencyPass = true;
        let operationPass = true;
        const warnings = [];
        for (const card of input.selectedCards) {
            if (card.blocksIfMissingModules && card.blocksIfMissingModules.length > 0) {
                const hasRequiredModule = card.blocksIfMissingModules.some((required) => normalizedModuleIds.some((moduleId) => this.moduleMatchesRequirement(moduleId, required)));
                if (!hasRequiredModule) {
                    dependencyPass = false;
                    warnings.push(`Dependency: card ${card.cardId} yeu cau module ${card.blocksIfMissingModules.join(', ')} nhung scope hien tai khong co.`);
                }
            }
            const missingCapabilities = card.requiresClientCapability.filter((cap) => !capabilitySet.has(cap.toLowerCase()));
            if (missingCapabilities.length > 0) {
                operationPass = false;
                warnings.push(`Operation: card ${card.cardId} thieu capability ${missingCapabilities.join(', ')} tu phia khach hang.`);
            }
        }
        const mandatoryClauses = this.unique([
            ...(input.tierMandatoryClauses || []),
            ...input.selectedCards.flatMap((x) => x.mandatoryClauses || []),
        ]);
        const riskTransferCount = input.selectedCards.filter((x) => x.category === 'risk_transfer').length;
        const contractPass = riskTransferCount === 0 || mandatoryClauses.length > 0;
        if (!contractPass) {
            warnings.push('Contract: co chuyen giao rui ro nhung chua co dieu khoan bat buoc.');
        }
        const marginFloorPct = input.minMarginFloorPct ?? 0.03;
        const pricingFloorVnd = Math.round(input.baseCostVnd * (1 + marginFloorPct));
        const postDiscountPriceVnd = input.selectedTierPriceVnd - input.coveredGapVnd;
        const pricingIntegrityPass = postDiscountPriceVnd >= pricingFloorVnd;
        if (!pricingIntegrityPass) {
            warnings.push(`Pricing integrity: gia sau dieu chinh (${postDiscountPriceVnd.toLocaleString('vi-VN')} VND) thap hon floor (${pricingFloorVnd.toLocaleString('vi-VN')} VND).`);
        }
        const guardrails = {
            dependencyPass,
            operationPass,
            contractPass,
            pricingIntegrityPass,
            allGuardrailsPass: dependencyPass && operationPass && contractPass && pricingIntegrityPass,
        };
        return {
            guardrails,
            warnings,
            mandatoryClauses,
            pricingFloorVnd,
            postDiscountPriceVnd,
        };
    }
    moduleMatchesRequirement(moduleId, requirement) {
        const required = requirement.toUpperCase().trim();
        if (!required)
            return true;
        if (required.endsWith('*')) {
            const prefix = required.slice(0, -1);
            return moduleId.startsWith(prefix);
        }
        if (required.endsWith('_')) {
            return moduleId.startsWith(required);
        }
        return moduleId === required || moduleId.startsWith(required);
    }
    unique(values) {
        const seen = new Set();
        const out = [];
        for (const value of values) {
            const normalized = value.trim();
            if (!normalized || seen.has(normalized))
                continue;
            seen.add(normalized);
            out.push(normalized);
        }
        return out;
    }
}
exports.GuardrailValidatorService = GuardrailValidatorService;
