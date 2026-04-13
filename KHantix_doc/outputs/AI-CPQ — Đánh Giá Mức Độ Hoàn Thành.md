# KHantix AI-CPQ — Đánh Giá Mức Độ Hoàn Thành

_Cập nhật: 2026-04-13 | Dựa trên codebase hiện tại_

---

## TL;DR — Tổng điểm: ~58% hoàn thành

| Tiêu chí AI-CPQ | Trọng số | Đạt được | Điểm |
|---|---|---|---|
| 1. Dữ liệu lịch sử thắng/thua deal | 25% | ❌ 0% | 0/25 |
| 2. Đánh giá rủi ro đa chiều (Fin + Deal + Churn) | 30% | 🟡 55% | 16.5/30 |
| 3. Explainable AI — Sales tin tưởng | 25% | 🟢 80% | 20/25 |
| 4. Human Override + Audit Log | 20% | 🟡 65% | 13/20 |
| **TỔNG** | **100%** | | **~50/100** |

> **Lưu ý:** Trọng số phản ánh mức độ quan trọng của từng tiêu chí trong một hệ thống CPQ thực chiến.

---

## 1. ❌ Dữ liệu Lịch sử Thắng/Thua Deal — 0/25

**Trạng thái:** Hoàn toàn chưa có.

**Thực tế hiện tại:**
- Hệ thống tính giá dựa trên công thức COCOMO thuần túy — **không có memory về lịch sử**.
- Mỗi session bắt đầu từ đầu, không tra cứu kết quả deal tương tự.
- Không có database ghi nhận: "Deal X (profile tương tự) → Win/Loss ở mức giá Y".

**Những gì cần để đạt được:**
```
Deal History DB
  └── deal_id, profile_vector (12 EM values), final_price, outcome (win/loss), margin
  └── Mỗi khi close deal → ghi vào DB

Similarity Lookup (khi tính giá mới)
  └── Find top-3 historical deals gần nhất (cosine similarity trên 12 EM)
  └── Nếu deal tương tự → Lose → AI cảnh báo "Giá này từng thua"
  └── Nếu tương tự → Win → AI boost confidence
```

**Khoảng cách:** Cần thiết kế Deal DB, Similarity Engine, và training pipeline. Đây là **Big Feature** không thể làm trong bootcamp.

---

## 2. 🟡 Đánh Giá Rủi Ro Đa Chiều — 16.5/30

### ✅ Đã có: Technical Risk (COCOMO D/I/T)

| EM | Loại rủi ro | Trạng thái |
|---|---|---|
| EM_D1, D2, D3 | **Data Risk** — Format, Volume, Integrity | ✅ Có compound multiplier |
| EM_I1, I2 | **Integration Risk** — API, Legacy | ✅ Có |
| EM_T1, T2 | **Training Risk** — User age, Prior EXP | ✅ Có |
| EM_B1, B2 | **Base Cost Risk** — Onsite, HW | ✅ Có |
| EM_C1 | **Timeline Risk** — Rush factor | ✅ Có |

**Tổng: 9/12 EMs là Technical Risk — đây là thành quả cốt lõi của refactor này.**

### ❌ Chưa có: Financial Risk Dimension

```
Financial Risk:
  - Khả năng thanh toán của khách (tín dụng xấu?)
  - Xác suất thanh toán trễ / nợ xấu
  - Working capital impact nếu dự án kéo dài
```

### ❌ Chưa có: Deal Risk Dimension (Win Probability)

```
Deal Risk:
  - Có bao nhiêu đối thủ cạnh tranh trong deal này?
  - Khách hàng đang mua hay chỉ RFI để benchmark?
  - Buying committee có champion nội bộ chưa?
  - Deal cycle length dự kiến
```

### ❌ Chưa có: Churn Risk (Post-sale)

```
Churn Risk (quan trọng nếu SaaS):
  - NPS dự đoán sau triển khai
  - Mức độ phụ thuộc của khách vào hệ thống
  - Khả năng upsell năm 2
```

**EM_C2 (Client Logo) và EM_C3 (Payment Term)** đang chạm vào góc cạnh Commercial, nhưng **chưa đủ chi tiết** để gọi là Financial Risk hay Churn Risk.

---

## 3. 🟢 Explainable AI — 20/25

**Đây là điểm mạnh nhất của kiến trúc hiện tại.**

### ✅ Đã hoàn chỉnh

| Tính năng | Trạng thái |
|---|---|
| AI trả về `evidence` (trích dẫn lời khách) | ✅ Có trong schema |
| AI trả về `reasoning` (giải thích con số) | ✅ Có trong schema |
| Báo cáo giá hiển thị `narrative` tự sinh (không template cứng) | ✅ Có |
| Risk Adjustments list theo từng EM với lý do | ✅ Có |
| Compound Multiplier hiển thị real-time | ✅ Có |
| Confidence badge (high/medium/low) | ✅ Có trong data model |

### 🟡 Còn yếu

| Vấn đề | Chi tiết |
|---|---|
| **Evidence chưa hiển thị trên UI** | `evidence` và `reasoning` đã có trong backend session nhưng **App.js chưa render** ra màn hình. Sales không thấy. |
| **Confidence badge chưa hiển thị trên EM card** | Backend có `confidence` nhưng UI chỉ hiện text nhỏ, không có màu sắc phân biệt rõ ràng. |
| **Báo cáo chưa có "What-if" scenario** | Pre-sales không thể thấy "Nếu tôi giảm Rush Factor từ 1.35 xuống 1.1 thì giá giảm bao nhiêu?" |

---

## 4. 🟡 Human Override + Audit Log — 13/20

### ✅ Đã có

| Tính năng | Trạng thái |
|---|---|
| API `/api/override` nhận EM overrides | ✅ |
| Server ghi `OverrideLogEntry` với em_id, originalValue, newValue, reason, overriddenBy, timestamp | ✅ |
| Audit Log hiển thị trên UI | ✅ (cơ bản) |
| Clamp giá trị override trong [Min, Max] | ✅ |

### ❌ Còn thiếu

| Vấn đề | Chi tiết |
|---|---|
| **Không có Override Slider trực tiếp** | UI hiện tại chỉ có Man-Days và Role override. Pre-sales **không thể override từng EM bằng slider** ra con số cụ thể. |
| **Audit Log không persistent** | Log mất sau khi restart server (In-memory only). |
| **Không có approval workflow** | Nếu Pre-sales muốn giảm giá quá threshold, không có cơ chế yêu cầu Manager approve. |
| **Audit Log UI chỉ hiện entry cuối** | Code `appendAuditLogs` chỉ render `logs[logs.length - 1]`. |

