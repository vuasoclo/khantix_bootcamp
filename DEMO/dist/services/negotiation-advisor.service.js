"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NegotiationAdvisorService = void 0;
const llm_adapter_1 = require("../llm/llm-adapter");
const safe_json_1 = require("../utils/safe-json");
const TIER_KEYWORDS = {
    basic: [/\bbasic\b/i, /\bco\s*ban\b/i, /goi\s*1/i],
    standard: [/\bstandard\b/i, /\bchuan\b/i, /goi\s*2/i],
    premium: [/\bpremium\b/i, /\bnang\s*cao\b/i, /goi\s*3/i],
};
const CAPABILITY_PATTERNS = [
    {
        capability: 'it_team',
        positive: [/\bit team\b/i, /doi\s*it/i, /doi\s*ky\s*thuat/i, /devops/i, /developer/i],
        negative: [/khong\s+co\s+(doi\s*)?(it|ky\s*thuat)/i],
    },
    {
        capability: 'data_team',
        positive: [/data\s*team/i, /doi\s*data/i, /etl/i, /data\s*engineer/i],
        negative: [/khong\s+co\s+(doi\s*)?data/i],
    },
    {
        capability: 'product_owner',
        positive: [/product\s*owner/i, /chu\s*du\s*an/i, /dau\s*moi\s*nghiep\s*vu/i],
    },
    {
        capability: 'qa_team',
        positive: [/\bqa\b/i, /tester/i, /kiem\s*thu/i],
    },
    {
        capability: 'ops_team',
        positive: [/ops\s*team/i, /doi\s*van\s*hanh/i, /operation\s*team/i],
    },
];
class NegotiationAdvisorService {
    constructor() {
        const useLlm = (process.env.NEGOTIATION_USE_LLM ?? 'false').toLowerCase() === 'true';
        if (!useLlm)
            return;
        try {
            this.llmCaller = (0, llm_adapter_1.createLlmCaller)();
        }
        catch {
            this.llmCaller = undefined;
        }
    }
    async analyzeIntent(transcript, targetTierHint) {
        const local = this.buildLocalIntent(transcript, targetTierHint);
        const llm = await this.tryAnalyzeWithLlm(transcript, targetTierHint);
        if (!llm) {
            return local;
        }
        return {
            selectedTierCandidate: this.normalizeTier(llm.selectedTierCandidate || local.selectedTierCandidate),
            clientBudgetVnd: typeof llm.clientBudgetVnd === 'number' && llm.clientBudgetVnd > 0
                ? Math.round(llm.clientBudgetVnd)
                : local.clientBudgetVnd,
            clientCapabilities: this.unique([...(local.clientCapabilities || []), ...(llm.clientCapabilities || [])]),
            confidence: llm.confidence || local.confidence,
            evidenceQuotes: this.unique([...(llm.evidenceQuotes || []), ...(local.evidenceQuotes || [])]).slice(0, 5),
            suggestions: this.unique([...(llm.suggestions || []), ...(local.suggestions || [])]).slice(0, 6),
            negotiationIntent: llm.negotiationIntent || local.negotiationIntent,
        };
    }
    buildSalesScript(intent, selectedTierQuote, recommendation) {
        const opening = `Em hieu ben minh dang can khung ngan sach quanh ${this.formatVnd(intent.clientBudgetVnd)} cho goi ${intent.selectedTier.toUpperCase()}.`;
        const optionLines = recommendation.selectedCards.length
            ? recommendation.selectedCards.map((card) => `Neu ap dung: ${card.title}, ben minh co the tiet kiem ~${this.formatVnd(card.estimatedSavingVnd)}.`)
            : ['Khong can cat them scope vi muc gia hien tai da nam trong ngan sach.'];
        const clauseLine = recommendation.mandatoryClauses.length
            ? `Dieu khoan bat buoc: ${recommendation.mandatoryClauses.join(' | ')}`
            : 'Khong phat sinh dieu khoan bo sung tu card dam phan.';
        const closing = `Neu minh thong nhat, em se khoa phuong an de phat hanh bao gia chinh thuc cho muc ${this.formatVnd(selectedTierQuote.priceVnd)}.`;
        return [opening, ...optionLines, clauseLine, closing];
    }
    buildLocalIntent(transcript, targetTierHint) {
        const tier = this.detectTier(transcript, targetTierHint);
        const budget = this.extractBudgetVnd(transcript);
        const capabilities = this.extractCapabilities(transcript);
        const intentType = this.detectIntentType(transcript);
        const suggestions = [];
        if (budget === null) {
            suggestions.push('Can xac nhan tran ngan sach cu the (VND) truoc khi de xuat card trade-off.');
        }
        else {
            suggestions.push(`Xac nhan lai budget ${this.formatVnd(budget)} voi ben mua de tranh sai lech.`);
        }
        if (!capabilities.includes('it_team')) {
            suggestions.push('Khong nen uu tien card can client IT capability neu ben mua chua xac nhan doi ky thuat.');
        }
        suggestions.push('Giai thich ro: moi giam gia deu di kem cat scope hoac chuyen trach nhiem.');
        return {
            selectedTierCandidate: tier,
            clientBudgetVnd: budget,
            clientCapabilities: capabilities,
            negotiationIntent: intentType,
            confidence: budget ? (capabilities.length > 0 ? 'high' : 'medium') : 'low',
            evidenceQuotes: [transcript.trim().slice(0, 220) || 'Khong co bang chung cu the tu transcript.'],
            suggestions,
        };
    }
    detectTier(transcript, targetTierHint) {
        for (const [tier, patterns] of Object.entries(TIER_KEYWORDS)) {
            if (patterns.some((pattern) => pattern.test(transcript))) {
                return tier;
            }
        }
        return this.normalizeTier(targetTierHint);
    }
    detectIntentType(transcript) {
        const normalized = transcript.toLowerCase();
        if (/(qua\s*dat|too\s*expensive|vuot\s*ngan\s*sach|ngan\s*sach|budget)/i.test(normalized)) {
            return 'budget_pushback';
        }
        if (/(cat\s*scope|giam\s*tinh\s*nang|bo\s*bot|scope)/i.test(normalized)) {
            return 'scope_reduction';
        }
        if (/(doi\s*trach\s*nhiem|tu\s*trien\s*khai|trade\s*off)/i.test(normalized)) {
            return 'feature_tradeoff';
        }
        if (/(gap|deadline|thang\s*nay|go\s*live\s*som)/i.test(normalized)) {
            return 'timeline_pressure';
        }
        return 'unknown';
    }
    extractCapabilities(transcript) {
        const capabilities = [];
        for (const rule of CAPABILITY_PATTERNS) {
            const hasPositive = rule.positive.some((pattern) => pattern.test(transcript));
            const hasNegative = rule.negative ? rule.negative.some((pattern) => pattern.test(transcript)) : false;
            if (hasPositive && !hasNegative) {
                capabilities.push(rule.capability);
            }
        }
        return this.unique(capabilities);
    }
    extractBudgetVnd(transcript) {
        const contextual = this.matchBudgetNearKeyword(transcript);
        if (contextual !== null)
            return contextual;
        const allAmounts = this.extractAllAmounts(transcript);
        if (allAmounts.length === 0)
            return null;
        return Math.min(...allAmounts);
    }
    matchBudgetNearKeyword(text) {
        const regex = /(ngan\s*sach|budget|max|tran|chi\s*co|cap|khung\s*gia)[^\d]{0,24}(\d+(?:[.,]\d+)?)\s*(ty|trieu|million|billion|m|bn)?/i;
        const match = text.match(regex);
        if (!match)
            return null;
        return this.parseAmount(match[2], match[3]);
    }
    extractAllAmounts(text) {
        const amounts = [];
        const regex = /(\d+(?:[.,]\d+)?)\s*(ty|trieu|million|billion|m|bn)\b/gi;
        let match;
        while ((match = regex.exec(text)) !== null) {
            const value = this.parseAmount(match[1], match[2]);
            if (value !== null)
                amounts.push(value);
        }
        const plainNumberRegex = /(\d{9,12})\b/g;
        while ((match = plainNumberRegex.exec(text)) !== null) {
            const parsed = parseInt(match[1], 10);
            if (!Number.isNaN(parsed) && parsed > 0) {
                amounts.push(parsed);
            }
        }
        return amounts;
    }
    parseAmount(rawNumber, rawUnit) {
        const normalizedNumber = rawNumber.replace(/,/g, '.');
        const base = parseFloat(normalizedNumber);
        if (Number.isNaN(base) || base <= 0)
            return null;
        const unit = (rawUnit || '').toLowerCase();
        if (unit === 'ty' || unit === 'billion' || unit === 'bn') {
            return Math.round(base * 1000000000);
        }
        if (unit === 'trieu' || unit === 'million' || unit === 'm') {
            return Math.round(base * 1000000);
        }
        return Math.round(base);
    }
    normalizeTier(rawTier) {
        if (!rawTier)
            return 'standard';
        const normalized = String(rawTier).toLowerCase();
        if (normalized === 'basic')
            return 'basic';
        if (normalized === 'premium')
            return 'premium';
        return 'standard';
    }
    async tryAnalyzeWithLlm(transcript, targetTierHint) {
        if (!this.llmCaller)
            return null;
        const prompt = [
            'You are a negotiation intent parser for B2B pre-sales.',
            'Extract intent in strict JSON only. Do not include markdown.',
            'Never generate final quote or discount number.',
            'Allowed tier values: basic | standard | premium.',
            'Allowed confidence: high | medium | low.',
            'Schema:',
            '{',
            '  "selectedTierCandidate": "basic|standard|premium",',
            '  "clientBudgetVnd": number|null,',
            '  "clientCapabilities": string[],',
            '  "confidence": "high|medium|low",',
            '  "evidenceQuotes": string[],',
            '  "suggestions": string[],',
            '  "negotiationIntent": "budget_pushback|feature_tradeoff|scope_reduction|timeline_pressure|unknown"',
            '}',
            `Tier hint: ${targetTierHint || 'standard'}`,
            'Transcript:',
            transcript,
        ].join('\n');
        try {
            const raw = await this.llmCaller(prompt);
            const parsed = (0, safe_json_1.safeJsonParse)(raw);
            if (!parsed)
                return null;
            return parsed;
        }
        catch {
            return null;
        }
    }
    formatVnd(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(Math.round(amount));
    }
    unique(values) {
        const seen = new Set();
        const out = [];
        for (const value of values) {
            const key = value.trim();
            if (!key || seen.has(key))
                continue;
            seen.add(key);
            out.push(key);
        }
        return out;
    }
}
exports.NegotiationAdvisorService = NegotiationAdvisorService;
