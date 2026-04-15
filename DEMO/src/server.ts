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

import indexRoute from './routes/index.route';
import chatRoute from './routes/chat.route';
import calculatorRoute from './routes/calculator.route';
import negotiationRoute from './routes/negotiation.route';
import catalogRoute from './routes/catalog.route';
import quoteRoute from './routes/quote.route';
import { loadInternalConfigs } from './config/internal-configs.loader';
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

// ─── Express setup ────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api', indexRoute);
app.use('/api', chatRoute);
app.use('/api', calculatorRoute);
app.use('/api', negotiationRoute);
app.use('/api', catalogRoute);
app.use('/api', quoteRoute);

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
