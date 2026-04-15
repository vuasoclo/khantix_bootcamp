# [ID-Đội thi] Đề tài 5: Pricing Recommendation
**Giải pháp đề xuất giá 3 phương án có Breakdown, Margin, Effort theo First Principles**

---

## 0. Tóm tắt điều hành (Executive Summary)

Bài toán cốt lõi của Pricing trong B2B IT không phải là "tính nhanh ra một con số", mà là **định giá đúng mức bất định** của từng dự án. Nếu báo giá quá thấp, dự án lỗ vì thiếu Effort thực tế; nếu báo quá cao, mất deal vì không cạnh tranh. Báo cáo này đề xuất một mô hình Hybrid gồm:

1. **AI mềm (Probabilistic)**: dùng để giao tiếp, thu thập dữ liệu còn thiếu, ánh xạ triệu chứng nghiệp vụ sang biến định giá.
2. **Core cứng (Deterministic Math)**: dùng để tính toán tiền, effort, margin bằng công thức kiểm soát được.
3. **Human-in-the-loop**: Pre-sales và quản lý giữ quyền override, AI không tự quyết giá cuối cùng.

Khung định giá được phân rã thành 3 lớp:

1. **Lớp 1 - Base Cost**: License + Server/Hardware + ManDays x Burdened Rate.
2. **Lớp 2 - Risk & Complexity**: dùng COCOMO-style Effort Multipliers theo phép nhân để phản ánh hiệu ứng cộng hưởng rủi ro.
3. **Lớp 3 - Commercial**: Margin, Rush, Strategy, Payment Term để sinh 3 phương án Basic/Standard/Premium.

Mục tiêu của hệ thống: rút ngắn thời gian làm báo giá, tăng tính giải thích được, và tăng xác suất chốt deal mà vẫn giữ biên lợi nhuận an toàn.

**Nguồn chính:**
- KHantix_doc/inputs/KHantix challange.md
- KHantix_doc/.agents/workflows/first_principle_protocol.md
- KHantix_doc/inputs/khung.md
- KHantix_doc/outputs/KHantix - Phân rã tham số định giá (FP0).md
- KHantix_doc/outputs/KHantix - FP2 Kiểm chứng Hướng giải quyết.md

---

## 1. Bài toán và phạm vi (Problem Framing)

### 1.1. Bài toán thực tế

Doanh nghiệp B2B IT thường gặp mâu thuẫn:

1. Sales cần báo giá nhanh để chốt đơn.
2. Delivery cần ước lượng đúng effort để không vỡ dự án.
3. Quản lý cần giữ margin và giảm rủi ro tài chính.

Khi làm thủ công bằng Excel, đội pre-sales thường gặp 3 lỗi lớn:

1. **Effort Blindness**: không nhìn thấy phần chìm (data rác, legacy integration, khả năng tiếp nhận công nghệ).
2. **Cognitive Overload**: không đủ thời gian và năng lực để tạo 3 phương án tối ưu đồng thời.
3. **Approval Loop Delay**: sửa đi sửa lại nhiều vòng vì thiếu cơ chế giải thích con số.

**Nguồn:**
- KHantix_doc/outputs/hồ sơ trước báo giá.md
- KHantix_doc/inputs/QA.md
- KHantix_doc/outputs/KHantix - tóm tắt tìm hiểu vấn đề.md

### 1.2. Mục tiêu theo yêu cầu cuộc thi

Theo đề bài bootcamp, kết quả cần chứng minh:

1. **Creativity**: cách tiếp cận mới cho bài toán định giá.
2. **Value**: tác động thực tế cho doanh nghiệp, có thước đo.
3. **Feasibility**: kiến trúc rõ ràng, giả định/rủi ro/scope hợp lý.

Bài này ưu tiên "hiểu vấn đề + prototype + kiểm chứng" hơn là độ hoàn thiện phần mềm.

**Nguồn:**
- KHantix_doc/inputs/KHantix challange.md

---

## 2. Phân tích First Principles

### 2.1. Nguyên lý 1: Tách vai trò của AI và Math

**Mệnh đề:** AI giỏi suy luận ngôn ngữ, nhưng không đáng tin để quyết định số tiền cuối cùng.

Do đó:

1. AI chỉ làm nhiệm vụ thu thập và ánh xạ dấu hiệu rủi ro.
2. Toán học deterministic mới tính effort/chi phí/giá.
3. Không để AI sinh số ngẫu hứng ngoài biên kiểm soát.

**Nguồn:**
- KHantix_doc/outputs/KHantix - Hướng Hybrid System.md
- KHantix_doc/outputs/KHantix - Thiết lập Tham số và Xây dựng Heuristic (FP0).md
- KHantix_doc/projects/KHantix_Risk_Parameters_Correction.md

### 2.2. Nguyên lý 2: Tách dữ liệu động và dữ liệu tĩnh

**Mệnh đề:**

1. Dữ liệu khách hàng là biến động theo deal (phải hỏi/suy luận).
2. Dữ liệu công ty (rate, margin policy, overhead) là config quản trị (đọc từ cấu hình, không hỏi lại mỗi deal).

Nguyên lý này giúp tránh rối luồng pre-sales và giảm sai số do nhập tay.

**Nguồn:**
- KHantix_doc/outputs/KHantix - Thiết lập Tham số và Xây dựng Heuristic (FP0).md
- KHantix_doc/requirements/internal_configs.csv

### 2.3. Nguyên lý 3: Rủi ro là tích số, không phải tổng số

Cách cộng buffer phẳng (+30% +15% +10%) làm mất thông tin. Hệ thống mới dùng phép nhân COCOMO-style:

$$Effort_{Adjusted} = ManDays \times \prod EM_i$$

Phép nhân phản ánh đúng compound effect khi nhiều rủi ro đồng thời xuất hiện.

**Nguồn:**
- KHantix_doc/outputs/KHantix - Phân rã Lớp 2 COCOMO Effort Multipliers.md
- KHantix_doc/requirements/heuristic_matrix_v2.csv

### 2.4. Nguyên lý 4: Hệ thống tốt là Augment, không Replace

Để vượt rào cản adoption trong B2B:

1. AI phải giải thích được (show the math).
2. Con người phải sửa được (override).
3. Hệ thống phải truy vết được (audit trail).

Nếu thiếu 1 trong 3, người dùng quay về Excel.

**Nguồn:**
- KHantix_doc/outputs/KHantix - FP2 Kiểm chứng Hướng giải quyết.md
- KHantix_doc/outputs/KHantix - Explainable Report & Pre-sales Override (Phase 2).md

---

## 3. Thiết kế giải pháp tổng thể (High-level Architecture)

### 3.1. Luồng xử lý chuẩn

1. **Investigator (AI)**: hỏi theo ngôn ngữ nghiệp vụ để lấp slot còn thiếu.
2. **Inferencer (AI + guardrails)**: map triệu chứng sang biến định giá, trả về EM + confidence + evidence.
3. **Calculator (Core cứng)**: chạy công thức 3 lớp để tạo giá khuyến nghị.
4. **Override Gate (Human)**: pre-sales/manager duyệt, chỉnh, ghi lý do.
5. **Report Generator**: xuất báo cáo minh bạch cho nội bộ và bản rút gọn cho khách.

**Nguồn:**
- KHantix_doc/outputs/KHantix - Hướng Hybrid System.md
- KHantix_doc/outputs/KHantix - Chiến dịch đặt câu hỏi (Interview Strategy).md
- KHantix_doc/outputs/KHantix - Explainable Report & Pre-sales Override (Phase 2).md

### 3.2. Thành phần dữ liệu chính

1. **internal_configs.csv**: margin, rate, hệ số chiến lược, server baseline.
2. **module_catalog.csv**: module, base man-days, base license, storage quota.
3. **heuristic_matrix_v2.csv**: dictionary map dấu hiệu -> EM + min/max.

**Nguồn:**
- KHantix_doc/requirements/internal_configs.csv
- KHantix_doc/requirements/module_catalog.csv
- KHantix_doc/requirements/heuristic_matrix_v2.csv

---

## 4. Mô hình định giá 3 lớp (Detailed Pricing Model)

## 4.1. Lớp 1: Base Cost (giá vốn cứng)

### 4.1.1. Công thức lõi

$$Cost_{Base} = License_{Cost} + Server_{Cost} + (ManDays_{Base} \times Rate_{Burdened} \times EM_{B1})$$

Trong đó:

1. **License_Cost** dựa trên module catalog và reuse factor.
2. **Server_Cost** dựa trên base infra + concurrent users + storage + HA.
3. **Rate_Burdened** phản ánh chi phí nhân sự đã gồm overhead.

### 4.1.2. Công thức chi tiết đã chuẩn hóa

$$License_{Cost} = \left(\sum Module_i.License\_Cost\_Base\right) \times (1 - Reuse\_Factor)$$

$$Server_{Cost} = Base\_Infra + \left(\lceil \frac{Concurrent\_Users}{100} \rceil \times Cost_{100Users}\right) + (Total\_GB\_Est \times Cost_{GB}) \times (1 + HA\_Multiplier)$$

### 4.1.3. Ví dụ tham số từ cấu hình thật

1. Server_Base_Infra_Cost = 800,000.
2. Server_Cost_Per_100_Users = 400,000.
3. Storage_Cost_Per_GB = 550.
4. Reuse_Factor_Default = 0.2955.

**Nguồn:**
- KHantix_doc/outputs/KHantix - Phân rã Lớp 1 (Base Cost).md
- KHantix_doc/outputs/KHantix - Phân rã Lớp 1 Server & License (New).md
- KHantix_doc/requirements/internal_configs.csv
- KHantix_doc/requirements/module_catalog.csv

## 4.2. Lớp 2: Risk & Complexity (COCOMO EM)

### 4.2.1. Công thức lõi

$$Effort_{Adjusted} = ManDays_{Base} \times EM_{D1} \times EM_{D2} \times EM_{D3} \times EM_{I1} \times EM_{I2} \times EM_{T1} \times EM_{T2}$$

### 4.2.2. Nhóm EM chính

1. **Data Risk**: format, volume, integrity.
2. **Integration Risk**: API availability, legacy age.
3. **Tech Literacy Risk**: end-user age, prior system experience.

### 4.2.3. Biên kiểm soát từ CSV

Ví dụ thực tế:

1. EM_D1 (Data Format) có biên [1.0, 1.2].
2. EM_D2 (Data Volume) có biên [1.0, 1.25].
3. EM_C1 (Rush) có biên [1.0, 1.5].

AI có thể suy luận nhưng không được ra ngoài biên.

**Nguồn:**
- KHantix_doc/outputs/KHantix - Phân rã Lớp 2 (Rủi ro & Phức tạp).md
- KHantix_doc/outputs/KHantix - Phân rã Lớp 2 COCOMO Effort Multipliers.md
- KHantix_doc/projects/KHantix_Risk_Parameters_Correction.md
- KHantix_doc/requirements/heuristic_matrix_v2.csv

## 4.3. Lớp 3: Commercial & Strategy

### 4.3.1. Công thức lõi

$$Price_{Final} = \frac{Cost_{Adjusted}}{1 - Margin_{\%}} \times EM_{C1} \times EM_{C2} \times (1 - Discount_{C3})$$

Trong đó:

1. EM_C1 = Rush factor (khẩn cấp).
2. EM_C2 = Client logo strategy.
3. Discount_C3 = payment-term discount.

### 4.3.2. Giá trị cấu hình mẫu

1. K_Strategy_Enterprise_Logo = 0.87.
2. K_Strategy_Rush_Factor = 1.5.
3. Discount_Full_Payment = 0.05.
4. Margin thành phần: NetProfit 0.1875, RiskPremium 0.0975, Reinvestment 0.0866.

**Nguồn:**
- KHantix_doc/outputs/KHantix - Phân rã Lớp 3 (Thương mại).md
- KHantix_doc/requirements/internal_configs.csv

## 4.4. Sinh 3 phương án báo giá

Hệ thống dùng cùng Cost nền nhưng thay cấu hình thương mại/scope để tạo:

1. **Basic**: giảm scope hoặc chuyển một phần trách nhiệm cho khách, giữ mức khả thi.
2. **Standard**: phương án cân bằng, đề xuất mặc định.
3. **Premium**: timeline gấp/sla cao/onsite cao, giá cao hơn.

Tất cả phương án phải qua kiểm dependency, operation feasibility và margin floor.

**Nguồn:**
- KHantix_doc/outputs/KHantix - R&D Deal Giá 3 Tiers (Phase 3).md
- KHantix_doc/outputs/KHantix - Phân rã tham số định giá (FP0).md

