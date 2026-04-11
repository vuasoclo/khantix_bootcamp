/**
 * KHantix — Pre-sales Override & Audit Log Types
 *
 * Implements the audit schema defined in:
 * KHantix - Explainable Report & Pre-sales Override (Phase 2).md
 *
 * Every override must record WHO changed WHAT from WHAT to WHAT and WHY.
 * This is the "Auditable" pillar of the Transparency Triad.
 */

import { RiskSlot } from './risk-slot.types';

// ─── Override Field Groups ────────────────────────────────────────────────────

/** Which risk slot values can be overridden */
export type OverridableSlot = keyof Pick<
  RiskSlot,
  'Data_Risk' | 'Integration_Risk' | 'Tech_Literacy_Risk'
>;

// ─── Single Override Entry ────────────────────────────────────────────────────

/**
 * One field override request from the Pre-sales Override Console.
 * Sent in POST /api/override payload.
 */
export interface OverridePayload {
  /** The field being changed, e.g. "Data_Risk" or "estimatedManDays" */
  field: string;

  /** AI-calculated original value before any human touch */
  aiOriginalValue: string | number | boolean | null;

  /** The value Pre-sales is setting instead */
  overriddenValue: string | number | boolean | null;

  /** Plain-English reason the Pre-sales provided (required in UI) */
  reason: string;
}

// ─── Audit Log Entry (persisted per session) ─────────────────────────────────

/**
 * Saved record of one applied override.
 * Extends OverridePayload with session context and timestamps.
 * Matches the JSON schema in the Phase 2 document.
 */
export interface OverrideLog extends OverridePayload {
  sessionId: string;

  /** Name/ID of the Pre-sales who made the change */
  overriddenBy: string;

  /** Timestamp of the override action */
  timestamp: Date;
}

// ─── Full Override Request (POST /api/override body) ─────────────────────────

export interface OverrideRequest {
  sessionId: string;

  /** Human identifier (e.g. "Nguyen Van A — Pre-sales") */
  overriddenBy: string;

  /** Slot-level overrides: changes to risk levels */
  slotOverrides?: Partial<RiskSlot>;

  /** Calculator param overrides: man-days, role, strategy, etc. */
  calcOverrides?: {
    estimatedManDays?: number;
    primaryRole?: 'Junior' | 'Senior' | 'PM' | 'BA';
    userCount?: number;
    includesOnsite?: boolean;
    strategy?: 'HUNTER' | 'FARMER';
  };

  /**
   * Per-field override reasons.
   * Key = field name, Value = plain-English reason.
   * Required for every overridden field.
   */
  reasons: Record<string, string>;
}

// ─── Override Response (POST /api/override response body) ─────────────────────

export interface OverrideResponse {
  /** Recalculated price breakdown with overridden inputs */
  breakdown: unknown; // typed as PriceBreakdown at runtime

  /** Full cumulative audit trail for this session */
  overrideLogs: OverrideLog[];

  /** The effective slot state after applying overrides */
  effectiveSlots: Partial<RiskSlot>;

  /** Price delta: original vs overridden recommendation */
  priceDelta: {
    original: number;
    overridden: number;
    delta: number;
    deltaPercent: string;
  };
}
