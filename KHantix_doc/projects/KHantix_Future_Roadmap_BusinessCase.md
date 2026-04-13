# Khantix - Business Case & Dự phóng Chiến lược (Post-Bootcamp Roadmap)
_last updated: 2026-04-13_
_author: Khantix Founder Team_

---

## 1. TỔNG QUAN CHIẾN LƯỢC KINH DOANH (Business Case)

Khantix không chỉ là một công cụ tính giá; đây là **Hệ thống Quản trị Tri thức Định giá (Pricing Intelligence)**. 

### Bài toán thị trường:
Các công ty Outsourcing/SaaS B2B thường xuyên gặp 3 vấn đề:
1. **Estimate sai:** Lỗ do không tính hết rủi ro dữ liệu/tích hợp.
2. **Sales đắt, Tech kêu:** Thiếu tiếng nói chung về mặt con số giữa kinh doanh và kỹ thuật.
3. **Data Leakage:** Sợ lộ bí mật báo giá khi dùng các công cụ tính toán online.

### Giải pháp MVP (Hiện tại):
Hybrid AI sử dụng Gemini API kết hợp Math Engine chuẩn COCOMO để tạo ra báo giá minh bạch, có bằng chứng (Evidence) trong vòng 5 phút trò chuyện.

---

## 2. LỘ TRÌNH PHÁT TRIỂN HẬU BOOTCAMP (Post-Bootcamp Roadmap)

Chúng tôi định hướng chuyển dịch từ một công cụ **API-Based** sang một hệ sinh thái **Private-AI** dành cho doanh nghiệp lớn.

### Giai đoạn 1: Tích lũy Vàng (Data Accumulation) — [Tháng 1 - Tháng 6]
- **Mục tiêu:** Sử dụng Gemini API để vận hành thực tế cho đội ngũ Pre-sales nội bộ/đối tác nhỏ.
- **Dữ liệu thu thập:** Mọi cuộc hội thoại + Kết quả sau cùng của dự án thực tế (Dự án có bị lố ManDays không? Nếu lố thì do chiều rủi ro nào?).
- **Output:** Bộ Dataset ~5,000 mẫu hội thoại chuẩn hóa (Input: Lời khách - Output: Effort Multipliers thực tế).

### Giai đoạn 2: Deep-tech Transformation (Fine-tuning & RAG) — [Tháng 6 - Tháng 12]
Đây là lúc Khantix tạo ra rào cản công nghệ (Moat) so với các đối thủ trên thị trường.

#### A. Fine-tuning Local LLM (Gemma/Llama + LoRA)
- **Hành động:** Sử dụng kỹ thuật Low-Rank Adaptation (LoRA) để huấn luyện mô hình Gemma-7B/8B chuyên biệt về tư vấn Pre-sales phần mềm.
- **Lợi ích:** AI không còn trả lời chung chung. Nó có "mùi" của chuyên gia trong ngành, bắt keyword chính xác tuyệt đối mà không cần dùng Model lớn đắt tiền.

#### B. RAG (Retrieval-Augmented Generation) cho Lịch sử Dự án
- **Hành động:** Sử dụng RAG để nhúng toàn bộ hồ sơ các dự án thắng/thua trong quá khứ của công ty vào AI.
- **Lợi ích:** Khi gặp một deal mới, AI có thể nhắc: *"Deal này giống hệ dự án XYZ năm 2023, hồi đó team đã bị lố 20% do rủi ro tích hợp với SAP. Đề xuất dội EM_I1 lên mức 1.25"*.

#### C. On-Premise Deployment (Bản Enterprise)
- **Hành động:** Đóng gói toàn bộ hệ thống (Local LLM + Database) vào Docker để cài đặt trực tiếp lên nội bộ Server khách hàng.
- **Giá trị kinh doanh:** Đây là "Killer Feature". Các tập đoàn lớn sẽ sẵn sàng chi trả mức phí License cực cao để có một AI Pricing Assistant không bao giờ gửi dữ liệu ra internet.

---

## 3. MÔ HÌNH DOANH THU (Revenue Model)

1. **Gói SaaS (Standard):** 
   - Đối tượng: Đại lý/Công ty phần mềm nhỏ.
   - Trả phí theo lượt Quote (Pay-per-token). Sử dụng API Gemini/Claude của Khantix.
   
2. **Gói Enterprise (Private AI):**
   - Đối tượng: Tập đoàn lớn, Ngân hàng, Công ty Outsourcing quy mô 500+ nhân sự.
   - Hình thức: Bán License bản quyền (One-time fee + Maintenance).
   - Triển khai Local LLM + Support Fine-tune riêng theo dữ liệu rủi ro đặc thù của chính khách hàng đó.

---

## 4. KẾT LUẬN

Việc lựa chọn kiến trúc Hybrid trong Bootcamp là bước đệm hoàn hảo. Nó cho phép ta bắt đầu nhanh bằng API (để validate market), nhưng giữ vững nền tảng Toán học vững chắc để sau này khi chuyển sang **Local LLM Fine-tuning**, hệ thống vẫn giữ được tính ổn định và bảo mật tuyệt đối cho doanh nghiệp.
