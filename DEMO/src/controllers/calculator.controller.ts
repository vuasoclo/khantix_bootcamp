import { Request, Response } from 'express';
import { loadInternalConfigs } from '../config/internal-configs.loader';
import { loadHeuristicMatrixV2 } from '../config/heuristic-v2.loader';
import { calculateWithEM, EMCalculatorInput } from '../calculators/em.calculator';
import { generateMarkdownReport } from '../utils/markdown-report.generator';
import { sessionRepository, OverrideLogEntry } from '../repositories/session.repository';

const config = loadInternalConfigs();
const { definitions: emDefinitionsMap } = loadHeuristicMatrixV2();

export const baseReport = (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId query param is required' });
  }

  const userCountOverride = req.query.userCount ? parseInt(req.query.userCount as string, 10) : null;
  const concurrentUsersOverride = req.query.concurrent_users ? parseInt(req.query.concurrent_users as string, 10) : null;
  const expectedStorageGBOverride = req.query.expected_storage_gb ? parseFloat(req.query.expected_storage_gb as string) : null;
  const requiresHAOverride =
    req.query.requires_high_availability !== undefined
      ? String(req.query.requires_high_availability).toLowerCase() === 'true'
      : null;

  let roleAllocationOverride: any = null;
  if (req.query.roleAllocation) {
    try {
      roleAllocationOverride = JSON.parse(req.query.roleAllocation as string);
    } catch {
      roleAllocationOverride = null;
    }
  } else if ((req as any).body?.roleAllocation) {
    roleAllocationOverride = (req as any).body.roleAllocation;
  }

  const serverSession = sessionRepository.get(sessionId);
  if (!serverSession) {
    return res.status(404).json({ error: `Session "${sessionId}" not found` });
  }

  const emSet = serverSession.session.emSet;
  const userCount = userCountOverride ?? (typeof emSet.userCount?.value === 'number' ? emSet.userCount.value : null) ?? 100;

  const effectiveEMSet = {
    ...emSet,
    concurrent_users:
      concurrentUsersOverride !== null && !Number.isNaN(concurrentUsersOverride)
        ? {
            value: concurrentUsersOverride,
            confidence: 'high' as const,
            is_extracted: true,
            evidence: 'Manual override from UI',
            reasoning: 'Pre-sales override via base-report query',
          }
        : emSet.concurrent_users,
    expected_storage_gb:
      expectedStorageGBOverride !== null && !Number.isNaN(expectedStorageGBOverride)
        ? {
            value: expectedStorageGBOverride,
            confidence: 'high' as const,
            is_extracted: true,
            evidence: 'Manual override from UI',
            reasoning: 'Pre-sales override via base-report query',
          }
        : emSet.expected_storage_gb,
    requires_high_availability:
      requiresHAOverride !== null
        ? {
            value: requiresHAOverride,
            confidence: 'high' as const,
            is_extracted: true,
            evidence: 'Manual override from UI',
            reasoning: 'Pre-sales override via base-report query',
          }
        : emSet.requires_high_availability,
  };

  const defaultRoleAllocation = {
    BA: 0,
    Senior: effectiveEMSet.estimatedManDays || 60,
    Junior: 0,
    PM: 0,
  };
  
  let roleAllocation = defaultRoleAllocation;
  if (roleAllocationOverride) {
    roleAllocation = roleAllocationOverride;
  } else if (effectiveEMSet.roleAllocation) {
    roleAllocation = {
      BA: effectiveEMSet.roleAllocation.BA?.value || 0,
      Senior: effectiveEMSet.roleAllocation.Senior?.value || 0,
      Junior: effectiveEMSet.roleAllocation.Junior?.value || 0,
      PM: effectiveEMSet.roleAllocation.PM?.value || 0,
    };
  }

  const calcResult = calculateWithEM(
    {
      emSet: effectiveEMSet,
      roleAllocation,
      userCount,
      emDefinitions: emDefinitionsMap,
    },
    config
  );

  const laborCost = calcResult.costLineItems.find((x) => x.category === 'Labor')?.amount || 0;
  const serverCost = calcResult.costLineItems.find((x) => x.category === 'Server & Infrastructure')?.amount || 0;
  const licenseCost = calcResult.costLineItems.find((x) => x.category === 'License & Reuse')?.amount || 0;
  const baseCost = calcResult._debug.baseCost;
  const totalRecommendedPrice = calcResult.recommendedPrice;
  const manDays = roleAllocation.BA + roleAllocation.Senior + roleAllocation.Junior + roleAllocation.PM;

  const filledEMs = effectiveEMSet.multipliers
    .filter(m => m.value !== null)
    .map(m => ({
      em_id: m.em_id,
      name: m.name,
      value: m.value,
      confidence: m.confidence,
      evidence: m.evidence,
      reasoning: m.reasoning,
      reasoningHistory: m.reasoningHistory,
    }));

  const missingEMs = effectiveEMSet.multipliers
    .filter(m => m.value === null)
    .map(m => ({
      em_id: m.em_id,
      name: m.name,
      range: m.range,
    }));

  const serverLine = calcResult.costLineItems.find((x) => x.category === 'Server & Infrastructure');
  const licenseLine = calcResult.costLineItems.find((x) => x.category === 'License & Reuse');

  console.log(`[BaseReport] ${sessionId} | Total: ${totalRecommendedPrice.toLocaleString()} VND (Base: ${baseCost.toLocaleString()}) | Filled: ${filledEMs.length}/12`);

  return res.json({
    sessionId,
    workflowPhase: 'base_ready',
    threeTierReady: false,
    baseCost,
    totalRecommendedPrice,
    estimatedManDays: manDays,
    roleAllocation,
    laborCost,
    serverCost,
    licenseCost,
    compoundMultiplier: calcResult._debug.compoundMultiplier,
    effectiveBufferPercent: `+${((calcResult._debug.compoundMultiplier - 1) * 100).toFixed(1)}%`,
    filledEMs,
    missingEMs,
    filledCount: filledEMs.length,
    missingCount: missingEMs.length,
    suggestions: effectiveEMSet.suggestions || [],
    narrative: calcResult.narrative,
    infrastructureBreakdown: serverLine?.components || [],
    licenseBreakdown: licenseLine?.components || [],
    pricingEvidence: {
      userCount: effectiveEMSet.userCount,
      concurrent_users: effectiveEMSet.concurrent_users,
      expected_storage_gb: effectiveEMSet.expected_storage_gb,
      requires_high_availability: effectiveEMSet.requires_high_availability,
      matchedModules: effectiveEMSet.matchedModules || [],
    },
  });
};

export const calculate = (req: Request, res: Response) => {
  const { sessionId, roleAllocation, userCount } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const serverSession = sessionRepository.get(sessionId);
  if (!serverSession) {
    return res.status(404).json({ error: `Session "${sessionId}" not found` });
  }

  let effectiveRoleAllocation = {
    BA: 0,
    Senior: serverSession.session.emSet.estimatedManDays ?? 60,
    Junior: 0,
    PM: 0,
  };
  if (roleAllocation) {
    effectiveRoleAllocation = roleAllocation;
  } else if (serverSession.session.emSet.roleAllocation) {
    const sr = serverSession.session.emSet.roleAllocation;
    effectiveRoleAllocation = {
      BA: sr.BA?.value || 0,
      Senior: sr.Senior?.value || 0,
      Junior: sr.Junior?.value || 0,
      PM: sr.PM?.value || 0,
    };
  }

  const input: EMCalculatorInput = {
    emSet: serverSession.session.emSet,
    roleAllocation: effectiveRoleAllocation,
    userCount: userCount ?? (typeof serverSession.session.emSet.userCount?.value === 'number' ? serverSession.session.emSet.userCount.value : null) ?? 100,
    emDefinitions: emDefinitionsMap,
  };

  try {
    const result = calculateWithEM(input, config);
    console.log(`[Calculate] ${sessionId} | Price: ${result.recommendedPrice.toLocaleString()} VND | Compound: ×${result._debug.compoundMultiplier.toFixed(3)}`);
    return res.json({ breakdown: result, params: input });
  } catch (err: any) {
    console.error(`[Calculate] Error in session ${sessionId}:`, err.message);
    return res.status(500).json({ error: 'Calculation failed', detail: err.message });
  }
};

export const report = (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const userCount = req.query.userCount ? parseInt(req.query.userCount as string) : undefined;
  const concurrentUsers = req.query.concurrent_users ? parseInt(req.query.concurrent_users as string, 10) : undefined;
  const expectedStorageGB = req.query.expected_storage_gb ? parseFloat(req.query.expected_storage_gb as string) : undefined;
  const requiresHA = req.query.requires_high_availability !== undefined
    ? String(req.query.requires_high_availability).toLowerCase() === 'true'
    : undefined;
  // Fallbacks for query params if roleAllocation is passed
  const roleAllocationQuery = req.query.roleAllocation ? JSON.parse(req.query.roleAllocation as string) : undefined;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const serverSession = sessionRepository.get(sessionId);
  if (!serverSession) {
    return res.status(404).json({ error: `Session "${sessionId}" not found` });
  }

  let effectiveRoleAllocation = {
    BA: 0,
    Senior: serverSession.session.emSet.estimatedManDays ?? 60,
    Junior: 0,
    PM: 0,
  };
  if (roleAllocationQuery) {
    effectiveRoleAllocation = roleAllocationQuery;
  } else if (serverSession.session.emSet.roleAllocation) {
    const sr = serverSession.session.emSet.roleAllocation;
    effectiveRoleAllocation = {
      BA: sr.BA?.value || 0,
      Senior: sr.Senior?.value || 0,
      Junior: sr.Junior?.value || 0,
      PM: sr.PM?.value || 0,
    };
  }

  const effectiveEMSet = {
    ...serverSession.session.emSet,
    concurrent_users:
      concurrentUsers !== undefined
        ? {
            value: concurrentUsers,
            confidence: 'high' as const,
            is_extracted: true,
            evidence: 'Manual override from report query',
            reasoning: 'Pre-sales override',
          }
        : serverSession.session.emSet.concurrent_users,
    expected_storage_gb:
      expectedStorageGB !== undefined
        ? {
            value: expectedStorageGB,
            confidence: 'high' as const,
            is_extracted: true,
            evidence: 'Manual override from report query',
            reasoning: 'Pre-sales override',
          }
        : serverSession.session.emSet.expected_storage_gb,
    requires_high_availability:
      requiresHA !== undefined
        ? {
            value: requiresHA,
            confidence: 'high' as const,
            is_extracted: true,
            evidence: 'Manual override from report query',
            reasoning: 'Pre-sales override',
          }
        : serverSession.session.emSet.requires_high_availability,
  };

  const input: EMCalculatorInput = {
    emSet: effectiveEMSet,
    roleAllocation: effectiveRoleAllocation,
    userCount: userCount ?? (typeof serverSession.session.emSet.userCount?.value === 'number' ? serverSession.session.emSet.userCount.value : null) ?? 100,
    emDefinitions: emDefinitionsMap,
  };

  try {
    const result = calculateWithEM(input, config);
    const markdown = generateMarkdownReport(sessionId, result);
    return res.json({ markdown });
  } catch (err: any) {
    console.error(`[Report] Error in session ${sessionId}:`, err.message);
    return res.status(500).json({ error: 'Report generation failed', detail: err.message });
  }
};

export const override = (req: Request, res: Response) => {
  const { sessionId, overriddenBy, emOverrides, calcOverrides, reasons } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const serverSession = sessionRepository.get(sessionId);
  if (!serverSession) {
    return res.status(404).json({ error: `Session "${sessionId}" not found` });
  }

  const now = new Date();
  const logs: OverrideLogEntry[] = [];

  if (emOverrides && typeof emOverrides === 'object') {
    for (const [emId, newValue] of Object.entries(emOverrides)) {
      const em = serverSession.session.emSet.multipliers.find(m => m.em_id === emId);
      if (em && typeof newValue === 'number') {
        logs.push({
          em_id: emId,
          field: em.name,
          originalValue: em.value,
          newValue: newValue as number,
          reason: reasons?.[emId] ?? 'No reason provided',
          overriddenBy: overriddenBy ?? 'Pre-sales',
          timestamp: now,
        });
        em.value = Math.max(em.range[0], Math.min(em.range[1], newValue as number));
        em.source = 'direct_customer_statement';
        em.confidence = 'high';
        em.confirmReason = `Overridden by ${overriddenBy ?? 'Pre-sales'}: ${reasons?.[emId] ?? ''}`;
      }
    }
  }

  serverSession.overrideLogs.push(...logs);
  sessionRepository.set(sessionId, serverSession);

  let effectiveRoleAllocation = {
    BA: 0,
    Senior: serverSession.session.emSet.estimatedManDays ?? 60,
    Junior: 0,
    PM: 0,
  };
  if (calcOverrides?.roleAllocation) {
    effectiveRoleAllocation = calcOverrides.roleAllocation;
  } else if (serverSession.session.emSet.roleAllocation) {
    const sr = serverSession.session.emSet.roleAllocation as any;
    effectiveRoleAllocation = {
      BA: sr.BA?.value || sr.BA || 0,
      Senior: sr.Senior?.value || sr.Senior || 0,
      Junior: sr.Junior?.value || sr.Junior || 0,
      PM: sr.PM?.value || sr.PM || 0,
    };
  }

  const input: EMCalculatorInput = {
    emSet: serverSession.session.emSet,
    roleAllocation: effectiveRoleAllocation,
    userCount: calcOverrides?.userCount ?? (typeof serverSession.session.emSet.userCount?.value === 'number' ? serverSession.session.emSet.userCount.value : null) ?? 100,
    emDefinitions: emDefinitionsMap,
  };

  try {
    const result = calculateWithEM(input, config);
    console.log(`[Override] ${sessionId} | ${logs.length} overrides | Price: ${result.recommendedPrice.toLocaleString()} VND`);
    return res.json({
      breakdown: result,
      overrideLogs: serverSession.overrideLogs,
      effortMultipliers: serverSession.session.emSet.multipliers,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Recalculation failed', detail: err.message });
  }
};
