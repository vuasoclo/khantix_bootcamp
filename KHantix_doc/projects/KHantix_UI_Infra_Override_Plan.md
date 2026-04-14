# Khantix - Giao diện & Schema Bổ sung Cho Hạ tầng (Infrastructure UI Plan)
_Ngày lập: 14/04/2026_

Tài liệu này cung cấp bản thiết kế kỹ thuật (Technical Design) cho các thành phần UI (Frontend) và State Management (Backend Schema) để hứng 3 biến tính giá Server mới (`Concurrent_Users`, `Storage_GB`, `High_Availability`). 

Bạn cần triển khai các blocks này trên app Khantix để Pre-sales/Dân tư vấn có thể nhìn thấy AI đã bóc tách đúng chưa và tiến hành ghi đè (Override) trước khi tạo báo giá.

---

## 1. Cập Nhật State Schema (JSON Structure)

Để hệ thống Chatbot (Investigator) hỏi và lưu trữ một cách có tổ chức, 3 biến này KHÔNG được vứt lung tung mà phải nhóm vào một khối (Node) cụ thể trong JSON State.
Các AI Developer sẽ cập nhật file `investigator-response.schema.ts` thành cấu trúc:

```json
"infrastructure_requirements": {
  "concurrent_users": {
    "value": 50,
    "confidence": 0.85,
    "is_extracted": true,
    "reasoning": "Khách báo 500 nài xài nhưng chỉ tập trung chấm công sáng sớm."
  },
  "expected_storage_gb": {
    "value": 500,
    "confidence": 0.9,
    "is_extracted": true,
    "reasoning": "App xây dựng phải upload nhiều video báo cáo công trình."
  },
  "requires_high_availability": {
    "value": false,
    "confidence": 1.0,
    "is_extracted": false,
    "reasoning": "Default system config (khách chưa đề cập vụ sập mạng)."
  }
}
```
**Ý nghĩa:** Tham số `is_extracted` giúp giao diện Frontend biết AI đã tự múc được thông tin chưa hay đang dùng số mặc định để bôi xám (Ghost input) trên màn hình.

---

## 2. Thiết kế UI Block (Infrastructure Settings Card)

Tại màn hình Pre-sales Override (Nơi xác nhận báo giá cuối, hoặc Panel bên phải khung Chat), chúng ta cần xây dựng **1 Card HTML/React** chứa 3 form control tương ứng:

### A. Lượng người truy cập đồng thời (CCU Slider/Input)
- **UI Element:** Slider kéo hoặc Input Number.
- **Label:** `Concurrent Users (CCU) / Max Load`.
- **Logic Hiển thị:**
  - Nếu `is_extracted = false`: Thanh Slider hiện màu xám (Disabled/Mờ), số liệu tính bằng `10% x Total_Users` (VD: 1000 users thì default CCU = 100).
  - Nếu `is_extracted = true`: Thanh Slider sáng lên, hiện đúng số AI trích xuất (VD: 50).
- **Hành vi (Behavior):** Người Pre-sales có thể bấm vào để edit tay nếu AI trích xuất sai hoặc muốn buff Server lên cho chắc cú.

### B. Dung lượng lưu trữ dự kiến (Storage Dropdown & Input)
- **UI Element:** 1 Dropdown (Loại dữ liệu) + 1 Input Number (Số GB).
- **Label:** `Storage Requirement`.
- **Dropdown List UI:**
  - `Database & Text (Rất ít GB)`
  - `Hình ảnh & Document (~ Vài chục GB)`
  - `Audio & Video (Hàng trăm GB)`
- **Tính toán:** Khi Pre-sales chọn Dropdown, số GB ở Input bên cạnh tự update tương ứng (VD: Chọn Text -> 5 GB; Chọn Video -> 500 GB). AI cũng có thể tự set giá trị cho Dropdown này dựa vào `reasoning`.

### C. Độ sẵn sàng & Chống sập (SLA/HA Toggle)
- **UI Element:** Toggle Switch (Nút gạt Bật/Tắt).
- **Label:** `High Availability Architecture (Multi-Zone / Load Balancer)`.
- **Trạng thái:**
  - `Tắt` = Chạy Server đơn (Single Node). Chi phí Server x 1.
  - `Bật` = Hệ thống sẽ thiết kế dự phòng. Chi phí Server Core x 1.5 lần.
- **Tooltip Cảnh báo:** *"Lưu ý: Bật tính năng này sẽ tăng 50% chi phí duy trì máy chủ mỗi tháng. Chỉ khuyên dùng nếu khách kinh doanh 24/7."*

---

## Luồng Tương Tác Giữa AI, UI và Calculator
1. AI Chatbot đang nói chuyện. Khách vô tình thốt ra: _"App này anh cho sinh viên thi liên tục ko được sập đâu em nhé, 1000 đứa vào cùng lúc"_.
2. AI Investigator cập nhật JSON State: `concurrent_users = 1000`, `requires_high_availability = true`.
3. Giao diện (UI) bên phải màn hình **bắn Notification Alert** và Slider bật vọt lên mốc 1000. Nút Toggle HA lập tức chuyển sang trạng thái "Bật".
4. Pre-sales nhìn thấy. Nếu thấy ổn, bấm **"Tính Giá"**.
5. Giao diện gửi toàn bộ State (JSON) có chứa `infrastructure_requirements` gọi về backend API (`base-cost.calculator.ts`) và chốt con số VND cuối cùng.