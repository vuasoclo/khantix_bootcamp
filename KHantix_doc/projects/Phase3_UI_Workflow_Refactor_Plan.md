# Kế hoạch chỉnh sửa Phase 3 (Deal giá) theo workflow mới

## 1) Mục tiêu thay đổi
- Giữ **Base Report** riêng cho giai đoạn tính giá nền (base + risk).
- Khi bấm **"Tiếp tục sang Deal giá (Phase 3)"** thì **không tự sinh 3 giá ngay**.
- Tạo **tab báo cáo riêng cho 3 giá** (không gộp chung trong khu vực Base Report hiện tại).
- Chỉnh UI/UX để luồng làm việc rõ: Scoping -> Base Report -> Negotiation -> 3-Tier Report.

---

## 2) Nhìn lại Phase 3 cũ (hiện trạng)

## 2.1 Hành vi hiện tại
- Sau khi tính Base Report, frontend đang tạo sẵn `tierQuotes` bằng `createTierQuotes(data)` trong `public/app.js`.
- Khu vực **3 tier cards** đang nằm chung trong panel báo cáo bên phải (`#phase3-quote-section` trong `public/index.html`), không tách riêng tab báo cáo.
- Khi chuyển sang phase negotiation, dữ liệu 3 giá thường đã có sẵn từ bước base report hoặc fallback local.

## 2.2 Các điểm chưa khớp yêu cầu mới
- Chưa tách bạch "Báo cáo base" và "Báo cáo 3 giá".
- Trạng thái UX dễ gây hiểu nhầm là hệ thống đã chốt 3 giá ngay khi mới vào phase deal giá.
- Cơ chế lifecycle của `state.negotiation.tierQuotes` đang gắn sớm với base-report thay vì gắn với bước generate recommendation/quote.

---

## 3) Những gì cần bỏ / dừng sử dụng

## 3.1 Bỏ generate 3 giá sớm ở bước Base Report
- Gỡ logic:
  - `state.negotiation.tierQuotes = createTierQuotes(data);`
  - `renderTierQuotes(...)`
  trong `generateBaseReport()` (`public/app.js`).

## 3.2 Bỏ cách hiển thị 3 giá "chung khối" với Base Report
- Không dùng `#phase3-quote-section` như section con trong cùng màn `#report-content`.
- Tách nó thành màn/tab báo cáo độc lập.

---

## 4) Workflow mới đề xuất

1. **Scoping hoàn tất** -> bấm **Tính Base Price** -> hiển thị **Base Report Tab**.
2. Bấm **Tiếp tục sang Deal giá (Phase 3)**:
   - chỉ đổi phase UI sang negotiation,
   - mở tab controls negotiation,
   - **chưa có 3 tier prices**.
3. Pre-sales dán transcript đàm phán -> Analyze -> Confirm intent.
4. Bấm Generate Recommendation:
   - gọi `/api/negotiation/recommend`,
   - lúc này mới nhận/sinh `tierQuotes`,
   - đồng bộ dữ liệu sang **3-Tier Report Tab**.
5. Tab **3-Tier Report** hiển thị:
   - 3 mức giá,
   - trade-off đã chọn,
   - guardrail/checklist,
   - export báo giá.

---

## 5) Chỉnh UI cụ thể

## 5.1 Panel báo cáo (cột phải) cần có tab
- Thêm report-tabbar trong `public/index.html`:
  - `Base Report`
  - `3-Tier Report`
- Mặc định:
  - sau Base Report: mở `Base Report`,
  - sau generate recommendation thành công: tự chuyển sang `3-Tier Report`.

## 5.2 Tách vùng nội dung
- `#base-report-content`: giữ toàn bộ nội dung báo cáo base hiện tại.
- `#three-tier-report-content`: chứa toàn bộ khối tier cards, guardrail, gap snapshot, playbook, checklist, export.
- Chỉ cho phép mở tab `3-Tier Report` khi đã có dữ liệu tier quotes/recommendation.

## 5.3 Trạng thái/nhãn rõ ràng
- Khi mới vào phase 3: hiển thị empty-state "Chưa tạo 3 báo giá. Hãy phân tích đàm phán và Generate Recommendation."
- Nút export chỉ enable khi checklist pass (giữ logic hiện tại).

---

## 6) File cần chỉnh sửa

## 6.1 Frontend
- `DEMO/public/index.html`
  - thêm report tab bar,
  - tách `base-report-content` và `three-tier-report-content`,
  - di chuyển block `phase3-quote-section` sang tab riêng.
- `DEMO/public/app.js`
  - thêm state/tab control cho report tabs,
  - bỏ generate tier quotes trong `generateBaseReport()`,
  - chỉ set `state.negotiation.tierQuotes` sau `generateNegotiationRecommendation()`,
  - cập nhật `setPhase()` để không lộ 3-tier report quá sớm,
  - thêm render empty-state cho 3-tier tab.
- `DEMO/public/style.css`
  - style cho report tabbar + active tab + disabled state.

## 6.2 Backend (nếu cần tinh chỉnh tối thiểu)
- `DEMO/src/controllers/negotiation.controller.ts`
  - giữ logic hiện có; chỉ đảm bảo response recommendation luôn trả đủ `tierQuotes` cho 3-tier report.

---

## 7) Thứ tự triển khai
1. Refactor HTML layout report thành 2 tab nội dung.
2. Thêm JS report tab controller + gating rules.
3. Gỡ logic sinh 3 giá ở base-report.
4. Nối dữ liệu tier report vào bước recommendation.
5. Rà lại trạng thái phase + button enable/disable.
6. Test luồng end-to-end UI theo workflow mới.

---

## 8) Tiêu chí hoàn thành (Definition of Done)
- Bấm "Tiếp tục sang Deal giá (Phase 3)" **không xuất hiện 3 giá ngay**.
- Base Report và 3-Tier Report nằm ở **2 tab tách biệt**.
- 3-Tier Report chỉ có dữ liệu sau khi analyze + confirm intent + generate recommendation.
- Export báo giá lấy dữ liệu từ tab 3-Tier, không phụ thuộc render sớm từ base-report.
- Không làm hỏng luồng EM & Scoping hiện tại.

---

## 9) Rủi ro & lưu ý
- Cần tránh bug "tierQuotes null" ở các hàm đang assume luôn có dữ liệu.
- Nếu backend recommend lỗi, fallback local cần hiển thị rõ "fallback mode" để pre-sales biết.
- Tránh duplicate DOM id khi tách nội dung sang tab mới.
