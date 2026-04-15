# Kế hoạch chỉnh sửa Backend theo workflow mới (Phase 3 Negotiation)

## 1) Mục tiêu backend
- Không sinh/chốt 3 giá ngay khi vừa chuyển sang Deal giá (Phase 3).
- 3 giá chỉ được tạo khi đã có ngữ cảnh đàm phán đủ (analyze intent + confirm intent + recommend).
- Dữ liệu trả về phục vụ tab báo cáo 3 giá riêng: đầy đủ `tierQuotes`, `pricingContext`, `tradeoffRecommendations`, `warnings`, `auditLogId`.
- Giữ tương thích với flow hiện tại để frontend refactor UI không bị gãy.

---

## 2) Đánh giá Phase 3 backend cũ (hiện trạng)

## 2.1 Những gì đang đúng
- `POST /api/negotiation/analyze`:
  - phân tích transcript đàm phán,
  - chưa generate 3 giá trực tiếp.
- `POST /api/negotiation/recommend`:
  - từ `confirmedIntent` + session EM/scoping,
  - gọi calculator + tier pricing + tradeoff engine,
  - trả `tierQuotes`, recommendation, warning, script.
- Có audit log theo từng bước trong session (`intent_analyzed`, `recommendation_generated`, `playbook_confirmed`).

## 2.2 Các điểm cần siết lại theo workflow mới
- Chưa có "hợp đồng API" rõ để frontend biết trạng thái readiness của tab 3-Tier Report.
- Chưa có endpoint trạng thái phase/workflow cho session (frontend đang tự suy luận nhiều).
- Dữ liệu `tierQuotes` hiện vẫn thiên về cấu trúc quote cơ bản, chưa chuẩn hóa metadata phục vụ report chuyên biệt.

---

## 3) Những gì cần bỏ / hạn chế
- Không đưa logic "pre-generate 3 tiers" vào `/api/base-report`.
- Không để backend trả dữ liệu dễ gây hiểu nhầm rằng phase 3 đã sẵn sàng quote khi mới chuyển phase.
- Hạn chế fallback mơ hồ ở frontend; backend cần trả cờ trạng thái rõ ràng để UI quyết định.

---

## 4) Workflow backend mới (đề xuất)

1. **Base stage**
   - `GET /api/base-report` chỉ trả dữ liệu base/risk/commercial context cơ bản.
   - Không trả 3-tier output.

2. **Negotiation analyze stage**
   - `POST /api/negotiation/analyze` trả:
     - intent candidates,
     - confidence/evidence/suggestions,
     - `requiresHumanConfirm: true`.
   - Chưa có tier quotes.

3. **Negotiation recommend stage (điểm sinh 3 giá)**
   - `POST /api/negotiation/recommend` là điểm duy nhất sinh `tierQuotes`.
   - Kết quả bao gồm:
     - `tierQuotes`,
     - `tradeoffRecommendations`,
     - `pricingContext`,
     - `warnings`,
     - `auditLogId`.
   - Frontend dùng response này để mở tab `3-Tier Report`.

4. **Finalize stage**
   - `POST /api/negotiation/confirm-playbook` chốt phương án và lưu audit.

---

## 5) Chỉnh sửa API contract cần thực hiện

## 5.1 `GET /api/base-report`
- Giữ output hiện có cho base report.
- Bổ sung trường workflow nhẹ (không bắt buộc nhưng nên có):
  - `workflowPhase: "base_ready"`
  - `threeTierReady: false`

## 5.2 `POST /api/negotiation/analyze`
- Chuẩn hóa thêm:
  - `workflowPhase: "negotiation_analyzed"`
  - `threeTierReady: false`

## 5.3 `POST /api/negotiation/recommend`
- Chuẩn hóa output bắt buộc:
  - `tierQuotes` (required),
  - `tradeoffRecommendations` (required),
  - `pricingContext` (required),
  - `workflowPhase: "quote_recommended"`,
  - `threeTierReady: true`.
- Nếu không generate được recommendation:
  - trả lỗi rõ nghĩa (4xx/5xx),
  - không trả response nửa vời.

## 5.4 `POST /api/negotiation/confirm-playbook`
- Giữ logic cũ.
- Bổ sung:
  - `workflowPhase: "playbook_confirmed"` trong response.

---

## 6) File backend cần chỉnh sửa

1. `DEMO/src/controllers/calculator.controller.ts`
   - giữ `baseReport` sạch, không sinh 3 tier,
   - (tùy chọn) bổ sung cờ workflow trong JSON response.

2. `DEMO/src/controllers/negotiation.controller.ts`
   - chuẩn hóa shape response cho analyze/recommend/confirm-playbook,
   - đảm bảo `recommend` luôn có `tierQuotes` khi thành công,
   - thêm workflow phase flags.

3. `DEMO/src/types/negotiation.types.ts`
   - (tùy chọn) thêm type cho response DTO của từng endpoint để frontend dùng ổn định.

4. `DEMO/src/routes/negotiation.route.ts`
   - giữ route cũ, chỉ cập nhật nếu thêm endpoint status.

5. `DEMO/src/repositories/session.repository.ts`
   - (tùy chọn) lưu thêm `workflowPhase` trong session metadata nếu cần trace flow.

---

## 7) Endpoint bổ sung (khuyến nghị)

## 7.1 `GET /api/negotiation/status?sessionId=...`
Mục đích: cho frontend biết trạng thái workflow mà không cần suy luận từ nhiều API khác.

Đề xuất output:
```json
{
  "sessionId": "KHX-...",
  "workflowPhase": "base_ready | negotiation_analyzed | quote_recommended | playbook_confirmed",
  "threeTierReady": true,
  "lastRecommendationAuditId": "NEG-REC-...",
  "hasIntentAnalysis": true,
  "hasConfirmedPlaybook": false
}
```

---

## 8) Tiêu chí hoàn thành backend
- `/api/base-report` không sinh dữ liệu 3 giá.
- `/api/negotiation/recommend` là nguồn sinh 3 giá duy nhất.
- Response có cờ `threeTierReady` rõ ràng để UI tab 3 giá hoạt động đúng.
- Không phá vỡ audit logs và guardrails hiện có.
- Frontend có thể render tab 3-Tier Report chỉ dựa vào response backend, không cần precompute local.

---

## 9) Rủi ro kỹ thuật
- Frontend cũ vẫn có fallback local -> có thể che mất lỗi backend; cần chuẩn hóa thông báo fallback mode.
- Nếu thay đổi shape response đột ngột có thể gãy JS hiện tại; cần rollout theo hướng backward-compatible.
- Session in-memory: restart server sẽ mất trạng thái workflow/audit; cần lưu ý khi test UAT.

---

## 10) Thứ tự triển khai backend
1. Chuẩn hóa response `recommend` (tierQuotes + workflow flags).
2. Bổ sung workflow flags cho `base-report`, `analyze`, `confirm-playbook`.
3. (Tùy chọn) thêm endpoint `negotiation/status`.
4. Cập nhật type definitions.
5. Verify bằng flow API end-to-end với cùng một `sessionId`.
