import * as fs from 'fs';
import * as path from 'path';
import { IPromptStrategy } from './prompt-strategy.interface';
import { PromptContract } from '../types/promt-contract';

// Qualifier prompt strategy.
// Assembles the PromptContract for the LLM acting as the risk-qualification layer.
// Reads from src/prompts/qualifier/*.prompt.md

const PROMPTS_DIR = path.resolve(__dirname, '../prompts/qualifier');

function read(filename: string): string {
  const filePath = path.join(PROMPTS_DIR, filename);
  return fs.readFileSync(filePath, 'utf-8').trim();
}

export class QualifierStrategy implements IPromptStrategy {
  build(): PromptContract {
    return {
      systemPrompt:       read('system.prompt.md'),
      developerPrompt:    read('developer.prompt.md'),
      outputFormatPrompt: read('output-format.prompt.md'),
    };
  }
}
