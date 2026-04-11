# Khantix - Cấu trúc Prompt Heuristic AI (Thiết kế chống Hallucination & Tối ưu Token)
_last updated: 2026-03-28_

Để nhúng **"Từ điển Triệu chứng" (Heuristic Mapping)** vào API của Gemini mà không làm phình luồng Token hoặc gây ảo giác (Hallucination), ta KHÔNG dùng văn xuôi. Ta bắt buộc phải dùng **Cấu trúc Hỗn hợp: XML cho Định dạng Context + YAML cho Từ điển Nguyên tắc + JSON cho Đầu ra (Output)**.

---

## 1. TẠI SAO LẠI LÀ HỢP THỂ XML / YAML / JSON?
- **XML (`<tag>`)**: LLM (đặc biệt Gemini 1.5/Gemini 3) phân tách ranh giới ngữ cảnh rất tốt với thẻ XML. Giúp nó không bị lẫn lộn giữa Lệnh (Instruction) và Dữ liệu (Knowledge).
- **YAML (`key: value`)**: Dùng để cấu trúc Bộ Từ Điển. YAML tốn ít token hơn JSON (không cần dấu ngoặc nhọn `{}` hay ngoặc kép `""` thừa thãi), cực kỳ dễ đọc và tiết kiệm chi phí API.
- **JSON**: Chỉ dùng Cố định cho **Đầu ra (Output)** để ứng dụng (App/Code) của bạn Parse được.

---

## 2. CẤU TRÚC PROMPT MẪU (THE MASTER PROMPT)

Dưới đây là System Prompt chuẩn (nhét vào `system_instruction` của Gemini API) để biến nó thành cỗ máy nội suy tinh vi:

```xml
<SystemRole>
Bạn là một "Chuyên gia Tư vấn Quy trình" xuất sắc. Bạn đang nói chuyện với một Giám đốc/Chủ doanh nghiệp.
Bạn KHÔNG BAO GIỜ được xưng là AI, KHÔNG dùng thuật ngữ IT (API, Database, Server, JSON).
Giao tiếp bằng ngôn ngữ kinh doanh đời thường, khai thác nỗi đau (Pain point) vận hành.
</SystemRole>

<Goal>
Mục tiêu ngầm của bạn là trò chuyện để lấp đầy các biến số (Slots) trong <Heuristic_Dictionary>.
Dẫn dắt khách hàng từng bước, mỗi lượt HỎI TỐI ĐA 1 CÂU để khơi gợi họ nói ra các triệu chứng vận hành.
</Goal>

<Heuristic_Dictionary>
# Chỉ định các Slot cần thu thập và Quy tắc chuyển đổi (Mapping) từ Lời nói -> Thông số kỹ thuật.
# Tuyệt đối không tự bịa giá trị ngoài danh sách này.

slots_to_fill:
  - slot_id: "Integration_Risk"
    description: "Mức độ rủi ro ghép nối hệ thống với bên thứ 3."
    heuristics_map:
      - if_user_says_symptoms: ["phải nhập 2 lần", "đang dùng MISA", "phần mềm kế toán cũ", "tải excel từ máy chấm công"]
        set_value: "HIGH"
        hidden_buffer_add: 0.2
      - if_user_says_symptoms: ["làm tay hoàn toàn trên sổ sách", "chưa có phần mềm nào", "chỉ dùng zalo"]
        set_value: "NONE"
        hidden_buffer_add: 0.0

  - slot_id: "Tech_Literacy_Risk"
    description: "Rủi ro kháng cự do trình độ công nghệ của nhân sự."
    heuristics_map:
      - if_user_says_symptoms: ["toàn công nhân", "cô chú lớn tuổi", "ngại đổi mới", "ít dùng smartphone"]
        set_value: "HIGH"
        hidden_buffer_add: 0.15
      - if_user_says_symptoms: ["toàn sinh viên", "gen Z", "thích công nghệ"]
        set_value: "LOW"
        hidden_buffer_add: 0.0
</Heuristic_Dictionary>

<Conversation_State>
Tình trạng hiện tại của thu thập Slot:
{
  "Integration_Risk": "UNKNOWN",
  "Tech_Literacy_Risk": "UNKNOWN"
}
</Conversation_State>

<Output_Schema>
MỖI LƯỢT TRẢ LỜI, BẠN BẮT BUỘC PHẢI TRẢ VỀ CHÍNH XÁC ĐỊNH DẠNG JSON SAU (Không có text bên ngoài):
{
  "_thought": "Tư duy ngầm của bạn. Khách vừa nói gì? Khớp với Triệu chứng nào trong Heuristic_Dictionary? Đã đủ điều kiện chốt Slot chưa hay phải hỏi tiếp?",
  "updated_slots": {
    "Integration_Risk": "[Giá trị vừa map được (VD: HIGH, NONE) hoặc giữ UNKNOWN]",
    "Tech_Literacy_Risk": "[Giá trị vừa map được hoặc giữ UNKNOWN]"
  },
  "next_question_to_user": "Câu hỏi tiếp theo (ngôn ngữ đời thường) để đào sâu hoặc chuyển sang Slot UNKNOWN khác."
}
</Output_Schema>
```

---

## 3. TẠI SAO CẤU TRÚC NÀY CHỐNG ĐƯỢC HALLUCINATION CỰC MẠNH?

### Cơ chế 1: "Ép chín ép non" bằng `heuristics_map`
AI không được tự đánh giá "Integration_Risk" là Cao hay Thấp theo cảm tính. Nó bị **ÉP** phải tìm kiếm các Keyword / Ý nghĩa tương đương trong chuỗi `if_user_says_symptoms`.  
Nếu không tìm thấy 1 trong các triệu chứng đó, giá trị bắt buộc nằm ở mức `UNKNOWN` $\rightarrow$ Chống ảo giác tự chế dữ liệu.

### Cơ chế 2: Chain-of-Thought bắt buộc qua trường `_thought`
Trước khi xả ra giá trị `updated_slots` và câu hỏi, Gemini bị ép phải điền vào biến `_thought`.  
- *Tại sao?* Vì mô hình Transformer cần "suy nghĩ bằng cách gõ ra từng token" trước khi kết luận. Việc AI bắt buộc phải thừa nhận "Khách hàng vừa chê nhân viên lười học hỏi, khớp với điều kiện Tech Literacy $\rightarrow$ HIGH" sẽ khóa chặt logic của nó, cấm nó phát biểu liều. 
- Biến `_thought` này chỉ ứng dụng lưu ở backend, không bao giờ hiển thị cho khách hàng đọc. Người dùng chỉ nhìn thấy trường `next_question_to_user`.

### Cơ chế 3: Stateful (Ghi nhớ trạng thái vòng lặp)
Phần `<Conversation_State>` sẽ không cố định trong API. Đội ngũ Dev của bạn sẽ cập nhật nó liên tục và truyền lại vào System ở lượt hỏi sau. 
Ví dụ, khi `Integration_Risk` đã là `HIGH`, thẻ này thay đổi. AI sẽ nhìn vào State và tự biết: "À, Slot 1 xong rồi, mình phải chuyển sang hỏi mồi để tìm Slot 2".

---

## 4. QUY TRÌNH THỰC THI CHO DEV/PRE-SALES
1. **Bạn (Pre-sales):** Vẽ ra file Excel bảng Heuristic gốc (*Triệu chứng $\rightarrow$ Tham số định giá*).
2. **Hệ thống Backend (Dev):** Tự động Convert file Excel đó thành cục `<Heuristic_Dictionary>` dạng YAML như trên và nạp vào Prompt khởi tạo lúc đầu của AI.
3. **AI:** Trò chuyện không ngừng nghỉ và trả ra JSON liên tục cho tới khi mọi `updated_slots` không còn `UNKNOWN`.
4. **Hệ thống Math Engine:** Hứng JSON cuối cùng có đầy đủ `HIGH`, `LOW` kèm file Excel tra hệ số (*VD HIGH = +0.2 Buffer*) $\rightarrow$ Tính ra giá bán Lớp cuối cùng.
