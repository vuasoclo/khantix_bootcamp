"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const index_route_1 = __importDefault(require("./routes/index.route"));
const chat_route_1 = __importDefault(require("./routes/chat.route"));
const calculator_route_1 = __importDefault(require("./routes/calculator.route"));
const negotiation_route_1 = __importDefault(require("./routes/negotiation.route"));
const internal_configs_loader_1 = require("./config/internal-configs.loader");
const heuristic_v2_loader_1 = require("./config/heuristic-v2.loader");
// ─── Startup ──────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '3000', 10);
console.log('\n╔══════════════════════════════════════════════════╗');
console.log('║   KHantix AI CPQ — COCOMO Edition Starting       ║');
console.log('╚══════════════════════════════════════════════════╝\n');
const config = (0, internal_configs_loader_1.loadInternalConfigs)();
const { definitions: emDefinitionsMap } = (0, heuristic_v2_loader_1.loadHeuristicMatrixV2)();
const emDefinitionsArr = Array.from(emDefinitionsMap.values());
console.log(`✅ Internal config loaded  (Net margin: ${(config.Margin_NetProfit * 100).toFixed(1)}%)`);
console.log(`✅ Heuristic Matrix V2 loaded (${emDefinitionsArr.length} EM parameters)`);
// ─── Express setup ────────────────────────────────────────────────────────────
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', index_route_1.default);
app.use('/api', chat_route_1.default);
app.use('/api', calculator_route_1.default);
app.use('/api', negotiation_route_1.default);
// ─── Fallback: Serve SPA ──────────────────────────────────────────────────────
app.get('*', (_req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public', 'index.html'));
});
// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[Server] Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});
// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀 KHantix COCOMO server running at http://localhost:${PORT}`);
    console.log(`   Frontend: http://localhost:${PORT}`);
    console.log(`   Health:   http://localhost:${PORT}/api/health\n`);
});
exports.default = app;
