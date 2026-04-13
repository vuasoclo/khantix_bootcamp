# Khantix - Phân rã Lớp 2 theo Mô hình COCOMO Effort Multipliers
_last updated: 2026-04-13_
_methodology: First Principle Protocol (FP0) × COCOMO II × AI-CPQ_
_inputs: [[KHantix - Từ điển tham số định giá.md]], [[KHantix - FP0 Bản chất Dự đoán Rủi ro Hybrid.md]]_

---

## 0. THAY ĐỔI CÔNG THỨC NỀN TẢNG

### Công thức cũ (Phép cộng — Flat Buffer):
$$Effort_{Adjusted} = ManDays \times (1 + \sum Risk_{Factors})$$
- Gộp 3 cục: Data 30% + Integration 25% + Tech 15% = 70%.
- Không phản ánh sự cộng hưởng khi nhiều rủi ro xảy ra đồng thời.

### Công thức mới (Phép nhân — COCOMO Effort Multipliers):
$$Effort_{Adjusted} = ManDays \times \prod_{i=1}^{n} EM_i$$
- Mỗi biến con trong Từ điển tham số trở thành **một Effort Multiplier (EM) riêng biệt**.
- Phép nhân tự động tạo compound effect (1.15 × 1.20 × 1.10 = 1.518 ≠ 1 + 0.15 + 0.20 + 0.10 = 1.45).
- Map 1:1 với Từ điển — không còn "nén mất mát".

---

## 1. BẢNG EFFORT MULTIPLIERS THEO TỪ ĐIỂN THAM SỐ

Mỗi dòng trong bảng dưới đây tương ứng với **một biến con (sub-parameter)** đã được phân rã trong file Từ điển tham số. AI sẽ dự đoán từng giá trị EM dựa trên ngữ cảnh cuộc hội thoại.

### A. Nhóm Data Risk (3 Effort Multipliers)

| EM_ID | Tên EM | Tham số Từ điển Map | Kiểu Input | Range EM | Ý nghĩa |
|:---|:---|:---|:---|:---|:---|
| EM_D1 | Data Format | `Data Format` (Enum) | AI phân loại từ lời khách | 1.00 — 1.20 | Excel/PDF thô → multiplier cao. SQL chuẩn → 1.0 |
| EM_D2 | Data Volume | `Data Volume` (Number) | AI ước lượng từ "mấy năm / bao nhiêu dòng" | 1.00 — 1.25 | 10 năm dữ liệu → cao hơn 2 năm |
| EM_D3 | Data Integrity | `Data Integrity` (Boolean) | AI suy luận từ quy trình vận hành | 1.00 — 1.15 | Dữ liệu rác / trùng lặp / thiếu trường → cao |

**Ví dụ compound:**
- Khách A: Excel (EM_D1=1.15), 2 năm (EM_D2=1.05), khá gọn (EM_D3=1.03) → 1.15 × 1.05 × 1.03 = **1.244** (+24.4%)
- Khách B: Excel (EM_D1=1.15), 10 năm (EM_D2=1.22), rác (EM_D3=1.12) → 1.15 × 1.22 × 1.12 = **1.571** (+57.1%)
- So với fix cứng cũ: cả 2 đều bị phạt 30%. Hệ thống mới phân biệt được.

### B. Nhóm Integration Risk (2 Effort Multipliers)

| EM_ID | Tên EM | Tham số Từ điển Map | Kiểu Input | Range EM | Ý nghĩa |
|:---|:---|:---|:---|:---|:---|
| EM_I1 | API Availability | `API Availability` (Boolean) | AI hỏi: hệ thống cũ mở cổng không | 1.00 — 1.20 | Đóng hoàn toàn → phải reverse-engineer → cao |
| EM_I2 | Legacy System Age | `Legacy System Age` (Number) | AI hỏi: xài bao lâu rồi | 1.00 — 1.15 | Hệ thống 15 năm → documentation chết, vendor bỏ rơi → cao |

### C. Nhóm Tech Literacy Risk (2 Effort Multipliers)

| EM_ID | Tên EM | Tham số Từ điển Map | Kiểu Input | Range EM | Ý nghĩa |
|:---|:---|:---|:---|:---|:---|
| EM_T1 | End-user Age | `End-user Age` (Range) | AI suy luận từ mô tả nhân sự | 1.00 — 1.15 | Đội 50+ tuổi → thời gian training gấp đôi |
| EM_T2 | Prior System Exp | `Prior System Experience` (Boolean) | AI hỏi: đã dùng phần mềm tương tự chưa | 1.00 — 1.10 | Lần đầu số hóa → learning curve dài |

### D. Nhóm Base Cost Multipliers (Lớp 1 — điều chỉnh giá vốn)

| EM_ID | Tên EM | Tham số Từ điển Map | Kiểu Input | Range EM | Ý nghĩa |
|:---|:---|:---|:---|:---|:---|
| EM_B1 | Deployment Location | `Deployment Location` (Enum) | AI hỏi: team ngồi đâu | 1.0 hoặc 1.3 | Onsite = ×1.3 (từ internal_configs) |
| EM_B2 | Hardware Dependency | `Dependency` (Enum) | AI hỏi: cần SMS, bản đồ, máy quét không | 1.00 — 1.15 | Càng nhiều dịch vụ bên thứ 3 → giá cứng tăng |

### E. Nhóm Commercial Multipliers (Lớp 3 — điều chỉnh giá bán)

| EM_ID | Tên EM | Tham số Từ điển Map | Kiểu Input | Range EM | Ý nghĩa |
|:---|:---|:---|:---|:---|:---|
| EM_C1 | Rush Factor | `Rush Factor` (Boolean) | AI hỏi: deadline khi nào | 1.0 — 1.5 | Gấp → OT → x1.3-1.5 |
| EM_C2 | Client Logo | `Client Logo Size` (Enum) | AI phân loại quy mô | 0.80 — 1.0 | Cá mập → giảm chiến lược |
| EM_C3 | Payment Term | `Payment Term` (Enum) | AI hỏi: thanh toán thế nào | Discount 0% — 5% | Trả đứt → giảm 5% |

---

## 2. CÔNG THỨC TỔNG HỢP MỚI

### Lớp 1 — Base Cost (giữ nguyên):
$$Cost_{Base} = (License + Hardware) + (ManDays \times Rate_{Burdened} \times EM_{B1})$$

### Lớp 2 — Risk Adjusted (MỚI — phép nhân):
$$Effort_{Adjusted} = ManDays \times EM_{D1} \times EM_{D2} \times EM_{D3} \times EM_{I1} \times EM_{I2} \times EM_{T1} \times EM_{T2}$$

$$Cost_{Adjusted} = Effort_{Adjusted} \times Rate_{Burdened} + Hardware \times EM_{B2}$$

### Lớp 3 — Commercial (giữ nguyên cấu trúc):
$$Price_{Final} = \frac{Cost_{Adjusted}}{1 - Margin_{\%}} \times EM_{C1} \times EM_{C2} \times (1 - Discount_{C3})$$

---

## 3. VAI TRÒ CỦA AI TRONG MÔ HÌNH MỚI

### AI không còn chỉ gán HIGH/LOW. AI phải:
1. **Thu thập bằng chứng** từ cuộc hội thoại (Evidence).
2. **Ước lượng từng EM riêng biệt** dựa trên bối cảnh (trong Range cho phép từ Heuristic CSV).
3. **Giải thích reasoning** cho từng EM: tại sao chọn 1.15 thay vì 1.08.
4. **Ghi nhận confidence** cho từng EM: high (xác nhận trực tiếp) / medium (suy luận từ ngành) / low (đoán).
5. **Để trống + ghi note** nếu sau 3 lần hỏi vẫn không rõ — Pre-sales tự quyết sau.

### Output JSON mẫu cho 1 phiên AI:
```json
{
  "effortMultipliers": [
    {
      "em_id": "EM_D1",
      "name": "Data Format",
      "value": 1.15,
      "range": [1.00, 1.20],
      "confidence": "high",
      "source": "direct_customer_statement",
      "evidence": "Khách nói: 'Bên anh toàn lưu Excel, mỗi chi nhánh 1 file' — CQ #3",
      "reasoning": "Excel không chuẩn hóa, cần ETL pipeline chuyển đổi format."
    },
    {
      "em_id": "EM_D2",
      "name": "Data Volume",
      "value": 1.22,
      "range": [1.00, 1.25],
      "confidence": "high",
      "source": "direct_customer_statement", 
      "evidence": "Khách nói: '10 năm nay rồi, chục ngàn dòng' — CQ #3",
      "reasoning": "10 năm × 50 chi nhánh = volume lớn, cần batch processing + dedup."
    },
    {
      "em_id": "EM_I2",
      "name": "Legacy System Age",
      "value": null,
      "range": [1.00, 1.15],
      "confidence": null,
      "source": "unknown_after_3_attempts",
      "evidence": "Khách nói 'để hỏi lại phòng IT' — CQ #5, #7, #9",
      "reasoning": null,
      "presalesNote": "⚠️ Pre-sales cần xác nhận tuổi đời hệ thống cũ."
    }
  ],
  "compoundMultiplier": 1.571,
  "effectiveBufferPercent": "+57.1%"
}
```

---

## 4. XÁC NHẬN NGUYÊN LÝ

> **Nguyên lý Phân rã Rủi ro (Decomposed Risk Principle):**
>
> "Rủi ro không phải là một khối đồng nhất. Nó là tích số của nhiều chiều độc lập. Gộp chúng lại thành một con số duy nhất (HIGH → 30%) là **nén mất mát** — ta mất khả năng phân biệt giữa dự án 'Excel 2 năm gọn gàng' và 'Excel 10 năm rác'. Mô hình COCOMO Effort Multipliers giải quyết chính xác vấn đề này bằng cách giữ nguyên từng chiều, nhân chúng với nhau, và để phép nhân tự tạo ra hiệu ứng cộng hưởng."
