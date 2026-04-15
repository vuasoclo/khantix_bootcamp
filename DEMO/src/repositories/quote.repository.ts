import { Quote } from '../types/quote.types';

// Giả lập Mock Database
const mockQuotes: Record<string, Quote> = {
  'test-quote-id': {
    quote_id: 'test-quote-id',
    client_name: 'Acme Corp',
    project_name: 'E-commerce Platform',
    status: 'DRAFT',
    currency: 'USD',
    total_floor_cost: 1240.00,
    total_list_price: 2480.00,
    line_items: []
  }
};

export const dbGetQuoteById = async (quoteId: string): Promise<Quote | null> => {
  return mockQuotes[quoteId] || null;
};
