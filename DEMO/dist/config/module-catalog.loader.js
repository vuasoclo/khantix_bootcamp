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
exports.loadModuleCatalog = loadModuleCatalog;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function loadModuleCatalog(csvPath) {
    const filePath = csvPath ?? path.resolve(__dirname, '../../../KHantix_doc/requirements/module_catalog.csv');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const lines = raw.trim().split('\n').slice(1); // skip header
    return lines
        .filter((line) => line.trim().length > 0)
        .map((line) => {
        // Regex to split by comma, ignoring commas within quotes
        const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
        const fields = [];
        let match;
        while ((match = regex.exec(line)) !== null) {
            fields.push(match[0].replace(/^"|"$/g, ''));
        }
        const moduleId = fields[0]?.trim();
        if (!moduleId)
            return null;
        const category = fields[1]?.trim() || '';
        const moduleName = fields[2]?.trim() || '';
        const baseManDays = parseInt(fields[3]?.trim() || '0');
        const isCoreCompetency = fields[4]?.trim().toUpperCase() === 'TRUE';
        const customizationMarkup = parseFloat(fields[5]?.trim() || '1.0');
        const keywordsStr = fields[6] || '';
        const keywords = keywordsStr.split(',').map(k => k.trim()).filter(Boolean);
        const licenseCostBase = parseFloat(fields[7]?.trim() || '0');
        const storageQuotaGBPerUser = parseFloat(fields[8]?.trim() || '0.5');
        return {
            moduleId,
            category,
            moduleName,
            baseManDays,
            isCoreCompetency,
            customizationMarkup,
            keywords,
            licenseCostBase,
            storageQuotaGBPerUser,
        };
    })
        .filter((r) => r !== null);
}
