# Khantix - Phase 2: Explainable Report & Pre-sales Override
_last updated: 2026-04-11_
_methodology: First Principle Protocol (FP2 → FP0)_
_inputs: [[KHantix - FP2 Kiểm chứng Hướng giải quyết.md]], [[KHantix - Phân rã tham số định giá (FP0).md]], [[KHantix - Cấu trúc Prompt Heuristic AI.md]]_

---

## 0. KIỂM TRA FRAME (FP2)

### Tuyên bố Phase 2:
> "Hệ thống AI Pre-sales không **ra quyết định** báo giá. AI là **Copilot** — nó tính toán giá Base dựa trên Math, đề xuất Buffer rủi ro và Margin kèm lời giải thích từng tham số, sau đó **Pre-sales** là người tinh chỉnh và tham vấn Sếp để chốt giá cuối cùng."

### 2 lỗ hổng kiến trúc cần vá:
| # | Lỗ hổng | Hậu quả nếu không sửa |
| :--- | :--- | :--- |
| **L1** | Không có Báo cáo Giải thích (Explainable Report) — Output hiện tại chỉ là JSON `updated_slots` với các con số trần trụi | Pre-sales không hiểu con số từ đâu ra → Không thể giải thích cho Sếp/Khách → Black Box Problem → **Sales bỏ tool quay lại Excel** |
| **L2** | Không có bước Override (Ghi đè thủ công) — Workflow chạy thẳng từ AI → Math → Giá cuối | Pre-sales mất quyền kiểm soát → AI đoán sai thì không ai sửa → Sai giá → **Lỗ dự án hoặc mất deal** |

### Nguyên lý nền tảng (đã xác nhận ở FP2):
> **"Hệ thống tốt nhất là hệ thống Tăng cường (Augment) con người, chứ không Thay thế (Replace) con người."**
> — _Nguyên lý Rào cản Adoption, file KHantix - FP2_

---

## 1. LỖ HỔNG 1: EXPLAINABLE REPORT SCHEMA

### A. Bản chất của vấn đề (FP0)

- **Q: Tại sao cần "Show the math"?**
  - Vì trong B2B, người ký duyệt (CFO, CTO khách hàng) không bao giờ chấp nhận một con số rơi từ trời xuống. Họ hỏi: _"850 triệu này cấu thành từ đâu? Tại sao cái Data Cleansing mất 30%?"_. Pre-sales phải trả lời được, và Pre-sales chỉ trả lời được khi AI đã mổ xẻ sẵn.

- **Q: Báo cáo này phục vụ ai?**
  - **Đối tượng 1 — Pre-sales (Nội bộ):** Đọc để hiểu logic AI, tinh chỉnh trước khi trình Sếp.
  - **Đối tượng 2 — Quản lý/Sếp (Nội bộ):** Đọc để duyệt và chốt Margin cuối cùng.
  - **Đối tượng 3 — Khách hàng (Bên ngoài):** Nhận bản rút gọn (không lộ Margin nội bộ), chỉ thấy breakdown Effort + giá trị thực nhận.

### B. Output Report Schema (Cấu trúc Báo cáo)

Hệ thống Math Engine sau khi tính toán xong **PHẢI** xuất ra một báo cáo theo cấu trúc dưới đây. Báo cáo gồm **4 Phần** bắt buộc:

---

#### PHẦN I — TÓM TẮT NHU CẦU (Requirement Summary)

Nội dung: Liệt kê các yêu cầu cốt lõi AI đã ghi nhận từ cuộc hội thoại.

```markdown
## Tóm tắt Nhu cầu Khách hàng
| # | Yêu cầu ghi nhận | Nguồn (Câu hỏi số / Slot) |
|---|---|---|
| 1 | Hệ thống quản lý kho cho chuỗi 50 chi nhánh | Câu hỏi #1, Slot: `Scope` |
| 2 | Tích hợp với phần mềm kế toán MISA hiện tại | Câu hỏi #4, Slot: `Integration_Risk` |
| 3 | Đội ngũ chủ yếu là dược sĩ, ít quen công nghệ | Câu hỏi #6, Slot: `Tech_Literacy_Risk` |
```

**Mục đích:** Pre-sales kiểm tra AI có "nghe" đúng ý khách không. Nếu sai → quay lại sửa trước khi tính.

---

#### PHẦN II — BÁO CÁO GIÁ BASE (Base Cost Breakdown)

Nội dung: Mổ xẻ từng thành phần Lớp 1 (Giá vốn cứng) với công thức và số liệu cụ thể.

```markdown
## Bảng Phân tích Giá Vốn (Base Cost) — Lớp 1
| Hạng mục | Công thức / Cơ sở tính | Giá trị |
|---|---|---|
| **License phần mềm** | Gói Enterprise × 50 users (Tier 50) | 80,000,000 ₫ |
| **Hạ tầng Server** | AWS EC2 t3.large × 12 tháng | 36,000,000 ₫ |
| **ManDays (Nhân sự)** | 30 ngày × Rate Senior 3,000,000 ₫/ngày | 90,000,000 ₫ |
| | 20 ngày × Rate Junior 1,500,000 ₫/ngày | 30,000,000 ₫ |
| **Tổng Base Cost** | | **236,000,000 ₫** |

> **Ghi chú tối ưu:** Hệ thống phát hiện gói License 50 users (80tr) rẻ hơn mua lẻ 50 × 2tr = 100tr.
> Tiết kiệm cho khách: 20,000,000 ₫.
```

**Mục đích:** Minh bạch tuyệt đối. Pre-sales có thể copy-paste bảng này vào email gửi khách (sau khi bỏ phần Margin ở Phần IV).

---

#### PHẦN III — BÁO CÁO BUFFER RỦI RO (Risk Assessment)

Nội dung: Từng rủi ro AI phát hiện, kèm **Bằng chứng** (câu nói của khách) và **Lý do** gán hệ số.

```markdown
## Đánh giá Rủi ro & Buffer — Lớp 2

### Rủi ro 1: Data Cleansing (Dữ liệu bẩn)
- **Mức đánh giá AI:** 🔴 HIGH (+30%)
- **Bằng chứng:** Câu hỏi #3 — Khách trả lời: _"Bên anh đang lưu trên Excel, mỗi chi nhánh một file riêng, 5 năm nay rồi."_
- **Logic suy luận:** Khớp Heuristic `if_user_says_symptoms: ["Excel tự do"]` → `Data_Risk = HIGH` → Buffer +30% ManDays
- **Tác động lên giá:** ManDays tăng thêm = 50 ngày × 30% = **15 ngày** → +37,500,000 ₫
- **⚠️ Đề xuất cho Pre-sales:** _Nếu khách đã có kế hoạch chuyển ERP hoặc dữ liệu đã được chuẩn hóa một phần, có thể hạ xuống MEDIUM (+15%)._

### Rủi ro 2: Tích hợp hệ thống (Integration)
- **Mức đánh giá AI:** 🟡 MEDIUM (+15%)
- **Bằng chứng:** Câu hỏi #4 — Khách xác nhận dùng MISA phiên bản có API mở.
- **Logic suy luận:** Khớp Heuristic `["đang dùng MISA"]` → Ban đầu `HIGH`, nhưng phát hiện thêm triệu chứng `["có API"]` → Hạ xuống `MEDIUM`
- **Tác động lên giá:** ManDays tăng thêm = 50 ngày × 15% = **7.5 ngày** → +18,750,000 ₫

### Rủi ro 3: Kháng cự Công nghệ (Tech Literacy)
- **Mức đánh giá AI:** 🔴 HIGH (+15%)
- **Bằng chứng:** Câu hỏi #6 — _"Đội ngũ chủ yếu là dược sĩ bán thuốc, không rành IT."_
- **Logic suy luận:** Khớp Heuristic `["ít dùng smartphone", "ngại đổi mới"]` → `Tech_Literacy_Risk = HIGH`
- **Tác động lên giá:** ManDays tăng thêm = 50 ngày × 15% = **7.5 ngày** → +18,750,000 ₫

---

### Tổng hợp Buffer
| Rủi ro | Hệ số | ManDays bổ sung | Chi phí bổ sung |
|---|---|---|---|
| Data Cleansing | +30% | 15 ngày | 37,500,000 ₫ |
| Integration | +15% | 7.5 ngày | 18,750,000 ₫ |
| Tech Literacy | +15% | 7.5 ngày | 18,750,000 ₫ |
| **Tổng Buffer** | **+60%** | **30 ngày** | **75,000,000 ₫** |

> **$Effort_{Adjusted}$** = 50 ngày gốc + 30 ngày buffer = **80 ngày**
> **$Cost_{Adjusted}$** = 236,000,000 + 75,000,000 = **311,000,000 ₫**
```

**Mục đích:** Pre-sales nhìn thấy tận mắt **TẠI SAO** AI tính thêm 75 triệu. Từng dòng đều có bằng chứng từ lời khách nói. Pre-sales có quyền đồng ý hoặc ghi đè (xem Phần tiếp theo — Lỗ hổng 2).

---

#### PHẦN IV — GỢI Ý 3 PHƯƠNG ÁN GIÁ (Pricing Options)

Nội dung: AI sinh ra 3 mức giá dựa trên Cost Adjusted + các kịch bản Margin/Strategy khác nhau. **Tất cả là "Gợi ý", không phải "Quyết định".**

```markdown
## Gợi ý 3 Phương án Báo giá — Lớp 3

> ⚠️ **LƯU Ý: Đây là giá GỢI Ý của AI. Pre-sales cần review và điều chỉnh
> trước khi trình Ban Giám Đốc duyệt.**

| | 🟢 Gói Tiết kiệm | 🔵 Gói Tiêu chuẩn | 🔴 Gói Tốc độ |
|---|---|---|---|
| **Cost Adjusted (Lớp 1+2)** | 311,000,000 ₫ | 311,000,000 ₫ | 311,000,000 ₫ |
| **Margin gợi ý** | 20% (Chuẩn ngành thấp) | 25% (Chuẩn ngành) | 30% (Premium) |
| **K_Strategy** | 1.0 (Không điều chỉnh) | 1.0 | 1.3 (Rush × OT) |
| **Discount thanh toán** | -3% (Trả trước 50%) | 0% | 0% |
| **💰 Giá Final gợi ý** | **377,041,000 ₫** | **414,667,000 ₫** | **577,857,000 ₫** |
| **Ghi chú** | Resource Mix nhiều Junior, timeline kéo dài 4 tháng | Đội hình chuẩn, timeline 3 tháng | Chạy gấp 1.5 tháng, toàn Senior, OT |

### Công thức tính (minh bạch cho Pre-sales kiểm chứng):
- **Gói Tiêu chuẩn:** $Price = \frac{311,000,000}{1 - 0.25} \times 1.0 \times (1 - 0) = 414,667,000$ ₫
- **Gói Tốc độ:** $Price = \frac{311,000,000}{1 - 0.30} \times 1.3 \times (1 - 0) = 577,857,000$ ₫

### Phân tích Margin nội bộ (CHỈ DÀNH CHO NỘI BỘ — KHÔNG GỬI KHÁCH):
| | Tiết kiệm | Tiêu chuẩn | Tốc độ |
|---|---|---|---|
| Lợi nhuận gộp dự kiến | 66,041,000 ₫ | 103,667,000 ₫ | 266,857,000 ₫ |
| Gross Margin % | 17.5% | 25.0% | 46.2% |
```

**Mục đích:** Pre-sales thấy rõ 3 kịch bản, kèm công thức tính ngược để tự kiểm chứng. Margin được tách riêng phần "Chỉ nội bộ" để không bao giờ lộ ra ngoài.

---

#### PHẦN V — METADATA & TRUY VẾT (Audit Trail)

```markdown
## Metadata Báo cáo
- **Session ID:** KHX-2026-0411-001
- **Thời gian tạo:** 2026-04-11 15:30:00 UTC+7
- **Số lượt hội thoại AI:** 8 câu hỏi
- **Slots đã điền:** 6/8 (2 slot còn UNKNOWN → AI dùng giá trị mặc định MEDIUM)
- **Slots dùng giá trị mặc định:**
  - `Hardware_Dependency`: UNKNOWN → Mặc định MEDIUM (+10%)
  - `Decision_Maker_Complexity`: UNKNOWN → Mặc định MEDIUM (+10%)
- **Phiên bản Heuristic Matrix:** v1.2 (2026-03-28)
```

**Mục đích:** Truy vết và kiểm toán. Nếu 6 tháng sau dự án lỗ, có thể mở lại xem AI phán đoán thế nào, Pre-sales sửa chỗ nào, Sếp duyệt con số nào.

---

## 2. LỖ HỔNG 2: PRE-SALES OVERRIDE (TINH CHỈNH THỦ CÔNG)

### A. Bản chất của vấn đề (FP0)

- **Q: Tại sao Pre-sales PHẢI có quyền ghi đè?**
  - Vì AI suy luận dựa trên Heuristic (Quy tắc kinh nghiệm), nhưng **Thực tế luôn có ngoại lệ**. Pre-sales là người gặp khách trực tiếp, nghe giọng nói, đọc ngôn ngữ cơ thể — những thứ mà AI không bao giờ có.
  - _Ví dụ:_ AI nghe "Excel" → Gán `Data_Risk = HIGH (+30%)`. Nhưng Pre-sales biết rằng khách này đã thuê đội IT dọn dẹp data từ 3 tháng trước → Thực tế chỉ cần `MEDIUM (+15%)`.

- **Q: Override ở đâu trong Workflow?**
  - Ngay **SAU** khi Math Engine tính xong và **TRƯỚC** khi sinh báo cáo cuối cùng. Đây là "Cửa" mà Phase 1 thiếu.

- **Q: Override có làm mất tính minh bạch không?**
  - **KHÔNG**, nếu ta bắt buộc ghi lại lý do Override (Audit Log). Mọi thay đổi đều được track.

### B. Kiến trúc Override (Thiết kế hệ thống)

#### Workflow mới (đã vá lỗ hổng):

```
┌─────────────────────────────────────────────────────────────────────┐
│  WORKFLOW CŨ (Phase 1) — Thiếu bước Human-in-the-loop             │
│                                                                     │
│  Khách ←→ AI Bot → JSON Slots → Math Engine → Giá cuối → Khách    │
│                                          ↑                         │
│                                     (Không ai kiểm tra)            │
└─────────────────────────────────────────────────────────────────────┘

                              ▼ VÁ THÀNH ▼

┌─────────────────────────────────────────────────────────────────────┐
│  WORKFLOW MỚI (Phase 2) — Human-in-the-loop                        │
│                                                                     │
│  1. Pre-sales nhập Brief ──→ AI Bot suy luận Slots                 │
│                                      │                              │
│  2. Math Engine tính ←───────────────┘                              │
│        │                                                            │
│  3. Sinh Báo cáo Nháp (Explainable Report v1)                     │
│        │                                                            │
│  4. ★ PRE-SALES REVIEW & OVERRIDE ★                                │
│        │  ├─ Đọc báo cáo giải thích                                │
│        │  ├─ Điều chỉnh Buffer / Margin / Slots                    │
│        │  └─ Ghi lý do Override (bắt buộc)                         │
│        │                                                            │
│  5. Math Engine TÍNH LẠI (với giá trị đã Override)                 │
│        │                                                            │
│  6. Sinh Báo cáo Final (Explainable Report v2)                    │
│        │                                                            │
│  7. Pre-sales trình Sếp duyệt                                     │
│        │  ├─ Sếp duyệt ✅ → Chốt giá                               │
│        │  └─ Sếp yêu cầu sửa 🔄 → Quay lại bước 4                 │
│        │                                                            │
│  8. Xuất Báo giá chính thức gửi Khách                              │
│        (Bản rút gọn: Không có Margin, chỉ có Effort Breakdown)    │
└─────────────────────────────────────────────────────────────────────┘
```

#### Các trường có thể Override:

| Nhóm | Trường | Kiểu Override | Ràng buộc |
| :--- | :--- | :--- | :--- |
| **Lớp 2 — Risk Slots** | `Data_Risk` | Dropdown: NONE / LOW / MEDIUM / HIGH | Có thể hạ hoặc nâng tùy ý |
| | `Integration_Risk` | Dropdown: NONE / LOW / MEDIUM / HIGH | Có thể hạ hoặc nâng tùy ý |
| | `Tech_Literacy_Risk` | Dropdown: NONE / LOW / MEDIUM / HIGH | Có thể hạ hoặc nâng tùy ý |
| **Lớp 2 — Buffer %** | `Buffer mỗi Risk` | Slider: 0% → 50% | Mặc định theo Heuristic, Pre-sales kéo tùy ý |
| **Lớp 1 — ManDays** | `ManDays gốc` | Input số | Pre-sales có thể sửa nếu đã tham vấn Tech Lead |
| **Lớp 1 — Resource Mix** | `Tỷ lệ Senior / Junior` | Slider 0-100% | Ảnh hưởng trực tiếp đến Rate trung bình |
| **Lớp 3 — Margin** | `Target Margin %` | Input số | ⚠️ Có thể bị khóa bởi Sếp (Company Policy) |
| **Lớp 3 — K_Strategy** | `Hệ số Chiến lược` | Slider: 0.7 → 1.5 | Pre-sales đề xuất, Sếp duyệt |
| **Lớp 3 — Discount** | `Chiết khấu thanh toán` | Input % | Theo chính sách công ty |

### C. Override Audit Log Schema

Mỗi lần Pre-sales sửa một giá trị, hệ thống **BẮT BUỘC** ghi lại:

```json
{
  "session_id": "KHX-2026-0411-001",
  "overrides": [
    {
      "field": "Data_Risk",
      "ai_original_value": "HIGH",
      "ai_original_buffer": 0.30,
      "overridden_value": "MEDIUM",
      "overridden_buffer": 0.15,
      "reason": "Khách đã có kế hoạch chuyển ERP từ Q3/2026, đội IT nội bộ đã dọn dẹp data 3 tháng nay.",
      "overridden_by": "Nguyen Van A (Pre-sales)",
      "timestamp": "2026-04-11T16:00:00+07:00"
    },
    {
      "field": "Target_Margin",
      "ai_original_value": 0.25,
      "overridden_value": 0.20,
      "reason": "Khách hàng là đối tác chiến lược, Sếp duyệt giảm Margin để giữ deal dài hạn.",
      "overridden_by": "Tran Van B (Sales Director)",
      "approved_by": "Le Van C (CEO)",
      "timestamp": "2026-04-11T17:30:00+07:00"
    }
  ],
  "price_comparison": {
    "ai_suggested_price": 414667000,
    "final_price_after_override": 365294000,
    "delta": -49373000,
    "delta_percent": "-11.9%"
  }
}
```

**Mục đích:** 
1. **Truy vết trách nhiệm:** AI đề xuất giá X, Pre-sales sửa thành Y vì lý do Z. Nếu dự án lỗ, biết chính xác ai quyết định con số nào.
2. **Học từ Override:** Nếu 80% Pre-sales đều hạ `Data_Risk` từ HIGH xuống MEDIUM trong ngành Dược → Heuristic Matrix cần update lại để AI thông minh hơn ở lần sau (Feedback Loop).
3. **Tuân thủ nội bộ:** Sếp nhìn log biết Pre-sales có đang giảm giá bừa không.

### D. Phân quyền Override (Authorization Matrix)

Không phải ai cũng được sửa mọi thứ:

| Vai trò | Được Override | Cần duyệt bởi |
| :--- | :--- | :--- |
| **Pre-sales / BA** | Risk Slots (Lớp 2), ManDays, Resource Mix | Tự quyết |
| **Pre-sales / BA** | Buffer % (kéo slider) | Tự quyết, nhưng hệ thống cảnh báo nếu hạ quá 50% so với AI |
| **Pre-sales / BA** | Margin %, K_Strategy | ❌ Chỉ được ĐỀ XUẤT, Sếp duyệt |
| **Sales Manager / Director** | Margin %, K_Strategy, Discount | Tự quyết |
| **CEO / CFO** | Mọi trường | Tự quyết (Final Approval) |

---

## 3. XÁC NHẬN NGUYÊN LÝ KHỞI NGUYÊN (First Principle)

> **Nguyên lý Bộ ba Minh bạch (The Transparency Triad):**
> 
> Một hệ thống AI Pricing muốn được Sales/Pre-sales tin tưởng và sử dụng lâu dài phải thỏa mãn đồng thời 3 điều kiện:
> 1. **Giải thích được (Explainable):** Mọi con số đều có nguồn gốc truy vết được (Bằng chứng từ lời khách + Logic Heuristic + Công thức Math).
> 2. **Sửa được (Overridable):** Con người giữ quyền quyết định cuối cùng. AI đề xuất, Người chốt.
> 3. **Truy vết được (Auditable):** Mọi thay đổi (của AI lẫn Người) đều được ghi lại, không ai "ém" được con số.
>
> Thiếu bất kỳ 1 trong 3 → Hệ thống sẽ bị bỏ rơi trong vòng 3 tháng, giống như 70% dự án CPQ trên thế giới.

---

## 4. CHECKLIST TRIỂN KHAI CHO TEAM DEV

### Lỗ hổng 1 — Explainable Report:
- [ ] **Backend:** Thiết kế Report Generator nhận JSON Slots + Math Output → Sinh Markdown Report theo 5 Phần (Tóm tắt nhu cầu, Base Cost, Risk Assessment, 3 Phương án giá, Metadata).
- [ ] **Backend:** Tách 2 template: **Bản Nội bộ** (có Margin, có Audit Log) và **Bản Khách hàng** (chỉ có Effort Breakdown + Giá Final, không lộ Margin).
- [ ] **Frontend:** Render Markdown Report trên giao diện Web (hoặc xuất PDF).
- [ ] **AI Prompt:** Bổ sung vào `<Output_Schema>` trường `evidence` cho mỗi Slot — AI phải trích dẫn chính xác câu nói của khách làm bằng chứng.

### Lỗ hổng 2 — Pre-sales Override:
- [ ] **Frontend:** Xây giao diện Override Console với Dropdown (Risk Level) + Slider (Buffer %) + Input (ManDays, Margin) + Textarea bắt buộc (Lý do Override).
- [ ] **Backend:** API nhận Override payload → Validate phân quyền → Ghi Audit Log → Gọi lại Math Engine tính lại → Sinh Report v2.
- [ ] **Backend:** Implement Feedback Loop — Aggregate Override data hàng tháng để đề xuất update Heuristic Matrix.
- [ ] **Database:** Thêm bảng `override_logs` lưu trữ toàn bộ lịch sử Override theo Session.

---

## 5. GỢI Ý HƯỚNG ĐI TIẾP THEO

- **Q1:** Giao diện Override Console nên thiết kế UX/UI như thế nào để Pre-sales thao tác nhanh hơn Excel? → Nghiên cứu: Figma prototype cho Override Console (Slider + Live Preview giá thay đổi real-time).
- **Q2:** Làm sao để Feedback Loop từ Override data tự động cải thiện Heuristic Matrix? → Nghiên cứu: Reinforcement Learning from Human Feedback (RLHF) đơn giản hóa cho bảng Heuristic.
- **Q3:** Bản Báo cáo gửi Khách hàng nên format thế nào cho chuyên nghiệp? → Nghiên cứu: Template Proposal/Quotation chuẩn B2B IT (ScopeStack, PandaDoc).
