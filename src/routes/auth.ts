// =============================================
// Module: Auth Routes
// POST /api/auth/register      - Đăng ký tài khoản mới
// POST /api/auth/login         - Đăng nhập
// POST /api/auth/logout        - Đăng xuất
// GET  /api/auth/me            - Thông tin user hiện tại
// POST /api/auth/change-password
// =============================================

import { Hono } from 'hono'
import { hashPassword, verifyPassword, createJWT } from '../lib/crypto'
import { ok, err } from '../lib/response'
import { authMiddleware, JWT_SECRET } from '../middleware/auth'
import type { AuthUser } from '../middleware/auth'

type Bindings = { DB: D1Database }
type Variables = { user: AuthUser }

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// ── POST /api/auth/register ────────────────────────────────────────────────
// Đăng ký tài khoản mới — mặc định account_status = 'pending'
// Kèm đầy đủ thông tin hồ sơ + ảnh CCCD
auth.post('/register', async (c) => {
  const body = await c.req.json()

  const {
    // Tài khoản
    username, password, confirm_password, full_name,
    // Liên hệ
    phone,
    // CCCD
    cccd_number, cccd_full_name, cccd_dob, cccd_gender,
    cccd_address, cccd_issue_date, cccd_expiry_date,
    cccd_front_image, cccd_back_image,
    // Ngân hàng
    bank_name, bank_account_number, bank_account_name,
  } = body

  // ── Validate bắt buộc ──
  if (!username?.trim())      return c.json(err('Vui lòng nhập tên đăng nhập'), 400)
  if (!password)              return c.json(err('Vui lòng nhập mật khẩu'), 400)
  if (!full_name?.trim())     return c.json(err('Vui lòng nhập họ và tên'), 400)

  if (password.length < 6)   return c.json(err('Mật khẩu ít nhất 6 ký tự'), 400)
  if (confirm_password !== undefined && password !== confirm_password) {
    return c.json(err('Mật khẩu xác nhận không khớp'), 400)
  }

  // Tên đăng nhập chỉ chữ, số, dấu gạch dưới
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username.trim())) {
    return c.json(err('Tên đăng nhập chỉ gồm chữ, số, gạch dưới (3-30 ký tự)'), 400)
  }

  // Kiểm tra trùng tên đăng nhập
  const exists = await c.env.DB.prepare('SELECT id FROM users WHERE username = ?')
    .bind(username.trim().toLowerCase()).first()
  if (exists) return c.json(err('Tên đăng nhập đã tồn tại, vui lòng chọn tên khác'), 400)

  // ── Validate ảnh CCCD ──
  const IMG_MAX = 380 * 1024
  if (cccd_front_image && (typeof cccd_front_image !== 'string' ||
      !cccd_front_image.startsWith('data:image/') || cccd_front_image.length > IMG_MAX)) {
    return c.json(err('Ảnh CCCD mặt trước không hợp lệ hoặc quá lớn'), 400)
  }
  if (cccd_back_image && (typeof cccd_back_image !== 'string' ||
      !cccd_back_image.startsWith('data:image/') || cccd_back_image.length > IMG_MAX)) {
    return c.json(err('Ảnh CCCD mặt sau không hợp lệ hoặc quá lớn'), 400)
  }

  // ── Tạo user với status = 'pending' ──
  const hash = await hashPassword(password)
  const result = await c.env.DB.prepare(`
    INSERT INTO users (username, password_hash, full_name, role, is_active, account_status)
    VALUES (?, ?, ?, 'staff', 1, 'pending')
  `).bind(username.trim().toLowerCase(), hash, full_name.trim()).run()

  const newUserId = result.meta.last_row_id

  // ── Tạo profile kèm toàn bộ thông tin ──
  await c.env.DB.prepare(`
    INSERT INTO profiles (
      user_id, phone,
      cccd_number, cccd_full_name, cccd_dob, cccd_gender,
      cccd_address, cccd_issue_date, cccd_expiry_date,
      cccd_front_image, cccd_back_image,
      bank_name, bank_account_number, bank_account_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    newUserId,
    phone              ?? null,
    cccd_number        ?? null,
    cccd_full_name     ?? null,
    cccd_dob           ?? null,
    cccd_gender        ?? null,
    cccd_address       ?? null,
    cccd_issue_date    ?? null,
    cccd_expiry_date   ?? null,
    cccd_front_image   ?? null,
    cccd_back_image    ?? null,
    bank_name          ?? null,
    bank_account_number ?? null,
    bank_account_name  ?? null,
  ).run()

  return c.json(ok(
    { id: newUserId },
    'Đăng ký thành công! Tài khoản đang chờ admin kích hoạt.'
  ), 201)
})

// ── POST /api/auth/login ───────────────────────────────────────────────────
auth.post('/login', async (c) => {
  const { username, password } = await c.req.json()
  if (!username || !password) {
    return c.json(err('Vui lòng nhập tên đăng nhập và mật khẩu'), 400)
  }

  // Lấy user — không lọc is_active/account_status để trả thông báo chính xác
  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE username = ?'
  ).bind(username.trim().toLowerCase()).first<{
    id: number; username: string; password_hash: string
    full_name: string; role: string
    is_active: number; account_status: string
  }>()

  if (!user) {
    return c.json(err('Tên đăng nhập hoặc mật khẩu không đúng'), 401)
  }

  // Kiểm tra mật khẩu trước (không lộ thông tin trạng thái nếu sai mật khẩu)
  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) {
    return c.json(err('Tên đăng nhập hoặc mật khẩu không đúng'), 401)
  }

  // Kiểm tra trạng thái tài khoản
  if (user.account_status === 'pending') {
    return c.json(err('Tài khoản đang chờ admin kích hoạt. Vui lòng liên hệ quản trị viên.'), 403)
  }
  if (user.account_status === 'resigned') {
    return c.json(err('Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.'), 403)
  }
  if (!user.is_active) {
    return c.json(err('Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.'), 403)
  }

  // Tạo JWT
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    iat: now,
    exp: now + 60 * 60 * 24 * 7,  // 7 ngày
  }
  const token = await createJWT(payload, JWT_SECRET)

  return c.json(ok({
    token,
    user: {
      id:        user.id,
      username:  user.username,
      full_name: user.full_name,
      role:      user.role,
    }
  }, 'Đăng nhập thành công'))
})

// ── GET /api/auth/me ───────────────────────────────────────────────────────
auth.get('/me', authMiddleware, (c) => {
  const user = c.get('user')
  return c.json(ok(user))
})

// ── POST /api/auth/change-password ────────────────────────────────────────
auth.post('/change-password', authMiddleware, async (c) => {
  const user = c.get('user')
  const { old_password, new_password } = await c.req.json()

  if (!old_password || !new_password) {
    return c.json(err('Vui lòng nhập đầy đủ thông tin'), 400)
  }
  if (new_password.length < 6) {
    return c.json(err('Mật khẩu mới phải ít nhất 6 ký tự'), 400)
  }

  const dbUser = await c.env.DB.prepare('SELECT password_hash FROM users WHERE id = ?')
    .bind(user.id).first<{ password_hash: string }>()

  if (!dbUser) return c.json(err('Không tìm thấy người dùng'), 404)

  const valid = await verifyPassword(old_password, dbUser.password_hash)
  if (!valid) return c.json(err('Mật khẩu cũ không đúng'), 400)

  const newHash = await hashPassword(new_password)
  await c.env.DB.prepare(
    'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(newHash, user.id).run()

  return c.json(ok(null, 'Đổi mật khẩu thành công'))
})

// ── POST /api/auth/logout ──────────────────────────────────────────────────
auth.post('/logout', (c) => {
  return c.json(ok(null, 'Đăng xuất thành công'))
})

export default auth
