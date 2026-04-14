# Khantix - Phân rã Lớp 1: Server & License Cost (Cập nhật)
_Ngày lập: 14/04/2026_
_Phương pháp: First Principles Protocol (FP0)_

Tài liệu này chuẩn hóa lại công thức tính toán **Server Cost** và **License Cost** thuộc Base Cost (Lớp 1), khắc phục tình trạng ước tính tỷ lệ phần trăm (20% labor) thiếu chính xác và rập khuôn (5 triệu/1000 users) cũ. Công thức mới bám sát mô hình định giá Cloud (AWS/Azure) và SaaS Component thực tế.

---

## 1. SERVER COST (Chi phí Hạ tầng)

**Cấu trúc vấn đề:**
Giá Server không phải là một con số nhân tĩnh với số lượng user. Một hệ thống phần mềm luôn có phí sàn để duy trì instance (bất kể 1 hay 100 users), theo sau là phí tải (Compute) và phí lưu trữ (Storage).

> **Công thức mới (Tính chi phí tải & lưu lượng):**
> $Server_{Cost} = Base\_Infra + \left(\lceil\frac{Concurrent\_Users}{100}\rceil \times Cost_{100Users}\right) + (Total\_GB\_Est \times Cost_{GB}) \times (1 + High\_Availability\_Multiplier)$

### Yếu tố cấu thành & Tương tác với Khách Hàng (Investigator):

Để tính được chi phí Server sát thực tế, **AI Investigator bắt buộc phải đặt thêm câu hỏi** để trích xuất được 3 tham số ẩn sau đây từ khách hàng:

1. **Lượng truy cập đồng thời (`Concurrent_Users`) thay vì `Total_users`:**
   - *Tại sao cần?* Máy chủ chỉ tốn tiền CPU/RAM dựa trên số người *cùng truy cập một lúc*, không phải tổng số tài khoản (Ví dụ: 1 triệu tài khoản nhưng chỉ 500 người online thì mua server nhỏ).
   - *Câu hỏi AI nên dùng:* "Tính năng [XXX] bên anh trong giờ cao điểm thường có khoảng bao nhiêu người truy cập cùng một lúc? Hay mọi người vào rải rác cả ngày?"

2. **Dung lượng lưu trữ (`Storage_GB`) hoặc Loại hình Dữ liệu tác động đến GB:**
   - *Tại sao cần?* Càng lưu trữ nhiều File, Hình ảnh, Video thì phí mua S3 / DB càng Đắt. Không thể lấy công thức 1 user sinh ra 0.1 GB mặc định.
   - *Câu hỏi AI nên dùng:* "Anh dự kiến hệ thống này lưu trữ nhiều dữ liệu không? Ví dụ có thường xuyên upload video hay tài liệu dung lượng lớn không?"

3. **Tính sẵn sàng và Sao lưu (`High_Availability`):**
   - *Tại sao cần?* Server chạy bình thường rẻ hơn rất nhiều so với Server có dự phòng (Multi-AZ / Load Balancer) để chống sập mạng.
   - *Câu hỏi AI nên dùng:* "Hệ thống này có bắt buộc phải sống 24/7 không? Nếu gặp lỗi kỹ thuật chết 1 vài tiếng thì bên mình có bị ảnh hưởng nặng nề không?"

| Thành phần Toán Học | Chi tiết & Nguồn lấy | Tình trạng | Cách lấy (Kế hoạch Mới) |
| :--- | :--- | :--- | :--- |
| **$Base\_Infra$** | Chi phí duy trì hạ tầng lõi tối thiểu. Ví dụ: 800,000 VND. | ❌ Chưa có | Lấy từ `Server_Base_Infra_Cost` trong `internal_configs` |
| **$Concurrent\_Users$** | Số người dùng cao điểm truy cập cùng lúc. Cứ 100 CCU là 1 block tiền. | ❌ Mới cập nhật | Cập nhật schema để **AI Investigator hỏi khách** và fill vào biến `concurrent_users`. Mặc định = `userCount * 0.1`. |
| **$Cost_{100Users}$** | Step-cost (Chi phí tăng thêm do Compute) cho mỗi block 100 CCUs. | ❌ Đang là 1000 | Sửa thành `Server_Cost_Per_100_Users` trong config. |
| **$Total\_GB\_Est$** | Ước lượng GB lưu trữ. | ❌ Mới cập nhật | AI suy luận từ việc **hỏi khách xem file nặng không**. Hoặc mặc định công thức: $\sum(Module\_Quota\_GB) \times User$. |
| **$Cost_{GB}$** | Đơn giá lưu trữ mỗi GB (VD: AWS S3 ~ 550 VND/GB). | ❌ Chưa có | Thêm biến `Storage_Cost_Per_GB` vào `internal_configs`. |
| **$High\_Availability$** | Nhu cầu chống sập mạng. | ❌ Mới cập nhật | AI hỏi khách. Nếu "Có" $\rightarrow$ Thêm 50% tổng bill (Hệ số `0.5`). Quản lý bằng biến `requires_high_availability` |

---

## 2. LICENSE COST (Chi phí Chất xám / Bản quyền)

**Cấu trúc vấn đề:**
Bản quyền mã nguồn không thể tính bằng 20% chi phí nhân công (Dev Cost) vì như thế dự án Dev OT nhiều thì License tự động tăng (vô lý). License phải được tính theo "Menu tính năng" (Module Catalog) mà hệ thống match được với yêu cầu của khách hàng.

> **Công thức mới:**
> $License_{Cost} = \left[ \sum_{i=1}^{n} (Module_{[i]}.License\_Base\_Price) \right] \times (1 - Reuse\_Factor)$

### Yếu tố cấu thành & Nguồn dữ liệu suy luận:

| Thành phần | Giải thích | Lấy từ đâu? | Tình trạng hiện tại | Cách thu thập / Bổ sung |
| :--- | :--- | :--- | :--- | :--- |
| **$Module_{[i]}$** | Các tính năng cốt lõi (Core/Add-ons) đã được thư viện hóa (VD: Identity, Subscriptions, WMS). | Hệ thống Catalog của công ty. | ⚠️ Có `module_catalog.csv` nhưng AI chưa match tự động xuống Calculator. | Bắt buộc AI sinh ra mảng `matchedModules` trong output JSON. Tầng Service sẽ đọc CSV tương ứng. |
| **$License\_Base\_Price$** | Giá niêm yết bán đứt phần core chất xám của module này. | Định mức của công ty cho từng Module. | ❌ Chưa có. | Thêm cột `License_Cost_Base` cho tất cả rows trong `module_catalog.csv`. |
| **$Reuse\_Factor$** | Tỷ lệ code tái sử dụng làm giảm giá trị cho khách. | Tiêu chuẩn nội bộ. | ✅ Đã có `Reuse_Factor_Default` (0.2955) | Giữ nguyên. |

### Ví dụ Vận Hành:
Khách hàng có 50 Users, cần làm tính năng Đăng nhập (`MOD_IAM_01` giá 5tr VNĐ, sinh 0.1GB/user) và tính năng Quản lý Tài Liệu (`MOD_DOC_01` giá 10tr VNĐ, sinh 5GB/user). Base Infra = 800k, 100 User Step = 400k, GB = 500đ. Reuse = 20%.
* $Total\_GB = 50 \times (0.1 + 5) = 255\text{ GB}$
* $Server_{Cost} = 800,000 + (1 \times 400,000) + (255 \times 500) = 1,327,500\text{ VND}$  *(Sát thực tế, rất hợp lý cho dự án siêu nhỏ)*
* $License_{Cost} = (5,000,000 + 10,000,000) \times (1 - 0.2) = 12,000,000\text{ VND}$