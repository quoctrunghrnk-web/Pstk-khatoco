// =============================================
// Module: Check-in / Check-out Routes
// POST /api/checkin/start       - Check in
// POST /api/checkin/activity    - Cập nhật 4 ảnh hoạt động
// POST /api/checkin/end         - Check out
// GET  /api/checkin/today       - Lấy record hôm nay
// GET  /api/checkin/history     - Lịch sử
// GET  /api/checkin/:id         - Chi tiết
// =============================================

import { Hono } from 'hono'
import { ok, err } from '../lib/response'
import { authMiddleware } from '../middleware/auth'
import type { AuthUser } from '../middleware/auth'

type Bindings = { DB: D1Database }
type Variables = { user: AuthUser }

const checkin = new Hono<{ Bindings: Bindings; Variables: Variables }>()

checkin.use('*', authMiddleware)

// ── Helpers ────────────────────────────────────────────────────────────────

// Lấy ngày hôm nay YYYY-MM-DD theo timezone Vietnam (UTC+7)
function getTodayVN(): string {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000)
  return now.toISOString().slice(0, 10)
}

// Giới hạn kích thước ảnh: base64 string ≤ 380KB
// (280KB binary × 4/3 base64 overhead = ~373KB + overhead)
const IMG_MAX_B64_LEN = 380 * 1024

// Kiểm tra ảnh base64 hợp lệ và trong giới hạn
function validateImage(b64: string | null | undefined, label: string): string | null {
  if (!b64) return null
  if (typeof b64 !== 'string') return `${label}: không hợp lệ`
  if (!b64.startsWith('data:image/')) return `${label}: không phải ảnh`
  if (b64.length > IMG_MAX_B64_LEN)
    return `${label}: ảnh quá lớn (${Math.round(b64.length / 1024)}KB > 380KB)`
  return null
}

// Validate nhiều ảnh, trả về lỗi đầu tiên tìm thấy hoặc null
function validateImages(images: [string | null | undefined, string][]): string | null {
  for (const [img, label] of images) {
    const e = validateImage(img, label)
    if (e) return e
  }
  return null
}

// ── POST /api/checkin/start ────────────────────────────────────────────────
checkin.post('/start', async (c) => {
  const user  = c.get('user')
  const today = getTodayVN()

  // Kiểm tra đã check-in hôm nay chưa
  const existing = await c.env.DB.prepare(
    'SELECT id FROM checkins WHERE user_id = ? AND date = ?'
  ).bind(user.id, today).first<{ id: number }>()

  if (existing) {
    return c.json(err('Bạn đã check-in hôm nay rồi'), 400)
  }

  const body = await c.req.json()
  const { lat, lng, address, image1, image2 } = body

  if (!image1 || !image2) {
    return c.json(err('Vui lòng chụp đủ 2 ảnh check-in'), 400)
  }

  // Validate kích thước ảnh
  const imgErr = validateImages([[image1, 'Ảnh 1'], [image2, 'Ảnh 2']])
  if (imgErr) return c.json(err(imgErr), 400)

  // Validate sales_quantity không âm
  const sqRaw = parseInt(body.sales_quantity)
  const salesQty = isNaN(sqRaw) || sqRaw < 0 ? 0 : sqRaw

  await c.env.DB.prepare(`
    INSERT INTO checkins (
      user_id, date, checkin_time, checkin_lat, checkin_lng, checkin_address,
      checkin_image1, checkin_image2, status
    ) VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, 'checkin')
  `).bind(
    user.id, today,
    lat   ?? null,
    lng   ?? null,
    address ?? null,
    image1, image2
  ).run()

  return c.json(ok({ date: today }, 'Check-in thành công'))
})

// ── POST /api/checkin/activity ─────────────────────────────────────────────
checkin.post('/activity', async (c) => {
  const user  = c.get('user')
  const today = getTodayVN()

  const record = await c.env.DB.prepare(
    'SELECT id, status FROM checkins WHERE user_id = ? AND date = ?'
  ).bind(user.id, today).first<{ id: number; status: string }>()

  if (!record) {
    return c.json(err('Bạn chưa check-in hôm nay'), 400)
  }
  if (record.status === 'checkout') {
    return c.json(err('Không thể cập nhật ảnh sau khi đã check-out'), 400)
  }

  const body = await c.req.json()
  const { image1, image2, image3, image4 } = body

  // Validate từng ảnh (chỉ các ảnh được gửi lên)
  const imgs: [string | null | undefined, string][] = [
    [image1, 'Ảnh HĐ 1'], [image2, 'Ảnh HĐ 2'],
    [image3, 'Ảnh HĐ 3'], [image4, 'Ảnh HĐ 4'],
  ]
  const imgErr = validateImages(imgs.filter(([img]) => img != null) as [string, string][])
  if (imgErr) return c.json(err(imgErr), 400)

  await c.env.DB.prepare(`
    UPDATE checkins SET
      activity_image1 = COALESCE(?, activity_image1),
      activity_image2 = COALESCE(?, activity_image2),
      activity_image3 = COALESCE(?, activity_image3),
      activity_image4 = COALESCE(?, activity_image4),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    image1 ?? null, image2 ?? null, image3 ?? null, image4 ?? null,
    record.id
  ).run()

  return c.json(ok(null, 'Cập nhật ảnh hoạt động thành công'))
})

// ── POST /api/checkin/end ──────────────────────────────────────────────────
checkin.post('/end', async (c) => {
  const user  = c.get('user')
  const today = getTodayVN()

  const record = await c.env.DB.prepare(
    'SELECT id, status FROM checkins WHERE user_id = ? AND date = ?'
  ).bind(user.id, today).first<{ id: number; status: string }>()

  if (!record) {
    return c.json(err('Bạn chưa check-in hôm nay'), 400)
  }
  if (record.status === 'checkout') {
    return c.json(err('Bạn đã check-out hôm nay rồi'), 400)
  }

  const body = await c.req.json()
  const { lat, lng, address, image1, image2, sales_quantity, notes } = body

  if (!image1 || !image2) {
    return c.json(err('Vui lòng chụp đủ 2 ảnh check-out'), 400)
  }

  // Validate kích thước ảnh
  const imgErr = validateImages([[image1, 'Ảnh 1'], [image2, 'Ảnh 2']])
  if (imgErr) return c.json(err(imgErr), 400)

  // Validate sales_quantity
  const sqRaw = parseInt(sales_quantity)
  const salesQty = isNaN(sqRaw) || sqRaw < 0 ? 0 : sqRaw

  await c.env.DB.prepare(`
    UPDATE checkins SET
      checkout_time = CURRENT_TIMESTAMP,
      checkout_lat = ?, checkout_lng = ?, checkout_address = ?,
      checkout_image1 = ?, checkout_image2 = ?,
      sales_quantity = ?, notes = ?,
      status = 'checkout',
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    lat ?? null, lng ?? null, address ?? null,
    image1, image2,
    salesQty,
    notes ?? null,
    record.id
  ).run()

  return c.json(ok(null, 'Check-out thành công'))
})

// ── GET /api/checkin/today ─────────────────────────────────────────────────
checkin.get('/today', async (c) => {
  const user  = c.get('user')
  const today = getTodayVN()

  const record = await c.env.DB.prepare(
    'SELECT * FROM checkins WHERE user_id = ? AND date = ?'
  ).bind(user.id, today).first()

  return c.json(ok(record ?? null))
})

// ── GET /api/checkin/history?page=1&limit=10 ──────────────────────────────
checkin.get('/history', async (c) => {
  const user   = c.get('user')
  const page   = Math.max(1, parseInt(c.req.query('page')  ?? '1'))
  const limit  = Math.min(50, Math.max(1, parseInt(c.req.query('limit') ?? '10')))
  const offset = (page - 1) * limit

  const records = await c.env.DB.prepare(`
    SELECT id, date, checkin_time, checkout_time,
           checkin_address, checkout_address,
           sales_quantity, notes, status
    FROM checkins
    WHERE user_id = ?
    ORDER BY date DESC
    LIMIT ? OFFSET ?
  `).bind(user.id, limit, offset).all()

  const total = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM checkins WHERE user_id = ?'
  ).bind(user.id).first<{ count: number }>()

  return c.json({
    success: true,
    data: records.results,
    pagination: { page, limit, total: total?.count ?? 0 }
  })
})

// ── GET /api/checkin/:id ───────────────────────────────────────────────────
checkin.get('/:id', async (c) => {
  const user = c.get('user')
  const id   = parseInt(c.req.param('id'))

  if (isNaN(id)) return c.json(err('ID không hợp lệ'), 400)

  const record = await c.env.DB.prepare(
    'SELECT * FROM checkins WHERE id = ? AND user_id = ?'
  ).bind(id, user.id).first()

  if (!record) return c.json(err('Không tìm thấy'), 404)
  return c.json(ok(record))
})

export default checkin
