"""
generate_heuristic_matrix_v2.py
───────────────────────────────
Tạo file heuristic_matrix_v2.csv — Bảng Quy tắc Suy luận (Heuristic Ruleset)
ánh xạ câu trả lời đời thường của khách hàng B2B → Effort Multiplier (EM)
cho từng chiều rủi ro con theo mô hình COCOMO II.

Methodology: First Principle Protocol (FP0) × COCOMO II × AI-CPQ
Output: heuristic_matrix_v2.csv (same directory)

Mỗi EM_ID có:
  - ≥2 dòng "Tốt nhất" (EM gần 1.0)
  - ≥2 dòng "Tệ nhất" (EM gần Max)
  - 1  dòng "Fallback" (keyword: "chưa biết", "hỏi lại IT")
"""

import pandas as pd
import os

# ─── EM Definitions ──────────────────────────────────────────────────
# fmt: off
rows = [
    # ══════════════════════════════════════════════════════════════════
    # LỚP 2 — RỦI RO & PHỨC TẠP
    # ══════════════════════════════════════════════════════════════════

    # ── EM_D1: Data Format ────────────────────────────────────────────
    # Best (EM ≈ 1.00)
    {"EM_ID": "EM_D1", "EM_Name": "Data Format Complexity",
     "Dictionary_Param": "Data Format",
     "User_Symptom_Keywords": "['SQL', 'database', 'cơ sở dữ liệu chuẩn', 'PostgreSQL', 'MySQL']",
     "EM_Default": 1.00, "EM_Min": 1.00, "EM_Max": 1.20,
     "Reasoning_Hint": "Dữ liệu đã nằm trong RDBMS chuẩn, không cần ETL pipeline chuyển đổi."},
    {"EM_ID": "EM_D1", "EM_Name": "Data Format Complexity",
     "Dictionary_Param": "Data Format",
     "User_Symptom_Keywords": "['API JSON', 'REST API', 'dữ liệu có cấu trúc', 'XML chuẩn']",
     "EM_Default": 1.02, "EM_Min": 1.00, "EM_Max": 1.20,
     "Reasoning_Hint": "Dữ liệu có cấu trúc rõ ràng, chỉ cần adapter nhẹ."},
    # Worst (EM ≈ Max)
    {"EM_ID": "EM_D1", "EM_Name": "Data Format Complexity",
     "Dictionary_Param": "Data Format",
     "User_Symptom_Keywords": "['Excel', 'file Excel', 'mỗi chi nhánh 1 file', 'Google Sheets', 'spreadsheet']",
     "EM_Default": 1.15, "EM_Min": 1.00, "EM_Max": 1.20,
     "Reasoning_Hint": "Excel không chuẩn hóa, mỗi chi nhánh 1 format riêng → cần ETL pipeline chuyển đổi."},
    {"EM_ID": "EM_D1", "EM_Name": "Data Format Complexity",
     "Dictionary_Param": "Data Format",
     "User_Symptom_Keywords": "['PDF', 'scan', 'giấy', 'viết tay', 'hình chụp', 'ảnh hóa đơn']",
     "EM_Default": 1.20, "EM_Min": 1.00, "EM_Max": 1.20,
     "Reasoning_Hint": "PDF/scan → cần OCR + validation thủ công, tỷ lệ lỗi rất cao."},
    # Fallback
    {"EM_ID": "EM_D1", "EM_Name": "Data Format Complexity",
     "Dictionary_Param": "Data Format",
     "User_Symptom_Keywords": "['chưa biết', 'hỏi lại IT', 'để kiểm tra', 'không rõ format']",
     "EM_Default": 1.10, "EM_Min": 1.00, "EM_Max": 1.20,
     "Reasoning_Hint": "Không rõ format → dùng giá trị trung bình ngành. Cần xác nhận thêm."},

    # ── EM_D2: Data Volume ────────────────────────────────────────────
    # Best
    {"EM_ID": "EM_D2", "EM_Name": "Data Volume Scale",
     "Dictionary_Param": "Data Volume",
     "User_Symptom_Keywords": "['1-2 năm', 'vài trăm dòng', 'mới mở', 'startup', 'ít dữ liệu']",
     "EM_Default": 1.00, "EM_Min": 1.00, "EM_Max": 1.25,
     "Reasoning_Hint": "Volume nhỏ, migration nhanh, không cần batch processing."},
    {"EM_ID": "EM_D2", "EM_Name": "Data Volume Scale",
     "Dictionary_Param": "Data Volume",
     "User_Symptom_Keywords": "['2-3 năm', 'vài ngàn dòng', 'không nhiều lắm', 'dưới 10 ngàn']",
     "EM_Default": 1.05, "EM_Min": 1.00, "EM_Max": 1.25,
     "Reasoning_Hint": "Volume vừa phải, migration standard, rủi ro thấp."},
    # Worst
    {"EM_ID": "EM_D2", "EM_Name": "Data Volume Scale",
     "Dictionary_Param": "Data Volume",
     "User_Symptom_Keywords": "['5-10 năm', 'chục ngàn dòng', 'nhiều chi nhánh', 'lâu năm']",
     "EM_Default": 1.18, "EM_Min": 1.00, "EM_Max": 1.25,
     "Reasoning_Hint": "Volume lớn → cần batch processing, dedup, phân trang migration."},
    {"EM_ID": "EM_D2", "EM_Name": "Data Volume Scale",
     "Dictionary_Param": "Data Volume",
     "User_Symptom_Keywords": "['trên 10 năm', 'trăm ngàn dòng', 'cả triệu record', 'kho dữ liệu khổng lồ']",
     "EM_Default": 1.25, "EM_Min": 1.00, "EM_Max": 1.25,
     "Reasoning_Hint": "Volume rất lớn → cần data warehouse strategy, incremental migration, parallel processing."},
    # Fallback
    {"EM_ID": "EM_D2", "EM_Name": "Data Volume Scale",
     "Dictionary_Param": "Data Volume",
     "User_Symptom_Keywords": "['chưa biết', 'hỏi lại IT', 'để kiểm tra', 'không rõ bao nhiêu']",
     "EM_Default": 1.12, "EM_Min": 1.00, "EM_Max": 1.25,
     "Reasoning_Hint": "Không rõ volume → dùng giá trị trung bình ngành (~5 năm dữ liệu)."},

    # ── EM_D3: Data Integrity ─────────────────────────────────────────
    # Best
    {"EM_ID": "EM_D3", "EM_Name": "Data Integrity Quality",
     "Dictionary_Param": "Data Integrity",
     "User_Symptom_Keywords": "['dữ liệu sạch', 'đã validate', 'có quy trình nhập', 'kiểm tra đầu vào']",
     "EM_Default": 1.00, "EM_Min": 1.00, "EM_Max": 1.15,
     "Reasoning_Hint": "Dữ liệu đã có quy trình QA, ít lỗi, migration an toàn."},
    {"EM_ID": "EM_D3", "EM_Name": "Data Integrity Quality",
     "Dictionary_Param": "Data Integrity",
     "User_Symptom_Keywords": "['tương đối gọn', 'có chuẩn nhập liệu', 'ít sai sót', 'đã audit']",
     "EM_Default": 1.03, "EM_Min": 1.00, "EM_Max": 1.15,
     "Reasoning_Hint": "Dữ liệu khá gọn nhưng có thể có edge case nhỏ."},
    # Worst
    {"EM_ID": "EM_D3", "EM_Name": "Data Integrity Quality",
     "Dictionary_Param": "Data Integrity",
     "User_Symptom_Keywords": "['dữ liệu rác', 'trùng lặp', 'thiếu trường', 'nhập lung tung', 'mỗi người nhập 1 kiểu']",
     "EM_Default": 1.12, "EM_Min": 1.00, "EM_Max": 1.15,
     "Reasoning_Hint": "Dữ liệu bẩn → cần cleansing pipeline + dedup + manual review."},
    {"EM_ID": "EM_D3", "EM_Name": "Data Integrity Quality",
     "Dictionary_Param": "Data Integrity",
     "User_Symptom_Keywords": "['không ai quản lý', 'chưa bao giờ dọn', 'sai be bét', 'data mấy đời rồi']",
     "EM_Default": 1.15, "EM_Min": 1.00, "EM_Max": 1.15,
     "Reasoning_Hint": "Dữ liệu cực rác → phải build data profiling + cleansing + manual validation."},
    # Fallback
    {"EM_ID": "EM_D3", "EM_Name": "Data Integrity Quality",
     "Dictionary_Param": "Data Integrity",
     "User_Symptom_Keywords": "['chưa biết', 'hỏi lại IT', 'không rõ chất lượng', 'để kiểm tra lại']",
     "EM_Default": 1.07, "EM_Min": 1.00, "EM_Max": 1.15,
     "Reasoning_Hint": "Không rõ chất lượng → giả định trung bình, cần data profiling trước khi xác nhận."},

    # ── EM_I1: API Availability ───────────────────────────────────────
    # Best
    {"EM_ID": "EM_I1", "EM_Name": "API Availability",
     "Dictionary_Param": "API Availability",
     "User_Symptom_Keywords": "['có API', 'mở cổng sẵn', 'REST API', 'có tài liệu API', 'webhook']",
     "EM_Default": 1.00, "EM_Min": 1.00, "EM_Max": 1.20,
     "Reasoning_Hint": "API sẵn có, tài liệu đầy đủ → tích hợp nhanh, ít rủi ro."},
    {"EM_ID": "EM_I1", "EM_Name": "API Availability",
     "Dictionary_Param": "API Availability",
     "User_Symptom_Keywords": "['có file export', 'xuất được CSV', 'có báo cáo tự động', 'export JSON']",
     "EM_Default": 1.05, "EM_Min": 1.00, "EM_Max": 1.20,
     "Reasoning_Hint": "Không có API trực tiếp nhưng có cơ chế export → cần adapter layer nhẹ."},
    # Worst
    {"EM_ID": "EM_I1", "EM_Name": "API Availability",
     "Dictionary_Param": "API Availability",
     "User_Symptom_Keywords": "['đóng hoàn toàn', 'không cho kết nối', 'vendor lock-in', 'hệ thống đóng']",
     "EM_Default": 1.18, "EM_Min": 1.00, "EM_Max": 1.20,
     "Reasoning_Hint": "Hệ thống đóng kín → phải reverse-engineer hoặc screen scraping."},
    {"EM_ID": "EM_I1", "EM_Name": "API Availability",
     "Dictionary_Param": "API Availability",
     "User_Symptom_Keywords": "['không biết mở cổng', 'vendor cũ bỏ rồi', 'hệ thống cũ không hỗ trợ', 'chẳng ai biết']",
     "EM_Default": 1.20, "EM_Min": 1.00, "EM_Max": 1.20,
     "Reasoning_Hint": "Vendor bỏ rơi, không tài liệu → rủi ro tích hợp cực cao, cần middleware custom."},
    # Fallback
    {"EM_ID": "EM_I1", "EM_Name": "API Availability",
     "Dictionary_Param": "API Availability",
     "User_Symptom_Keywords": "['chưa biết', 'hỏi lại IT', 'để hỏi bên kỹ thuật', 'không chắc']",
     "EM_Default": 1.10, "EM_Min": 1.00, "EM_Max": 1.20,
     "Reasoning_Hint": "Không rõ API → giả định trung bình ngành. Pre-sales cần confirm với IT khách hàng."},

    # ── EM_I2: Legacy System Age ──────────────────────────────────────
    # Best
    {"EM_ID": "EM_I2", "EM_Name": "Legacy System Age",
     "Dictionary_Param": "Legacy System Age",
     "User_Symptom_Keywords": "['mới triển khai', '1-2 năm', 'hệ thống mới', 'vừa mua phần mềm']",
     "EM_Default": 1.00, "EM_Min": 1.00, "EM_Max": 1.15,
     "Reasoning_Hint": "Hệ thống mới → tài liệu còn đầy đủ, vendor còn hỗ trợ, API hiện đại."},
    {"EM_ID": "EM_I2", "EM_Name": "Legacy System Age",
     "Dictionary_Param": "Legacy System Age",
     "User_Symptom_Keywords": "['3-5 năm', 'còn bảo hành', 'vendor còn hỗ trợ', 'phiên bản gần đây']",
     "EM_Default": 1.03, "EM_Min": 1.00, "EM_Max": 1.15,
     "Reasoning_Hint": "Hệ thống tầm trung → documentation phần lớn còn hợp lệ."},
    # Worst
    {"EM_ID": "EM_I2", "EM_Name": "Legacy System Age",
     "Dictionary_Param": "Legacy System Age",
     "User_Symptom_Keywords": "['10 năm', 'hệ thống cũ lắm', 'từ đời ông trước', 'chẳng ai biết bên trong']",
     "EM_Default": 1.12, "EM_Min": 1.00, "EM_Max": 1.15,
     "Reasoning_Hint": "Hệ thống cũ → documentation chết, tech debt tích lũy, risk tích hợp cao."},
    {"EM_ID": "EM_I2", "EM_Name": "Legacy System Age",
     "Dictionary_Param": "Legacy System Age",
     "User_Symptom_Keywords": "['15-20 năm', 'không ai maintain', 'phần mềm tự viết lâu lắm', 'từ thời Windows XP']",
     "EM_Default": 1.15, "EM_Min": 1.00, "EM_Max": 1.15,
     "Reasoning_Hint": "Legacy cực nặng → vendor chết, không tài liệu, reverse-engineer toàn bộ."},
    # Fallback
    {"EM_ID": "EM_I2", "EM_Name": "Legacy System Age",
     "Dictionary_Param": "Legacy System Age",
     "User_Symptom_Keywords": "['chưa biết', 'hỏi lại IT', 'không nhớ xài từ bao giờ', 'để hỏi']",
     "EM_Default": 1.07, "EM_Min": 1.00, "EM_Max": 1.15,
     "Reasoning_Hint": "Không rõ tuổi hệ thống → giả định ~7 năm (trung bình ngành SMB Việt Nam)."},

    # ── EM_T1: End-user Age ───────────────────────────────────────────
    # Best
    {"EM_ID": "EM_T1", "EM_Name": "End-user Age Profile",
     "Dictionary_Param": "End-user Age",
     "User_Symptom_Keywords": "['nhân viên trẻ', 'Gen Z', '20-30 tuổi', 'thạo công nghệ', 'quen dùng app']",
     "EM_Default": 1.00, "EM_Min": 1.00, "EM_Max": 1.15,
     "Reasoning_Hint": "Nhân viên trẻ → learning curve ngắn, tự khám phá UI, ít cần training."},
    {"EM_ID": "EM_T1", "EM_Name": "End-user Age Profile",
     "Dictionary_Param": "End-user Age",
     "User_Symptom_Keywords": "['30-40 tuổi', 'biết xài phần mềm', 'quen công nghệ', 'dùng nhiều app']",
     "EM_Default": 1.03, "EM_Min": 1.00, "EM_Max": 1.15,
     "Reasoning_Hint": "Nhóm tuổi trung bình → cần training chuẩn nhưng tiếp thu OK."},
    # Worst
    {"EM_ID": "EM_T1", "EM_Name": "End-user Age Profile",
     "Dictionary_Param": "End-user Age",
     "User_Symptom_Keywords": "['40-50 tuổi', 'không quen công nghệ', 'chỉ biết Excel cơ bản', 'ngại thay đổi']",
     "EM_Default": 1.10, "EM_Min": 1.00, "EM_Max": 1.15,
     "Reasoning_Hint": "Nhóm lớn tuổi → cần training tăng cường + tài liệu hướng dẫn chi tiết."},
    {"EM_ID": "EM_T1", "EM_Name": "End-user Age Profile",
     "Dictionary_Param": "End-user Age",
     "User_Symptom_Keywords": "['trên 50 tuổi', 'sắp về hưu', 'chưa bao giờ dùng máy tính', 'toàn viết tay']",
     "EM_Default": 1.15, "EM_Min": 1.00, "EM_Max": 1.15,
     "Reasoning_Hint": "Nhóm 50+ → thời gian training gấp đôi, cần 1-on-1 coaching + tài liệu in giấy."},
    # Fallback
    {"EM_ID": "EM_T1", "EM_Name": "End-user Age Profile",
     "Dictionary_Param": "End-user Age",
     "User_Symptom_Keywords": "['chưa biết', 'hỏi lại HR', 'để hỏi', 'không rõ độ tuổi']",
     "EM_Default": 1.07, "EM_Min": 1.00, "EM_Max": 1.15,
     "Reasoning_Hint": "Không rõ profile nhân sự → giả định trung bình (~35 tuổi)."},

    # ── EM_T2: Prior System Experience ────────────────────────────────
    # Best
    {"EM_ID": "EM_T2", "EM_Name": "Prior System Experience",
     "Dictionary_Param": "Prior System Experience",
     "User_Symptom_Keywords": "['đã dùng ERP', 'đã dùng phần mềm', 'quen CRM', 'đã số hóa trước', 'SAP']",
     "EM_Default": 1.00, "EM_Min": 1.00, "EM_Max": 1.10,
     "Reasoning_Hint": "Đã có kinh nghiệm dùng app quản lý → learning curve ngắn."},
    {"EM_ID": "EM_T2", "EM_Name": "Prior System Experience",
     "Dictionary_Param": "Prior System Experience",
     "User_Symptom_Keywords": "['dùng app đơn giản', 'biết xài Zalo OA', 'có dùng Google Form', 'quen smartphone']",
     "EM_Default": 1.03, "EM_Min": 1.00, "EM_Max": 1.10,
     "Reasoning_Hint": "Kinh nghiệm cơ bản → cần vài buổi training đặc thù."},
    # Worst
    {"EM_ID": "EM_T2", "EM_Name": "Prior System Experience",
     "Dictionary_Param": "Prior System Experience",
     "User_Symptom_Keywords": "['lần đầu số hóa', 'toàn ghi sổ', 'chưa dùng phần mềm bao giờ', 'tay ngang']",
     "EM_Default": 1.08, "EM_Min": 1.00, "EM_Max": 1.10,
     "Reasoning_Hint": "Lần đầu số hóa → learning curve dài, cần change management strategy."},
    {"EM_ID": "EM_T2", "EM_Name": "Prior System Experience",
     "Dictionary_Param": "Prior System Experience",
     "User_Symptom_Keywords": "['phản đối thay đổi', 'nhân viên chống đối', 'không muốn dùng', 'lãnh đạo ép xuống']",
     "EM_Default": 1.10, "EM_Min": 1.00, "EM_Max": 1.10,
     "Reasoning_Hint": "Kháng cự chuyển đổi → cần change management + phải có champion nội bộ."},
    # Fallback
    {"EM_ID": "EM_T2", "EM_Name": "Prior System Experience",
     "Dictionary_Param": "Prior System Experience",
     "User_Symptom_Keywords": "['chưa biết', 'hỏi lại', 'để hỏi nhân viên', 'không chắc']",
     "EM_Default": 1.05, "EM_Min": 1.00, "EM_Max": 1.10,
     "Reasoning_Hint": "Không rõ kinh nghiệm → giả định trung bình ngành SMB VN."},

    # ══════════════════════════════════════════════════════════════════
    # LỚP 1 — GIÁ VỐN (BASE COST MULTIPLIERS)
    # ══════════════════════════════════════════════════════════════════

    # ── EM_B1: Deployment Location ────────────────────────────────────
    # Best
    {"EM_ID": "EM_B1", "EM_Name": "Deployment Location",
     "Dictionary_Param": "Deployment Location",
     "User_Symptom_Keywords": "['remote', 'làm từ xa', 'online', 'không cần đến chỗ', 'cloud']",
     "EM_Default": 1.00, "EM_Min": 1.00, "EM_Max": 1.30,
     "Reasoning_Hint": "Remote deployment → không phát sinh chi phí đi lại, ăn ở, logistics."},
    {"EM_ID": "EM_B1", "EM_Name": "Deployment Location",
     "Dictionary_Param": "Deployment Location",
     "User_Symptom_Keywords": "['hybrid', 'vài lần đến', 'TP.HCM', 'gần công ty', 'cùng thành phố']",
     "EM_Default": 1.10, "EM_Min": 1.00, "EM_Max": 1.30,
     "Reasoning_Hint": "Hybrid → ít chi phí di chuyển, chỉ onsite vài milestone quan trọng."},
    # Worst
    {"EM_ID": "EM_B1", "EM_Name": "Deployment Location",
     "Dictionary_Param": "Deployment Location",
     "User_Symptom_Keywords": "['onsite', 'phải cử người xuống', 'ở tỉnh', 'nhà máy', 'trong khu công nghiệp']",
     "EM_Default": 1.25, "EM_Min": 1.00, "EM_Max": 1.30,
     "Reasoning_Hint": "Onsite tỉnh → chi phí đi lại + ăn ở + logistics tăng đáng kể."},
    {"EM_ID": "EM_B1", "EM_Name": "Deployment Location",
     "Dictionary_Param": "Deployment Location",
     "User_Symptom_Keywords": "['full onsite', 'đóng tại chỗ', 'vùng sâu vùng xa', 'ngoài đảo', 'biên giới']",
     "EM_Default": 1.30, "EM_Min": 1.00, "EM_Max": 1.30,
     "Reasoning_Hint": "Full onsite vùng khó → chi phí di chuyển + ăn ở rất lớn, hạn chế nhân sự luân chuyển."},
    # Fallback
    {"EM_ID": "EM_B1", "EM_Name": "Deployment Location",
     "Dictionary_Param": "Deployment Location",
     "User_Symptom_Keywords": "['chưa biết', 'hỏi lại', 'chưa xác định', 'tùy tình hình']",
     "EM_Default": 1.15, "EM_Min": 1.00, "EM_Max": 1.30,
     "Reasoning_Hint": "Chưa rõ vị trí → giả định hybrid (trung bình ngành)."},

    # ── EM_B2: Hardware Dependency ────────────────────────────────────
    # Best
    {"EM_ID": "EM_B2", "EM_Name": "Hardware Dependency",
     "Dictionary_Param": "Hardware Dependency",
     "User_Symptom_Keywords": "['không cần phần cứng', 'chỉ web', 'thuần phần mềm', 'SaaS', 'web app']",
     "EM_Default": 1.00, "EM_Min": 1.00, "EM_Max": 1.15,
     "Reasoning_Hint": "Không phụ thuộc phần cứng bên thứ 3 → giá vốn cố định thấp."},
    {"EM_ID": "EM_B2", "EM_Name": "Hardware Dependency",
     "Dictionary_Param": "Hardware Dependency",
     "User_Symptom_Keywords": "['cần SMS', 'gửi tin nhắn', 'notification', 'email gateway']",
     "EM_Default": 1.03, "EM_Min": 1.00, "EM_Max": 1.15,
     "Reasoning_Hint": "SMS/Email gateway → chi phí biến đổi nhỏ, tích hợp nhẹ."},
    # Worst
    {"EM_ID": "EM_B2", "EM_Name": "Hardware Dependency",
     "Dictionary_Param": "Hardware Dependency",
     "User_Symptom_Keywords": "['máy quét', 'barcode scanner', 'RFID', 'IoT', 'kho tự động']",
     "EM_Default": 1.10, "EM_Min": 1.00, "EM_Max": 1.15,
     "Reasoning_Hint": "Phần cứng chuyên biệt → cần driver, tích hợp phức tạp, chi phí mua thiết bị."},
    {"EM_ID": "EM_B2", "EM_Name": "Hardware Dependency",
     "Dictionary_Param": "Hardware Dependency",
     "User_Symptom_Keywords": "['bản đồ GPS', 'camera AI', 'máy chấm công vân tay', 'thiết bị đo lường', 'POS']",
     "EM_Default": 1.15, "EM_Min": 1.00, "EM_Max": 1.15,
     "Reasoning_Hint": "Nhiều thiết bị bên thứ 3 → giá cứng tăng cao, cần driver + SDK + testing riêng."},
    # Fallback
    {"EM_ID": "EM_B2", "EM_Name": "Hardware Dependency",
     "Dictionary_Param": "Hardware Dependency",
     "User_Symptom_Keywords": "['chưa biết', 'hỏi lại', 'để liệt kê sau', 'không chắc cần gì']",
     "EM_Default": 1.07, "EM_Min": 1.00, "EM_Max": 1.15,
     "Reasoning_Hint": "Chưa rõ dependency → giả định có 1-2 dịch vụ bên thứ 3 nhẹ."},

    # ══════════════════════════════════════════════════════════════════
    # LỚP 3 — THƯƠNG MẠI (COMMERCIAL MULTIPLIERS)
    # ══════════════════════════════════════════════════════════════════

    # ── EM_C1: Rush Factor ────────────────────────────────────────────
    # Best
    {"EM_ID": "EM_C1", "EM_Name": "Rush Factor",
     "Dictionary_Param": "Rush Factor",
     "User_Symptom_Keywords": "['không gấp', 'từ từ', 'kế hoạch dài hạn', '6 tháng', 'linh hoạt timeline']",
     "EM_Default": 1.00, "EM_Min": 1.00, "EM_Max": 1.50,
     "Reasoning_Hint": "Không gấp → team làm theo kế hoạch chuẩn, không OT, không burn-out."},
    {"EM_ID": "EM_C1", "EM_Name": "Rush Factor",
     "Dictionary_Param": "Rush Factor",
     "User_Symptom_Keywords": "['3-4 tháng', 'deadline flexible', 'có thể đàm phán', 'bình thường']",
     "EM_Default": 1.10, "EM_Min": 1.00, "EM_Max": 1.50,
     "Reasoning_Hint": "Timeline vừa phải → có thể cần tăng tốc nhẹ ở vài phase."},
    # Worst
    {"EM_ID": "EM_C1", "EM_Name": "Rush Factor",
     "Dictionary_Param": "Rush Factor",
     "User_Symptom_Keywords": "['gấp lắm', '1-2 tháng', 'phải xong trước Tết', 'deadline cứng', 'không đổi được']",
     "EM_Default": 1.35, "EM_Min": 1.00, "EM_Max": 1.50,
     "Reasoning_Hint": "Gấp → team phải OT, thêm nhân sự, rủi ro quality giảm → buffer cao."},
    {"EM_ID": "EM_C1", "EM_Name": "Rush Factor",
     "Dictionary_Param": "Rush Factor",
     "User_Symptom_Keywords": "['siêu gấp', '2 tuần', '1 tháng', 'phạt hợp đồng nếu trễ', 'khách VIP đòi gấp']",
     "EM_Default": 1.50, "EM_Min": 1.00, "EM_Max": 1.50,
     "Reasoning_Hint": "Siêu gấp → OT toàn bộ team + thuê ngoài + risk quality rất cao."},
    # Fallback
    {"EM_ID": "EM_C1", "EM_Name": "Rush Factor",
     "Dictionary_Param": "Rush Factor",
     "User_Symptom_Keywords": "['chưa biết', 'hỏi lại sếp', 'để bàn timeline', 'chưa xác định']",
     "EM_Default": 1.15, "EM_Min": 1.00, "EM_Max": 1.50,
     "Reasoning_Hint": "Chưa rõ deadline → giả định timeline trung bình (~3-4 tháng)."},

    # ── EM_C2: Client Logo Size ───────────────────────────────────────
    # Best (EM thấp → giảm giá chiến lược cho enterprise)
    {"EM_ID": "EM_C2", "EM_Name": "Client Logo Size",
     "Dictionary_Param": "Client Logo Size",
     "User_Symptom_Keywords": "['tập đoàn lớn', 'enterprise', 'Fortune 500', 'công ty niêm yết', 'ngàn nhân viên']",
     "EM_Default": 0.80, "EM_Min": 0.80, "EM_Max": 1.00,
     "Reasoning_Hint": "Enterprise → giảm giá chiến lược để lấy logo + upsell dài hạn."},
    {"EM_ID": "EM_C2", "EM_Name": "Client Logo Size",
     "Dictionary_Param": "Client Logo Size",
     "User_Symptom_Keywords": "['công ty vừa', 'mid-market', '100-500 nhân viên', 'đang phát triển']",
     "EM_Default": 0.90, "EM_Min": 0.80, "EM_Max": 1.00,
     "Reasoning_Hint": "Mid-market → giảm nhẹ, vẫn có potential upsell."},
    # Worst (EM = 1.0 → giá chuẩn, không giảm)
    {"EM_ID": "EM_C2", "EM_Name": "Client Logo Size",
     "Dictionary_Param": "Client Logo Size",
     "User_Symptom_Keywords": "['SMB', 'công ty nhỏ', 'dưới 50 người', 'start-up nhỏ', 'mới thành lập']",
     "EM_Default": 1.00, "EM_Min": 0.80, "EM_Max": 1.00,
     "Reasoning_Hint": "SMB → không giảm giá chiến lược, giá chuẩn, margin giữ nguyên."},
    {"EM_ID": "EM_C2", "EM_Name": "Client Logo Size",
     "Dictionary_Param": "Client Logo Size",
     "User_Symptom_Keywords": "['hộ kinh doanh', 'freelancer', 'tổ chức nhỏ', 'cửa hàng', 'tiệm']",
     "EM_Default": 1.00, "EM_Min": 0.80, "EM_Max": 1.00,
     "Reasoning_Hint": "Micro-business → giá chuẩn, không giảm, risk thanh toán cao hơn."},
    # Fallback
    {"EM_ID": "EM_C2", "EM_Name": "Client Logo Size",
     "Dictionary_Param": "Client Logo Size",
     "User_Symptom_Keywords": "['chưa biết', 'hỏi lại', 'không rõ quy mô', 'để tìm hiểu thêm']",
     "EM_Default": 0.95, "EM_Min": 0.80, "EM_Max": 1.00,
     "Reasoning_Hint": "Chưa rõ quy mô → giả định SMB trung bình, giảm nhẹ mà thôi."},

    # ── EM_C3: Payment Term ───────────────────────────────────────────
    # Best (Discount cao — trả đứt)
    {"EM_ID": "EM_C3", "EM_Name": "Payment Term Discount",
     "Dictionary_Param": "Payment Term",
     "User_Symptom_Keywords": "['trả đứt', 'thanh toán 1 lần', 'trả ngay', 'trả hết trước', 'chuyển khoản 100%']",
     "EM_Default": 0.05, "EM_Min": 0.00, "EM_Max": 0.05,
     "Reasoning_Hint": "Trả đứt → giảm 5% (cashflow risk-free, không cần theo dõi công nợ)."},
    {"EM_ID": "EM_C3", "EM_Name": "Payment Term Discount",
     "Dictionary_Param": "Payment Term",
     "User_Symptom_Keywords": "['trả 70% trước', 'ứng trước phần lớn', 'trả trước 80%', 'tạm ứng nhiều']",
     "EM_Default": 0.03, "EM_Min": 0.00, "EM_Max": 0.05,
     "Reasoning_Hint": "Trả trước phần lớn → giảm 3% (cashflow risk thấp)."},
    # Worst (Discount thấp — trả góp)
    {"EM_ID": "EM_C3", "EM_Name": "Payment Term Discount",
     "Dictionary_Param": "Payment Term",
     "User_Symptom_Keywords": "['trả góp', 'chia làm 3-4 lần', 'trả theo milestone', 'công nợ 60 ngày']",
     "EM_Default": 0.01, "EM_Min": 0.00, "EM_Max": 0.05,
     "Reasoning_Hint": "Trả góp → giảm 1% (cashflow risk trung bình, chi phí theo dõi công nợ)."},
    {"EM_ID": "EM_C3", "EM_Name": "Payment Term Discount",
     "Dictionary_Param": "Payment Term",
     "User_Symptom_Keywords": "['trả sau hết', 'công nợ 90 ngày', 'trả khi nào có', 'muốn nợ lâu']",
     "EM_Default": 0.00, "EM_Min": 0.00, "EM_Max": 0.05,
     "Reasoning_Hint": "Trả sau hoàn toàn → không giảm giá (cashflow risk cao nhất)."},
    # Fallback
    {"EM_ID": "EM_C3", "EM_Name": "Payment Term Discount",
     "Dictionary_Param": "Payment Term",
     "User_Symptom_Keywords": "['chưa biết', 'hỏi lại kế toán', 'tùy sếp', 'bàn sau']",
     "EM_Default": 0.02, "EM_Min": 0.00, "EM_Max": 0.05,
     "Reasoning_Hint": "Chưa rõ payment term → giả định trả theo milestone (giảm 2%)."},
]
# fmt: on

# ─── Build DataFrame ─────────────────────────────────────────────────
df = pd.DataFrame(rows)
df.insert(0, "Row_ID", range(1, len(df) + 1))

# ─── Validation: mỗi EM_ID phải có ≥5 dòng ──────────────────────────
em_counts = df.groupby("EM_ID").size()
print("=" * 60)
print("VALIDATION — Số dòng theo EM_ID:")
print("=" * 60)
for em_id, count in em_counts.items():
    status = "✓" if count >= 5 else "✗ THIẾU"
    print(f"  {em_id}: {count} dòng  {status}")
print(f"\n  TỔNG: {len(df)} dòng")
assert len(df) >= 55, f"Cần ≥55 dòng, chỉ có {len(df)}"
assert all(em_counts >= 5), "Mỗi EM_ID phải có ≥5 dòng (2 tốt + 2 tệ + 1 fallback)"
print("  ✓ Đạt yêu cầu tối thiểu 55 dòng & 5 dòng/EM_ID\n")

# ─── Export CSV ───────────────────────────────────────────────────────
output_dir = os.path.dirname(os.path.abspath(__file__))
output_path = os.path.join(output_dir, "heuristic_matrix_v2.csv")
df.to_csv(output_path, index=False, encoding="utf-8-sig")
print(f"✓ Exported: {output_path}")
print(f"  Shape: {df.shape[0]} rows × {df.shape[1]} columns")
print(f"  Columns: {list(df.columns)}")
print(f"  EM_IDs: {sorted(df['EM_ID'].unique())}")
