# Khantix - Từ điển Tham số Định giá (Pricing Data Dictionary)
_last updated: 2026-03-28_

Dưới đây là bảng tổng hợp toàn bộ các tham số (từ tổng quát đến phân rã chi tiết) của 3 Lớp Công thức Định giá, kèm theo kiểu dữ liệu (Data Type) để hệ thống AI Pre-sales có thể Map/Fill vào cấu trúc dữ liệu JSON khi làm việc.

---

## LỚP 1: GIÁ VỐN CỨNG (BASE COST)
> $Cost_{Base} = (License + Hardware) + (ManDays \times Rate_{Burdened})$

| Tham số / Yếu tố con | Kiểu dữ liệu (Data Type) | Ví dụ giá trị (Example) | Ghi chú |
| :--- | :--- | :--- | :--- |
| **$Cost_{Base}$ (Tổng Lớp 1)** | `Currency` (Số) | `500,000,000` (VND) | Giá vốn sàn bắt buộc |
| **$Hardware$ / 3rd Party Cost** | `Currency` (Số) | `10,000,000` (VND) | Tiền mặt chảy ra ngoài |
| ↳ *Sizing (Quy mô tải)* | `Number` (Số lượng) | `5000` (API Calls/ngày) | Suy ra tiền Server/Băng thông |
| ↳ *Dependency (Chi phí ẩn)* | `Enum` (Danh sách) | `["SMS_OTP", "Google_Map"]` | Các dịch vụ bắt buộc mua kèm |
| **$License$ (Giá chất xám)** | `Currency` (Số) | `50,000,000` (VND) | Giá niêm yết phần mềm bán đứt |
| ↳ *Tiering Threshold (Gói KH)* | `Range` (Khoảng) | `[50, 100]` (User) | Mốc áp dụng giá sỉ |
| ↳ *Renew Policy (Duy trì Mnt)*| `Percentage` (%) | `15%` | Phí bảo trì năm sau |
| **$ManDays$ (Công sức chuẩn)**| `Number` (Số ngày) | `30` (Ngày) | Thời gian lý thuyết (Chưa rủi ro) |
| ↳ *Scope Granularity* | `Number` (Số tính năng)| `15` (Modules/Features) | Độ lớn của dự án |
| ↳ *Reuse Factor (Tái sử dụng)* | `Percentage` (%) | `20%` | Tỉ lệ code copy-paste (giảm Cost) |
| **$Rate_{Burdened}$ (Đơn giá)** | `Currency` (Số) | `2,000,000` (VND/Ngày) | Chi phí/ngày đã gánh Overhead |
| ↳ *Resource Mix Ratio* | `Dictionary` / `Ratio` | `{"Senior": 0.4, "Junior": 0.6}` | Hệ số pha trộn mâm nhân sự |
| ↳ *Deployment Location* | `Enum` / `Boolean` | `"Onsite"` hoặc `True` | Đi công tác hay làm Remote |

---

## LỚP 2: RỦI RO & PHỨC TẠP (RISK & COMPLEXITY)
> $Effort_{Adjusted} = ManDays \times (1 + \sum Risk_{Factors})$

| Tham số / Yếu tố con | Kiểu dữ liệu (Data Type) | Ví dụ giá trị (Example) | Ghi chú |
| :--- | :--- | :--- | :--- |
| **$Effort_{Adjusted}$** | `Number` (Số ngày) | `39` (Ngày) | Số ManDays thực tế sau đệm |
| **$\sum Risk_{Factors}$** | `Percentage` (%) | `+30%` (0.3) | Tổng Buffer kỹ thuật |
| **$Risk_{Data}$ (Rủi ro Dữ liệu)** | `Percentage` (%) | `+15%` (0.15) | Buffer cho Data Cleansing |
| ↳ *Data Format* | `Enum` (Danh mục) | `"Excel"`, `"PDF"`, `"SQL"` | Đầu vào càng thô Buffer càng cao |
| ↳ *Data Volume* | `Number` / `Range`| `5` (Years) hoặc `1M` (Rows)| Size dữ liệu rác |
| ↳ *Data Integrity* | `Boolean` (Đúng/Sai) | `False` (Dữ liệu Messy) | Có chuẩn hóa/Validate chưa? |
| **$Risk_{Integration}$ (Tích hợp)** | `Percentage` (%) | `+10%` (0.1) | Buffer cho việc kết nối API |
| ↳ *API Availability* | `Boolean` (Đúng/Sai) | `False` (Hệ thống đóng) | Hệ thống cũ có chốt mở cổng không? |
| ↳ *Legacy System Age* | `Number` (Tuổi) | `10` (Years old) | Hệ thống cũ hay mới? |
| **$Risk_{Tech\_Literacy}$ (Kháng cự)** | `Percentage` (%) | `+5%` (0.05) | Buffer cho Training / Support |
| ↳ *End-user Age* | `Range` / `Number` | `[45, 55]` (Tuổi trung bình) | Tuổi cao = rủi ro học app chậm |
| ↳ *Prior System Experience* | `Boolean` (Đúng/Sai) | `False` (Lần đầu xài App) | Họ đã có thói quen dùng App chưa?|

---

## LỚP 3: THƯƠNG MẠI & CHIẾN LƯỢC (COMMERCIAL & STRATEGY)
> $Price_{Final} = \left[ \frac{Cost_{Base\_Adjusted}}{1 - (Margin_{\%} + Comm_{\%})} \right] \times K_{Strategy} \times (1 - Discount_{Payment})$

| Tham số / Yếu tố con | Kiểu dữ liệu (Data Type) | Ví dụ giá trị (Example) | Ghi chú |
| :--- | :--- | :--- | :--- |
| **$Price_{Final}$ (Giá Báo KH)** | `Currency` (Số) | `850,000,000` (VND) | Giá chốt nằm trên hợp đồng |
| **$Margin_{\%}$ (Lợi nhuận Gộp)** | `Percentage` (%) | `30%` (0.3) | Không được phép cắt gọt |
| ↳ *Risk Premium* | `Percentage` (%) | `5%` | Phòng ngừa khách bùng nợ/trễ hẹn |
| ↳ *Reinvestment (R&D)* | `Percentage` (%) | `10%` | Nuôi công ty, tạo sp mới |
| ↳ *Net Profit* | `Percentage` (%) | `15%` | Cổ tức bỏ túi chủ doanh nghiệp |
| **$Comm_{\%}$ (Phí đối tác/Sales)** | `Percentage` (%) | `10%` (0.1) | Phí hoa hồng đại lý / CAC |
| **$K_{Strategy}$ (Hệ số Chiến lược)** | `Coefficient` (Hệ số thập phân)| `0.8` (Giảm) hoặc `1.5` (Dội) | Hệ số bẻ lái kinh doanh (Multiplier)|
| ↳ *Client Logo Size* | `Enum` (Cấp độ) | `"Enterprise"`, `"SMB"` | Nếu khách là "Cá Mập" $\rightarrow$ K < 1 |
| ↳ *Rush Factor* | `Boolean` (Đúng/Sai) | `True` (Cần gấp) $\rightarrow$ K = 1.5 | Dự án cháy nhà, OT đắt gấp đôi |
| **$Discount_{Payment}$ (Chiết khấu)**| `Percentage` (%) | `5%` (0.05) | Khuyến khích trả tiền ngay |
| ↳ *Payment Term* | `Enum` (Quy định) | `"Trả đứt 1 vòng"`, `"3 Đợt"` | Phương thức thanh toán |
