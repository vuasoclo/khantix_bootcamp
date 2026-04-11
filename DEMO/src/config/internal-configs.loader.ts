import * as fs from 'fs';
import * as path from 'path';
import { InternalConfig } from '../types/internal-config.types';

// Parses internal_configs.csv into a strongly typed InternalConfig object.
// The CSV has columns: Parameter_ID, Parameter_Name, Value
// This loader is called once at startup; result should be cached/singleton.

export function loadInternalConfigs(csvPath?: string): InternalConfig {
  const filePath = csvPath ?? path.resolve(
    __dirname,
    '../../../KHantix_doc/requirements/internal_configs.csv'
  );

  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.trim().split('\n').slice(1); // skip header

  const map: Record<string, number> = {};
  for (const line of lines) {
    const [, paramName, value] = line.split(',');
    if (paramName && value) {
      map[paramName.trim()] = parseFloat(value.trim());
    }
  }

  return {
    Margin_NetProfit:              map['Margin_NetProfit'],
    Margin_RiskPremium:            map['Margin_RiskPremium'],
    Margin_Reinvestment:           map['Margin_Reinvestment'],
    Rate_Dev_Junior:               map['Rate_Dev_Junior'],
    Rate_Dev_Senior:               map['Rate_Dev_Senior'],
    Rate_PM:                       map['Rate_PM'],
    Rate_BA:                       map['Rate_BA'],
    Location_Onsite_Multiplier:    map['Location_Onsite_Multiplier'],
    Comm_Partner_Max:              map['Comm_Partner_Max'],
    Discount_Full_Payment:         map['Discount_Full_Payment'],
    Server_Base_Cost_Per_1K_Users: map['Server_Base_Cost_Per_1K_Users'],
    SMS_OTP_Rate:                  map['SMS_OTP_Rate'],
    Risk_Data_Cleansing_Default:   map['Risk_Data_Cleansing_Default'],
    Risk_Integration_Default:      map['Risk_Integration_Default'],
    Risk_Tech_Literacy_Default:    map['Risk_Tech_Literacy_Default'],
    Renew_Maintenance_Rate:        map['Renew_Maintenance_Rate'],
    Reuse_Factor_Default:          map['Reuse_Factor_Default'],
    K_Strategy_Enterprise_Logo:    map['K_Strategy_Enterprise_Logo'],
    K_Strategy_Rush_Factor:        map['K_Strategy_Rush_Factor'],
    K_Strategy_SMB_Default:        map['K_Strategy_SMB_Default'],
  };
}
