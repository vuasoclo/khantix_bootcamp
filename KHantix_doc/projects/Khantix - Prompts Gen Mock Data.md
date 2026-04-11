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

## PROMPT 2: GEN BẢNG HEURISTIC (TỪ ĐIỂN TRIỆU CHỨNG)

```markdown
**Mục tiêu:** Viết script Python dùng Pandas để tạo file `heuristic_matrix.csv`. Đây là "Từ điển Triệu chứng" dùng để ánh xạ câu trả lời đời thường của khách hàng B2B sang các Giá trị Rủi ro Kỹ thuật (Risk Buffer). Xuất file CSV sau khi chạy.

**Ràng buộc Kiến trúc (Constraints):**
Dữ liệu phải tuân thủ chuẩn "Extremes Mapping" (Tốt nhất và Tệ nhất) và luôn có "Fallback" (Gom rác).
Cấu trúc CSV gồm các cột: `Slot_Target` (Mục tiêu), `User_Symptom_Keywords` (Keywords khách dùng), `Mapped_Value` (HIGH/MEDIUM/LOW), `Buffer_Percentage` (Từ 0.0 đến 0.35).

Bắt buộc sinh dữ liệu theo các quy tắc "Extremes Mapping" cho đầy đủ 8 Slot sau:
1. Slot: `Data_Risk` (Rủi ro Dữ liệu)
   - Nhóm HIGH (Buffer 0.3): Khách dùng từ [Excel, ghi sổ tay, copy USB, không quy trình].
   - Nhóm LOW (Buffer 0.05): [Đã có ERP, API chuẩn, xuất SQL].
   - Nhóm FALLBACK (Buffer 0.35): [Chưa biết, hệ thống tự code cũ, dữ liệu giấy].
2. Slot: `Integration_Risk` (Rủi ro Tích hợp)
   - Nhóm HIGH (Buffer 0.25): [MISA, Kiotviet, phần mềm đóng, bắt buộc lấy số dư cũ].
   - Nhóm LOW (Buffer 0.0): [Độc lập hoàn toàn, không cần nối, làm riêng].
3. Slot: `Tech_Literacy_Risk` (Kháng cự Công nghệ)
   - Nhóm HIGH (Buffer 0.15): [Công nhân, cô chú lớn tuổi, mù công nghệ, toàn dùng Zalo].
   - Nhóm LOW (Buffer 0.0): [Văn phòng trẻ, xài thạo app].
4. Slot: `Hardware_Sizing` (Quy mô User/Data - Cần cho Giá vốn)
   - Nhóm TIER_SMALL: [dưới 50 người, cửa hàng nhỏ, vài trăm đơn].
   - Nhóm TIER_LARGE: [chuỗi trăm quán, hàng chục ngàn nhân viên, hệ thống toàn quốc].
5. Slot: `Scope_Granularity` (Độ lớn Phạm vi - Cần cho Giá vốn ManDays)
   - Nhóm SMALL: [chỉ cần bán hàng, kho lặt vặt, làm đơn giản gọn nhẹ].
   - Nhóm ENTERPRISE: [ôm đồm cả kế toán, nhân sự, crm, quản lý tổng thể].
6. Slot: `Rush_Factor` (Độ khẩn cấp - Cần cho Giá Thương vụ)
   - Nhóm HIGH (Multiplier 1.5): [ép tiến độ, go-live tháng tới, cháy nhà, làm gấp ngày đêm].
   - Nhóm LOW (Multiplier 1.0): [cứ từ từ làm, không vội, túc tắc].
7. Slot: `Client_Logo_Size` (Chiến lược Branding)
   - Nhóm ENTERPRISE (Multiplier 0.8): [tập đoàn, chuỗi lớn, công ty cổ phần đại chúng].
   - Nhóm SMB (Multiplier 1.0): [cửa hàng nhỏ lẻ, công ty gia đình].
8. Slot: `Payment_Term` (Dòng tiền)
   - Nhóm UPFRONT (Discount_Payment 5%): [trả đứt 1 vòng, tiền không thiếu, chuyển khoản 1 cục].
   - Nhóm INSTALLMENT (Discount 0%): [trả rải rác, đói vốn, trả góp].

**Yêu cầu Output:** Viết script khởi tạo DataFrame với ít nhất 40-50 dòng (đảm bảo ít nhất 2-3 record cho mỗi khe/mức độ mồi của từng Slot). Các keyword mồi phải thực tế (viết bằng định dạng list chứa cụm từ). Tự chạy Coder Interpreter và cho tôi tải file CSV về.
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
