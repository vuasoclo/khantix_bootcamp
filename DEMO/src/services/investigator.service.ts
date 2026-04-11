import { PromptBuilder } from '../builders/prompt.builder';
import { InvestigatorStrategy } from '../strategies/investigator.strategy';
import { InvestigatorResponse } from '../schemas/investigator-response.schema';
import { SessionState, EMPTY_SLOTS, RiskSlot } from '../types/risk-slot.types';
import { safeJsonParse } from '../utils/safe-json';

// InvestigatorService orchestrates one turn of the Investigator conversation.
// Caller is responsible for maintaining SessionState between turns.

export class InvestigatorService {
  private strategy = new InvestigatorStrategy();

  // Builds the full prompt for one LLM turn and returns the response.
  // `callLlm` is injected so the service stays testable and provider-agnostic.
  async runTurn(
    userMessage: string,
    session: SessionState,
    callLlm: (prompt: string) => Promise<string>
  ): Promise<{ session: SessionState; nextQuestion: string; done: boolean }> {
    const contract = this.strategy.build();

    const stateContext = `
Current filled slots: ${JSON.stringify(session.slots, null, 2)}
Missing slots: ${session.missingSlots.join(', ')}
`;

    const prompt = new PromptBuilder()
      .withSystem(contract.systemPrompt)
      .withDeveloper(contract.developerPrompt + '\n\n' + stateContext)
      .withOutputFormat(contract.outputFormatPrompt)
      .withUserInput(`Customer said: "${userMessage}"`)
      .build();

    const rawResponse = await callLlm(prompt);
    const parsed = safeJsonParse<InvestigatorResponse>(rawResponse);

    if (!parsed) {
      // Graceful degradation: keep session unchanged, ask a safe fallback question
      return {
        session,
        nextQuestion: 'Could you tell me a bit more about your current setup?',
        done: false,
      };
    }

    // Merge updated slots into session
    const mergedSlots: RiskSlot = {
      ...session.slots,
      ...parsed.updatedSlots,
    };

    const missingSlots = (Object.keys(mergedSlots) as Array<keyof RiskSlot>)
      .filter((k) => mergedSlots[k] === null);

    const updatedSession: SessionState = {
      ...session,
      slots: mergedSlots,
      filledSlots: (Object.keys(mergedSlots) as Array<keyof RiskSlot>).filter((k) => mergedSlots[k] !== null),
      missingSlots,
      conversationHistory: [
        ...session.conversationHistory,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: parsed.nextQuestionToUser },
      ],
      updatedAt: new Date(),
    };

    return {
      session: updatedSession,
      nextQuestion: parsed.nextQuestionToUser,
      done: parsed.allSlotsFilled,
    };
  }

  createSession(sessionId: string): SessionState {
    return {
      sessionId,
      slots: { ...EMPTY_SLOTS },
      filledSlots: [],
      missingSlots: Object.keys(EMPTY_SLOTS) as Array<keyof RiskSlot>,
      conversationHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
