/**
 * KHantix AI CPQ — Express API Server (COCOMO Effort Multiplier Edition)
 *
 * Routes:
 *   GET  /api/health     — Config summary & active sessions
 *   POST /api/chat       — One Investigator conversation turn (calls LLM)
 *   POST /api/calculate  — Run COCOMO Calculator on current EM set
 *   POST /api/override   — Apply Pre-sales EM overrides, log audit, recalculate
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

// ─── Route: Chat (Investigator Turn) ─────────────────────────────────────────

app.post('/api/chat', async (req: Request, res: Response) => {
  const { sessionId, message } = req.body;

  if (!sessionId || !message?.trim()) {
    return res.status(400).json({ error: 'sessionId and message are required' });
  }

  const serverSession = getOrCreateSession(sessionId);

  try {
    const result = await serverSession.investigator.runTurn(
      message.trim(),
      serverSession.session,
      callLlm
    );

    serverSession.session = result.session;

    const filled = result.session.emSet.multipliers.filter(m => m.value !== null).length;
    const turnCount = result.session.conversationHistory.length / 2;
    console.log(`[Chat] ${sessionId} | Turn ${turnCount} | EMs: ${filled}/12 | Done: ${result.done}`);

    return res.json({
      nextQuestion: result.nextQuestion,
      effortMultipliers: result.session.emSet.multipliers,
      compoundMultiplier: result.session.emSet.compoundMultiplier,
      effectiveBufferPercent: result.session.emSet.effectiveBufferPercent,
      filledCount: filled,
      totalCount: 12,
      allSlotsFilled: result.done,
      turnCount,
    });
  } catch (err: any) {
    console.error(`[Chat] Error in session ${sessionId}:`, err.message);
    return res.status(500).json({ error: 'LLM call failed', detail: err.message });
  }
});

// ─── Route: Calculate ─────────────────────────────────────────────────────────

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
    estimatedManDays: estimatedManDays ?? 60,
    primaryRole: primaryRole ?? 'Senior',
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
        em.presalesNote = `Overridden by ${overriddenBy ?? 'Pre-sales'}: ${reasons?.[emId] ?? ''}`;
      }
    }
  }

  serverSession.overrideLogs.push(...logs);

  // Recalculate
  const input: EMCalculatorInput = {
    emSet: serverSession.session.emSet,
    estimatedManDays: calcOverrides?.estimatedManDays ?? 60,
    primaryRole: calcOverrides?.primaryRole ?? 'Senior',
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
