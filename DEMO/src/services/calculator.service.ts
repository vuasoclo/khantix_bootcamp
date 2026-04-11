import { InternalConfig } from '../types/internal-config.types';
import { SessionState } from '../types/risk-slot.types';
import { PriceBreakdown } from '../types/pricing-output.types';
import { orchestratePricing, OrchestratorInput, CommercialStrategy } from '../calculators/pricing.orchestrator';

// CalculatorService: takes a completed SessionState and produces a PriceBreakdown.

export class CalculatorService {
  run(
    session: SessionState,
    config: InternalConfig,
    opts: {
      estimatedManDays: number;
      primaryRole: OrchestratorInput['primaryRole'];
      userCount: number;
      includesOnsite: boolean;
      strategy: CommercialStrategy;
    }
  ): PriceBreakdown {
    return orchestratePricing(
      {
        slots: session.slots,
        estimatedManDays: opts.estimatedManDays,
        primaryRole: opts.primaryRole,
        userCount: opts.userCount,
        includesOnsite: opts.includesOnsite,
        strategy: opts.strategy,
      },
      config
    );
  }
}
