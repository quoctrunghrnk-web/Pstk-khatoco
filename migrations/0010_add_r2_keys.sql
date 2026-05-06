-- Migration 0010: Add R2 image key columns
-- Stores R2 object keys alongside existing base64 columns.
-- New uploads write to R2; old records retain base64 as fallback until migration.

ALTER TABLE checkins ADD COLUMN checkin_image1_r2 TEXT;
ALTER TABLE checkins ADD COLUMN checkin_image2_r2 TEXT;
ALTER TABLE checkins ADD COLUMN checkout_image1_r2 TEXT;
ALTER TABLE checkins ADD COLUMN checkout_image2_r2 TEXT;

ALTER TABLE profiles ADD COLUMN cccd_front_image_r2 TEXT;
ALTER TABLE profiles ADD COLUMN cccd_back_image_r2 TEXT;
