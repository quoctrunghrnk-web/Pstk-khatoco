-- =============================================
-- Migration 0005: Sản phẩm, quà tặng, multi check-in/điểm bán
-- =============================================

-- Bảng sản phẩm (admin quản lý)
CREATE TABLE IF NOT EXISTS products (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT UNIQUE NOT NULL,
  unit       TEXT DEFAULT 'thùng',
  is_active  INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng quà tặng (admin quản lý)
CREATE TABLE IF NOT EXISTS gifts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT UNIQUE NOT NULL,
  unit       TEXT DEFAULT 'cái',
  is_active  INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed sản phẩm mặc định
INSERT OR IGNORE INTO products (name, unit, sort_order) VALUES
  ('White Horse',      'thùng', 1),
  ('White Horse Demi', 'thùng', 2),
  ('Yett',             'thùng', 3),
  ('Yett Demi',        'thùng', 4);

-- Seed quà tặng mặc định
INSERT OR IGNORE INTO gifts (name, unit, sort_order) VALUES
  ('Quà tặng bật lửa', 'cái', 1),
  ('Quà tặng hộp diêm','cái', 2);

-- Thêm cột store_name vào checkins (điểm bán - bắt buộc)
ALTER TABLE checkins ADD COLUMN store_name TEXT;

-- Cho phép nhiều lần check-in/ngày: bỏ unique constraint date+user
-- (D1 SQLite không hỗ trợ DROP CONSTRAINT trực tiếp, xử lý ở app logic)
-- Tạo index mới để query nhanh
CREATE INDEX IF NOT EXISTS idx_checkins_user_date_store ON checkins(user_id, date, store_name);

-- Bảng doanh số chi tiết theo sản phẩm cho mỗi lượt check-in
CREATE TABLE IF NOT EXISTS checkin_sales (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  checkin_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity   INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (checkin_id) REFERENCES checkins(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Bảng quà tặng chi tiết cho mỗi lượt check-in
CREATE TABLE IF NOT EXISTS checkin_gifts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  checkin_id INTEGER NOT NULL,
  gift_id    INTEGER NOT NULL,
  quantity   INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (checkin_id) REFERENCES checkins(id) ON DELETE CASCADE,
  FOREIGN KEY (gift_id)    REFERENCES gifts(id)
);

CREATE INDEX IF NOT EXISTS idx_checkin_sales_checkin ON checkin_sales(checkin_id);
CREATE INDEX IF NOT EXISTS idx_checkin_gifts_checkin ON checkin_gifts(checkin_id);
