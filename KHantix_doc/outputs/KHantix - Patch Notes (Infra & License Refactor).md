# KHantix - Patch Notes (Infrastructure & License Refactor)
_Ngày lập: 14/04/2026_

Tài liệu này tổng hợp toàn bộ các thay đổi về logic định giá Lớp 1 (Base Cost), tích hợp AI Investigator, mở rộng UI tính giá hạ tầng, và các bản vá lỗi (bugfixes) đã được thực hiện tới thời điểm hiện tại.

---

## 1. Nâng cấp Mô hình Định giá Hạ tầng & Bản quyền (Lớp 1)
**Vấn đề cũ:** Máy chủ tính tĩnh theo mốc 1000 users. Bản quyền bị gán cứng bằng `20% * Labor Cost` (không phản ánh đúng giá trị module tính năng).
**Giải pháp & Triển khai:**
- **Server Cost**: Áp dụng công thức Cloud thực tế.
  - Phí cố định (Base Infra).
  - Phí tính toán (Compute) chia theo block tải: Mỗi 100 **Synchronous/Concurrent Users (CCU)**.
  - Phí lưu trữ: Dựa trên tổng GB lưu trữ dự kiến (`Storage_Cost_Per_GB`).
  - Hệ số rủi ro sẵn sàng cao (High Availability): Phụ phí x1.5 nếu cần SLA khắt khe.
- **License Cost**: Tính giá bán đứt (Base Price) của từng Module từ Catalog, sau đó áp dụng tỷ lệ khấu hao/tái sử dụng (`Reuse_Factor`). Có Fallback an toàn nếu khách chưa chốt được module.

## 2. Nâng cấp Dữ liệu Đầu vào (Data Configs)
- **`internal_configs.csv`**:
  - Loại bỏ các biến cũ không tương thích.
  - Bổ sung `Server_Base_Infra_Cost` (800k), `Server_Cost_Per_100_Users` (400k), `Storage_Cost_Per_GB` (550đ).
- **`module_catalog.csv`**:
  - Bổ sung 2 trường dữ liệu cho mọi nhóm tính năng: `License_Cost_Base` (Giá license nguyên bản) và `Storage_Quota_GB_Per_User` (Định mức GB/User cho module đó).

## 3. Nâng cấp AI Investigator (Prompt & Schema)
- Bổ sung 3 biến hạ tầng vào Output JSON Schema để AI điều tra khách hàng:
  - `concurrent_users`: Khách dùng đồng thời bao nhiêu.
  - `expected_storage_gb`: Khách tải file, clip nặng bao nhiêu.
  - `requires_high_availability`: Khách có sợ sập mạng không.
- Chỉnh sửa `system.prompt.md`: Cấu hình danh sách "Prioritize Project Scoping" bắt AI phải ưu tiên hỏi kỹ quy mô hạ tầng trước khi đi vào các rủi ro dài hạn.

## 4. Nâng cấp Giao diện (Frontend & Explainable Output)
- **UI Cloud Infrastructure**: Thêm mới 3 thẻ tham số Hạ tầng trên giao diện. Cho phép chuyên viên tư vấn (Pre-sales) kéo slider giảm CCU, chọn cấu hình dung lượng lưu trữ (Text/Menu hay Video/Audio), và bật tắt tính năng High Availability (Multi-Zone SLA).
- **Explainability (Giải trình báo giá)**: API tính giá hiện xuất ra cấu phần (components) con của từng line item. Các báo cáo trên UI hiển thị rõ chi tiết: **"Tiền Server = Nền tảng + CCU + Tính sẵn sàng"**, kèm theo lý do cụ thể và câu quote (trích dẫn) của khách hàng.

## 5. Các Bản Vá Lỗi (Hotfixes / Sanitizers)
- **Lỗi hiển thị Placeholder ("Carried over from previous state")**:
  - *Hiện tượng*: AI LLM khi sinh JSON hay bị "luời" nên điền nội dung generic thay vì để null ở những turn hội thoại mà khách không đề cập thêm.
  - *Bản vá Backend (`investigator.service.ts` & `chat.controller.ts`)*: Cài đặt lớp Sanitizer dùng Regex để lọc các câu nhận diện placeholder và Force fallback về null/giữ nguyên giá trị cũ.
  - *Bản vá Frontend (`app.js`)*: Tích hợp logic filter `isCarryOverPlaceholderText` ở tầng giao diện hiển thị chống tràn (leak) rác chữ ra UX của người dùng.
  - *Bản vá Prompt*: Cấm AI LLM trả về các cụm từ này trong rules. 
- **Đã kiểm thử**: Compile TypeScript toàn hệ thống thành công (Pass Type Check), và API sức khỏe dịch vụ hệ thống báo OK trên cấu hình giá mới.