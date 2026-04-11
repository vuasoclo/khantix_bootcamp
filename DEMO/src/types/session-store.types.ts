/**
 * KHantix — Server-Side Session Store Types
 *
 * Tracks every active conversation session in an in-memory Map.
 * Each entry holds the InvestigatorService instance, the live SessionState,
 * and a cumulative list of Pre-sales Override audit logs.
 */

import { SessionState } from './risk-slot.types';
import { InvestigatorService } from '../services/investigator.service';
import { OverrideLog } from './override.types';

// ─── Server session entry ─────────────────────────────────────────────────────

export interface ServerSession {
  /** The live conversation + slot state */
  session: SessionState;

  /** The stateful Investigator service instance for this conversation */
  investigator: InvestigatorService;

  /** Audit trail of every Pre-sales override applied to this session */
  overrideLogs: OverrideLog[];

  /** Timestamp the session was first created */
  createdAt: Date;

  /** IP or user identifier — for multi-user tracking (optional) */
  userId?: string;
}

// ─── In-memory store type ─────────────────────────────────────────────────────

/** The global session store: sessionId → ServerSession */
export type SessionStore = Map<string, ServerSession>;

// ─── API request/response shapes (shared between server.ts and tests) ─────────

export interface ChatRequest {
  sessionId: string;
  message: string;
}

export interface ChatResponse {
  nextQuestion: string;
  updatedSlots: Record<string, string | null>;
  filledSlots: string[];
  missingSlots: string[];
  allSlotsFilled: boolean;
  turnCount: number;
}

export interface CalculateRequest {
  sessionId: string;
  /** Estimated base man-days (inferred from Scope_Granularity if omitted) */
  estimatedManDays?: number;
  primaryRole?: 'Junior' | 'Senior' | 'PM' | 'BA';
  /** Estimated user count (inferred from Hardware_Sizing if omitted) */
  userCount?: number;
  includesOnsite?: boolean;
  strategy?: 'HUNTER' | 'FARMER';
}
