# Tóm tắt tình hình Hệ thống: Gaps Logic từ Base Cost đến 3 Tiers
_Ngày lập: 2026-04-15_

## 1. Giá Margin được tính ở giai đoạn nào?
Theo tư duy First Principle của định giá IT (CPQ), Margin **trực thuộc Lớp 3 (Lớp Thương mại)** và bắt buộc phải được tính **SAU KHI** đã hoàn tất Lớp 1 (Base Cost) và Lớp 2 (Hệ số Rủi ro).

*   **Lớp 1 (Base Cost):** Ước tính số Man-days mộc + Giá Server/License mộc = *Giá vốn cứng*.
*   **Lớp 2 (Risk/Complexity Buffer):** Dội thêm hệ số phạt (10-30%) để cover rủi ro kỹ thuật, rủi ro khách hàng = *Total Cost (Giá vốn an toàn nhất cho công ty)*.
*   **Lớp 3 (Margin & Discount):** Bắt đầu áp Margin kỳ vọng (ví dụ 30-40%) lên Total Cost để ra `Target Price` (Giá chào bán chuẩn).

**Kết luận:** Tuyệt đối không nhồi Margin ngay từ đầu khi chưa xác định xong yếu tố rủi ro kỹ thuật, vì nếu dự án fail, phần Margin đó sẽ bị "ăn" hết vào chi phí sửa bug/làm thêm giờ.

---

## 2. Thực trạng dự án hiện tại
*   **Đạt được:** Đã đi xong luồng tính **Giá vốn sàn + Chi phí Rủi ro (Total Cost)**.
*   **Điểm nghẽn:** Giao diện 3 Báo giá (3 Tiers) đã có UI, nhưng nghiệp vụ đang bị lộn xộn. Nguyên nhân gốc rễ (FP0) là do hệ thống đang xem 3 Tiers là "3 con số sinh ra ngẫu nhiên" thay vì "1 Gói Target + 2 Gói Chim mồi (Decoy) dựa trên việc Trade-off Phạm vi & SLA".

---

## 3. Lộ trình (Steps) để ra được 3 Báo giá chuẩn thực tế

Theo First Principle (FP2) về hệ thống Bán hàng B2B, ta không thể nhảy thẳng từ thu thập yêu cầu sang 3 Báo giá (3 Tiers). Quy trình chuẩn phải đi qua 4 Phase như sau:

### Phase 1: Discovery (Khám phá)
*   **Thu thập:** "Nỗi đau" (Pain points), bài toán kinh doanh, quy trình hiện tại.
*   **Nguyên tắc:** Tuyệt đối chưa nhắc đến tính năng (Modules) hay scope chi tiết ở bước này.

### Phase 2: ROM & Qualify (Neo giá & Lọc)
*   **Mục tiêu:** Fail Fast (Lọc budget). Đưa ra một "Khoảng giá thô" (ROM - Rough Order of Magnitude) dựa trên dự án tương tự để thử phản ứng khách hàng (VD: "Khoảng $50,000 - $80,000").
*   **Hành động:** Chỉ đi tiếp nếu khách chấp nhận được khoảng ROM này.

### Phase 3: Scoping (Chốt phạm vi tính năng)
*   **Hành động:** Nếu khách OK với ROM, Pre-sales mới ngồi xuống đàm phán chi tiết thêm/bớt tính năng.
*   **Chi tiết hóa:** Cụ thể hóa bài toán từ Phase 1 thành các modules, số lượng server, số ngày công (Tính Base Cost).

### Phase 4: Final Quote (Đưa ra 3 Báo giá chi tiết - 3 Tiers)
Lúc này cuộc đàm phán chỉ xoay quanh việc chốt gói nào, tính năng gì nằm trong gói đó, thay vì đàm phán phá giá. Để tạo 3 Tiers từ `Total Cost` hợp lý:

#### Bước 4.1: Xác định "Gói Target / Gói Standard" trước tiên
*   Lấy Total Cost làm mốc. Áp dụng Target Margin chuẩn của công ty (lấy từ `internal_configs.csv` - vd: 30%).
*   Ra được Giá bán Tiêu chuẩn: `Standard Price = Total Cost / (1 - 0.3)`.
*   Giữ nguyên toàn bộ Scope (Tính năng) và SLA tiêu chuẩn mà khách hàng vừa yêu cầu ở Lớp 1 & 2.

#### Bước 4.2: Thiết kế Gói Mỏ neo Dưới (Base/Essential Tier)
Để khách hàng có option rẻ, bắt buộc phải thiết kế quy tắc **Trade-off (Đánh đổi)**:
*   Hạ Margin xuống thấp hơn (vd: 20%).
*   **Hạ Scope/SLA:** Gợi ý cắt bỏ các tính năng Nice-to-have, bỏ bảo hành, chuyển từ Support 24/7 (30 phút phản hồi) sang 8/5 (24h phản hồi).

#### Bước 4.3: Thiết kế Gói Mỏ neo Trên (Premium/Advanced Tier)
Dùng để neo tâm lý giá cao, làm cho Gói Standard trở nên hợp lý:
*   Áp Margin rất cao (vd: 50% - 60%).
*   **Bơm Value-Add:** Nhồi thêm các Option như Phân tích Dữ liệu Nâng cao, Tặng thêm 1 năm bảo trì, Thời gian SLA cam kết < 15 phút, Add-on không giới hạn License...

#### Bước 4.4: Trình bày và Guardrails (Biên phòng vệ đàm phán)
Khi trình ra 3 Tiers cho Pre-sales xem:
*   UI phải hiển thị rành mạch hệ quả (Trade-off): *"Nếu chọn gói Rẻ, khách mất gì? Nếu chọn gói Đắt, Cty được thêm bao nhiêu phần trăm lãi?"*
*   Guardrails: AI không cho phép Pre-sales sửa giá gói Base xuống thấp hơn cả Total Cost (nhằm bảo vệ công ty không bị lỗ). 

## 4. Hành động tiếp theo
Cập nhật lại logic Backend Controller để thay vì sinh 3 giá mù mờ, hãy sinh ra 1 array JSON định nghĩa rõ: 
`[ {Tier: Base, Margin: 0.2, Chopped_Features: [...]}, {Tier: Standard, Margin: 0.3}, {Tier: Premium, Margin: 0.5, Added_Features: [...]} ]`.