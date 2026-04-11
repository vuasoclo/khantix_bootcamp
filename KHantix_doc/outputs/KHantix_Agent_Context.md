This project focuses on building the KHantix AI CPQ system, a tool designed to automate B2B IT pricing by translating "technical symptoms" into quantified financial risks.

SYSTEM ARCHITECTURE
The system operates based on a closed 3-tier model:
1. Investigator Tier (LLM): Acts as a Senior Pre-sales specialist, conducting discovery sessions with customers to identify hidden technical risks.
2. Inferencer Tier: Extracts conversational data into a standardized JSON structure.
3. Calculator Tier: Performs all price calculations using pure backend code; no AI is used for math in this step.

MANDATORY IMPLEMENTATION RULES
- No LLM Math: All calculations, including multiplier applications, base cost additions, and margin styling, must be handled by backend logic (not the LLM).
- SIMT Risk Model: All technical evaluations must center around four pillars: Setup (Infrastructure), Integration (APIs/Third-party), Migration (Data cleanliness), and Training (User adoption).
- Dual-Buffering: Clearly distinguish between the "Technical Buffer" (protecting the cost floor) and the "Commercial Buffer" (providing negotiation room for Sales).
- Explainability (No Black Box): Every pricing tier (Basic, Standard, Premium) must include a "reasonBehind" field in plain English. This field must explain which specific risk factors, multipliers, or scope decisions drove the price to that number. Sales must be able to read this field aloud to a customer or manager without further interpretation.

DATA INPUTS
- Internal Configurations (internal_configs.csv): Contains business constants such as daily rates, server costs, and target profit margins.
- Heuristic Matrix (heuristic_matrix.csv): A lookup table that helps the AI map customer keywords to specific risk levels (Low/Medium/High).

IMPLEMENTATION WORKFLOW
- Phase 1: Build the Calculator engine. Develop functions to calculate base costs, apply risk multipliers, and generate specific pricing tiers
- Phase 2: Design the Investigator script. The AI must act as an "Interview Expert," asking one clarification question at a time using anchoring techniques to probe budget without quoting prices too early.
- Phase 3: Integration and JSON Parsing. Establish the logic to parse LLM outputs and update session states in the database.

REFERENCE DOCUMENTS
- README.md: Architectural overview.
- KHantix_Summary_Foundation.md: Project philosophy.
- internal_configs.csv: Financial business parameters.

