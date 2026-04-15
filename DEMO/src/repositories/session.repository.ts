import { InvestigatorService, EMSessionState } from '../services/investigator.service';
import { NegotiationAuditLog } from '../types/negotiation.types';

export interface OverrideLogEntry {
  em_id: string;
  field: string;
  originalValue: number | null;
  newValue: number;
  reason: string;
  overriddenBy: string;
  timestamp: Date;
}

export interface ServerSession {
  session: EMSessionState;
  investigator: InvestigatorService;
  overrideLogs: OverrideLogEntry[];
  negotiationLogs: NegotiationAuditLog[];
  createdAt: Date;
}

/**
 * Interface cho Session Repository (Chuẩn bị cho DB như Redis, Postgres sau này)
 */
export interface ISessionRepository {
  get(sessionId: string): ServerSession | undefined;
  set(sessionId: string, session: ServerSession): void;
  getOrCreate(sessionId: string, emDefinitionsArr: any[]): ServerSession;
  getSize(): number;
}

/**
 * In-memory Store hiện tại
 */
class InMemorySessionRepository implements ISessionRepository {
  private sessions = new Map<string, ServerSession>();

  get(sessionId: string): ServerSession | undefined {
    return this.sessions.get(sessionId);
  }

  set(sessionId: string, session: ServerSession): void {
    this.sessions.set(sessionId, session);
  }

  getSize(): number {
    return this.sessions.size;
  }

  getOrCreate(sessionId: string, emDefinitionsArr: any[]): ServerSession {
    if (!this.sessions.has(sessionId)) {
      const investigator = new InvestigatorService();
      const session = investigator.createSession(sessionId, emDefinitionsArr);
      this.sessions.set(sessionId, {
        session,
        investigator,
        overrideLogs: [],
        negotiationLogs: [],
        createdAt: new Date(),
      });
      console.log(`[Session] Created: ${sessionId}`);
    }
    return this.sessions.get(sessionId)!;
  }
}

// Global Singleton Instance
export const sessionRepository = new InMemorySessionRepository();
