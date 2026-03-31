// =============================================
// Module: Main App Entry Point
// Kết nối tất cả routes và middleware
// =============================================

import { Hono } from 'hono'
import { cors } from 'hono/cors'

// Import route modules
import authRoutes from './routes/auth'
import profileRoutes from './routes/profile'
import checkinRoutes from './routes/checkin'
import adminRoutes from './routes/admin'

type Bindings = { DB: D1Database }

const app = new Hono<{ Bindings: Bindings }>()

// ── Middleware ────────────────────────────────
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// ── API Routes ───────────────────────────────
app.route('/api/auth', authRoutes)
app.route('/api/profile', profileRoutes)
app.route('/api/checkin', checkinRoutes)
app.route('/api/admin', adminRoutes)

// ── Health check ─────────────────────────────
app.get('/api/health', (c) => c.json({ status: 'ok', time: new Date().toISOString() }))

// ── Public: danh sách tỉnh/thành (không cần đăng nhập) ──────────────────
// Dùng cho trang đăng ký nhân viên và hồ sơ
app.get('/api/provinces', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT id, name, sort_order FROM active_provinces ORDER BY sort_order, name'
  ).all()
  return c.json({ success: true, data: rows.results })
})

// Static files are served by Cloudflare Pages for /static/* and /index.html
// The _routes.json excludes these from the Worker.
// This catch-all handles any route not matched above (SPA fallback)
app.get('*', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Nhân Viên Thị Trường</title>
  <meta name="theme-color" content="#1e3a5f" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="/static/css/app.css" />
</head>
<body class="bg-gray-50 min-h-screen">
<div id="app">
  <div id="loading-screen" class="fixed inset-0 flex flex-col items-center justify-center bg-blue-900 z-50">
    <div class="text-center text-white flex-1 flex flex-col items-center justify-center">
      <img src="https://nhankiet.vn/uploads/01_Logo/Logo%20khong%20nen.jpg" alt="Nhân Kiệt Logo"
        class="w-24 h-24 object-contain mb-4 rounded-2xl shadow-lg bg-white/10 p-2" />
      <h1 class="text-2xl font-bold mb-2">Nhân Viên Thị Trường</h1>
      <p class="text-blue-200 text-sm">Đang tải...</p>
    </div>
    <div class="text-center text-blue-300 pb-6 text-xs space-y-0.5">
      <p>Phát triển bởi <a href="https://nhankiet.vn" class="text-white font-semibold underline">nhankiet.vn</a></p>
      <p>© 2026 Nhân Kiệt. All rights reserved.</p>
    </div>
  </div>
</div>
<div id="modal-root"></div>
<div id="toast-root" class="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none"></div>
<script src="/static/js/config.js"></script>
<script src="/static/js/api.js"></script>
<script src="/static/js/toast.js"></script>
<script src="/static/js/modal.js"></script>
<script src="/static/js/camera.js"></script>
<script src="/static/js/geo.js"></script>
<script src="/static/js/watermark.js"></script>
<script src="/static/js/provinces.js"></script>
<script src="/static/js/auth.js"></script>
<script src="/static/js/register.js"></script>
<script src="/static/js/profile.js"></script>
<script src="/static/js/checkin.js"></script>
<script src="/static/js/admin.js"></script>
<script src="/static/js/app.js"></script>
</body>
</html>`)
})

export default app
