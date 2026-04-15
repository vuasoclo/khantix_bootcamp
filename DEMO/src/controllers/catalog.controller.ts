import { Request, Response } from 'express';
import { ProductCatalogResponse } from '../types/catalog.types';

export const getCatalog = async (req: Request, res: Response) => {
  // In a real implementation, this would query the DB using PostgreSQL and structure it.
  // For now, this returns our newly modeled JSON payload.
  
  const mockResponse: ProductCatalogResponse = {
    catalog_version: "v2026.04",
    currency: "USD",
    categories: [
      {
        category_id: "c1f7a0b0-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        category_name: "Backend Development",
        modules: [
          {
            module_id: "m5f7a0b1-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            module_name: "OAuth2 Single Sign-On (SSO)",
            complexity: "HIGH",
            estimations: [
              {
                estimation_id: "e9f7a0b2-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                role_name: "Backend Developer",
                seniority: "Senior",
                base_hours: 40,
                current_rate: {
                  rate_card_id: "r3f7a0b3-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                  hourly_cost: 25.00,
                  hourly_price: 50.00
                }
              },
              {
                estimation_id: "e9f7a0b4-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                role_name: "QA Engineer",
                seniority: "Mid",
                base_hours: 16,
                current_rate: {
                  rate_card_id: "r3f7a0b5-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                  hourly_cost: 15.00,
                  hourly_price: 30.00
                }
              }
            ],
            module_summary: {
              total_base_hours: 56,
              total_floor_cost: 1240.00,
              total_list_price: 2480.00
            }
          }
        ]
      }
    ]
  };

  res.json({
    status: 'success',
    data: mockResponse
  });
};
