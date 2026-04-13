import { PromptBuilder } from '../builders/prompt.builder';
import { InvestigatorStrategy } from '../strategies/investigator.strategy';
import { InvestigatorResponse, EMEstimateFromLLM } from '../schemas/investigator-response.schema';
import {
  EffortMultiplierSet,
  EffortMultiplierEstimate,
  EM_ID,
  Confidence,
  EvidenceSource,
  createEmptyEMSet,
} from '../types/effort-multiplier.types';
import { safeJsonParse } from '../utils/safe-json';

// ─── Session State ────────────────────────────────────────────────────────────

export interface EMSessionState {
  sessionId: string;
  emSet: EffortMultiplierSet;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeCompound(emSet: EffortMultiplierSet): void {
  // Product of all non-null risk EMs (D1-D3, I1-I2, T1-T2)
  const riskIds: EM_ID[] = ['EM_D1', 'EM_D2', 'EM_D3', 'EM_I1', 'EM_I2', 'EM_T1', 'EM_T2'];
  let compound = 1.0;
  for (const em of emSet.multipliers) {
    if (riskIds.includes(em.em_id) && em.value !== null) {
      compound *= clamp(em.value, em.range[0], em.range[1]);
    }
  }
  emSet.compoundMultiplier = compound;
  emSet.effectiveBufferPercent = `+${((compound - 1) * 100).toFixed(1)}%`;
}

function countFilled(emSet: EffortMultiplierSet): number {
  return emSet.multipliers.filter(m => m.value !== null).length;
}

// ─── InvestigatorService (COCOMO version) ─────────────────────────────────────

export class InvestigatorService {
  private strategy = new InvestigatorStrategy();

  async runTurn(
    userMessage: string,
    session: EMSessionState,
    callLlm: (prompt: string) => Promise<string>
  ): Promise<{ session: EMSessionState; suggestions: string[]; done: boolean }> {
    const contract = this.strategy.build();

    // Build state context showing filled/missing EMs
    const filledEMs = session.emSet.multipliers
      .filter(m => m.value !== null)
      .map(m => `  ${m.em_id} (${m.name}) = ${m.value} [${m.confidence}]`);
    const missingEMs = session.emSet.multipliers
      .filter(m => m.value === null)
      .map(m => `  ${m.em_id} (${m.name}) — range: [${m.range[0]}, ${m.range[1]}]`);

    const stateContext = `
Current Effort Multiplier state:
FILLED (${filledEMs.length}/12):
${filledEMs.join('\n') || '  (none yet)'}

MISSING (${missingEMs.length}/12):
${missingEMs.join('\n') || '  (all filled!)'}

Compound risk multiplier so far: ${session.emSet.compoundMultiplier.toFixed(3)}
`;

    const prompt = new PromptBuilder()
      .withSystem(contract.systemPrompt)
      .withDeveloper(contract.developerPrompt + '\n\n' + stateContext)
      .withOutputFormat(contract.outputFormatPrompt)
      .withUserInput(`Transcript:\n${userMessage}`)
      .build();

    const rawResponse = await callLlm(prompt);
    const parsed = safeJsonParse<InvestigatorResponse>(rawResponse);

    if (!parsed) {
      // Graceful degradation
      return {
        session,
        suggestions: ['Yêu cầu khách mô tả lại vấn đề cốt lõi cần giải quyết'],
        done: false,
      };
    }

    // Merge AI estimates into session EM set
    for (const aiEM of parsed.effortMultipliers) {
      const existing = session.emSet.multipliers.find(m => m.em_id === aiEM.em_id);
      if (existing && aiEM.value !== null) {
        existing.value = clamp(aiEM.value, existing.range[0], existing.range[1]);
        existing.confidence = (aiEM.confidence as Confidence) ?? 'medium';
        existing.source = (aiEM.source as EvidenceSource) ?? 'ai_inference_from_context';
        existing.evidence = aiEM.evidence;
        existing.reasoning = aiEM.reasoning;
      }
    }

    if (parsed.estimatedManDays) {
      session.emSet.estimatedManDays = parsed.estimatedManDays;
    }
    if (parsed.primaryRole) {
      session.emSet.primaryRole = parsed.primaryRole;
    }
    if (parsed.suggestions && parsed.suggestions.length > 0) {
      session.emSet.suggestions = parsed.suggestions;
    }

    // Recompute compound
    computeCompound(session.emSet);

    // Update conversation history (No assistant output anymore since it's a silent copilot)
    session.conversationHistory.push(
      { role: 'user', content: userMessage }
    );
    session.updatedAt = new Date();

    const filled = countFilled(session.emSet);

    return {
      session,
      suggestions: parsed.suggestions || [],
      done: parsed.allSlotsFilled || filled >= 12,
    };
  }

  createSession(sessionId: string, definitions: Array<{ em_id: EM_ID; name: string; range: [number, number]; defaultValue: number }>): EMSessionState {
    return {
      sessionId,
      emSet: createEmptyEMSet(definitions),
      conversationHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
