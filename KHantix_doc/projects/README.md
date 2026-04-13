Triển khai Hệ thống AI Recommendation Price For Pre-sales (Dành cho Dev Team)


---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG
Hệ thống gồm 3 tầng (Tương ứng với 3 Lớp công thức):

*   **Tầng 1: The Investigator (Bot LLM)**
    *   *Nhiệm vụ:* Trò chuyện với khách hàng bằng ngôn ngữ đời thường. Đi tìm các "Triệu chứng" kỹ thuật ẩn giấu.
    *   *Kỹ thuật triển khai:* Gọi Gemini/ChatGPT API kèm `<System Role>` và `<Heuristic_Dictionary>`.
*   **Tầng 2: The Inferencer (Trình nội suy JSON)**
    *   *Nhiệm vụ:* Bắt LLM trả về các Slot (Mức độ Rủi ro, Quy mô) t heo định dạng JSON cố định.
    *   *Kỹ thuật triển khai:* Regex/JSON Parse từ phản hồi của LLM sau mỗi lượt chat.
*   **Tầng 3: The Calculator (Máy tính Back-end)**
    *   *Nhiệm vụ:* Hứng file JSON từ Tầng 2, trộn với `internal_configs.csv` (Tham số công ty) và đẩy vào 3 Lớp Công thức để sinh ra Báo giá cuối cùng.

---

## 2. THỨ TỰ ĐỌC TÀI LIỆU KHUYẾN NGHỊ (LUỒNG NHẬN THỨC)
 tuyệt đối không đọc dàn trải. Hãy đọc theo thứ tự sau để hiểu rõ tại sao ta phải code như vậy:

### 📖 GIAI ĐOẠN 1: TƯ DUY TOÁN HỌC (Nhân sự Back-end đọc kỹ)
Đây là móng của ngôi nhà. Bắt buộc Back-end phải code được hàm tính giá dựa trên 3 file này.
1.  **`KHantix - Phân rã tham số định giá (FP0).md`**: Cái nhìn tổng quan về 3 lớp công thức mà hệ thống dùng.
2.  **`KHantix - Phân rã Lớp 1 (Base Cost).md`**: Cách tính Giá vốn sàn cứng (Nhóm tham số Server, Lương Dev).
3.  **`KHantix - Phân rã Lớp 2 (Rủi ro & Phức tạp).md`**: Cách hệ thống dội Buffer (Hệ số phạt) từ 10-30% vào thời gian làm do dữ liệu của khách quá nát.
4.  **`KHantix - Phân rã Lớp 3 (Thương mại).md`**: Cách hệ thống bóp/nhả Margin và chiết khấu để win deal.

### 📖 GIAI ĐOẠN 2: THIẾT LẬP DATA BASE (Nhân sự Database/DA đọc kỹ)
Khởi tạo cấu trúc bảng từ các file sau:
5.  **`KHantix - Từ điển tham số định giá.md`**: File Data Dictionary, liệt kê mọi kiểu dữ liệu (Data Type) để tạo Schema Database hứng JSON.
6.  **`internal_configs.csv`**: File gốc, chứa các hằng số không đổi của công ty (VD: Lương Senior, Lãi suất kì vọng). Load thẳng vào DB làm Constant.
7.  **`KHantix - Thiết lập Tham số và Xây dựng Heuristic (FP0).md`**: Đọc để hiểu lý do tại sao tuyệt đối cấm con Bot đi hỏi Công ty mấy cái tham số bên trên.

### 📖 GIAI ĐOẠN 3: KIẾN TRÚC PROMPT AI (Nhân sự Prompt Eng / AI Integration đọc kỹ)
Đây là lõi của sự thành bại. Cách để anh em "nhốt" con LLM lại không cho nó nói bậy.
8.  **`KHantix - Chiến dịch đặt câu hỏi (Interview Strategy).md`**: Chiến lược "dịch thuật nghịch" từ ngôn ngữ dân dã $\rightarrow$ Keyword kỹ thuật.
9.  **`heuristic_matrix.csv`**: Chứa toàn bộ "Từ điển Triệu chứng" (VD: Khách nói "Anh dùng Zalo" $\rightarrow$ `Risk: HIGH`).
10. **`KHantix - Cấu trúc Prompt Heuristic AI.md`**: **FILE QUAN TRỌNG NHẤT DÀNH CHO DEVS AI.** File này định nghĩa cấu trúc XML + YAML + JSON để anh em đưa cái `heuristic_matrix.csv` vào trong System Instruction của Gemini.


---

## 3. CHECKLIST ACTION CHO TEAM DEV
- [ ] **DB Admin:** Ánh xạ các tham số từ "Từ điển tham số" thành cấu trúc DB. Load biến tĩnh (internal configs).
- [ ] **Backend (Core):** Implement 3 hàm tính toán Lớp 1, 2, 3 dựa trên các biến truyền vào.
- [ ] **Backend (AI):** Dựng pipeline nhận input của user, truyền kèm theo State (các Slot đã biết/chưa biết) cùng Heuristic Matrix (chuyển nhẹ từ CSV -> YAML) gửi lên LLM API theo chuẩn từ file "Cấu trúc Prompt Heuristic AI.md".
- [ ] **Backend (Parse):** Bắt phản hồi JSON của hệ thống LLM, lấy giá trị biến `updated_slots`, cập nhật database Session, và return câu hỏi trong field `next_question_to_user` ra giao diện Chat.

