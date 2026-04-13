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
exports.loadHeuristicMatrixV2 = loadHeuristicMatrixV2;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function loadHeuristicMatrixV2(csvPath) {
    const filePath = csvPath ?? path.resolve(__dirname, '../../../KHantix_doc/requirements/heuristic_matrix_v2.csv');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const lines = raw.trim().split('\n').slice(1); // skip header
    const rules = [];
    const definitions = new Map();
    for (const line of lines) {
        // Basic CSV parser keeping quotes in mind, but for our simple CSV we can split safely if we handle the list bracket
        // A more robust regex split for CSV:
        const regex = /(?:,"|^")([^"]*)(?:",|"$)|(?:,(?!")|^(?!"))([^,]*)/g;
        let matches;
        const cols = [];
        let cleanLine = line.trim();
        // Quick and dirty parser since we know the format:
        // Row_ID,EM_ID,EM_Name,Dictionary_Param,User_Symptom_Keywords,EM_Default,EM_Min,EM_Max,Reasoning_Hint
        // We can safely split by first 4 commas, then extract the list, then split the rest.
        try {
            const parts = cleanLine.split('","');
            if (parts.length === 2) {
                const leftParts = parts[0].split(','); // Row_ID, EM_ID, EM_Name, Dictionary_Param
                const rightSide = parts[1].split('",'); // The rest after keywords
                const keywordsStr = rightSide[0];
                const rightParts = rightSide[1].split(','); // EM_Default, EM_Min, EM_Max, Reasoning_Hint
                let reasoning = rightParts.slice(3).join(',').replace(/"/g, ''); // combine reasoning back
                const emId = leftParts[1];
                const emMin = parseFloat(rightParts[1]);
                const emMax = parseFloat(rightParts[2]);
                const emDefault = parseFloat(rightParts[0]);
                const emName = leftParts[2];
                rules.push({
                    rowId: parseInt(leftParts[0]),
                    emId: emId,
                    emName: emName,
                    dictionaryParam: leftParts[3],
                    keywords: keywordsStr.replace(/[\[\]']/g, '').split(',').map(s => s.trim()),
                    emDefault: emDefault,
                    emMin: emMin,
                    emMax: emMax,
                    reasoningHint: reasoning
                });
                if (!definitions.has(emId)) {
                    definitions.set(emId, {
                        em_id: emId,
                        name: emName,
                        range: [emMin, emMax],
                        defaultValue: emDefault
                    });
                }
            }
            else {
                // Fallback simple split if no internal quotes in list (e.g. no list)
                // Since we know our CSV uses "[...]", we can parse based on brackets
                const splitLine = cleanLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                if (splitLine.length >= 9) {
                    const emId = splitLine[1];
                    const emMin = parseFloat(splitLine[6]);
                    const emMax = parseFloat(splitLine[7]);
                    const emDefault = parseFloat(splitLine[5]);
                    const emName = splitLine[2];
                    rules.push({
                        rowId: parseInt(splitLine[0]),
                        emId: emId,
                        emName: emName,
                        dictionaryParam: splitLine[3],
                        keywords: splitLine[4].replace(/[\[\]"']/g, '').split(',').map(s => s.trim()),
                        emDefault: emDefault,
                        emMin: emMin,
                        emMax: emMax,
                        reasoningHint: splitLine[8].replace(/^"|"$/g, '')
                    });
                    if (!definitions.has(emId)) {
                        definitions.set(emId, {
                            em_id: emId,
                            name: emName,
                            range: [emMin, emMax],
                            defaultValue: emDefault
                        });
                    }
                }
            }
        }
        catch (e) {
            console.warn('Failed to parse CSV line:', line);
        }
    }
    return { rules, definitions };
}
