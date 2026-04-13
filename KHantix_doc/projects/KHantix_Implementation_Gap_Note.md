# Khantix - Ghi chú Lỗ hổng Implementation & Kế hoạch Khắc phục (Gap Analysis)
_last updated: 2026-04-13_

Tài liệu này ghi nhận độ lệch (Gap) giữa **Lý thuyết (Từ điển Tham số / File Phân rã)** và **Thực tế Code (Dự án DEMO MVP)**.
*Lưu ý: Đây là tài liệu chẩn đoán bệnh (Problem Statement). Để xem toa thuốc và phương pháp phẫu thuật toàn diện, vui lòng chuyển sang file [KHantix_COCOMO_Execution_Plan.md].*

---

## 1. Đánh giá trạng thái file `internal_configs.csv` (Tham số Công ty)
- **Tình trạng:** HOÀN HẢO / ĐẦY ĐỦ 100%.
- **Chi tiết:** Mọi tham số nội bộ bảo mật của công ty được bóc tách ở file Từ điển đều đã có mặt ở đây (Rate gánh Overhead của Junior/Senior/PM/BA, Hệ số Onsite, 3 mảng Margin % tách biệt, Phán đoán Buffer Default, Tỷ lệ Maintainnce...). 
- **Đánh giá:** Phần **Math Config** này đã được thiết kế rất tỉ mỉ và sát với First Principle. Không có sự thiếu sót nào trong file CSV cấu hình tiền bạc.

---

## 2. Vấn đề Lỗ hổng Implementation phía AI (Tham số Khách hàng)

Dự án DEMO hiện tại khóa cứng luồng xử lý xuống mức **MVP (Minimum Viable Product) chỉ có 8 root slots**. Việc lười/giảm tải này tạo ra 3 tầng rào cản ngăn chặn sự mở rộng của tham số.

### Lỗ hổng tầng Dữ liệu (Heuristic CSV)
File `heuristic_matrix.csv` hiện tại đang bị lược bỏ/nhập nhằng một số chỉ số Khách hàng có trong Từ điển:
- **Thiếu nhánh:** `Deployment_Location` (Làm Onsite hay Remote).
- **Thiếu nhánh:** `Hardware_Dependency` (Nhu cầu chi phí ẩn như SMS OTP, Google Map API).
- **Gộp nhánh:** `Data_Risk` đang gánh cõng cả 3 biến con là Volume (Kích thước lâu năm), Format (Excel/SQL), và Integrity (Độ sạch). Chưa chia thành 3 scale giá khác nhau.

### Lỗ hổng tầng Kiến trúc Code (Backend & Prompt)
Ngay cả khi bạn update xong file CSV ở trên, ứng dụng **sẽ không chạy được biến mới** vì các Hardcode sau:
1. **LLM Output Prompt:** File `DEMO/src/prompts/investigator/output-format.prompt.md` đang gán String cứng ép AI trả về đúng 8 Slot. Nếu AI trả Slot thứ 9, sẽ bị mất hoặc văng lỗi parser.
2. **TypeScript Schema:** Tập tin `types/risk-slot.types.ts` khai báo rập khuôn interface 8 keys. Parser sẽ vứt bỏ những key nào không nằm trong interface này.
3. **Derived Hardcode (Hack code):** 
   - `server.ts` tự động gán cứng `includesOnsite = false` (Luôn làm Remote).
   - `server.ts` tự động gán cứng `primaryRole = "Senior"` (Bỏ qua hoàn toàn thuộc tính *Resource Mix Ratio*).
   - `estimatedManDays` đang bị tính nhẩm cực kỳ thô (Gặp Enterprise thì ép = 90 ngày, gặp SMB ép = 30 ngày).

### Lỗ hổng tầng Logic Nghiệp vụ & Báo cáo
1. **Báo cáo fix cứng (String Templates):** Báo cáo giải thích tại `pricing.orchestrator.ts` đang dùng các đoạn văn mẫu fix cứng theo mức rủi ro (HIGH/Others). Nó KHÔNG trích dẫn được lời nói gốc của khách (bằng chứng) và KHÔNG tự động giải thích được cho các Slot mới nếu không được code tay thêm if/else.
2. **Chiến lược Thương mại Hunter/Farmer vô nghĩa:** Hiện tại hệ thống đang định nghĩa 2 mode Hunter (Săn mới) và Farmer (Nuôi dưỡng) nhưng logic bên dưới chỉ là thay đổi một đoạn text thông báo, không hề tác động vào công thức dòng tiền hay Margin. Đây là tính năng thừa thãi, gây nhiễu và cần được loại bỏ khỏi hệ thống để tinh gọn.

---

## 3. Kết luận chẩn đoán và Hướng giải quyết Mới (COCOMO Paradigm Shift)

Ban đầu, giải pháp được đưa ra chỉ là "nhồi thêm tham số vào CSV và mở rộng TypeScript interface". Tuy nhiên, sau khi áp dụng **First Principle Protocol**, chúng ta nhận ra rằng: **Lỗ hổng không chỉ nằm ở việc thiếu biến số, mà nằm ở toàn bộ mô hình Toán học (Math Engine) bên dưới.**

Việc cộng dồn các % rủi ro cố định (`Effort = ManDays × (1 + 30% + 25%)`) đã nén hình thù phức tạp của rủi ro thành một con số cứng ngắc, triệt tiêu tính chất "Hybrid" của AI.

### Quyết định Nâng cấp:
Thay vì chỉ "vá" lỗ hổng, dự án sẽ đập bỏ mô hình Flat Buffer hiện tại và chuyển sang kiến trúc **COCOMO Effort Multipliers** kết hợp dự đoán AI trong khung an toàn (Bounded Estimation).

👉 **[HÀNH ĐỘNG DÀNH CHO DEV TEAM]**: 
Toàn bộ Checklist thực thi cũ đã bị hủy bỏ. Vui lòng chuyển sang đọc và thực thi theo lộ trình 7 Phase tại file kiến trúc mới: **[KHantix_COCOMO_Execution_Plan.md](KHantix_COCOMO_Execution_Plan.md)**.
