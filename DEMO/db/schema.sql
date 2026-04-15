-- Kích hoạt UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Job Roles Table
CREATE TABLE job_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Seniority Levels Table
CREATE TABLE seniority_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    weight INT NOT NULL, -- Dùng để sort (VD: 1 cho Junior, 2 cho Mid)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Role Levels (Tổ hợp Role & Level)
CREATE TABLE role_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_role_id UUID NOT NULL REFERENCES job_roles(id) ON DELETE CASCADE,
    seniority_level_id UUID NOT NULL REFERENCES seniority_levels(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_role_id, seniority_level_id)
);

-- 4. Rate Cards (Quản lý Versioning/Lịch sử giá)
CREATE TABLE rate_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_level_id UUID NOT NULL REFERENCES role_levels(id),
    hourly_cost NUMERIC(10, 2) NOT NULL CHECK (hourly_cost >= 0), -- Chi phí nội bộ (Floor)
    hourly_price NUMERIC(10, 2) NOT NULL CHECK (hourly_price >= hourly_cost), -- Giá niêm yết
    currency VARCHAR(3) DEFAULT 'USD',
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP WITH TIME ZONE, -- NULL nghĩa là đang áp dụng (Current Rate)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Đảm bảo không có 2 khoảng thời gian hiệu lực nào trùng nhau cho cùng 1 role_level
    CHECK (effective_to IS NULL OR effective_from < effective_to)
);

-- 5. Service Categories Table
CREATE TABLE service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Service Modules Table
CREATE TABLE service_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    complexity VARCHAR(20) CHECK (complexity IN ('LOW', 'MEDIUM', 'HIGH')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Module Estimates (Định mức nhân sự cho mỗi Module)
CREATE TABLE module_estimates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES service_modules(id) ON DELETE CASCADE,
    role_level_id UUID NOT NULL REFERENCES role_levels(id),
    base_hours INT NOT NULL CHECK (base_hours > 0), -- Số giờ tiêu chuẩn
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(module_id, role_level_id)
);

-- Tạo Index để tối ưu Read Models cho API và xử lý truy vấn Rate Card
CREATE INDEX idx_rate_cards_active ON rate_cards(role_level_id, effective_from, effective_to);
CREATE INDEX idx_modules_category ON service_modules(category_id);

-- 8. Quotes (Báo giá chứa thông tin tổng hợp)
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name VARCHAR(200) NOT NULL,
    project_name VARCHAR(200) NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'WON', 'LOST')),
    total_floor_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_list_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    final_offered_price NUMERIC(15, 2), -- Giá chốt sau khi áp dụng AI Discount / Manual Override
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Quote Line Items (Chi tiết các module trong báo giá)
-- Bảng này CỰC KỲ QUAN TRỌNG: Lưu cứng 'rate_card_id' tại thời điểm tạo báo giá, 
-- nhờ đó mọi tính toán margin sau này không bị sai lệch kể cả khi bảng 'rate_cards' cập nhật giá mới.
CREATE TABLE quote_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES service_modules(id),
    role_level_id UUID NOT NULL REFERENCES role_levels(id),
    rate_card_id UUID NOT NULL REFERENCES rate_cards(id), -- Snapshot của giá ngay lúc này
    estimated_hours INT NOT NULL, -- Cho phép Pre-sales Override số giờ base_hours mặc định
    unit_cost NUMERIC(10, 2) NOT NULL, -- Copy từ rate_card tại thời điểm tạo
    unit_price NUMERIC(10, 2) NOT NULL, -- Copy từ rate_card tại thời điểm tạo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quote_lines_quote ON quote_line_items(quote_id);
