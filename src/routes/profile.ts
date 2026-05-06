// =============================================
// Module: Profile Routes
// GET  /api/profile
// PUT  /api/profile
// POST /api/profile/upload-cccd
// =============================================

import { Hono } from 'hono'
import { ok, err } from '../lib/response'
import { authMiddleware } from '../middleware/auth'
import type { AuthUser } from '../middleware/auth'
import { r2Key, uploadImage, deleteImage } from '../lib/storage'

type Bindings = { DB: D1Database; IMAGES: R2Bucket }
type Variables = { user: AuthUser }

const profile = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Tất cả routes đều cần auth
profile.use('*', authMiddleware)

// GET /api/profile - Lấy thông tin cá nhân
profile.get('/', async (c) => {
  const user = c.get('user')
  const data = await c.env.DB.prepare(`
    SELECT u.id, u.username, u.full_name, u.role, u.province, u.start_date,
           p.cccd_number, p.cccd_full_name, p.cccd_dob, p.cccd_gender,
           p.cccd_address, p.cccd_issue_date, p.cccd_expiry_date, p.cccd_issue_place,
           p.cccd_front_image, p.cccd_back_image,
           p.cccd_front_image_r2, p.cccd_back_image_r2,
           p.bank_account_number, p.bank_name, p.bank_account_name, p.phone,
           p.updated_at
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    WHERE u.id = ?
  `).bind(user.id).first()

  return c.json(ok(data))
})

// PUT /api/profile - Cập nhật thông tin cá nhân
profile.put('/', async (c) => {
  const user = c.get('user')
  const body = await c.req.json()

  const {
    cccd_number, cccd_full_name, cccd_dob, cccd_gender,
    cccd_address, cccd_issue_date, cccd_expiry_date, cccd_issue_place,
    bank_account_number, bank_name, bank_account_name, phone,
    province, start_date
  } = body

  // Cập nhật province + start_date trong bảng users
  if (province !== undefined || start_date !== undefined) {
    const fields: string[] = []
    const vals: unknown[] = []
    if (province !== undefined)    { fields.push('province = ?');   vals.push(province?.trim() || null) }
    if (start_date !== undefined)  { fields.push('start_date = ?'); vals.push(start_date || null) }
    fields.push('updated_at = CURRENT_TIMESTAMP')
    vals.push(user.id)
    await c.env.DB.prepare(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`
    ).bind(...vals).run()
  }

  // Upsert profile
  const existing = await c.env.DB.prepare('SELECT id FROM profiles WHERE user_id = ?')
    .bind(user.id).first<{ id: number }>()

  if (existing) {
    await c.env.DB.prepare(`
      UPDATE profiles SET
        cccd_number = ?, cccd_full_name = ?, cccd_dob = ?, cccd_gender = ?,
        cccd_address = ?, cccd_issue_date = ?, cccd_expiry_date = ?, cccd_issue_place = ?,
        bank_account_number = ?, bank_name = ?, bank_account_name = ?,
        phone = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).bind(
      cccd_number ?? null, cccd_full_name ?? null, cccd_dob ?? null, cccd_gender ?? null,
      cccd_address ?? null, cccd_issue_date ?? null, cccd_expiry_date ?? null, cccd_issue_place ?? null,
      bank_account_number ?? null, bank_name ?? null, bank_account_name ?? null,
      phone ?? null, user.id
    ).run()
  } else {
    await c.env.DB.prepare(`
      INSERT INTO profiles (
        user_id, cccd_number, cccd_full_name, cccd_dob, cccd_gender,
        cccd_address, cccd_issue_date, cccd_expiry_date, cccd_issue_place,
        bank_account_number, bank_name, bank_account_name, phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id, cccd_number ?? null, cccd_full_name ?? null, cccd_dob ?? null, cccd_gender ?? null,
      cccd_address ?? null, cccd_issue_date ?? null, cccd_expiry_date ?? null, cccd_issue_place ?? null,
      bank_account_number ?? null, bank_name ?? null, bank_account_name ?? null, phone ?? null
    ).run()
  }

  return c.json(ok(null, 'Cập nhật thông tin thành công'))
})

// POST /api/profile/upload-cccd - Upload ảnh CCCD (base64)
profile.post('/upload-cccd', async (c) => {
  const user = c.get('user')
  const { front, back } = await c.req.json()

  if (!front && !back) {
    return c.json(err('Vui lòng cung cấp ít nhất một ảnh'), 400)
  }

  const IMG_MAX_B64 = 380 * 1024
  if (front && (typeof front !== 'string' || !front.startsWith('data:image/') || front.length > IMG_MAX_B64))
    return c.json(err('Ảnh mặt trước không hợp lệ hoặc quá lớn (tối đa 280KB)'), 400)
  if (back && (typeof back !== 'string' || !back.startsWith('data:image/') || back.length > IMG_MAX_B64))
    return c.json(err('Ảnh mặt sau không hợp lệ hoặc quá lớn (tối đa 280KB)'), 400)

  // Ensure profile exists
  const existing = await c.env.DB.prepare('SELECT id, cccd_front_image_r2, cccd_back_image_r2 FROM profiles WHERE user_id = ?')
    .bind(user.id).first<{ id: number; cccd_front_image_r2: string | null; cccd_back_image_r2: string | null }>()

  // Upload new images to R2, delete old ones
  let frontKey: string | null = null
  let backKey: string | null = null
  if (front) {
    if (existing?.cccd_front_image_r2) await deleteImage(c.env.IMAGES, existing.cccd_front_image_r2)
    frontKey = r2Key('cccd')
    await uploadImage(c.env.IMAGES, frontKey, front)
  }
  if (back) {
    if (existing?.cccd_back_image_r2) await deleteImage(c.env.IMAGES, existing.cccd_back_image_r2)
    backKey = r2Key('cccd')
    await uploadImage(c.env.IMAGES, backKey, back)
  }

  if (existing) {
    const updates: string[] = []
    const values: unknown[] = []
    if (frontKey) { updates.push('cccd_front_image_r2 = ?'); values.push(frontKey) }
    if (backKey)  { updates.push('cccd_back_image_r2 = ?'); values.push(backKey) }
    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(user.id)
    await c.env.DB.prepare(`UPDATE profiles SET ${updates.join(', ')} WHERE user_id = ?`)
      .bind(...values).run()
  } else {
    await c.env.DB.prepare(
      'INSERT INTO profiles (user_id, cccd_front_image_r2, cccd_back_image_r2) VALUES (?, ?, ?)'
    ).bind(user.id, frontKey, backKey).run()
  }

  return c.json(ok(null, 'Upload ảnh CCCD thành công'))
})

export default profile
