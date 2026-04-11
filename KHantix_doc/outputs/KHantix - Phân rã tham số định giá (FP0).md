# Khantix - Phân rã tham số định giá (First Principle)
_last updated: 2026-03-28_
_inputs: [[QA.md]], [[KHantix - Hướng Hybrid System.md]]_

## 1. Mục Tiêu Của Hệ Thống AI Pre-sales (The Goal)
Hệ thống AI không sinh ra để "hỏi cung" khách hàng bằng các thuật toán phức tạp. Workflow chuẩn của hệ thống là:
1.  **AI Giao tiếp (Non-technical):** AI dùng ngôn ngữ đời thường, khơi gợi điểm đau để khách hàng thoải mái chia sẻ (tránh cảm giác sợ bị "hớ" hoặc không hiểu kỹ thuật).
2.  **AI Suy luận (Imputation):** Từ câu trả lời bình dân, AI ánh xạ và dự đoán các biến số kỹ thuật, tỷ lệ rủi ro (Risk Management) dựa trên dữ liệu thị trường và kinh nghiệm.
3.  **Hệ thống Tính toán (Math Engine):** Áp dụng các biến số đã được số hóa vào 3 Lớp công thức định giá cơ sở.
4.  **Xuất Báo cáo Báo giá (Pre-sale Report):** Đưa ra 3 phương án báo giá (vd: Tiết kiệm, Tiêu chuẩn, Cấp tốc) với breakdown rõ ràng từng mục giá, nỗ lực (effort) và lý do (vd: vì sao dội chi phí làm sạch dữ liệu).

---

## 2. Phân Rã 3 Lớp Công Thức Định Giá (FP0)

Dưới đây là bản chất của từng biến số cấu thành lên giá thành mà AI cần tìm kiếm hoặc suy luận.

### Lớp 1: Giá Vốn Cứng (Base Cost) - Bắt buộc bảo vệ điểm hòa vốn
> **Công thức:** $Cost_{Base} = \underbrace{(License + Hardware)}_{\text{Tiền tươi xuất ra}} + \underbrace{(ManDays \times Rate_{Burdened})}_{\text{Sức người (Đã kèm Overhead)}}$

Đây là lớp AI cần rà soát kỹ nhất vì nó liên quan trực tiếp đến dòng tiền công ty.

| Biến số | Pre-sales AI cần quan tâm (Cách thức hỏi & Suy luận) | Lý do quan trọng |
| :--- | :--- | :--- |
| **$Hardware$** / API | **Quy mô (Sizing):** AI hỏi: *"Bên anh dự kiến có bao nhiêu giao dịch một ngày?"* $\rightarrow$ Lượng tải Server, số SMS OTP cần gửi. | Thiếu $\rightarrow$ Công ty phải "cắn" lợi nhuận đắp vào tiền Server/API. |
| **$License$** | **Khung bậc (Tiering):** AI hỏi: *"Quy mô đội ngũ bán hàng của anh cỡ bao nhiêu người?"* $\rightarrow$ Suy luận chọn gói 50 User hay 100 User cho tối ưu. | 45 Users áp giá đơn đôi khi đắt hơn gói 50 Users. Tối ưu quyền lợi khách. |
| **$ManDays$** | **Khả năng tái sử dụng (Reuse):** AI tự động quét Database nội bộ xem có module nào khách mô tả đã được code sẵn chưa. | Biến số này quyết định khả năng giảm giá cạnh tranh (vốn $= 0$) nếu copy-paste được mã nguồn cũ. |
| **$Rate_{Role}$** | **Gia giảm nguồn lực (Resource Mix):** Khách chê đắt $\rightarrow$ AI âm thầm đổi biến số trộn tỷ lệ Senior/Junior thay vì cắt tính năng. | Giúp giữ deal với người ít ngân sách mà không ảnh hưởng chất lượng cốt lõi. |
| **$Location$** | **Triển khai ở đâu:** Trực tiếp Onsite hay Remote? | Onsite tốn chi phí đi lại phụ cấp, $Rate$ sẽ cao hơn. |

---

### Lớp 2: Rủi Ro & Phức Tạp (Risk & Complexity) - Bộ đệm an toàn
> **Công thức:** $Effort_{Adjusted} = ManDays \times (1 + \sum Risk_{Factors})$

Khách hàng thường giấu hoặc không nhận thức được "độ nát" của kho dữ liệu/quy trình của họ. AI phải khơi gợi và **dự đoán**.

| Phân rã Rủi ro | Câu hỏi khơi gợi của AI | Hệ số Suy luận tự động (Heuristic) |
| :--- | :--- | :--- |
| **Dữ liệu móp méo (Data Risk)** | *"Hiện tại dữ liệu bên anh đang lưu trên sổ sách, Excel hay đã có phần mềm cũ?"* | Ghi nhận Excel $\rightarrow$ Dữ liệu không chuẩn hóa $\rightarrow$ **Cộng 25-30% Buffer** cho Data Cleansing. |
| **Tích hợp kềnh càng (Integration Risk)** | *"Anh có bắt buộc hệ thống mới phải nói chuyện được với phần mềm kế toán (vd MISA, ERP cũ) không?"* | Có tích hợp hệ thống đóng/cũ $\rightarrow$ **Cộng 15-20% Buffer** do khó khăn đọc API/Database. |
| **Kháng cự Công nghệ (Tech Literacy Risk)** | *"Đội ngũ dùng app này trực tiếp độ tuổi nào, có quen dùng smartphone nhiều không?"* | Đội tuổi cao/thợ máy/công nhân $\rightarrow$ Cần Training kỹ, support nhiều $\rightarrow$ **Cộng 15% Buffer**. |

---

### Lớp 3: Thương Mại & Chiến Lược (Commercial/Strategy) - Nghệ thuật chốt Deal
> **Công thức:** $Price_{Final} = \left[ \frac{Cost_{Base\_Adjusted}}{1 - (Margin_{\%} + Comm_{\%})} \right] \times K_{Strategy} \times (1 - Discount_{Payment})$

Lớp này AI lấy thông số kinh doanh từ công ty (Target Margin) và chỉ cần điều chỉnh **Hệ số Thương vụ** để win deal.

| Biến số Thương vụ | Pre-sales AI cần quan tâm (Cách thức hỏi & Suy luận) | Lý do |
| :--- | :--- | :--- |
| **$K_{Strategy}$** (Hệ số Chiến lược) | Dựa trên danh tiếng công ty khách. Nếu là ông lớn (VinGroup, Vietcombank) $\rightarrow$ Hệ số $< 1$ (Giảm giá chiến lược). | Lấy danh tiếng (Logo) làm Portfolio $\rightarrow$ Thuận lợi bán ngàn dự án sau. |
| **Rush Factor** (Hệ số khẩn cấp) | AI hỏi: *"Dự án này bên anh cần xong trước tết đúng không?"* $\rightarrow$ Suy luận: Chạy gấp, OT $\rightarrow$ Nhân hệ số từ $1.3 - 1.5$. | Không lấy gấp, phải cắt nguồn lực của team khác bù vào. |
| **$Discount$** (Chiết khấu dòng tiền) | AI hỏi: *"Bên anh muốn thanh toán 1 cục lúc nghiệm thu hay thanh toán trước một nửa?"* | Ưu tiên khách trả tiền trước (đỡ chi phí vốn bù lương Dev). |

---

## 3. Đầu Ra: Báo Cáo Tính Giá Pre-sale (Pricing Recommendation)

Khi có đủ tham số quy chiếu, AI tính toán và xuất ra **3 Phương án (Options)** báo giá linh hoạt:

1.  **Gói Tiết Kiệm (Basic):** 
    - Rate Mix nhiều Junior. 
    - Bỏ tích hợp hệ thống (Risk thấp). 
    - Effort kéo dài (không Rush).
2.  **Gói Tiêu Chuẩn (Standard):**
    - Rate Mix đội hình chuẩn (Junior + Senior). 
    - Bao gồm Data Cleansing & Training đầy đủ.
3.  **Gói Tốc Độ / Doanh Nghiệp (Fast-Track):**
    - Rush Factor $\times 1.5$ (Chạy đêm/OT).
    - Cam kết support tận nơi (Onsite Rate).

**Cấu trúc một Report chuẩn mà hệ thống sẽ xuất ra:**
- **Nhu cầu cốt lõi được ghi nhận:** Điểm danh các yêu cầu hệ thống.
- **Bảng Khuyến nghị 3 Phương án Báo giá:** So sánh ưu/nhược và giá tiền cuối cùng ($Price_{Final}$).
- **Breakdown Chi phí (Minh bạch Effort):** Trực quan hóa phần *Lớp 1 & Lớp 2*. Ví dụ: Giải thích với khách phần dội giá 30 ManDays là tính năng "Làm sạch 5 năm file Excel rác" để khách hàng hiểu rõ giá trị thực nhận. (Không công khai Margin nội bộ).
