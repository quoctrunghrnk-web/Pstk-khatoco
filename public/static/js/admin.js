// =============================================
// Module: Admin Panel (Chỉ admin)
// Quản lý nhân viên + xem báo cáo check-in
// + Lọc theo tỉnh/thành phố + Xuất PDF
// =============================================
window.AdminModule = (() => {

  function formatTime(isoStr) {
    if (!isoStr) return '--'
    try {
      return new Date(isoStr).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })
    } catch { return '--' }
  }

  function formatDateTime(isoStr) {
    if (!isoStr) return '--'
    try {
      return new Date(isoStr).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch { return '--' }
  }

  // ── Province select HTML helper ──────────────
  function provinceSelect(id, selected = '', allLabel = 'Tất cả tỉnh/thành') {
    const provinces = window.PROVINCES || []
    const opts = provinces.map(p =>
      `<option value="${p}" ${p === selected ? 'selected' : ''}>${p}</option>`
    ).join('')
    // Wrapper relative + icon chevron để luôn thấy rõ đây là dropdown
    return `
      <div class="relative">
        <select id="${id}"
          class="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-xl text-sm
                 bg-white focus:outline-none focus:ring-2 focus:ring-red-400
                 appearance-none cursor-pointer">
          <option value="">${allLabel}</option>
          ${opts}
        </select>
        <i class="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2
                  text-gray-400 text-xs pointer-events-none"></i>
      </div>`
  }

  function renderPage() {
    return `
    <div class="pb-24">
      <div class="bg-gradient-to-br from-red-700 to-red-900 text-white px-4 pt-12 pb-20">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-xl font-bold mb-1"><i class="fas fa-shield-alt mr-2"></i>Quản trị viên</h2>
            <p class="text-red-200 text-sm">Quản lý nhân viên và theo dõi hoạt động</p>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <button id="btn-admin-change-pw"
              class="flex items-center gap-1 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-sm transition-colors">
              <i class="fas fa-key text-xs"></i>
              <span class="hidden sm:inline">Đổi MK</span>
            </button>
            <button id="btn-admin-logout"
              class="flex items-center gap-1 px-3 py-1.5 bg-white/15 hover:bg-red-500 rounded-xl text-sm transition-colors">
              <i class="fas fa-sign-out-alt text-xs"></i>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="px-4 -mt-10 mb-4">
        <div class="bg-white rounded-2xl shadow flex overflow-hidden">
          <button class="admin-tab flex-1 py-3 text-sm font-medium transition-colors bg-red-600 text-white" data-tab="staff">
            <i class="fas fa-users mr-1"></i>Nhân viên
          </button>
          <button class="admin-tab flex-1 py-3 text-sm font-medium transition-colors text-gray-600 hover:bg-gray-50" data-tab="reports">
            <i class="fas fa-chart-bar mr-1"></i>Báo cáo
          </button>
        </div>
      </div>

      <!-- Tab: Nhân viên -->
      <div id="admin-tab-staff" class="px-4 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-800">Danh sách nhân viên</h3>
          <button id="btn-add-user" class="flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-sm rounded-xl">
            <i class="fas fa-plus"></i> Thêm
          </button>
        </div>

        <!-- Filter tỉnh (staff) -->
        <div class="bg-white rounded-2xl shadow p-3">
          <div class="flex gap-2 items-center">
            <div class="flex-1">
              <label class="block text-xs text-gray-500 mb-1"><i class="fas fa-map-marker-alt mr-1"></i>Lọc theo tỉnh/thành</label>
              ${provinceSelect('staff-province-filter')}
            </div>
            <button id="btn-filter-staff" class="mt-5 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium">
              <i class="fas fa-filter"></i>
            </button>
          </div>
        </div>

        <div id="users-list">
          <div class="flex justify-center py-8"><i class="fas fa-spinner fa-spin text-red-400 text-2xl"></i></div>
        </div>
      </div>

      <!-- Tab: Báo cáo -->
      <div id="admin-tab-reports" class="px-4 space-y-3 hidden">
        <!-- Filter -->
        <div class="bg-white rounded-2xl shadow p-4">
          <h4 class="text-sm font-semibold text-gray-700 mb-3"><i class="fas fa-filter mr-1 text-red-500"></i>Bộ lọc báo cáo</h4>
          <div class="space-y-2">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Ngày báo cáo</label>
              <input type="date" id="report-date" class="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1"><i class="fas fa-map-marker-alt mr-1"></i>Tỉnh/Thành phố</label>
              ${provinceSelect('report-province-filter')}
            </div>
            <div class="flex gap-2 pt-1">
              <button id="btn-load-report" class="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-medium">
                <i class="fas fa-search mr-1"></i>Xem báo cáo
              </button>
              <button id="btn-export-pdf" class="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-medium" disabled>
                <i class="fas fa-file-pdf mr-1"></i>Xuất PDF
              </button>
            </div>
          </div>
        </div>

        <!-- Summary bar -->
        <div id="report-summary" class="hidden bg-white rounded-2xl shadow p-4">
          <div class="grid grid-cols-3 gap-2 text-center text-sm">
            <div class="bg-blue-50 rounded-xl p-2">
              <p class="text-xs text-blue-500 mb-0.5">NV chấm công</p>
              <p id="sum-staff" class="font-bold text-blue-700 text-lg">-</p>
            </div>
            <div class="bg-green-50 rounded-xl p-2">
              <p class="text-xs text-green-500 mb-0.5">Hoàn thành</p>
              <p id="sum-done" class="font-bold text-green-700 text-lg">-</p>
            </div>
            <div class="bg-orange-50 rounded-xl p-2">
              <p class="text-xs text-orange-500 mb-0.5">Tổng bán</p>
              <p id="sum-sales" class="font-bold text-orange-700 text-lg">-</p>
            </div>
          </div>
        </div>

        <div id="report-list">
          <p class="text-center text-gray-400 text-sm py-8">Chọn ngày để xem báo cáo</p>
        </div>
      </div>
    </div>
    `
  }

  // ── Badge trạng thái tài khoản ──────────────
  function statusBadge(u) {
    if (u.account_status === 'pending')
      return '<span class="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Chờ kích hoạt</span>'
    if (u.account_status === 'resigned')
      return '<span class="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">Đã nghỉ việc</span>'
    return '<span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Đang làm việc</span>'
  }

  // ── Nút hành động theo trạng thái ───────────
  function actionButtons(u) {
    if (u.role === 'admin') {
      return `
        <button onclick="AdminModule.showResetPassword(${u.id},'${u.full_name.replace(/'/g,"\\'")}','${u.username}')"
          class="p-2 text-yellow-600 bg-yellow-50 rounded-lg hover:bg-yellow-100" title="Reset mật khẩu">
          <i class="fas fa-key text-sm"></i>
        </button>`
    }

    const btns = []

    if (u.account_status !== 'active') {
      btns.push(`
        <button onclick="AdminModule.setUserStatus(${u.id},'active','${u.full_name.replace(/'/g,"\\'")}' )"
          class="p-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100" title="Kích hoạt">
          <i class="fas fa-check text-sm"></i>
        </button>`)
    }

    if (u.account_status !== 'resigned') {
      btns.push(`
        <button onclick="AdminModule.setUserStatus(${u.id},'resigned','${u.full_name.replace(/'/g,"\\'")}' )"
          class="p-2 text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200" title="Đánh dấu Đã nghỉ việc">
          <i class="fas fa-user-slash text-sm"></i>
        </button>`)
    }

    btns.push(`
      <button onclick="AdminModule.showResetPassword(${u.id},'${u.full_name.replace(/'/g,"\\'")}','${u.username}')"
        class="p-2 text-yellow-600 bg-yellow-50 rounded-lg hover:bg-yellow-100" title="Reset mật khẩu">
        <i class="fas fa-key text-sm"></i>
      </button>`)

    return btns.join('')
  }

  async function loadUsers(province = '') {
    const el = document.getElementById('users-list')
    try {
      const res = await API.getUsers(province ? { province } : {})
      const users = res.data || []
      if (users.length === 0) {
        el.innerHTML = '<p class="text-center text-gray-400 py-8">Chưa có nhân viên' + (province ? ` ở <b>${province}</b>` : '') + '</p>'
        return
      }

      const pending  = users.filter(u => u.account_status === 'pending')
      const active   = users.filter(u => u.account_status === 'active' || !u.account_status)
      const resigned = users.filter(u => u.account_status === 'resigned')

      const renderGroup = (label, icon, color, list) => {
        if (!list.length) return ''
        return `
          <div class="mt-2">
            <p class="text-xs font-semibold text-${color}-600 uppercase tracking-wide mb-2 flex items-center gap-1 px-1">
              <i class="fas ${icon}"></i> ${label} (${list.length})
            </p>
            <div class="space-y-2">
              ${list.map(u => `
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3
                  ${u.account_status === 'pending' ? 'border-l-4 border-l-yellow-400' : ''}
                  ${u.account_status === 'resigned' ? 'opacity-60' : ''}">
                  <div class="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0
                    ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}">
                    <i class="fas fa-user"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-gray-800 text-sm truncate">${u.full_name}</p>
                    <p class="text-xs text-gray-400">@${u.username}</p>
                    <div class="flex flex-wrap gap-1.5 mt-1">
                      <span class="text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}">
                        ${u.role === 'admin' ? 'Admin' : 'NV'}
                      </span>
                      ${statusBadge(u)}
                      ${u.province ? `<span class="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600"><i class="fas fa-map-marker-alt mr-0.5 text-xs"></i>${u.province}</span>` : ''}
                      ${u.phone ? `<span class="text-xs text-gray-400"><i class="fas fa-phone mr-0.5"></i>${u.phone}</span>` : ''}
                    </div>
                  </div>
                  <div class="flex flex-col gap-1 flex-shrink-0">
                    ${actionButtons(u)}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>`
      }

      el.innerHTML =
        renderGroup('Chờ kích hoạt', 'fa-clock', 'yellow', pending) +
        renderGroup('Đang làm việc', 'fa-user-check', 'green', active) +
        renderGroup('Đã nghỉ việc', 'fa-user-slash', 'gray', resigned)

    } catch (e) {
      el.innerHTML = `<p class="text-center text-red-400 py-8">${e.message}</p>`
    }
  }

  // ── _lastReportData: lưu để xuất PDF ────────
  let _lastReportData = null
  let _lastReportDate = ''
  let _lastReportProvince = ''

  async function loadReport(date, province = '') {
    const el = document.getElementById('report-list')
    const summaryEl = document.getElementById('report-summary')
    el.innerHTML = '<div class="flex justify-center py-8"><i class="fas fa-spinner fa-spin text-red-400 text-2xl"></i></div>'
    summaryEl.classList.add('hidden')
    document.getElementById('btn-export-pdf').disabled = true

    try {
      const params = { date, limit: 200 }
      if (province) params.province = province
      const res = await API.getAdminCheckins(date, params)
      const records = res.data || []

      _lastReportData = records
      _lastReportDate = date
      _lastReportProvince = province

      // Summary
      const done = records.filter(r => r.status === 'checkout').length
      const totalSales = records.reduce((s, r) => s + (parseInt(r.sales_quantity) || 0), 0)
      document.getElementById('sum-staff').textContent = records.length
      document.getElementById('sum-done').textContent = done
      document.getElementById('sum-sales').textContent = totalSales
      summaryEl.classList.remove('hidden')

      if (records.length === 0) {
        el.innerHTML = '<p class="text-center text-gray-400 py-8">Không có dữ liệu ngày này</p>'
        return
      }

      document.getElementById('btn-export-pdf').disabled = false

      el.innerHTML = records.map(r => `
        <div class="bg-white rounded-2xl shadow p-4 cursor-pointer hover:shadow-md transition-shadow" onclick="AdminModule.showCheckinDetail(${r.id})">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <i class="fas fa-user text-blue-600"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-gray-800">${r.full_name}</p>
              <p class="text-xs text-gray-500">@${r.username}${r.province ? ` · <i class="fas fa-map-marker-alt"></i> ${r.province}` : ''}</p>
            </div>
            <span class="text-xs px-2 py-1 rounded-full ${r.status === 'checkout' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
              ${r.status === 'checkout' ? 'Hoàn thành' : 'Đang làm'}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-2">
            <span><i class="fas fa-sign-in-alt mr-1 text-blue-400"></i>CI: ${formatTime(r.checkin_time)}</span>
            <span><i class="fas fa-sign-out-alt mr-1 text-purple-400"></i>CO: ${formatTime(r.checkout_time)}</span>
            ${r.sales_quantity != null ? `<span class="col-span-2"><i class="fas fa-box mr-1 text-green-400"></i>Bán: <b>${r.sales_quantity}</b> SP${r.notes ? ` · ${r.notes}` : ''}</span>` : ''}
          </div>
        </div>
      `).join('')
    } catch (e) {
      el.innerHTML = `<p class="text-center text-red-400 py-8">${e.message}</p>`
    }
  }

  // ── Xuất PDF ─────────────────────────────────
  // Dùng window.print() với trang in chuyên dụng trong iframe ẩn
  async function exportPDF() {
    if (!_lastReportData || !_lastReportData.length) {
      Toast.error('Không có dữ liệu để xuất PDF')
      return
    }

    const btn = document.getElementById('btn-export-pdf')
    btn.disabled = true
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Đang tạo PDF...'
    Toast.info('Đang chuẩn bị báo cáo...')

    try {
      const html = buildPrintHTML(_lastReportData, _lastReportDate, _lastReportProvince)

      // Mở cửa sổ in mới
      const win = window.open('', '_blank', 'width=900,height=700')
      if (!win) {
        Toast.error('Trình duyệt đã chặn cửa sổ mới. Vui lòng cho phép popup.')
        return
      }
      win.document.write(html)
      win.document.close()
      win.focus()
      // Đợi ảnh load xong rồi mới in
      win.onload = () => {
        setTimeout(() => {
          win.print()
        }, 800)
      }
    } finally {
      btn.disabled = false
      btn.innerHTML = '<i class="fas fa-file-pdf mr-1"></i>Xuất PDF'
    }
  }

  function buildPrintHTML(records, date, province) {
    const dateVN = new Date(date + 'T00:00:00+07:00').toLocaleDateString('vi-VN', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
    })
    const totalSales = records.reduce((s, r) => s + (parseInt(r.sales_quantity) || 0), 0)
    const done = records.filter(r => r.status === 'checkout').length

    // Hàm tạo ảnh inline (chỉ hiện nếu có)
    const imgCell = (src, label) => src
      ? `<div class="img-cell"><p class="img-label">${label}</p><img src="${src}" /></div>`
      : `<div class="img-cell empty"><p class="img-label">${label}</p><div class="img-empty"></div></div>`

    const rows = records.map((r, i) => {
      const actImgs = [r.activity_image1, r.activity_image2, r.activity_image3, r.activity_image4].filter(Boolean)
      return `
      <div class="staff-block">
        <div class="staff-header">
          <span class="staff-no">${i + 1}</span>
          <div class="staff-info">
            <strong>${r.full_name}</strong>
            <span class="staff-sub">@${r.username}${r.province ? ' · ' + r.province : ''}</span>
          </div>
          <span class="status-badge ${r.status === 'checkout' ? 'done' : 'progress'}">
            ${r.status === 'checkout' ? 'Hoàn thành' : 'Đang làm'}
          </span>
        </div>

        <div class="info-row">
          <div class="info-item">
            <span class="info-label">Check-in</span>
            <span class="info-value">${formatTime(r.checkin_time)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Check-out</span>
            <span class="info-value">${formatTime(r.checkout_time)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Số bán</span>
            <span class="info-value sales">${r.sales_quantity ?? '--'} SP</span>
          </div>
        </div>

        ${r.checkin_address || r.checkout_address ? `
        <div class="addr-row">
          ${r.checkin_address ? `<p><b>Địa chỉ CI:</b> ${r.checkin_address}</p>` : ''}
          ${r.checkout_address ? `<p><b>Địa chỉ CO:</b> ${r.checkout_address}</p>` : ''}
        </div>` : ''}

        ${r.notes ? `<div class="notes-row"><b>Ghi chú:</b> ${r.notes}</div>` : ''}

        <div class="photos-section">
          <div class="photos-group">
            <p class="photos-title">Ảnh Check-in</p>
            <div class="photos-row">
              ${imgCell(r.checkin_image1, 'CI-1')}
              ${imgCell(r.checkin_image2, 'CI-2')}
            </div>
          </div>

          ${actImgs.length > 0 ? `
          <div class="photos-group">
            <p class="photos-title">Ảnh hoạt động</p>
            <div class="photos-row">
              ${actImgs.map((img, idx) => imgCell(img, `HĐ-${idx + 1}`)).join('')}
            </div>
          </div>` : ''}

          <div class="photos-group">
            <p class="photos-title">Ảnh Check-out</p>
            <div class="photos-row">
              ${imgCell(r.checkout_image1, 'CO-1')}
              ${imgCell(r.checkout_image2, 'CO-2')}
            </div>
          </div>
        </div>
      </div>`
    }).join('')

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Báo cáo ${date}${province ? ' - ' + province : ''}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; }

    .page-header {
      background: linear-gradient(135deg, #b91c1c, #7f1d1d);
      color: #fff;
      padding: 16px 20px;
      margin-bottom: 16px;
    }
    .page-title { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
    .page-sub { font-size: 12px; opacity: 0.85; }
    .page-summary {
      display: flex; gap: 12px; margin-top: 10px;
    }
    .sum-item {
      background: rgba(255,255,255,0.15);
      border-radius: 8px;
      padding: 6px 12px;
      text-align: center;
      min-width: 80px;
    }
    .sum-label { font-size: 10px; opacity: 0.8; }
    .sum-val { font-size: 16px; font-weight: bold; }

    .staff-block {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      margin: 0 12px 16px 12px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .staff-header {
      display: flex; align-items: center; gap: 10px;
      background: #f3f4f6; padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .staff-no {
      width: 24px; height: 24px; background: #dc2626; color: #fff;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-weight: bold; font-size: 11px; flex-shrink: 0;
    }
    .staff-info { flex: 1; }
    .staff-info strong { font-size: 13px; display: block; }
    .staff-sub { font-size: 10px; color: #6b7280; }
    .status-badge {
      font-size: 10px; padding: 2px 8px; border-radius: 20px; font-weight: 600;
    }
    .status-badge.done { background: #d1fae5; color: #065f46; }
    .status-badge.progress { background: #fef3c7; color: #92400e; }

    .info-row {
      display: flex; gap: 8px; padding: 8px 12px;
      border-bottom: 1px solid #f3f4f6;
    }
    .info-item { flex: 1; text-align: center; }
    .info-label { font-size: 9px; color: #9ca3af; display: block; margin-bottom: 2px; text-transform: uppercase; }
    .info-value { font-size: 13px; font-weight: 600; color: #374151; }
    .info-value.sales { color: #059669; }

    .addr-row {
      padding: 6px 12px; font-size: 10px; color: #6b7280;
      border-bottom: 1px solid #f3f4f6; line-height: 1.6;
    }
    .notes-row {
      padding: 6px 12px; font-size: 10px; color: #6b7280;
      border-bottom: 1px solid #f3f4f6; font-style: italic;
    }

    .photos-section { padding: 8px 12px 10px; }
    .photos-group { margin-bottom: 8px; }
    .photos-title { font-size: 9px; color: #9ca3af; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
    .photos-row { display: flex; gap: 6px; flex-wrap: wrap; }
    .img-cell { text-align: center; }
    .img-label { font-size: 9px; color: #9ca3af; margin-bottom: 2px; }
    .img-cell img { width: 120px; height: 90px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb; }
    .img-empty { width: 120px; height: 90px; background: #f9fafb; border-radius: 6px; border: 1px dashed #d1d5db; }

    .page-footer {
      text-align: center; padding: 12px; font-size: 10px; color: #9ca3af;
      border-top: 1px solid #e5e7eb; margin-top: 8px;
    }

    @media print {
      body { background: #fff; }
      .staff-block { page-break-inside: avoid; }
      @page { margin: 10mm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="page-header">
    <div class="page-title">Báo cáo chấm công nhân viên</div>
    <div class="page-sub">${dateVN}${province ? ' · ' + province : ' · Tất cả tỉnh/thành'}</div>
    <div class="page-summary">
      <div class="sum-item">
        <div class="sum-label">Nhân viên</div>
        <div class="sum-val">${records.length}</div>
      </div>
      <div class="sum-item">
        <div class="sum-label">Hoàn thành</div>
        <div class="sum-val">${done}</div>
      </div>
      <div class="sum-item">
        <div class="sum-label">Tổng bán</div>
        <div class="sum-val">${totalSales} SP</div>
      </div>
    </div>
  </div>

  ${rows || '<p style="text-align:center;padding:40px;color:#9ca3af">Không có dữ liệu</p>'}

  <div class="page-footer">
    Báo cáo được tạo tự động · ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
  </div>
</body>
</html>`
  }

  function showAddUserModal() {
    const provincesOpts = window.PROVINCES_OPTIONS ? window.PROVINCES_OPTIONS() : ''
    const { overlay, close } = Modal.create(`
      <div class="p-5">
        <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-user-plus mr-2 text-red-600"></i>Thêm nhân viên</h3>
        <form id="add-user-form" class="space-y-3">
          <div><label class="block text-sm text-gray-600 mb-1">Họ và tên</label>
            <input type="text" name="full_name" class="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500" required /></div>
          <div><label class="block text-sm text-gray-600 mb-1">Tên đăng nhập</label>
            <input type="text" name="username" class="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500" required /></div>
          <div><label class="block text-sm text-gray-600 mb-1">Mật khẩu</label>
            <input type="password" name="password" class="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500" required /></div>
          <div><label class="block text-sm text-gray-600 mb-1">Tỉnh/Thành phố</label>
            <select name="province" class="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500">
              <option value="">-- Chọn tỉnh/thành --</option>
              ${provincesOpts}
            </select></div>
          <div><label class="block text-sm text-gray-600 mb-1">Vai trò</label>
            <select name="role" class="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500">
              <option value="staff">Nhân viên</option>
              <option value="admin">Admin</option>
            </select></div>
          <p id="add-user-error" class="text-red-500 text-sm hidden"></p>
          <div class="flex gap-3">
            <button type="button" id="add-user-cancel" class="flex-1 py-2 border rounded-xl text-gray-700">Hủy</button>
            <button type="submit" class="flex-1 py-2 bg-red-600 text-white rounded-xl font-medium">Thêm</button>
          </div>
        </form>
      </div>
    `)
    document.getElementById('add-user-cancel').onclick = close
    document.getElementById('add-user-form').onsubmit = async (e) => {
      e.preventDefault()
      const fd = new FormData(e.target)
      try {
        await API.createUser(Object.fromEntries(fd.entries()))
        Toast.success('Thêm nhân viên thành công')
        close()
        await loadUsers()
      } catch (err) {
        document.getElementById('add-user-error').textContent = err.message
        document.getElementById('add-user-error').classList.remove('hidden')
      }
    }
  }

  // ── Reset mật khẩu ──────────────────────────
  function showResetPassword(userId, name, username) {
    const { close } = Modal.create(`
      <div class="p-5">
        <h3 class="text-lg font-bold text-gray-800 mb-1">
          <i class="fas fa-key mr-2 text-yellow-500"></i>Reset mật khẩu
        </h3>
        <p class="text-sm text-gray-500 mb-4">
          ${name} <span class="text-gray-400">(@${username || ''})</span>
        </p>
        <input type="password" id="reset-pw-input" placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
          class="w-full px-3 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-500 mb-1" />
        <input type="password" id="reset-pw-confirm" placeholder="Xác nhận mật khẩu mới"
          class="w-full px-3 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-500 mb-4" />
        <p id="reset-pw-error" class="text-red-500 text-xs mb-3 hidden"></p>
        <div class="flex gap-3">
          <button id="reset-pw-cancel" class="flex-1 py-2.5 border rounded-xl text-gray-700">Hủy</button>
          <button id="reset-pw-ok" class="flex-1 py-2.5 bg-yellow-500 text-white rounded-xl font-medium">Đặt lại</button>
        </div>
      </div>
    `)
    document.getElementById('reset-pw-cancel').onclick = close
    document.getElementById('reset-pw-ok').onclick = async () => {
      const pw  = document.getElementById('reset-pw-input').value
      const cf  = document.getElementById('reset-pw-confirm').value
      const errEl = document.getElementById('reset-pw-error')
      if (!pw || pw.length < 6) {
        errEl.textContent = 'Mật khẩu ít nhất 6 ký tự'; errEl.classList.remove('hidden'); return
      }
      if (pw !== cf) {
        errEl.textContent = 'Mật khẩu xác nhận không khớp'; errEl.classList.remove('hidden'); return
      }
      try {
        await API.resetPassword(userId, pw)
        Toast.success('Reset mật khẩu thành công')
        close()
      } catch (e) { Toast.error(e.message) }
    }
  }

  // ── Đổi trạng thái tài khoản NV ─────────────
  function setUserStatus(userId, newStatus, name) {
    const labels = { active: 'Đang làm việc', pending: 'Chờ kích hoạt', resigned: 'Đã nghỉ việc' }
    const isRed  = newStatus === 'resigned'
    Modal.confirm(
      `Đổi trạng thái`,
      `Chuyển <b>${name}</b> sang trạng thái <b>${labels[newStatus]}</b>?`,
      async () => {
        try {
          await API.updateUserStatus(userId, newStatus)
          Toast.success(`Đã cập nhật: ${labels[newStatus]}`)
          // Giữ nguyên filter hiện tại
          const prov = document.getElementById('staff-province-filter')?.value || ''
          await loadUsers(prov)
        } catch (e) { Toast.error(e.message) }
      },
      'Xác nhận',
      isRed
    )
  }

  async function showCheckinDetail(id) {
    const res = await API.getAdminCheckinDetail(id)
    const r = res.data
    if (!r) return
    const imgRow = (label, src) => src
      ? `<div><p class="text-xs text-gray-500 mb-1">${label}</p>
           <img src="${src}" class="w-full rounded-lg cursor-pointer" onclick="Modal.image(this.src)" /></div>`
      : ''
    Modal.create(`
      <div class="p-5">
        <h3 class="text-lg font-bold text-gray-800 mb-1">${r.full_name}</h3>
        <p class="text-sm text-gray-500 mb-1">${r.date}</p>
        ${r.province ? `<p class="text-xs text-indigo-500 mb-3"><i class="fas fa-map-marker-alt mr-1"></i>${r.province}</p>` : '<div class="mb-3"></div>'}
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="bg-blue-50 rounded-lg p-2 text-center">
              <p class="text-xs text-blue-500">Check-in</p>
              <p class="font-bold text-blue-700">${formatTime(r.checkin_time)}</p>
              <p class="text-xs text-blue-400 break-all">${r.checkin_address || '--'}</p>
            </div>
            <div class="bg-purple-50 rounded-lg p-2 text-center">
              <p class="text-xs text-purple-500">Check-out</p>
              <p class="font-bold text-purple-700">${formatTime(r.checkout_time)}</p>
              <p class="text-xs text-purple-400 break-all">${r.checkout_address || '--'}</p>
            </div>
          </div>
          ${r.sales_quantity != null ? `<p class="text-sm font-medium"><i class="fas fa-box mr-1 text-green-500"></i>Bán: ${r.sales_quantity} SP</p>` : ''}
          ${r.notes ? `<p class="text-sm text-gray-600"><i class="fas fa-sticky-note mr-1"></i>${r.notes}</p>` : ''}
          <div class="grid grid-cols-2 gap-2">
            ${imgRow('Check-in 1', r.checkin_image1)}
            ${imgRow('Check-in 2', r.checkin_image2)}
          </div>
          <div class="grid grid-cols-2 gap-2">
            ${imgRow('HĐ 1', r.activity_image1)}
            ${imgRow('HĐ 2', r.activity_image2)}
            ${imgRow('HĐ 3', r.activity_image3)}
            ${imgRow('HĐ 4', r.activity_image4)}
          </div>
          <div class="grid grid-cols-2 gap-2">
            ${imgRow('Check-out 1', r.checkout_image1)}
            ${imgRow('Check-out 2', r.checkout_image2)}
          </div>
        </div>
      </div>
    `)
  }

  function bindEvents() {
    // Tab switching
    document.querySelectorAll('.admin-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(b => {
          b.classList.remove('bg-red-600', 'text-white')
          b.classList.add('text-gray-600')
        })
        btn.classList.add('bg-red-600', 'text-white')
        btn.classList.remove('text-gray-600')

        document.getElementById('admin-tab-staff').classList.add('hidden')
        document.getElementById('admin-tab-reports').classList.add('hidden')
        document.getElementById(`admin-tab-${btn.dataset.tab}`).classList.remove('hidden')
      })
    })

    // Đăng xuất admin
    document.getElementById('btn-admin-logout').onclick = () => {
      Modal.confirm('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', () => Auth.logout(), 'Đăng xuất', true)
    }

    // Đổi mật khẩu admin
    document.getElementById('btn-admin-change-pw').onclick = () => Auth.showChangePasswordModal()

    // Add user
    document.getElementById('btn-add-user').onclick = showAddUserModal

    // Filter staff by province
    document.getElementById('btn-filter-staff').onclick = () => {
      const prov = document.getElementById('staff-province-filter').value
      loadUsers(prov)
    }

    // Report date default = today VN
    const today = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
    document.getElementById('report-date').value = today

    document.getElementById('btn-load-report').onclick = () => {
      const date = document.getElementById('report-date').value
      const prov = document.getElementById('report-province-filter').value
      if (date) loadReport(date, prov)
    }

    // Export PDF
    document.getElementById('btn-export-pdf').onclick = exportPDF

    // Auto-load
    loadUsers()
  }

  return { renderPage, bindEvents, showResetPassword, setUserStatus, showCheckinDetail }
})()
