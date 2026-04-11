/**
 * KHantix — Gemini-Specific LLM Adapter
 *
 * A focused adapter for Google Gemini (gemini-1.5-flash by default).
 * Implements the LlmCaller signature expected by InvestigatorService.
 *
 * For multi-provider support, use llm-adapter.ts instead.
 * This file exists as a standalone option when you only need Gemini.
 *
 * Required env vars:
 *   GEMINI_API_KEY  — from https://aistudio.google.com/app/apikey
 *   GEMINI_MODEL    — optional, defaults to gemini-1.5-flash
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LlmCaller = (prompt: string) => Promise<string>;

// ─── Singleton initialisation ─────────────────────────────────────────────────

let _model: GenerativeModel | null = null;

function getModel(): GenerativeModel {
  if (_model) return _model;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error(
      '[KHantix/Gemini] GEMINI_API_KEY is not set. ' +
      'Copy .env.example → .env and fill in your key from https://aistudio.google.com/app/apikey'
    );
  }

  const modelName = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash';
  const genAI = new GoogleGenerativeAI(apiKey);
  _model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      // Force JSON output so the Inferencer can parse reliably
      responseMimeType: 'application/json',
      temperature: 0.3,   // Lower temp = more consistent JSON structure
      maxOutputTokens: 1024,
    },
  });

  console.log(`[KHantix/Gemini] Initialized model: ${modelName}`);
  return _model;
}

// ─── Main caller ──────────────────────────────────────────────────────────────

/**
 * Calls Gemini and returns the raw text response.
 * Matches the (prompt: string) => Promise<string> contract.
 */
export async function callGemini(prompt: string): Promise<string> {
  const model = getModel();
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Strip markdown fences if Gemini wraps JSON in ```json ... ```
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

// ─── Factory function (used by server.ts) ─────────────────────────────────────

/**
 * Returns the callGemini function, ready to be injected into InvestigatorService.
 *
 * Usage:
 *   import { createGeminiCaller } from './llm/gemini.adapter';
 *   const callLlm = createGeminiCaller();
 *   const result = await investigator.runTurn(msg, session, callLlm);
 */
export function createGeminiCaller(): LlmCaller {
  // Eagerly validate key on startup so failure is immediate, not mid-session
  getModel();
  return callGemini;
}

// ─── Self-test ────────────────────────────────────────────────────────────────

if (require.main === module) {
  (async () => {
    console.log('[KHantix/Gemini] Running self-test...\n');
    try {
      const result = await callGemini(
        'Return valid JSON with a single field: {"status": "gemini_ok"}'
      );
      console.log('✅ Response:', result);
      console.log('✅ Parsed:', JSON.parse(result));
    } catch (err) {
      console.error('❌ Self-test failed:', err);
      process.exit(1);
    }
  })();
}
