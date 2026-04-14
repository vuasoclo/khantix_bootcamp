# Khantix — Báo Cáo Cập Nhật: Cấu trúc Scoping & Giao diện Module

**Ngày cập nhật:** 14/04/2026
**Trọng tâm:** Ổn định và làm chuẩn hóa State cho nhóm tham số S (Project Scoping), khử tính "ảo giác" (hallucination) của LLM trong toán học, và bổ sung giao diện cho phép User sửa trực tiếp cấu hình hệ thống.

---

## 1. Khắc phục Lỗi Reset Tham Số Scoping & 404 Not Found
**Vấn đề:** Các biến thuộc nhóm `S - Project Scoping` (`userCount`, `roleAllocation`, `matchedModules`) thường xuyên bị reset về *null* ở các lượt chat sau. Đồng thời API update bằng tay báo lỗi `404 EM not found` đối với các cụm từ như "Role Allocation".
**Giải pháp đã triển khai:**
- **Thêm "Trí nhớ" cho AI:** Bổ sung `scopingContext` vào System Prompt (`investigator.service.ts`), giúp mô hình AI "nhìn" thấy các thông tin scoping nó đã gom được ở lượt chat trước.
- **Merge State An Toàn:** Cập nhật bộ lọc ở Backend để từ chối các object có chứa `null`. Backend chỉ đè dữ liệu mới nếu AI thực sự cung cấp một giá trị hợp lệ mới, bảo tồn hoàn toàn Dữ liệu Ghi Đè bằng tay (Pre-sales Override).
- **Chuẩn hóa ID:** Đưa hàm `em_id.toLowerCase().replace(/\s+/g, '')` vào `chat.controller.ts` để hứng bắt mọi cách gọi tên biến từ giao diện (ví dụ biến `"Role Allocation"` thành `"roleallocation"`).

## 2. Tính Rán (Deterministic Math) Cho Role Allocation
**Vấn đề:** Trước đây, hệ thống giao phó việc phân bổ "ManDays" cho các Roles (PM, BA, Senior, Junior) cho LLM tự tính toán. Việc này vi phạm ranh giới First Principle (AI rất gở toán).
**Giải pháp đã triển khai:**
- **Xóa bỏ Nội suy Roles:** AI chỉ còn mỗi một nhiệm vụ là tìm kiếm các Modules (Danh sách tính năng hệ thống).
- **Đồng bộ hóa Backend:** Viết thêm hàm `syncRoleAllocationFromModules(emSet)` vào `investigator.service.ts`.
- **Cách Backend tính:** 
  1. Móc nối ID `matchedModules` vào File `module_catalog.csv` để tìm tổng `baseManDays`.
  2. Áp dụng công thức cứng (Khantix Tỷ trọng): **PM 10%, BA 15%, Senior 50%, Junior 25%**.
  3. Giá trị tự động đổ thẳng về màn hình UI ngay khi bộ Modules thay đổi.

## 3. Sửa LLM Hallucination trong API Phân tích Hồ Sơ (Profile)
**Vấn đề:** Ở bước nạp "Hồ sơ trước báo giá", AI thường lao ngang vào các vấn đề rủi ro kỹ thuật nâng cao (Data, Tích hợp, Quy trình) thay vì hỏi xem hệ thống cần làm tính năng gì, cho bao nhiêu người dùng.
**Giải pháp đã triển khai:**
- Hardcode rule `PRIORITIZE PROJECT SCOPING` vào thẳng bouncer prompt ở route `POST /profile`.
- Ép hệ thống xuất mảng `suggestions` (Gợi ý câu hỏi) ưu tiên khai thác đủ 3 yếu tố cơ bản: Users, Roles (Modules) trước khi đào sâu vào các Effort Multipliers (EM).

## 4. UI: Quản Lý Modules Theo Dạng Menu Dropdown (Cập nhật Động)
**Vấn đề:** Không có cách nào để nhân viên Pre-sales thêm mới, xoá, hoặc sửa lý do chọn Module một cách trực quan nếu AI đoán sai.
**Giải pháp đã triển khai:**
- **Mở Endpoint mới:** Bật route `GET /api/modules` ở Controller để bắn danh sách Catalog CSV lên giao diện trình duyệt.
- **Render UI Tương tác (app.js & index.html):** 
  - Khởi tạo State nội bộ lưu `moduleCatalog`.
  - Thay đổi nút `+ Thêm Module mới`: Bấm vào sẽ sổ ra danh sách cấu trúc `<select>` chuẩn chỉ để User lựa chọn từng Module hệ thống theo Dropdown có sẵn. Cùng các nút Remove (X).
  - Tích hợp logic gom dữ liệu thẻ input gửi ngược lệnh `adjust` list JSON mới xuống Node.js, kích hoạt tính toán lại toàn bộ giá trị Hợp đồng lập tức.