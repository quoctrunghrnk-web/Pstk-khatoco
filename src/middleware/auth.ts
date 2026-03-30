// =============================================
// Module: Auth Middleware
// Kiểm tra JWT token từ Authorization header hoặc cookie
// =============================================

import type { Context, Next } from 'hono'
import { verifyJWT } from '../lib/crypto'

const JWT_SECRET = 'nhanvien_thi_truong_secret_2024'

export type AuthUser = {
  id: number
  username: string
  role: 'admin' | 'staff'
  full_name: string
}

export async function authMiddleware(c: Context, next: Next) {
  let token: string | null = null

  // 1. Thử lấy từ Authorization header
  const authHeader = c.req.header('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7)
  }

  // 2. Thử lấy từ cookie
  if (!token) {
    const cookie = c.req.header('Cookie') ?? ''
    const match = cookie.match(/auth_token=([^;]+)/)
    if (match) token = decodeURIComponent(match[1])
  }

  if (!token) {
    return c.json({ success: false, message: 'Chưa đăng nhập' }, 401)
  }

  const payload = await verifyJWT(token, JWT_SECRET)
  if (!payload) {
    return c.json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' }, 401)
  }

  // Gắn user vào context
  c.set('user', payload as unknown as AuthUser)
  await next()
}

export async function adminMiddleware(c: Context, next: Next) {
  const user = c.get('user') as AuthUser
  if (!user || user.role !== 'admin') {
    return c.json({ success: false, message: 'Không có quyền truy cập' }, 403)
  }
  await next()
}

export { JWT_SECRET }
