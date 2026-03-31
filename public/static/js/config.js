// =============================================
// Module: Config
// =============================================
window.APP_CONFIG = {
  API_BASE: '/api',
  TOKEN_KEY: 'nvtt_token',
  USER_KEY:  'nvtt_user',
  APP_NAME:  'Nhân Viên Thị Trường',
  VERSION:   '1.1.0',

  // ── Ảnh ──────────────────────────────────
  // Kích thước tối đa sau resize (px)
  IMG_MAX_WIDTH:  1080,
  IMG_MAX_HEIGHT: 1080,
  // Quality JPEG vòng 1 (resize)
  IMG_QUALITY: 0.82,
  // Giới hạn kích thước cuối cùng (bytes) → ~280KB base64 safe cho D1
  IMG_MAX_BYTES: 280 * 1024,
  // Quality tối thiểu cho phép khi nén thêm
  IMG_MIN_QUALITY: 0.30,
}
