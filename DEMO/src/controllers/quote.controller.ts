import { Request, Response } from 'express';
import { validateQuoteAndExport, GuardrailException } from '../services/quote-guardrail.service';
import { getAIPriceRecommendation } from '../services/ai-recommendation.service';

export const exportQuote = async (req: Request, res: Response) => {
  try {
    const { quote_id, requested_final_price } = req.body;

    if (!quote_id || requested_final_price === undefined) {
      return res.status(400).json({ status: 'error', message: 'Missing quote_id or requested_final_price' });
    }

    const result = await validateQuoteAndExport(quote_id, requested_final_price);

    return res.status(200).json({
      status: 'success',
      data: result
    });

  } catch (error: any) {
    if (error instanceof GuardrailException) {
      return res.status(403).json({
        status: 'error',
        code: error.code,
        message: error.message,
        data: error.data
      });
    }
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getRecommendation = async (req: Request, res: Response) => {
    try {
        const payload = req.body;
        const recommendation = await getAIPriceRecommendation(payload);
        
        return res.status(200).json({
            status: 'success',
            data: recommendation
        });
    } catch (error: any) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};
