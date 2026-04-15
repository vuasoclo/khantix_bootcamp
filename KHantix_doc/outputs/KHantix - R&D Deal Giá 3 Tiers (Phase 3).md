# KHantix - R&D Triển khai Kiến trúc Cứng/Mềm cho Deal Giá (Phase 3)

Ngày cập nhật: 2026-04-14  
Phạm vi: Triển khai Phase 3 vào codebase DEMO hiện tại (TypeScript + Node.js)

---

## 1. Mục tiêu thiết kế

### 1.1 Mục tiêu nghiệp vụ
1. Sau khi đã có giá gốc và giá khuyến nghị, hệ thống phải tạo 3 phương án thương mại: Basic, Standard, Premium.
2. Khi khách phản hồi về ngân sách, hệ thống không tự deal trực tiếp với khách mà chỉ tạo "playbook" để pre-sales dùng khi đàm phán.
3. Mỗi đề xuất giảm giá phải có giải thích rõ: giảm do cắt scope nào, chuyển risk nào, điều khoản hợp đồng nào cần thêm.

### 1.2 Mục tiêu kỹ thuật
1. Tách cứng/mềm rõ ràng:
   - Core cứng (deterministic): tính số, kiểm ràng buộc, kiểm dependency, tối ưu phương án.
   - AI mềm (probabilistic): đọc ngôn ngữ tự nhiên, trích xuất ý định/budget, sinh câu chữ hỗ trợ sales.
2. Tất cả con số tiền/man-days/ảnh hưởng phải do Core cứng tính.
3. AI output bắt buộc qua human confirmation trước khi Core chạy quyết định.

### 1.3 Bất biến First Principles (không được vi phạm)
1. Price = Scope + Risk + Margin.
2. Không giảm margin vô tội vạ để khớp ngân sách.
3. Không dùng range random cho effort/price ở bước quyết định.
4. Mọi đề xuất đều traceable về evidence và policy.

---

## 2. Dự án hiện tại đã có gì (thực trạng codebase)

### 2.1 Stack thực tế
1. Backend đang chạy TypeScript trên Node.js (Express):
   - `DEMO/src/server.ts`
   - `DEMO/src/routes/*.route.ts`
2. LLM đã tách adapter:
   - `DEMO/src/llm/llm-adapter.ts`
   - `DEMO/src/llm/gemini.adapter.ts`
3. Core tính giá đã có nền:
   - `DEMO/src/calculators/em.calculator.ts`
   - `DEMO/src/calculators/base-cost.calculator.ts`
4. Session + override đã có:
   - `DEMO/src/repositories/session.repository.ts`
   - `DEMO/src/controllers/calculator.controller.ts`

Kết luận: Không cần đổi công nghệ. Cần mở rộng kiến trúc trên nền hiện có.

---

## 3. Kiến trúc mục tiêu: Core cứng + AI mềm

## 3.1 Core cứng (Deterministic Decision Layer)

### A. Tier Pricing Engine
Nhiệm vụ:
1. Nhận baseline từ calculator hiện tại.
2. Sinh 3 gói Basic/Standard/Premium theo policy cố định (không do LLM quyết định).
3. Trả ra breakdown và differencing giữa các gói.

Đầu vào:
1. `PriceBreakdown` từ `calculateWithEM`.
2. Cấu hình tier policy (margin, phạm vi dịch vụ, SLA level, ownership matrix).

Đầu ra:
1. `TierQuote[]` gồm price, scope, risk owner, điều khoản bắt buộc.

### B. Trade-off Engine (Budget Gap Solver)
Nhiệm vụ:
1. Tính budget gap: `gap = selectedTierPrice - clientBudget`.
2. Chọn tập "Negotiation Cards" để lấp gap.
3. Kiểm ràng buộc dependency + operation + legal.
4. Xuất tối đa 3 phương án chốt cho pre-sales.

Mô hình thuật toán:
1. Bài toán tối ưu có ràng buộc (0/1 knapsack + constraint filters).
2. Hàm mục tiêu:
   - Ưu tiên lấp gap đủ.
   - Giảm thấp nhất impact lên business value.
   - Không vi phạm dependency graph.
   - Không vi phạm operation feasibility.

### C. Guardrail Validator
Nhiệm vụ:
1. `Dependency Breakage`: kiểm module phụ thuộc.
2. `Operation Failure`: kiểm năng lực phía khách trước khi chuyển trách nhiệm.
3. `Contract Risk`: ép sinh clause bắt buộc nếu chuyển risk.
4. `Pricing Integrity`: chặn mọi đề xuất làm margin rơi dưới floor.

### D. Explainability Composer
Nhiệm vụ:
1. Build "vì sao giảm được từng khoản" từ line item cứng.
2. Build "vì sao phải thêm điều khoản" từ policy cứng.
3. Cung cấp evidence cho UI/report/audit.

---

## 3.2 AI mềm (Advisory Language Layer)

### A. Negotiation Parser (LLM)
Nhiệm vụ:
1. Đọc transcript/email từ sales.
2. Trích xuất cấu trúc chuẩn:
   - `budgetCandidate`
   - `selectedTierCandidate`
   - `clientCapabilities`
   - `negotiationIntent`
3. Trả confidence + evidence quote.

Ràng buộc:
1. Không xuất số giá cuối cùng.
2. Không chọn trade-off card.
3. Output luôn ở dạng JSON schema cứng.

### B. Sales Script Generator (LLM)
Nhiệm vụ:
1. Nhận kết quả cứng từ Trade-off Engine.
2. Viết câu chữ mềm cho pre-sales:
   - mở đầu thấu cảm,
   - trình bày 2-3 phương án,
   - nêu điều kiện hợp đồng bắt buộc,
   - tránh ngôn ngữ cam kết sai.

Ràng buộc:
1. Chỉ paraphrase dữ liệu đã được Core duyệt.
2. Không tự chế thêm discount.

---

## 3.3 Human-in-the-loop Gate (bắt buộc)

Luồng xác nhận:
1. LLM Parser xuất `budgetCandidate` + `selectedTierCandidate`.
2. UI yêu cầu pre-sales Confirm/Edit.
3. Chỉ khi Confirm, Core mới chạy Trade-off Engine.
4. Mọi lần chỉnh tay phải log audit.

---

## 4. Thiết kế dữ liệu triển khai

Đề xuất thêm type mới trong `DEMO/src/types/negotiation.types.ts`:

```ts
export interface NegotiationCard {
  cardId: string;
  title: string;
  category: 'scope_cut' | 'risk_transfer' | 'commercial_term';
  estimatedSavingVnd: number;
  valueImpactScore: number; // 1-10 (10 = ảnh hưởng rất nặng)
  operationRiskScore: number; // 1-10
  requiresClientCapability: string[];
  blocksIfMissingModules?: string[];
  requiresContractClauses: string[];
  explanationTemplate: string;
}

export interface TierQuote {
  tier: 'basic' | 'standard' | 'premium';
  priceVnd: number;
  scopeModules: string[];
  clientResponsibilities: string[];
  vendorResponsibilities: string[];
  mandatoryClauses: string[];
  explanation: string[];
}

export interface NegotiationIntent {
  sessionId: string;
  selectedTier: 'basic' | 'standard' | 'premium';
  clientBudgetVnd: number;
  clientCapabilities: string[];
  confidence: 'high' | 'medium' | 'low';
  evidenceQuotes: string[];
}

export interface TradeoffRecommendation {
  targetGapVnd: number;
  coveredGapVnd: number;
  selectedCards: NegotiationCard[];
  mandatoryClauses: string[];
  residualGapVnd: number;
  warnings: string[];
}
```

---

## 5. API triển khai vào dự án hiện tại

Thêm route mới: `DEMO/src/routes/negotiation.route.ts`

### 5.1 POST /api/negotiation/analyze
Input:
1. `sessionId`
2. `transcript`
3. `targetTierHint` (optional)

Output:
1. `intentCandidates` (budget/tier/capabilities)
2. `confidence`
3. `evidence`
4. `requiresHumanConfirm: true`

### 5.2 POST /api/negotiation/recommend
Input:
1. `sessionId`
2. `confirmedIntent` (budget + tier + capabilities)

Output:
1. `tierQuotes`
2. `tradeoffRecommendations` (top 3)
3. `warnings`
4. `salesScriptDraft`

### 5.3 POST /api/negotiation/confirm-playbook
Input:
1. `sessionId`
2. `selectedRecommendationId`
3. `salesNotes`

Output:
1. bản playbook final để sales dùng trong cuộc họp.
2. audit log id.

---

## 6. Mapping file-level vào codebase

## 6.1 File mới nên tạo
1. `DEMO/src/types/negotiation.types.ts`
2. `DEMO/src/config/negotiation-cards.loader.ts`
3. `DEMO/src/services/tier-pricing.service.ts`
4. `DEMO/src/services/tradeoff-engine.service.ts`
5. `DEMO/src/services/guardrail-validator.service.ts`
6. `DEMO/src/services/negotiation-advisor.service.ts`
7. `DEMO/src/controllers/negotiation.controller.ts`
8. `DEMO/src/routes/negotiation.route.ts`
9. `DEMO/src/prompts/negotiation/parser.system.prompt.md`
10. `DEMO/src/prompts/negotiation/parser.output-format.prompt.md`
11. `DEMO/src/prompts/negotiation/script.system.prompt.md`

## 6.2 File hiện có cần mở rộng
1. `DEMO/src/server.ts`
   - mount thêm `negotiation.route`.
2. `DEMO/src/repositories/session.repository.ts`
   - thêm `negotiationLogs`.
3. `DEMO/src/types/pricing-output.types.ts`
   - thêm object cho `tierQuotes` hoặc type alias dùng lại.
4. `DEMO/src/calculators/em.calculator.ts`
   - giữ nguyên nguyên tắc tính cứng; không đưa logic đàm phán vào đây.

---

## 7. Cơ chế xử lý 3 lỗi lớn (FP2)

| Failure Class | Root Cause | Guardrail Core cứng | Guardrail AI mềm | Test bắt buộc |
| :-- | :-- | :-- | :-- | :-- |
| Dependency Breakage | Cắt module không biết quan hệ phụ thuộc | Duy trì dependency graph và reject combo invalid | AI chỉ nhận danh sách card đã pass graph | Unit test tổ hợp card invalid bị loại |
| Operation Failure | Chuyển việc cho khách nhưng khách không đủ năng lực | Rule engine yêu cầu capability + mandatory SLA clause | AI buộc hiển thị warning hợp đồng | Scenario test khách thiếu capability -> reject |
| Hallucination | LLM bắt nhầm ngân sách/ý định | Core không chạy nếu chưa confirm | Parser trả confidence + evidence quote | Test parse mơ hồ -> status pending review |

---

## 8. Mô hình tham khảo quốc tế và cách áp dụng

1. Good-Better-Best packaging (SaaS/Enterprise pricing):
   - áp dụng để tạo 3 tier có anchor rõ ràng.
2. Value-based negotiation:
   - giảm giá luôn gắn với giảm scope hoặc chuyển risk owner.
3. CPQ governance pattern:
   - mọi override phải audit trail.
4. LLMOps guardrail pattern:
   - structured output + confidence gate + human approval.
5. Constraint optimization:
   - chọn trade-off cards bằng solver có ràng buộc thay vì rule if/else đơn giản.

---

## 9. Lộ trình triển khai theo sprint

### Sprint 1 - Foundation (Core models + APIs)
1. Thêm types và cards loader.
2. Tạo controller/route skeleton cho negotiation.
3. Mở rộng session repository để lưu logs.
4. Viết test schema validation.

Kết quả mong đợi:
1. API chạy được với mock output.

### Sprint 2 - Deterministic engines
1. Implement Tier Pricing Engine.
2. Implement Trade-off Engine + Guardrail Validator.
3. Implement Explainability composer.
4. Viết unit tests cho dependency/operation/legal guardrails.

Kết quả mong đợi:
1. Có top 3 phương án trade-off deterministic.

### Sprint 3 - AI layer integration
1. Prompt parser + prompt script generator.
2. Kết nối `createLlmCaller()` hiện có.
3. Thêm human confirmation gates vào payload.
4. Snapshot test output JSON parser.

Kết quả mong đợi:
1. Parser AI ổn định, không phá deterministic core.

### Sprint 4 - Hardening
1. E2E test từ transcript -> playbook.
2. Audit report + metrics.
3. Anti-regression scenarios cho 3 failure classes.
4. Tối ưu latency và fallback khi LLM lỗi.

Kết quả mong đợi:
1. Sẵn sàng pilot nội bộ cho team pre-sales.

---

## 10. KPI và tiêu chí nghiệm thu

### 10.1 KPI vận hành
1. Tỷ lệ đề xuất cần sửa tay bởi sales < 30% sau 1 tháng pilot.
2. Tỷ lệ đề xuất vi phạm dependency = 0%.
3. Tỷ lệ parse nhầm budget quan trọng < 5% (có gate confirm).
4. Thời gian sinh playbook < 3 giây (không tính thời gian chờ LLM).

### 10.2 Definition of Done
1. Mọi recommendation có evidence + clause + warnings.
2. Không có nhánh nào cho phép auto-discount vượt floor margin.
3. Mọi override đều vào audit log.
4. E2E tests pass cho 3 failure classes.

---

## 11. Kết luận triển khai

Với độ đa dạng đàm phán cao, chiến lược đúng không phải là làm AI "thông minh toàn năng", mà là:
1. Đẩy toàn bộ phần quyết định tài chính/pháp lý vào Core cứng deterministic.
2. Giữ AI ở vai trò mềm: hiểu ngữ nghĩa và viết kịch bản giao tiếp cho sales.
3. Dùng human-in-the-loop để khóa rủi ro hallucination.

Thiết kế này phù hợp trực tiếp với codebase DEMO hiện tại, tận dụng được calculator/session/llm adapter sẵn có và mở rộng theo module nhỏ, triển khai từng sprint mà không phải đập đi làm lại.