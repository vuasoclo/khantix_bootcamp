import { dbGetQuoteById } from '../repositories/quote.repository';

export class GuardrailException extends Error {
  public code: string;
  public data: any;

  constructor(message: string, shortfall: number) {
    super(message);
    this.name = "GuardrailException";
    this.code = "GUARDRAIL_VIOLATION";
    this.data = { shortfall, required_approval_level: "BOARD_DIRECTOR" };
  }
}

export const validateQuoteAndExport = async (quoteId: string, requestedPrice: number) => {
  const quoteData = await dbGetQuoteById(quoteId);

  if (!quoteData) throw new Error("Quote not found");

  const floorCost = quoteData.total_floor_cost;

  if (requestedPrice < floorCost) {
    const shortfall = floorCost - requestedPrice;
    console.warn(`[AUDIT] User attempted to price Quote ${quoteId} below floor. Shortfall: $${shortfall}`);
    throw new GuardrailException(
      `Violation: Requested price ($${requestedPrice}) is below operational floor cost ($${floorCost}).`, 
      shortfall
    );
  }

  const actualMarginPct = ((requestedPrice - floorCost) / requestedPrice) * 100;
  
  return {
    export_url: `https://cpq.khantix.com/export/${quoteId}/pdf`,
    approved_price: requestedPrice,
    actual_margin_pct: parseFloat(actualMarginPct.toFixed(2))
  };
};
