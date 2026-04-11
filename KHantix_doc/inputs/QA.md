user: về Kế toán Quản trị (Managerial Accounting) và nguyên lý Định giá dựa trên Chi phí (Cost-Plus Pricing).

Chào bạn, việc quay về **Kế toán Quản trị (Managerial Accounting)** và nguyên lý **Cost-Plus** là một bước đi cực kỳ chắc chắn (Solid Foundation).

Nếu **Sales** là nghệ thuật "bay bổng", thì **Kế toán Quản trị** là mỏ neo "kéo chân xuống mặt đất". Trong dự án xây dựng hệ thống báo giá của bạn (dù dùng Excel hay AI), đây chính là **"Bộ não logic" (Kernel)** để đảm bảo công ty không bao giờ bán lỗ.

Dưới đây là cách giải mã hai khái niệm này dưới lăng kính **First Principle** áp dụng cho B2B IT.

---

### 1. KẾ TOÁN QUẢN TRỊ (MANAGERIAL ACCOUNTING)

_Không phải để báo cáo Thuế, mà để báo cáo cho Sếp biết sự thật._

**Nguyên lý đầu tiên:** **Chi phí không bao giờ đứng một mình.**

> Mọi chi phí đều phải được **Phân bổ (Allocated)** vào một Đơn vị sản phẩm cụ thể (Unit Economics). Nếu bạn không biết 1 giờ Dev "gánh" bao nhiêu tiền điện/tiền thuê văn phòng, bạn đang tính sai giá vốn.

Trong B2B IT, Kế toán quản trị chia chi phí thành 3 tầng tháp (Cost Hierarchy):

1. **Chi phí Trực tiếp (Direct Costs - COGS):**
    
    - Là tiền bỏ ra _trực tiếp_ để tạo ra dự án.
        
    - _Ví dụ:_ Lương Dev, Lương BA, Tiền Server AWS cho dự án đó.
        
    - _Đặc điểm:_ Dễ tính, gắn liền với **Man-day**.
        
2. **Chi phí Gián tiếp / Chi phí chung (Indirect Costs / Overheads):**
    
    - Là tiền để duy trì công ty hoạt động _để Dev có chỗ mà ngồi làm việc_.
        
    - _Ví dụ:_ Tiền thuê văn phòng, tiền điện, lương HR, lương Kế toán, lương Giám đốc.
        
    - _Vấn đề:_ Làm sao chia tiền điện này vào giá bán dự án?
        
    - _Giải pháp:_ Dùng **Hệ số phân bổ (Overhead Rate)**. Thường tính bằng % trên lương trực tiếp (Ví dụ: 1 đồng lương Dev phải gánh 0.4 đồng chi phí chung).
        
3. **Chi phí Biến đổi & Cố định (Variable vs. Fixed Costs):**
    
    - **Variable:** Tăng theo quy mô dự án (Thêm User $\rightarrow$ Thêm tiền Server).
        
    - **Fixed:** Không đổi dù dự án to hay nhỏ (Chi phí phát triển Core sản phẩm ban đầu).
        

---

### 2. ĐỊNH GIÁ DỰA TRÊN CHI PHÍ (COST-PLUS PRICING)

_Phương pháp cổ điển nhất, an toàn nhất, nhưng cũng... nguy hiểm nhất._

**Công thức gốc (The Formula):**

$$\text{Giá Bán (Price)} = \text{Tổng Chi Phí (Total Cost)} + (\text{Tổng Chi Phí} \times \text{Markup \%})$$

Trong đó:

- **Total Cost** = Chi phí Trực tiếp + Chi phí Gián tiếp (Phân bổ).
    
- **Markup %** = Phần trăm cộng thêm để tạo ra Lợi nhuận & Dự phòng rủi ro.
    

![cost plus pricing model diagram, do AI tạo](https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcRFmrDQq58u9ZWy4uQokW7S6ZrpMuhMw2QArdOlkW4UUxKX6UykHm-XSXHcn_QdoZ8fOWO61-le8jMkWS3qRMZf1jzvhuLDDfeg0_HTiPf2yKr8Reg)

Getty Images

Khám phá

#### Tại sao Cost-Plus lại quan trọng với dự án Báo giá của bạn?

1. **Thiết lập "Giá Sàn" (The Floor Price):**
    
    Cost-Plus cho bạn biết con số **tối thiểu** phải bán. Nếu bán thấp hơn mức này $\rightarrow$ Công ty đang "chảy máu" (Bleeding cash).
    
    - _Ví dụ:_ Tính ra Cost-Plus là 100 triệu. Sales chốt 90 triệu để lấy khách $\rightarrow$ Lỗ thực sự 10 triệu. Hệ thống phải báo động đỏ (Red Alert).
        
2. **Minh bạch hóa Markup (Decoupling Markup):**
    
    Nhiều công ty gộp chung Markup là "Lãi". Sai lầm! Theo Kế toán quản trị hiện đại, Markup phải tách làm 3 phần:
    
    - **Risk Premium (Phí rủi ro):** Dự phòng cho việc trễ tiến độ, bug (khoảng 10-15%).
        
    - **Reinvestment (Tái đầu tư):** Tiền để R&D sản phẩm mới (khoảng 10%).
        
    - **Net Profit (Lãi ròng):** Phần tiền thực sự bỏ túi cổ đông (khoảng 10-20%).
        
    - $\rightarrow$ **Tổng Markup thường là 30-50% trên giá vốn.**
        

---

### 3. CẠM BẪY CỦA COST-PLUS TRONG IT (THE TRAP)

_Tại sao chỉ dùng Cost-Plus là chưa đủ?_

**Nguyên lý:** **Giá trị nằm trong mắt người mua (Value is subjective), Chi phí nằm trong sổ sách người bán (Cost is objective).**

Nếu bạn chỉ dùng Cost-Plus:

- **Trường hợp 1 (Sản phẩm xịn):** Bạn làm phần mềm cực xịn, giúp khách kiếm 10 tỷ/năm. Chi phí làm ra chỉ tốn 100 triệu.
    
    - Nếu Cost-Plus (Markup 50%): Bạn bán 150 triệu.
        
    - Giá trị thật (Value-based): Bạn có thể bán 1 tỷ.
        
    - $\rightarrow$ **Bạn mất tiền (Leave money on the table).**
        
- **Trường hợp 2 (Sản phẩm dở):** Bạn quản lý kém, Dev làm chậm. Chi phí đội lên 500 triệu.
    
    - Nếu Cost-Plus: Bạn báo giá 750 triệu.
        
    - Giá thị trường: Đối thủ làm nhanh hơn, chỉ bán 300 triệu.
        
    - $\rightarrow$ **Bạn mất khách (Lose the deal).**
        

---

### KẾT LUẬN & ỨNG DỤNG CHO DỰ ÁN

Để hệ thống báo giá (Pre-sales) của bạn hoạt động hiệu quả nhất, hãy kết hợp như sau:

1. **Kế toán Quản trị:** Dùng để tính **"Giá Thành Sản Xuất" (Production Cost)** chính xác từng đồng. (Đây là Input cho AI).
    
2. **Cost-Plus:** Dùng để tính **"Giá Sàn An Toàn" (Minimum Selling Price)**. AI/Excel tuyệt đối không cho phép Sales bán dưới giá này mà không có duyệt cấp cao.
    
3. **Value-Based (Thị trường):** Dùng AI để gợi ý **"Giá Trần Kỳ Vọng"** (Dựa trên lịch sử và túi tiền khách hàng).
    

**Câu hỏi hành động tiếp theo:**

> "Bạn có muốn tôi giúp bạn liệt kê **danh sách các loại chi phí ẩn (Indirect Costs)** thường bị bỏ quên trong các công ty phần mềm, để bạn đưa vào công thức phân bổ trong Excel không?"


USER: trong khi tìm hiểu một vấn đề chỉ tập trung vào đào sâu để hiểu nó, tránh việc đưa lời khuyên về dự án của tôi, tuy nhiên context ví dụ thì vẫn dựa vào context dự án đang bàn
1. công thức gốc nguy hiểm nhất vậy h người ta dùng cái gì? + chưa hiểu công thức lắm (khó hình dung)
2. một dự án phần mềm công nghiên cứu làm module ban đầu lớn nhưng về sau nhân bản mất 0 đồng chỉ tốn các phí khác, vậy lúc bán thì tính là một dự án như thế tiền licence tính thế nào? sau phần mềm lỗi thời/ cần update thì tính thế nào. Luôn nhìn dưới góc nhìn tổng quát, nếu những thứ như vậy đã được tổng quát và tính trong công thức thì ta hãy bàn về công thức

Chào bạn, chúng ta sẽ đi sâu vào bản chất của Kế toán Quản trị để giải mã sự "nguy hiểm" của công thức Cost-Plus và cách định giá phần mềm (thứ tài sản vô hình nhưng tốn kém).

Đây là phân tích dựa trên **First Principle**.

---

### PHẦN 1: TẠI SAO CÔNG THỨC COST-PLUS LẠI "NGUY HIỂM" VÀ NGƯỜI TA DÙNG CÁI GÌ?

#### 1. Hiểu công thức gốc (Để hình dung được nó)

Hãy hình dung công thức này như việc bán một bát phở, nhưng áp dụng cho phần mềm.

**Công thức Cost-Plus:**

$$\text{Giá Bán} = (\text{Chi phí Trực tiếp} + \text{Chi phí Gián tiếp}) \times (1 + \% \text{Lợi nhuận mong muốn})$$

**Ví dụ cụ thể (Context dự án B2B IT):**

Bạn bán 1 Module CRM.

- **Chi phí Trực tiếp (Direct Cost):** Lương ông Dev Senior làm trong 10 ngày = 20 triệu.
    
- **Chi phí Gián tiếp (Overhead):** Tiền điện, thuê văn phòng, lương kế toán phân bổ cho 10 ngày đó = 10 triệu.
    
- **Tổng Chi phí (Total Cost):** 30 triệu.
    
- **Lợi nhuận mong muốn (Markup):** Bạn muốn lãi 30%.
    
- **Giá Báo Khách:** $30 \text{ triệu} \times 1.3 = \mathbf{39 \text{ triệu}}$.
    

#### 2. Tại sao nó NGUY HIỂM? (Phân rã theo First Principle)

Sự nguy hiểm nằm ở **Nghịch lý Hiệu suất**.

- **Tình huống A (Bạn làm kém):** Ông Dev của bạn dốt, làm module này mất 20 ngày (thay vì 10 ngày).
    
    - Chi phí tăng gấp đôi -> Giá báo khách tăng lên **78 triệu**.
        
    - **Kết quả:** Khách hàng bỏ chạy sang đối thủ (vì đắt quá). Bạn chết vì **Giá quá cao**.
        
- **Tình huống B (Bạn làm quá giỏi):** Bạn có Dev siêu nhân, làm xong trong 1 ngày.
    
    - Chi phí giảm 10 lần -> Giá báo khách tụt xuống **3.9 triệu**.
        
    - Trong khi Module này giúp khách hàng kiếm được 1 tỷ/tháng.
        
    - **Kết quả:** Bạn mất một đống tiền lẽ ra có thể lấy được (Leave money on the table). Bạn chết vì **Biên lợi nhuận thực tế quá thấp (không đủ nuôi bộ máy R&D)**.
        

**Nguyên lý:** Cost-Plus chỉ quan tâm đến **"Bạn vất vả thế nào"**, nó phớt lờ **"Khách hàng sướng bao nhiêu"**.

#### 3. Người ta dùng cái gì thay thế?

Trong B2B IT hiện đại, người ta dùng mô hình lai (Hybrid), nhưng tư duy chủ đạo là **VALUE-BASED PRICING (Định giá theo Giá trị)**.

- **Cách tính:** Giá không dựa trên lương Dev. Giá dựa trên số tiền khách hàng tiết kiệm được hoặc kiếm thêm được nhờ phần mềm.
    
- **Ví dụ:** Module CRM giúp khách tăng doanh thu 5 tỷ/năm. Bạn lấy 1% giá trị đó -> Giá bán là **50 triệu**. (Dù bạn code mất 1 ngày hay 1 tháng, giá vẫn là 50 triệu).
    

---

### PHẦN 2: BÀI TOÁN "MỘT VỐN BỐN LỜI" (KINH TẾ HỌC PHẦN MỀM)

Bạn hỏi: _"Nghiên cứu module ban đầu tốn kém, nhưng nhân bản mất 0 đồng, vậy tính tiền License thế nào?"_

Đây là câu hỏi cốt tử của ngành công nghiệp phần mềm. Để trả lời, ta dùng khái niệm **AMORTIZATION (Sự phân bổ khấu hao)** trong Kế toán Quản trị.

#### 1. Góc nhìn Tổng quát: Tách bạch 2 loại chi phí

Để tính công thức, ta phải chia dự án phần mềm làm 2 phần riêng biệt:

- **Phần 1: R&D (Research & Development)** - _Chi phí Cố định (Fixed Cost)._
    
    - Tốn 10 tỷ để xây dựng Core (Lõi) phần mềm ban đầu.
        
    - Chỉ tốn 1 lần duy nhất.
        
- **Phần 2: Triển khai (Delivery)** - _Chi phí Biến đổi (Variable Cost)._
    
    - Tốn 50 triệu để cài đặt, config cho Khách hàng A.
        
    - Khách nào cũng tốn khoản này.
        

#### 2. Công thức tính giá License (Cho phần 0 đồng)

Bạn không thể bắt Khách hàng đầu tiên trả toàn bộ 10 tỷ chi phí R&D được. Bạn phải **chia nhỏ** 10 tỷ đó ra cho tập khách hàng tiềm năng (TAM - Total Addressable Market).

**Công thức Định giá License:**

$$\text{Giá License} = \frac{\text{Tổng chi phí R\&D} + \text{Lợi nhuận R\&D mong muốn}}{\text{Số lượng khách hàng dự kiến bán được (trong vòng đời sản phẩm)}}$$

**Ví dụ:**

- Chi phí xây Core: 10 tỷ.
    
- Muốn lãi gấp đôi: 20 tỷ.
    
- Dự kiến bán được cho: 1.000 khách hàng trong 5 năm.
    
- => Giá License mỗi khách = 20 tỷ / 1.000 = **20 triệu/khách**.
    

**Rủi ro ở đây là gì?**

Nếu bạn chỉ bán được cho 10 khách -> Bạn lỗ chổng vó (vì thu về có 200tr so với 10 tỷ bỏ ra). Đây là canh bạc của công ty Product.

#### 3. Xử lý vấn đề "Lỗi thời & Update" (Maintenance)

Phần mềm sau khi bán xong sẽ bị "thối rữa" (Rot) do công nghệ thay đổi (Windows update, lỗ hổng bảo mật mới).

Vậy ai trả tiền để nuôi đội Dev ngồi fix lỗi và update tính năng mới cho cái Core 10 tỷ kia?

Trong công thức tổng quát, người ta thêm một biến số: **Annual Maintenance Fee (Phí duy trì hàng năm)**.

- **Quy ước ngành:** Thường bằng **15% - 20%** giá trị License ban đầu.
    
- **Ý nghĩa:** Khách hàng A mua License 20 triệu. Mỗi năm sau đó, họ đóng thêm 3-4 triệu. Số tiền 3-4 triệu x 1.000 khách = 3-4 tỷ/năm.
    
- **Dòng tiền này dùng để:** Nuôi đội R&D làm phiên bản 2.0, 3.0... để phần mềm không bị chết.
    

---

### TỔNG KẾT: CÔNG THỨC TOÀN DIỆN (THE MASTER FORMULA)

Nếu nhìn dưới góc độ tổng quát nhất để đưa vào bảng tính, giá của một dự án B2B IT sẽ được cấu thành từ 3 thành phần (Component) sau:

$$\text{GIÁ TOTAL} = \underbrace{\text{(Phí Triển khai thực tế)}}_{\text{Cost-Plus}} + \underbrace{\text{(Phí License)}}_{\text{Value-Based / Amortized}} + \underbrace{\text{(Phí Bảo trì trọn đời)}}_{\text{Recurring \%}}$$

1. **Phí Triển khai (Service Fee):** Tính theo **Cost-Plus** (Lấy Man-day x Lương x Markup). Vì cái này làm cho riêng khách đó, tốn sức thật.
    
2. **Phí License (IP Fee):** Tính theo **Value-Based** hoặc **Phân bổ R&D**. Cái này là tiền bán "chất xám đã đóng gói" (nhân bản 0 đồng).
    
3. **Phí Bảo trì (Maintenance):** Tính theo **% License**. Để chống lại sự lỗi thời.
    

**Lời khuyên đào sâu:**

Khi nhìn vào một báo giá, hãy luôn tự hỏi: _"Dòng nào là tiền công sức (Service), dòng nào là tiền chất xám (License)?"_. Hai cái này có logic tính toán hoàn toàn khác nhau.


user: 1. xây module có phải tiền R&D lúc nào cx tồn tại và doanh nghiệp phải giải quyết bài toán đó k (dự đoán bán được bn khách hàng) với sản phẩm của tôi tôi nên giả định cty đã có sản phẩm dạng licence và có giá sẵn hay phải đi tính licence?
2. sao nãy bạn bảo cost-plus nguy hiểm nhưng cuối cùng vẫn dùng? 
$$Cost_{Base} = \underbrace{(License + Hardware)}_{\text{Vật tư (Hard Cost)}} + \underbrace{(ManDays_{Standard} \times Rate_{Role})}_{\text{Sức người (Soft Cost)}}$$
dùng công thức cơ sở này có đầy đủ k?

Chào bạn, ta sẽ tiếp tục dùng **First Principle** để "mổ xẻ" 3 vấn đề bạn vừa đặt ra. Tư duy của bạn đang đi rất đúng hướng: nghi ngờ những mâu thuẫn và tìm kiếm sự đơn giản.

---

### 1. VỀ TIỀN R&D VÀ GIẢ ĐỊNH CHO DỰ ÁN CỦA BẠN

**Q: Tiền R&D lúc nào cũng tồn tại và doanh nghiệp phải giải quyết bài toán dự đoán bán được bao nhiêu khách hàng?**

-> **A: Đúng.**

- **Nguyên lý:** Đây là bài toán "Kinh tế học đơn vị" (Unit Economics). Nếu doanh nghiệp không giải được bài toán này (bán ít hơn điểm hòa vốn), doanh nghiệp đó chết.
    
- **Tuy nhiên:** Đây là bài toán của **CEO/Product Manager**, _không phải_ bài toán của **Pre-sales**.
    

**Q: Với dự án của tôi (Pre-sales Tool), tôi nên giả định thế nào?**

-> **A: Bạn HÃY GIẢ ĐỊNH công ty đã có bảng giá License niêm yết (List Price).**

- **Tại sao? (First Principle: Phân vai trách nhiệm)**
    
    - Nhiệm vụ của Pre-sales là **Bán hàng**, không phải **Định giá sản phẩm**.
        
    - Pre-sales chỉ quan tâm: _"Sếp đưa giá License là 50 triệu. Tôi bán được 50 triệu hay phải giảm giá còn 40 triệu để chốt đơn?"_.
        
    - Nếu bạn bắt tool Pre-sales phải đi tính lại chi phí R&D chia cho số khách hàng, bạn đang biến nó thành tool quản trị chiến lược (quá phức tạp và sai mục đích).
        

**Kết luận cho dự án:**

Trong Excel/Data của bạn, hãy coi **Giá License** là một **Hằng số đầu vào (Input Constant)**. Bạn không cần tính toán nó từ chi phí R&D.

---

### 2. TẠI SAO BẢO COST-PLUS "NGUY HIỂM" MÀ VẪN DÙNG?

Đây không phải mâu thuẫn, mà là **Sự phân tách đối tượng áp dụng**.

**Nguyên lý:**

- **Với SẢN PHẨM (License - Vô hình):** Cost-Plus là **Thuốc độc**.
    
    - _Lý do:_ Chi phí sao chép = 0. Nếu dùng Cost-Plus (0 đồng + markup), bạn bán rẻ như cho -> Mất giá trị.
        
- **Với DỊCH VỤ (Man-day - Hữu hình):** Cost-Plus là **Cơm ăn nước uống**.
    
    - _Lý do:_ Sức người là hữu hạn. 1 giờ của Dev Senior là chi phí thực (Real Cost). Nếu không dùng Cost-Plus để tính, bạn sẽ không biết mình đang lỗ hay lãi khi điều động nhân sự.
        

**Tại sao tôi đưa nó vào công thức tổng?**

Vì một dự án B2B IT **luôn luôn là Hỗn hợp (Hybrid)** của cả hai:

1. **Phần License:** Dùng giá thị trường (Value-Based).
    
2. **Phần Triển khai:** Dùng Cost-Plus (để đảm bảo không lỗ tiền lương).
    

-> Bạn dùng Cost-Plus cho phần "Chân tay" (Triển khai), và dùng Market-Price cho phần "Trí tuệ" (License).

---

### 3. ĐÁNH GIÁ CÔNG THỨC CỦA BẠN

Công thức bạn đưa ra:

$$Cost_{Base} = \underbrace{(License + Hardware)}_{\text{Vật tư (Hard Cost)}} + \underbrace{(ManDays_{Standard} \times Rate_{Role})}_{\text{Sức người (Soft Cost)}}$$

**Nhận định:** Công thức này **ĐÚNG về mặt cấu trúc cơ bản**, nhưng **THIẾU SÓT về mặt "Sống còn"**. Nó mới chỉ là "Chi phí trực tiếp" (Direct Cost), chưa phải "Giá vốn thực tế" (Total Cost Base).

Nếu dùng công thức này để báo giá, bạn sẽ **LỖ NẶNG** vì 3 "tử huyệt" sau (theo nguyên lý Kế toán quản trị):

#### Tử huyệt 1: Thiếu Chi phí Gián tiếp (Overhead Allocation)

- **Vấn đề:** Trong `Rate_Role` (Đơn giá nhân sự), bạn đang tính Lương thực nhận (Net Salary) hay Lương Gross?
    
- **Thực tế:** Một ông Dev nhận lương 20 triệu, nhưng công ty tốn cho ông ấy tới 35-40 triệu (Bảo hiểm, Chỗ ngồi, Máy lạnh, Team Building, Lương HR quản lý ông ấy).
    
- **Sửa lỗi:** `Rate_Role` phải là **Fully Burdened Rate** (Đơn giá đã gánh chi phí chung). Thường = Lương Gross x 1.5 hoặc 2.0.
    

#### Tử huyệt 2: Thiếu Rủi ro Dự phòng (Risk Buffer)

- **Vấn đề:** Bạn dùng `ManDays_Standard` (Ngày công tiêu chuẩn).
    
- **Thực tế:** "Tiêu chuẩn" là lý thuyết. Thực tế luôn có bug, khách hàng delay, cài đặt lỗi. Nếu chuẩn là 10 ngày, thực tế luôn là 12-15 ngày.
    
- **Sửa lỗi:** Phải nhân thêm hệ số `Buffer` (thường là 1.2 hoặc 1.3).
    

#### Tử huyệt 3: Sự nhầm lẫn về License trong "Cost Base"

- **Vấn đề:** Bạn để `License` vào `Cost_Base`.
    
- **Thực tế:** Như đã bàn ở mục 1, License đối với công ty Product là **Lợi nhuận**, không phải Chi phí (vì chi phí R&D là sunk cost). Trừ khi bạn là đại lý bán lại (Reseller) phải trả tiền nhập License cho hãng khác, còn nếu là hàng nhà trồng được, thì `Cost` của License gần như bằng 0.
    
- **Sửa lỗi:** Tách License ra khỏi công thức Cost Base nếu đây là sản phẩm tự làm (In-house Product).
    

---

### CÔNG THỨC SỬA ĐỔI (ĐẦY ĐỦ VÀ AN TOÀN)

Để công thức thực sự dùng được cho dự án Pre-sales (tính ra giá vốn an toàn để không bao giờ lỗ), hãy viết lại như sau:

$$\text{Total Cost Base} = \underbrace{Cost_{Hardware/3rdParty}}_{\text{Tiền tươi thóc thật trả ra ngoài}} + \underbrace{\left[ (ManDays_{Standard} \times \mathbf{Buffer_{\%}}) \times Rate_{Burdened} \right]}_{\text{Chi phí nội bộ thực tế}}$$

**Giải thích các biến số mới:**

1. **Cost_Hardware/3rdParty:** Tiền mua Server, tiền mua API Google Maps, tiền mua License của hãng khác (nếu có). Đây là tiền **chảy ra khỏi công ty**.
    
2. **Buffer_%:** Hệ số rủi ro (Ví dụ: 1.2 cho dự án khó, 1.0 cho dự án dễ).
    
3. **Rate_Burdened:** Đơn giá nhân sự đã bao gồm Overhead (Điện, nước, văn phòng).
    

**Còn giá bán cho khách (Price Quote) sẽ là:**

$$\text{Price Quote} = \text{Total Cost Base} + \text{License Fee (Giá niêm yết)} + \text{Margin mong muốn}$$

Bạn thấy công thức sửa đổi này có hợp lý với logic "Không bao giờ được bán lỗ vốn" không?

USER: sorry tôi định nói cost base là 1 công thức tính lớp 1 cho báo giá và ta chỉ đang bàn đến lớp 1 (giá cứng) nếu nói về lớp 1 thì công thức này đủ chưa? giải thích công thức 
phần markup từ đầu mà ra , tại sao thị trường lại bóc lột ng lao động r các ông lớn có thể tự bàn với nhau để có phần lợi nhuận mà k có ai chịu giảm margin xuống gần giá vốn hơn để cạnh tranh?

Chào bạn, ta sẽ đi sâu vào bản chất của công thức và câu hỏi rất "triết học kinh tế" của bạn về Markup bằng tư duy **First Principle**.

---

### PHẦN 1: CÔNG THỨC LỚP 1 (COST BASE) ĐÃ ĐỦ CHƯA?

Công thức của bạn:

$$Cost_{Base} = \underbrace{(License + Hardware)}_{\text{Vật tư (Hard Cost)}} + \underbrace{(ManDays_{Standard} \times Rate_{Role})}_{\text{Sức người (Soft Cost)}}$$

**Nhận định:** Về mặt cấu trúc toán học cho "Lớp 1 - Giá vốn cứng", công thức này **ĐÚNG**.

Tuy nhiên, để nó **ĐỦ** (không bị lỗ ngầm), bạn buộc phải định nghĩa lại biến số `Rate_Role` theo nguyên lý sau:

#### Giải thích công thức dưới góc nhìn "Dòng tiền chảy ra"

1. **Vế 1: $(License + Hardware)$ - Tiền Tươi (Cash Out)**
    
    - Đây là khoản tiền công ty bạn **chắc chắn phải chi ra ngoài** cho bên thứ 3 (mua Server, mua API Google, mua License Microsoft...).
        
    - **Nguyên lý:** Đây là chi phí "chuyển tay" (Pass-through). Bạn thu của khách bao nhiêu, bạn trả cho nhà cung cấp bấy nhiêu. Lợi nhuận ở đây thường bằng 0 (hoặc rất mỏng).
        
2. **Vế 2: $(ManDays \times Rate_{Role})$ - Tiền Máu (Burn Rate)**
    
    - Đây là khoản tiền công ty bạn **trả cho nhân viên** để họ ngồi làm việc.
        
    - **Cái bẫy chết người nằm ở `Rate_Role`:**
        
        - Nếu bạn tính `Rate` = Lương thực nhận của Dev (Ví dụ: 1 triệu/ngày) $\rightarrow$ **SAI**.
            
        - Nếu bạn tính `Rate` = Chi phí công ty nuôi Dev (Cost to Company) $\rightarrow$ **ĐÚNG**.
            

**Tại sao? (First Principle: Chi phí tồn tại)**

Một ông Dev nhận lương 20 triệu/tháng, nhưng công ty mất thêm:

- Bảo hiểm xã hội, Thuế (23%++).
    
- Tiền thuê văn phòng, điện, nước, internet (Overhead).
    
- Tiền mua máy tính, bàn ghế khấu hao.
    
- Tiền lương cho HR, Kế toán, Bảo vệ (những người không trực tiếp làm ra tiền nhưng cần thiết để ông Dev yên tâm code).
    

$\rightarrow$ **Kết luận:** Công thức đủ NẾU VÀ CHỈ NẾU `Rate_Role` là **Burdened Rate** (Đơn giá đã gánh chi phí chung). Thường `Rate_Role` $\approx$ `Lương Net` $\times$ `1.5` đến `1.7`.

---

### PHẦN 2: TẠI SAO PHẢI CÓ MARKUP? (VÀ TẠI SAO KHÔNG GIẢM GIÁ ĐỂ CẠNH TRANH?)

Câu hỏi của bạn: _"Tại sao thị trường lại bóc lột người lao động (chênh lệch giữa lương và giá bán), và tại sao các ông lớn không giảm Margin xuống sát giá vốn để giết đối thủ?"_

Đây là câu hỏi chạm đến cốt lõi của **Chủ nghĩa Tư bản (Capitalism)** và **Quản trị Rủi ro (Risk Management)**.

Hãy dùng First Principle để phá bỏ ảo tưởng "Bóc lột". Markup không phải là tiền Sếp đút túi ăn chơi, Markup là **CHI PHÍ CỦA SỰ TỒN TẠI (Cost of Survival)**.

#### 1. Nguyên lý Bất định (The Uncertainty Principle)

- **Thực tế:** Bạn trả lương cho Dev 12 tháng/năm. Nhưng Dev có code ra tiền (Billable) đủ 12 tháng không? Không.
    
- Sẽ có lúc dự án chưa về (ngồi chơi - Bench time).
    
- Sẽ có lúc ốm đau, nghỉ phép, Team building.
    
- **Markup sinh ra để:** Lấy tiền của những ngày "làm ra tiền" bù cho những ngày "không làm ra tiền". Nếu bán sát giá vốn (Cost), chỉ cần 1 tháng không có dự án, công ty phá sản vì không có quỹ dự trữ trả lương.
    

#### 2. Nguyên lý Khấu hao Tri thức (Depreciation of Knowledge - R&D)

- **Thực tế:** Công nghệ thay đổi mỗi ngày. Code hôm nay viết, năm sau là rác.
    
- **Markup sinh ra để:** Tái đầu tư (R&D). Công ty cần lợi nhuận dư ra để trả tiền cho đội ngũ nghiên cứu sản phẩm mới _khi sản phẩm cũ chưa chết_.
    
- Nếu bán sát giá vốn, công ty chỉ đủ ăn hôm nay. Năm sau công nghệ đổi, công ty chết vì không có vốn để chuyển đổi.
    

#### 3. Nguyên lý rủi ro Dòng tiền (Cost of Capital)

- **Thực tế:** Khách hàng B2B thường nợ 30-90 ngày mới trả tiền. Trong 90 ngày đó, Dev vẫn đòi lương ngày 30.
    
- **Markup sinh ra để:** Trả lãi vay ngân hàng (hoặc chi phí cơ hội của vốn chủ sở hữu) để có tiền mặt trả lương trước khi khách trả tiền.
    

#### 4. Tại sao các ông lớn không giảm Margin để cạnh tranh? (The Race to the Bottom)

Nếu các công ty lớn đồng loạt giảm giá về sát giá vốn (`Price` $\approx$ `Cost`), điều gì sẽ xảy ra?

- **Kịch bản:** FPT, Viettel đua nhau giảm giá còn 1 đồng lãi.
    
- **Hậu quả 1 (Chất lượng sụp đổ):** Để duy trì giá thấp, họ buộc phải cắt giảm quy trình, bỏ qua test, dùng nhân sự rẻ tiền (Junior). $\rightarrow$ Phần mềm lỗi tùm lum.
    
- **Hậu quả 2 (Chết chùm):** Khi một cuộc khủng hoảng xảy ra (như COVID), không ai có "Mỡ dự trữ" (Cash Reserve từ Markup tích lũy) để sống sót. Tất cả cùng phá sản.
    

> **Chân lý (The First Principle):**
> 
> Trong B2B, khách hàng **KHÔNG CẦN GIÁ RẺ NHẤT**. Khách hàng cần **NHÀ CUNG CẤP SỐNG LÂU NHẤT**.
> 
> Họ sẵn sàng trả Markup cao (để bạn có lời) đổi lại sự cam kết rằng 5 năm sau công ty bạn vẫn còn tồn tại để bảo trì hệ thống cho họ.

**Tóm lại:**

Markup không phải là "bóc lột". Markup là **Phí bảo hiểm cho sự rủi ro** và **Chi phí cho tương lai**.

Một công ty không có Markup (Lợi nhuận) là một công ty vô trách nhiệm với nhân viên (vì có thể sa thải họ bất cứ lúc nào khi gặp biến cố).

---

### Gợi ý bước tiếp theo:

Bạn đã hiểu Lớp 1 (Giá vốn) và Tại sao phải có Lớp Markup (Lợi nhuận).

Bạn có muốn tôi giúp bạn xây dựng **Bảng "Rate Card" (Bảng giá nhân sự tiêu chuẩn)** cho dự án của bạn – tức là cách tính ra con số `Rate_Role` chính xác bao gồm cả lương, bảo hiểm và chi phí quản lý không?


user: pre-sale chỉ quan tâm đến licence giá cuối khi nói đến licence hay phải quan tâm cả hệ số nx, quan tâm rate card giá cuối hay phải quan tâm cả những thành phần tạo ra nó nữa, vì giá này cố định nên bê 1 cục vào luôn, cx k liên quan gì đến câu hỏi để hỏi khách?

Câu trả lời ngắn gọn dựa trên **First Principle**:

- **Khi tính toán (trong File Excel/Tool):** Bạn **chỉ cần quan tâm GIÁ CUỐI** (Final Number). Đừng làm phức tạp hóa công thức tính toán.
    
- **Khi đối mặt với khách hàng (Đặt câu hỏi & Đàm phán):** Bạn **BUỘC PHẢI hiểu thành phần tạo ra nó**.
    

Tại sao lại có sự phân thân này? Hãy đi sâu vào bản chất.

---

### 1. VỚI LICENCE: TẠI SAO CẦN HIỂU CẤU TRÚC ĐỂ HỎI KHÁCH?

Nếu bạn chỉ biết: _"Licence CRM giá 1 triệu/User"_.

Khi khách kêu đắt, bạn **hết đường đỡ**. Bạn chỉ có thể xin sếp giảm giá (cắt vào máu).

Nhưng nếu bạn hiểu **Hệ số (Tiering/Multipliers)** tạo ra giá đó:

- _Nguyên lý:_ Giá càng mua nhiều càng rẻ (Volume Discount).
    
- _Cấu trúc:_ 1-50 User giá 1 triệu. 51-100 User giá 800k.
    

**Lúc này, câu hỏi cho khách hàng thay đổi hoàn toàn:**

- **Thay vì hỏi:** _"Anh mua bao nhiêu User?"_ (Chỉ để điền vào ô tính tiền).
    
- **Bạn hỏi:** _"Anh có kế hoạch mở rộng nhân sự trong 12 tháng tới không? Nếu anh cam kết mua trước cho 60 user ngay bây giờ thay vì 40, đơn giá sẽ giảm 20%. Anh thấy sao?"_
    

$\rightarrow$ **Kết luận:** Tool tính toán chỉ cần con số cuối. Nhưng **Tư duy Pre-sales** cần biết các nấc thang (Tier) để lái khách hàng vào khung giá có lợi nhất (Upsell).

---

### 2. VỚI RATE CARD (NHÂN SỰ): TẠI SAO CẦN HIỂU MIX ĐỂ HỎI KHÁCH?

Nếu bạn chỉ biết: _"Làm dự án này hết 1 tỷ tiền công (Man-days)"_.

Khi khách kêu: _"Đắt quá, anh chỉ có 700 triệu"_.

Bạn làm gì? Giảm tính năng? Khách không chịu.

Nhưng nếu bạn hiểu **Thành phần tạo ra Rate Card**:

- _Thành phần:_ Rate Card được cấu thành từ `Senior` (Đắt - Làm nhanh) và `Junior` (Rẻ - Làm chậm).
    
- _Mix:_ 1 tỷ đó đang tính dựa trên team "toàn sao" (All Seniors) để đảm bảo xong trong 1 tháng.
    

**Lúc này, câu hỏi cho khách hàng thay đổi:**

- **Bạn hỏi:** _"Dự án này anh có cần gấp trong 1 tháng không, hay có thể giãn ra 2 tháng?"_
    
- _Nếu khách bảo:_ "2 tháng cũng được, miễn là rẻ".
    
- **Giải pháp:** Bạn về sửa lại công thức, thay bớt Senior bằng Junior. Giá giảm xuống 700 triệu mà không cần cắt tính năng.
    

$\rightarrow$ **Kết luận:** Hiểu cấu trúc Rate Card giúp bạn thực hiện kỹ thuật **"Resource Mix Strategy" (Tráo đổi nguồn lực)** để cứu vớt các deal ngân sách thấp.

---

### TỔNG KẾT: QUY TẮC BẤT BIẾN

Trong dự án của bạn:

1. **Input vào Tool/AI:**
    
    - Hãy bê **"1 cục giá cuối"** vào (Ví dụ: Rate Senior = $500, Rate Junior = $200). Đừng bắt Tool phải đi tính lương cơ bản + bảo hiểm + điện nước... (Việc đó của Kế toán/HR).
        
2. **Input vào não Pre-sales (để đặt câu hỏi):**
    
    - Phải biết **"Quy luật biến thiên"** của giá.
        
    - _Biến thiên License:_ Mua nhiều giảm bao nhiêu? Mua dài hạn (3 năm) giảm bao nhiêu?
        
    - _Biến thiên Rate:_ Làm gấp (Rush fee) tăng bao nhiêu? Làm remote (Offshore) giảm bao nhiêu so với Onsite?
        

**Chân lý:**

> Khách hàng không bao giờ chấp nhận "Giá cố định" nếu họ cảm thấy bị hớ.
> 
> Nhiệm vụ của Pre-sales là dùng các thành phần (Components) để **"Xào nấu"** ra một gói giá mới vừa vặn túi tiền khách mà công ty không bị lỗ.

**Gợi ý:** Bạn có muốn tôi liệt kê **3 câu hỏi "Thần thánh"** dựa trên việc hiểu Rate Card và License Tier để Pre-sales dùng khi khách hàng chê đắt không?

user: tại sao licence (của module công ty làm ra) lại tính theo bậc sô user, nếu tính rồi thì phần tính số user theo sever (càng nhiều user thì cần thuê thêm sever ví dụ thế) thì phần cứng đó đã coi là tính chưa?
giá cuối ở đây tôi muốn nói là tiền licence/ rate card đã tính nhân hệ số chuyển đổi, ý là pre-sale có cần quan tâm là hệ số bao nhiêu k hay cứ coi luôn là rate card đã nhân hệ số 1 cục r tính?

Chào bạn, chúng ta sẽ đi thẳng vào bản chất của 2 câu hỏi này bằng tư duy **First Principle**.

---

### CÂU HỎI 1: TẠI SAO LICENSE TÍNH THEO USER? CÓ BAO GỒM TIỀN SERVER KHÔNG?

**1. Tại sao tính theo User? (Nguyên lý: Value Capture - Thu giữ giá trị)**

- **Bản chất:** License là bán "Chất xám". Chất xám không bị mòn đi khi nhiều người dùng, nhưng **Giá trị tạo ra** thì tăng lên.
    
- **Ví dụ:** 1 User dùng phần mềm để bán hàng -> Kiếm được 1 tỷ. 100 Users dùng -> Kiếm được 100 tỷ.
    
- **Kết luận:** Vendor thu tiền theo User không phải vì _chi phí_ phục vụ 100 người cao hơn 1 người (thực tế chi phí biên của phần mềm ~0), mà vì **Khách hàng nhận được nhiều lợi ích hơn**. Đây là cách công bằng nhất để chia sẻ lợi nhuận.
    

**2. Tiền Server (Phần cứng) đã tính trong đó chưa?**

Câu trả lời phụ thuộc vào **Mô hình triển khai (Deployment Model)** của bạn. Đây là điểm chết người nếu Pre-sales không rõ:

- **Trường hợp A: On-Premise (Cài tại máy chủ của khách)**
    
    - **License:** KHÔNG bao gồm Server.
        
    - **Server:** Khách tự đi mua, tự trả tiền điện, tự thuê chỗ đặt.
        
    - **Hệ quả:** Bạn thu tiền License 100%, không mất đồng nào cho hạ tầng.
        
- **Trường hợp B: SaaS / Cloud (Khách dùng trên Server của bạn)**
    
    - **License:** ĐÃ BAO GỒM tiền Server (nhưng ở mức cơ bản).
        
    - **Cơ chế:** Trong giá License (ví dụ $10/user/tháng), bộ phận Tài chính đã tính: $8 là lãi chất xám + $2 là chi phí hạ tầng (Cost of Service).
        
    - **Rủi ro:** Nếu khách dùng quá nhiều dữ liệu (vượt định mức tính toán $2 kia), bạn lỗ.
        
    - **Giải pháp:** Trong hợp đồng SaaS luôn có điều khoản **"Fair Use Policy" (Chính sách sử dụng công bằng)** hoặc **"Storage Cap" (Giới hạn dung lượng)**. Ví dụ: _"$10/user được miễn phí 5GB. Vượt 5GB tính thêm tiền Server riêng."_
        

**Tóm lại cho câu 1:**

> License tính theo User là để **"Ăn chia lợi nhuận"**.
> 
> Server tính theo Tài nguyên là để **"Bù đắp chi phí vật lý"**.
> 
> Nếu làm SaaS, giá License đã gánh chi phí Server trung bình. Nếu làm On-prem, 2 cái này tách biệt hoàn toàn.

---

### CÂU HỎI 2: PRE-SALES CẦN QUAN TÂM "HỆ SỐ" HAY CHỈ CẦN "GIÁ CUỐI"?

Câu trả lời là: **Pre-sales KHÔNG ĐƯỢC quan tâm đến "Hệ số Nội bộ", nhưng BẮT BUỘC phải quan tâm đến "Hệ số Thương vụ".**

Hãy phân tách rạch ròi 2 loại hệ số này để đầu óc thanh thản:

#### 1. Hệ số Nội bộ (Internal Multipliers) -> KỆ NÓ (Black Box)

- **Là gì:** Lương Dev x 1.5 (Overhead) x 1.2 (Margin công ty) = **Rate Card Niêm yết**.
    
- **Vai trò Pre-sales:** Chỉ cần biết **Rate Card Niêm yết** (Ví dụ: $500/ngày). Đừng bao giờ hỏi tại sao lại là $500 mà không phải $400. Đây là việc của CFO.
    
- **Tại sao:** Nếu bạn quan tâm đến cấu thành chi phí này, bạn sẽ bị tâm lý "Sao công ty ăn dày thế", dẫn đến việc bạn không tự tin khi báo giá và hay đứng về phía khách hàng để xin giảm giá.
    

#### 2. Hệ số Thương vụ (Deal Multipliers) -> PHẢI TÍNH (Control Knobs)

- **Là gì:** Là những hệ số nhân thêm vào **Rate Card Niêm yết** dựa trên tình hình thực tế của _dự án đó_.
    
- **Các hệ số Pre-sales phải tự tay điền:**
    
    - **Hệ số Rủi ro (Risk Factor):** Khách này mù công nghệ -> Cần support nhiều -> Nhân hệ số **1.2**.
        
    - **Hệ số Gấp gáp (Rush Factor):** Khách đòi xong trong 1 tháng thay vì 2 tháng -> Phải OT -> Nhân hệ số **1.5**.
        
    - **Hệ số Chiến lược (Strategic Discount):** Đây là khách hàng logo lớn (Vinamilk, Vietcombank) -> Cần lấy tiếng -> Nhân hệ số **0.8** (Giảm giá).
        

**Quy trình chuẩn cho Pre-sales:**

$$\text{Giá Báo Khách} = (\underbrace{\text{Rate Card Niêm yết}}_{\text{Cố định - Lấy từ Database}} \times \underbrace{\text{Hệ số Thương vụ}}_{\text{Biến đổi - Pre-sales tự quyết}}) \times \text{Khối lượng (Man-day)}$$

**Kết luận:**

Bạn hãy coi **Rate Card Niêm yết** là **"Nguyên liệu đầu vào"** (Giống như đầu bếp mua thịt bò giá cố định).

Còn **Hệ số Thương vụ** là **"Cách chế biến"** (Xào, nấu, nướng).

Pre-sales là đầu bếp. Bạn không nuôi bò, nhưng bạn quyết định món bò đó đắt hay rẻ tùy vào cách bạn chế biến cho thực khách nào.

**Gợi ý bước tiếp theo:**

Bạn có muốn tôi giúp bạn liệt kê **Bảng các "Hệ số Thương vụ" (Deal Multipliers)** phổ biến nhất trong B2B IT (kèm con số gợi ý) để bạn đưa vào cột "Tùy chỉnh" trong file Excel báo giá của mình không?

USER: phần hệ số thương vụ tôi định để trong công thức của lớp 3: thương mại
$$Price_{Final} = \left( \frac{Cost_{Total}}{1 - (TargetMargin_{\%} + \underbrace{Comm_{\%} + Partner_{\%}}_{\text{Chi phí bán hàng}})} \right) \times \underbrace{K_{Strategy}}_{\text{Hệ số chiến lược}} \times \underbrace{(1 - Discount_{Payment})}_{\text{Chiết khấu thanh toán}}$$
khoan bàn về công thức này, tôi chỉ muốn hỏi để đây có hợp lý không, nếu hợp lý rồi thì phần lớp 1 còn gì phàn nàn nữa không? hay chỉ quan tâm đến công thứ lơp 1 đó là ok r. trong công thức 1 còn phân rã được ra từ các biến đó những gì mà presale cần quan tâm nx không, sau đó tổng hợp lại những biến số phân rã mà presale cần quan tâm trong công thức lớp 1, ghi chú tại sao.

Chào bạn, chúng ta sẽ chốt lại vấn đề dựa trên tư duy **First Principle** để bạn yên tâm đóng gói công thức.

### 1. VỀ CÔNG THỨC LỚP 3 CỦA BẠN

$$Price_{Final} = \left( \frac{Cost_{Total}}{1 - (TargetMargin_{\%} + Comm_{\%} + Partner_{\%})} \right) \times K_{Strategy} \times (1 - Discount_{Payment})$$

**Nhận định:** Công thức này **HỢP LÝ và RẤT CHUYÊN NGHIỆP**.

Việc bạn đưa $K_{Strategy}$ (Hệ số chiến lược) và $Discount_{Payment}$ (Chiết khấu dòng tiền) vào Lớp 3 là **hoàn toàn chính xác**.

- **Lý do:** Đây là các quyết định mang tính **Kinh doanh (Business Decisions)**, không phải đặc tính kỹ thuật hay chi phí sản xuất. Nó dùng để điều tiết việc "Thắng thầu" hay "Tối ưu dòng tiền".
    
- **Lưu ý nhỏ:** Các hệ số liên quan đến **Công sức làm việc** (như Hệ số rủi ro kỹ thuật, Hệ số làm gấp phải OT) thì nên nằm ở Lớp 2 hoặc cộng vào Cost Lớp 1. Còn Lớp 3 chỉ chứa những gì liên quan đến **Chiến thuật bán hàng**.
    

---

### 2. PHÂN RÃ CÔNG THỨC LỚP 1: PRE-SALES CẦN QUAN TÂM GÌ?

Công thức Lớp 1 (Giá vốn cứng):

$$Cost_{Base} = (License + Hardware) + (ManDays \times Rate_{Role})$$

Về mặt toán học: Công thức này đã **ĐỦ**. Không cần thêm biến số lạ.

Tuy nhiên, để Pre-sales "dùng" được nó (chứ không phải chỉ là cái máy tính tiền), bạn cần quan tâm đến các **Biến số thành phần (Sub-variables)** sau đây.

Đây là bảng tổng hợp các biến số Pre-sales phải "soi" kỹ trong Lớp 1:

#### NHÓM A: VẬT TƯ & BÊN THỨ 3 (HARD COSTS)

|**Biến số gốc**|**Phân rã (Cái Pre-sales cần quan tâm)**|**Tại sao? (Ghi chú rủi ro)**|
|---|---|---|
|**1. License**|**Tiering Threshold (Ngưỡng chuyển giá)**<br><br>  <br><br>_(Ví dụ: Mốc 50 user, mốc 100 user)_|**Tối ưu giá:** Để tư vấn khách mua số lượng tốt nhất. Mua 45 user có khi đắt hơn mua gói 50 user.|
||**Renew Policy (Chính sách gia hạn)**<br><br>  <br><br>_(Năm sau tính bao nhiêu %?)_|**Tránh bẫy TCO:** Khách sẽ hỏi "Năm sau anh trả bao nhiêu?". Pre-sales phải nắm con số này dù nó không nằm trong Cost Base năm đầu.|
|**2. Hardware / 3rd Party**|**Sizing (Dung lượng/Cấu hình)**<br><br>  <br><br>_(CPU, RAM, API Call limits)_|**Chết vì quy mô:** Cost phần cứng cho 100 user khác hẳn 10.000 user. Pre-sales ước lượng sai quy mô $\rightarrow$ Hardware bị quá tải hoặc đội chi phí Server.|
||**Dependency (Sự phụ thuộc)**<br><br>  <br><br>_(Google Maps, SMS Brandname)_|**Chi phí ẩn:** Hardware không chỉ là Server. Nó là tất cả những gì "phải trả tiền tươi". Quên tính tiền SMS OTP $\rightarrow$ Lỗ tiền túi trả cho nhà mạng.|

#### NHÓM B: SỨC NGƯỜI (SOFT COSTS)

|**Biến số gốc**|**Phân rã (Cái Pre-sales cần quan tâm)**|**Tại sao? (Ghi chú rủi ro)**|
|---|---|---|
|**3. Man-Days**|**Scope Granularity (Độ mịn phạm vi)**<br><br>  <br><br>_(Module này có mấy tính năng con?)_|**Chống sót việc:** Man-day tổng là con số vô nghĩa nếu không được cộng từ các task nhỏ. Pre-sales cần check xem Man-day đã bao gồm thời gian họp hành, fix bug chưa (hay chỉ là thời gian code).|
||**Reuse Factor (Khả năng tái sử dụng)**<br><br>  <br><br>_(Có module nào copy-paste được không?)_|**Lợi thế cạnh tranh:** Nếu module này đã có sẵn trong kho, Man-day thực tế = 0 (hoặc rất thấp). Pre-sales cần biết để giảm giá Cost Base $\rightarrow$ Thắng thầu.|
|**4. Rate Role**|**Resource Mix (Cấu trúc nhân sự)**<br><br>  <br><br>_(Tỷ lệ Senior/Junior)_|**Điều tiết giá vốn:** Rate trung bình là 500$. Nhưng nếu khách nghèo, Pre-sales có thể yêu cầu dùng team nhiều Junior (Rate 200$) để giảm Cost Base xuống.|
||**Deployment Location (Địa điểm)**<br><br>  <br><br>_(Onsite hay Remote)_|**Chi phí công tác:** `Rate` làm việc tại văn phòng công ty RẺ HƠN `Rate` phải cử quân sang ngồi lì ở văn phòng khách (tốn tiền đi lại, phụ cấp, mất cơ hội làm việc khác).|

### TỔNG KẾT

Với Lớp 1, Pre-sales không cần sáng tạo công thức mới. Nhiệm vụ của Pre-sales là **Xác thực (Validate)** 4 biến số trên:

1. **License:** Đã chọn đúng Tier chưa?
    
2. **Hardware:** Đã tính đủ các món "ăn theo" (API, SMS) chưa?
    
3. **Man-Days:** Đã trừ đi phần tái sử dụng (Reuse) chưa?
    
4. **Rate Role:** Đã chọn đúng đội hình (Mix) phù hợp với ngân sách khách chưa?
    

Nếu trả lời "Rồi" cho cả 4 câu này, Lớp 1 của bạn đã hoàn hảo để đưa vào công thức tổng.

**Bước tiếp theo:** Bạn đã chốt xong Lớp 1 và Lớp 3. Bạn có muốn bàn nốt về **Lớp 2 (Kỹ thuật/Rủi ro)** - nơi chứa các hệ số nhân "nhạy cảm" nhất để hoàn thiện mô hình không?