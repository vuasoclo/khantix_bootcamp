import * as fs from 'fs';
import * as path from 'path';
import { EM_ID } from '../types/effort-multiplier.types';

export interface HeuristicRuleV2 {
  rowId: number;
  emId: EM_ID;
  emName: string;
  dictionaryParam: string;
  keywords: string[];
  emDefault: number;
  emMin: number;
  emMax: number;
  reasoningHint: string;
}

export interface EMDefinition {
  em_id: EM_ID;
  name: string;
  range: [number, number];
  defaultValue: number;
}

export function loadHeuristicMatrixV2(csvPath?: string): {
  rules: HeuristicRuleV2[];
  definitions: Map<EM_ID, EMDefinition>;
} {
  const filePath = csvPath ?? path.resolve(
    __dirname,
    '../../../KHantix_doc/requirements/heuristic_matrix_v2.csv'
  );

  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.trim().split('\n').slice(1); // skip header

  const rules: HeuristicRuleV2[] = [];
  const definitions = new Map<EM_ID, EMDefinition>();

  for (const line of lines) {
    // Basic CSV parser keeping quotes in mind, but for our simple CSV we can split safely if we handle the list bracket
    // A more robust regex split for CSV:
    const regex = /(?:,"|^")([^"]*)(?:",|"$)|(?:,(?!")|^(?!"))([^,]*)/g;
    let matches: RegExpExecArray | null;
    const cols: string[] = [];
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

        const emId = leftParts[1] as EM_ID;
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
      } else {
        // Fallback simple split if no internal quotes in list (e.g. no list)
        // Since we know our CSV uses "[...]", we can parse based on brackets
        const splitLine = cleanLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (splitLine.length >= 9) {
          const emId = splitLine[1] as EM_ID;
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
    } catch (e) {
      console.warn('Failed to parse CSV line:', line);
    }
  }

  return { rules, definitions };
}
