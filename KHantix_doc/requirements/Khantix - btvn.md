
#### 1. Persona & Job-to-be-done (Chân dung & Việc cần làm)

- **Persona:** Nam, Senior Pre-sales Engineer (30 tuổi). Chuyên phụ trách các dự án tích hợp hệ thống (Hardware + Software + Service).
    
    - Tính cách/Áp lực: Cẩn trọng nhưng chịu áp lực thời gian cực lớn từ Sales Manager ("Gửi báo giá ngay đi em") và sự soi xét gắt gao từ Giám đốc Kỹ thuật ("Đừng có bán rẻ sức lao động của anh em").
        
- **Job-to-be-done (JTBD):**
    
    - "Khi tôi nhận được yêu cầu sơ bộ từ khách hàng, tôi muốn **ước lượng chính xác chi phí triển khai (Effort)** và **tạo ra 3 phương án báo giá tối ưu (Good-Better-Best)** trong vòng dưới 30 phút, để tôi có thể gửi cho khách hàng nhanh hơn đối thủ mà không lo bị lỗ vốn khi triển khai."
#### 2. Workflow (Luồng công việc hiện tại - AS-IS)

1. **Nhận yêu cầu:** Nhận email/Zalo từ khách với yêu cầu chung chung.

2. **Tra cứu thủ công (Manual Lookup):** Mở 3 file Excel (Giá thiết bị, Bảng lương kỹ thuật, Lịch sử dự án cũ).
    
3. **Đoán mò (Guesswork):** Tự ước lượng số ngày công (Man-days) dựa trên kinh nghiệm cá nhân (thường sai số lớn).
    
4. **Tính toán đơn tuyến:** Chỉ tính ra 1 phương án giá duy nhất. Copy-paste vào file Word mẫu.
    
5. **Xin duyệt (Approval Bottleneck):** Gửi sếp -> Sếp hỏi "Tại sao margin thấp thế?" -> Về làm lại -> Gửi lại (Mất 1-2 ngày).
#### 3. Top 3 Pain Points (Điểm đau cốt tử)

1. **Mù mờ về Effort (Effort Blindness):** Không thể biết chính xác độ phức tạp của dự án, dẫn đến báo giá dịch vụ quá thấp -> Dự án bị lỗ (Negative Margin).
    
2. **Quá tải tính toán (Cognitive Overload):** Không đủ khả năng não bộ để cân bằng 3 biến số (Giá cạnh tranh - Lợi nhuận an toàn - Rủi ro kỹ thuật) để tạo ra 3 gói báo giá cùng lúc.
    
3. **Chậm trễ (Latency):** Thời gian phản hồi (Turn-around time) quá lâu do thao tác thủ công và quy trình duyệt, khiến khách hàng "nguội" mất hứng thú.

#### 4. Thực trạng Dữ liệu (Data Reality - Quan trọng cho AI)

- **Dữ liệu có sẵn (Structured):** Bảng giá phần cứng (ERP), Lương nhân sự (HRM), Lịch sử thắng/thua thầu (CRM).
    
- **Dữ liệu hỗn độn (Unstructured/Missing):**
    
    - Mô tả yêu cầu của khách hàng (Email, Text).
        
    - Quan trọng nhất: Dữ liệu **"Actual Effort"** (Thực tế triển khai mất bao nhiêu giờ) thường nằm rải rác trên Jira/Trello hoặc file Excel của PM, chưa được map ngược lại với lúc báo giá. -> **Đây là thách thức lớn nhất của AI.**


### PHẦN A.2: POV + HMW (ĐỊNH NGHĨA VẤN ĐỀ & CÂU HỎI MỞ)

Mục tiêu: Đóng gói lại toàn bộ nỗi đau thành một tuyên bố sắc bén, kèm theo các điều kiện ràng buộc kỹ thuật của AI để chuẩn bị cho giải pháp.

#### 1. Point Of View (POV) - Tuyên bố vấn đề
*Công thức: [Người dùng] CẦN [Nhu cầu] VÌ [Insight/Bối cảnh].*

> **"Nam, một nhân viên Pre-sales B2B, CẦN một trợ lý thông minh để chuyển đổi nhanh các yêu cầu mơ hồ của khách hàng thành 3 phương án báo giá có lợi nhuận an toàn, VÌ việc ước lượng thủ công hiện tại thường xuyên sai lệch về nỗ lực triển khai (Effort), dẫn đến dự án bị lỗ vốn hoặc mất quá nhiều thời gian để sửa đổi."**

#### 2. AI Operational Conditions (Điều kiện vận hành bắt buộc)
*Đây là phần quan trọng để phân biệt bài toán AI với bài toán phần mềm thông thường:*

*   **Quyết định cần cải thiện:** Quyết định **"Ước lượng rủi ro nỗ lực (Effort Estimation)"** và **"Cấu trúc gói giá (Pricing Structure)"**.
*   **Độ trễ (Latency):** **Near Real-time (Gần thời gian thực)**. Khi Nam nhập xong yêu cầu, hệ thống phải trả về kết quả trong dưới 30 giây để Nam có thể phản hồi khách ngay trong cuộc họp hoặc ngay sau đó.
*   **Chi phí/Hậu quả sai sót (Cost of Error):** **Cao**.
    *   *AI đoán thiếu effort:* Công ty lỗ hàng trăm triệu chi phí nhân sự.
    *   *AI đoán thừa effort:* Giá quá cao -> Trượt thầu.
    *   *Giải pháp:* AI phải thiên về hướng "An toàn" (Conservative) và luôn cảnh báo các biến số rủi ro.
*   **Human-in-the-loop (HITL):** **Bắt buộc (Mandatory)**. AI chỉ đóng vai trò *Recommendation (Gợi ý)*. Nam (Pre-sales) và Sếp (Manager) phải là người duyệt cuối cùng trước khi gửi đi. AI không bao giờ được tự động gửi báo giá cho khách.

#### 3. How Might We (HMW) - Câu hỏi mở hướng giải pháp
*Từ POV và Điều kiện vận hành, ta đặt ra các câu hỏi để kích thích ý tưởng:*

1.  **HMW (Về Effort):** Làm thế nào để chúng ta dùng dữ liệu lịch sử các dự án đã triển khai (Actual logs) để **dự đoán độ phức tạp tiềm ẩn** của một khách hàng mới, ngay cả khi thông tin đầu vào còn sơ sài?
2.  **HMW (Về 3 Phương án):** Làm thế nào để chúng ta tự động tạo ra cấu trúc giá **3 lớp (Good-Better-Best)** nhằm tối đa hóa khả năng khách hàng chọn gói ở giữa (Target Option) mà vẫn đảm bảo biên lợi nhuận (Margin) trên 20%?
3.  **HMW (Về Tốc độ):** Làm thế nào để giảm thời gian soạn thảo một báo giá phức hợp từ **4 giờ xuống còn 5 phút**, giúp Pre-sales tập trung vào việc tư vấn thay vì nhập liệu?
4.  **HMW (Về Rủi ro):** Làm thế nào để chúng ta **trực quan hóa rủi ro tài chính** (như: "Nếu giảm giá này, bạn sẽ mất 3 tháng lương của team") ngay trên giao diện để ngăn chặn Sales giảm giá bừa bãi?

### PHẦN A.3: IDEA SHORTLIST & FEASIBILITY NOTES (DANH SÁCH Ý TƯỞNG & TÍNH KHẢ THI)

Mục tiêu: Từ các câu hỏi HMW, chọn ra giải pháp cụ thể nhất và kiểm tra xem nó có làm được không (Feasibility).

#### 1. Idea Shortlist (Ý tưởng cốt lõi)
Sau khi lọc các ý tưởng, chúng ta chốt lại giải pháp: **"The Smart Deal Architect" (Kiến trúc sư Báo giá Thông minh)**.

Giải pháp này hoạt động theo cơ chế 3 bước:
1.  **Input (Đầu vào):** Sales nhập các thông số định tính của khách hàng (Ngành nghề, quy mô user, hệ thống hiện tại, module mong muốn).
2.  **AI Core (Xử lý):**
    *   *Module 1 (Effort Prediction):* Quét dữ liệu lịch sử các dự án tương tự (Historical Projects) để dự đoán số giờ công (Man-days) thực tế và rủi ro tiềm ẩn.
    *   *Module 2 (Pricing Structure):* Tự động xây dựng 3 gói báo giá (Tiết kiệm - Tiêu chuẩn - Cao cấp) dựa trên biên lợi nhuận mục tiêu và hành vi mua hàng trong quá khứ.
3.  **Output (Đầu ra):** Một bảng so sánh 3 phương án kèm theo cảnh báo Margin (Đèn xanh/đỏ) để Sales trình bày ngay lập tức.

#### 2. Feasibility Notes (Kiểm tra tính khả thi - 6 câu hỏi)
Đây là phần quan trọng để chứng minh với giảng viên/Sếp là ý tưởng này "sống" được:

*   **Q1: Dữ liệu có sẵn không? (Data Availability)**
    *   *Trạng thái:* **Có nhưng Rời rạc (Medium)**.
    *   *Thách thức:* Dữ liệu báo giá (CRM) và Dữ liệu chấm công thực tế (Timesheet/Jira) đang nằm ở 2 nơi khác nhau.
    *   *Giải pháp:* Giai đoạn đầu cần làm bước "Data Cleaning" để map mã dự án giữa 2 hệ thống này lại với nhau thì AI mới học được.

*   **Q2: Công nghệ có phức tạp quá không? (Tech Complexity)**
    *   *Trạng thái:* **Khả thi (Low/Medium)**.
    *   *Kỹ thuật:* Không cần Generative AI quá cao siêu. Chỉ cần mô hình hồi quy (Regression) để dự đoán Effort và thuật toán tối ưu hóa (Optimization Algorithm) để chia 3 gói giá.

*   **Q3: Người dùng có dùng được không? (User Capability)**
    *   *Trạng thái:* **Dễ (Low)**.
    *   *Yêu cầu:* Giao diện phải cực đơn giản (Web Form). Sales chỉ cần chọn Dropdown và nhập số, không cần biết code.

*   **Q4: Có vi phạm đạo đức/pháp lý không? (Ethical/Legal)**
    *   *Trạng thái:* **An toàn**.
    *   *Lưu ý:* AI không được phân biệt giá dựa trên giới tính/chủng tộc của người mua (nhưng trong B2B ít gặp). Cần đảm bảo bảo mật thông tin giá vốn của công ty.

*   **Q5: Hiệu quả kinh doanh có rõ ràng không? (Business Viability)**
    *   *Trạng thái:* **Rất cao (High)**.
    *   *ROI:* Chỉ cần cứu được 1 dự án khỏi bị "Lỗ vốn" do báo giá sai Effort, hệ thống đã hoàn vốn đầu tư.

*   **Q6: Tích hợp hệ thống thế nào? (Integration)**
    *   *Trạng thái:* **Trung bình**.
    *   *Cách làm:* Ban đầu có thể chạy độc lập (Standalone Web Tool), sau này sẽ nhúng (Embed) vào CRM (Salesforce/HubSpot) qua API.

### PHẦN A.4: PROTOTYPE PLAN (KẾ HOẠCH NGUYÊN MẪU)

Mục tiêu: Thiết kế nhanh một phiên bản "nháp" của giải pháp để kiểm chứng với người dùng (Nam - Pre-sales) trước khi viết code thật. Nguyên mẫu này chia làm 2 lớp: Giao diện và Hành vi AI.

#### 1. Lớp Trải nghiệm Người dùng (Layer 1: UX/UI - Front Stage)
*Đây là những gì Sales sẽ nhìn thấy và tương tác trên màn hình.*

*   **Màn hình 1: Input Form (Nhập liệu nhanh)**
    *   *Thiết kế:* Một form đơn giản (giống Typeform) để giảm tải tâm lý.
    *   *Dữ liệu đầu vào:*
        *   **Khách hàng:** Ngành nghề (Retail/Logistics...), Quy mô (Số user).
        *   **Yêu cầu kỹ thuật:** Loại dự án (Triển khai mới/Nâng cấp), Các module cần có, Mức độ tùy biến (Low/Medium/High).
    *   *Nút hành động:* "Generate Pricing Options" (Tạo báo giá).

*   **Màn hình 2: Dashboard 3 Phương án (The 3-Tier Output)**
    *   *Thiết kế:* Hiển thị 3 cột song song: **Basic (Tiết kiệm) - Standard (Tiêu chuẩn) - Advanced (Cao cấp)**.
    *   *Nội dung mỗi cột:*
        *   Tổng giá trị (Total Price).
        *   Phạm vi công việc (Scope).
        *   **Chỉ số quan trọng:** Margin dự kiến (%).
    *   *Điểm nhấn:* Cột ở giữa (Standard) được highlight là "Recommended" (Khuyên dùng).

*   **Màn hình 3: Simulation & Warning (Mô phỏng & Cảnh báo)**
    *   *Thiết kế:* Một thanh trượt (Slider) "Discount".
    *   *Tương tác:* Khi Sales kéo thanh trượt giảm giá 5% -> Số Margin chuyển từ màu Xanh sang màu Cam ngay lập tức. Nếu giảm 10% -> Màu Đỏ + Hiện cảnh báo "Cần sếp duyệt".
    *   *Chức năng chỉnh sửa:* Sales có thể sửa thủ công số giờ công (Man-days) nếu thấy AI dự đoán sai (Human-in-the-loop).

#### 2. Lớp Hành vi AI (Layer 2: AI Logic - Back Stage)
*Đây là "bộ não" chạy ngầm bên dưới để tạo ra kết quả.*

*   **Logic 1: Dự đoán Nỗ lực (Effort Prediction Model)**
    *   *Input:* Các thông số kỹ thuật từ Màn hình 1.
    *   *Xử lý:* So sánh với dữ liệu lịch sử của 50 dự án tương tự gần nhất.
    *   *Output:*
        *   Số giờ công dự kiến (VD: 450 giờ).
        *   **Độ tin cậy (Confidence Interval):** Kèm theo biên độ rủi ro (VD: 450 giờ +/- 15%). *Nếu độ phức tạp cao, biên độ rủi ro sẽ mở rộng ra để an toàn.*

*   **Logic 2: Cấu trúc giá (Pricing Structure Engine)**
    *   *Input:* Giá vốn (từ Effort dự đoán) + Giá phần cứng cố định.
    *   *Xử lý:*
        *   *Gói Basic:* Cắt bỏ các dịch vụ rủi ro cao, giữ Margin tối thiểu 15%.
        *   *Gói Standard:* Thêm dịch vụ tiêu chuẩn, Margin mục tiêu 25%.
        *   *Gói Advanced:* Thêm dịch vụ cao cấp (Support 24/7), giá cao để làm "mỏ neo" tâm lý.

*   **Logic 3: Cơ chế học (Feedback Loop)**
    *   Sau khi dự án kết thúc, hệ thống sẽ so sánh "Effort dự báo" vs "Effort thực tế". Nếu sai lệch > 20%, AI sẽ tự điều chỉnh trọng số (weight) cho lần dự đoán sau.

### B.1. WIREFLOW (LUỒNG MÀN HÌNH & ĐIỂM CHẠM AI)
*Mô tả luồng đi của nhân viên Pre-sales (Nam) qua 5 màn hình chính. Các điểm có dấu **(✨AI)** là nơi thuật toán can thiệp.*

1.  **Màn hình 1: Dashboard Dự án (Start)**
    *   Danh sách các deal đang chờ báo giá.
    *   Nút "Tạo báo giá mới".

2.  **Màn hình 2: Input Requirement (Nhập liệu Yêu cầu)**
    *   Nam nhập/chọn: Ngành hàng (Retail), Quy mô (50 cửa hàng), Loại phần mềm (ERP + POS).
    *   **✨ AI Touchpoint:** Khi Nam chọn "Retail", AI tự động gợi ý các module thường bán kèm (Recommendation Engine) để Nam tick chọn nhanh, tránh bỏ sót.

3.  **Màn hình 3: Effort Estimation Review (Dự toán Nỗ lực)**
    *   Hệ thống hiển thị: "Dựa trên 20 dự án Retail tương tự, dự kiến cần **450 Man-days**."
    *   Chi tiết: Breakdown ra (Dev: 200 ngày, BA: 50 ngày, Tester: 100 ngày...).
    *   **✨ AI Touchpoint:** Dự báo rủi ro (Risk Flag). Ví dụ: Hiện cảnh báo *"Dữ liệu cũ cho thấy khách hàng Retail thường thay đổi yêu cầu phút chót, đề xuất cộng thêm 15% Buffer thời gian."*

4.  **Màn hình 4: 3-Tier Pricing Builder (Xây dựng 3 gói giá)**
    *   Hệ thống tự chia 3 cột: Basic - Standard - Advanced.
    *   **✨ AI Touchpoint:** Tự động phân bổ tính năng và dịch vụ vào 3 gói sao cho gói Standard có Margin tốt nhất (25%) và gói Advanced đóng vai trò "Chim mồi" (giá cao, full option).

5.  **Màn hình 5: Profit Simulator (Mô phỏng Lợi nhuận)**
    *   Nam kéo thanh trượt "Discount" để xem Margin nhảy số.
    *   **✨ AI Touchpoint:** Cảnh báo thời gian thực. Nếu Margin < 15% -> Hiện popup đỏ: *"Mức giá này cần CEO duyệt. Bạn có chắc muốn gửi không?"*

---

### B.2. 10 CÂU USER INPUT MẪU (TEST CASE)
*Các kịch bản thực tế để kiểm tra xem AI có hiểu ý người dùng không.*

| STT | User Input (Ngữ cảnh + Yêu cầu) | Expected Output (Kỳ vọng AI trả về) |
| :-- | :-- | :-- |
| 1 | "Khách chuỗi cafe 20 quán, cần POS và App đặt hàng." | Effort thấp (Standard). Gợi ý gói Basic (chỉ POS) và Standard (POS + App). |
| 2 | "Ngân hàng X, cần hệ thống bảo mật cấp cao, dữ liệu on-premise." | **Effort cực cao (High Risk).** Báo giá phải kèm chi phí Security Audit và triển khai tại chỗ. |
| 3 | "Khách muốn giá rẻ nhất có thể, cắt hết tính năng thừa." | Gợi ý gói **Basic tối giản**: Bỏ Support 24/7, bỏ Module báo cáo nâng cao. Margin thấp nhưng chốt nhanh. |
| 4 | "Cần triển khai gấp trong 1 tháng (bình thường là 3 tháng)." | **Cảnh báo rủi ro cao.** Tự động nhân hệ số giá dịch vụ lên 1.5 lần (Overtime cost). |
| 5 | "Khách có hệ thống cũ rất lởm, cần migrate dữ liệu sang mới." | Cộng thêm **Effort làm sạch dữ liệu (Data Cleaning)** vào báo giá. |
| 6 | "Khách hỏi sao giá dịch vụ bên mình cao hơn đối thủ 20%?" | AI sinh ra **Script giải thích (Talking points):** "Vì bên em bao gồm 6 tháng bảo hành tận nơi, đối thủ chỉ support online." |
| 7 | "Tạo báo giá cho dự án Chính phủ, ngân sách cố định 2 tỷ." | **Reverse Engineering:** Tự động cắt gọt phạm vi công việc (Scope) sao cho Tổng giá = 1.95 tỷ (dưới trần). |
| 8 | "Khách mua combo 3 năm License." | Tự động áp dụng chiết khấu **Long-term contract** (giảm 10% giá license, giữ nguyên giá dịch vụ). |
| 9 | "Dự án này làm chung với Partner (đối tác), chia sẻ lợi nhuận." | Thêm dòng chi phí "Partner Fee" vào cấu trúc giá để tính Net Margin chính xác. |
| 10 | "Khách đòi giảm thêm 5% nữa mới chốt." | Mô phỏng: Nếu giảm 5% thì Margin còn bao nhiêu? Nếu còn >15% -> Ok (Xanh). Nếu <15% -> Cảnh báo (Đỏ). |

---

### B.3. 5 "BAD CASES" (TRƯỜNG HỢP XẤU/KHÓ)
*Để xem AI xử lý tình huống "khoai" thế nào.*

1.  **Input quá sơ sài:** "Báo giá cho anh một cái app."
    *   *Xử lý:* AI không được ra giá bừa. Phải hiện câu hỏi ngược lại (Chatbot): *"Anh cần app cho ngành nào? Bao nhiêu user? iOS hay Android?"*
2.  **Yêu cầu mâu thuẫn:** "Muốn hệ thống AI xịn nhất nhưng ngân sách dưới 100 triệu."
    *   *Xử lý:* Hiện cảnh báo **"Không khả thi" (Infeasible)**. Gợi ý cắt bỏ tính năng AI hoặc tăng ngân sách.
3.  **Dữ liệu lịch sử trống (Cold Start):** "Khách hàng ngành Hàng không vũ trụ (chưa từng làm)."
    *   *Xử lý:* AI thông báo *"Không có dữ liệu lịch sử tương đồng"*. Chuyển sang chế độ **Nhập tay hoàn toàn (Manual Mode)** cho Sales tự tính.
4.  **Giá đầu vào bị lỗi:** Giá nhập linh kiện trong hệ thống ERP bị bằng 0 (do lỗi data).
    *   *Xử lý:* AI phát hiện bất thường (Anomaly Detection) và báo lỗi *"Vui lòng kiểm tra lại giá vốn phần cứng"*, không cho xuất báo giá.
5.  **Biên lợi nhuận âm:** Sales cố tình giảm giá quá sâu để lấy thành tích doanh số.
    *   *Xử lý:* Khóa nút "Export PDF". Bắt buộc nhập email của Sếp để gửi luồng xin phê duyệt (Approval Workflow).

---

### B.4. DATA PLAN (KẾ HOẠCH DỮ LIỆU)
*Bảng quy hoạch dữ liệu để nuôi con AI này.*

| Loại dữ liệu | Nguồn (Source) | Định dạng | Tần suất cập nhật | Lưu ý bảo mật/Rủi ro |
| :-- | :-- | :-- | :-- | :-- |
| **Giá vốn Phần cứng/License** | Hệ thống ERP | SQL Database | Real-time (Thời gian thực) | Cực kỳ bảo mật (Top Secret). Chỉ AI được đọc, Sales không được thấy giá gốc chi tiết. |
| **Lịch sử Báo giá cũ** | CRM (Salesforce) | JSON/Structured | Hàng ngày | Cần làm sạch data rác (các báo giá nháp/test). |
| **Thực tế Triển khai (Effort logs)** | Jira / Timesheet | Unstructured / API | Hàng tuần | **QUAN TRỌNG NHẤT.** Cần map đúng ID dự án giữa CRM và Jira để AI học được độ lệch (Bias). |
| **Quy tắc biên lợi nhuận (Margin Rules)** | File Excel của CFO | Excel/Config | Khi có thay đổi chính sách | Đây là "Luật" của AI (Hard constraints). |
