"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadInternalConfigs = loadInternalConfigs;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Parses internal_configs.csv into a strongly typed InternalConfig object.
// The CSV has columns: Parameter_ID, Parameter_Name, Value
// This loader is called once at startup; result should be cached/singleton.
function loadInternalConfigs(csvPath) {
    const filePath = csvPath ?? path.resolve(__dirname, '../../../KHantix_doc/requirements/internal_configs.csv');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const lines = raw.trim().split('\n').slice(1); // skip header
    const map = {};
    for (const line of lines) {
        const [, paramName, value] = line.split(',');
        if (paramName && value) {
            map[paramName.trim()] = parseFloat(value.trim());
        }
    }
    return {
        Margin_NetProfit: map['Margin_NetProfit'],
        Margin_RiskPremium: map['Margin_RiskPremium'],
        Margin_Reinvestment: map['Margin_Reinvestment'],
        Rate_Dev_Junior: map['Rate_Dev_Junior'],
        Rate_Dev_Senior: map['Rate_Dev_Senior'],
        Rate_PM: map['Rate_PM'],
        Rate_BA: map['Rate_BA'],
        Location_Onsite_Multiplier: map['Location_Onsite_Multiplier'],
        Comm_Partner_Max: map['Comm_Partner_Max'],
        Discount_Full_Payment: map['Discount_Full_Payment'],
        Server_Base_Cost_Per_1K_Users: map['Server_Base_Cost_Per_1K_Users'],
        SMS_OTP_Rate: map['SMS_OTP_Rate'],
        Risk_Data_Cleansing_Default: map['Risk_Data_Cleansing_Default'],
        Risk_Integration_Default: map['Risk_Integration_Default'],
        Risk_Tech_Literacy_Default: map['Risk_Tech_Literacy_Default'],
        Renew_Maintenance_Rate: map['Renew_Maintenance_Rate'],
        Reuse_Factor_Default: map['Reuse_Factor_Default'],
        K_Strategy_Enterprise_Logo: map['K_Strategy_Enterprise_Logo'],
        K_Strategy_Rush_Factor: map['K_Strategy_Rush_Factor'],
        K_Strategy_SMB_Default: map['K_Strategy_SMB_Default'],
    };
}
