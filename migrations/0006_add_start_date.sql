-- =============================================
-- Migration 0006: Thêm cột start_date (ngày nhận việc) vào bảng users
-- =============================================

ALTER TABLE users ADD COLUMN start_date TEXT; -- YYYY-MM-DD, ngày nhận việc chính thức
