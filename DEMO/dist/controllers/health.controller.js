"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealth = void 0;
const session_repository_1 = require("../repositories/session.repository");
const internal_configs_loader_1 = require("../config/internal-configs.loader");
const getHealth = (req, res) => {
    const config = (0, internal_configs_loader_1.loadInternalConfigs)();
    res.json({
        status: 'ok',
        version: 'COCOMO-EM',
        provider: process.env.LLM_PROVIDER || 'gemini',
        activeSessions: session_repository_1.sessionRepository.getSize(),
        config: {
            netMargin: config.Margin_NetProfit,
            riskPremium: config.Margin_RiskPremium,
            reinvestment: config.Margin_Reinvestment,
            rateSenior: config.Rate_Dev_Senior,
        },
    });
};
exports.getHealth = getHealth;
