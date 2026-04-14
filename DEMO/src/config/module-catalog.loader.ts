import * as fs from 'fs';
import * as path from 'path';

export interface ModuleCatalogEntry {
  moduleId: string;
  category: string;
  moduleName: string;
  baseManDays: number;
  isCoreCompetency: boolean;
  customizationMarkup: number;
  keywords: string[];
}

export function loadModuleCatalog(csvPath?: string): ModuleCatalogEntry[] {
  const filePath = csvPath ?? path.resolve(
    __dirname,
    '../../../KHantix_doc/requirements/module_catalog.csv'
  );

  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.trim().split('\n').slice(1); // skip header

  return lines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      // Regex to split by comma, ignoring commas within quotes
      const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
      const fields: string[] = [];
      let match;
      while ((match = regex.exec(line)) !== null) {
          fields.push(match[0].replace(/^"|"$/g, ''));
      }
      
      const moduleId = fields[0]?.trim();
      if (!moduleId) return null;

      const category = fields[1]?.trim() || '';
      const moduleName = fields[2]?.trim() || '';
      const baseManDays = parseInt(fields[3]?.trim() || '0');
      const isCoreCompetency = fields[4]?.trim().toUpperCase() === 'TRUE';
      const customizationMarkup = parseFloat(fields[5]?.trim() || '1.0');
      
      const keywordsStr = fields[6] || '';
      const keywords = keywordsStr.split(',').map(k => k.trim()).filter(Boolean);

      return {
        moduleId,
        category,
        moduleName,
        baseManDays,
        isCoreCompetency,
        customizationMarkup,
        keywords,
      } as ModuleCatalogEntry;
    })
    .filter((r): r is ModuleCatalogEntry => r !== null);
}
