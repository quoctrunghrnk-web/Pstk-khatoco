-- Migration: Bảng danh sách tỉnh/thành phố hoạt động (admin quản lý)
CREATE TABLE IF NOT EXISTS active_provinces (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  name     TEXT UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed 8 tỉnh/thành mặc định
INSERT OR IGNORE INTO active_provinces (name, sort_order) VALUES
  ('TP. Hồ Chí Minh', 1),
  ('Hà Nội',          2),
  ('Đà Nẵng',         3),
  ('Cần Thơ',         4),
  ('Bình Dương',      5),
  ('Đồng Nai',        6),
  ('Long An',         7),
  ('Bà Rịa - Vũng Tàu', 8);
