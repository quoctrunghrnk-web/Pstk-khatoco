-- =============================================
-- Migration 0009: Thêm cột tồn kho 3 sản phẩm
-- White Horse, White Horse Demi, Leopard
-- =============================================

ALTER TABLE checkins ADD COLUMN stock_white_horse INTEGER;
ALTER TABLE checkins ADD COLUMN stock_white_horse_demi INTEGER;
ALTER TABLE checkins ADD COLUMN stock_leopard INTEGER;

-- Seed sản phẩm Leopard (nếu chưa có)
INSERT OR IGNORE INTO products (name, unit, sort_order) VALUES ('Leopard', 'thùng', 3);
