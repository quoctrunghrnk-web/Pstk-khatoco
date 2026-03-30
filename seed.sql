-- =============================================
-- Seed Data: Tài khoản mặc định
-- Chạy: npm run db:seed
-- =============================================

-- Admin account (password: admin123)
INSERT OR IGNORE INTO users (username, password_hash, full_name, role, is_active)
VALUES (
  'admin',
  'd550dfd79dc8f5c592d648ac3897d6f8b7201647e08979b0fb42376ff780e20a',
  'Quản Trị Viên',
  'admin',
  1
);

-- Staff account (password: Staff@123)
INSERT OR IGNORE INTO users (username, password_hash, full_name, role, is_active)
VALUES (
  'nhanvien01',
  'f12fd368979ead64443c2d978c2b87ed83b69dd8490d8cea5bb2cb4bac6a8fae',
  'Nguyễn Văn An',
  'staff',
  1
);
