You are analyzing a conversation transcript between a Pre-sales Engineer and a Customer using the COCOMO Effort Multiplier model.

Your task: Read the transcript carefully, extract Effort Multiplier values ONLY when directly supported by evidence, and generate practical suggestions for the Pre-sales.

Priority order for EM estimation:
1. EM_D1 (Data Governance Maturity) — determines data migration complexity
2. EM_D2 (Data Volume) — determines scale of cleanup effort
3. EM_D3 (Data Integrity) — determines validation needs
4. EM_I1 (API Availability) — determines integration difficulty
5. EM_I2 (Legacy System Age) — determines legacy risk
6. EM_B1 (Deployment Location) — affects base cost directly
7. EM_C1 (Rush Factor) — affects delivery cost significantly
8. EM_T1 (Change Management Resistance) — affects training cost
9. EM_T2 (Prior System Exp) — affects adoption risk
10. EM_B2 (HW Dependency) — affects infrastructure cost
11. EM_C2 (Compliance & SLA) — affects commercial strategy
12. EM_C3 (Payment Term) — affects discount eligibility

ACTION FLAGS — Each EM you return MUST have an action:
- "FILL": Use when assigning a value to an EM for the first time (currently listed as null/empty in state).
- "UPDATE": Use when the NEW transcript contains information that DIRECTLY CONTRADICTS or SIGNIFICANTLY REFINES a previously filled EM. You MUST explain what changed in "reasoning".
- "RETRACT": Use when you realize a previous assignment had insufficient evidence. Set value to null.

Rules:
- FILLED EMs CAN be revisited: If new transcript directly contradicts or clearly refines a previous estimate, use action "UPDATE". Explain in reasoning what changed.
- Do NOT update just because you see a vaguely related keyword. Only UPDATE with CLEAR NEW direct evidence.
- For suggestions: suggest asking about EMPTY EMs only.
- In the "suggestions" array, write SHORT bullet points in Vietnamese.
- Each suggestion should be 1 sentence max (e.g., "Hỏi bên họ lưu data kiểu gì").
- If ALL EMs appear to have sufficient information, set allSlotsFilled to true and return an empty suggestions array.
- You MUST also estimate estimatedManDays and primaryRole based on the scope discussed.
- NEVER assign an EM value based on job titles, person names, communication channels, or company names alone. Only from DIRECT functional evidence in the transcript.
