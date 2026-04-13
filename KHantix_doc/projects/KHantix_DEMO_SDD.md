# Software Design Document (SDD) - KHantix AI CPQ DEMO
_last updated: 2026-04-13_
_author: Khantix Dev Team_

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG
Dự án DEMO hiện tại (nằm trong thư mục `DEMO`) được xây dựng dưới dạng một **Monolithic API Server** chạy bằng **Node.js, Express và TypeScript**. 

Cấu trúc thư mục được chia theo dạng Modular (chia module theo Domain):
```text
src/
 ├── calculators/    (Chứa Business Logic toán học)
 ├── config/         (Load cấu hình nội bộ và Heuristic)
 ├── llm/            (Adapter giao tiếp với API của AI)
 ├── prompts/        (Chứa system messages)
 ├── schemas/        (Data structures định nghĩa bằng code)
 ├── services/       (Tầng điều phối Investigator & Calculator)
 ├── strategies/     (Các mẫu thiết kế chiến lược cho tính giá)
 ├── types/          (TypeScript definitions)
 └── server.ts       (API Routes & App Entry point)
```

### Tại sao lại chọn kiến trúc hiện tại?
Kiến trúc này được chọn dựa trên **Domain-Driven Design (DDD)** linh hoạt pha trộn với **Adapter Pattern** và **Strategy Pattern**:

1. **Phân tách Rõ Ràng (Separation of Concerns):** Logic Toán Học (Calculators), Logic AI (LLM Adapter), và Logic Giao thức mạng (Express HTTP) được tách độc lập. Bạn có thể thay đổi prompt AI mà không làm đứt gãy công thức tính giá.
2. **Adapter Pattern cho LLM (`llm/llm-adapter.ts`):** Giúp hệ thống không bị "vendor lock-in" (khóa cứng vào một nhà cung cấp). Có thể switch giữa Gemini, Anthropic (Claude), OpenAI chỉ thông qua biến môi trường.
3. **Phản chiếu trực tiếp First Principle (FP0):** Tầng `calculators` chia thành `base-cost`, `risk-multiplier`, `commercial` map 1:1 với 3 Lớp công thức trong tài liệu Phân rã định giá.
4. **Tốc độ (Time-to-market):** Express + Node.js cho phép xoay vòng nghiệp vụ cực nhanh để chứng minh tính khả thi (Proof of Concept - PoC) của dự án.

### Đánh giá Lợi - Hại của Kiến trúc này:
- **Lợi ích:** 
  - Codebase cực kỳ rõ ràng, map chuẩn xác 100% với tài liệu thiết kế.
  - Scale về mặt nghiệp vụ (thêm công thức Lớp 4, Lớp 5) rất dễ vào thư mục `calculators`.
  - Khả năng thay thế các bộ não AI rất mượt mà.
- **Tác hại (Hạn chế hiện tại):**
  - **Stateful Server:** Đang lưu session ở một in-memory map (`const sessions: SessionStore = new Map();` trong `server.ts`). Việc này đồng nghĩa việc hệ thống CHỨT KẾT NỐI nếu Server restart, và KHÔNG THỂ scale ngang (tạo nhiều instance server) vì mất đồng bộ bộ nhớ.
  - **Thiếu Tầng Dữ Liệu (Data Layer):** Đọc data thẳng từ file tĩnh và lưu tạm bằng biến cục bộ thay vì DBMS (Postgres/MongoDB). Điều này không an toàn cho Production.

---

## 2. KẾ HOẠCH CLEAN CODE (REFACTORING PLAN)

Để nâng cấp dự án này lên Cấp độ Production, hệ thống cần thực hiện các vòng Clean Code sau:

1. **Tách Tầng Routing & Controllers:** 
   - Hiện tại `server.ts` đang gánh quá nhiều (khởi tạo, định tuyến, xử lý request, bắt lỗi).
   - *Hành động:* Chia nhỏ thành `routes/chat.route.ts`, `routes/calculator.route.ts` và chuyển logic sang `controllers/`.
2. **Áp dụng Repository Pattern cho Session DB:**
   - Xóa bỏ việc dùng `new Map()` trong `server.ts`.
   - *Hành động:* Tạo interface `ISessionRepository`. Implement nó bằng Redis (để lưu trạng thái hội thoại) hoặc PostgresSQL (để lưu Audit Log và Override History). Việc này giúp app thành Stateless và sẵn sàng deploy lên Docker/K8s.
3. **Nâng cấp Validation cho Input (Anti-corruption Layer):**
   - Hiện tại API bắt lỗi thủ công (ví dụ: `if (!sessionId)`). 
   - *Hành động:* Sử dụng thư viện như `Zod` hoặc `Joi` làm middleware để validate nghiêm ngặt Payload HTTP gửi lên (`OverrideRequest`, `CalculateRequest`).
4. **Dependency Injection (DI):**
   - Hiện tại các classes tự tạo new objects (VD: `const calculator = new CalculatorService()`).
   - *Hành động:* Sử dụng DI Container (như `TSyringe` hoặc `InversifyJS`) để inject các Services vào Controller. Dễ mock dữ liệu khi viết Unit Test.
5. **Exception Handling Standardization:**
   - Xây dựng một Global Error Handler chuẩn mực, trả về các Business Error Codes (ví dụ: `ERR_SLOT_NOT_FOUND`, `ERR_MATH_DIVISION_ZERO`) thay vì in log console rồi quăng error raw 500.

---

## 3. MAPPING VỚI GIAI ĐOẠN 1 (ĐÁNH GIÁ THIẾU SÓT VÀ THỪA THÃI)

### Đối chiếu theo Scope của Giai đoạn 1:
Theo tài liệu thiết kế, **Giai đoạn 1** tập trung vào Flow cơ bản: AI hỏi khách $\rightarrow$ Lấp đầy Slot JSON $\rightarrow$ Math Engine chạy 3 lớp công thức xuất ra Báo giá.

#### ✅ NHỮNG GÌ ĐÃ LÀM ĐƯỢC (Rất xuất sắc)
- **Tầng 1 (The Investigator):** Chạy mượt mà tại `POST /api/chat` và `investigator.service.ts`. Đã cài cắm Hệ thống Prompt Heuristic chống Hallucination.
- **Tầng 2 (The Inferencer):** LLM có khả năng mapping nội suy (hiểu người dùng nói gì để đẩy Slot tương ứng).
- **Tầng 3 (The Calculator):** Tách bạch rõ 3 file Calculator đúng như FP0 (Base Cost, Risk, Commercial).

#### ❌ NHỮNG GÌ CÒN THIẾU SÓT (Missing)
- **Thiết kế Database chuẩn cho File Cấu Hình:** Hệ thống hiện vẫn phải tải từ file `.csv` (`loadInternalConfigs`). Giai đoạn 1 vốn dĩ phải map Heuristic và Tham số từ DB thật.
- **Report Generator (Từ Lỗ hổng 1):** Server hiện đã trả về Breakdown bằng Object JSON hoàn hảo ở `POST /api/calculate`, nhưng **chưa có chức năng Convert thành Markdown "Explainable Report"** ngay dưới Backend (có vẻ như tính năng render báo cáo đang đẩy lên Frontend xử lý?).

#### 🗑️ NHỮNG GÌ BỊ THỪA (Over-engineered/Lấn sang Phase 2)
- Dự án `DEMO` này thực chất đã **lấn sân sang cả Giai đoạn 2**. 
- API `POST /api/override` cùng các file lưu `overrideLogs`, xử lý so sánh `delta / deltaPercent` là tính năng Human-in-the-loop (Pre-sales Override) mới được vẽ ra ở **Phiên bản Phase 2**.
- *Đánh giá:* Team Dev đã code vượt mức kỳ vọng của Phase 1. Chức năng Overrride là xuất sắc nhưng nó làm cho codebase của Phase 1 phình to hơn so với scope thiết kế ban đầu. Có thể đóng gói nó kỹ hơn ở tầng Controller riêng để review cho việc phân quyền ở các bước tiếp theo.
