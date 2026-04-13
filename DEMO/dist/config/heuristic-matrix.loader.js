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
exports.loadHeuristicMatrix = loadHeuristicMatrix;
exports.matchHeuristic = matchHeuristic;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Parses heuristic_matrix.csv into a list of HeuristicRule objects.
// Used by the Inferencer to match customer keywords → risk levels.
function loadHeuristicMatrix(csvPath) {
    const filePath = csvPath ?? path.resolve(__dirname, '../../../KHantix_doc/requirements/heuristic_matrix.csv');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const lines = raw.trim().split('\n').slice(1); // skip header
    return lines
        .filter((line) => line.trim().length > 0)
        .map((line) => {
        // CSV format: Row_ID,Slot_Target,"['kw1', 'kw2']",Mapped_Value,Buffer_Percentage
        const match = line.match(/^(\d+),([^,]+),"(\[.*?\])",([^,]+),([\d.]+)/);
        if (!match)
            return null;
        const [, rowId, slotTarget, keywordsRaw, mappedValue, bufferPct] = match;
        // Parse the Python-style list ['kw1', 'kw2'] → string[]
        const keywords = keywordsRaw
            .replace(/[\[\]']/g, '')
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean);
        return {
            rowId: parseInt(rowId),
            slotTarget: slotTarget.trim(),
            keywords,
            mappedValue: mappedValue.trim(),
            bufferPercentage: parseFloat(bufferPct),
        };
    })
        .filter((r) => r !== null);
}
// Returns the first matching rule for a given user utterance, or null if no match.
function matchHeuristic(utterance, rules) {
    const lower = utterance.toLowerCase();
    return rules.find((rule) => rule.keywords.some((kw) => lower.includes(kw.toLowerCase()))) ?? null;
}
