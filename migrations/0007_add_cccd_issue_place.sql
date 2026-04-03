-- =============================================
-- Migration 0007: Thêm cột cccd_issue_place (nơi cấp CCCD) vào profiles
-- =============================================

ALTER TABLE profiles ADD COLUMN cccd_issue_place TEXT; -- Nơi cấp CCCD
