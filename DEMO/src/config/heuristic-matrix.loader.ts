import * as fs from 'fs';
import * as path from 'path';
import { RiskSlot } from '../types/risk-slot.types';

// A single row from heuristic_matrix.csv
export interface HeuristicRule {
  rowId: number;
  slotTarget: keyof RiskSlot;
  keywords: string[];
  mappedValue: string;
  bufferPercentage: number;
}

// Parses heuristic_matrix.csv into a list of HeuristicRule objects.
// Used by the Inferencer to match customer keywords → risk levels.
export function loadHeuristicMatrix(csvPath?: string): HeuristicRule[] {
  const filePath = csvPath ?? path.resolve(
    __dirname,
    '../../../KHantix_doc/requirements/heuristic_matrix.csv'
  );

  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.trim().split('\n').slice(1); // skip header

  return lines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      // CSV format: Row_ID,Slot_Target,"['kw1', 'kw2']",Mapped_Value,Buffer_Percentage
      const match = line.match(/^(\d+),([^,]+),"(\[.*?\])",([^,]+),([\d.]+)/);
      if (!match) return null;

      const [, rowId, slotTarget, keywordsRaw, mappedValue, bufferPct] = match;

      // Parse the Python-style list ['kw1', 'kw2'] → string[]
      const keywords = keywordsRaw
        .replace(/[\[\]']/g, '')
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      return {
        rowId: parseInt(rowId),
        slotTarget: slotTarget.trim() as keyof RiskSlot,
        keywords,
        mappedValue: mappedValue.trim(),
        bufferPercentage: parseFloat(bufferPct),
      } satisfies HeuristicRule;
    })
    .filter((r): r is HeuristicRule => r !== null);
}

// Returns the first matching rule for a given user utterance, or null if no match.
export function matchHeuristic(
  utterance: string,
  rules: HeuristicRule[]
): HeuristicRule | null {
  const lower = utterance.toLowerCase();
  return rules.find((rule) =>
    rule.keywords.some((kw) => lower.includes(kw.toLowerCase()))
  ) ?? null;
}
