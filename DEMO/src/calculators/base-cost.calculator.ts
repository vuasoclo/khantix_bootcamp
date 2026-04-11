import { InternalConfig } from '../types/internal-config.types';
import { RiskSlot } from '../types/risk-slot.types';

// Layer 1: Base Cost Calculator
// Formula (from Hybrid System doc):
//   Cost = (License_Base + Modules_Addon) + (ManDays_Est × Rate_Role)
// No risk buffers are applied here — this is the raw cost floor.

export interface BaseCostInput {
  slots: RiskSlot;
  estimatedManDays: number;  // rough effort estimate before risk adjustment
  primaryRole: 'Junior' | 'Senior' | 'PM' | 'BA';
  userCount: number;
  includesOnsite: boolean;
}

export interface BaseCostResult {
  laborCost: number;       // ManDays × Rate
  serverCost: number;      // Hardware cost based on user count
  licenseCost: number;     // Base license (reuse factor applied)
  totalBaseCost: number;   // Sum of all above
}

export function calculateBaseCost(
  input: BaseCostInput,
  config: InternalConfig
): BaseCostResult {
  const rateMap = {
    Junior: config.Rate_Dev_Junior,
    Senior: config.Rate_Dev_Senior,
    PM:     config.Rate_PM,
    BA:     config.Rate_BA,
  };

  const dailyRate = rateMap[input.primaryRole];
  const onsiteMultiplier = input.includesOnsite ? config.Location_Onsite_Multiplier : 1.0;
  const laborCost = input.estimatedManDays * dailyRate * onsiteMultiplier;

  const userBuckets = Math.ceil(input.userCount / 1000);
  const serverCost = Math.max(1, userBuckets) * config.Server_Base_Cost_Per_1K_Users;

  // License cost uses reuse factor: portion of infra that can reuse existing libs
  const rawLicenseCost = laborCost * 0.2; // 20% of labor as baseline license cost
  const licenseCost = rawLicenseCost * (1 - config.Reuse_Factor_Default);

  const totalBaseCost = laborCost + serverCost + licenseCost;

  return { laborCost, serverCost, licenseCost, totalBaseCost };
}
