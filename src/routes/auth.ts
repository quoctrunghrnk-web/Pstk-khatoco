// =============================================
// Module: Auth Routes
// POST /api/auth/login
// POST /api/auth/logout
// GET  /api/auth/me
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

// POST /api/auth/login
auth.post('/login', async (c) => {
  const { username, password } = await c.req.json()
  if (!username || !password) {
    return c.json(err('Vui lòng nhập tên đăng nhập và mật khẩu'), 400)
  }

  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE username = ? AND is_active = 1'
  ).bind(username).first<{ id: number; username: string; password_hash: string; full_name: string; role: string }>()

  if (!user) {
    return c.json(err('Tên đăng nhập hoặc mật khẩu không đúng'), 401)
  }

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) {
    return c.json(err('Tên đăng nhập hoặc mật khẩu không đúng'), 401)
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    iat: now,
    exp: now + 60 * 60 * 24 * 7 // 7 ngày
  }
  const token = await createJWT(payload, JWT_SECRET)

  return c.json(ok({ token, user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role } }, 'Đăng nhập thành công'))
})

// GET /api/auth/me
auth.get('/me', authMiddleware, (c) => {
  const user = c.get('user')
  return c.json(ok(user))
})

// POST /api/auth/change-password
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
  await c.env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(newHash, user.id).run()

  return c.json(ok(null, 'Đổi mật khẩu thành công'))
})

// POST /api/auth/logout
auth.post('/logout', (c) => {
  return c.json(ok(null, 'Đăng xuất thành công'))
})

export default auth
