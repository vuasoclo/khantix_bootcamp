/**
 * KHantix AI CPQ — Express API Server (Copilot Edition)
 *
 * Routes:
 *   GET  /api/health              — Config summary & active sessions
 *   POST /api/profile             — Bouncer: validate project profile, pre-fill EMs
 *   POST /api/analyze-transcript  — Analyze conversation transcript, extract EMs
 *   GET  /api/base-report         — On-demand Base Price report (any time)
 *   POST /api/calculate           — Run full COCOMO Calculator on current EM set
 *   POST /api/override            — Apply Pre-sales EM overrides, log audit, recalculate
 *
 * Static files served from /public (index.html, style.css, app.js).
 */

import * as dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';

import { loadInternalConfigs } from './config/internal-configs.loader';
import { InvestigatorService, EMSessionState } from './services/investigator.service';
import { calculateWithEM, EMCalculatorInput } from './calculators/em.calculator';
import { createLlmCaller } from './llm/llm-adapter';
import { EffortMultiplierSet, EM_ID } from './types/effort-multiplier.types';
import { loadHeuristicMatrixV2 } from './config/heuristic-v2.loader';

// ─── Startup ──────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '3000', 10);

console.log('\n╔══════════════════════════════════════════════════╗');
console.log('║   KHantix AI CPQ — COCOMO Edition Starting       ║');
console.log('╚══════════════════════════════════════════════════╝\n');

const config = loadInternalConfigs();
const { definitions: emDefinitionsMap } = loadHeuristicMatrixV2();
const emDefinitionsArr = Array.from(emDefinitionsMap.values());
console.log(`✅ Internal config loaded  (Net margin: ${(config.Margin_NetProfit * 100).toFixed(1)}%)`);
console.log(`✅ Heuristic Matrix V2 loaded (${emDefinitionsArr.length} EM parameters)`);

let callLlm: ReturnType<typeof createLlmCaller>;
try {
  callLlm = createLlmCaller();
} catch (err: any) {
  console.error(`\n❌ LLM provider init failed: ${err.message}`);
  console.error('   → Copy .env.example to .env and fill in your API key.\n');
  process.exit(1);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServerSession {
  session: EMSessionState;
  investigator: InvestigatorService;
  overrideLogs: OverrideLogEntry[];
  createdAt: Date;
}

interface OverrideLogEntry {
  em_id: string;
  field: string;
  originalValue: number | null;
  newValue: number;
  reason: string;
  overriddenBy: string;
  timestamp: Date;
}

// ─── In-memory session store ──────────────────────────────────────────────────

const sessions = new Map<string, ServerSession>();

function getOrCreateSession(sessionId: string): ServerSession {
  if (!sessions.has(sessionId)) {
    const investigator = new InvestigatorService();
    const session = investigator.createSession(sessionId, emDefinitionsArr);
    sessions.set(sessionId, {
      session,
      investigator,
      overrideLogs: [],
      createdAt: new Date(),
    });
    console.log(`[Session] Created: ${sessionId}`);
  }
  return sessions.get(sessionId)!;
}

// ─── Express setup ────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ─── Route: Health ────────────────────────────────────────────────────────────

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: 'COCOMO-EM',
    provider: process.env.LLM_PROVIDER ?? 'gemini',
    activeSessions: sessions.size,
    config: {
      netMargin: config.Margin_NetProfit,
      riskPremium: config.Margin_RiskPremium,
      reinvestment: config.Margin_Reinvestment,
      rateSenior: config.Rate_Dev_Senior,
    },
  });
});

// ─── Route: Analyze Transcript (Copilot Turn) ──────────────────────────────

app.post('/api/analyze-transcript', async (req: Request, res: Response) => {
  const { sessionId, transcript } = req.body;

  if (!sessionId || !transcript?.trim()) {
    return res.status(400).json({ error: 'sessionId and transcript are required' });
  }

  const serverSession = getOrCreateSession(sessionId);

  try {
    const result = await serverSession.investigator.runTurn(
      transcript.trim(),
      serverSession.session,
      callLlm
    );

    serverSession.session = result.session;

    const filled = result.session.emSet.multipliers.filter(m => m.value !== null).length;
    const turnCount = result.session.conversationHistory.length / 2;
    console.log(`[Chat] ${sessionId} | Turn ${turnCount} | EMs: ${filled}/12 | Done: ${result.done}`);

    return res.json({
      suggestions: result.suggestions,
      effortMultipliers: result.session.emSet.multipliers,
      compoundMultiplier: result.session.emSet.compoundMultiplier,
      effectiveBufferPercent: result.session.emSet.effectiveBufferPercent,
      filledCount: filled,
      totalCount: 12,
      allSlotsFilled: result.done,
      turnCount,
    });
  } catch (err: any) {
    console.error(`[Transcript] Error in session ${sessionId}:`, err.message);
    return res.status(500).json({ error: 'LLM call failed', detail: err.message });
  }
});

// ─── Route: Profile (Bouncer / Pre-qualification) ─────────────────────────────

app.post('/api/profile', async (req: Request, res: Response) => {
  const { sessionId, projectContext } = req.body;

  if (!projectContext?.trim()) {
    return res.status(400).json({ error: 'projectContext is required' });
  }

  const sid = sessionId || `KHX-${Date.now()}`;
  const serverSession = getOrCreateSession(sid);

  // Build a classification prompt — the Bouncer (with Anti-Hallucination)
  const bouncerPrompt = `You are a B2B Enterprise IT sales qualification system.

Analyze this project brief and determine:
1. Is this a valid B2B Enterprise project? (NOT a student project, personal tool, or budget under 150 million VND)
2. If valid, extract Effort Multiplier values ONLY when you have DIRECT EVIDENCE in the brief.

Project Brief:
"""
${projectContext.trim()}
"""

REJECTION KEYWORDS: If you see any of these: "sinh viên", "đồ án", "bài tập", "cá nhân", "miễn phí", "student", "personal", "homework", "free" — you MUST reject.

EM DEFINITIONS (CRITICAL — Only assign if DIRECT EVIDENCE exists in the brief):
- EM_D1: How is data STORED? (Excel/PDF = high, SQL/ERP = low). NOT from job titles.
- EM_D2: How MUCH data? (years × records). NOT from company size alone.
- EM_D3: Is data CLEAN? Need explicit complaint about errors/mismatch.
- EM_I1: Does system have APIs? Need explicit mention of integration.
- EM_I2: How OLD is their software? Need explicit year/version.
- EM_T1: Will users RESIST change? Need explicit adoption concern.
- EM_T2: Have users used SIMILAR B2B software? Need explicit experience.
- EM_B1: On-site or Remote? Need explicit location discussion.
- EM_B2: Special HARDWARE needed? Need explicit requirement.
- EM_C1: How URGENT? Need explicit deadline.
- EM_C2: Enterprise SLA/compliance? Need explicit mention.
- EM_C3: Payment terms? Need EXPLICIT payment discussion.

STRICT: If no direct evidence → value MUST be null. Job title → null. Person name → null.

Return JSON only:
{
  "isValid": true or false,
  "rejectionReason": "string or null",
  "effortMultipliers": [
    {
      "em_id": "EM_D1 | EM_D2 | ... | EM_C3",
      "action": "FILL",
      "value": "number or null",
      "confidence": "high | medium | low",
      "source": "ai_inference_from_context",
      "evidence": "exact quote from the brief, or null",
      "reasoning": "why this value, referencing EM definition"
    }
  ],
  "estimatedManDays": "number or null",
  "primaryRole": "Junior | Senior | PM | BA | null",
  "suggestions": ["string — what to discuss first in the meeting"]
}`;

  try {
    const rawResponse = await callLlm(bouncerPrompt);

    // Try to parse JSON from the response
    let parsed: any;
    try {
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      parsed = null;
    }

    if (!parsed) {
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    // BOUNCER: Reject invalid projects
    if (!parsed.isValid) {
      console.log(`[Profile] REJECTED session ${sid}: ${parsed.rejectionReason}`);
      return res.status(400).json({
        rejected: true,
        reason: parsed.rejectionReason || 'Hệ thống chuyên biệt B2B Enterprise, không phục vụ đồ án cá nhân.',
      });
    }

    // Valid — merge pre-extracted EMs into session (with status tracking)
    if (parsed.effortMultipliers && Array.isArray(parsed.effortMultipliers)) {
      for (const aiEM of parsed.effortMultipliers) {
        const existing = serverSession.session.emSet.multipliers.find(m => m.em_id === aiEM.em_id);
        if (existing && aiEM.value !== null) {
          existing.value = Math.max(existing.range[0], Math.min(existing.range[1], aiEM.value));
          existing.confidence = aiEM.confidence ?? 'medium';
          existing.source = aiEM.source ?? 'ai_inference_from_context';
          existing.evidence = aiEM.evidence ?? null;
          existing.reasoning = aiEM.reasoning ?? null;
          existing.status = 'ai_pending';
        }
      }
    }

    if (parsed.estimatedManDays) {
      serverSession.session.emSet.estimatedManDays = parsed.estimatedManDays;
    }
    if (parsed.primaryRole) {
      serverSession.session.emSet.primaryRole = parsed.primaryRole;
    }
    if (parsed.suggestions) {
      serverSession.session.emSet.suggestions = parsed.suggestions;
    }

    // Add profile to conversation history
    serverSession.session.conversationHistory.push({
      role: 'user',
      content: `[Hồ sơ trước báo giá]: ${projectContext.trim()}`,
    });

    const filled = serverSession.session.emSet.multipliers.filter(m => m.value !== null).length;
    console.log(`[Profile] ACCEPTED session ${sid} | Pre-filled EMs: ${filled}/12`);

    return res.json({
      sessionId: sid,
      accepted: true,
      suggestions: parsed.suggestions || [],
      effortMultipliers: serverSession.session.emSet.multipliers,
      filledCount: filled,
      totalCount: 12,
      estimatedManDays: serverSession.session.emSet.estimatedManDays,
      primaryRole: serverSession.session.emSet.primaryRole,
    });
  } catch (err: any) {
    console.error(`[Profile] Error:`, err.message);
    return res.status(500).json({ error: 'Profile analysis failed', detail: err.message });
  }
});

// ─── Route: Confirm EM (Pre-sales inline confirm/adjust) ──────────────────────

app.post('/api/confirm-em', (req: Request, res: Response) => {
  const { sessionId, em_id, action, newValue, reason } = req.body;

  if (!sessionId || !em_id || !action) {
    return res.status(400).json({ error: 'sessionId, em_id, and action are required' });
  }

  const serverSession = sessions.get(sessionId);
  if (!serverSession) {
    return res.status(404).json({ error: `Session "${sessionId}" not found` });
  }

  const em = serverSession.session.emSet.multipliers.find(m => m.em_id === em_id);
  if (!em) {
    return res.status(404).json({ error: `EM "${em_id}" not found` });
  }

  if (action === 'confirm') {
    em.status = 'confirmed';
    em.confirmedBy = 'pre-sales';
    console.log(`[ConfirmEM] ${sessionId} | ${em_id} CONFIRMED at ${em.value}`);
  } else if (action === 'adjust') {
    const adjustedValue = parseFloat(newValue);
    if (isNaN(adjustedValue)) {
      return res.status(400).json({ error: 'newValue must be a valid number' });
    }
    em.previousValue = em.value;
    em.value = Math.max(em.range[0], Math.min(em.range[1], adjustedValue));
    em.status = 'confirmed';
    em.confirmedBy = 'pre-sales';
    em.confirmReason = reason || '';
    console.log(`[ConfirmEM] ${sessionId} | ${em_id} ADJUSTED ${em.previousValue} → ${em.value} | Reason: ${reason}`);
  } else {
    return res.status(400).json({ error: 'action must be "confirm" or "adjust"' });
  }

  // Recompute compound multiplier
  const riskIds = ['EM_D1', 'EM_D2', 'EM_D3', 'EM_I1', 'EM_I2', 'EM_T1', 'EM_T2'];
  let compound = 1.0;
  for (const m of serverSession.session.emSet.multipliers) {
    if (riskIds.includes(m.em_id) && m.value !== null) {
      compound *= Math.max(m.range[0], Math.min(m.range[1], m.value));
    }
  }
  serverSession.session.emSet.compoundMultiplier = compound;
  serverSession.session.emSet.effectiveBufferPercent = `+${((compound - 1) * 100).toFixed(1)}%`;

  const filled = serverSession.session.emSet.multipliers.filter(m => m.value !== null).length;

  return res.json({
    success: true,
    effortMultipliers: serverSession.session.emSet.multipliers,
    compoundMultiplier: serverSession.session.emSet.compoundMultiplier,
    effectiveBufferPercent: serverSession.session.emSet.effectiveBufferPercent,
    filledCount: filled,
  });
});

// ─── Route: Base Report (On-demand, any time) ─────────────────────────────────

app.get('/api/base-report', (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId query param is required' });
  }

  const serverSession = sessions.get(sessionId);
  if (!serverSession) {
    return res.status(404).json({ error: `Session "${sessionId}" not found` });
  }

  const emSet = serverSession.session.emSet;

  // Calculate Base Price (sum of components)
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
  const serverCost = config.Server_Base_Cost_Per_1K_Users * (userCount / 1000);
  const licenseCost = laborCost * 0.2 * (1 - config.Reuse_Factor_Default);
  const baseCost = laborCost + serverCost + licenseCost;

  // Apply Risk Multiplier for the "Recommended" fast view
  const totalRecommendedPrice = baseCost * emSet.compoundMultiplier;

  // Categorize EMs with full history
  const filledEMs = emSet.multipliers
    .filter(m => m.value !== null)
    .map(m => ({
      em_id: m.em_id,
      name: m.name,
      value: m.value,
      confidence: m.confidence,
      evidence: m.evidence,
      reasoning: m.reasoning,
      reasoningHistory: m.reasoningHistory, // Full history of thoughts
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
});

app.post('/api/calculate', (req: Request, res: Response) => {
  const { sessionId, estimatedManDays, primaryRole, userCount } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const serverSession = sessions.get(sessionId);
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
});

// ─── Route: Override ─────────────────────────────────────────────────────────

app.post('/api/override', (req: Request, res: Response) => {
  const { sessionId, overriddenBy, emOverrides, calcOverrides, reasons } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const serverSession = sessions.get(sessionId);
  if (!serverSession) {
    return res.status(404).json({ error: `Session "${sessionId}" not found` });
  }

  const now = new Date();
  const logs: OverrideLogEntry[] = [];

  // Apply EM overrides
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

  // Recalculate
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
});

// ─── Fallback: Serve SPA ──────────────────────────────────────────────────────

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// ─── Global error handler ─────────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 KHantix COCOMO server running at http://localhost:${PORT}`);
  console.log(`   Frontend: http://localhost:${PORT}`);
  console.log(`   Health:   http://localhost:${PORT}/api/health\n`);
});

export default app;
