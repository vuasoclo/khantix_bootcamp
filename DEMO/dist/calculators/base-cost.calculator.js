"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateBaseCost = calculateBaseCost;
function calculateBaseCost(input, config) {
    const rateMap = {
        Junior: config.Rate_Dev_Junior,
        Senior: config.Rate_Dev_Senior,
        PM: config.Rate_PM,
        BA: config.Rate_BA,
    };
    const dailyRate = rateMap[input.primaryRole];
    const onsiteMultiplier = input.includesOnsite ? config.Location_Onsite_Multiplier : 1.0;
    const laborCost = input.estimatedManDays * dailyRate * onsiteMultiplier;
    const concurrentUsers = input.concurrentUsers ?? Math.max(1, Math.ceil(input.userCount * 0.1));
    const userBuckets = Math.max(1, Math.ceil(concurrentUsers / 100));
    const moduleStorageGB = (input.matchedModules || []).reduce((sum, m) => sum + (m.storageQuotaGBPerUser || 0) * input.userCount, 0);
    const expectedStorageGB = input.expectedStorageGB ?? moduleStorageGB;
    const availabilityMultiplier = input.requiresHighAvailability ? 1.5 : 1.0;
    const serverCost = (config.Server_Base_Infra_Cost +
        userBuckets * config.Server_Cost_Per_100_Users +
        expectedStorageGB * config.Storage_Cost_Per_GB) *
        availabilityMultiplier;
    const moduleLicenseCost = (input.matchedModules || []).reduce((sum, m) => sum + (m.licenseCostBase || 0), 0);
    const rawLicenseCost = moduleLicenseCost > 0 ? moduleLicenseCost : laborCost * 0.2;
    const licenseCost = rawLicenseCost * (1 - config.Reuse_Factor_Default);
    const totalBaseCost = laborCost + serverCost + licenseCost;
    return { laborCost, serverCost, licenseCost, totalBaseCost };
}
