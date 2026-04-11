Return valid JSON only.

Use this exact schema:
{
  "updatedSlots": {
    "Data_Risk": "HIGH | MEDIUM | LOW | FALLBACK | null",
    "Integration_Risk": "HIGH | MEDIUM | LOW | FALLBACK | null",
    "Tech_Literacy_Risk": "HIGH | MEDIUM | LOW | FALLBACK | null",
    "Hardware_Sizing": "TIER_SMALL | TIER_LARGE | null",
    "Scope_Granularity": "SMALL | ENTERPRISE | null",
    "Rush_Factor": "HIGH | LOW | null",
    "Client_Logo_Size": "SMB | ENTERPRISE | null",
    "Payment_Term": "UPFRONT | INSTALLMENT | null"
  },
  "nextQuestionToUser": "string",
  "inferencesMade": [
    {
      "slot": "string",
      "inferredValue": "string",
      "confidence": "low | medium | high",
      "reason": "string"
    }
  ],
  "allSlotsFilled": false
}

Rules:
- Set slot value to null if still unknown.
- Only update slots that new information was provided for in this turn.
- In inferencesMade, list any slots filled by AI inference rather than direct customer statement.
- Set allSlotsFilled to true only when every slot has a non-null value.
- No markdown fences. No extra text. Valid JSON only.
