# KHantix: AI Pricing Recommendation System - Toàn văn tóm tắt dự án

## I. TỔNG QUAN TRIẾT LÝ (THE PHILOSOPHY)

Dự án KHantix được xây dựng dựa trên sự thấu hiểu sâu sắc về vận hành B2B IT, giải quyết mâu thuẫn giữa Sales và Pre-sales thông qua việc định lượng hóa sự rủi ro.

### 1. Phân vai thực tế
- **PM (Post-sales):** Đội trưởng thi công, quản trị việc thực hiện dự án.
- **Pre-sales (Pre-sales):** Kiến trúc sư, định giá sự bất định và thiết kế giải pháp.
- **Vấn đề:** Hiện tại Pre-sales thường "đoán bừa" (Guesswork), dẫn đến báo giá quá thấp làm dự án bị lỗ giờ công (Overrun).

### 2. Bản chất của Định giá B2B
- **Giá sàn (Floor Price):** Do Pre-sales tính dựa trên định mức kỹ thuật + Rủi ro.
- **Giá trần (Target Price):** Do Sales/Khách hàng kỳ vọng dựa trên ngân sách và giá trị cảm nhận.
- **AI CPQ:** Đóng vai trò là cầu nối mô phỏng thời gian thực (Real-time Simulation) để tìm ra điểm cân bằng giữa Ngân sách và Năng lực kỹ thuật.

---

## II. KIẾN TRÚC HỆ THỐNG 3 TẦNG (3-TIER ARCHITECTURE)

Để hệ thống hoạt động chính xác và không bị "ảo giác" (hallucination) về con số, cấu trúc được chia làm 3 lớp riêng biệt:

### 1. Tầng 1: The Investigator (LLM Bot)
- **Công cụ:** Gemini/GPT-4 + Heuristic Matrix.
- **Nhiệm vụ:** Trò chuyện với khách hàng để tìm "Triệu chứng rủi ro" thay vì hỏi trực tiếp giá tiền. Sử dụng kỹ thuật **Anchoring (Mỏ neo)** để thăm dò ngân sách.
- **Phương pháp:** Dùng "Interview Strategy" để dịch từ ngôn ngữ dân dã sang Keyword kỹ thuật.

### 2. Tầng 2: The Inferencer (JSON Extractor)
- **Nhiệm vụ:** Trích xuất các biến số định giá (Slots) từ cuộc hội thoại thành định dạng dữ liệu có cấu trúc (Structured Data).
- **Kết quả:** Trả về mức độ rủi ro (Risk Level) và quy mô dự án (Scale) dưới dạng JSON.

### 3. Tầng 3: The Calculator (Mathematical Engine)
- **Nhiệm vụ:** Tính toán con số tàn nhẫn dựa trên dữ liệu từ Tầng 2 và bộ tham số nội bộ (`internal_configs.csv`).
- **Lưu ý:** Tuyệt đối không để LLM làm tính; toán học phải được xử lý bởi code Backend truyền thống.

---

## III. MÔ HÌNH TOÁN HỌC 3 LỚP (PRICING LAYERS)

Phần mềm sẽ tính toán giá theo thứ tự cộng dồn logic:

1.  **Lớp 1: Base Cost (Giá sàn cứng)**
    - Tính theo Man-day x Lương nhân sự + Chi phí Server/License.
2.  **Lớp 2: Risk & Complexity (Hệ số rủi ro)**
    - Dựa trên mô hình **SIMT** (Setup, Integration, Migration, Training).
    - Nếu dữ liệu khách hàng "nát" hoặc hệ thống cũ phức tạp, áp dụng Multiplier (x1.2 - x1.5).
3.  **Lớp 3: Commercial Strategy (Chiến lược thương mại)**
    - Áp dụng Margin tùy theo DNA công ty:
        - **Hunter (Săn bắn):** Thu tiền CAPEX cao ngay từ đầu.
        - **Farmer (Nuôi trồng):** Miễn phí triển khai, thu tiền Subcription (OPEX) dài hạn.

---

## IV. LỘ TRÌNH TRIỂI KHAI (ROADMAP)

### Giai đoạn 1: Thiết lập nền móng (Back-end)
- Xây dựng DB Schema dựa trên "Từ điển tham số định giá".
- Implement logic toán học cho 3 lớp công thức tính giá.
- Nạp bộ tham số tĩnh từ `internal_configs.csv`.

### Giai đoạn 2: Trí tuệ hóa (AI & Prompting)
- Xây dựng Heuristic Matrix (Từ điển triệu chứng rủi ro).
- Thiết kế System Instruction cho LLM để thực hiện "Interviewer Role".
- Code module Parser để trích xuất JSON từ phản hồi của AI.

### Giai đoạn 3: Tối ưu hóa & Preview
- Tạo tính năng **Target Costing (Định giá ngược)**: Nhập giá khách muốn -> Hệ thống tự cắt tỉa tính năng.
- Xuất báo cáo báo giá tự động với 3 gói: Basic - Standard - Premium.

## V. CÁC TÀI LIỆU THAM CHIẾU QUAN TRỌNG
1.  `internal_configs.csv`: Tham số "máu" của công ty.
2.  `heuristic_matrix.csv`: Bộ não đánh giá rủi ro của AI.
3.  `KHantix - Cấu trúc Prompt Heuristic AI.md`: Cẩm nang Prompt Engineering.
4.  `KHantix - Phân rã tham số định giá (FP0).md`: Chi tiết công thức toán học.

