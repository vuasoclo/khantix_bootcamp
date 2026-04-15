export interface CurrentRate {
  rate_card_id: string;
  hourly_cost: number;
  hourly_price: number;
}

export interface Estimation {
  estimation_id: string;
  role_name: string;
  seniority: string;
  base_hours: number;
  current_rate: CurrentRate;
}

export interface ModuleSummary {
  total_base_hours: number;
  total_floor_cost: number;
  total_list_price: number;
}

export interface ServiceModuleDef {
  module_id: string;
  module_name: string;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  estimations: Estimation[];
  module_summary: ModuleSummary;
}

export interface ServiceCategoryDef {
  category_id: string;
  category_name: string;
  modules: ServiceModuleDef[];
}

export interface ProductCatalogResponse {
  catalog_version: string;
  currency: string;
  categories: ServiceCategoryDef[];
}
