# [ID-Đội thi] - Đề tài 5: AI-Driven Pricing Recommendation System
**Giải pháp Đề xuất Định giá Tự động với 3 Phương án, Breakdown, Margin & Effort**

---

## 1. Vấn đề và Người dùng (Problem & Target Audience)

### 1.1. Bài toán đang giải quyết
*(Mô tả ngắn gọn khó khăn hiện tại của doanh nghiệp khi làm báo giá)*
*   **Vấn đề:** Quá trình định giá phần mềm/dự án CNTT hiện tại phụ thuộc nhiều vào kinh nghiệm cá nhân (heuristic), dễ dẫn đến sai số (under-estimate hoặc over-estimate).
*   **Khó khăn:** Mất nhiều thời gian để tính toán Effort (công sức), đánh giá Risk (rủi ro) và ra quyết định Margin (biên lợi nhuận) phù hợp để vừa có lãi, vừa trúng thầu. Thiếu cơ chế đưa ra các rổ giá (Tiers) linh hoạt cho khách hàng.

### 1.2. Người dùng mục tiêu (Persona)
*   **Pre-sales / Solution Architect:** Người trực tiếp nhập liệu, thiết kế hệ thống và cần tính toán Base Cost.
*   **Sale / Account Manager:** Người cần các phương án giá (3 Tiers) để đàm phán với khách hàng.
*   **C-Level / Quản lý:** Người phê duyệt Margin và đánh giá rủi ro (Risk & Complexity) của dự án.

---

## 2. Cách làm và Kiến trúc Tổng quan (High-level Architecture & Approach)

### 2.1. Phương pháp tiếp cận (Hybrid Approach)
*(Kết hợp giữa Heuristic/Rule-based và LLM để đảm bảo tính chính xác)*
*   **Đầu vào (Input):** Yêu cầu tính năng (Features/Modules), Phi năng (Non-functional), Môi trường (Server/License).
*   **Xử lý (Logic & AI):** 
    *   Sử dụng LLM để trích xuất thông tin và phân tích ngữ cảnh.
    *   Sử dụng các công thức Toán học (Deterministic) & Ma trận Heuristic để tính toán nỗ lực (COCOMO Effort Multipliers).

### 2.2. Chi tiết Mô hình Định giá (Pricing Breakdown)
Hệ thống phân rã định giá thành 3 lớp (Layers) minh bạch:
*   **Lớp 1 - Base Cost (Chi phí cơ sở):** Dựa trên Module Catalog, phân rã Effort (Man-days) cho Dev, Test, BA, PM. Bao gồm cả chi phí Server & License (New).
*   **Lớp 2 - Rủi ro & Phức tạp (Risk & Complexity):** Áp dụng các hệ số hiệu chỉnh (Effort Multipliers / COCOMO) dựa trên team size, tech stack, hệ thống legacy.
*   **Lớp 3 - Thương mại (Commercial & Margin):** Tính toán điểm hòa vốn, áp dụng markup/margin mong muốn.

### 2.3. Đề xuất 3 Phương án Giá (3 Tiers Pricing Strategy)
Hệ thống tự động sinh ra 3 gói (Options) để Sale đàm phán:
1.  **Gói Cơ bản (Essential/Conservative):** Scope tối thiểu, dùng Open-source, margin thấp (cạnh tranh giá).
2.  **Gói Tiêu chuẩn (Standard/Recommended):** Scope đầy đủ, kiến trúc ổn định, margin tiêu chuẩn (cân bằng).
3.  **Gói Cao cấp (Premium/Aggressive):** Kèm SLA cao, support 24/7, hạ tầng Enterprise, margin cao (tối ưu lợi nhuận).

### 2.4. Sơ đồ Kiến trúc Tổng quan (Architecture Diagram)
*(Chèn hình ảnh hoặc mô tả text sơ đồ luồng dữ liệu kiến trúc hệ thống của bạn ở đây)*
*   *VD: Frontend (React) -> Backend API (Node/.NET) -> AI Orchestrator (LangChain/Gemini) -> Heuristic Database -> Report Generator.*

---

## 3. Giá trị mang lại & Cách đo lường hiệu quả (Value & Metrics)

### 3.1. Giá trị giải pháp (Business Value)
*   **Tính minh bạch (Explainability):** Break-down rõ ràng số Man-days, lý do áp dụng Risk, và thành phần tạo nên giá trị gói.
*   **Tăng tốc độ (Speed):** Rút ngắn thời gian lập báo giá từ vài ngày xuống còn vài giờ/vài phút.
*   **Tối ưu đàm phán (Win-rate):** 3 phương án giá giúp khách hàng có sự lựa chọn (Anchoring effect), tránh việc chỉ trả lời "Có/Không" với khách hàng.

### 3.2. Đo lường hiệu quả (Success Metrics / KPIs)
*(Cách nhóm chứng minh sản phẩm "đáng dùng")*
1.  **Rút ngắn thời gian:** % thời gian giảm thiểu khi tạo một báo giá mới chuẩn xác.
2.  **Độ chính xác (Accuracy):** Mức độ sai lệch (variance) giữa giá dự kiến hệ thống đưa ra và giá chốt thực tế.
3.  **Tỷ lệ Win-rate:** Khả năng chốt deal tăng lên nhờ chiến lược giá 3 Tiers.

---

## 4. [Khuyến khích] Đề án Kinh doanh & Demo (Optional)

### 4.1. Kịch bản Demo (Demo Scenario Walkthrough)
*   *Bước 1:* Sale nhập mô tả dự án từ khách hàng bằng văn bản (hoặc file).
*   *Bước 2:* Hệ thống tự động phân tách các Module, gợi ý Base Cost (Lớp 1).
*   *Bước 3:* Sale chọn các yếu tố môi trường, hệ thống tính toán Risk (Lớp 2).
*   *Bước 4:* Hệ thống xuất ra bảng Excel/PDF Report với 3 Tiers (Lớp 3) đi kèm giải thích.

### 4.2. Business Case (Tương lai của sản phẩm)
*   Nếu phát triển thành SaaS Product, có thể bán cho các công ty Outsourcing/SI dưới dạng Subscription (Tính phí theo số lượng Báo giá/tháng hoặc User).