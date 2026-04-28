-- =============================================
-- Migration 0008: Xóa sản phẩm Yett và Yett Demi
-- =============================================

DELETE FROM checkin_sales WHERE product_id IN (SELECT id FROM products WHERE name IN ('Yett', 'Yett Demi'));
DELETE FROM products WHERE name IN ('Yett', 'Yett Demi');
