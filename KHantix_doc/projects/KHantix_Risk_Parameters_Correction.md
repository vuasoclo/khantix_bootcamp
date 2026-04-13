# Khantix - Thiết kế Hệ thống Dự đoán Risk Động (Dynamic Risk Estimation)
_last updated: 2026-04-13_
_methodology: First Principle Protocol (FP0 → FP2)_

---

## 0. VẤN ĐỀ GỐC

Hệ thống hiện tại fix cứng:
- Keyword "Excel" → `Data_Risk = HIGH` → luôn luôn `+30%`.
- Mọi khách hàng nói "Excel" đều bị phạt 30%, dù có người Excel 2 năm gọn gàng, có người Excel 10 năm rác từ thời Windows XP.

**Câu hỏi FP:** Nếu không fix cứng, thì MVP nên cởi mở đến đâu?

---

## 1. NGUYÊN LÝ: MỨC ĐỘ CỞI MỞ CỦA MVP

### Ba mức độ cởi mở (từ cứng → mềm):

| Mức | Tên gọi | Cách hoạt động | Đánh giá |
|:---|:---|:---|:---|
| **Mức 1** (Hiện tại) | Fix cứng | Keyword → Level → % cố định trong code | ❌ Quá cứng nhắc, mất ý nghĩa "AI" |
| **Mức 2** (Đề xuất cho MVP) | AI dự đoán trong khung | AI tự ước lượng % dựa trên ngữ cảnh, nhưng bị giới hạn bởi **Range cho phép** từ Heuristic CSV | ✅ Cân bằng giữa linh hoạt và kiểm soát |
| **Mức 3** | AI toàn quyền | AI tự đặt % hoàn toàn, không có khung | ❌ Nguy hiểm — AI hallucinate ra 80% buffer thì công ty mất deal |

### Kết luận: **MVP nên ở Mức 2 — "Tự do có khung" (Constrained Freedom).**

> **Nguyên lý:** Heuristic CSV không phải "bảng tra cứu cho ra đáp án", mà là "bảng quy định biên độ cho phép" (Guardrails / Bounds). AI được quyền tự chọn con số bên trong biên độ đó, dựa trên bối cảnh thực tế của khách hàng.

---

## 2. THIẾT KẾ: AI DỰ ĐOÁN RISK NHƯ THẾ NÀO?

### Có cần training data không?

**KHÔNG.** Gemini đã có sẵn kiến thức domain về B2B IT risk. Thay vì train model, ta chỉ cần cung cấp cho nó:
1. **Vocabulary (Từ vựng):** Heuristic CSV cho AI biết các chiều rủi ro nào cần quan tâm.
2. **Range (Biên độ):** CSV định nghĩa khoảng % cho phép (vd: Data_Risk HIGH nằm trong 25-35%).
3. **Context (Bối cảnh):** Toàn bộ cuộc hội thoại với khách hàng — AI dùng lý luận để chọn con số cụ thể.

### Luồng xử lý mới:

```
Khách hàng nói: "Anh lưu Excel 10 năm, mỗi chi nhánh một file riêng"
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  AI PHÂN TÍCH NGỮ CẢNH (Không chỉ bắt keyword)                 │
│                                                                  │
│  Phát hiện:                                                      │
│  - "Excel" → đúng, dữ liệu không chuẩn hóa                    │
│  - "10 năm" → volume CỰC LỚN, tệ hơn "2 năm"                 │
│  - "mỗi chi nhánh một file" → dữ liệu PHÂN TÁN, không tập    │
│    trung, cần merge + deduplicate                                │
│                                                                  │
│  AI kết luận:                                                    │
│  - Data_Risk = HIGH                                              │
│  - Estimated Buffer = 32% (cao hơn mức chuẩn 30% vì volume     │
│    10 năm + phân tán nhiều chi nhánh)                            │
│  - Confidence = HIGH                                             │
│  - Evidence = "Khách xác nhận Excel 10 năm, phân tán theo       │
│    chi nhánh — Câu hỏi #3"                                      │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  GUARDRAILS VALIDATION (Kiểm tra biên độ)                        │
│                                                                  │
│  CSV quy định: Data_Risk HIGH = Range [25%, 35%]                │
│  AI đề xuất: 32%                                                 │
│  → 32% nằm trong [25%, 35%] → ✅ CHẤP NHẬN                     │
│                                                                  │
│  (Nếu AI đề xuất 60% → ⛔ TỪ CHỐI, ép về max 35%)             │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  ĐƯA VÀO MATH ENGINE                                            │
│                                                                  │
│  Effort_Adjusted = ManDays × (1 + 0.32)                         │
│  (thay vì luôn luôn 0.30)                                        │
└──────────────────────────────────────────────────────────────────┘
```

### So sánh kết quả:

| Tình huống | Fix cứng (hiện tại) | AI dự đoán trong khung (đề xuất) |
|:---|:---|:---|
| Khách A: "Excel 2 năm, gọn gàng" | +30% (vì thấy keyword Excel) | +26% (AI hiểu volume nhỏ, có tổ chức) |
| Khách B: "Excel 10 năm, rác khắp nơi" | +30% (cũng keyword Excel) | +34% (AI hiểu volume lớn, phân tán) |
| Khách C: "Có ERP sẵn rồi" | +5% | +5% (không thay đổi, đã rõ ràng) |

---

## 3. XỬ LÝ THAM SỐ TRỐNG (Missing Slots)

### Luồng Escalation khi khách không biết hoặc không tiết lộ:

```
Lần hỏi 1: AI hỏi trực tiếp
    │ Khách trả lời → ✅ Điền Slot
    │ Khách nói "Không biết" / trả lời mập mờ
    ▼
Lần hỏi 2: AI hỏi gián tiếp (đổi góc tiếp cận)
    │ Khách trả lời → ✅ Điền Slot  
    │ Vẫn không rõ
    ▼
Lần hỏi 3: AI hỏi câu hỏi proxy (suy luận gián tiếp)
    │ VD: Thay vì hỏi "Data thế nào", hỏi "Bao lâu rồi anh mở công ty?"
    │ → 15 năm + chưa từng dùng phần mềm = suy ra Data_Risk cao
    │ Khách trả lời → ✅ Suy luận Slot
    │ Vẫn không rõ
    ▼
SAU 3 LẦN: AI sử dụng kiến thức domain để DỰ ĐOÁN
    │
    ├─ CÓ THỂ suy luận từ ngành + quy mô:
    │   AI biết: "Ngành sản xuất + 500 nhân viên + hoạt động 10 năm"
    │   → Suy ra: Data_Risk ≈ HIGH (28-32%)
    │   → Confidence: MEDIUM (dựa trên kiến thức ngành, không phải xác nhận trực tiếp)
    │   → Ghi chú: "Dự đoán dựa trên profile ngành sản xuất quy mô vừa,
    │     chưa được khách xác nhận trực tiếp"
    │
    └─ KHÔNG THỂ suy luận (thiếu hoàn toàn manh mối):
        → Để TRỐNG (null)
        → Kèm note: "Không thu thập được thông tin sau 3 lần hỏi.
          Pre-sales cần xác nhận trực tiếp với khách hoặc đội kỹ thuật."
        → Math Engine dùng giá trị Default từ internal_configs (giá trị trung bình ngành)
```

### Cấu trúc Output JSON mới (cho từng Slot):

```json
{
  "slot": "Data_Risk",
  "level": "HIGH",
  "estimatedBuffer": 0.32,
  "confidence": "high",
  "source": "direct_customer_statement",
  "evidence": "Khách nói: 'Bên anh lưu Excel 10 năm, mỗi chi nhánh một file riêng' — Câu hỏi #3",
  "reasoning": "Volume 10 năm + phân tán theo chi nhánh → cần merge + deduplicate + validate. Ước lượng cao hơn baseline 30%."
}
```

```json
{
  "slot": "Integration_Risk",
  "level": "HIGH",
  "estimatedBuffer": 0.22,
  "confidence": "medium",
  "source": "ai_inference_from_industry",
  "evidence": "Khách thuộc ngành Dược, chuỗi 50 chi nhánh — thường bắt buộc tích hợp Cổng Dược Quốc Gia",
  "reasoning": "Ngành Dược quy mô chuỗi luôn có yêu cầu kết nối hệ thống quản lý Dược Quốc Gia. Khách chưa đề cập nhưng đây là yêu cầu pháp lý bắt buộc."
}
```

```json
{
  "slot": "Hardware_Dependency",
  "level": null,
  "estimatedBuffer": null,
  "confidence": null,
  "source": "unknown_after_3_attempts",
  "evidence": "Đã hỏi 3 lần, khách không rõ về hạ tầng hiện tại. Khách nói: 'Để em hỏi lại phòng IT'",
  "reasoning": null,
  "presalesNote": "⚠️ Cần Pre-sales xác nhận trực tiếp với phòng IT của khách trước khi chốt giá."
}
```

---

## 4. ĐIỀU CHỈNH HEURISTIC CSV

File `heuristic_matrix.csv` cần bổ sung 2 cột mới để hỗ trợ Mức 2:

| Cột hiện tại | Cột mới cần thêm | Mục đích |
|:---|:---|:---|
| `Buffer_Percentage` (giá trị đơn: 0.30) | `Buffer_Min` (vd: 0.25) | Biên dưới — AI không được đề xuất thấp hơn |
| | `Buffer_Max` (vd: 0.35) | Biên trên — AI không được đề xuất cao hơn |

**Ví dụ CSV mới:**
```csv
Row_ID,Slot_Target,User_Symptom_Keywords,Mapped_Value,Buffer_Percentage,Buffer_Min,Buffer_Max
1,Data_Risk,"['Excel', 'file excel']",HIGH,0.30,0.25,0.35
6,Data_Risk,"['đã có ERP', 'SAP']",LOW,0.05,0.02,0.08
```

- `Buffer_Percentage` giữ lại làm giá trị tham chiếu mặc định (nếu AI không tự ước lượng được).
- `Buffer_Min` / `Buffer_Max` là rào chắn an toàn cho AI.

---

## 5. XÁC NHẬN NGUYÊN LÝ KHỞI NGUYÊN (First Principle)

> **Nguyên lý Dự đoán Có Khung (Bounded Estimation):**
>
> "Trong hệ thống Hybrid AI, vai trò của Toán học KHÔNG phải là tính toán thay con người, mà là **đặt biên độ an toàn** (Guardrails) để AI không thể phạm sai lầm chết người. AI được tự do ước lượng bên trong biên độ đó dựa trên bối cảnh thực tế. Kết quả cuối cùng luôn kèm bằng chứng (Evidence) và độ tin cậy (Confidence) để Con người (Pre-sales) ra quyết định cuối cùng."
>
> Hệ thống tốt nhất không phải hệ thống đoán đúng 100%, mà là hệ thống **biết nó đang không chắc chắn** và nói rõ điều đó cho người dùng.

---

## 6. CHECKLIST TRIỂN KHAI

- [ ] **CSV:** Bổ sung cột `Buffer_Min`, `Buffer_Max` vào `heuristic_matrix.csv`.
- [ ] **Prompt:** Cập nhật Output Schema của Investigator để AI trả về `estimatedBuffer`, `confidence`, `source`, `evidence`, `reasoning`.
- [ ] **Backend:** Xây dựng Guardrails Validator — nhận output AI, kiểm tra `estimatedBuffer` có nằm trong `[Buffer_Min, Buffer_Max]` không, nếu vượt thì clamp về biên.
- [ ] **Backend:** Implement Escalation Logic — đếm số lần hỏi mỗi Slot, sau 3 lần vẫn null thì chuyển sang chế độ AI Inference (dự đoán từ context ngành/quy mô).
- [ ] **Frontend:** Hiển thị Confidence Level trên giao diện Override (Pre-sales nhìn thấy: "AI dự đoán 32% — Confidence: HIGH — Evidence: Khách nói Excel 10 năm").
- [ ] **Math Engine:** Xóa `RISK_BUFFER_MAP` hardcode, thay bằng đọc từ validated AI output.
