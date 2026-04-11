# Khantix - Phân rã Lớp 1: Giá vốn cứng (Base Cost)
_last updated: 2026-03-28_
_methodology: First Principle Protocol (FP0)_

## 0. NHẬN ĐỊNH
Tuyên bố: "Công thức $Cost_{Base} = (License + Hardware) + (ManDays \times Rate_{Burdened})$ là mức giá sàn bất khả xâm phạm. Bán dưới giá này là công ty chảy máu."
**Đúng.** Đây là chân lý của Kế toán Quản trị. Nó đại diện cho dòng tiền thực tế chảy ra khỏi công ty.

---

## 1. PHÂN RÃ (Boil down)

### A. Nhóm Biến số: Vật tư (Hard Cost - License & Hardware)
- **Q: Bản chất của License & Hardware là gì?**
  - Là tiền phải trả cho bên thứ 3 (Amazon AWS, Google, Microsoft, hãng phần mềm gốc) để duy trì sự hoạt động căn bản của hệ thống.
- **Q: Nguồn gốc của các chi phí này từ đâu?**
  - Từ giới hạn vật lý của năng lượng/máy móc (Hardware/Server) và quyền sở hữu trí tuệ đã được đóng gói của người khác (License API).
- **Q: Tại sao Pre-sales phải quan tâm?**
  - Vì khách hàng thường ẩn đi số lượng User thực tế hoặc khối lượng giao dịch. Nếu Pre-sales không khai thác (Sizing/Tiering) chính xác, khách hàng dùng vượt mức $\rightarrow$ công ty phải lấy tiền túi bù vào Hard Cost. Pre-sales cần biết để tìm đúng "Khung giá" (Tier) rẻ nhất cho khách.

### B. Nhóm Biến số: Sức người (Soft Cost - ManDays & Rate)
- **Q: Bản chất của ManDays là gì?**
  - Là thời gian của con người (đơn vị hữu hạn duy nhất không thể tạo ra thêm). Nó bị ảnh hưởng bởi Scope (Phạm vi tính năng) và Reuse Factor (Tỷ lệ module có sẵn, copy-paste được).
- **Q: $Rate_{Burdened}$ thực chất là gì? Tại sao không dùng Lương Dev?**
  - Rate thực chất là "Chi phí để duy trì sự tồn tại của một vị trí làm việc".
  - Nếu chỉ dùng Lương Net $\rightarrow$ Sai. Một Dev ngồi code tốn thêm tiền điện, bảo hiểm, máy tính, tiền thuê nhân sự HR quản lý họ. Rate Burdened là tỷ lệ đã gánh (Overhead Allocation) các chi phí ẩn này.
- **Q: Các tham số con nào ảnh hưởng đến $Rate_{Burdened}$?**
  - **Resource Mix:** Đội hình toàn Senior thì Rate trung bình cao (làm nhanh nhưng đắt). Trộn Junior vào thì Rate giảm.
  - **Location:** Làm ở văn phòng khách hàng (Onsite) đắt hơn làm tại nhà (Remote).
- **Q: Pre-sales có cần hiểu tham số này không?**
  - **CÓ (để tùy chỉnh), KHÔNG (để thắc mắc).** Pre-sales không cần biết tại sao 1 giờ ông Dev đáng giá $50 (việc của HR/Kế toán). Nhưng Pre-sales PHẢI biết cách thay đổi "Hệ số pha trộn" (Mix Senior/Junior) để ép giá thành xuống khi khách hàng kêu đắt mà không phải cắt giảm lợi nhuận.

---

## 2. XÁC NHẬN NGUYÊN LÝ KHỞI NGUYÊN (First Principle)
> **Nguyên lý Giá Vốn Hữu Hạn:** 
> "Mọi sản phẩm phần mềm dù vô hình thì đều được tạo ra bởi nguồn lực hữu hạn (năng lượng server và thời gian sống của lập trình viên). Base Cost chính là quy đổi tài chính thuần túy của sự hao hụt các nguồn lực vật lý đó. Bán dưới Base Cost không phải là kinh doanh, mà là làm từ thiện."

---

## 3. GỢI Ý ĐÀO SÂU TIẾP THEO
- Tham số ManDays ở trên được tính dựa trên giả định mọi thứ "Suôn sẻ". Tại sao thực tế không bao giờ suôn sẻ? Điều gì tạo ra sự xê dịch của số ManDays này? $\rightarrow$ *Mở file Phân rã Lớp 2 (Rủi ro).*
