// =============================================
// Module: Admin Routes (Quản lý nhân viên)
// GET  /api/admin/users         - Danh sách nhân viên
// POST /api/admin/users         - Tạo nhân viên mới
// PUT  /api/admin/users/:id     - Cập nhật nhân viên
// DEL  /api/admin/users/:id     - Xóa nhân viên
// GET  /api/admin/checkins      - Xem check-in tất cả nhân viên
// POST /api/admin/reset-password - Reset mật khẩu
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

// GET /api/admin/users
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

// POST /api/admin/users
admin.post('/users', async (c) => {
  const { username, password, full_name, role } = await c.req.json()

  if (!username || !password || !full_name) {
    return c.json(err('Vui lòng nhập đầy đủ thông tin'), 400)
  }

  const exists = await c.env.DB.prepare('SELECT id FROM users WHERE username = ?')
    .bind(username).first()
  if (exists) return c.json(err('Tên đăng nhập đã tồn tại'), 400)

  const hash = await hashPassword(password)
  const result = await c.env.DB.prepare(
    'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)'
  ).bind(username, hash, full_name, role ?? 'staff').run()

  return c.json(ok({ id: result.meta.last_row_id }, 'Tạo nhân viên thành công'), 201)
})

// PUT /api/admin/users/:id
admin.put('/users/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const { full_name, role, is_active } = await c.req.json()

  await c.env.DB.prepare(
    'UPDATE users SET full_name = COALESCE(?, full_name), role = COALESCE(?, role), is_active = COALESCE(?, is_active), updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(full_name ?? null, role ?? null, is_active ?? null, id).run()

  return c.json(ok(null, 'Cập nhật thành công'))
})

// DELETE /api/admin/users/:id
admin.delete('/users/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const currentUser = c.get('user')
  if (id === currentUser.id) return c.json(err('Không thể xóa tài khoản đang đăng nhập'), 400)

  await c.env.DB.prepare('UPDATE users SET is_active = 0 WHERE id = ?').bind(id).run()
  return c.json(ok(null, 'Đã vô hiệu hóa tài khoản'))
})

// POST /api/admin/reset-password
admin.post('/reset-password', async (c) => {
  const { user_id, new_password } = await c.req.json()
  if (!user_id || !new_password) return c.json(err('Thiếu thông tin'), 400)

  const hash = await hashPassword(new_password)
  await c.env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(hash, user_id).run()

  return c.json(ok(null, 'Reset mật khẩu thành công'))
})

// GET /api/admin/checkins?date=YYYY-MM-DD&user_id=
admin.get('/checkins', async (c) => {
  const date = c.req.query('date')
  const userId = c.req.query('user_id')
  const page = parseInt(c.req.query('page') ?? '1')
  const limit = parseInt(c.req.query('limit') ?? '20')
  const offset = (page - 1) * limit

  let query = `
    SELECT c.*, u.full_name, u.username
    FROM checkins c
    JOIN users u ON u.id = c.user_id
    WHERE 1=1
  `
  const params: unknown[] = []
  if (date) { query += ' AND c.date = ?'; params.push(date) }
  if (userId) { query += ' AND c.user_id = ?'; params.push(userId) }
  query += ' ORDER BY c.date DESC, c.checkin_time DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const records = await c.env.DB.prepare(query).bind(...params).all()
  return c.json(ok(records.results))
})

// GET /api/admin/checkins/:id - Chi tiết với ảnh
admin.get('/checkins/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const record = await c.env.DB.prepare(
    'SELECT c.*, u.full_name FROM checkins c JOIN users u ON u.id = c.user_id WHERE c.id = ?'
  ).bind(id).first()
  if (!record) return c.json(err('Không tìm thấy'), 404)
  return c.json(ok(record))
})

export default admin
