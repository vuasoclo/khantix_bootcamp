import { Request, Response } from 'express';
import { InternalConfig } from '../types/internal-config.types';
import { sessionRepository } from '../repositories/session.repository';
import { loadInternalConfigs } from '../config/internal-configs.loader';

export const getHealth = (req: Request, res: Response) => {
  const config = loadInternalConfigs();
  res.json({
    status: 'ok',
    version: 'COCOMO-EM',
    provider: process.env.LLM_PROVIDER || 'gemini',
    activeSessions: sessionRepository.getSize(),
    config: {
      netMargin: config.Margin_NetProfit,
      riskPremium: config.Margin_RiskPremium,
      reinvestment: config.Margin_Reinvestment,
      rateSenior: config.Rate_Dev_Senior,
    },
  });
};