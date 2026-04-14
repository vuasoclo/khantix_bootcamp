# KHantix - Kế hoạch Tích hợp Module Catalog & Tái cấu trúc Định mức (Users & ManDays)
_Ngày lập: 14/04/2026_
_Mục tiêu: Đưa dự án từ "Ước lượng định tính (Đoán số)" sang "Ước lượng định lượng (Cộng dồn từ Catalog lịch sử)"._

## 0. TINH THẦN CỐT LÕI (FIRST PRINCIPLE)
- **Về Hệ thống AI:** AI không còn chức năng "đoán mò" tổng thời gian (ManDays). Thay vào đó, AI làm nhiệm vụ **Matcher (Người nối ghép)**: Nghe khách hàng kể bệnh $\rightarrow$ Chốt các `Module_ID` tương ứng có trong `module_catalog.csv`.
- **Về Nguồn lực (ManDays):** Tổng thời gian sẽ là phép cộng các Module. Thuộc tính `primaryRole` chung chung sẽ bị loại bỏ. Khối lượng công việc (Workload) sẽ được phân rã rõ ràng thành mảng **Role Allocation** (Ví dụ: 10 ngày BA, 15 ngày Senior, 5 ngày Tester).
- **Về Hạ tầng (Users):** AI bắt buộc phải đi săn bằng chứng về `user_count` để làm tham số tính Server Cost, thay vì giá trị mặc định cứng 100 users. Cả `user_count` và nhóm `role_allocation` giờ đây cũng hoạt động hệt như một Effort Multiplier (Có Evidence, có Reasoning, có trạng thái Confirm/Adjust từ Pre-sales).

---

## GIAI ĐOẠN 1: CẬP NHẬT TẦNG DỮ LIỆU & TYPE DEFINITIONS (SCHEMA)
**Người thực thi:** Backend Developer

1. **Loader cho Module Catalog:**
   - Viết thêm script `src/config/module-catalog.loader.ts` để đọc và parse file `KHantix_doc/requirements/module_catalog.csv`.
   - Lưu lên Cache Server (thành mảng hoặc Map) lúc khởi động ứng dụng tương tự `loadHeuristicMatrixV2`.

2. **Cập nhật Interface / Types:**
   - Mở file `src/types/effort-multiplier.types.ts` và `src/schemas/investigator-response.schema.ts`.
   - Thay thế các trường `estimatedManDays` (number) và `primaryRole` (string) hiện tại bằng các cấu trúc xịn xò (bắt chước theo EMEstimateFromLLM):
     ```typescript
     // Base Entity cho các biến số do AI suy luận
     export interface AISlotEstimate {
       value: number | null;
       confidence: 'high' | 'medium' | 'low' | null;
       evidence: string | null;
       reasoning: string | null;
     }

     // Schema LLM trả về mới sẽ có thêm:
     "matchedModules": [
       { "module_id": "MOD_IAM_01", "reasoning": "Khách yêu cầu đăng nhập SSO" }
     ],
     "roleAllocation": {
       "BA": /* AISlotEstimate */,
       "Senior": /* AISlotEstimate */,
       "Junior": /* AISlotEstimate */,
       ...
     },
     "userCount": /* AISlotEstimate */
     ```

---

## GIAI ĐOẠN 2: ÉP VÀO PROMPT CHO LLM (THE INVESTIGATOR)
**Người thực thi:** Prompt Engineer / AI Integrator

1. **Cập nhật `system.prompt.md`:**
   - Xóa bỏ logic *BASE ESTIMATION IS CRITICAL (10 | 30 | 60 | 180)*.
   - Thêm vào phần tiêm `MODULE CATALOG`: Backend sẽ tiêm list các module có sẵn (kèm Keywords nhận diện, Base_ManDays và Mức độ khó) vào phần Context để AI có cơ sở map.
   - Hướng dẫn AI: *"Nhiệm vụ của bạn là map yêu cầu chức năng thành các Module_ID. Sau đó, cộng dồn tổng Base_ManDays của các Module_ID đó, và **phân bổ** thành Role cụ thể (Ví dụ: Tổng 45 ngày thì bạn tự chia theo tỷ lệ BA 20%, Senior 50%, Junior 30% tùy quy mô dự án)."*

2. **Cập nhật `output-format.prompt.md`:**
   - Đổi JSON Schema thành cấu trúc mảng `matchedModules`, object `roleAllocation`, và slot `userCount`.
   - Quy định rõ: `userCount` phải móc từ những câu như *"công ty anh có 500 nhân sự sẽ dùng"* làm Evidence. Không có thì để Null.

---

## GIAI ĐOẠN 3: REFACTOR CALCULATION ENGINE (MÁY TÍNH TOÁN)
**Người thực thi:** Backend Developer / Math Logic

1. **Sửa `src/calculators/em.calculator.ts`:**
   - Hàm nội suy `LaborCost` trước đây là: `TotalManDays * Rate[PrimaryRole]`.
   - Nâng cấp thành phép tổng hòa (Sum Product): `(Days_BA * Rate_BA) + (Days_Senior * Rate_Senior) + (Days_Junior * Rate_Junior)`.
   - Phép tính `compoundMultiplier` ở Lớp 2 (Risks) sẽ ốp lên **Tổng LaborCost** (Mọi nhân sự đều bị phạt thời gian vì làm chung một dự án có Data rác).
   - Hàm nội suy Server Cost dùng tham số `userCount.value` (Lấy từ Slot prediction, ko dùng hằng số default nữa).

2. **Cập nhật API Layer (`calculator.controller.ts`, `chat.controller.ts`):**
   - Trả về cho Frontend Payload mới gồm `matchedModules` (Để Frontend render danh sách các tính năng được phát hiện).
   - Truyền `userCount` và `roleAllocation` xuống Frontend ở định dạng giống hệt EMs (Cũng có thẻ 🟢 🟡 🔴, Evidence, Reasoning) để Pre-sales review.

---

## GIAI ĐOẠN 4: CẬP NHẬT UI/UX CỦA PRE-SALES BẮT ĐẢM ĐỒNG BỘ
**Người tư duy:** Frontend / UX Designer
- Chuyển 2 form nhập liệu thô sơ (Dự án & Định mức gốc) thành **Block Suy Luận**.
- Trên màn hình Chat AI, giao diện Pre-sales sẽ thấy:
  - **[Block: Chức năng cấu thành]**: Liệt kê các Mảnh ghép (Modules) AI quét được. Pre-sales click xóa hoặc + Thêm module (từ danh sách Dropdown load của Catalog).
  - **[Block: Phân bổ Nguồn lực (ManDays by Role)]**: Hiện 4 thanh trượt cho PM, BA, Senior, Junior. Có trích dẫn lý do AI phân bổ. Nút (Confirm / Adjust).
  - **[Block: Đối tượng người dùng (Server Limit)]**: Hiện số users. Có trích dẫn bằng chứng. Nút (Confirm / Adjust).
  - **[Block: Rủi ro (EMs Lớp 2)]**: Giữ nguyên như cũ.

---
**KPI THÀNH CÔNG CHO TEAM:**
- [ ] Xóa bỏ hoàn toàn LLM Hallucination trong việc sinh random số ngày ManDays.
- [ ] Báo giá tự động nhảy và tính toán chi tiết chi phí từng role (Senior/Junior) khi AI nhận diện được Modules.
- [ ] UI cho phép Override số ngày từng Role riêng biệt.