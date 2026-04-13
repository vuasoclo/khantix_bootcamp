# Khantix - Kế hoạch Thực thi Code: Chuyển đổi sang COCOMO Effort Multipliers
_last updated: 2026-04-13_
_dành cho: AI Coding Agent & Dev Team_

---

## 0. BỐI CẢNH

Hệ thống DEMO hiện tại đang sử dụng mô hình **Flat Buffer** (gộp 3 Risk → cộng %):
```
Effort = ManDays × (1 + 0.30 + 0.25 + 0.15)
```

Cần chuyển sang mô hình **COCOMO Effort Multipliers** (12 EM riêng biệt × nhau):
```
Effort = ManDays × EM_D1 × EM_D2 × EM_D3 × EM_I1 × EM_I2 × EM_T1 × EM_T2
```

Tài liệu tham chiếu:
- [Từ điển tham số định giá](file:///d:/khantix_bootcamp/KHantix_doc/outputs/KHantix%20-%20T%E1%BB%AB%20%C4%91i%E1%BB%83n%20tham%20s%E1%BB%91%20%C4%91%E1%BB%8Bnh%20gi%C3%A1.md)
- [Phân rã Lớp 2 COCOMO Effort Multipliers](file:///d:/khantix_bootcamp/KHantix_doc/outputs/KHantix%20-%20Ph%C3%A2n%20r%C3%A3%20L%E1%BB%9Bp%202%20COCOMO%20Effort%20Multipliers.md)
- [Implementation Gap Note](file:///d:/khantix_bootcamp/KHantix_doc/projects/KHantix_Implementation_Gap_Note.md)

---

## 1. THỨ TỰ THỰC THI (PHẢI TUÂN THEO ĐÚNG)

### PHASE A: Data Layer (Dữ liệu)
> Mục tiêu: Hệ thống có dữ liệu mới để đọc.

**A1. Sinh file `heuristic_matrix_v2.csv`:**
- Dùng Prompt 2 (đã cập nhật) trong file `Prompts Gen Mock Data.md`.
- Copy prompt ném vào Claude/ChatGPT có Code Interpreter.
- File output phải có đủ 12 EM_ID với cột: `EM_ID, EM_Name, Dictionary_Param, User_Symptom_Keywords, EM_Default, EM_Min, EM_Max, Reasoning_Hint`.
- Lưu vào: `KHantix_doc/requirements/heuristic_matrix_v2.csv`.

**A2. Giữ nguyên file `internal_configs.csv`:**
- File này đã đầy đủ 100%, không cần sửa.

---

### PHASE B: TypeScript Types & Schema
> Mục tiêu: Backend biết cấu trúc dữ liệu mới.

**B1. Tạo file `types/effort-multiplier.types.ts`:**
```typescript
// Effort Multiplier IDs — map 1:1 với Từ điển tham số
export type EM_ID =
  | 'EM_D1' // Data Format
  | 'EM_D2' // Data Volume
  | 'EM_D3' // Data Integrity
  | 'EM_I1' // API Availability
  | 'EM_I2' // Legacy System Age
  | 'EM_T1' // End-user Age
  | 'EM_T2' // Prior System Experience
  | 'EM_B1' // Deployment Location
  | 'EM_B2' // Hardware Dependency
  | 'EM_C1' // Rush Factor
  | 'EM_C2' // Client Logo Size
  | 'EM_C3'; // Payment Term

export type Confidence = 'high' | 'medium' | 'low';
export type EvidenceSource =
  | 'direct_customer_statement'
  | 'ai_inference_from_industry'
  | 'ai_inference_from_context'
  | 'unknown_after_3_attempts';

export interface EffortMultiplierEstimate {
  em_id: EM_ID;
  name: string;
  value: number | null;          // AI ước lượng (VD: 1.15), null nếu chưa biết
  range: [number, number];       // [EM_Min, EM_Max] từ CSV
  confidence: Confidence | null;
  source: EvidenceSource;
  evidence: string | null;       // Trích dẫn lời khách
  reasoning: string | null;      // Lý do AI chọn con số đó
  presalesNote?: string;         // Ghi chú cho Pre-sales nếu cần override
}

export interface EffortMultiplierSet {
  multipliers: EffortMultiplierEstimate[];
  compoundMultiplier: number;    // Tích của tất cả EM values (bỏ qua null)
  effectiveBufferPercent: string; // VD: "+57.1%"
}
```

**B2. Cập nhật `types/risk-slot.types.ts`:**
- Giữ `RiskSlot` interface cũ cho backward compatibility (API cũ vẫn chạy).
- Thêm field `effortMultipliers?: EffortMultiplierSet` vào `SessionState`.

---

### PHASE C: Config Loader
> Mục tiêu: Backend đọc được CSV mới.

**C1. Tạo file `config/heuristic-v2.loader.ts`:**
- Parse `heuristic_matrix_v2.csv`.
- Trả về `Map<EM_ID, HeuristicRuleV2[]>` để lookup theo EM_ID.

```typescript
export interface HeuristicRuleV2 {
  rowId: number;
  emId: EM_ID;
  emName: string;
  dictionaryParam: string;
  keywords: string[];
  emDefault: number;
  emMin: number;
  emMax: number;
  reasoningHint: string;
}
```

---

### PHASE D: LLM Prompt Upgrade
> Mục tiêu: AI trả về Effort Multipliers thay vì HIGH/LOW.

**D1. Tạo file `prompts/investigator/output-format-v2.prompt.md`:**
```
Return valid JSON only using this schema:
{
  "effortMultipliers": [
    {
      "em_id": "EM_D1",
      "name": "Data Format",
      "value": 1.15,
      "confidence": "high | medium | low | null",
      "source": "direct_customer_statement | ai_inference_from_industry | ai_inference_from_context | unknown_after_3_attempts",
      "evidence": "string — trích dẫn lời khách",
      "reasoning": "string — giải thích tại sao chọn con số này"
    }
  ],
  "nextQuestionToUser": "string",
  "allSlotsFilled": false
}

Rules:
- Set value to null if still unknown after probing.
- value MUST be within the allowed range for each EM (provided in system context).
- In evidence, quote the customer's exact words if available.
- In reasoning, explain WHY this value and not a different one.
- Set allSlotsFilled to true only when every EM has a non-null value.
- No markdown fences. Valid JSON only.
```

**D2. Cập nhật `prompts/investigator/system.prompt.md`:**
- Thay danh sách 8 Slot cũ bằng danh sách 12 EM mới.
- Nhấn mạnh: AI phải ước lượng CON SỐ CỤ THỂ trong range, không chỉ gán HIGH/LOW.

**D3. Cập nhật `prompts/investigator/developer.prompt.md`:**
- Inject danh sách EM + Range từ CSV v2 vào đây (thay cho Conversation_State cũ).

---

### PHASE E: Calculator Refactor
> Mục tiêu: Math Engine dùng phép NHÂN thay phép CỘNG.

**E1. Tạo file `calculators/effort-multiplier.calculator.ts`:**
```typescript
// Thay thế risk-multiplier.calculator.ts
// Input: EffortMultiplierSet từ AI
// Output: adjustedManDays = baseManDays × Π(EM values)

export function applyEffortMultipliers(
  baseManDays: number,
  multipliers: EffortMultiplierEstimate[],
  heuristicRules: Map<EM_ID, HeuristicRuleV2[]>  // fallback lookup
): {
  adjustedManDays: number;
  compoundMultiplier: number;
  appliedMultipliers: AppliedEM[];
} {
  // Với mỗi EM:
  //   - Nếu AI đã ước lượng (value !== null): dùng value, nhưng CLAMP trong [Min, Max]
  //   - Nếu null: dùng EM_Default từ CSV
  // Nhân tất cả lại → compoundMultiplier
  // adjustedManDays = baseManDays × compoundMultiplier
}
```

**E2. Cập nhật `calculators/pricing.orchestrator.ts`:**
- Import `applyEffortMultipliers` thay vì `applyRiskMultipliers`.
- Xóa hằng số `RISK_BUFFER_MAP`.
- Xóa logic `CommercialStrategy` (HUNTER/FARMER).

**E3. Cập nhật `buildNarrative` và `buildRiskAdjustments`:**
- Thay string template cứng bằng logic đọc `evidence` + `reasoning` từ AI output.
- Mỗi EM có giải thích riêng → báo cáo tự động bao gồm mọi tham số.

---

### PHASE F: API & Server
> Mục tiêu: API routes chạy đúng luồng mới.

**F1. Cập nhật `server.ts`:**
- Xóa hàm `deriveCalcParams` hardcode cũ.
- Route `/api/calculate` nhận `EffortMultiplierSet` từ Session thay vì `RiskSlot`.
- Route `/api/override` cho phép Pre-sales override từng EM riêng biệt (12 sliders thay vì 3 dropdowns).

**F2. Cập nhật `services/investigator.service.ts`:**
- Parse AI response theo schema mới (`effortMultipliers[]` thay vì `updatedSlots{}`).
- Implement Guardrails Validation: clamp mỗi EM.value trong [EM_Min, EM_Max].
- Implement Escalation Logic: đếm số lần hỏi mỗi EM, sau 3 lần vẫn null → ghi note.

---

### PHASE G: Frontend
> Mục tiêu: Giao diện hiển thị 12 EM thay vì 8 Slot.

**G1. Cập nhật `public/app.js`:**
- Hiển thị bảng 12 Effort Multipliers với: tên, giá trị, confidence badge, evidence quote.
- Override Console: 12 sliders (mỗi EM 1 slider trong range [Min, Max]).
- Live preview: khi kéo slider, giá cuối cùng thay đổi real-time.

---

## 2. THỨ TỰ ƯU TIÊN (NẾU HẠN CHẾ THỜI GIAN)

Nếu không đủ thời gian làm hết, thực hiện theo thứ tự ưu tiên:

1. ⭐ **Phase A** (Sinh CSV v2) — Không có data thì không làm gì được.
2. ⭐ **Phase B + C** (Types + Loader) — Nền móng cho toàn bộ phần sau.
3. ⭐ **Phase E** (Calculator) — Thay phép cộng bằng phép nhân. Đây là thay đổi core nhất.
4. **Phase D** (Prompt) — AI trả về EM thay vì HIGH/LOW.
5. **Phase F** (Server) — Nối luồng API.
6. **Phase G** (Frontend) — UI mới.

---

## 3. KIỂM CHỨNG SAU KHI HOÀN TẤT

- [ ] Chạy `npm start` không lỗi TypeScript.
- [ ] Gọi API `/api/chat` → AI trả về JSON có `effortMultipliers[]`.
- [ ] Gọi API `/api/calculate` → Giá cuối dùng phép nhân compound.
- [ ] So sánh: cùng 1 kịch bản, giá mới (COCOMO) vs giá cũ (Flat Buffer) phải khác nhau.
- [ ] Override 1 EM → giá thay đổi tương ứng, Audit Log ghi lại.
- [ ] Báo cáo hiển thị evidence + reasoning cho từng EM thay vì string template cứng.
