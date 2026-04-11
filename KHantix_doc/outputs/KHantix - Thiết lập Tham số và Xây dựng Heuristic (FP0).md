# Khantix - Thiết lập Tham số Nội bộ & Xây dựng Heuristic (First Principle)
_last updated: 2026-03-28_
_methodology: First Principle Protocol (FP0)_

Tài liệu này giải quyết 2 vấn đề cốt lõi cuối cùng của hệ thống AI Pre-sales: Xử lý tham số nội bộ của công ty và Cách xây dựng bảng Heuristic (Từ điển triệu chứng) để đảm bảo tính hiệu quả.

---

## VẤN ĐỀ 1: CÓ CHO CHATBOT ĐI "HỎI CUNG" CÔNG TY KHÔNG?

### 0. Nhận định (FP0)
- **Câu hỏi:** Có nên để AI hỏi CTO/Giám đốc từng dự án về $Rate_{Role}$ hay $Margin_{\%}$ không?
- **Trả lời:** **TUYỆT ĐỐI KHÔNG.**

### 1. Phân rã (Boil down)
- **Q: Bản chất của Tham số Nội bộ (Internal Parameters) là gì?**
  - Là chi phí vận hành (Điện, nước, lương, chỗ ngồi) và mục tiêu sống còn của công ty (Tỷ suất lợi nhuận). 
- **Q: Tính chất của nó là tĩnh hay động?**
  - Nó là **Hằng số (Constant)** đối với Pre-sales, và là **Biến số chậm (Slow Variable)** đối với Giám đốc. Nó chỉ thay đổi theo Quý hoặc theo Năm, KHÔNG thay đổi theo từng dự án (Deal). Tiền lương trả cho Dev không tự nhiên đắt lên chỉ vì khách hàng tên là Vingroup.
- **Q: Nếu cho AI đi hỏi công ty từng dự án thì sao?**
  - Chức năng của AI Pre-sales là mài mòn ma sát giao tiếp với khách hàng. Lôi nội bộ ra hỏi là thừa thãi, làm chậm tốc độ xuất báo giá, và biến AI thành "Kẻ dở hơi" đi hỏi lại CTO những thứ CTO đã chốt từ đầu năm.

### 2. Nguyên lý khởi nguyên (First Principle)
> **Nguyên lý Tách bạch Dữ liệu (Separation of Concerns):** 
> Tham số của Khách hàng là **Biến số Động (Dynamic Slots)** $\rightarrow$ AI phải đi hỏi (Phỏng vấn).
> Tham số của Công ty là **Hằng số Tĩnh (Static Configs)** $\rightarrow$ AI chỉ được phép đọc (Read-only) từ File cấu hình hoặc Database (Rate Card) do Giám đốc/CTO chốt hàng năm.

---

## VẤN ĐỀ 2: LÀM SAO VẼ BẢNG HEURISTIC ĐẦY ĐỦ VÀ ĐÁNG TIN CẬY?

### 0. Kiểm tra Frame (FP2)
- **Tuyên bố:** "Tôi cần làm một bảng Excel Heuristic hiệu quả và đầy đủ 100%".
- **Lệch Frame:** Không có bất cứ bảng Heuristic (Kinh nghiệm) nào trên đời đầy đủ 100%, vì ngôn ngữ và tình huống của con người là vô hạn. Nếu cố theo đuổi sự hoàn hảo, bạn sẽ không bao giờ launch được sản phẩm.

### 1. Phân rã cách thiết lập Heuristic (FP0)
Để bảng Từ điển Triệu chứng hiệu quả thực sự, bạn không gom nhặt triệu chứng một cách ngẫu nhiên. Bạn phải đi từ **Hậu quả lội ngược về Triệu chứng**.

- **Bước 1: Neo vào Tham số Bắt buộc (The Slots).** 
  - Đừng nghĩ câu hỏi. Hãy nhìn vào công thức: Ta có biến số `Data_Risk` ảnh hưởng đến 30% giá tiền.
- **Bước 2: Tìm Cực trị (Extremes).** 
  - `Data_Risk` có 3 mức: Rất Nát (High), Hơi Nát (Medium), Khá Sạch (Low).
- **Bước 3: Mổ xẻ Xác chết (Post-Mortem Analysis).**
  - Hãy hỏi CTO/PM của bạn: *"Trong 5 năm qua, dự án nào team mình làm sml vì data nát nhất? Hồi đi pre-sales, ông khách đó đã nói câu gì?"*
  - Câu trả lời có thể là: *"Hồi đó chả có app gì, khách kêu kế toán toàn xài File Excel riêng copy qua USB."* $\rightarrow$ **Đây chính là Triệu chứng Vàng.**
- **Bước 4: Thiết lập "Bức tường thành" (Fallback/Catch-all).**
  - Nếu khách tuôn ra một hệ thống kỳ lạ (vd: "Anh đang xài phần mềm AS400 từ năm 1990"), AI không có trong Heuristic thì sao?
  - $\rightarrow$ Nguyên tắc an toàn: Mọi thứ không có trong Heuristic được gán tự động thành mức **RỦI RO CAO NHẤT (HIGH)** hoặc đưa vào danh sách **[CẦN CON NGƯỜI DUYỆT - UNKNOWN]**. Thà báo giá cao trượt deal còn hơn báo giá thấp rồi ôm nợ.

### 2. Nguyên lý khởi nguyên (First Principle)
> **Nguyên lý Mạng lưới MECE (Mutually Exclusive, Collectively Exhaustive):**
> Làm sao để tin bảng Heuristic đã đủ tốt? Bạn không cần đếm xem mình có 100 hay 1000 triệu chứng. Bảng Heuristic đáng tin **KHÔNG PHẢI vì nó bọc hết mọi câu nói của khách**, mà đáng tin vì **nó bao trùm MỌI Kịch bản Rủi ro cốt lõi (Tốt, Xấu, Cực Xấu)** và có một **Cơ chế An toàn (Fallback)** cho những thứ chưa biết. Hệ thống Heuristic hiệu quả là một thực thể **Sống (Living Organism)**, nó bắt đầu với 20 triệu chứng cốt lõi và được team Sales cập nhật thêm mỗi khi "vấp té" ở một dự án mới.
