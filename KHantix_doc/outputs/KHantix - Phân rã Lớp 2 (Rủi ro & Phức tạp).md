# Khantix - Phân rã Lớp 2: Rủi ro & Phức tạp (Risk & Complexity)
_last updated: 2026-03-28_
_methodology: First Principle Protocol (FP2 -> FP0)_

## 0. KIỂM TRA FRAME (FP2)
- **Tuyên bố:** $Effort_{Adjusted} = ManDays \times (1 + \sum Risk_{Factors})$
- **Neo (Anchor):** Hệ số $\sum Risk_{Factors}$ trong Kỹ thuật mềm và Kinh tế học hành vi được gọi là **Độ bất định của thông tin (Information Asymmetry)** và **Phí tổn của sự thích nghi (Cost of Change/Adaptation)**. 
- Mọi dự án CNTT đều thất bại hoặc lố ngân sách vì ước lượng dựa trên môi trường chân không, bỏ qua sự kháng cự của dữ liệu, hệ thống cũ, và thói quen con người.

---

## 1. PHÂN RÃ (FP0 - Boil down)

### A. Nhóm Biến số: Rủi ro Dữ liệu (Data Risk)
- **Q: Bản chất của Data Risk là gì?**
  - Là chi phí thời gian trả cho việc làm sạch những "căn bệnh" tích tụ nhiều năm của doanh nghiệp. Nó là khoảng cách giữa "Dữ liệu rác" và "Dữ liệu có cấu trúc".
- **Q: Nguồn gốc của rủi ro này từ đâu?**
  - Từ sự lỏng lẻo trong quy trình cũ (Viết tay, File Excel tự do, không có hệ thống validate khi nhân viên nhập liệu).
- **Q: Các tham số con nào ảnh hưởng?**
  - **Data Format:** (PDF/Hình ảnh cào ra text đắt hơn File Excel, File Excel đắt hơn CSV chuẩn hóa).
  - **Data Volume:** Dữ liệu kéo dài bao nhiêu năm? 
  - **Data Integrity (Độ sạch):** Thiếu trường (field), trùng tên, sai chính tả (vd: HN, Hà Nội, ha noi).
- **Q: Pre-sales có cần hiểu tham số này không?**
  - **CÓ, VÔ CÙNG CẦN THIẾT.** Pre-sales không cần code đoạn làm sạch, nhưng phải hỏi: *"Anh lưu dữ liệu cũ ở phần mềm kế toán cũ nào hay lưu Excel tự do?"* $\rightarrow$ Nếu Excel tự do, Pre-sales (hoặc AI) tự động đắp thêm **30% ManDays (Data Cleansing Buffer)**. Nếu không, team Dev sẽ sập nguồn vì chạy dọn rác cho khách.

### B. Nhóm Biến số: Rủi ro Tích hợp (Integration Risk)
- **Q: Tích hợp rủi ro vì sao? Nó thực chất là gì?**
  - Tích hợp thực chất là ép 2 "bộ máy" khác nhà sản xuất, khác ngôn ngữ lập trình phải "nói chuyện" với nhau. Rủi ro là sự **mù mờ tài liệu (Documentation Blindness)** và **khước từ hợp tác của bên thứ ba**.
- **Q: Yếu tố nào làm tăng/giảm sự mù mờ này?**
  - **Khả năng cung cấp API (API Availability):** Hệ thống kia có mở API không? Mở chuẩn REST/GraphQL hay chuẩn SOAP cổ đại?
  - **Sự phối hợp của Vendor cũ:** Nếu phần mềm kế toán MISA của khách không cho phép mở cổng ngoại trừ khi khách trả thêm tiền $\rightarrow$ Dự án bị kẹt dài hạn. Đội Dev ngồi chơi chờ $\rightarrow$ chi phí vẫn chảy.
- **Q: Tính ứng dụng cho Pre-sales AI:**
  - AI phải chọc đúng câu hỏi: *"Anh muốn phần mềm mới này chạy độc lập hay nhất định phải kết nối để kéo số dư kế toán từ hệ thống cũ sang?"* $\rightarrow$ Lòi ra rủi ro $\rightarrow$ Đắp **20% Integration Buffer**.

### C. Nhóm Biến số: Niềm tin và Thói quen (Tech Literacy Risk)
- **Q: Rủi ro này cấu thành từ đâu? Bản chất là gì?**
  - Nó là **Chi phí Đào tạo (Transfer Cost)** và **Tỉ lệ chống đối (Resistance Rate)**. 
- **Q: Tham số con:**
  - Độ tuổi trung bình của end-user.
  - Tần suất đổi mới tổ chức. Họ đã từng dùng phần mềm chưa hay đây là lần đầu số hóa?
- **Q: Tại sao phải tính vào đây?**
  - Nếu đối tượng là công nhân nhà máy lớn tuổi, khi release app, team Dev & BA sẽ nhận về hàng rổ bug "không phải là bug" mà là "tôi không biết ấn nút này". Quá trình support này kéo dài ManDays. $\rightarrow$ Cần **10-15% Training/Support Buffer**.

---

## 2. XÁC NHẬN NGUYÊN LÝ KHỞI NGUYÊN (First Principle)
> **Nguyên lý Ma sát Chuyển đổi (Friction of Change):**
> "Không có phần mềm nào cắm vào là chạy (plug-and-play) trong môi trường doanh nghiệp. Mức độ 'ma sát' được quyết định bởi tỷ lệ nghịch giữa **Sự lộn xộn của thế giới vật lý** (dữ liệu rác, hệ thống cùi, thói quen cũ) và **Tính logic tuyệt đối** của mã code. Rủi ro (Buffer) chính là giá tiền bằng thời gian phải trả để mài mòn sự ma sát đó."

---

## 3. GỢI Ý ĐÀO SÂU TIẾP THEO
- Chúng ta đã tính toán hoàn hảo Giá vốn (Cost) và dự phòng Rủi ro (Buffer) để có *Lợi nhuận gộp bằng Zero*. Vậy cái "Lợi nhuận" (Margin) và giá trị Thương hiệu được sinh ra như thế nào ở phía khách hàng? $\rightarrow$ *Chuyển sang Lớp 3 (Commercial).*
