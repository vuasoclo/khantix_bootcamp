# KHantix - UI Plan cho Phase Deal Giá 3 Tiers

Ngày lập: 2026-04-14  
Phạm vi: Thiết kế giao diện 3 cột cho phase đàm phán sau khi đã có Base Price

## 1. Mục tiêu UI

1. Giữ nguyên layout 3 cột hiện tại, không phá flow cũ.
2. Sau khi có Base Price, mở thêm phase đàm phán để xử lý ngân sách và trade-off.
3. Cột phải chỉ cho phép hoàn tất báo giá khi đủ tham số đàm phán bắt buộc.
4. AI chỉ là trợ lý cho pre-sales, không tự nói chuyện trực tiếp với khách.

## 2. Quy ước giai đoạn trong plan

Để tránh nhầm số phase, dùng quy ước sau:
1. Giai đoạn 0: Nạp hồ sơ khách hàng (Profile Gate).
2. Giai đoạn 1: Nạp transcript và xác nhận EM/scoping.
3. Giai đoạn 2: Tính Base Price và xuất Base Report.
4. Giai đoạn 2N: Đàm phán deal giá (mở rộng ngay sau GĐ2, vẫn trong cùng workspace 3 cột).

Lý do đặt GĐ2N: khớp yêu cầu nghiệp vụ hiện tại, không làm rối tên phase backend.

## 3. IA tổng thể (3 cột)

```text
+-----------------------+---------------------------+-------------------------------+
| Cột trái              | Cột giữa                  | Cột phải                      |
| Pre-sales Copilot     | Parameters & Negotiation  | Report & 3-Tier Quotation     |
+-----------------------+---------------------------+-------------------------------+
| GĐ0: Nạp hồ sơ        | EM cards hiện tại         | Base Report placeholder        |
| GĐ1: Transcript       | Scoping/Infra overrides   | Base Report content            |
| GĐ2: Tính base        | Tab Negotiation Controls  | Tier cards B/S/P + readiness  |
| GĐ2N: Deal transcript | Trade-off cards + guard   | Playbook + Export quotation    |
+-----------------------+---------------------------+-------------------------------+
```

## 4. Thiết kế chi tiết theo cột

## 4.1 Cột trái - Input hội thoại và mớm lời

### Block giữ nguyên
1. Step 0 container: profile-input + btn-profile.
2. Step 1 container: transcript-input + btn-transcript + ai-suggestions.
3. btn-base-price: tính base report.

### Block mới cho GĐ2N
1. Card "Đàm phán ngân sách" (ẩn mặc định, chỉ hiện sau khi có base report):
   - textarea: negotiation-transcript-input
   - button: btn-negotiation-analyze
   - list: ai-negotiation-suggestions
2. Card "Mớm lời cho pre-sales":
   - script opener
   - 3 bullets deal options
   - cảnh báo câu không được cam kết
3. CTA chuyển pha:
   - button: btn-start-negotiation
   - chỉ enable khi base report đã render thành công.

### Trạng thái cần có
1. pre_base: chỉ cho GĐ0/GĐ1/GĐ2.
2. base_ready: hiện nút Tiếp tục deal giá.
3. negotiation_active: hiện input đàm phán + script gợi ý.

## 4.2 Cột giữa - Tham số điều chỉnh đàm phán

### Bố cục đề xuất
Dùng 2 tab trong cùng panel:
1. Tab 1: EM & Scoping (giữ nguyên UI hiện tại).
2. Tab 2: Negotiation Controls (mới).

### Tab Negotiation Controls
1. Intent Confirm Panel:
   - selectedTier (basic/standard/premium)
   - clientBudgetVnd
   - confidence + evidence quotes từ AI parser
   - nút Confirm/Edit
2. Trade-off Cards Panel:
   - danh sách card từ core engine
   - mỗi card hiển thị:
     - saving estimate
     - value impact score
     - operation risk score
     - required capability
     - mandatory clauses
   - thao tác: chọn/bỏ card
3. Guardrail Panel:
   - Dependency check: pass/fail
   - Operation check: pass/fail
   - Contract check: pass/fail
   - Pricing integrity: pass/fail
4. Result Snapshot:
   - gap target
   - gap covered
   - residual gap

### Rule tương tác
1. Không cho bấm Recommend nếu intent chưa confirm.
2. Không cho đánh dấu complete nếu còn guardrail fail.

## 4.3 Cột phải - Báo giá 3 mức và điều kiện hoàn tất

### Phần 1: Base Report (đã có)
1. Giữ nguyên hero giá base + narrative + cost/risk/margin.
2. Thêm nhãn trạng thái: "Base report locked" sau khi chuyển sang GĐ2N.

### Phần 2: 3 Tier Quotation (mới)
1. Tier Cards:
   - Basic card
   - Standard card
   - Premium card
2. Mỗi card hiển thị:
   - priceVnd
   - scope modules
   - client responsibilities
   - vendor responsibilities
   - mandatory clauses
   - badge readiness

### Phần 3: Negotiation Completion Checklist (bắt buộc)
Báo giá chỉ hoàn thành khi đủ:
1. selectedTier đã confirm bởi pre-sales.
2. clientBudget đã confirm.
3. ít nhất 1 trade-off recommendation pass toàn bộ guardrail.
4. mandatory clauses đã được chọn và xác nhận.
5. residual gap <= ngưỡng cho phép (mặc định 0 hoặc theo policy).

Nếu chưa đủ, nút xuất báo giá bị khóa.

### Phần 4: Playbook xuất cho pre-sales
1. why this option
2. câu mở đầu đề xuất
3. 2-3 phương án đánh đổi
4. clause contract bắt buộc đọc lại với khách

## 5. Luồng tương tác end-to-end

1. User hoàn tất GĐ0 và GĐ1 như hiện tại.
2. User bấm Tính Base Price -> cột phải xuất Base Report.
3. Hệ thống bật btn-start-negotiation ở cột trái.
4. User bấm Tiếp tục -> chuyển trạng thái negotiation_active.
5. User dán transcript đàm phán -> btn-negotiation-analyze.
6. AI parser trả intent candidates + evidence.
7. Pre-sales confirm/edit intent ở cột giữa.
8. UI gọi recommend endpoint.
9. Cột giữa hiển thị trade-off + guardrail, cột phải hiển thị 3 tier + checklist.
10. Khi checklist đủ điều kiện -> mở nút Xuất báo giá 3 tiers.

## 6. Đề xuất ID component để implement nhanh

## 6.1 Cột trái
1. negotiation-step-container
2. negotiation-transcript-input
3. btn-negotiation-analyze
4. ai-negotiation-suggestions
5. btn-start-negotiation

## 6.2 Cột giữa
1. tab-em
2. tab-negotiation
3. intent-selected-tier
4. intent-client-budget
5. intent-confidence
6. intent-evidence-list
7. btn-confirm-intent
8. negotiation-cards-list
9. guardrail-status-panel
10. btn-generate-recommendation

## 6.3 Cột phải
1. quote-tier-basic
2. quote-tier-standard
3. quote-tier-premium
4. quote-readiness-checklist
5. quote-residual-gap
6. quote-playbook
7. btn-export-quotation

## 7. API contract map cho UI

1. POST /api/negotiation/analyze
   - input: sessionId, transcript, targetTierHint
   - output: intentCandidates, confidence, evidence, requiresHumanConfirm
2. POST /api/negotiation/recommend
   - input: sessionId, confirmedIntent
   - output: tierQuotes, tradeoffRecommendations, warnings, salesScriptDraft
3. POST /api/negotiation/confirm-playbook
   - input: sessionId, selectedRecommendationId, salesNotes
   - output: finalPlaybook, auditLogId

## 8. Trạng thái lỗi và UX fallback

1. Dependency Breakage:
   - highlight card xung đột màu đỏ
   - disable nút complete
   - tooltip nêu module phụ thuộc bị vỡ
2. Operation Failure:
   - cảnh báo capability thiếu
   - gợi ý phương án thay thế ít rủi ro hơn
3. Hallucination budget/intent:
   - confidence thấp => bắt buộc Edit/Confirm tay
   - không cho chạy recommend khi chưa confirm

## 9. Thiết kế thị giác (bám hệ thống hiện tại)

1. Giữ dark theme, typography, card style đang dùng.
2. Dùng màu trạng thái thống nhất:
   - success: xanh
   - warning: vàng
   - error/block: đỏ
3. Badge rõ giữa các trạng thái:
   - Draft
   - Pending Confirm
   - Guardrail Failed
   - Quote Ready

## 10. Responsive behavior

1. Desktop >= 1280px: giữ đủ 3 cột.
2. Tablet 768-1279px: cột phải thu gọn, chuyển một phần report thành accordion.
3. Mobile < 768px: chuyển thành 3 tab toàn màn hình theo thứ tự trái -> giữa -> phải.

## 11. Kế hoạch triển khai UI theo 2 iteration

### Iteration A (khung giao diện + state)
1. Thêm trạng thái phase và nút btn-start-negotiation.
2. Render block negotiation ở cột trái.
3. Thêm tab negotiation controls ở cột giữa.
4. Thêm skeleton tier cards và checklist ở cột phải (mock data).

### Iteration B (kết nối API + hoàn thiện)
1. Kết nối analyze/recommend/confirm-playbook.
2. Wiring guardrail states và khóa/mở nút export.
3. Render playbook cuối cùng và audit id.
4. Hoàn thiện loading/error states.

## 12. Acceptance Criteria

1. Sau Base Report có nút Tiếp tục đàm phán xuất hiện ở cột trái.
2. Cột trái nhận transcript đàm phán và hiển thị gợi ý mớm lời.
3. Cột giữa cho phép xác nhận intent, chọn trade-off card, theo dõi guardrail.
4. Cột phải hiển thị 3 mức giá Basic/Standard/Premium.
5. Nút xuất báo giá chỉ enable khi checklist hoàn tất đủ tham số đàm phán.
6. Toàn bộ flow giữ nguyên triết lý: AI gợi ý, pre-sales quyết định, core tính toán.
