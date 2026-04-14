# KHantix - Implement Plan: Refactor Server & License Cost

**Người thực hiện:** AI Developer (Agent)
**Reference:** `KHantix - Phân rã Lớp 1 Server & License (New).md` (Mở file này để xem chi tiết lý thuyết)

Đây là task ticket cập nhật lại mô hình tính Toán học Lớp 1 của ứng dụng Khantix, theo nguyên lý First Principles. Bỏ cách tính `Server = 1000 users * 5 tr` và `License = 20% tiền công nhân sự`.

---

## 1. Cập nhật Dữ liệu Mock (CSV Files)

**Tác động:** `d:\khantix_bootcamp\KHantix_doc\requirements\internal_configs.csv`
1. Thay thế dòng có `HW_001` (Server_Base_Cost_Per_1K_Users) bằng:
   - `HW_001,Server_Base_Infra_Cost,800000.0`
   - `HW_002,Server_Cost_Per_100_Users,400000.0`
   - `HW_003,Storage_Cost_Per_GB,550.0`
   - _Lưu ý:_ Nếu HW_002 cũ là SMS_OTP_Rate thì đổi sang ID khác ví dụ `HW_004` để tránh conflict.

**Tác động:** `d:\khantix_bootcamp\KHantix_doc\requirements\module_catalog.csv`
2. Cập nhật Headers của CSV thành (thêm `License_Cost_Base`, `Storage_Quota_GB_Per_User`):
   - `Module_ID,Category,Module_Name,Base_ManDays,Is_Core_Competency,Customization_Markup,Keywords,License_Cost_Base,Storage_Quota_GB_Per_User`
3. Thêm Data giả lập ngẫu nhiên cho tất cả các dòng hiện có:
   - `License_Cost_Base`: Một số tiền nguyên từ 1,000,000 đến 15,000,000 VND tùy module độ khó.
   - `Storage_Quota_GB_Per_User`: Float từ 0.1 đến 5.0 (Vd 0.1 cho IAM, 5.0 cho DMS).

---

## 2. Cập nhật Parser / Types

**Tác động:** `d:\khantix_bootcamp\DEMO\src\types\internal-config.types.ts`
1. Xóa `Server_Base_Cost_Per_1K_Users`.
2. Thêm:
   - `Server_Base_Infra_Cost: number;`
   - `Server_Cost_Per_100_Users: number;`
   - `Storage_Cost_Per_GB: number;`

**Thêm Mới:** `d:\khantix_bootcamp\DEMO\src\schemas\investigator-response.schema.ts` (Hoặc File Definition AI Slots)
1. Thêm 3 Properties cần AI Investigator hỏi khách/hoặc suy luận trong Output Json:
   - `concurrent_users`: (Number) Lượng truy cập đồng thời tối đa thay vì tổng users (Giá trị mặc định hoặc AI hỏi).
   - `expected_storage_gb`: (Number) Số GB khách muốn lưu, hoặc "nhiều ảnh video" -> Convert ra số GB.
   - `requires_high_availability`: (Boolean) Nếu khách cần app không được sập bao giờ, cần Load Balancer chạy multi-zone thì Trả về True/False.

**Tác động:** `d:\khantix_bootcamp\DEMO\src\types\module-catalog.type.ts` (Nếu chưa có thì tạo mới, và viết loader cho module_catalog.csv trong `src/config/module-catalog.loader.ts`).
1. Interface Definition cho 1 row Module (trong catalog). Phải hứng đủ các cột mới: `License_Cost_Base` và `Storage_Quota_GB_Per_User`.

---

## 3. Cập nhật Core Calculator

**Tác động:** `d:\khantix_bootcamp\DEMO\src\calculators\base-cost.calculator.ts`
1. Interface `BaseCostInput`: Thêm mốc nhận đối số mới:
   ```typescript
   export interface BaseCostInput {
     // ...
     matchedModules: any[];
     concurrentUsers?: number;
     expectedStorageGB?: number;
     requiresHighAvailability?: boolean;
   }
   ```
2. Trong hàm `calculateBaseCost()`:
   **A. Server Cost Logic (với tham số AI suy luận):**
   ```typescript
   // Lấy tổng GB mà khách ước lượng (nếu có), không thì lấy từ Module Quota * totalUsers
   const totalStorageGB = input.expectedStorageGB ?? input.matchedModules.reduce((acc, m) => acc + (m.Storage_Quota_GB_Per_User * input.userCount), 0);
   
   // Dùng Concurrent Users (nếu rỗng thì mặc định 10% của tổng số tài khoản)
   const ccus = input.concurrentUsers ?? Math.ceil(input.userCount * 0.1);
   const userBuckets = Math.ceil(ccus / 100);
   
   let serverCost = config.Server_Base_Infra_Cost + 
                      (userBuckets * config.Server_Cost_Per_100_Users) + 
                      (totalStorageGB * config.Storage_Cost_Per_GB);
                      
   // Nhân đôi hoặc 1.5 lần tiền Base Infra + Compute nếu cần độ sẵn sàng cao
   if (input.requiresHighAvailability) {
       serverCost = serverCost * 1.5; 
   }
   ```

   **B. License Cost Logic:**
   ```typescript
   const moduleBaseLicenseSum = input.matchedModules.reduce((acc, m) => acc + m.License_Cost_Base, 0);
   const licenseCost = moduleBaseLicenseSum * (1 - config.Reuse_Factor_Default);
   ```
3. Xóa hoàn toàn đoạn logic lấy 20% từ tỷ lệ `laborCost` cũ. Đóng block Calculator lại cho an toàn.

---

## 5. Cấu trúc Schema State & Giao diện UI (UI Block / Pre-sales Override)

Để hệ thống có thể hỏi, lưu trữ và cho phép người dùng (Pre-sales) chỉnh sửa xác nhận (Override) 3 biến Server Cost, cần triển khai các bước sau phía Front-end & State Management:

**A. Cấu trúc State (Schema Update):**
Trong `session.repository.ts` hoặc `investigator-response.schema.ts`, nhóm 3 biến mới thành một khối đối tượng (Object) có tên `infrastructure_requirements` để dễ quản lý state (thay vì vứt rải rác):
```typescript
infrastructure_requirements: {
  concurrent_users: { value: number | null, is_extracted: boolean, reasoning: string },
  expected_storage_gb: { value: number | null, is_extracted: boolean, reasoning: string },
  requires_high_availability: { value: boolean | null, is_extracted: boolean, reasoning: string }
}
```
*Note:* `is_extracted` để biết phần mềm đã hỏi và ra được số chưa, hay đang dùng tham số Mặc định.

**B. Giao diện xác nhận (UI Block - Component):**
Trên giao diện Front-end (nơi xuất Report hoặc lúc Confirm thông số trước khi báo giá), xây dựng một Thẻ (Card) mới tên là **"Cấu hình Hạ tầng & Cloud (Infrastructure Settings)"** chứa các Component:

1. **Slider / Input Component (Concurrent Users):**
   - **Label:** Lượng người truy cập đồng thời (CCU).
   - **Mặc định:** Hiển thị mờ (Disabled/Placeholder) giá trị = `10% * Total_Users`.
   - **Hành động:** Khi AI trích xuất được từ khách, Slider tự động nhảy đến số liệu tương ứng. Người Pre-sales có thể kéo thanh trượt để chỉnh sửa lại.

2. **Dropdown / Number Input (Storage):**
   - **Label:** Dung lượng lưu trữ dự kiến.
   - **Mặc định:** `Tổng module quota * Users`.
   - **Custom UI:** Có thể chia thành các Checkbox/Tags (VD: `[X] Chỉ lưu Data Text`, `[ ] Upload nhiều file Video/Ảnh`) $\rightarrow$ UI tự convert ra số GB để tính tiền. Người Pre-sales có quyền nhập tay số GB mong muốn.

3. **Toggle Switch (High Availability - SLA):**
   - **Label:** Yêu cầu Chống Sập/Độ Sẵn Sàng (High Availability).
   - **Trạng thái:** Bật (Bật Load Balancer, Multi-AZ) / Tắt (Server đơn).
   - **Hành động:** Bật toggle này sẽ trigger hàm gửi API lại xuống `Calculator` (nhân 1.5 lần giá Server). Có tooltip báo cảnh báo: *"Bật tính năng này sẽ tăng 50% chi phí hạ tầng lõi"*.

**Luồng hoạt động (User Flow):**
1. AI Chatbot hỏi khách $\rightarrow$ Lấy được thông tin $\rightarrow$ Update vào State Schema `infrastructure_requirements`.
2. Hệ thống Push state này lên Frontend $\rightarrow$ Các UI Block tự động Fill giá trị AI vừa lấy.
3. Người Pre-sales nhìn vào các UI Block này, thấy vô lý $\rightarrow$ Chỉnh sửa thủ công.
4. Bấm "Confirm & Tính Giá" $\rightarrow$ Gửi Payload cuối cùng xuống `base-cost.calculator.ts` để ra số tiền thật.

---

## 4. Tích hợp Tầng Service

**Tác động:** `d:\khantix_bootcamp\DEMO\src\services\calculator.service.ts` (Hoặc file điều phối base-cost)
1. Trong Request Body hoặc Service Layer, khi gọi hàm `calculateBaseCost`, phải truyền kèm mảng `matchedModules` thay vì để mảng rỗng (mock 2 modules `IAM` và `COM` nếu tầng Service Investigator chưa parse ra output mảng module).

Đây là ticket quan trọng giúp tính tiền chuẩn tới từng VND lẻ, vui lòng Dev AI kiểm tra bằng `ts-node` sau khi ráp file để tránh Type Error.