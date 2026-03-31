-- Migration: Thêm cột province (tỉnh/thành phố) vào bảng users
ALTER TABLE users ADD COLUMN province TEXT;

-- Index để lọc nhanh theo tỉnh
CREATE INDEX IF NOT EXISTS idx_users_province ON users(province);
