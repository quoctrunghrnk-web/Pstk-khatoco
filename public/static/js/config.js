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

  // ── Thời gian ─────────────────────────────
  // Parse D1 timestamp (UTC dạng "YYYY-MM-DD HH:MM:SS", không timezone)
  // JavaScript new Date() hiểu nhầm là giờ local → cần thêm 'Z' để đánh dấu UTC
  parseUTC: (str) => {
    if (!str) return null
    if (typeof str === 'number') return new Date(str)
    // D1 format: "2026-04-02 02:07:02" (UTC, không timezone)
    // Convert to: "2026-04-02T02:07:02Z" (ISO 8601 UTC)
    if (str.length === 19 && str[10] === ' ') {
      return new Date(str.replace(' ', 'T') + 'Z')
    }
    return new Date(str)
  },

  // Vietnam date string (YYYY-MM-DD) dùng cho query API
  todayVN: () => {
    const now = new Date()
    const vn = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }))
    const y = vn.getFullYear()
    const m = String(vn.getMonth() + 1).padStart(2, '0')
    const d = String(vn.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  },

  // Format time từ D1 UTC timestamp sang giờ VN hiển thị
  formatTimeVN: (d1Time) => {
    if (!d1Time) return '--:--'
    try {
      return APP_CONFIG.parseUTC(d1Time).toLocaleTimeString('vi-VN', {
        hour: '2-digit', minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh'
      })
    } catch { return '--:--' }
  },

  // Format date từ D1 UTC timestamp sang ngày VN hiển thị
  formatDateVN: (d1Date) => {
    if (!d1Date) return '--'
    try {
      return APP_CONFIG.parseUTC(d1Date).toLocaleDateString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh'
      })
    } catch { return '--' }
  },
}
