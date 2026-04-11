# Khantix - Chiến dịch đặt câu hỏi (Interview Strategy)
_last updated: 2026-03-28_
_methodology: First Principle Protocol (FP2 -> FP0)_

## 0. KIỂM TRA FRAME (FP2)
- **Tình huống:** Để AI đóng vai Pre-sales, cần dịch từ "Tham số kỹ thuật" (Goal) sang "Câu hỏi nghiệp vụ" (User Story).
- **Câu hỏi đặt ra:** Cho Gemini API toàn quyền tự biên tự diễn câu hỏi có khả thi không? Hay phải dùng bộ câu hỏi code cứng (Hard-coded)? Vậy ta thực sự cần gì?
- **Nhận định Frame:** Bạn đang bị kẹt giữa 2 thái cực: **Tự do tuyệt đối** (LLM Hallucination/Hỏi lan man) và **Kiểm soát tuyệt đối** (Rule-based Chatbot/Cứng nhắc). Cả hai đều sẽ thất bại trong môi trường B2B phức tạp.
- **Neo (Anchor):** Khái niệm này trong thiết kế Hệ thống AI (AI Agentic Design) được gọi là **Slot-Filling Dialogue System (Hệ thống hội thoại lấp đầy rổ)** kết hợp với **Heuristic Mapping (Ánh xạ kinh nghiệm)**.

---

## 1. PHÂN RÃ (FP0 - Boil down)

### A. Tại sao "Toàn quyền cho LLM tự học/tự nghĩ" là KHÔNG khả thi?
- **Q: Bản chất của LLM (như Gemini/GPT) là gì?**
  - Là một cỗ máy dự đoán từ tiếp theo (Next-token predictor) dựa trên xác suất, nó **mù tịt về chiến lược kinh doanh B2B** nếu không được rào.
- **Q: Nếu giao toàn quyền Goal cho nó (VD: "Mày hãy hỏi để tìm ra Risk Data"), nó sẽ làm gì?**
  - Nó sẽ chọn con đường ngắn nhất và lười biếng nhất: Đi hỏi thẳng kỹ thuật. VD: *"Dữ liệu của anh có bị nhiễu không? Anh dùng hệ quản trị CSDL gì?"*. Điều này phá nát trải nghiệm "Non-technical" mà bạn muốn xây dựng, làm khách hàng hoảng sợ.
- **Q: Tại sao nó hỏi lan man?**
  - Vì nó không có "Tầm nhìn đường ống" (Pipeline Vision). Khách lỡ miệng kể chuyện đời tư, nó sẽ hùa theo kể chuyện thay vì kéo khách lại đúng trọng tâm chốt sale.

### B. Tại sao "Bộ câu hỏi có sẵn" (Hard-coded) lại cồng kềnh và thất bại?
- **Q: Tại sao không thể chuẩn bị sẵn mọi câu hỏi?**
  - Vì "Ngữ cảnh Cụ thể" (Context) của thế giới kinh doanh là vô cực.
- **Q: Khác biệt ngữ cảnh tác động thế nào?**
  - Để tìm biến số `Integration_Risk`.
  - Với ngành Bệnh viện: Phải hỏi về hệ thống HIS/LIS (Hồ sơ y tế).
  - Với ngành Bất động sản: Phải hỏi về luồng duyệt bảng hàng CĐT.
  - $\rightarrow$ Một cây quyết định (Decision Tree) tĩnh sẽ phình to ra hàng triệu nhánh và cháy hệ thống ngay từ lúc setup.

### C. Vậy cái ta THỰC SỰ CẦN là gì?
- **Q: Làm sao để vừa linh hoạt (như LLM) mà không ngu ngốc (như chatbot tĩnh)?**
  - Ta cần chuyển giao tư duy chứ không chuyển giao câu hỏi. Ta cần cung cấp cho AI một **BỘ XƯƠNG SỐNG (Guardrails Prompting)**.
- **Q: Bộ Xương Sống đó chứa những gì? (Bản chất hệ thống lai)**
  Nó chỉ chứa 3 thành tố:
  1. **Trạng thái đích (The Slot / Goal):** Khai báo biến số cần tìm (VD: Tìm `Tech_Literacy_Risk`).
  2. **Persona Rào Cản (The Guardrail):** Cấm AI dùng từ kỹ thuật. Ép AI đóng vai "Chuyên gia quy trình nhân sự".
  3. **Từ điển Dịch thuật Nghịch (Heuristic Mapping):** Cung cấp các "Triệu chứng" (Symptoms) để AI tự đối chiếu.
     - *Triệu chứng 1:* Khách than phiền nhân viên già, quên pass $\rightarrow$ Kết luận: `Tech_Risk = High`.
     - *Triệu chứng 2:* Khách kể đa số nhân sự là GenZ, thích Tiktok $\rightarrow$ Kết luận: `Tech_Risk = Low`.

$\rightarrow$ **Việc của AI:** Tự dùng ngôn ngữ đời thường tùy theo ngữ cảnh của khách (Bệnh viện hay BĐS) khơi gợi mồi để khách "bật ra" các Triệu chứng. Khi Triệu chứng xuất hiện $\rightarrow$ AI âm thầm nhét vào biến số Toán học ở Lớp 2.

---

## 2. XÁC NHẬN NGUYÊN LÝ KHỞI NGUYÊN (First Principle)
> **Nguyên lý Tự Do Có Khung (Constrained Generation):**
> "Để một hệ thống AI giao tiếp khôn ngoan như con người, ta không cung cấp cho nó kịch bản lời thoại (Static Script), cũng không thả rông vô luật lệ (Zero-shot Freeform). Chân lý nằm ở việc **Khóa chặt Mục tiêu cuối cùng (Slot)** và **Nguyên tắc đánh giá rủi ro (Heuristic)**, nhưng hoàn toàn **Giải phóng Ngôn ngữ Diễn đạt (Generation).** AI là diễn viên, ta là Đạo diễn: không mớm từng từ, chỉ giao tâm lý nhân vật và kịch bản gốc."

---

## 3. GỢI Ý HƯỚNG ĐI TIẾP THEO THEO DÒNG CHẢY HỆ THỐNG
- Khung (Frame) đã được xác nhận: Ta cần một "Heuristic Mapping" (Từ điển Triệu chứng). Vậy cấu trúc của 1 Prompt mồi cho Gemini API nên được viết theo cú pháp (JSON/XML) như thế nào để truyền tải được cái "Từ điển" này một cách ít tốn Token và không bị Hallucination nhất?
