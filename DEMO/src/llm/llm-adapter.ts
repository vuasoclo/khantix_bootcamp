/**
 * KHantix — Universal LLM Adapter
 *
 * Supports three providers out of the box:
 *   • Google Gemini   (LLM_PROVIDER=gemini)
 *   • OpenAI GPT      (LLM_PROVIDER=openai)
 *   • Anthropic Claude(LLM_PROVIDER=anthropic)
 *
 * All providers expose the same interface:
 *   callLlm(prompt: string): Promise<string>
 *
 * Switch providers by changing LLM_PROVIDER in your .env file.
 * No code changes needed anywhere else — InvestigatorService
 * already accepts callLlm as an injected dependency.
 *
 * Setup:
 *   1. cp .env.example .env
 *   2. Fill in the key for the provider you want to use.
 *   3. npm install (installs SDKs for all providers).
 */

import * as dotenv from 'dotenv';
dotenv.config();

// ─── Type ─────────────────────────────────────────────────────────────────────

/** The single function signature every provider adapter must implement. */
export type LlmCaller = (prompt: string) => Promise<string>;

// ─── Provider: Google Gemini ──────────────────────────────────────────────────

async function callGemini(prompt: string): Promise<string> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('[KHantix] GEMINI_API_KEY is not set in .env');

  const model = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash';
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({ model });

  const result = await geminiModel.generateContent(prompt);
  const response = result.response;
  return response.text();
}

// ─── Provider: OpenAI ─────────────────────────────────────────────────────────

async function callOpenAI(prompt: string): Promise<string> {
  const OpenAI = (await import('openai')).default;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('[KHantix] OPENAI_API_KEY is not set in .env');

  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }, // Investigator output is always JSON
  });

  return completion.choices[0]?.message?.content ?? '';
}

// ─── Provider: Anthropic Claude ───────────────────────────────────────────────

async function callAnthropic(prompt: string): Promise<string> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('[KHantix] ANTHROPIC_API_KEY is not set in .env');

  const model = process.env.ANTHROPIC_MODEL ?? 'claude-3-5-haiku-20241022';
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== 'text') return '';
  return block.text;
}

// ─── Provider: 9Router (Local OpenAI-Compatible Proxy) ────────────────────────

async function call9Router(prompt: string): Promise<string> {
  const OpenAI = (await import('openai')).default;

  const baseURL = process.env.NINEROUTER_API_BASE ?? 'http://localhost:20128/v1';
  const model = process.env.NINEROUTER_MODEL ?? 'gemini-3-flash';

  // Use the injected key from .env, or fallback to the generic local string
  const apiKey = process.env.NINEROUTER_API_KEY || 'sk-local-9router';
  const client = new OpenAI({ apiKey, baseURL });

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }, // Assuming your 9router provider/model combo supports JSON
  });

  return completion.choices[0]?.message?.content ?? '';
}

// ─── Factory — Picks the right provider from .env ─────────────────────────────

/**
 * Returns a callLlm function wired to whichever provider is set
 * in the LLM_PROVIDER environment variable.
 */
export function createLlmCaller(): LlmCaller {
  const provider = (process.env.LLM_PROVIDER ?? 'gemini').toLowerCase();

  switch (provider) {
    case 'gemini':
      console.log(`[KHantix] LLM provider: Google Gemini (${process.env.GEMINI_MODEL ?? 'gemini-1.5-flash'})`);
      return callGemini;

    case 'openai':
      console.log(`[KHantix] LLM provider: OpenAI (${process.env.OPENAI_MODEL ?? 'gpt-4o-mini'})`);
      return callOpenAI;

    case 'anthropic':
      console.log(`[KHantix] LLM provider: Anthropic Claude (${process.env.ANTHROPIC_MODEL ?? 'claude-3-5-haiku-20241022'})`);
      return callAnthropic;

    case '9router':
      console.log(`[KHantix] LLM provider: 9Router (${process.env.NINEROUTER_API_BASE ?? 'http://localhost:20128/v1'} using ${process.env.NINEROUTER_MODEL ?? 'default model'})`);
      return call9Router;

    default:
      throw new Error(
        `[KHantix] Unknown LLM_PROVIDER="${provider}". ` +
        `Valid options: "gemini", "openai", "anthropic", "9router"`
      );
  }
}

// ─── Quick self-test (run directly: ts-node src/llm/llm-adapter.ts) ───────────

async function selfTest(): Promise<void> {
  console.log('\n[KHantix] Running LLM adapter self-test...\n');

  const callLlm = createLlmCaller();

  const testPrompt = `
You are a KHantix Investigator AI.
A customer just said: "We store everything in Excel files."

Return JSON only — use this exact schema:
{
  "updatedSlots": {
    "Data_Risk": "HIGH | MEDIUM | LOW | FALLBACK | null",
    "Integration_Risk": null,
    "Tech_Literacy_Risk": null,
    "Hardware_Sizing": null,
    "Scope_Granularity": null,
    "Rush_Factor": null,
    "Client_Logo_Size": null,
    "Payment_Term": null
  },
  "nextQuestionToUser": "string",
  "inferencesMade": [],
  "allSlotsFilled": false
}
`.trim();

  try {
    const raw = await callLlm(testPrompt);
    console.log('✅ Raw LLM response:\n');
    console.log(raw);

    const parsed = JSON.parse(raw);
    console.log('\n✅ Parsed successfully:');
    console.log(`   Data_Risk inferred: ${parsed.updatedSlots?.Data_Risk}`);
    console.log(`   Next question:      ${parsed.nextQuestionToUser}`);
  } catch (err) {
    console.error('❌ Self-test failed:', err);
  }
}

// Run self-test if executed directly
if (require.main === module) {
  selfTest();
}
