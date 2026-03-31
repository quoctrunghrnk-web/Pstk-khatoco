// =============================================
// Module: Admin Panel
// Tab: Nhân viên | Tỉnh/Thành | Báo cáo
// =============================================
window.AdminModule = (() => {

  // ── Cache tỉnh đang hoạt động ────────────────
  let _activeProvinces = []   // [{ id, name, sort_order }]

  // ── Helpers ──────────────────────────────────
  function formatTime(isoStr) {
    if (!isoStr) return '--'
    try {
      return new Date(isoStr).toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit'
      })
    } catch { return '--' }
  }

  // Tạo <select> từ _activeProvinces (đã load)
  function provinceSelectHtml(id, selected = '', allLabel = 'Tất cả tỉnh/thành') {
    const opts = _activeProvinces.map(p =>
      `<option value="${p.name}" ${p.name === selected ? 'selected' : ''}>${p.name}</option>`
    ).join('')
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

  // Refresh dropdown sau khi _activeProvinces thay đổi
  function refreshProvinceDropdowns() {
    const opts = _activeProvinces.map(p =>
      `<option value="${p.name}">${p.name}</option>`
    ).join('')
    const allOpt = '<option value="">Tất cả tỉnh/thành</option>'
    const noneOpt = '<option value="">-- Chưa phân công --</option>'

    const staffSel = document.getElementById('staff-province-filter')
    const reportSel = document.getElementById('report-province-filter')
    if (staffSel)  { staffSel.innerHTML  = allOpt  + opts }
    if (reportSel) { reportSel.innerHTML = allOpt  + opts }
  }

  // ── renderPage ────────────────────────────────
  function renderPage() {
    return `
    <div class="pb-24 bg-gradient-to-b from-red-50 to-gray-50 min-h-screen">
      <!-- Header -->
      <div class="bg-white border-b border-gray-100 shadow-sm px-4 sticky top-0 z-40 pt-safe-top">
        <div class="max-w-2xl mx-auto flex items-center gap-3 h-14">
          <div class="w-10 h-10 bg-red-50 border-2 border-red-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <img src="https://nhankiet.vn/uploads/01_Logo/Logo%20khong%20nen.jpg" alt="NK"
              class="w-8 h-8 object-contain block" />
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-sm font-bold text-gray-800">Quản trị viên</h2>
            <p class="text-gray-400 text-xs">Nhân Kiệt &nbsp;·&nbsp; <span class="text-red-500 font-semibold">Quản lý nhân viên &amp; hoạt động</span></p>
          </div>
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <button id="btn-admin-change-pw"
              class="w-8 h-8 flex items-center justify-center text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-amber-200" title="Đổi mật khẩu">
              <i class="fas fa-key text-xs"></i>
            </button>
            <button id="btn-admin-logout"
              class="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors border border-red-200">
              <i class="fas fa-sign-out-alt text-xs"></i>
              <span>Thoát</span>
            </button>
          </div>
        </div>
      </div>
      <div class="h-1 bg-gradient-to-r from-red-600 to-orange-400"></div>

      <!-- Tabs -->
      <div class="px-4 mt-4 mb-4 max-w-2xl mx-auto">
        <div class="bg-white rounded-2xl shadow-md border border-red-50 flex overflow-hidden">
          <button class="admin-tab flex-1 py-2.5 text-sm font-bold transition-all bg-gradient-to-b from-red-600 to-red-700 text-white" data-tab="staff">
            <i class="fas fa-users mr-1"></i>Nhân viên
          </button>
          <button class="admin-tab flex-1 py-2.5 text-sm font-medium transition-all text-indigo-600 hover:bg-indigo-50" data-tab="provinces">
            <i class="fas fa-map-marker-alt mr-1"></i>Tỉnh/Thành
          </button>
          <button class="admin-tab flex-1 py-2.5 text-sm font-medium transition-all text-emerald-600 hover:bg-emerald-50" data-tab="reports">
            <i class="fas fa-chart-bar mr-1"></i>Báo cáo
          </button>
        </div>
      </div>

      <!-- ═══ Tab: Nhân viên ═══ -->
      <div id="admin-tab-staff" class="px-4 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-gray-800 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-red-500 inline-block"></span>Danh sách nhân viên
          </h3>
          <button id="btn-add-user" class="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm rounded-xl shadow-sm hover:from-red-700 hover:to-red-800 transition-all font-semibold">
            <i class="fas fa-plus text-xs"></i>Thêm
          </button>
        </div>

        <div class="bg-white rounded-2xl shadow-md border border-red-50 p-3">
          <div class="flex gap-2 items-end">
            <div class="flex-1">
              <label class="block text-xs font-semibold text-red-600 mb-1.5">
                <i class="fas fa-map-marker-alt mr-1"></i>Lọc theo tỉnh/thành
              </label>
              <div class="relative">
                <select id="staff-province-filter"
                  class="w-full pl-3 pr-8 py-2 border border-red-100 rounded-xl text-sm
                         bg-red-50/30 focus:outline-none focus:ring-2 focus:ring-red-400
                         appearance-none cursor-pointer text-gray-700">
                  <option value="">Tất cả tỉnh/thành</option>
                </select>
                <i class="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-xs pointer-events-none"></i>
              </div>
            </div>
            <button id="btn-filter-staff" class="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold shadow-sm">
              <i class="fas fa-filter"></i>
            </button>
          </div>
        </div>

        <div id="users-list">
          <div class="flex justify-center py-8"><i class="fas fa-spinner fa-spin text-red-400 text-2xl"></i></div>
        </div>
      </div>

      <!-- ═══ Tab: Tỉnh/Thành ═══ -->
      <div id="admin-tab-provinces" class="px-4 space-y-3 hidden">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-bold text-gray-800 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>Tỉnh/Thành hoạt động
            </h3>
            <p class="text-xs text-gray-400 mt-0.5 ml-4">Nhân viên tự chọn tỉnh khi đăng ký và trong hồ sơ</p>
          </div>
          <button id="btn-add-province" class="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm rounded-xl shadow-sm hover:from-indigo-700 hover:to-indigo-800 transition-all font-semibold">
            <i class="fas fa-plus text-xs"></i>Thêm
          </button>
        </div>
        <div id="provinces-list">
          <div class="flex justify-center py-8"><i class="fas fa-spinner fa-spin text-indigo-400 text-2xl"></i></div>
        </div>
      </div>

      <!-- ═══ Tab: Báo cáo ═══ -->
      <div id="admin-tab-reports" class="px-4 space-y-3 hidden">
        <div class="bg-white rounded-2xl shadow-md border border-emerald-50 p-4">
          <h4 class="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2">
            <span class="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
              <i class="fas fa-filter text-emerald-600 text-xs"></i>
            </span>Bộ lọc báo cáo
          </h4>
          <div class="space-y-2.5">
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">
                <i class="fas fa-calendar-alt mr-1 text-emerald-500"></i>Ngày báo cáo
              </label>
              <input type="date" id="report-date"
                class="w-full px-3 py-2 border border-emerald-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-400 bg-emerald-50/30" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">
                <i class="fas fa-map-marker-alt mr-1 text-red-400"></i>Tỉnh/Thành phố
              </label>
              <div class="relative">
                <select id="report-province-filter"
                  class="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm
                         bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400
                         appearance-none cursor-pointer">
                  <option value="">Tất cả tỉnh/thành</option>
                </select>
                <i class="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
              </div>
            </div>
            <div class="flex gap-2 pt-1">
              <button id="btn-load-report" class="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl text-sm font-semibold shadow-sm">
                <i class="fas fa-search mr-1"></i>Xem báo cáo
              </button>
              <button id="btn-export-pdf" class="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-sm" disabled>
                <i class="fas fa-file-pdf mr-1"></i>Xuất PDF
              </button>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div id="report-summary" class="hidden bg-white rounded-2xl shadow-md border border-gray-100 p-4">
          <div class="grid grid-cols-3 gap-2.5 text-center">
            <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-100">
              <p class="text-xs text-blue-500 font-semibold mb-1 uppercase tracking-wide">NV chấm công</p>
              <p id="sum-staff" class="font-bold text-blue-700 text-xl">-</p>
            </div>
            <div class="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-100">
              <p class="text-xs text-emerald-600 font-semibold mb-1 uppercase tracking-wide">Hoàn thành</p>
              <p id="sum-done" class="font-bold text-emerald-700 text-xl">-</p>
            </div>
            <div class="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-3 border border-orange-100">
              <p class="text-xs text-orange-500 font-semibold mb-1 uppercase tracking-wide">Tổng bán</p>
              <p id="sum-sales" class="font-bold text-orange-700 text-xl">-</p>
            </div>
          </div>
        </div>

        <div id="report-list">
          <div class="text-center py-10">
            <div class="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i class="fas fa-chart-bar text-emerald-500 text-xl"></i>
            </div>
            <p class="text-gray-500 text-sm font-medium">Chọn ngày để xem báo cáo</p>
          </div>
        </div>
      </div>

    </div>`
  }

  // ── Load danh sách tỉnh đang hoạt động ───────
  async function loadActiveProvinces() {
    try {
      const res = await API.getActiveProvinces()
      _activeProvinces = res.data || []
    } catch {
      _activeProvinces = []
    }
    refreshProvinceDropdowns()
  }

  // ── Render tab Tỉnh/Thành ────────────────────
  async function loadProvincesTab() {
    const el = document.getElementById('provinces-list')
    if (!el) return
    await loadActiveProvinces()
    if (_activeProvinces.length === 0) {
      el.innerHTML = '<p class="text-center text-gray-400 py-8">Chưa có tỉnh/thành nào</p>'
      return
    }
    el.innerHTML = `
      <div class="space-y-2">
        ${_activeProvinces.map(p => `
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3 flex items-center gap-3">
            <div class="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <i class="fas fa-map-marker-alt text-sm"></i>
            </div>
            <span class="flex-1 font-medium text-gray-800 text-sm">${p.name}</span>
            <button onclick="AdminModule.confirmDeleteProvince(${p.id}, '${p.name.replace(/'/g, "\\'")}')"
              class="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
              <i class="fas fa-trash text-sm"></i>
            </button>
          </div>
        `).join('')}
      </div>
      <p class="text-xs text-center text-gray-400 mt-3">
        <i class="fas fa-info-circle mr-1"></i>${_activeProvinces.length} tỉnh/thành đang hoạt động
      </p>`
  }

  // ── Thêm tỉnh ────────────────────────────────
  function showAddProvinceModal() {
    // Lấy danh sách 63 tỉnh chưa có trong active
    const activeNames = new Set(_activeProvinces.map(p => p.name))
    const available = (window.PROVINCES || []).filter(p => !activeNames.has(p))

    const { close } = Modal.create(`
      <div class="p-5">
        <h3 class="text-lg font-bold text-gray-800 mb-4">
          <i class="fas fa-map-marker-alt mr-2 text-indigo-600"></i>Thêm tỉnh/thành
        </h3>
        <div class="space-y-3">
          <div>
            <label class="block text-sm text-gray-600 mb-1">Chọn từ danh sách 63 tỉnh</label>
            <div class="relative">
              <select id="province-pick"
                class="w-full pl-3 pr-8 py-2.5 border border-gray-300 rounded-xl text-sm
                       bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500
                       appearance-none cursor-pointer">
                <option value="">-- Chọn tỉnh/thành --</option>
                ${available.map(p => `<option value="${p}">${p}</option>`).join('')}
              </select>
              <i class="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
            </div>
          </div>
          <div class="flex items-center gap-2 text-xs text-gray-400">
            <div class="flex-1 h-px bg-gray-200"></div><span>hoặc nhập tự do</span><div class="flex-1 h-px bg-gray-200"></div>
          </div>
          <div>
            <input type="text" id="province-custom" placeholder="Nhập tên tỉnh/thành..."
              class="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <p id="province-add-err" class="text-red-500 text-sm mt-2 hidden"></p>
        <div class="flex gap-3 mt-4">
          <button id="province-add-cancel" class="flex-1 py-2.5 border rounded-xl text-gray-700">Hủy</button>
          <button id="province-add-ok" class="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium">Thêm</button>
        </div>
      </div>
    `)

    document.getElementById('province-add-cancel').onclick = close
    document.getElementById('province-add-ok').onclick = async () => {
      const pick   = document.getElementById('province-pick').value
      const custom = document.getElementById('province-custom').value.trim()
      const name   = custom || pick
      const errEl  = document.getElementById('province-add-err')
      if (!name) {
        errEl.textContent = 'Vui lòng chọn hoặc nhập tỉnh/thành'
        errEl.classList.remove('hidden'); return
      }
      try {
        await API.addProvince(name)
        Toast.success(`Đã thêm: ${name}`)
        close()
        await loadProvincesTab()
        // Refresh dropdown filter staff & report
        refreshProvinceDropdowns()
      } catch (e) {
        errEl.textContent = e.message
        errEl.classList.remove('hidden')
      }
    }
  }

  // ── Xóa tỉnh ─────────────────────────────────
  function confirmDeleteProvince(id, name) {
    Modal.confirm(
      'Xóa tỉnh/thành',
      `Xóa <b>${name}</b> khỏi danh sách hoạt động?<br><span class="text-xs text-gray-400">Chỉ xóa được nếu không còn NV nào thuộc tỉnh này.</span>`,
      async () => {
        try {
          await API.deleteProvince(id)
          Toast.success(`Đã xóa: ${name}`)
          await loadProvincesTab()
          refreshProvinceDropdowns()
        } catch (e) { Toast.error(e.message) }
      },
      'Xóa', true
    )
  }

  // ── Badge trạng thái ─────────────────────────
  function statusBadge(u) {
    if (u.account_status === 'pending')
      return '<span class="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Chờ kích hoạt</span>'
    if (u.account_status === 'resigned')
      return '<span class="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">Đã nghỉ việc</span>'
    return '<span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Đang làm việc</span>'
  }

  // ── Nút hành động NV ─────────────────────────
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
          class="p-2 text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200" title="Đã nghỉ việc">
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

  // ── Load danh sách NV ─────────────────────────
  async function loadUsers(province = '') {
    const el = document.getElementById('users-list')
    if (!el) return
    try {
      const params = province ? { province } : {}
      const res = await API.getUsers(params)
      const users = res.data || []
      if (users.length === 0) {
        el.innerHTML = `<p class="text-center text-gray-400 py-8">Chưa có nhân viên${province ? ` ở <b>${province}</b>` : ''}</p>`
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
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex items-start gap-3
                  ${u.account_status === 'pending' ? 'border-l-4 border-l-yellow-400' : ''}
                  ${u.account_status === 'resigned' ? 'opacity-60' : ''}">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                    ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}">
                    <i class="fas fa-user text-sm"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-gray-800 text-sm truncate">${u.full_name}</p>
                    <p class="text-xs text-gray-400">@${u.username}</p>
                    <div class="flex flex-wrap gap-1.5 mt-1.5">
                      <span class="text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}">
                        ${u.role === 'admin' ? 'Admin' : 'NV'}
                      </span>
                      ${statusBadge(u)}
                      ${u.province
                        ? `<span class="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">
                             <i class="fas fa-map-marker-alt mr-0.5 text-xs"></i>${u.province}
                           </span>`
                        : u.role !== 'admin'
                          ? `<span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 italic">Chưa có tỉnh</span>`
                          : ''}
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

  // ── Load báo cáo ─────────────────────────────
  let _lastReportData = null
  let _lastReportDate = ''
  let _lastReportProvince = ''

  async function loadReport(date, province = '') {
    const el = document.getElementById('report-list')
    const summaryEl = document.getElementById('report-summary')
    if (!el) return
    el.innerHTML = '<div class="flex justify-center py-8"><i class="fas fa-spinner fa-spin text-red-400 text-2xl"></i></div>'
    summaryEl.classList.add('hidden')
    document.getElementById('btn-export-pdf').disabled = true

    try {
      const params = { limit: 200 }
      if (province) params.province = province
      const res = await API.getAdminCheckins(date, params)
      const records = res.data || []

      _lastReportData = records
      _lastReportDate = date
      _lastReportProvince = province

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
        <div class="bg-white rounded-2xl shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
             onclick="AdminModule.showCheckinDetail(${r.id})">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <i class="fas fa-user text-blue-600"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-gray-800">${r.full_name}</p>
              <p class="text-xs text-gray-500">
                @${r.username}
                ${r.province ? `<span class="ml-1 text-indigo-500"><i class="fas fa-map-marker-alt"></i> ${r.province}</span>` : ''}
              </p>
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
  async function exportPDF() {
    if (!_lastReportData || !_lastReportData.length) {
      Toast.error('Không có dữ liệu để xuất PDF'); return
    }
    const btn = document.getElementById('btn-export-pdf')
    btn.disabled = true
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Đang tạo...'
    Toast.info('Đang chuẩn bị báo cáo...')
    try {
      const html = buildPrintHTML(_lastReportData, _lastReportDate, _lastReportProvince)
      const win = window.open('', '_blank', 'width=900,height=700')
      if (!win) { Toast.error('Trình duyệt đã chặn popup. Vui lòng cho phép.'); return }
      win.document.write(html)
      win.document.close()
      win.focus()
      win.onload = () => setTimeout(() => win.print(), 800)
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

    // imgCell: ảnh lớn, chiếm hết chiều rộng nhóm
    const imgCell = (src, label) => src
      ? `<div class="img-cell"><span class="img-label">${label}</span><img src="${src}" /></div>`
      : `<div class="img-cell empty"><span class="img-label">${label}</span><div class="img-empty"><span>Không có ảnh</span></div></div>`

    const rows = records.map((r, i) => {
      const actImgs = [r.activity_image1, r.activity_image2, r.activity_image3, r.activity_image4].filter(Boolean)
      // Check-in: 2 ảnh, Check-out: 2 ảnh, Hoạt động: 1-4 ảnh
      const ciImgs  = [r.checkin_image1,  r.checkin_image2 ].filter(Boolean)
      const coImgs  = [r.checkout_image1, r.checkout_image2].filter(Boolean)
      return `
      <div class="staff-block">
        <!-- Thông tin nhân viên -->
        <div class="staff-header">
          <span class="staff-no">${i + 1}</span>
          <div class="staff-info">
            <strong>${r.full_name}</strong>
            <span class="staff-sub">${r.username}${r.province ? ' &nbsp;·&nbsp; <i class="pin"></i>' + r.province : ''}</span>
          </div>
          <span class="status-badge ${r.status === 'checkout' ? 'done' : 'progress'}">
            ${r.status === 'checkout' ? '✓ Hoàn thành' : '⏳ Đang làm'}
          </span>
        </div>

        <!-- Thời gian + doanh số -->
        <div class="info-row">
          <div class="info-item">
            <span class="info-label">🕐 Check-in</span>
            <span class="info-value">${formatTime(r.checkin_time)}</span>
          </div>
          <div class="info-sep"></div>
          <div class="info-item">
            <span class="info-label">🕐 Check-out</span>
            <span class="info-value">${formatTime(r.checkout_time)}</span>
          </div>
          <div class="info-sep"></div>
          <div class="info-item">
            <span class="info-label">📦 Số bán</span>
            <span class="info-value sales">${r.sales_quantity != null ? r.sales_quantity + ' SP' : '--'}</span>
          </div>
        </div>

        <!-- Địa chỉ + ghi chú -->
        ${(r.checkin_address || r.checkout_address || r.notes) ? `
        <div class="meta-row">
          ${r.checkin_address  ? `<div class="meta-item"><span class="meta-icon">📍</span><span><b>CI:</b> ${r.checkin_address}</span></div>`  : ''}
          ${r.checkout_address ? `<div class="meta-item"><span class="meta-icon">📍</span><span><b>CO:</b> ${r.checkout_address}</span></div>` : ''}
          ${r.notes            ? `<div class="meta-item"><span class="meta-icon">📝</span><span>${r.notes}</span></div>`                        : ''}
        </div>` : ''}

        <!-- Ảnh: layout dọc theo nhóm, ảnh to dễ nhìn -->
        <div class="photos-section">
          <div class="photo-group ${ciImgs.length===0?'no-photo':''}">
            <div class="photos-title">📷 Ảnh Check-in</div>
            <div class="photo-grid cols-${Math.min(ciImgs.length||1,2)}">
              ${ciImgs.length > 0 ? ciImgs.map((s,j)=>imgCell(s,`Check-in ${j+1}`)).join('') : imgCell(null,'Check-in')}
            </div>
          </div>
          ${actImgs.length > 0 ? `
          <div class="photo-group">
            <div class="photos-title">🎯 Ảnh hoạt động</div>
            <div class="photo-grid cols-${Math.min(actImgs.length,2)}">
              ${actImgs.map((s,j)=>imgCell(s,`Hoạt động ${j+1}`)).join('')}
            </div>
          </div>` : ''}
          <div class="photo-group ${coImgs.length===0?'no-photo':''}">
            <div class="photos-title">📷 Ảnh Check-out</div>
            <div class="photo-grid cols-${Math.min(coImgs.length||1,2)}">
              ${coImgs.length > 0 ? coImgs.map((s,j)=>imgCell(s,`Check-out ${j+1}`)).join('') : imgCell(null,'Check-out')}
            </div>
          </div>
        </div>
      </div>`
    }).join('')

    return `<!DOCTYPE html><html lang="vi"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Báo cáo ${date}${province ? ' - ' + province : ''}</title>
<style>
/* ── Reset ── */
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1a1a1a;background:#f4f6f8;}

/* ── Page header ── */
.page-header{background:linear-gradient(135deg,#c0392b 0%,#7f1d1d 100%);color:#fff;padding:20px 28px 16px;margin-bottom:0;}
.hdr-top{display:flex;align-items:center;gap:16px;margin-bottom:14px;}
.hdr-logo-wrap{background:#fff;border-radius:14px;padding:8px;flex-shrink:0;box-shadow:0 3px 12px rgba(0,0,0,.25);}
.hdr-logo{width:60px;height:60px;object-fit:contain;display:block;}
.hdr-brand{flex:1;}
.hdr-company{font-size:10px;opacity:.75;letter-spacing:.8px;text-transform:uppercase;margin-bottom:3px;}
.hdr-title{font-size:22px;font-weight:800;line-height:1.15;margin-bottom:4px;}
.hdr-sub{font-size:12px;opacity:.88;}
.hdr-stats{display:flex;gap:12px;}
.stat-box{background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.25);border-radius:12px;padding:10px 20px;text-align:center;min-width:100px;}
.stat-label{font-size:9px;opacity:.78;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px;}
.stat-val{font-size:22px;font-weight:800;display:block;}

/* ── Staff block ── */
.staff-block{background:#fff;border-radius:14px;margin:14px 14px 0;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.07);page-break-inside:avoid;}
.staff-header{display:flex;align-items:center;gap:12px;background:linear-gradient(90deg,#fff5f5,#fff);padding:12px 16px;border-bottom:2px solid #fef2f2;}
.staff-no{width:32px;height:32px;background:#c0392b;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;flex-shrink:0;}
.staff-info{flex:1;}
.staff-info strong{font-size:14px;display:block;color:#111;font-weight:700;}
.staff-sub{font-size:11px;color:#6b7280;margin-top:2px;}
.status-badge{font-size:11px;padding:4px 12px;border-radius:20px;font-weight:700;white-space:nowrap;}
.status-badge.done{background:#dcfce7;color:#166534;border:1px solid #86efac;}
.status-badge.progress{background:#fef9c3;color:#854d0e;border:1px solid #fde047;}

/* ── Info row ── */
.info-row{display:flex;align-items:stretch;padding:0;border-bottom:1px solid #f0f0f0;}
.info-item{flex:1;text-align:center;padding:12px 8px;}
.info-sep{width:1px;background:#f0f0f0;}
.info-label{font-size:9px;color:#9ca3af;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:.4px;}
.info-value{font-size:17px;font-weight:700;color:#1f2937;display:block;}
.info-value.sales{color:#059669;}

/* ── Meta (address/notes) ── */
.meta-row{padding:8px 16px 6px;border-bottom:1px solid #f0f0f0;background:#fafafa;}
.meta-item{display:flex;align-items:baseline;gap:6px;font-size:10px;color:#4b5563;line-height:1.6;margin-bottom:2px;}
.meta-icon{flex-shrink:0;}

/* ── Photos - layout dọc theo nhóm, ảnh to ── */
.photos-section{padding:14px 16px 16px;}
.photo-group{margin-bottom:14px;}
.photo-group:last-child{margin-bottom:0;}
.photos-title{font-size:10px;color:#374151;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;padding-bottom:4px;border-bottom:2px solid #f3f4f6;display:flex;align-items:center;gap:6px;}
.photo-grid{display:grid;gap:8px;}
.photo-grid.cols-1{grid-template-columns:1fr;}
.photo-grid.cols-2{grid-template-columns:1fr 1fr;}
.img-cell{display:flex;flex-direction:column;}
.img-label{font-size:9px;color:#9ca3af;margin-bottom:3px;display:block;}
.img-cell img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:10px;border:1px solid #e5e7eb;display:block;box-shadow:0 1px 4px rgba(0,0,0,.08);}
.img-empty{width:100%;aspect-ratio:4/3;background:#f9fafb;border-radius:10px;border:2px dashed #d1d5db;display:flex;align-items:center;justify-content:center;}
.img-empty span{font-size:9px;color:#d1d5db;}
.photo-group.no-photo .photo-grid{opacity:.35;}

/* ── Footer ── */
.page-footer{display:flex;align-items:center;justify-content:center;gap:12px;padding:16px 28px;margin:14px 14px 0;background:#fff;border-radius:14px 14px 0 0;border-top:3px solid #c0392b;font-size:11px;color:#6b7280;}
.footer-logo-wrap{background:#fff5f5;border-radius:9px;border:1px solid #fecaca;padding:5px;}
.footer-logo{width:32px;height:32px;object-fit:contain;display:block;}
.footer-text{line-height:1.7;}
.footer-text strong{color:#c0392b;}

/* ── Print ── */
@media print{
  body{background:#fff;}
  @page{margin:10mm 10mm 12mm;size:A4 portrait;}
  .staff-block{page-break-inside:avoid;break-inside:avoid;margin:10px 0 0;}
  .page-footer{margin:10px 0 0;}
}
</style></head><body>

<!-- Header -->
<div class="page-header">
  <div class="hdr-top">
    <div class="hdr-logo-wrap">
      <img src="https://nhankiet.vn/uploads/01_Logo/Logo%20khong%20nen.jpg" alt="Nhân Kiệt" class="hdr-logo" />
    </div>
    <div class="hdr-brand">
      <div class="hdr-company">Nhân Kiệt · nhankiet.vn</div>
      <div class="hdr-title">Báo cáo chấm công nhân viên</div>
      <div class="hdr-sub">${dateVN}${province ? ' &nbsp;·&nbsp; ' + province : ' &nbsp;·&nbsp; Tất cả tỉnh/thành'}</div>
    </div>
  </div>
  <div class="hdr-stats">
    <div class="stat-box"><span class="stat-label">Nhân viên</span><span class="stat-val">${records.length}</span></div>
    <div class="stat-box"><span class="stat-label">Hoàn thành</span><span class="stat-val">${done}</span></div>
    <div class="stat-box"><span class="stat-label">Tổng bán</span><span class="stat-val">${totalSales}<small style="font-size:12px;font-weight:600;opacity:.8"> SP</small></span></div>
    <div class="stat-box"><span class="stat-label">Tỷ lệ HT</span><span class="stat-val">${records.length > 0 ? Math.round(done/records.length*100) : 0}<small style="font-size:12px;font-weight:600;opacity:.8">%</small></span></div>
  </div>
</div>

${rows || '<div style="text-align:center;padding:60px;color:#9ca3af;font-size:14px;">Không có dữ liệu trong ngày này</div>'}

<!-- Footer -->
<div class="page-footer">
  <div class="footer-logo-wrap">
    <img src="https://nhankiet.vn/uploads/01_Logo/Logo%20khong%20nen.jpg" alt="Nhân Kiệt" class="footer-logo" />
  </div>
  <div class="footer-text">
    Phát triển bởi <strong>nhankiet.vn</strong> &nbsp;·&nbsp; © 2026 Nhân Kiệt. All rights reserved.
    <br/><span style="font-size:9px;color:#9ca3af;">Báo cáo tạo lúc ${new Date().toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})}</span>
  </div>
</div>

</body></html>`
  }

  // ── Modal thêm NV ─────────────────────────────
  function showAddUserModal() {
    const opts = _activeProvinces.map(p =>
      `<option value="${p.name}">${p.name}</option>`
    ).join('')
    const { overlay, close } = Modal.create(`
      <div class="p-5">
        <h3 class="text-lg font-bold text-gray-800 mb-4">
          <i class="fas fa-user-plus mr-2 text-red-600"></i>Thêm nhân viên
        </h3>
        <form id="add-user-form" class="space-y-3">
          <div><label class="block text-sm text-gray-600 mb-1">Họ và tên</label>
            <input type="text" name="full_name" required
              class="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500" /></div>
          <div><label class="block text-sm text-gray-600 mb-1">Tên đăng nhập</label>
            <input type="text" name="username" required
              class="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500" /></div>
          <div><label class="block text-sm text-gray-600 mb-1">Mật khẩu</label>
            <input type="password" name="password" required
              class="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500" /></div>
          <div><label class="block text-sm text-gray-600 mb-1">Tỉnh/Thành phố</label>
            <div class="relative">
              <select name="province"
                class="w-full pl-3 pr-8 py-2 border rounded-xl text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none">
                <option value="">-- Chưa phân công --</option>
                ${opts}
              </select>
              <i class="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
            </div>
          </div>
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
      const data = Object.fromEntries(fd.entries())
      try {
        await API.createUser(data)
        Toast.success('Thêm nhân viên thành công')
        close()
        await loadUsers()
      } catch (err) {
        document.getElementById('add-user-error').textContent = err.message
        document.getElementById('add-user-error').classList.remove('hidden')
      }
    }
  }

  // ── Reset mật khẩu ───────────────────────────
  function showResetPassword(userId, name, username) {
    const { close } = Modal.create(`
      <div class="p-5">
        <h3 class="text-lg font-bold text-gray-800 mb-1">
          <i class="fas fa-key mr-2 text-yellow-500"></i>Reset mật khẩu
        </h3>
        <p class="text-sm text-gray-500 mb-4">${name} <span class="text-gray-400">(@${username||''})</span></p>
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
      if (!pw || pw.length < 6) { errEl.textContent='Mật khẩu ít nhất 6 ký tự'; errEl.classList.remove('hidden'); return }
      if (pw !== cf) { errEl.textContent='Mật khẩu xác nhận không khớp'; errEl.classList.remove('hidden'); return }
      try {
        await API.resetPassword(userId, pw)
        Toast.success('Reset mật khẩu thành công')
        close()
      } catch (e) { Toast.error(e.message) }
    }
  }

  // ── Đổi trạng thái NV ────────────────────────
  function setUserStatus(userId, newStatus, name) {
    const labels = { active:'Đang làm việc', pending:'Chờ kích hoạt', resigned:'Đã nghỉ việc' }
    Modal.confirm(
      'Đổi trạng thái',
      `Chuyển <b>${name}</b> sang <b>${labels[newStatus]}</b>?`,
      async () => {
        try {
          await API.updateUserStatus(userId, newStatus)
          Toast.success(`Đã cập nhật: ${labels[newStatus]}`)
          const prov = document.getElementById('staff-province-filter')?.value || ''
          await loadUsers(prov)
        } catch (e) { Toast.error(e.message) }
      },
      'Xác nhận',
      newStatus === 'resigned'
    )
  }

  // ── Chi tiết check-in ─────────────────────────
  async function showCheckinDetail(id) {
    try {
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
            <div class="grid grid-cols-2 gap-2">
              <div class="bg-blue-50 rounded-lg p-2 text-center">
                <p class="text-xs text-blue-500">Check-in</p>
                <p class="font-bold text-blue-700">${formatTime(r.checkin_time)}</p>
                <p class="text-xs text-blue-400 break-all">${r.checkin_address||'--'}</p>
              </div>
              <div class="bg-purple-50 rounded-lg p-2 text-center">
                <p class="text-xs text-purple-500">Check-out</p>
                <p class="font-bold text-purple-700">${formatTime(r.checkout_time)}</p>
                <p class="text-xs text-purple-400 break-all">${r.checkout_address||'--'}</p>
              </div>
            </div>
            ${r.sales_quantity!=null?`<p class="text-sm font-medium"><i class="fas fa-box mr-1 text-green-500"></i>Bán: ${r.sales_quantity} SP</p>`:''}
            ${r.notes?`<p class="text-sm text-gray-600"><i class="fas fa-sticky-note mr-1"></i>${r.notes}</p>`:''}
            <div class="grid grid-cols-2 gap-2">
              ${imgRow('Check-in 1',r.checkin_image1)}${imgRow('Check-in 2',r.checkin_image2)}
            </div>
            <div class="grid grid-cols-2 gap-2">
              ${imgRow('HĐ 1',r.activity_image1)}${imgRow('HĐ 2',r.activity_image2)}
              ${imgRow('HĐ 3',r.activity_image3)}${imgRow('HĐ 4',r.activity_image4)}
            </div>
            <div class="grid grid-cols-2 gap-2">
              ${imgRow('Check-out 1',r.checkout_image1)}${imgRow('Check-out 2',r.checkout_image2)}
            </div>
          </div>
        </div>
      `)
    } catch { Toast.error('Không tải được chi tiết') }
  }

  // ── bindEvents ────────────────────────────────
  async function bindEvents() {
    // Tab switching (3 tab)
    document.querySelectorAll('.admin-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(b => {
          b.classList.remove('bg-red-600','text-white')
          b.classList.add('text-gray-600')
        })
        btn.classList.add('bg-red-600','text-white')
        btn.classList.remove('text-gray-600')

        ;['staff','provinces','reports'].forEach(t => {
          document.getElementById(`admin-tab-${t}`)?.classList.add('hidden')
        })
        document.getElementById(`admin-tab-${btn.dataset.tab}`)?.classList.remove('hidden')

        // Lazy-load tab tỉnh khi bấm vào
        if (btn.dataset.tab === 'provinces') loadProvincesTab()
      })
    })

    // Đăng xuất
    document.getElementById('btn-admin-logout').onclick = () =>
      Modal.confirm('Đăng xuất','Bạn có chắc muốn đăng xuất?',()=>Auth.logout(),'Đăng xuất',true)

    // Đổi mật khẩu
    document.getElementById('btn-admin-change-pw').onclick = () => Auth.showChangePasswordModal()

    // Thêm NV
    document.getElementById('btn-add-user').onclick = showAddUserModal

    // Thêm tỉnh
    document.getElementById('btn-add-province').onclick = showAddProvinceModal

    // Filter NV theo tỉnh
    document.getElementById('btn-filter-staff').onclick = () => {
      const prov = document.getElementById('staff-province-filter')?.value || ''
      loadUsers(prov)
    }

    // Ngày báo cáo mặc định = hôm nay VN
    const today = new Date(Date.now() + 7*60*60*1000).toISOString().slice(0,10)
    const reportDateEl = document.getElementById('report-date')
    if (reportDateEl) reportDateEl.value = today

    // Load báo cáo
    document.getElementById('btn-load-report').onclick = () => {
      const date = document.getElementById('report-date').value
      const prov = document.getElementById('report-province-filter')?.value || ''
      if (date) loadReport(date, prov)
    }

    // Xuất PDF
    document.getElementById('btn-export-pdf').onclick = exportPDF

    // Load tỉnh active → populate dropdowns → rồi load NV
    await loadActiveProvinces()
    await loadUsers()
  }

  return {
    renderPage, bindEvents,
    showResetPassword, setUserStatus, showCheckinDetail,
    confirmDeleteProvince
  }
})()
