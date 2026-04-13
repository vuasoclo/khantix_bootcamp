"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeJsonParse = safeJsonParse;
function safeJsonParse(input) {
    try {
        return JSON.parse(input);
    }
    catch {
        return null;
    }
}
