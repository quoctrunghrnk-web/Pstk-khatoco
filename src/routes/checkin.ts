// =============================================
// Module: Check-in / Check-out Routes
// POST /api/checkin/start        - Check in (tạo lượt mới)
// POST /api/checkin/end          - Check out
// GET  /api/checkin/today        - Tất cả lượt hôm nay
// GET  /api/checkin/active       - Lượt đang check-in (chưa checkout)
// GET  /api/checkin/history      - Lịch sử
// GET  /api/checkin/:id          - Chi tiết
// GET  /api/checkin/products     - Danh sách sản phẩm
// GET  /api/checkin/gifts        - Danh sách quà tặng
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
function getTodayVN(): string {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000)
  return now.toISOString().slice(0, 10)
}

// D1 CURRENT_TIMESTAMP returns "YYYY-MM-DD HH:MM:SS" in UTC without TZ
// Convert to ISO 8601 so JS Date() parses correctly across all timezones
function toISO(t: string | null | undefined): string | null {
  if (!t) return t ?? null
  return t.includes('T') ? t : t.replace(' ', 'T') + 'Z'
}

function fmtRow(r: any): any {
  if (!r) return r
  const out: any = {}
  for (const [k, v] of Object.entries(r)) {
    out[k] = typeof v === 'string' ? toISO(v as string) : v
  }
  return out
}

const IMG_MAX_B64_LEN = 380 * 1024

function validateImage(b64: string | null | undefined, label: string): string | null {
  if (!b64) return null
  if (typeof b64 !== 'string') return `${label}: không hợp lệ`
  if (!b64.startsWith('data:image/')) return `${label}: không phải ảnh`
  if (b64.length > IMG_MAX_B64_LEN)
    return `${label}: ảnh quá lớn (${Math.round(b64.length / 1024)}KB > 380KB)`
  return null
}

function validateImages(images: [string | null | undefined, string][]): string | null {
  for (const [img, label] of images) {
    const e = validateImage(img, label)
    if (e) return e
  }
  return null
}

// Retry helper for D1 write contention (SQLite single-writer)
async function retryDB<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try { return await fn() }
    catch (e: any) {
      if (i === maxRetries - 1) throw e
      const msg = e?.message ?? ''
      if (msg.includes('SQLITE_BUSY') || msg.includes('database is locked') || msg.includes('D1_ERROR')) {
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 200 + Math.random() * 100))
        continue
      }
      throw e
    }
  }
  throw new Error('unreachable')
}

// ── GET /api/checkin/products ──────────────────────────────────────────────
checkin.get('/products', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT id, name, unit FROM products WHERE is_active = 1 ORDER BY sort_order, name'
  ).all()
  return c.json(ok(rows.results))
})

// ── GET /api/checkin/gifts ─────────────────────────────────────────────────
checkin.get('/gifts', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT id, name, unit FROM gifts WHERE is_active = 1 ORDER BY sort_order, name'
  ).all()
  return c.json(ok(rows.results))
})

// ── POST /api/checkin/start ────────────────────────────────────────────────
// Mỗi ngày có thể check-in nhiều lần (nhiều điểm bán)
checkin.post('/start', async (c) => {
  const user  = c.get('user')
  const today = getTodayVN()
  const body  = await c.req.json()
  const { lat, lng, address, image1, image2, store_name } = body

  // Điểm bán bắt buộc
  if (!store_name?.trim()) {
    return c.json(err('Vui lòng nhập tên điểm bán'), 400)
  }

  // Kiểm tra còn lượt chưa checkout trong 24h qua (không dùng date để tránh midnight bug)
  const pending = await c.env.DB.prepare(
    `SELECT id, store_name FROM checkins
     WHERE user_id = ? AND status = 'checkin'
       AND checkin_time > datetime('now', '-24 hours')
     ORDER BY checkin_time DESC LIMIT 1`
  ).bind(user.id).first<{ id: number; store_name: string }>()

  if (pending) {
    return c.json(err(`Bạn chưa check-out điểm "${pending.store_name}". Hãy check-out trước khi đến điểm mới.`), 400)
  }

  if (!image1 || !image2) {
    return c.json(err('Vui lòng chụp đủ 2 ảnh check-in'), 400)
  }

  const imgErr = validateImages([[image1, 'Ảnh 1'], [image2, 'Ảnh 2']])
  if (imgErr) return c.json(err(imgErr), 400)

  const result = await retryDB(() => c.env.DB.prepare(`
    INSERT INTO checkins (
      user_id, date, store_name,
      checkin_time, checkin_lat, checkin_lng, checkin_address,
      checkin_image1, checkin_image2, status
    ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, 'checkin')
  `).bind(
    user.id, today, store_name.trim(),
    lat ?? null, lng ?? null, address ?? null,
    image1, image2
  ).run())

  return c.json(ok({ id: result.meta.last_row_id, date: today, store_name: store_name.trim() }, 'Check-in thành công'))
})

// ── POST /api/checkin/end ──────────────────────────────────────────────────
checkin.post('/end', async (c) => {
  const user  = c.get('user')
  const body  = await c.req.json()

  // Lấy lượt đang checkin gần nhất trong 24h qua (không dùng date để tránh midnight bug)
  const record = await c.env.DB.prepare(
    `SELECT id, status FROM checkins
     WHERE user_id = ? AND status = 'checkin'
       AND checkin_time > datetime('now', '-24 hours')
     ORDER BY checkin_time DESC LIMIT 1`
  ).bind(user.id).first<{ id: number; status: string }>()

  if (!record) return c.json(err('Bạn chưa check-in hoặc đã check-out rồi'), 400)

  const { lat, lng, address, image1, image2, notes, sales, gifts } = body

  // Ảnh check-out bắt buộc
  if (!image1 || !image2) return c.json(err('Vui lòng chụp đủ 2 ảnh check-out'), 400)

  const imgErr = validateImages([[image1, 'Ảnh 1'], [image2, 'Ảnh 2']])
  if (imgErr) return c.json(err(imgErr), 400)

  const salesArr: { product_id: number; quantity: number }[] = Array.isArray(sales) ? sales : []

  // Tính tổng doanh số
  const totalQty = salesArr.reduce((sum, s) => sum + (s.quantity || 0), 0)

  // Update checkin record
  await retryDB(() => c.env.DB.prepare(`
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
    totalQty, notes ?? null,
    record.id
  ).run())

  // Lưu chi tiết doanh số từng sản phẩm
  if (salesArr.length > 0) {
    await retryDB(() => c.env.DB.prepare(`DELETE FROM checkin_sales WHERE checkin_id = ?`).bind(record.id).run())
    for (const s of salesArr) {
      if (s.product_id && s.quantity >= 0) {
        await retryDB(() => c.env.DB.prepare(
          `INSERT INTO checkin_sales (checkin_id, product_id, quantity) VALUES (?, ?, ?)`
        ).bind(record.id, s.product_id, s.quantity).run())
      }
    }
  }

  // Lưu chi tiết quà tặng
  const giftsArr: { gift_id: number; quantity: number }[] = Array.isArray(gifts) ? gifts : []
  if (giftsArr.length > 0) {
    await retryDB(() => c.env.DB.prepare(`DELETE FROM checkin_gifts WHERE checkin_id = ?`).bind(record.id).run())
    for (const g of giftsArr) {
      if (g.gift_id && g.quantity > 0) {
        await retryDB(() => c.env.DB.prepare(
          `INSERT INTO checkin_gifts (checkin_id, gift_id, quantity) VALUES (?, ?, ?)`
        ).bind(record.id, g.gift_id, g.quantity).run())
      }
    }
  }

  return c.json(ok(null, 'Check-out thành công'))
})

// ── GET /api/checkin/active ────────────────────────────────────────────────
// Lượt đang check-in (chưa checkout) trong 24h qua
checkin.get('/active', async (c) => {
  const user  = c.get('user')
  const record = await c.env.DB.prepare(
    `SELECT * FROM checkins
     WHERE user_id = ? AND status = 'checkin'
       AND checkin_time > datetime('now', '-24 hours')
     ORDER BY checkin_time DESC LIMIT 1`
  ).bind(user.id).first()
  return c.json(ok(fmtRow(record) ?? null))
})

// ── GET /api/checkin/today ─────────────────────────────────────────────────
// Tất cả lượt hôm nay (kể cả đã checkout)
checkin.get('/today', async (c) => {
  const user  = c.get('user')
  const today = getTodayVN()
  const rows  = await c.env.DB.prepare(
    `SELECT * FROM checkins WHERE user_id = ? AND date = ? ORDER BY checkin_time ASC`
  ).bind(user.id, today).all()

  // Kèm chi tiết sales & gifts cho mỗi lượt
  const records = await Promise.all(rows.results.map(async (r: any) => {
    const sales = await c.env.DB.prepare(`
      SELECT cs.quantity, p.name as product_name, p.unit
      FROM checkin_sales cs JOIN products p ON cs.product_id = p.id
      WHERE cs.checkin_id = ?
    `).bind(r.id).all()
    const gifts = await c.env.DB.prepare(`
      SELECT cg.quantity, g.name as gift_name, g.unit
      FROM checkin_gifts cg JOIN gifts g ON cg.gift_id = g.id
      WHERE cg.checkin_id = ?
    `).bind(r.id).all()
    return { ...fmtRow(r), sales: sales.results, gifts: gifts.results }
  }))

  return c.json(ok(records))
})

// ── GET /api/checkin/history ───────────────────────────────────────────────
checkin.get('/history', async (c) => {
  const user   = c.get('user')
  const page   = Math.max(1, parseInt(c.req.query('page')  ?? '1'))
  const limit  = Math.min(50, Math.max(1, parseInt(c.req.query('limit') ?? '20')))
  const offset = (page - 1) * limit

  const records = await c.env.DB.prepare(`
    SELECT id, date, store_name, checkin_time, checkout_time,
           checkin_address, checkout_address, sales_quantity, notes, status
    FROM checkins WHERE user_id = ?
    ORDER BY date DESC, checkin_time DESC
    LIMIT ? OFFSET ?
  `).bind(user.id, limit, offset).all()

  const total = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM checkins WHERE user_id = ?'
  ).bind(user.id).first<{ count: number }>()

  return c.json({ success: true, data: records.results.map(fmtRow), pagination: { page, limit, total: total?.count ?? 0 } })
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

  const sales = await c.env.DB.prepare(`
    SELECT cs.quantity, p.id as product_id, p.name as product_name, p.unit
    FROM checkin_sales cs JOIN products p ON cs.product_id = p.id
    WHERE cs.checkin_id = ?
  `).bind(id).all()
  const gifts = await c.env.DB.prepare(`
    SELECT cg.quantity, g.id as gift_id, g.name as gift_name, g.unit
    FROM checkin_gifts cg JOIN gifts g ON cg.gift_id = g.id
    WHERE cg.checkin_id = ?
  `).bind(id).all()

  return c.json(ok({ ...fmtRow(record), sales: sales.results, gifts: gifts.results }))
})

export default checkin
