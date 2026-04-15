"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionRepository = void 0;
const investigator_service_1 = require("../services/investigator.service");
/**
 * In-memory Store hiện tại
 */
class InMemorySessionRepository {
    constructor() {
        this.sessions = new Map();
    }
    get(sessionId) {
        return this.sessions.get(sessionId);
    }
    set(sessionId, session) {
        this.sessions.set(sessionId, session);
    }
    getSize() {
        return this.sessions.size;
    }
    getOrCreate(sessionId, emDefinitionsArr) {
        if (!this.sessions.has(sessionId)) {
            const investigator = new investigator_service_1.InvestigatorService();
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
        return this.sessions.get(sessionId);
    }
}
// Global Singleton Instance
exports.sessionRepository = new InMemorySessionRepository();
