# Tổng kết Cập nhật KHantix AI CPQ - Phase 3 (Đàm phán & Giá 3 Tầng)

Tài liệu này tóm tắt toàn bộ quá trình phát triển và các thay đổi đã được thực hiện để tích hợp Phase 3 (Giai đoạn báo giá 3 lựa chọn và Hệ thống Đàm phán) vào dự án KHantix AI CPQ.

## 1. Mục tiêu (Objectives)
Tích hợp quy trình thương lượng ngân sách (Phase 3) sau khi hệ thống đã tính toán xong Effort Multipliers (EMs) và Base Cost (Phase 1 & 2). 
Quyết định kiến trúc quan trọng: Hệ thống sử dụng **Deterministic Core** (Quy tắc logic cứng) để sinh ra tuỳ chọn báo giá và kiểm soát rủi ro, kết hợp **Soft AI** để phân tích ý định giao tiếp của khách hàng.

## 2. Kiến trúc & Logic Backend (Core Services)
Các service lõi mới được thêm vào thư mục `DEMO/src/services/` nhằm đảm bảo tính toàn vẹn tài chính:

*   **`tier-pricing.service.ts` (Sinh báo giá 3 Tầng):** Tự động dàn trải Base Cost ra 3 phương án (Basic, Standard, Premium) bằng cách điều chỉnh biên độ lợi nhuận (Margin), chi phí rủi ro dự phòng (Contingency) và cắt giảm các module không thiết yếu.
*   **`tradeoff-engine.service.ts` (Động cơ Gợi ý Phương án thay thế):** Khi khách hàng ép giá (Budget Pushback), engine sẽ quét trong danh mục Trade-off (ví dụ: đổi server Dedicated sang Shared, giảm User, đổi SLA) và tính toán điểm phạt (Penalty) nhằm giữ vững tỉ suất lợi nhuận.
*   **`guardrail-validator.service.ts` (Hệ thống Rào chắn An toàn - Guardrails):** Kiểm tra các điều kiện sinh tồn của Deal như:
    *   *Dependency:* Không cho phép bỏ module Core (như Database) nếu các module khác đang phụ thuộc.
    *   *Operation:* Không cho phép chuyển giao IT (Handover) nếu khách hàng không có `it_team`.
    *   *Margin Floor:* Chặn mọi nỗ lực giảm giá vượt quá biên độ lợi nhuận tối thiểu cấu hình sẵn.
*   **`negotiation-advisor.service.ts` (AI Cố vấn Đàm phán):** Bọc các service trên, nhận diện ý đồ đàm phán của khách hàng thông qua transcript (đắt quá, so sánh đối thủ, v.v.), sau đó tạo ra "Kịch bản mớm lời" (Sales Script Draft) cho Pre-sales.

## 3. APIs định tuyến đàm phán (Controllers & Routes)
Mở rộng API trên Express server (`DEMO/src/routes/` và `DEMO/src/controllers/`):

*   `POST /api/negotiation/analyze`: Xử lý đoạn hội thoại đàm phán để trích xuất `Client Intent` (Ngân sách thực tế, ý định ép giá, năng lực của khách).
*   `POST /api/negotiation/recommend`: Nhận Base Cost và Intent, chạy qua Tier-Pricing và Tradeoff-Engine để trả về các gói báo giá (Tier Quotes) và các Trade-off (Đổi chác) được phép.
*   `POST /api/negotiation/confirm-playbook`: Pre-sales chốt lại phương án (Playbook) sau khi chọn Tier và các Guardrail được xác nhận qua Validator. Sinh kịch bản giao tiếp cuối.

## 4. Danh mục & Kiểu Dữ liệu (Schemas/Types)
*   **`DEMO/src/types/negotiation.types.ts`:** Khai báo cấu trúc chuẩn TypeScript cho `TierQuote`, `NegotiationIntent`, `TradeoffRecommendation`, v.v.
*   **`DEMO/src/config/negotiation-cards.loader.ts`:** Load các cấu hình "Trade-off Catalog" chứa danh sách những thứ có thể đem ra trao đổi (SLA, License, Features).

## 5. UI & Frontend (Giao diện cột giữa - Workspace)
*   **HTML (`public/index.html`) & CSS (`public/style.css`):**
    *   Xây dựng giao diện cho Giai đoạn 2N (Phase 3 Negotiation), bao gồm: Khu vực nạp transcript đàm phán, Trade-off Cards, và Guardrail Status.
    *   Sửa lỗi hiển thị UI: Áp dụng CSS `[hidden] { display: none !important; }` để giải quyết lỗi thẻ block flexbox không bị ẩn khi Javascript toggle thuộc tính `.hidden`.
*   **JavaScript (`public/app.js`):**
    *   Cài đặt tính năng chuyển Tab mượt mà giữa "EM & Scoping" và "Negotiation" ở cột giữa.
    *   Logic động tự thay đổi Tiêu đề hiển thị (từ 🧠 Effort Multipliers sang 🤝 Negotiation Workspace) đồng bộ với ngữ cảnh đang thao tác.

## 6. Trạng thái Hiện tại & Smoke Test
*   Toàn bộ luồng dữ liệu (Backend - Guardrail logic - Endpoint JSON Output) đã được dựng trên server Node.js.
*   Các lệnh smoke test bằng Powershell HTTP Request (`Invoke-RestMethod`) qua cổng `3001` đều đã được xác thực trả về JSON chính xác.
*   **Next Steps dự định:** Thực hiện liên kết (wire-up) giao diện Frontend (gọi API bằng `fetch` trong `app.js`) để kết nối dữ liệu từ Backend đẩy thẳng lên UI Negotiation vừa hoàn thiện.