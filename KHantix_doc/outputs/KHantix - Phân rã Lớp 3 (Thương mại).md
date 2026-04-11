# Khantix - Phân rã Lớp 3: Thương mại (Commercial & Strategy)
_last updated: 2026-03-28_
_methodology: First Principle Protocol (FP0 & FP2)_

## 0. KIỂM TRA FRAME (FP2)
- **Tuyên bố:** $Price_{Final} = \left[ \frac{Cost_{Base\_Adjusted}}{1 - (Margin_{\%} + Comm_{\%})} \right] \times K_{Strategy} \times (1 - Discount_{Payment})$
- **Neo (Anchor):** Đây là công thức **Định giá dựa trên Lợi nhuận gộp (Gross Margin Pricing)** kết hợp với **Tài chính Doanh nghiệp (Corporate Finance)** và **Giá trị Vòng đời Khách hàng (LTV/CAC)**.
- Rất nhiều người thắc mắc: "Tại sao lấy Cost chia cho $(1 - Target\%)$ mà không phải nhân với $(1 + Target\%)$?". (100 / 0.7 = 142. Mức 142 chứa tỷ trọng lãi 30%. Nếu lấy 100 x 1.3 = 130 $\rightarrow$ Lợi nhuận trên doanh thu 130 chỉ là 23% $\rightarrow$ Điển hình của việc sai nguyên lý lợi nhuận gộp).

---

## 1. PHÂN RÃ (FP0 - Boil down)

### A. Nhóm Biến số: Lợi nhuận (Margin) & Chi phí Thu hút Khách hàng (Comm%)
- **Q: Bản chất của $Margin_{\%}$ là gì? Lão Sếp đút túi ăn chơi à?**
  - Không. Margin là **Chi phí của sự Sống sót**. Nó bao gồm:
    1. Tiền R&D (Reinvestment): Nuôi Dev lúc không có dự án ký kết (Bench time) để nghiên cứu tính năng mới (chống công nghệ lỗi thời).
    2. Rủi ro Kinh doanh (Business Risk): Khoản phòng hờ khi khách bùng tiền.
    3. Net Profit (Lợi tức Cổ đông): Trả công sự mạo hiểm khi đổ vốn mở công ty.
- **Q: Nguồn gốc và tham số con của $Margin_{\%}$?**
  - Mức bù đắp vốn vay ngân hàng (Cost of Capital).
  - Tỷ lệ Benchmark chung của ngành (Software thường Gross Margin $~60-70\%$, Net Profit $~15-20\%$).
- **Q: Nguồn gốc của $Comm_{\%}$ (Commission/Partner Cost)?**
  - Là **Chi phí Mua lại Khách hàng (CAC)**. Tiền trả cho Sales chốt được hay "lại quả" cho đối tác giới thiệu mối dự án về.
- **Q: Pre-sales có cần hiểu tham số này không?**
  - **CÓ (Nhưng giới hạn).** $Margin_{\%}$ là Bất khả xâm phạm (Công ty quy định là HỘP ĐEN - Blackbox, Pre-sales / AI không thay đổi). Nhưng $Comm_{\%}$ Pre-sales cần biết nếu hợp đồng này phải thông qua đại lý (đội giá lên để chia phần trăm).

### B. Nhóm Biến số: Hệ số Chiến lược ($K_{Strategy}$)
- **Q: Bản chất của $K_{Strategy}$ là gì?**
  - Là **Chi phí Mua lại Nền móng Thương hiệu (Portfolio Value)** hoặc **Chiến lược thâm nhập**.
- **Q: Tại sao lại đánh đổi Lợi nhuận trước mắt? Cấu thành bởi tham số con gì?**
  - Nếu bán cho Vingroup, FPT, một Big Logo $\rightarrow$ $K_{Strategy} < 1$ (Giảm giá $0.8$, $0.9$). Khoản giảm này là tiền Marketing/PR bỏ ra để dùng Case-study của ông lớn đi lùa/thuyết phục 100 ông nhỏ khác dễ dàng hơn, thu hồi vốn nhanh hơn.
  - Ngược lại nếu Khách hàng "Nước đến chân mới nhảy" $\rightarrow$ Rush Factor ($K_{Strategy} = 1.3 \sim 1.5$). $1.5$ bù đắp cho Sự hỗn loạn tổ chức của công ty khi phải ngắt Developer từ dự án khác sang hoặc bắt Dev làm OT tới sáng.
- **Q: Pre-sales/AI có cần hiểu?**
  - **VÔ CÙNG QUAN TRỌNG.** AI hỏi thăm nhẹ nhàng: *"Bên anh là công ty Start-up mới hay tập đoàn lớn ạ? Lộ trình anh đang định khi nào thì bắt buộc phải chạy live hệ thống?"*. Nghe "Tập đoàn lớn" $\rightarrow$ Đề xuất Ban Giám Đốc mở cơ chế giảm giá chiến lược. Nghe "Live vào cuối tuần này" $\rightarrow$ Bật $K_{Strategy} > 1.2$ làm rào chắn.

### C. Nhóm Biến số: Thanh toán (Discount_Payment)
- **Q: Bản chất của giảm giá thanh toán ngay là gì?**
  - Là **Giá trị thời gian của Tiền (Time Value of Money - TVM) + Mua đứt rủi ro Nợ Xấu**.
- **Q: Nguồn gốc của điều khoản này?**
  - Lãi suất ngân hàng (Công ty vay 10%/năm để duy trì dòng tiền trả lương $\rightarrow$ Nếu khách trả trước 1 cục không nợ công, mình có thể discount 3-5% cho khách vì tiết kiệm được tiền ngân hàng và tỷ lệ rủi ro thu hồi nợ bằng 0).
- **Q: Pre-sales có cần hiểu tham số này không?**
  - AI phải mặc định hỏi trước khi chốt hạ: *"Hiện tại nếu anh thành toán 100% khi ký HĐ, hệ thống tự động sinh chiết khấu 5% so với chia làm 3 đợt. Anh thấy sao?"* $\rightarrow$ Đánh vào tâm lý tiết kiệm của Khách.

---

## 2. XÁC NHẬN NGUYÊN LÝ KHỞI NGUYÊN (First Principle)
> **Nguyên lý Giá Trị Doanh Nghiệp Cốt Lõi:**
> "Giá Bán Lớp 3 không đại diện cho chi phí phần mềm. Nó đại diện cho chi phí để công ty tồn tại trong nền kinh tế thị trường, bao gồm Lợi tức hy vọng của sự mạo hiểm (Margin), Phí phòng tránh thảm họa nợ xấu (Discount TVM), và Phí mua quyền lực tương lai (Branding Strategy). Nếu Lớp 1 là Lương khô để sống sót ngày hôm nay, thì Lớp 3 là Áo giáp và Mũi giáo để công ty thống trị vào ngày mai."

---

## 3. GỢI Ý TIẾP THEO THEO HỆ THỐNG HYBRID AI
- Bây giờ bạn đã có 3 file Phân rã tuyệt mỹ đến Từng Biến Số theo Nguyên lý Gốc. Nhiệm vụ cuối cùng của System AI Pre-sales là nối 3 Lớp này bằng JSON Config. Bạn có muốn xem mẫu Prompt/JSON Structure để con Bot có thể tự động hỏi, điền và lấp đầy 3 file này trơn tru không?
