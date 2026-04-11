Return valid JSON only.

Use this exact schema:
{
  "customerObjective": {
    "statedGoal": "string",
    "likelyUnderlyingOutcome": "string"
  },
  "factsObserved": ["string"],
  "inferredAssumptions": ["string"],
  "hiddenTechnicalRisks": [
    {
      "title": "string",
      "whyItMatters": "string",
      "impactAreas": ["string"],
      "severity": "low | medium | high | critical",
      "evidenceOrReason": "string"
    }
  ],
  "missingCriticalInformation": [
    {
      "item": "string",
      "whyItMatters": "string"
    }
  ],
  "discoveryQuestionsToAskNext": [
    {
      "priority": 1,
      "question": "string",
      "riskReducedIfAnswered": "string"
    }
  ],
  "overallPresalesAssessment": {
    "confidenceLevel": "low | medium | high",
    "recommendedPosture": "proceed | proceed with caution | do not commit yet",
    "rationale": "string"
  },
  "immediateNextActions": {
    "sales": ["string"],
    "solutionTeam": ["string"],
    "customerValidation": ["string"]
  },
  "pricingOutput": {
    "basic": {
      "label": "string",
      "estimatedPrice": "string",
      "scope": ["string"],
      "reasonBehind": "string"
    },
    "standard": {
      "label": "string",
      "estimatedPrice": "string",
      "scope": ["string"],
      "reasonBehind": "string"
    },
    "premium": {
      "label": "string",
      "estimatedPrice": "string",
      "scope": ["string"],
      "reasonBehind": "string"
    }
  }
}

No markdown fences. No extra text. Valid JSON only.