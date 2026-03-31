// =============================================
// Module: Admin Routes (Quản lý nhân viên)
// GET  /api/admin/users              - Danh sách nhân viên
// POST /api/admin/users              - Tạo nhân viên mới
// PUT  /api/admin/users/:id          - Cập nhật nhân viên
// DEL  /api/admin/users/:id          - Vô hiệu hóa
// GET  /api/admin/users/:id/profile  - Hồ sơ chi tiết + ảnh CCCD
// POST /api/admin/reset-password     - Reset mật khẩu
// GET  /api/admin/checkins           - Xem check-in tất cả nhân viên
// GET  /api/admin/checkins/:id       - Chi tiết check-in (có ảnh)
// GET  /api/admin/reports/summary    - Tổng kết theo ngày
// =============================================

import { Hono } from 'hono'
import { hashPassword } from '../lib/crypto'
import { ok, err } from '../lib/response'
import { authMiddleware, adminMiddleware } from '../middleware/auth'
import type { AuthUser } from '../middleware/auth'

type Bindings = { DB: D1Database }
type Variables = { user: AuthUser }

const admin = new Hono<{ Bindings: Bindings; Variables: Variables }>()

admin.use('*', authMiddleware, adminMiddleware)

// ── GET /api/admin/users ──────────────────────────────────────────────────
admin.get('/users', async (c) => {
  const users = await c.env.DB.prepare(`
    SELECT u.id, u.username, u.full_name, u.role, u.is_active, u.created_at,
           p.phone, p.cccd_number, p.bank_name, p.bank_account_number
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    ORDER BY u.created_at DESC
  `).all()
  return c.json(ok(users.results))
})

// ── POST /api/admin/users ─────────────────────────────────────────────────
admin.post('/users', async (c) => {
  const body = await c.req.json()
  const { username, password, full_name, role, phone } = body

  if (!username || !password || !full_name) {
    return c.json(err('Vui lòng nhập đầy đủ thông tin (họ tên, tài khoản, mật khẩu)'), 400)
  }
  if (password.length < 6) {
    return c.json(err('Mật khẩu ít nhất 6 ký tự'), 400)
  }

  const exists = await c.env.DB.prepare('SELECT id FROM users WHERE username = ?')
    .bind(username).first()
  if (exists) return c.json(err('Tên đăng nhập đã tồn tại'), 400)

  const hash = await hashPassword(password)
  const result = await c.env.DB.prepare(
    'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)'
  ).bind(username, hash, full_name, role ?? 'staff').run()

  const newId = result.meta.last_row_id

  // Tạo profile kèm phone nếu có
  if (phone && newId) {
    await c.env.DB.prepare(
      'INSERT OR IGNORE INTO profiles (user_id, phone) VALUES (?, ?)'
    ).bind(newId, phone).run()
  }

  return c.json(ok({ id: newId }, 'Tạo nhân viên thành công'), 201)
})

// ── PUT /api/admin/users/:id ──────────────────────────────────────────────
admin.put('/users/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  if (isNaN(id)) return c.json(err('ID không hợp lệ'), 400)

  const body = await c.req.json()
  const { full_name, role, is_active } = body

  await c.env.DB.prepare(`
    UPDATE users SET
      full_name  = COALESCE(?, full_name),
      role       = COALESCE(?, role),
      is_active  = COALESCE(?, is_active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(full_name ?? null, role ?? null, is_active ?? null, id).run()

  return c.json(ok(null, 'Cập nhật thành công'))
})

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────
admin.delete('/users/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const currentUser = c.get('user')
  if (id === currentUser.id) return c.json(err('Không thể xóa tài khoản đang đăng nhập'), 400)

  await c.env.DB.prepare('UPDATE users SET is_active = 0 WHERE id = ?').bind(id).run()
  return c.json(ok(null, 'Đã vô hiệu hóa tài khoản'))
})

// ── GET /api/admin/users/:id/profile ─────────────────────────────────────
// Trả về hồ sơ đầy đủ kèm ảnh CCCD của nhân viên (chỉ admin)
admin.get('/users/:id/profile', async (c) => {
  const id = parseInt(c.req.param('id'))
  if (isNaN(id)) return c.json(err('ID không hợp lệ'), 400)

  const data = await c.env.DB.prepare(`
    SELECT u.id, u.username, u.full_name, u.role, u.is_active, u.created_at,
           p.phone,
           p.cccd_number, p.cccd_full_name, p.cccd_dob, p.cccd_gender,
           p.cccd_address, p.cccd_issue_date, p.cccd_expiry_date,
           p.cccd_front_image, p.cccd_back_image,
           p.bank_account_number, p.bank_name, p.bank_account_name,
           p.updated_at AS profile_updated_at
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    WHERE u.id = ?
  `).bind(id).first()

  if (!data) return c.json(err('Không tìm thấy nhân viên'), 404)
  return c.json(ok(data))
})

// ── POST /api/admin/reset-password ───────────────────────────────────────
admin.post('/reset-password', async (c) => {
  const { user_id, new_password } = await c.req.json()
  if (!user_id || !new_password) return c.json(err('Thiếu thông tin'), 400)
  if (new_password.length < 6) return c.json(err('Mật khẩu ít nhất 6 ký tự'), 400)

  const hash = await hashPassword(new_password)
  await c.env.DB.prepare(
    'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(hash, user_id).run()

  return c.json(ok(null, 'Reset mật khẩu thành công'))
})

// ── GET /api/admin/checkins ───────────────────────────────────────────────
// Query params: date, date_from, date_to, user_id, page, limit
admin.get('/checkins', async (c) => {
  const date      = c.req.query('date')
  const dateFrom  = c.req.query('date_from')
  const dateTo    = c.req.query('date_to')
  const userId    = c.req.query('user_id')
  const page      = Math.max(1, parseInt(c.req.query('page')  ?? '1'))
  const limit     = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '50')))
  const offset    = (page - 1) * limit

  let query = `
    SELECT c.id, c.date, c.checkin_time, c.checkout_time,
           c.checkin_address, c.checkout_address,
           c.sales_quantity, c.notes, c.status,
           u.id AS user_id, u.full_name, u.username
    FROM checkins c
    JOIN users u ON u.id = c.user_id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (date) {
    query += ' AND c.date = ?'; params.push(date)
  } else {
    if (dateFrom) { query += ' AND c.date >= ?'; params.push(dateFrom) }
    if (dateTo)   { query += ' AND c.date <= ?'; params.push(dateTo) }
  }
  if (userId) { query += ' AND c.user_id = ?'; params.push(userId) }

  query += ' ORDER BY c.date DESC, c.checkin_time DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const records = await c.env.DB.prepare(query).bind(...params).all()
  return c.json(ok(records.results))
})

// ── GET /api/admin/checkins/:id ───────────────────────────────────────────
admin.get('/checkins/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  if (isNaN(id)) return c.json(err('ID không hợp lệ'), 400)

  const record = await c.env.DB.prepare(
    'SELECT c.*, u.full_name, u.username FROM checkins c JOIN users u ON u.id = c.user_id WHERE c.id = ?'
  ).bind(id).first()

  if (!record) return c.json(err('Không tìm thấy'), 404)
  return c.json(ok(record))
})

// ── GET /api/admin/reports/summary ───────────────────────────────────────
// Tổng kết theo ngày (hoặc khoảng ngày)
// Query params: date, date_from, date_to
admin.get('/reports/summary', async (c) => {
  const date     = c.req.query('date')
  const dateFrom = c.req.query('date_from')
  const dateTo   = c.req.query('date_to')

  let where = '1=1'
  const params: unknown[] = []

  if (date) {
    where += ' AND c.date = ?'; params.push(date)
  } else {
    if (dateFrom) { where += ' AND c.date >= ?'; params.push(dateFrom) }
    if (dateTo)   { where += ' AND c.date <= ?'; params.push(dateTo) }
  }

  const summary = await c.env.DB.prepare(`
    SELECT
      COUNT(*)                                    AS total_records,
      COUNT(CASE WHEN status = 'checkin'  THEN 1 END) AS total_checkin_only,
      COUNT(CASE WHEN status = 'checkout' THEN 1 END) AS total_checkout,
      SUM(COALESCE(sales_quantity, 0))            AS total_sales,
      COUNT(DISTINCT user_id)                     AS total_staff
    FROM checkins c
    WHERE ${where}
  `).bind(...params).first()

  return c.json(ok(summary))
})

export default admin
