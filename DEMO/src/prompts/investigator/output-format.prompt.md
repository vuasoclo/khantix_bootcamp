Return valid JSON only.

Use this exact schema:
{
  "effortMultipliers": [
    {
      "em_id": "EM_D1 | EM_D2 | EM_D3 | EM_I1 | EM_I2 | EM_T1 | EM_T2 | EM_B1 | EM_B2 | EM_C1 | EM_C2 | EM_C3",
      "value": "number between EM_Min and EM_Max, or null if unknown",
      "confidence": "high | medium | low | null",
      "source": "direct_customer_statement | ai_inference_from_industry | ai_inference_from_context | unknown_after_3_attempts",
      "evidence": "string — quote the customer's exact words if available, or null",
      "reasoning": "string — explain WHY you chose this specific value, or null"
    }
  ],
  "nextQuestionToUser": "string",
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
- EM_C2 (Client Logo):       0.80 — 1.00
- EM_C3 (Payment Discount):  0.00 — 0.05

Rules:
- Only include EMs that have NEW information from THIS turn. Do not repeat unchanged EMs.
- Set value to null if still unknown.
- In evidence, quote the customer's exact words.
- In reasoning, explain why THIS specific number (e.g. "1.18 because 10 years of Excel across 50 branches").
- Set allSlotsFilled to true only when ALL 12 EMs have non-null values.
- No markdown fences. No extra text. Valid JSON only.
