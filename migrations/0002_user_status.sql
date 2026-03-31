-- =============================================
-- Migration 0002: Thêm cột account_status vào users
-- Trạng thái tài khoản:
--   'pending'  → vừa đăng ký, chờ admin kích hoạt
--   'active'   → đang làm việc (được dùng đầy đủ chức năng)
--   'resigned' → đã nghỉ việc (không đăng nhập được)
-- =============================================

ALTER TABLE users ADD COLUMN account_status TEXT NOT NULL DEFAULT 'active';

-- Cập nhật tài khoản admin mặc định luôn active
UPDATE users SET account_status = 'active' WHERE role = 'admin';

-- Index để lọc nhanh
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
