/**
 * KHantix AI CPQ — Express API Server
 *
 * Routes:
 *   GET  /api/health     — Sanity check & config summary
 *   POST /api/chat       — One Investigator conversation turn (calls LLM)
 *   POST /api/calculate  — Run Calculator on current/partial slots
 *   POST /api/override   — Apply Pre-sales overrides, log audit, recalculate
 *
 * Static files are served from /public (index.html, style.css, app.js).
 *
 * Start: npm start  (or LLM_PROVIDER=openai npm start to use OpenAI)
 */

import * as dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';

import { loadInternalConfigs } from './config/internal-configs.loader';
import { loadHeuristicMatrix } from './config/heuristic-matrix.loader';
import { InvestigatorService } from './services/investigator.service';
import { CalculatorService } from './services/calculator.service';
import { createLlmCaller } from './llm/llm-adapter';
import { SessionState, RiskSlot } from './types/risk-slot.types';
import { ServerSession, SessionStore, ChatRequest, CalculateRequest } from './types/session-store.types';
import { OverrideRequest, OverrideLog, OverrideResponse } from './types/override.types';
import { PriceBreakdown } from './types/pricing-output.types';
import { CommercialStrategy } from './calculators/pricing.orchestrator';

// ─── Startup ──────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '3000', 10);

console.log('\n╔══════════════════════════════════════════════════╗');
console.log('║   KHantix AI CPQ — Server Starting               ║');
console.log('╚══════════════════════════════════════════════════╝\n');

// Load business configs once at startup (CSV → typed objects)
const config = loadInternalConfigs();
const heuristicRules = loadHeuristicMatrix();
console.log(`✅ Internal config loaded  (Net margin: ${(config.Margin_NetProfit * 100).toFixed(1)}%)`);
console.log(`✅ Heuristic matrix loaded (${heuristicRules.length} rules)`);

// Wire the LLM caller (provider selected from LLM_PROVIDER env var)
let callLlm: ReturnType<typeof createLlmCaller>;
try {
  callLlm = createLlmCaller();
} catch (err: any) {
  console.error(`\n❌ LLM provider init failed: ${err.message}`);
  console.error('   → Copy .env.example to .env and fill in your API key.\n');
  process.exit(1);
}

// ─── In-memory session store ──────────────────────────────────────────────────

const sessions: SessionStore = new Map();

function getOrCreateSession(sessionId: string): ServerSession {
  if (!sessions.has(sessionId)) {
    const investigator = new InvestigatorService();
    const session = investigator.createSession(sessionId);
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derive calculator params from slots when caller doesn't provide them */
function deriveCalcParams(slots: RiskSlot, overrides: CalculateRequest = {} as CalculateRequest) {
  return {
    estimatedManDays: overrides.estimatedManDays
      ?? (slots.Scope_Granularity === 'ENTERPRISE' ? 90 : 30),
    primaryRole: (overrides.primaryRole ?? 'Senior') as 'Junior' | 'Senior' | 'PM' | 'BA',
    userCount: overrides.userCount
      ?? (slots.Hardware_Sizing === 'TIER_LARGE' ? 500 : 50),
    includesOnsite: overrides.includesOnsite ?? false,
    strategy: (overrides.strategy ?? 'HUNTER') as CommercialStrategy,
  };
}

// ─── Express setup ────────────────────────────────────────────────────────────

const app = express();

app.use(cors());
app.use(express.json());

// Serve the frontend SPA from /public
// With ts-node, __dirname = src/, so public is one level up
app.use(express.static(path.join(__dirname, '../public')));

// ─── Route: Health ────────────────────────────────────────────────────────────

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    provider: process.env.LLM_PROVIDER ?? 'gemini',
    model: process.env.GEMINI_MODEL ?? process.env.OPENAI_MODEL ?? process.env.ANTHROPIC_MODEL ?? 'default',
    activeSessions: sessions.size,
    heuristicRules: heuristicRules.length,
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
  const { sessionId, message } = req.body as ChatRequest;

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

    // Persist updated session state
    serverSession.session = result.session;

    const turnCount = result.session.conversationHistory.length / 2;
    console.log(`[Chat] ${sessionId} | Turn ${turnCount} | Filled: ${result.session.filledSlots.length}/8 | Done: ${result.done}`);

    return res.json({
      nextQuestion: result.nextQuestion,
      updatedSlots: result.session.slots,
      filledSlots: result.session.filledSlots,
      missingSlots: result.session.missingSlots,
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
  const body = req.body as CalculateRequest;
  const { sessionId } = body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const serverSession = sessions.get(sessionId);
  if (!serverSession) {
    return res.status(404).json({ error: `Session "${sessionId}" not found` });
  }

  const params = deriveCalcParams(serverSession.session.slots, body);
  const calculator = new CalculatorService();

  try {
    const breakdown = calculator.run(serverSession.session, config, params);
    console.log(`[Calculate] ${sessionId} | Price: ${breakdown.recommendedPrice.toLocaleString()} VND | Strategy: ${params.strategy}`);
    return res.json({ breakdown, params });
  } catch (err: any) {
    console.error(`[Calculate] Error in session ${sessionId}:`, err.message);
    return res.status(500).json({ error: 'Calculation failed', detail: err.message });
  }
});

// ─── Route: Override ─────────────────────────────────────────────────────────

app.post('/api/override', (req: Request, res: Response) => {
  const body = req.body as OverrideRequest;
  const { sessionId, overriddenBy, slotOverrides, calcOverrides, reasons } = body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const serverSession = sessions.get(sessionId);
  if (!serverSession) {
    return res.status(404).json({ error: `Session "${sessionId}" not found` });
  }

  // ── Build effective session with slot overrides applied ───────────────────
  const originalSlots = serverSession.session.slots;
  const effectiveSlots: RiskSlot = { ...originalSlots, ...(slotOverrides ?? {}) };

  const overriddenSession: SessionState = {
    ...serverSession.session,
    slots: effectiveSlots,
  };

  // ── Record audit logs ─────────────────────────────────────────────────────
  const now = new Date();
  const newLogs: OverrideLog[] = [];

  // Slot overrides
  for (const [field, newValue] of Object.entries(slotOverrides ?? {})) {
    const originalValue = originalSlots[field as keyof RiskSlot];
    if (originalValue !== newValue) {
      newLogs.push({
        sessionId,
        field,
        aiOriginalValue: originalValue,
        overriddenValue: newValue,
        reason: reasons?.[field] ?? 'No reason provided',
        overriddenBy: overriddenBy ?? 'Pre-sales',
        timestamp: now,
      });
    }
  }

  // Calc overrides
  for (const [field, newValue] of Object.entries(calcOverrides ?? {})) {
    newLogs.push({
      sessionId,
      field,
      aiOriginalValue: null,   // derived defaults, no single "original"
      overriddenValue: newValue as string | number | boolean | null,
      reason: reasons?.[field] ?? 'No reason provided',
      overriddenBy: overriddenBy ?? 'Pre-sales',
      timestamp: now,
    });
  }

  serverSession.overrideLogs.push(...newLogs);

  // ── Run Calculator with overridden inputs ─────────────────────────────────
  const params = deriveCalcParams(effectiveSlots, calcOverrides as CalculateRequest);
  const calculator = new CalculatorService();

  let breakdown: PriceBreakdown;
  try {
    breakdown = calculator.run(overriddenSession, config, params);
  } catch (err: any) {
    return res.status(500).json({ error: 'Recalculation failed', detail: err.message });
  }

  // ── Compute price delta ───────────────────────────────────────────────────
  const originalParams = deriveCalcParams(originalSlots);
  const originalBreakdown = calculator.run(serverSession.session, config, originalParams);
  const delta = breakdown.recommendedPrice - originalBreakdown.recommendedPrice;
  const deltaPercent = ((delta / originalBreakdown.recommendedPrice) * 100).toFixed(1) + '%';

  console.log(`[Override] ${sessionId} | ${newLogs.length} overrides | Price delta: ${delta >= 0 ? '+' : ''}${delta.toLocaleString()} VND (${deltaPercent})`);

  const response: OverrideResponse = {
    breakdown,
    overrideLogs: serverSession.overrideLogs,
    effectiveSlots,
    priceDelta: {
      original: originalBreakdown.recommendedPrice,
      overridden: breakdown.recommendedPrice,
      delta,
      deltaPercent,
    },
  };

  return res.json(response);
});

// ─── Fallback: Serve SPA for all non-API routes ───────────────────────────────

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
  console.log(`\n🚀 KHantix server running at http://localhost:${PORT}`);
  console.log(`   Frontend: http://localhost:${PORT}`);
  console.log(`   Health:   http://localhost:${PORT}/api/health\n`);
});

export default app;
