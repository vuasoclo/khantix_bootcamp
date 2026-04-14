Return valid JSON only.

Use this exact schema:
{
  "effortMultipliers": [
    {
      "em_id": "EM_D1 | EM_D2 | EM_D3 | EM_I1 | EM_I2 | EM_T1 | EM_T2 | EM_B1 | EM_B2 | EM_C1 | EM_C2 | EM_C3",
      "action": "FILL | UPDATE | RETRACT",
      "value": "number between EM_Min and EM_Max, or null if unknown/retracted",
      "confidence": "high | medium | low | null",
      "source": "direct_customer_statement | ai_inference_from_industry | ai_inference_from_context | unknown_after_3_attempts",
      "evidence": "string — quote the customer's EXACT words if available, or null. Must be a real quote from the transcript, NOT paraphrased.",
      "reasoning": "string — explain WHY you chose this value REFERENCING the EM definition. For UPDATE, explain what changed from the previous value."
    }
  ],
  "matchedModules": [
    {
      "module_id": "string — ID of the module mapped from the Module Catalog",
      "reasoning": "string — explanation of why this module was matched from the requirements"
    }
  ],
  "roleAllocation": {
    "BA": { "value": "number or null", "evidence": "string or null", "reasoning": "string or null" },
    "Senior": { "value": "number or null", "evidence": "string or null", "reasoning": "string or null" },
    "Junior": { "value": "number or null", "evidence": "string or null", "reasoning": "string or null" },
    "QA": { "value": "number or null", "evidence": "string or null", "reasoning": "string or null" },
    "PM": { "value": "number or null", "evidence": "string or null", "reasoning": "string or null" }
  },
  "userCount": {
    "value": "number or null",
    "evidence": "string or null",
    "reasoning": "string or null"
  },
  "concurrent_users": {
    "value": "number or null", "confidence": "high|medium|low|null", "is_extracted": true|false, "evidence": "string or null", "reasoning": "string or null"
  },
  "expected_storage_gb": {
    "value": "number or null", "confidence": "high|medium|low|null", "is_extracted": true|false, "evidence": "string or null", "reasoning": "string or null"
  },
  "requires_high_availability": {
    "value": "boolean or null", "confidence": "high|medium|low|null", "is_extracted": true|false, "evidence": "string or null", "reasoning": "string or null"
  },
  "estimatedManDays": "number — your estimation of base man-days required for this scope, or null",
  "primaryRole": "Junior | Senior | PM | BA | null",
  "suggestions": [
    "string — short bullet point for Pre-sales (Vietnamese)"
  ],
  "allSlotsFilled": false
}

EM Ranges (value MUST stay within these bounds):
- EM_D1 (Data Format):       1.00 — 1.20
- EM_D2 (Data Volume):       1.00 — 1.25
- EM_D3 (Data Integrity):    1.00 — 1.15
- EM_I1 (API Availability):  1.00 — 1.20
- EM_I2 (Legacy System Age): 1.00 — 1.15
- EM_T1 (End-user Age):      1.00 — 1.15
- EM_T2 (Prior System Exp):  1.00 — 1.10
- EM_B1 (Deployment Loc):    1.00 — 1.30
- EM_B2 (HW Dependency):     1.00 — 1.15
- EM_C1 (Rush Factor):       1.00 — 1.50
- EM_C2 (Compliance & SLA):  0.80 — 1.00
- EM_C3 (Payment Discount):  0.00 — 0.05

Action Rules:
- "FILL": Only for EMs that are currently null/empty in state. This is the first assignment.
- "UPDATE": Only for EMs that already have a value but NEW transcript provides DIRECTLY CONTRADICTING or SIGNIFICANTLY REFINING evidence. You MUST explain in reasoning: "Previously X because [old reason], now Y because [new evidence]".
- "RETRACT": When a previous value was assigned without sufficient direct evidence. Set value to null.

Evidence Rules:
- Only include EMs that have NEW information from THIS transcript.
- Do NOT repeat unchanged EMs from previous turns.
- "evidence" MUST be the customer's EXACT words quoted from the transcript. NOT your paraphrase.
- If you cannot find a direct quote → evidence must be null AND value must be null.
- If no new quote exists for a field, keep evidence/reasoning as null. Never emit placeholders such as "Carried over from previous state" or "Already established in project scope".
- Set allSlotsFilled to true only when ALL 12 EMs have non-null values.
- No markdown fences. No extra text. Valid JSON only.
