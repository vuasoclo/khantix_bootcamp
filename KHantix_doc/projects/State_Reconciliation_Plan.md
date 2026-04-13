# KHantix Copilot — State Reconciliation & Anti-Hallucination Plan (v2)

> **Mục tiêu:** Khắc phục 2 lỗi nghiêm trọng + thêm luồng Pre-sales Review giữa các hiệp
> 1. AI "bịa" giá trị EM dựa trên thông tin không liên quan (Hallucination)
> 2. Tham số EM bị "đóng băng" sau lần điền đầu, không thể UPDATE/RETRACT ở hiệp sau
> 3. Không có bước Pre-sales xác nhận/điều chỉnh inline giữa các hiệp

---

## 1. Phân tích vấn đề

### 1.1. Hallucination — AI suy diễn vô căn cứ

**Hiện tượng thực tế (từ test):**

| EM | AI đặt giá trị | Evidence AI đưa ra | Vấn đề |
|---|---|---|---|
| `EM_D1` (Data Format) | ×1.20 | "Kế toán trưởng (Chief Accountant)" | Chức danh ≠ Data Format. Không có thông tin nào về cấu trúc dữ liệu |
| `EM_C3` (Payment Term) | ×0.05 | "Bà Phạm Thu Hà, Kế toán trưởng" | Tên người ≠ Điều khoản thanh toán. Hoàn toàn bịa |
| `EM_C2` (Client Logo) | ×1.00 | "Facebook Messenger" | Kênh giao tiếp ≠ Quy mô doanh nghiệp |
| `EM_B2` (HW Dependency) | ×1.00 | "chị cũng không biết mình cần gì" | "Không biết" ≠ "Không cần phần cứng". Phải để null |

**Nguyên nhân gốc:**
1. **Bouncer Prompt** (`server.ts`) gọi AI "extract any EM values you can infer" nhưng **không cung cấp định nghĩa cụ thể** từng EM
2. **Developer Prompt** có rule "A single statement may reveal MULTIPLE EMs" → AI bị kích thích over-extract
3. **Output Format** chưa định nghĩa "information" là gì → AI coi "từ khoá liên quan" = "có evidence"

### 1.2. State Immutability — Tham số đóng băng sau hiệp đầu

**Hiện tượng:**
- Hiệp 1: AI gán `EM_D1 = 1.20` từ "Kế toán trưởng" (sai)
- Hiệp 2: Khách nói "Dữ liệu trên SAP, có schema chuẩn" → `EM_D1` lẽ ra phải giảm về ~1.05
- Nhưng AI **bỏ qua** vì rule `"Do not suggest asking about EM that already has non-null value"`

**Nguyên nhân gốc:**
1. Prompt cấm AI nhìn lại EMs đã filled → AI nghĩ FILLED = chốt cứng
2. Không có cơ chế `UPDATE` vs `FILL` → không phân biệt được điền mới hay sửa cũ
3. Không có bước Pre-sales review → AI tự động được chốt mà không qua kiểm tra

---

## 2. Giải pháp tổng thể

### 2.1. Kiến trúc: Action Flags (FILL / UPDATE / RETRACT)

AI trả về **hành động** thay vì chỉ giá trị:

```typescript
interface EMAction {
  em_id: string;
  action: "FILL" | "UPDATE" | "RETRACT";
  value: number | null;
  confidence: "high" | "medium" | "low";
  source: string;
  evidence: string;    // Phải là trích dẫn TRỰC TIẾP từ lời khách
  reasoning: string;   // Lý do chọn giá trị này theo định nghĩa EM
}
```

| Action | Điều kiện | Backend xử lý |
|---|---|---|
| `FILL` | EM đang `null` | Gán giá trị, chuyển sang `ai_pending` |
| `UPDATE` | EM đã có giá trị, transcript mới có thông tin rõ hơn/mâu thuẫn | Ghi đè, lưu `previousValue`, reset về `ai_pending`, auto audit log |
| `RETRACT` | AI nhận ra giá trị trước bị sai logically | Về `null`, về `empty`, ghi lý do |

### 2.2. EM Lifecycle: 4 trạng thái

```
EMPTY ──FILL──► AI_PENDING ──Confirm──► CONFIRMED
                    │                      │
                    │◄── UPDATE (AI) ───────┘
                    │
               Adjust (Pre-sales) → CONFIRMED (với giá trị mới)
```

| Trạng thái | Màu UI | Hành động có thể |
|---|---|---|
| `empty` | Viền xám mờ | Chờ AI |
| `ai_pending` | Viền vàng cam, pulse animation | Pre-sales: Confirm ✅ hoặc click để Adjust ✏️ |
| `confirmed` | Viền xanh lá | AI có thể đề xuất UPDATE → quay về `ai_pending` |

---

## 3. Luồng UX hoàn chỉnh

### Giai đoạn 0 — Lọc hồ sơ (không đổi)
Pre-sales upload/paste hồ sơ → Bouncer kiểm tra → nếu hợp lệ mở Phase 1

### Giai đoạn 1 — Hiệp trò chuyện + Review sau hiệp

```
Pre-sales nạp Transcript Hiệp 1
        ↓
AI phân tích, trả về EMs (FILL)
        ↓
EM Tracker: các EM được điền hiện viền VÀNG CAM (ai_pending)
        ↓
┌─ Pre-sales Review Panel xuất hiện ──────────────────────────────┐
│  "AI đã điền X/12 tham số. Vui lòng xác nhận trước khi tiếp."  │
│                                                                  │
│  [Pre-sales click vào EM card bất kỳ]                           │
│    → Bảng điều chỉnh trượt xuống ngay bên dưới card            │
│      • Hiển thị: evidence (trích dẫn), reasoning (giải thích)   │
│      • Slider: giá trị mới trong phạm vi range                  │
│      • Input: Lý do điều chỉnh (text)                           │
│      • Nút: ✅ Đồng ý | 🔄 Sửa & Xác nhận                      │
│                                                                  │
│  [Nút "Xác nhận tất cả"] → Confirm tất cả ai_pending → CONFIRMED│
└──────────────────────────────────────────────────────────────────┘
        ↓
Pre-sales nạp Transcript Hiệp 2
        ↓
AI phân tích, có thể UPDATE các EMs đã CONFIRMED
  → EMs bị UPDATE quay về AI_PENDING (vàng cam lại)
  → Pre-sales review lần 2 (chỉ các EM bị cập nhật)
        ↓
Khi ổn định → nhấn ⚡ Tính Base Price
```

### Chi tiết UI: EM Card mở rộng khi click

```
┌──────────────────────────────────────────────────┐
│ 📄  Data Format                    ×1.05  🟡     │  ← Header (luôn hiện)
│     ai_pending                                   │  ← Status badge
└──────────────────────────────────────────────────┘
         ↓ Khi click vào card
┌──────────────────────────────────────────────────┐  ← Expand panel (animate)
│ 💬 Evidence:                                     │
│   "Dữ liệu lưu Excel 15 cửa hàng..."            │  ← Trích dẫn lời khách
│                                                  │
│ 🧠 AI reasoning:                                 │
│   "Data phân tán, chưa có schema → ×1.05"       │  ← Giải thích của AI
│                                                  │
│ 🎚️ Điều chỉnh: [━━━━●───] 1.05   (1.00 – 1.20) │  ← Slider
│                                                  │
│ ✍️ Lý do: [______________________________]       │  ← Optional text input
│                                                  │
│ [ ✅ Đồng ý ]    [ 🔄 Sửa & Xác nhận ]          │  ← Action buttons
└──────────────────────────────────────────────────┘
```

---

## 4. Anti-Hallucination: Sửa Prompt

### 4.1. Bouncer Prompt — Thêm EM Definitions Cheat Sheet

```markdown
EM DEFINITIONS (CRITICAL — Only assign if you have DIRECT EVIDENCE in the brief):
- EM_D1: How is data STORED physically? Excel/PDF/paper = higher, SQL/ERP = lower.
         NOT inferable from job title, industry, or company size.
- EM_D2: How MUCH data will need migrating? (years × records/branches). 
         NOT inferable from company size alone.
- EM_D3: Is existing data CLEAN and consistent? Need explicit complaint about errors/mismatch.
- EM_I1: Does their system expose APIs/webhooks? Need explicit mention of integration capability.
- EM_I2: How OLD is their current software? Need explicit year, version, or "very old/new".
- EM_T1: Will end-users RESIST change? Need explicit concern about adoption barriers.
- EM_T2: Have users used SIMILAR software before (not Excel, but dedicated B2B apps)?
- EM_B1: On-site or Remote delivery? Need explicit discussion of work location.
- EM_B2: Special HARDWARE needed? (barcode scanner, GPS, POS terminal). Need explicit requirement.
- EM_C1: How URGENT is timeline? Need explicit deadline or urgency language.
- EM_C2: Enterprise SLA/compliance? Need explicit mention of uptime SLA, audit trails, ISO.
- EM_C3: Payment terms EXPLICITLY discussed? (upfront lump sum vs installments).

STRICT RULE: If the brief does NOT contain a direct evidence quote for an EM → value MUST be null.
"I don't know" → null. Job title alone → null. Company name alone → null.
```

### 4.2. Developer Prompt — Phân biệt FILL vs UPDATE

```diff
- Do not suggest asking about an EM that already has a non-null value.
+ FILLED EMs can still be UPDATED or RETRACTED:
+   - Use action "UPDATE" if the new transcript DIRECTLY CONTRADICTS or CLEARLY REFINES 
+     a previously filled EM. Explain what changed in "reasoning".
+   - Use action "RETRACT" if you realize the old value was inferred without direct evidence.
+   - Do NOT update just because you see a vaguely related keyword. Only with CLEAR NEW EVIDENCE.
+ For suggestions: Only suggest asking about EMPTY EMs. For AI_PENDING EMs, 
+   suggest Pre-sales to confirm/review those first.
```

### 4.3. Output Format — Thêm `action` field

```json
{
  "effortMultipliers": [
    {
      "em_id": "EM_D1",
      "action": "FILL",
      "value": 1.05,
      "confidence": "high",
      "source": "direct_customer_statement",
      "evidence": "trích dẫn nguyên văn lời khách",
      "reasoning": "giải thích theo định nghĩa EM, reference EM_D1 definition"
    }
  ]
}
```

**Rule bổ sung:**
- `action: "FILL"` chỉ dùng khi EM hiện tại = null
- `action: "UPDATE"` bắt buộc có reasoning giải thích thay đổi
- `action: "RETRACT"` đặt value = null, giữ reasoning

---

## 5. Thay đổi Backend

### 5.1. `investigator.service.ts` — Merge logic theo action

```typescript
switch (aiEM.action) {
  case 'FILL':
    if (existing.value === null) {
      existing.value = clamp(aiEM.value);
      existing.status = 'ai_pending';
      existing.evidence = aiEM.evidence;
      existing.reasoning = aiEM.reasoning;
    }
    break;

  case 'UPDATE':
    existing.previousValue = existing.value;
    existing.value = clamp(aiEM.value);
    existing.status = 'ai_pending';      // Reset → chờ re-confirm
    existing.evidence = aiEM.evidence;
    existing.reasoning = aiEM.reasoning;
    existing.confirmedBy = null;
    // Auto audit log
    break;

  case 'RETRACT':
    existing.previousValue = existing.value;
    existing.value = null;
    existing.status = 'empty';
    existing.reasoning = aiEM.reasoning; // Lưu lý do retract
    break;
}
```

### 5.2. API mới: `POST /api/confirm-em`

```typescript
// Pre-sales confirm hoặc adjust inline
app.post('/api/confirm-em', (req, res) => {
  const { sessionId, em_id, action, newValue, reason } = req.body;
  // action: 'confirm' | 'adjust'

  const em = emSet.multipliers.find(m => m.em_id === em_id);

  if (action === 'confirm') {
    em.status = 'confirmed';
    em.confirmedBy = 'pre-sales';
  } else {
    em.previousValue = em.value;
    em.value = newValue;  // Pre-sales adjusted value
    em.status = 'confirmed';
    em.confirmedBy = 'pre-sales';
    em.confirmReason = reason;
    // Add to audit log
  }

  computeCompound(emSet);
  return res.json({ success: true, effortMultipliers: emSet.multipliers, compoundMultiplier: emSet.compoundMultiplier });
});
```

---

## 6. Thay đổi UI — EM Card Inline Expand

### 6.1. Slot card mới (HTML)

Mỗi EM card thêm expand area ẩn, chỉ hiện khi click:

```html
<div class="slot-card" id="slot-EM_D1" data-em="EM_D1" data-status="empty">
  <!-- Header (luôn hiện) -->
  <div class="slot-card-header">
    <span class="slot-icon">📄</span>
    <div class="slot-content">
      <div class="slot-name">Data Format</div>
      <div class="slot-value">—</div>
      <div class="slot-confidence"></div>
    </div>
    <span class="slot-status-badge"></span>
    <span class="slot-indicator"></span>
  </div>
  <!-- Expand panel (ẩn, animate xuống khi click) -->
  <div class="slot-expand-panel" hidden>
    <div class="slot-evidence-block">
      <div class="slot-evidence-label">💬 Evidence</div>
      <div class="slot-evidence-text">—</div>
    </div>
    <div class="slot-reasoning-block">
      <div class="slot-reasoning-label">🧠 AI Reasoning</div>
      <div class="slot-reasoning-text">—</div>
    </div>
    <div class="slot-adjust-block">
      <label class="slot-adjust-label">🎚️ Điều chỉnh</label>
      <div class="slot-slider-row">
        <input type="range" class="slot-slider" min="1.0" max="1.5" step="0.01" />
        <span class="slot-slider-val">1.00</span>
      </div>
      <input type="text" class="slot-reason-input" placeholder="Lý do (tuỳ chọn)..." />
      <div class="slot-action-btns">
        <button class="btn-confirm-em">✅ Đồng ý</button>
        <button class="btn-adjust-em">🔄 Sửa & Xác nhận</button>
      </div>
    </div>
  </div>
</div>
```

### 6.2. CSS: Status-based border + Expand animation

```css
/* ai_pending = viền vàng, pulse nhẹ */
.slot-card[data-status="ai_pending"] {
  border-left: 3px solid var(--risk-medium);
  animation: pending-pulse 2s ease-in-out infinite;
}
@keyframes pending-pulse {
  0%, 100% { border-left-color: var(--risk-medium); }
  50%       { border-left-color: rgba(255,169,77,0.4); }
}

/* confirmed = viền xanh lá cố định */
.slot-card[data-status="confirmed"] {
  border-left: 3px solid var(--risk-low);
}

/* empty = viền xám mờ */
.slot-card[data-status="empty"] {
  border-left: 3px solid rgba(255,255,255,0.1);
}

/* Expand panel animate */
.slot-expand-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  border-top: 1px solid rgba(255,255,255,0.06);
  padding: 0 10px;
}
.slot-card.expanded .slot-expand-panel {
  max-height: 280px;
  padding: 10px;
}
```

### 6.3. JS: Click handler cho EM card

```javascript
// Toggle expand khi click vào card
document.getElementById('slot-cards').addEventListener('click', (e) => {
  const card = e.target.closest('.slot-card');
  if (!card) return;
  
  // Chỉ cho expand khi có giá trị (ai_pending hoặc confirmed)
  if (card.dataset.status === 'empty') return;
  
  // Toggle expand
  const wasExpanded = card.classList.contains('expanded');
  document.querySelectorAll('.slot-card.expanded').forEach(c => c.classList.remove('expanded'));
  if (!wasExpanded) card.classList.add('expanded');
});

// Confirm button
async function confirmEM(emId, action, newValue = null, reason = '') {
  const data = await apiPost('/api/confirm-em', {
    sessionId: state.sessionId,
    em_id: emId,
    action,       // 'confirm' | 'adjust'
    newValue,
    reason,
  });
  updateEMTracker(data.effortMultipliers, ...);
  // Collapse card after confirm
  document.getElementById(`slot-${emId}`).classList.remove('expanded');
}
```

---

## 7. Thứ tự thực thi

| # | Task | File(s) |
|---|---|---|
| 1 | Sửa Prompt chống Hallucination | `system.prompt.md`, `developer.prompt.md`, `output-format.prompt.md`, `server.ts` (bouncerPrompt) |
| 2 | Sửa merge logic → switch action | `investigator.service.ts` |
| 3 | API `/api/confirm-em` | `server.ts` |
| 4 | Thêm expand HTML vào 12 EM cards | `index.html` |
| 5 | CSS: status-based border, expand animation | `style.css` |
| 6 | JS: click handler, confirm/adjust handler, updateEMTracker theo status | `app.js` |
| 7 | Xoá block `#override-console` | `index.html` |

---

## 8. Tóm tắt kiến trúc

```
TRƯỚC:
  AI FILL → Auto accepted → Pre-sales Override (bảng riêng, cuối trang)

SAU:
  AI FILL/UPDATE/RETRACT
      ↓
  ai_pending (vàng) → Pre-sales click card → Expand inline
      → Đọc evidence + reasoning
      → ✅ Confirm  hoặc  ✏️ Adjust + lý do
      ↓
  confirmed (xanh) — Nằm trong compound calculation
```

> **Nguyên tắc:** AI là "đề xuất viên" có trách nhiệm giải trình (evidence + reasoning).  
> Pre-sales là người ký duyệt. Không có EM nào được tính vào giá khi chưa xác nhận.
