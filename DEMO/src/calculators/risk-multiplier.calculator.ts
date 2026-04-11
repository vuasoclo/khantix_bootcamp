import { InternalConfig } from '../types/internal-config.types';
import { RiskSlot } from '../types/risk-slot.types';

// Layer 2: Risk & Complexity Multiplier
// Formula (from Hybrid System doc):
//   Effort_Adjusted = ManDays_Est × (1 + ΣRisk_Factors)
// Each SIMT dimension contributes an additive buffer percentage.

export interface RiskMultiplierResult {
  dataRiskBuffer: number;
  integrationRiskBuffer: number;
  techLiteracyRiskBuffer: number;
  rushFactorMultiplier: number;
  totalRiskMultiplier: number;     // the (1 + ΣRisk) value applied to ManDays
  adjustedManDays: number;
  riskSummary: string[];           // human-readable list of applied buffers (for reasonBehind)
}

// Buffer values sourced from heuristic_matrix.csv Buffer_Percentage column
const RISK_BUFFER_MAP = {
  Data_Risk:          { HIGH: 0.30, MEDIUM: 0.18, LOW: 0.05, FALLBACK: 0.35 },
  Integration_Risk:   { HIGH: 0.25, MEDIUM: 0.12, LOW: 0.00, FALLBACK: 0.25 },
  Tech_Literacy_Risk: { HIGH: 0.15, MEDIUM: 0.07, LOW: 0.00, FALLBACK: 0.10 },
};

export function applyRiskMultipliers(
  slots: RiskSlot,
  baseManDays: number,
  config: InternalConfig
): RiskMultiplierResult {
  const riskSummary: string[] = [];

  // Data Risk
  const dataLevel = slots.Data_Risk ?? 'FALLBACK';
  const dataRiskBuffer = RISK_BUFFER_MAP.Data_Risk[dataLevel as keyof typeof RISK_BUFFER_MAP.Data_Risk]
    ?? config.Risk_Data_Cleansing_Default;
  if (dataRiskBuffer > 0) {
    riskSummary.push(`Data quality risk (${dataLevel}): +${(dataRiskBuffer * 100).toFixed(0)}% buffer on effort`);
  }

  // Integration Risk
  const intLevel = slots.Integration_Risk ?? 'FALLBACK';
  const integrationRiskBuffer = RISK_BUFFER_MAP.Integration_Risk[intLevel as keyof typeof RISK_BUFFER_MAP.Integration_Risk]
    ?? config.Risk_Integration_Default;
  if (integrationRiskBuffer > 0) {
    riskSummary.push(`Integration complexity (${intLevel}): +${(integrationRiskBuffer * 100).toFixed(0)}% buffer on effort`);
  }

  // Tech Literacy Risk
  const techLevel = slots.Tech_Literacy_Risk ?? 'FALLBACK';
  const techLiteracyRiskBuffer = RISK_BUFFER_MAP.Tech_Literacy_Risk[techLevel as keyof typeof RISK_BUFFER_MAP.Tech_Literacy_Risk]
    ?? config.Risk_Tech_Literacy_Default;
  if (techLiteracyRiskBuffer > 0) {
    riskSummary.push(`User tech literacy (${techLevel}): +${(techLiteracyRiskBuffer * 100).toFixed(0)}% buffer on effort`);
  }

  // Rush Factor — multiplicative, not additive
  const rushFactor = slots.Rush_Factor === 'HIGH'
    ? config.K_Strategy_Rush_Factor
    : 1.0;
  if (rushFactor > 1.0) {
    riskSummary.push(`Rush delivery requested: ×${rushFactor} applied to total effort`);
  }

  const totalAdditiveBuffer = dataRiskBuffer + integrationRiskBuffer + techLiteracyRiskBuffer;
  const totalRiskMultiplier = (1 + totalAdditiveBuffer) * rushFactor;
  const adjustedManDays = baseManDays * totalRiskMultiplier;

  return {
    dataRiskBuffer,
    integrationRiskBuffer,
    techLiteracyRiskBuffer,
    rushFactorMultiplier: rushFactor,
    totalRiskMultiplier,
    adjustedManDays,
    riskSummary,
  };
}
