export type QuoteStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'WON' | 'LOST';

export interface QuoteLineItem {
  line_item_id?: string;
  module_id: string;
  role_level_id: string;
  rate_card_id: string;  // Crucial: snapshots the exact past/current rate
  estimated_hours: number;
  unit_cost: number;
  unit_price: number;
}

export interface Quote {
  quote_id?: string;
  client_name: string;
  project_name: string;
  status: QuoteStatus;
  currency: string;
  
  // Accumulated totals
  total_floor_cost: number;
  total_list_price: number;
  
  // The final price decided by the user or the negotiation engine
  final_offered_price?: number;
  
  // Nested relation
  line_items: QuoteLineItem[];
  
  created_at?: string;
  updated_at?: string;
}
