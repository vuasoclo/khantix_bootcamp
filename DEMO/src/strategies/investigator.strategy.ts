import * as fs from 'fs';
import * as path from 'path';
import { IPromptStrategy } from './prompt-strategy.interface';
import { PromptContract } from '../types/promt-contract';

// Investigator prompt strategy.
// Assembles the PromptContract for the LLM acting as a Senior Pre-sales Interviewer.
// Reads from src/prompts/investigator/*.prompt.md

const PROMPTS_DIR = path.resolve(__dirname, '../prompts/investigator');

function read(filename: string): string {
  const filePath = path.join(PROMPTS_DIR, filename);
  return fs.readFileSync(filePath, 'utf-8').trim();
}

export class InvestigatorStrategy implements IPromptStrategy {
  build(): PromptContract {
    return {
      systemPrompt:      read('system.prompt.md'),
      developerPrompt:   read('developer.prompt.md'),
      outputFormatPrompt: read('output-format.prompt.md'),
    };
  }
}
