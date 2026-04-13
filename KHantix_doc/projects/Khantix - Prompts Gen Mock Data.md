# Khantix - Bộ 3 Prompts Khởi tạo Dữ liệu (Mock Data & Test Persona)
_last updated: 2026-03-28_

Dưới đây là 3 Prompts được thiết kế dạng **Chỉ thị Ràng buộc Toán học (Constraints-only)** dành riêng cho Claude (hoặc các AI có tính năng Code Interpreter/Advanced Data Analysis) để tự động sinh Data bằng Python và xuất ra file CSV.

Bạn copy từng cục Prompt dưới đây ném vào Claude để lấy file về.

---

## PROMPT 1: GEN MOCK DATA THAM SỐ NỘI BỘ (INTERNAL CONFIGS)

```markdown
**Mục tiêu:** Viết một script Python (dùng Pandas, Numpy) để tạo ra bảng dữ liệu Tham số Nội bộ (Internal Configs) của một công ty B2B Software Outsourcing/SaaS. Sau đó chạy lệnh và xuất trả file `internal_configs.csv`.

**Ràng buộc Dữ liệu (Constraints):**
Tôi đã có sẵn danh sách các tham số, bạn chỉ cần gán trị số/công thức sinh logic (Random nhưng hợp chuẩn ngành IT Việt Nam). File CSV phải có 3 cột: `Parameter_ID`, `Parameter_Name`, `Value`.

Dữ liệu bắt buộc phải có các dòng sau (bạn tự set value đúng định dạng):
1. Nhóm Target Margin:
   - `Margin_NetProfit`: (15% - 25%)
   - `Margin_RiskPremium`: (5% - 10%)
   - `Margin_Reinvestment`: (5% - 10%)
2. Nhóm Rate Card (Rate_Burdened_Per_Day) tính theo VND:
   - `Rate_Dev_Junior`: ~1.500.000
   - `Rate_Dev_Senior`: ~3.000.000
   - `Rate_PM`: ~3.500.000
   - `Rate_BA`: ~2.500.000
   - `Location_Onsite_Multiplier`: 1.3 (Hệ số nhân nếu làm tại VPCty khách)
3. Nhóm Thương mại (Comm & Discount):
   - `Comm_Partner_Max`: Lên tới 15%
   - `Discount_Full_Payment`: 5%
4. Nhóm Hardware/3rd Party Base:
   - `Server_Base_Cost_Per_1K_Users`: ~5.000.000 VND
   - `SMS_OTP_Rate`: 800 VND/SMS

**Yêu cầu Output:** Không giải thích xuông. Viết Python script, tự chạy code và đính kèm file CSV.
```

---

## PROMPT 2: GEN BẢNG HEURISTIC V2 (COCOMO EFFORT MULTIPLIERS)

```markdown
**Mục tiêu:** Viết script Python dùng Pandas để tạo file `heuristic_matrix_v2.csv`. File này là "Bảng Quy tắc Suy luận" (Heuristic Ruleset) để ánh xạ câu trả lời đời thường của khách hàng B2B → Effort Multiplier (EM) cho từng chiều rủi ro con. Hệ thống áp dụng mô hình COCOMO II Effort Multipliers — mỗi biến con là một hệ số nhân riêng biệt, KHÔNG gộp thành HIGH/LOW → % nữa. Xuất file CSV sau khi chạy.

**Tài liệu tham chiếu — Bảng Từ điển Tham số Định giá:**
Bạn PHẢI map đầy đủ tất cả các biến con (sub-parameter) từ bảng dưới đây vào CSV.

LỚP 2 — RỦI RO & PHỨC TẠP:
- Data Format (Enum: Excel/PDF/SQL) → EM_D1
- Data Volume (Number: năm / số dòng) → EM_D2
- Data Integrity (Boolean: sạch / rác) → EM_D3
- API Availability (Boolean: mở / đóng) → EM_I1
- Legacy System Age (Number: tuổi hệ thống) → EM_I2
- End-user Age (Range: tuổi trung bình nhân viên) → EM_T1
- Prior System Experience (Boolean: đã dùng app chưa) → EM_T2

LỚP 1 — GIÁ VỐN (bổ sung 2 EM mới):
- Deployment Location (Enum: Onsite/Remote) → EM_B1
- Hardware Dependency (Enum: SMS, Map, Scanner...) → EM_B2

LỚP 3 — THƯƠNG MẠI:
- Rush Factor (Boolean: gấp hay từ từ) → EM_C1
- Client Logo Size (Enum: Enterprise/SMB) → EM_C2
- Payment Term (Enum: trả đứt / trả góp) → EM_C3

**Ràng buộc Kiến trúc (Constraints):**

1. **Cấu trúc CSV PHẢI có các cột sau:**
   - `Row_ID`: Số thứ tự.
   - `EM_ID`: Mã Effort Multiplier (VD: EM_D1, EM_I1, EM_C1).
   - `EM_Name`: Tên đầy đủ bằng tiếng Anh.
   - `Dictionary_Param`: Tên tham số gốc trong Từ điển (VD: "Data Format", "API Availability").
   - `User_Symptom_Keywords`: Danh sách keyword mồi bằng tiếng Việt, format Python list string.
   - `EM_Default`: Giá trị EM mặc định (VD: 1.15). Đây là giá trị tham chiếu khi AI không tự ước lượng được.
   - `EM_Min`: Biên dưới cho phép (VD: 1.00). AI không được đề xuất thấp hơn.
   - `EM_Max`: Biên trên cho phép (VD: 1.20). AI không được đề xuất cao hơn.
   - `Reasoning_Hint`: Gợi ý lý do để AI viết Explanation (VD: "Excel cần ETL pipeline chuyển đổi format").

2. **Quy tắc Extremes Mapping cho mỗi EM_ID:**
   - Phải có ít nhất 2 dòng "Tốt nhất" (EM gần 1.0 — ít rủi ro) với keyword khác nhau.
   - Phải có ít nhất 2 dòng "Tệ nhất" (EM gần Max — rủi ro cao) với keyword khác nhau.
   - Phải có 1 dòng "Fallback" (keyword: "chưa biết", "hỏi lại IT") với EM_Default = giá trị trung bình ngành.

3. **Range EM cho từng nhóm (Guardrails):**
   - EM_D1 (Data Format):      Min=1.00, Max=1.20
   - EM_D2 (Data Volume):      Min=1.00, Max=1.25
   - EM_D3 (Data Integrity):   Min=1.00, Max=1.15
   - EM_I1 (API Availability): Min=1.00, Max=1.20
   - EM_I2 (Legacy System Age):Min=1.00, Max=1.15
   - EM_T1 (End-user Age):     Min=1.00, Max=1.15
   - EM_T2 (Prior System Exp): Min=1.00, Max=1.10
   - EM_B1 (Deployment Loc):   Min=1.00, Max=1.30
   - EM_B2 (HW Dependency):    Min=1.00, Max=1.15
   - EM_C1 (Rush Factor):      Min=1.00, Max=1.50
   - EM_C2 (Client Logo):      Min=0.80, Max=1.00
   - EM_C3 (Payment Term):     Discount 0% — 5% (không phải EM nhân, mà là % chiết khấu)

**Yêu cầu Output:** Viết script khởi tạo DataFrame với ít nhất 55-70 dòng (đảm bảo ít nhất 2 dòng tốt + 2 dòng tệ + 1 fallback cho mỗi EM). Keyword mồi phải thực tế, bằng tiếng Việt, viết dạng Python list string. Tự chạy Code Interpreter và cho tôi tải file CSV về.
```

---

## PROMPT 3: GEN AI PERSONA (KHÁCH HÀNG TEST CLIENT)

```markdown
**Mục tiêu (System Prompt):** Bạn là ông Hoàng, 48 tuổi, Giám đốc của hệ thống "Chuỗi Bán lẻ Vật tư Nông nghiệp ABC" (Có 15 cửa hàng ở miền Tây). Bạn đang nói chuyện với một tư vấn viên phần mềm (Pre-sales). Nhiệm vụ của bạn là trả lời các câu hỏi khảo sát của họ một cách RẤT THỰC TẾ, ĐỜI THƯỜNG và CỤC TÍNH đúng chất quản lý kiểu cũ.

**Ràng buộc Tính cách & Ngữ cảnh (Constraints):**
1. **Dữ liệu ngầm (Chỉ tiết lộ khi bị chọc trúng):**
   - Dữ liệu hiện tại: "Máy POS mỗi cửa hàng chạy phần mềm offline từ năm 2010. Cuối ngày chốt sổ kế toán xài Excel gom lại mệt bở hơi tai. Hay bị lệch kho." (Ánh xạ: Data_Risk rất Cao).
   - Tích hợp: "Rất ghét đổi phần mềm kế toán vì quen rồi, phần mềm mới phải tự chui vào máy kế toán mà hút số liệu." (Ánh xạ: Integration_Risk Cao).
   - Nhân sự: "Mấy ông coi kho toàn 50 tuổi, giờ bắt xài app đt khéo ổng đình công." (Ánh xạ: Tech_Literacy_Risk Tối đa).
   - Tài chính: "Tiền thì anh không thiếu, anh có thể trả thẳng 1 năm nhưng tụi em phải cam kết là tháng đầu chạy mượt." (Ánh xạ: Payment Discount).

2. **Cách phản hồi (Edge Cases):**
   - KHÔNG BAO GIỜ tự tuôn ra hết mọi vấn đề trong 1 câu. Hỏi gì đáp nấy, đáp rất ngắn.
   - Nếu tư vấn viên hỏi câu quá kỹ thuật ("Anh xài API chuẩn gì?"): Trả lời bức xúc: *"Anh chịu, chú hỏi gì khó hiểu thế, anh thuê em về để em làm chứ anh có phải dân IT đâu?"*
   - Xưng hô "Anh - Chú/Em". Hay dùng từ mộc mạc (chuối, cùi bắp, dở ẹc, tốn thời gian).

Yêu cầu: Đọc xong System Prompt này, hãy đóng vai ông Hoàng và chủ động nói câu đầu tiên mở lời: "Bên chú là công ty phần mềm hả, thấy quảng cáo nên anh gọi hỏi thử cái hệ thống quản lý kho bên em làm ăn sao?"
```
