**CHƯƠNG 1: BỨC TRANH VẬN HÀNH B2B IT - AI LÀM GÌ, VÀO LÚC NÀO?**

Để hiểu được cốt lõi của bài toán định giá, trước tiên chúng ta cần giải quyết sự nhầm lẫn về Vai trò (Roles) và Luồng công việc (Workflow) trong các công ty B2B IT. Việc hiểu rõ "Ai làm gì, vào lúc nào" sẽ quyết định sự sống còn của sản phẩm AI bạn đang thiết kế.

**1. Sự phân biệt giữa Quản trị dự án (PM) và Pre-sales** Có một quan điểm thường gặp nhưng sai lầm về mặt bản chất vận hành là: "PM (Project Manager) nên là người viết giải pháp vì cấp bậc cao hơn". Thực tế, PM sinh ra để làm việc ở giai đoạn Post-sales (Sau khi chốt đơn). Nhiệm vụ của họ là cầm một số tiền đã chốt cố định, quản lý đội Dev (Lập trình viên) để code ra sản phẩm đúng hạn, đóng vai trò là "Đội trưởng thi công". Tỷ lệ chốt thầu B2B thường chỉ là 20%, nếu bắt PM đi gặp khách hàng từ đầu để viết giải pháp cho cả 10 khách, họ sẽ không còn thời gian quản lý các dự án đang chạy, dẫn đến vỡ lở và đền hợp đồng.

Ngược lại, Pre-sales là "Kỹ sư bán hàng" (Technical Sales) nằm ở giai đoạn Pre-sales (Trước khi chốt đơn), đóng vai trò là "Kiến trúc sư" vẽ bản phối cảnh 3D để bán nhà. Tech Lead (Delivery) hay PM mới là "Kỹ sư kết cấu" tính toán độ chịu lực của móng nhà. Khách hàng mua nhà vì bản 3D, nhưng nhà đứng được là nhờ kỹ sư kết cấu. Về mặt nhân sự: Pre-sales là chi phí để "Săn mồi" (Customer Acquisition), còn PM là chi phí để "Chế biến mồi" (Delivery); không thể lấy người chế biến đi săn.

**2. "Nghệ thuật hứa hẹn" của Pre-sales và cái bẫy đoán bừa** Một output (sự hứa hẹn) của Pre-sales được coi là thành công 100% không phải chỉ là chốt được hợp đồng, mà là: Chốt được hợp đồng + Đội Delivery làm xong đúng hạn + Công ty có lãi đúng như dự kiến. Nếu Pre-sales chốt đơn 1 tỷ, nhưng Delivery làm mất 2 tỷ tiền lương nhân sự, thì Pre-sales thất bại thảm hại.

Vậy Pre-sales dựa vào dữ liệu gì để tính giá và thời gian? Họ thường dựa vào 2 nguồn: Lục lại dữ liệu lịch sử (các file báo giá cũ, dự án tương tự) hoặc hỏi chuyên gia (Tech Lead). Tuy nhiên, tra cứu dữ liệu cũ thì lâu và rác vì không ai chuẩn hóa. Còn hỏi Tech Lead thì họ thường đang bận code, hoặc trả lời đại khái. Kết quả là Pre-sales đành "đoán bừa" (Guesswork), dẫn đến một "giải pháp màu hồng" và Delivery phải gánh hậu quả. Mâu thuẫn lớn nhất trong công ty IT chính là việc Pre-sales báo giá quá thấp để dễ chốt đơn, sau đó đẩy cục nợ cho PM làm, dẫn đến PM bị trừ lương vì dự án lố giờ công (Overrun).

Bản chất của Pre-sales không phải là thiết kế một hệ thống kỹ thuật hoàn hảo, mà là "Định giá sự bất định" (Pricing the Uncertainty). Một giải pháp chỉ thành công khi nó tạo ra đủ "Không gian an toàn" (Buffer/Giới hạn phạm vi) để đội Kỹ thuật thi công mà công ty vẫn có lãi, đồng thời mức giá vẫn đủ hấp dẫn để chốt đơn.

---

**CHƯƠNG 2: SỰ PHÂN VAI TRONG ĐỊNH GIÁ & THƯƠNG LƯỢNG**

Để bóc tách bản chất ranh giới định giá, hãy lấy ví dụ tuyến tính: "Cài Windows 11 cho doanh nghiệp B2B".

**1. Kéo co nội bộ: Giá sàn và Giá trần** Có sự phân vai cực kỳ rõ ràng giữa Sales và Pre-sales; định giá B2B là một cuộc kéo co nội bộ.

- **Pre-sales:** Quản trị "Chi phí và Tính khả thi" (Cost & Feasibility), bảo vệ "Sự an toàn của việc triển khai". Pre-sales tính **Giá sàn** (Floor Price / Cost), bao gồm: Giá vốn phần mềm + Giờ công thực tế (Effort) + Technical Buffer (Dự phòng rủi ro kỹ thuật). Họ dựa vào Định mức kỹ thuật để đưa ra báo giá.
- **Sales:** Quản trị "Cảm nhận và Dòng tiền" (Value & Cashflow), bảo vệ "Khả năng chiến thắng trên thị trường". Sales tính **Giá trần** (Ceiling Price / Target Price), bao gồm: Giá sàn (từ Pre-sales) + Lợi nhuận kỳ vọng của công ty + Commercial Buffer (Dự phòng đàm phán).

Khi khách bảo "Cài Win", Sales chỉ biết là "Cài Win", nhưng Pre-sales bắt buộc phải biết rõ kỹ thuật: cấu hình máy có đủ chạy không, có cần backup dữ liệu không, có cần join Domain không. Từ đó, Pre-sales sẽ tính ra chi phí cứng (VD: License 3 triệu x 100 máy = 300 triệu) và chi phí mềm (VD: 3 tiếng x 100 máy = 300 giờ công). Pre-sales chính là người nặn ra cái "lõi" (Scope) để tạo ra 3 gói giá (Basic/Standard/Premium) dựa trên "Chi phí thực tế" (Cost).

Tuy nhiên, khách hàng mua dựa trên "Ngân sách và Cảm xúc" (Budget & Value). Do đó, Sales phải dựa vào Biến số thương mại (Commercial Levers) và Biên độ lợi nhuận (Margin Buffer) mà Pre-sales/Sếp đã chừa sẵn để thương lượng. Báo giá B2B thất bại khi Sales tự ý hứa hẹn tính năng mà không biết chi phí kỹ thuật, hoặc Pre-sales tính toán quá cứng nhắc khiến Sales không có "đệm" để đàm phán. Nếu đối thủ chào giá thấp hơn, Sales sẽ quay lại ép Pre-sales: "Cắt bớt tính năng đi, hoặc giảm giờ công xuống để anh chào 750 triệu!".

---

**CHƯƠNG 3: SỰ SỤP ĐỔ CỦA CÔNG CỤ THỦ CÔNG & SỰ XUẤT HIỆN CỦA AI**

Nếu chỉ là "Cài Win", một công cụ Checkbox (untick để trừ tiền) trên Excel là đủ. Nhưng hãy chuyển sang ví dụ phi tuyến tính: Triển khai phần mềm Quản lý doanh nghiệp (ERP/CRM) để thấy AI tỏa sáng.

**1. Giải pháp từ AI và vòng lặp Ping-Pong** Trong các hệ thống phức tạp, nỗ lực triển khai là Phi tuyến tính (Non-linear). Việc loại bỏ tính năng tạo ra "Khoảng trống tích hợp" (Integration Gaps) đòi hỏi chi phí ẩn. Khác với Excel, AI (Machine Learning) làm phép DỰ ĐOÁN (Prediction). Quét hàng ngàn dự án, AI nhận ra mẫu hình: Bỏ Module B thì giờ công đội lên 50 giờ. Khi Sales untick, AI không chỉ trừ tiền mà lập tức cộng thêm 50 giờ công rủi ro và cảnh báo Margin giảm.

Hơn nữa, báo giá B2B là một vòng lặp đàm phán "Ping-Pong": Khách chê đắt → Sales ép Pre-sales → Pre-sales sửa Excel → Sếp duyệt → Gửi khách → Khách lại chê (mất hàng tuần). Định giá B2B là một Trạng thái cân bằng động (Dynamic Equilibrium) giữa Ngân sách, Năng lực kỹ thuật và Lợi nhuận. AI giải quyết việc này bằng cách biến vòng lặp thành Real-time Simulation (Mô phỏng thời gian thực). Sales và Pre-sales nhập Target Price (Giá mục tiêu) vào, AI nhả kịch bản mới trong 3 giây.

Đây gọi là **Bài toán Định giá ngược (Target Costing)**. Giá trị là chủ quan, nhưng Ngân sách là khách quan; định giá ngược là lấy Ngân sách trừ đi Lợi nhuận để ép ngược lại Chi phí (Scope). AI sẽ nhận lệnh "Target = 750 triệu" và chạy thuật toán cắt tỉa (Pruning Algorithm): tìm các module [Không bắt buộc] hoặc [Tốn nhiều giờ công] để tự động gọt bỏ hoặc hạ cấp nhân sự.

---

**CHƯƠNG 4: RANH GIỚI TUYỆT ĐỐI GIỮA ĐỀ XUẤT (PROPOSAL) VÀ ĐỊNH GIÁ (PRICING)**

Vậy AI định giá này lấy dữ liệu từ đâu? Đầu vào của nó chính là kết quả từ khâu Đề xuất giải pháp (Proposal). Cần vạch rõ ranh giới tuyệt đối giữa hai nhóm này để không dẫm chân lên nhau.

- **Nhóm 4 (Proposal Generation):** Họ làm "Thuyết minh giải pháp". Sử dụng AI (RAG) để xử lý ngôn ngữ tự nhiên, đọc hiểu yêu cầu lộn xộn của khách và lục lọi kho tài liệu để chắp vá ra văn bản chuẩn chỉnh. Output của họ là Phạm vi công việc tiêu chuẩn (SOW) và Danh mục vật tư (BOM). Nhóm 4 giải quyết câu hỏi "Làm CÁI GÌ và NHƯ THẾ NÀO?". Giới hạn của họ là "Giải pháp Tiêu chuẩn", trả lời cho việc khách hàng CẦN giải pháp gì (Lý tưởng). **Họ KHÔNG BAO GỒM GIÁ và KHÔNG CÓ CHIẾN LƯỢC THƯƠNG MẠI**. Vì AI tạo sinh rất dốt toán và hay "ảo giác", nếu để RAG tự sinh giá, công ty có thể phá sản.
- **Nhóm bạn (Pricing Recommendation):** Input của bạn chính là cái Standard Scope mà Nhóm 4 vừa nhả ra. Nhóm bạn giải quyết câu hỏi "Giá BAO NHIÊU và Bán CHIẾN LƯỢC GÌ?". Từ Input đó, bạn phải Định lượng (Quantify) thành Tiền và Giờ công, đánh giá Dự phòng rủi ro (Buffer), và Băm nhỏ & Phóng to (Tiering) để đẻ ra 3 gói Basic/Standard/Premium. Nhóm bạn trả lời câu hỏi thực tế thương mại: Khách hàng CÓ THỂ MUA phần nào với số tiền họ đang có mà công ty vẫn có lãi.

Tóm lại: Proposal định nghĩa "Cái gì" và "Như thế nào" bằng Ngôn ngữ. Pricing định nghĩa "Bao nhiêu" và "Rủi ro" bằng Toán học. Nhóm 4 xây dựng "Ngôi nhà tiêu chuẩn", nhóm bạn quyết định bán ngôi nhà đó giá bao nhiêu và thiết kế thêm bản vẽ "Nhà cấp 4" hay "Biệt thự". Hai hệ thống này nối tiếp nhau, không triệt tiêu nhau.


**CHƯƠNG 5: BẢN CHẤT CỦA INPUT VÀ OUTPUT TRONG PRE-SALES**

Để hệ thống AI có thể định giá chuẩn xác, chúng ta cần vạch rõ đầu vào (Input) và đầu ra (Output) của Pre-sales. Nếu không xác định được "Đầu vào là gì, Đầu ra là gì", chúng ta không thể biết AI sẽ đứng ở đâu để xử lý dữ liệu.

**1. Đầu vào (Input) không chỉ là một danh sách tính năng** Về mặt vật lý, Input của dự án bao gồm: Yêu cầu của khách hàng (Brief/RFP), Ngân sách dự kiến (Budget), Thời gian mong muốn (Timeline), và Hiện trạng hệ thống cũ (Legacy System). Tuy nhiên, thực chất của khối dữ liệu này không đơn thuần là một "Danh sách tính năng", mà là một tập hợp các Ràng buộc (Constraints) và Sự bất định (Uncertainties). Bắt buộc phải có Input này vì không có "Hiện trạng" (As-Is) thì không thể vẽ đường đến "Mục tiêu" (To-Be). Nếu thiếu các ràng buộc thực tế, Pre-sales rất dễ rơi vào bẫy thiết kế ra một chiếc xe Rolls-Royce trong khi khách hàng chỉ có ngân sách để mua xe đạp. Bản chất của Input chính là sự va chạm giữa những mong muốn vô hạn và nguồn lực hữu hạn của khách hàng.

**2. Đầu ra (Output): Cỗ máy dịch thuật rủi ro** Output của Pre-sales thường bao gồm 2 tài liệu chính: Bản thuyết minh giải pháp (Proposal - Lời hứa về kỹ thuật) và Bảng bóc tách khối lượng & Báo giá (BOM/SOW & Pricing - Lời hứa về tài chính và nguồn lực). Thực chất, Output này là một "Bản thiết kế Rủi ro đã được lượng hóa" (Quantified Risk Blueprint). Nó dịch những mong muốn mơ hồ (như "làm một App giống Grab") thành những con số tàn nhẫn và thực tế: cần 500 giờ code (Effort), 200 giờ test, cộng thêm 30% rủi ro trễ hạn (Buffer), dẫn đến Giá vốn 300 triệu và Giá bán 500 triệu (đảm bảo Margin 40%). Output này tạo ra một "Điểm chốt chặn" (Single Source of Truth) giữa 3 thế lực: Khách hàng (biết chính xác mất bao nhiêu tiền và nhận lại gì), Sales (biết giới hạn giảm giá để đàm phán mà không bị đuổi việc), và Delivery (biết chính xác có bao nhiêu giờ công để code). Nhìn chung, Pre-sales hoạt động như một "Cỗ máy Dịch thuật Rủi ro" (Risk Translation Engine).

---

**CHƯƠNG 6: KHÂU KHÁM BỆNH VÀ NGHỆ THUẬT THU THẬP NGÂN SÁCH**

Để có được Input chuẩn xác, khâu "Khám bệnh" (Clarification/Discovery) là bước sống còn. Nếu phó mặc bước hỏi đáp này hoàn toàn cho Nhóm 4 (Làm giải pháp), mô hình AI Pricing của bạn sẽ nhận đầu vào là "Rác" (Garbage In, Garbage Out).

**1. Sự can thiệp bắt buộc của Nhóm định giá (Pricing)** Nhóm 4 hỏi khách hàng để gom Yêu cầu Kỹ thuật (Technical Requirements), mục đích là để vẽ ra giải pháp (Solution). Tuy nhiên, Nhóm 5 (Pricing) cũng bắt buộc phải thò tay vào khâu này. Vì Nhóm 4 chỉ quan tâm "Làm được không?", trong khi Nhóm 5 phải quan tâm "Làm mất bao nhiêu tiền/sức?" và "Khách có tiền trả không?". Nếu bỏ qua bước này, Nhóm 4 có thể vẽ ra một giải pháp 2 tỷ cho một vị khách chỉ có 200 triệu. Cụ thể, Nhóm 5 cần thu thập Các Biến số Thương mại & Rủi ro (Commercial & Risk Qualifiers), bao gồm:

- **Chất lượng đầu vào:** Hệ thống cũ dữ liệu có sạch không? (Nếu dữ liệu bẩn, giờ công x2 dẫn đến tăng giá).
- **Tiến độ:** Khách cần gấp không? (Làm gấp đồng nghĩa với Overtime, chi phí sẽ tăng).
- **Quy trình duyệt giá:** Ai là người ký hóa đơn? (Sếp kỹ thuật ký sẽ chuộng tính năng, Sếp tài chính ký sẽ chuộng giá rẻ, điều này quyết định cấu trúc 3 gói giá).

**2. "Nắn dòng" Ngân sách và Kỹ thuật Mỏ neo** Trong thực tế B2B, khách hàng luôn giấu ngân sách hoặc chính họ cũng không biết con số cụ thể. Họ thường đưa ra một cục tiền chung chung hoặc bảo "cứ đề xuất đi, rẻ nhất có thể". Do đó, Pre-sales không hỏi ngân sách để "được biết", mà phải tiến hành "Thăm dò và Nắn dòng" (Probing & Shaping) dựa trên cấu trúc tài chính của doanh nghiệp. Đây là bài toán kinh điển về CAPEX (Chi phí đầu tư mua đứt 1 lần) và OPEX (Chi phí vận hành thuê bao hàng tháng). Ví dụ: Khách hàng là Cơ quan Nhà nước có ngân sách CAPEX 1 tỷ năm nay, nhưng năm sau sẽ không có OPEX. Ngay khi "ngửi" thấy mùi này, Pre-sales sẽ dồn toàn bộ tiền Server và bảo trì 3 năm gộp hết vào "Giá mua phần mềm ban đầu" để khách dễ giải ngân. Để moi được mức trần ngân sách (Budget Cap), Pre-sales dùng Kỹ thuật Mỏ neo (Anchoring). Thay vì hỏi "Anh có bao nhiêu tiền?", họ sẽ nói: "Dự án tương tự bên em làm rơi vào khoảng 1.5 đến 2 tỷ. Mức này có nằm trong khả năng phê duyệt của anh không?". Phản ứng nhăn mặt hay gật đầu của khách sẽ tiết lộ ngân sách thật.

---

**CHƯƠNG 7: THIẾT KẾ BẢNG CÂU HỎI ĐỘNG (CPQ) CHO AI**

Việc thu thập Input một cách thủ công qua các bảng câu hỏi tĩnh (như 1 file Excel dài 100 dòng) sẽ khiến Sales lười biếng, điền bừa, dẫn đến AI tính giá sai. Để cắt đứt sự phụ thuộc và tối ưu hóa hệ thống, chúng ta cần thiết kế Bảng câu hỏi động (Dynamic Questionnaire), công cụ này trong thế giới phần mềm gọi là CPQ (Configure, Price, Quote).

**1. Nguyên lý hoạt động của Bảng câu hỏi động** Bảng câu hỏi bắt buộc phải "Động" vì rủi ro của mỗi dự án là khác nhau. Nó hoạt động dựa trên Logic phụ thuộc (Dependency Logic) hay Cây quyết định (Decision Tree). Ví dụ: Nếu Sales chọn bán "Phần mềm Kế toán", hệ thống KHÔNG ĐƯỢC hỏi "Khách có cần App Mobile không?". Nhưng nếu Sales tick vào ô "Có tích hợp hệ thống cũ", AI PHẢI LẬP TỨC đẻ ra câu hỏi: "Hệ thống cũ dùng Database gì? SQL hay Excel?". Nếu chọn 'Giấy tờ tay', logic ngầm của AI sẽ tự động nhân (x1.5) số giờ công rủi ro. Thu thập dữ liệu định giá chính là quá trình "Khám phá Rủi ro" (Risk Discovery). Mục đích tối thượng của Form này không phải để vẽ giải pháp đẹp, mà để "Săn lùng các Biến số làm tăng Giờ công và Chi phí". Mọi câu hỏi không làm thay đổi các biến số [Giá vốn], [Giờ công] hoặc [Dòng tiền] đều là câu hỏi rác và phải bị loại bỏ khỏi hệ thống.

**2. Kiến trúc 3 Lớp (Layers) của hệ thống Định giá** Để thiết kế bản Prototype chuẩn xác, Form cần chia thành 3 Lớp đi từ Rộng đến Sâu, đóng vai trò như một tấm gương phản chiếu Công thức Lợi nhuận:

- **Lớp 1: Khung xương (The Base Scope).** Xác định quy mô gốc (Ví dụ: Bán phần mềm CRM cho 50 Users). Dữ liệu này giúp AI tính toán Giá sàn (Base Cost).
- **Lớp 2: Rủi ro kỹ thuật (Technical Multipliers).** Đây là phần được kích hoạt "Động" nhằm xác định Chi phí biến đổi (Cost Multiplier). AI sẽ hỏi sâu về các điểm khó như Migrate data hay Custom API để tính toán chính xác % Buffer Giờ công rủi ro. Đây là lớp dễ làm công ty lỗ nhất.
- **Lớp 3: Ràng buộc thương mại (Commercial Levers).** Xác định Doanh thu thực nhận thông qua các ràng buộc tài chính (Khách có bao nhiêu tiền? Tiêu chí quan trọng nhất là giá rẻ hay làm nhanh?). Nếu khách chọn "Giá rẻ nhất", AI sẽ lập tức lấy gói Basic làm tâm điểm khi xuất báo cáo; cấu trúc dữ liệu này giúp AI chia chuẩn 3 gói Basic/Standard/Premium.

**CHƯƠNG 8: TẦNG CHUNG (UNIVERSAL) VÀ CẤU TRÚC RỦI RO BẤT BIẾN**

Tư duy phân tách giữa "Cái chung của ngành" và "Cái riêng của công ty" là yếu tố cực kỳ quan trọng, quyết định việc AI của bạn là một sản phẩm đóng gói bán được cho nhiều công ty (SaaS), hay chỉ là tool nội bộ xài một lần.

Tầng chung (Universal) của mọi công ty phần mềm B2B chính là Cấu trúc Rủi ro (Risk Structure). Dù là Microsoft, FPT hay một công ty IT nhỏ, khi triển khai phần mềm đều vướng 4 rủi ro bất biến theo mô hình SIMT:

1. **Setup** (Cài đặt hạ tầng).
2. **Integration** (Tích hợp hệ thống khác).
3. **Migration** (Chuyển đổi dữ liệu cũ).
4. **Training** (Đào tạo người dùng).

Do đó, một Bảng câu hỏi động cốt lõi bắt buộc phải có 4 nhánh câu hỏi rẽ nhánh cho 4 yếu tố SIMT này. Cấu trúc của Rủi ro là bất biến, nhưng cách định giá rủi ro lại là tùy biến (Specific).

---

**CHƯƠNG 9: TẦNG ĐẶC TRƯNG (COMPANY-SPECIFIC) VÀ CHIẾN LƯỢC DÒNG TIỀN**

Tầng đặc trưng (Company-specific layer) chính là Trọng số định giá (Valuation Weights) và Chiến lược kinh doanh (Business Strategy) của từng doanh nghiệp. Sự "tổng quát" của AI không nằm ở việc hỏi khách hàng xem công ty ta đang bán kiểu gì, mà nằm ở việc tách biệt hoàn toàn giữa "Biến số Dự án" (Input khách quan) và "Chiến lược Kinh doanh" (Cách tính tiền chủ quan).

Tầng đặc trưng này KHÔNG nằm ở giao diện của Sales (Front-end), vì Sales có thể tự ý chọn "Miễn phí Setup" để dễ chốt đơn, phá nát chiến lược dòng tiền. Nó nằm ở Bảng điều khiển của Quản trị viên (Admin Settings) dành riêng cho Ban Giám đốc (CEO/CFO) thiết lập "DNA" của công ty. Khi Sales nhập Input của khách vào, AI sẽ lấy **[Input của Khách] nhân với [DNA của Công ty]** để đẻ ra 3 Gói giá.

Hãy lấy ví dụ với cùng một yêu cầu rủi ro: Khách cần phần mềm ERP và chuyển đổi dữ liệu (Migration) đang rất bẩn.

- **Công ty A (Kiểu "Săn bắn" - The Hunter):** Sếp gạt công tắc AI sang chế độ 'Tối đa hóa dòng tiền ngắn hạn (CAPEX)'. AI hiểu công ty sống bằng dịch vụ, nên nó tự động tính phí tàn nhẫn vào khâu Setup: Tiền phần mềm 100 triệu + Phí Migration 50 triệu.
- **Công ty B (Kiểu "Nuôi trồng" - The Farmer):** Sếp gạt công tắc AI sang chế độ 'Tối đa hóa giá trị trọn đời (OPEX/SaaS)'. AI lập tức đổi chiến thuật: Tiền phần mềm 150 triệu/năm + Phí Migration 0 đồng. AI hiểu công ty B dùng dịch vụ dọn dữ liệu làm 'Mồi nhử', nên nó thêm điều kiện bắt buộc: 'Cam kết sử dụng tối thiểu 2 năm' để khóa chặt (Lock-in) khách hàng.

Ở tầng đặc trưng này, quan điểm "doanh thu chỉ đơn giản là tiền License" là sai lầm nghiêm trọng. Tiền thực chất nằm ở tỷ trọng giữa Sản phẩm và Dịch vụ (Service-to-Product Ratio), chiến lược mở rộng quy mô, và cơ cấu tính phí bảo trì (SLA Monetization). Tổng doanh thu trọn đời (LTV) là một con số cố định dựa trên kỳ vọng lợi nhuận; nếu công ty giảm tiền ở mục Setup, họ buộc phải tăng tiền ở License, phí Support, hoặc Phạt hủy hợp đồng.

**CHƯƠNG 10: 3 GIỎ THUẬT NGỮ CỐT LÕI ĐỂ PRE-SALES TƯ DUY**

Để chứng minh được "Lợi nhuận" và tránh bị lầm tưởng giữa "Lãi" và "Lỗ", Pre-sales cần gom bức tranh hệ thống thành 3 "Giỏ thuật ngữ" (Buckets) đại diện cho Vòng đời của một đồng vốn:

**Giỏ 1: Sản phẩm (Cách khách chi tiền)** Khách hàng có thể chi trả theo dạng **CAPEX** (Chi phí vốn, mua đứt 1 lần để làm đẹp báo cáo tài chính tài sản) hoặc **OPEX** (Chi phí vận hành, thuê bao hàng năm để tối ưu dòng tiền và giảm thuế). Điều này dẫn đến 2 loại hình License: Mua đứt (Perpetual - sở hữu phiên bản tĩnh) và Thuê bao (SaaS - quyền truy cập dịch vụ liên tục cập nhật). Cùng với đó là việc Phân cấp (Tiering) theo User, Storage hoặc Feature để tối đa hóa số tiền từ mỗi phân khúc khách hàng.

**Giỏ 2: Chi phí & Giá thành (Cách Vendor tiêu tiền)** Chi phí sản xuất phần mềm được đo lường bằng **Man-day / Man-month** (Đơn vị tính bằng Thời gian x Trình độ con người). Các yếu tố cấu thành "Giá vốn" (COGS) thực sự bao gồm tiền Server, License bên thứ 3, và lương đội Hỗ trợ (Support), chứ không chỉ là "copy paste code". Một rủi ro cực lớn ở giỏ này là **Nợ kỹ thuật (Technical Debt)** - chi phí ngầm phát sinh khi Sales ép tiến độ làm nhanh, Dev code ẩu khiến hệ thống chậm và chi phí bảo trì sau này tăng gấp đôi. Hơn nữa, tỷ lệ tạo ra tiền thực tế (Utilization Rate) của Dev chỉ đạt 70-80%, nên giá bán phải tính cả thời gian "chết" (họp hành, training).

**Giỏ 3: Tài chính, Hiệu quả & Rủi ro** Cuối cùng, phần mềm B2B không phải là Mã nguồn, mà là một công cụ tài chính chuyển hóa Chi phí Nhân sự thành Tài sản cố định để đạt khả năng mở rộng không giới hạn. Khách hàng không mua code, họ mua Sự đảm bảo (Assurance) rằng hệ thống sẽ chạy ổn định, không sập, dễ mở rộng và luôn được hỗ trợ. Mọi điều kiện lỏng lẻo ở các lớp trên đều làm tăng "Chi phí rủi ro dự phòng", và nhiệm vụ của Pre-sales là siết chặt điều kiện để tối ưu hóa lợi nhuận.