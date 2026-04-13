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

  const manDaysOverride = req.query.estimatedManDays ? parseInt(req.query.estimatedManDays as string, 10) : null;
  const roleOverride = req.query.primaryRole as string | null;
  const userCountOverride = req.query.userCount ? parseInt(req.query.userCount as string, 10) : 100;

  const serverSession = sessionRepository.get(sessionId);
  if (!serverSession) {
    return res.status(404).json({ error: `Session "${sessionId}" not found` });
  }

  const emSet = serverSession.session.emSet;

  const manDays = manDaysOverride || emSet.estimatedManDays || 60;
  const role = roleOverride || emSet.primaryRole || 'Senior';
  const rateMap: Record<string, number> = {
    Junior: config.Rate_Dev_Junior,
    Senior: config.Rate_Dev_Senior,
    PM: config.Rate_PM,
    BA: config.Rate_BA,
  };
  const dailyRate = rateMap[role] || config.Rate_Dev_Senior;
  const laborCost = manDays * dailyRate;
  const serverCost = config.Server_Base_Cost_Per_1K_Users * (userCountOverride / 1000);
  const licenseCost = laborCost * 0.2 * (1 - config.Reuse_Factor_Default);
  const baseCost = laborCost + serverCost + licenseCost;

  const totalRecommendedPrice = baseCost * emSet.compoundMultiplier;

  const filledEMs = emSet.multipliers
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

  const missingEMs = emSet.multipliers
    .filter(m => m.value === null)
    .map(m => ({
      em_id: m.em_id,
      name: m.name,
      range: m.range,
    }));

  console.log(`[BaseReport] ${sessionId} | Total: ${totalRecommendedPrice.toLocaleString()} VND (Base: ${baseCost.toLocaleString()}) | Filled: ${filledEMs.length}/12`);

  return res.json({
    sessionId,
    baseCost,
    totalRecommendedPrice,
    estimatedManDays: manDays,
    primaryRole: role,
    dailyRate,
    laborCost,
    serverCost,
    licenseCost,
    compoundMultiplier: emSet.compoundMultiplier,
    effectiveBufferPercent: emSet.effectiveBufferPercent,
    filledEMs,
    missingEMs,
    filledCount: filledEMs.length,
    missingCount: missingEMs.length,
    suggestions: emSet.suggestions || [],
  });
};

export const calculate = (req: Request, res: Response) => {
  const { sessionId, estimatedManDays, primaryRole, userCount } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const serverSession = sessionRepository.get(sessionId);
  if (!serverSession) {
    return res.status(404).json({ error: `Session "${sessionId}" not found` });
  }

  const input: EMCalculatorInput = {
    emSet: serverSession.session.emSet,
    estimatedManDays: estimatedManDays ?? serverSession.session.emSet.estimatedManDays ?? 60,
    primaryRole: primaryRole ?? serverSession.session.emSet.primaryRole ?? 'Senior',
    userCount: userCount ?? 100,
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
  const estimatedManDays = req.query.estimatedManDays ? parseInt(req.query.estimatedManDays as string) : undefined;
  const primaryRole = req.query.primaryRole as any;
  const userCount = req.query.userCount ? parseInt(req.query.userCount as string) : undefined;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const serverSession = sessionRepository.get(sessionId);
  if (!serverSession) {
    return res.status(404).json({ error: `Session "${sessionId}" not found` });
  }

  const input: EMCalculatorInput = {
    emSet: serverSession.session.emSet,
    estimatedManDays: estimatedManDays ?? serverSession.session.emSet.estimatedManDays ?? 60,
    primaryRole: primaryRole ?? serverSession.session.emSet.primaryRole ?? 'Senior',
    userCount: userCount ?? 100,
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

  const input: EMCalculatorInput = {
    emSet: serverSession.session.emSet,
    estimatedManDays: calcOverrides?.estimatedManDays ?? serverSession.session.emSet.estimatedManDays ?? 60,
    primaryRole: calcOverrides?.primaryRole ?? serverSession.session.emSet.primaryRole ?? 'Senior',
    userCount: calcOverrides?.userCount ?? 100,
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