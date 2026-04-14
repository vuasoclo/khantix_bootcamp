// Typed representation of internal_configs.csv
// Loaded once at startup by internal-configs.loader.ts

export interface InternalConfig {
  // Margin components
  Margin_NetProfit: number;        // MARGIN_001 — 0.1875
  Margin_RiskPremium: number;      // MARGIN_002 — 0.0975
  Margin_Reinvestment: number;     // MARGIN_003 — 0.0866

  // Daily rates by role (VND per man-day)
  Rate_Dev_Junior: number;         // RATE_001 — 1,500,000
  Rate_Dev_Senior: number;         // RATE_002 — 3,000,000
  Rate_PM: number;                 // RATE_003 — 3,650,000
  Rate_BA: number;                 // RATE_004 — 2,300,000
  Location_Onsite_Multiplier: number; // RATE_005 — 1.3

  // Commercial
  Comm_Partner_Max: number;        // COMM_001 — 0.105
  Discount_Full_Payment: number;   // COMM_002 — 0.05

  // Hardware / Infrastructure
  Server_Base_Infra_Cost: number;      // HW_001 — fixed monthly infra floor
  Server_Cost_Per_100_Users: number;   // HW_002 — compute scale per 100 concurrent users
  Storage_Cost_Per_GB: number;         // HW_003 — storage unit price
  SMS_OTP_Rate: number;                // HW_004 — optional third-party OTP unit price

  // Risk defaults (aligned with heuristic_matrix.csv Buffer_Percentage)
  Risk_Data_Cleansing_Default: number;   // RISK_001 — 0.1866
  Risk_Integration_Default: number;      // RISK_002 — 0.1221
  Risk_Tech_Literacy_Default: number;    // RISK_003 — 0.0654

  // License
  Renew_Maintenance_Rate: number;  // LIC_001 — 0.1212
  Reuse_Factor_Default: number;    // LIC_002 — 0.2955

  // Strategy knobs
  K_Strategy_Enterprise_Logo: number; // STRAT_001 — 0.87
  K_Strategy_Rush_Factor: number;     // STRAT_002 — 1.5
  K_Strategy_SMB_Default: number;     // STRAT_003 — 1.0
}
