-- =============================================
-- Module: Users (Nhân viên)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff', -- 'admin' | 'staff'
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Module: Profiles (Hồ sơ cá nhân - CCCD & Ngân hàng)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  -- CCCD info
  cccd_number TEXT,
  cccd_full_name TEXT,
  cccd_dob TEXT,
  cccd_gender TEXT,
  cccd_address TEXT,
  cccd_issue_date TEXT,
  cccd_expiry_date TEXT,
  cccd_front_image TEXT,   -- base64 hoặc URL
  cccd_back_image TEXT,    -- base64 hoặc URL
  -- Bank info
  bank_account_number TEXT,
  bank_name TEXT,
  bank_account_name TEXT,
  -- Personal contact
  phone TEXT,
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- Module: Sessions (JWT Session tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- Module: Check-in / Check-out
-- =============================================
CREATE TABLE IF NOT EXISTS checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,           -- YYYY-MM-DD
  -- Check-in
  checkin_time DATETIME,
  checkin_lat REAL,
  checkin_lng REAL,
  checkin_address TEXT,
  checkin_image1 TEXT,          -- Ảnh check-in 1 (có watermark)
  checkin_image2 TEXT,          -- Ảnh check-in 2 (có watermark)
  -- Sales activity images (4 tấm)
  activity_image1 TEXT,
  activity_image2 TEXT,
  activity_image3 TEXT,
  activity_image4 TEXT,
  -- Check-out
  checkout_time DATETIME,
  checkout_lat REAL,
  checkout_lng REAL,
  checkout_address TEXT,
  checkout_image1 TEXT,         -- Ảnh check-out 1 (có watermark)
  checkout_image2 TEXT,         -- Ảnh check-out 2 (có watermark)
  -- Sales data
  sales_quantity INTEGER DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'checkin', -- 'checkin' | 'checkout'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON checkins(user_id, date);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);

-- =============================================
-- Seed: Tài khoản admin mặc định
-- Đăng nhập bằng SĐT (username = số điện thoại)
-- =============================================
-- Admin mặc định: SĐT = 0900000000, password = admin123
INSERT OR IGNORE INTO users (username, password_hash, full_name, role)
VALUES ('0900000000', 'd550dfd79dc8f5c592d648ac3897d6f8b7201647e08979b0fb42376ff780e20a', 'Quản Trị Viên', 'admin');
