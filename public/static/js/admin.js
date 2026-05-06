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
    return APP_CONFIG.formatTimeVN(isoStr).replace('--:--', '--')
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
          <button class="admin-tab flex-1 py-2.5 text-sm font-medium transition-all text-blue-600 hover:bg-blue-50" data-tab="products">
            <i class="fas fa-box mr-1"></i>SP/QT
          </button>
        </div>
      </div>

      <!-- ═══ Tab: Nhân viên ═══ -->
      <div id="admin-tab-staff" class="px-4 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-gray-800 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-red-500 inline-block"></span>Danh sách nhân viên
          </h3>
          <div class="flex gap-2">
            <button id="btn-export-excel-staff"
              class="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-600 to-green-700 text-white text-sm rounded-xl shadow-sm hover:from-emerald-700 hover:to-green-800 transition-all font-semibold">
              <i class="fas fa-file-excel text-xs"></i>Excel
            </button>
            <button id="btn-add-user" class="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm rounded-xl shadow-sm hover:from-red-700 hover:to-red-800 transition-all font-semibold">
              <i class="fas fa-plus text-xs"></i>Thêm
            </button>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-md border border-red-50 p-3">
          <div class="space-y-2">
            <div>
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
            <div class="flex gap-2 items-end">
              <div class="flex-1">
                <label class="block text-xs font-semibold text-gray-600 mb-1.5">
                  <i class="fas fa-search mr-1 text-gray-400"></i>Tìm theo tên / SĐT
                </label>
                <input type="text" id="staff-search-input" placeholder="Nhập tên hoặc số điện thoại..."
                  class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
              <button id="btn-filter-staff" class="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold shadow-sm">
                <i class="fas fa-filter"></i>
              </button>
            </div>
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

      <!-- ═══ Tab: Sản phẩm & Quà tặng ═══ -->
      <div id="admin-tab-products" class="px-4 space-y-4 hidden">

        <!-- Sản phẩm -->
        <div class="bg-white rounded-2xl shadow-md border border-blue-50 p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-gray-800 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>Danh sách sản phẩm
            </h3>
            <button id="btn-add-product"
              class="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700
                     text-white text-sm rounded-xl shadow-sm font-semibold">
              <i class="fas fa-plus text-xs"></i>Thêm SP
            </button>
          </div>
          <div id="products-list">
            <div class="flex justify-center py-4"><i class="fas fa-spinner fa-spin text-blue-400 text-xl"></i></div>
          </div>
        </div>

        <!-- Quà tặng -->
        <div class="bg-white rounded-2xl shadow-md border border-amber-50 p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-gray-800 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>Danh sách quà tặng
            </h3>
            <button id="btn-add-gift"
              class="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600
                     text-white text-sm rounded-xl shadow-sm font-semibold">
              <i class="fas fa-plus text-xs"></i>Thêm QT
            </button>
          </div>
          <div id="gifts-list">
            <div class="flex justify-center py-4"><i class="fas fa-spinner fa-spin text-amber-400 text-xl"></i></div>
          </div>
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
                <i class="fas fa-calendar-alt mr-1 text-emerald-500"></i>Từ ngày — Đến ngày
              </label>
              <div class="flex gap-2">
                <input type="date" id="report-date-from"
                  class="flex-1 px-2 py-2 border border-emerald-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-400 bg-emerald-50/30" />
                <input type="date" id="report-date-to"
                  class="flex-1 px-2 py-2 border border-emerald-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-400 bg-emerald-50/30" />
              </div>
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
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">
                <i class="fas fa-id-card mr-1 text-blue-400"></i>Mã nhân viên (Số điện thoại)
              </label>
              <input type="tel" id="report-staff-code" placeholder="Nhập SĐT để lọc NV..."
                inputmode="numeric" pattern="[0-9]*"
                class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-400 bg-white" />
            </div>
            <div class="flex gap-2 pt-1">
              <button id="btn-load-report" class="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl text-sm font-semibold shadow-sm">
                <i class="fas fa-search mr-1"></i>Xem báo cáo
              </button>
              <button id="btn-export-excel-report" class="py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-xl text-sm font-semibold shadow-sm" disabled>
                <i class="fas fa-file-excel"></i>
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
    // Nút sửa thông tin
    btns.push(`
      <button onclick="AdminModule.showEditUser(${u.id})"
        class="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100" title="Sửa thông tin">
        <i class="fas fa-edit text-sm"></i>
      </button>`)
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
  let _allUsers = []  // cache for Excel export + search

  async function loadUsers(province = '', search = '') {
    const el = document.getElementById('users-list')
    if (!el) return
    try {
      const params = {}
      if (province) params.province = province
      const res = await API.getUsers(params)
      _allUsers = res.data || []

      // Client-side search filter
      let users = _allUsers
      if (search) {
        const q = search.toLowerCase().trim()
        users = _allUsers.filter(u =>
          u.full_name?.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q) ||
          u.phone?.includes(q) ||
          u.cccd_number?.includes(q)
        )
      }

      if (users.length === 0) {
        el.innerHTML = `<p class="text-center text-gray-400 py-8">Không tìm thấy nhân viên${province ? ` ở <b>${province}</b>` : ''}${search ? ` khớp "<b>${search}</b>"` : ''}</p>`
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
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-3
                  ${u.account_status === 'pending' ? 'border-l-4 border-l-yellow-400' : ''}
                  ${u.account_status === 'resigned' ? 'opacity-60' : ''}">
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                      ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}">
                      <i class="fas fa-user text-sm"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-semibold text-gray-800 text-sm">${u.full_name}</p>
                      <p class="text-xs text-gray-500 font-mono">${u.username}</p>
                      <div class="flex flex-wrap gap-1.5 mt-1.5">
                        <span class="text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}">
                          ${u.role === 'admin' ? 'Admin' : 'NV thị trường'}
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
                  <!-- Chi tiết đầy đủ -->
                  ${u.role !== 'admin' ? `
                  <div class="mt-2.5 pt-2.5 border-t border-gray-100 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-600">
                    ${u.phone ? `
                    <div class="flex items-center gap-1.5">
                      <i class="fas fa-phone text-emerald-400 w-3.5 text-center"></i>
                      <span>${u.phone}</span>
                    </div>` : `
                    <div class="flex items-center gap-1.5 text-gray-300 italic">
                      <i class="fas fa-phone w-3.5 text-center"></i>
                      <span>Chưa có SĐT</span>
                    </div>`}
                    ${u.cccd_number ? `
                    <div class="flex items-center gap-1.5">
                      <i class="fas fa-id-card text-blue-400 w-3.5 text-center"></i>
                      <span>${u.cccd_number}</span>
                    </div>` : `
                    <div class="flex items-center gap-1.5 text-gray-300 italic">
                      <i class="fas fa-id-card w-3.5 text-center"></i>
                      <span>Chưa có CCCD</span>
                    </div>`}
                    ${u.bank_name ? `
                    <div class="flex items-center gap-1.5 col-span-2">
                      <i class="fas fa-university text-purple-400 w-3.5 text-center"></i>
                      <span class="truncate">${u.bank_name}${u.bank_account_number ? ' · ' + u.bank_account_number : ''}</span>
                    </div>` : `
                    <div class="flex items-center gap-1.5 col-span-2 text-gray-300 italic">
                      <i class="fas fa-university w-3.5 text-center"></i>
                      <span>Chưa có thông tin ngân hàng</span>
                    </div>`}
                    <div class="flex items-center gap-1.5 col-span-2 text-gray-400">
                      <i class="fas fa-clock w-3.5 text-center"></i>
                      <span>Tham gia: ${APP_CONFIG.formatDateVN(u.created_at)}</span>
                    </div>
                  </div>` : ''}
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

  // ── Xuất Excel danh sách NV (.xlsx) ────────────
  function exportStaffExcel() {
    if (!_allUsers.length) {
      Toast.error('Chưa có dữ liệu nhân viên'); return
    }

    // Chỉ lấy nhân viên (không lấy admin)
    const staff = _allUsers.filter(u => u.role !== 'admin')
    if (!staff.length) {
      Toast.error('Không có nhân viên để xuất'); return
    }

    const fmtDate = (d) => {
      if (!d) return ''
      const s = String(d).slice(0, 10)
      const [y, m, dd] = s.split('-')
      if (!y || !m || !dd) return d
      return `${dd}/${m}/${y}`
    }

    const wb = XLSX.utils.book_new()
    const headers = [
      'STT', 'Họ và tên', 'Tỉnh/Thành', 'Số CCCD',
      'Ngày tháng năm sinh', 'Thường trú', 'Ngày cấp CCCD', 'Nơi cấp CCCD',
      'Số tài khoản', 'Tên ngân hàng', 'Chủ tài khoản', 'Số điện thoại', 'Ngày nhận việc',
    ]
    const rows = staff.map((u, i) => [
      i + 1,
      u.full_name || '',
      u.province || '',
      u.cccd_number ? `'${u.cccd_number}` : '',
      fmtDate(u.cccd_dob),
      u.cccd_address || '',
      fmtDate(u.cccd_issue_date),
      u.cccd_issue_place || '',
      u.bank_account_number ? `'${u.bank_account_number}` : '',
      u.bank_name || '',
      u.bank_account_name || '',
      u.phone ? `'${u.phone}` : u.username ? `'${u.username}` : '',
      fmtDate(u.start_date),
    ])

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    ws['!cols'] = [
      { wch: 5 }, { wch: 28 }, { wch: 22 }, { wch: 18 },
      { wch: 16 }, { wch: 40 }, { wch: 16 }, { wch: 30 },
      { wch: 18 }, { wch: 22 }, { wch: 28 }, { wch: 15 }, { wch: 16 },
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách nhân viên')
    const today = APP_CONFIG.todayVN()
    XLSX.writeFile(wb, `danh-sach-nhan-vien-${today}.xlsx`)
    Toast.success(`Đã xuất ${staff.length} nhân viên ra file Excel!`)
  }

  // ── Load báo cáo ─────────────────────────────
  let _lastReportData = null
  let _lastReportDateFrom = ''
  let _lastReportDateTo = ''
  let _lastReportProvince = ''

  async function loadReport(dateFrom, dateTo, province = '', staffCode = '') {
    const el = document.getElementById('report-list')
    const summaryEl = document.getElementById('report-summary')
    if (!el) return
    el.innerHTML = '<div class="flex justify-center py-8"><i class="fas fa-spinner fa-spin text-red-400 text-2xl"></i></div>'
    summaryEl.classList.add('hidden')
    document.getElementById('btn-export-pdf').disabled = true
    document.getElementById('btn-export-excel-report').disabled = true

    try {
      const params = { limit: '200' }
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      if (province) params.province = province
      if (staffCode) params.username = staffCode.trim()
      const res = await API.getAdminCheckins(null, params)
      const records = res.data || []

      _lastReportData = records
      _lastReportDateFrom = dateFrom
      _lastReportDateTo = dateTo
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
      document.getElementById('btn-export-excel-report').disabled = false

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
                <span class="font-mono text-gray-600">${r.username}</span>
                ${r.province ? `<span class="ml-1 text-indigo-500"><i class="fas fa-map-marker-alt"></i> ${r.province}</span>` : ''}
              </p>
              ${r.store_name ? `<p class="text-xs text-orange-600 mt-0.5"><i class="fas fa-store mr-1"></i>${r.store_name}</p>` : ''}
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

  // ── Xuất Excel báo cáo ───────────────────────
  function exportReportExcel(dataOverride) {
    const data = dataOverride || _lastReportData
    if (!data || !data.length) {
      Toast.error('Không có dữ liệu báo cáo để xuất Excel'); return
    }

    const fmtDate = (d) => {
      if (!d) return ''
      try {
        return new Date(d + 'T00:00:00+07:00').toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
      } catch { return d }
    }

    const fmtTime = (isoStr) => {
      if (!isoStr) return '--'
      return APP_CONFIG.formatTimeVN(isoStr).replace('--:--', '--')
    }

    const saleQty = (sales, name) => {
      if (!sales || !sales.length) return ''
      const s = sales.find(x => x.product_name === name)
      return s && s.quantity > 0 ? s.quantity : ''
    }
    const giftQty = (gifts, name) => {
      if (!gifts || !gifts.length) return ''
      const g = gifts.find(x => x.gift_name === name)
      return g && g.quantity > 0 ? g.quantity : ''
    }

    const wb = XLSX.utils.book_new()
    const fmtDateOnly = (d) => {
      if (!d) return ''
      try {
        return new Date(d + 'T00:00:00+07:00').toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
      } catch { return d }
    }
    const headers = [
      'STT', 'Họ và tên', 'SĐT', 'Tỉnh/Thành', 'Điểm bán',
      'Ngày', 'Địa chỉ check-in', 'Giờ check-in', 'Giờ check-out', 'Trạng thái',
      'Tồn kho White Horse', 'Tồn kho White Horse Demi', 'Tồn kho Leopard',
      'Bán White Horse', 'Bán White Horse Demi', 'Bán Leopard',
      'Phát bật lửa', 'Phát hộp diêm',
      'Ghi chú',
    ]
    const rows = data.map((r, i) => [
      i + 1,
      r.full_name || '',
      r.username || '',
      r.province || '',
      r.store_name || '',
      fmtDateOnly(r.date),
      r.checkin_address || '',
      fmtTime(r.checkin_time),
      fmtTime(r.checkout_time),
      r.status === 'checkout' ? 'Hoàn thành' : 'Chỉ check-in',
      r.stock_white_horse != null ? r.stock_white_horse : '',
      r.stock_white_horse_demi != null ? r.stock_white_horse_demi : '',
      r.stock_leopard != null ? r.stock_leopard : '',
      saleQty(r.sales, 'White Horse'),
      saleQty(r.sales, 'White Horse Demi'),
      saleQty(r.sales, 'Leopard'),
      giftQty(r.gifts, 'Quà tặng bật lửa'),
      giftQty(r.gifts, 'Quà tặng hộp diêm'),
      r.notes || '',
    ])

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    ws['!cols'] = [
      { wch: 5 }, { wch: 28 }, { wch: 15 }, { wch: 22 }, { wch: 30 },
      { wch: 12 }, { wch: 40 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
      { wch: 20 }, { wch: 24 }, { wch: 18 },
      { wch: 18 }, { wch: 22 }, { wch: 16 },
      { wch: 16 }, { wch: 16 },
      { wch: 36 },
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo chấm công')
    const today = APP_CONFIG.todayVN()
    const xlDate = _lastReportDateFrom === _lastReportDateTo
      ? _lastReportDateFrom
      : `${_lastReportDateFrom}_${_lastReportDateTo}`
    XLSX.writeFile(wb, `bao-cao-cham-cong-${xlDate}.xlsx`)
    Toast.success(`Đã xuất ${data.length} bản ghi ra file Excel!`)
  }

  // ── Xem trước & chỉnh sửa trước khi xuất Excel ──
  function showReportPreviewModal() {
    if (!_lastReportData || !_lastReportData.length) {
      Toast.error('Không có dữ liệu báo cáo để xuất Excel'); return
    }

    // Deep clone dữ liệu để chỉnh sửa không ảnh hưởng bản gốc
    const editData = _lastReportData.map(r => {
      const sales = (r.sales || []).map(s => ({ ...s }))
      const gifts = (r.gifts || []).map(g => ({ ...g }))
      return { ...r, sales, gifts }
    })

    const fmtTime = (isoStr) => {
      if (!isoStr) return '--'
      return APP_CONFIG.formatTimeVN(isoStr).replace('--:--', '--')
    }

    const renderTable = () => {
      const tbody = document.getElementById('preview-table-body')
      if (!tbody) return
      tbody.innerHTML = editData.map((r, i) => `
        <tr class="border-b border-gray-100 hover:bg-gray-50">
          <td class="px-2 py-2 text-center text-xs text-gray-500">${i + 1}</td>
          <td class="px-2 py-2 text-xs font-medium text-gray-800 whitespace-nowrap">${r.full_name || ''}</td>
          <td class="px-2 py-2 text-xs text-gray-500 font-mono whitespace-nowrap">${r.username || ''}</td>
          <td class="px-2 py-2 text-xs text-gray-600 whitespace-nowrap">${r.province || ''}</td>
          <td class="px-1 py-1">
            <input type="text" data-field="store_name" data-idx="${i}"
              value="${r.store_name || ''}"
              class="w-full px-1.5 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-red-400 bg-white min-w-[120px]" />
          </td>
          <td class="px-2 py-2 text-xs text-gray-500 whitespace-nowrap">${r.date || ''}</td>
          <td class="px-1 py-1">
            <input type="text" data-field="checkin_address" data-idx="${i}"
              value="${r.checkin_address || ''}"
              class="w-full px-1.5 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-red-400 bg-white min-w-[160px]" />
          </td>
          <td class="px-2 py-2 text-xs text-gray-500 whitespace-nowrap">${fmtTime(r.checkin_time)}</td>
          <td class="px-2 py-2 text-xs text-gray-500 whitespace-nowrap">${fmtTime(r.checkout_time)}</td>
          <td class="px-2 py-2 text-xs whitespace-nowrap">
            <span class="px-1.5 py-0.5 rounded-full text-xs ${r.status === 'checkout' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">${r.status === 'checkout' ? 'Hoàn thành' : 'Đang làm'}</span>
          </td>
          <td class="px-1 py-1">
            <input type="number" data-field="stock_white_horse" data-idx="${i}"
              value="${r.stock_white_horse != null ? r.stock_white_horse : ''}"
              class="w-full px-1.5 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-red-400 bg-white min-w-[70px]" />
          </td>
          <td class="px-1 py-1">
            <input type="number" data-field="stock_white_horse_demi" data-idx="${i}"
              value="${r.stock_white_horse_demi != null ? r.stock_white_horse_demi : ''}"
              class="w-full px-1.5 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-red-400 bg-white min-w-[70px]" />
          </td>
          <td class="px-1 py-1">
            <input type="number" data-field="stock_leopard" data-idx="${i}"
              value="${r.stock_leopard != null ? r.stock_leopard : ''}"
              class="w-full px-1.5 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-red-400 bg-white min-w-[70px]" />
          </td>
          <td class="px-1 py-1">
            <input type="number" data-field="sales_quantity" data-idx="${i}"
              value="${r.sales_quantity != null ? r.sales_quantity : ''}"
              class="w-full px-1.5 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-red-400 bg-white min-w-[60px]" />
          </td>
          <td class="px-1 py-1">
            <input type="text" data-field="notes" data-idx="${i}"
              value="${r.notes || ''}"
              class="w-full px-1.5 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-red-400 bg-white min-w-[120px]" />
          </td>
        </tr>
      `).join('')

      // Bind input events to sync edits back to editData
      tbody.querySelectorAll('input').forEach(inp => {
        inp.addEventListener('input', () => {
          const idx = parseInt(inp.dataset.idx)
          const field = inp.dataset.field
          if (!isNaN(idx) && field && editData[idx]) {
            let val = inp.value.trim()
            if (field.startsWith('stock_') || field === 'sales_quantity') {
              val = val === '' ? null : parseInt(val) || 0
            }
            editData[idx][field] = val
          }
        })
      })
    }

    // Tạo overlay full-screen thay vì modal nhỏ
    const overlay = document.createElement('div')
    overlay.id = 'preview-overlay'
    overlay.className = 'fixed inset-0 z-50 flex flex-col bg-white'
    overlay.innerHTML = `
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0 bg-white shadow-sm">
        <div>
          <h3 class="text-base font-bold text-gray-800">
            <i class="fas fa-edit mr-2 text-red-500"></i>Xem trước & chỉnh sửa dữ liệu
          </h3>
          <p class="text-xs text-gray-400 mt-0.5">${editData.length} bản ghi &middot; Sửa trực tiếp vào ô, sau đó nhấn Xuất Excel</p>
        </div>
        <button id="preview-close-btn" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Table -->
      <div class="overflow-auto flex-1">
        <table class="w-full text-xs border-collapse">
          <thead class="sticky top-0 z-10">
            <tr class="bg-gray-100 text-gray-600 font-semibold">
              <th class="px-2 py-2 text-center w-8">STT</th>
              <th class="px-2 py-2 text-left whitespace-nowrap">Họ và tên</th>
              <th class="px-2 py-2 text-left whitespace-nowrap">SĐT</th>
              <th class="px-2 py-2 text-left whitespace-nowrap">Tỉnh/TP</th>
              <th class="px-1 py-2 text-left whitespace-nowrap bg-yellow-50">Điểm bán *</th>
              <th class="px-2 py-2 text-left whitespace-nowrap">Ngày</th>
              <th class="px-1 py-2 text-left whitespace-nowrap bg-yellow-50">Địa chỉ CI *</th>
              <th class="px-2 py-2 text-left whitespace-nowrap">Giờ CI</th>
              <th class="px-2 py-2 text-left whitespace-nowrap">Giờ CO</th>
              <th class="px-2 py-2 text-center whitespace-nowrap">Trạng thái</th>
              <th class="px-1 py-2 text-left whitespace-nowrap bg-blue-50">TK White Horse</th>
              <th class="px-1 py-2 text-left whitespace-nowrap bg-blue-50">TK WH Demi</th>
              <th class="px-1 py-2 text-left whitespace-nowrap bg-blue-50">TK Leopard</th>
              <th class="px-1 py-2 text-left whitespace-nowrap bg-green-50">Tổng bán</th>
              <th class="px-1 py-2 text-left whitespace-nowrap bg-yellow-50">Ghi chú *</th>
            </tr>
          </thead>
          <tbody id="preview-table-body"></tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between px-4 py-3 border-t border-gray-200 flex-shrink-0 bg-gray-50 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
        <p class="text-xs text-gray-400"><span class="text-yellow-600">*</span> = có thể chỉnh sửa</p>
        <div class="flex gap-2">
          <button id="preview-cancel-btn" class="px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-100">Hủy</button>
          <button id="preview-export-btn" class="px-5 py-2 bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:from-emerald-700 hover:to-green-800">
            <i class="fas fa-file-excel mr-1"></i>Xuất Excel
          </button>
        </div>
      </div>
    `
    document.body.appendChild(overlay)

    const close = () => {
      overlay.remove()
      document.body.style.overflow = ''
    }
    document.body.style.overflow = 'hidden'

    renderTable()

    document.getElementById('preview-close-btn').onclick = close
    document.getElementById('preview-cancel-btn').onclick = close
    document.getElementById('preview-export-btn').onclick = async () => {
      const btn = document.getElementById('preview-export-btn')
      const origText = btn.innerHTML
      btn.disabled = true
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Đang lưu...'

      try {
        // Lưu toàn bộ dữ liệu đã chỉnh sửa vào hệ thống
        const updates = []
        for (const r of editData) {
          updates.push(API.updateAdminCheckin(r.id, {
            store_name: r.store_name,
            checkin_address: r.checkin_address,
            stock_white_horse: r.stock_white_horse,
            stock_white_horse_demi: r.stock_white_horse_demi,
            stock_leopard: r.stock_leopard,
            sales_quantity: r.sales_quantity,
            notes: r.notes,
          }))
        }
        await Promise.all(updates)
        Toast.success('Đã lưu ' + editData.length + ' bản ghi vào hệ thống')
      } catch (e) {
        Toast.error('Lỗi khi lưu: ' + e.message)
        btn.disabled = false
        btn.innerHTML = origText
        return
      }

      exportReportExcel(editData)
      close()
    }
  }

    // ── Xuất PDF ─────────────────────────────────
  function showPDFProgress() {
    const overlay = document.createElement('div')
    overlay.id = 'pdf-progress-overlay'
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center'
    overlay.style.cssText = 'background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);'
    overlay.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-80 text-center mx-4">
        <div class="w-16 h-16 mx-auto mb-4 relative">
          <i class="fas fa-file-pdf text-red-500 text-5xl animate-pulse"></i>
        </div>
        <h3 class="text-base font-bold text-gray-800 mb-1">Đang tạo báo cáo PDF</h3>
        <p id="pdf-progress-msg" class="text-sm text-gray-500 mb-4">Đang chuẩn bị...</p>
        <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div id="pdf-progress-bar" class="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500"
               style="width:0%"></div>
        </div>
        <p id="pdf-progress-pct" class="text-xs text-gray-400 mt-2">0%</p>
      </div>`
    document.body.appendChild(overlay)
    return {
      update: (msg, pct) => {
        const msgEl = document.getElementById('pdf-progress-msg')
        const barEl = document.getElementById('pdf-progress-bar')
        const pctEl = document.getElementById('pdf-progress-pct')
        if (msgEl) msgEl.textContent = msg
        if (barEl) barEl.style.width = pct + '%'
        if (pctEl) pctEl.textContent = Math.round(pct) + '%'
      },
      remove: () => {
        const el = document.getElementById('pdf-progress-overlay')
        if (el) el.remove()
      }
    }
  }

  async function exportPDF() {
    if (!_lastReportData || !_lastReportData.length) {
      Toast.error('Không có dữ liệu để xuất PDF'); return
    }
    const btn = document.getElementById('btn-export-pdf')
    btn.disabled = true
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Đang tạo...'

    const progress = showPDFProgress()

    try {
      // Tách record mới (có R2 key) và cũ (chỉ có base64)
      const hasR2 = (r) => r.checkin_image1_r2 || r.checkin_image2_r2 || r.checkout_image1_r2 || r.checkout_image2_r2
      const newRecords = _lastReportData.filter(r => hasR2(r))
      const oldRecords = _lastReportData.filter(r => !hasR2(r))

      // 1. Fetch ảnh R2 cho record mới
      progress.update('Đang tải ảnh check-in mới...', 5)
      const keysToFetch = new Set()
      newRecords.forEach(r => {
        ;['checkin_image1_r2','checkin_image2_r2','checkout_image1_r2','checkout_image2_r2'].forEach(f => {
          if (r[f]) keysToFetch.add(r[f])
        })
      })
      const keyMap = {}
      const keys = [...keysToFetch]
      const totalBatches = Math.ceil(keys.length / 10)
      for (let i = 0; i < keys.length; i += 10) {
        const batch = keys.slice(i, i + 10)
        const results = await Promise.all(batch.map(k => API.fetchImageAsDataUrl(k)))
        batch.forEach((k, j) => { keyMap[k] = results[j] })
        const batchNum = Math.floor(i / 10) + 1
        progress.update(
          `Đang tải ảnh check-in... (${batchNum}/${totalBatches})`,
          5 + Math.round((batchNum / Math.max(totalBatches, 1)) * 25)
        )
      }

      // 2. Fetch ảnh base64 cho record cũ
      progress.update('Đang tải ảnh check-in cũ...', 30)
      const base64Map = {}
      if (oldRecords.length > 0) {
        const oldIds = oldRecords.map(r => r.id)
        const res = await API.getCheckinImages(oldIds)
        const data = res.data || {}
        for (const [id, img] of Object.entries(data)) {
          base64Map[id] = img
        }
      }

      // 3. Build enriched records
      progress.update('Đang ghép dữ liệu...', 35)
      const enriched = _lastReportData.map(r => {
        const r2k = hasR2(r)
        if (r2k) {
          return {
            ...r,
            _img1: keyMap[r.checkin_image1_r2] || null,
            _img2: keyMap[r.checkin_image2_r2] || null,
            _img3: keyMap[r.checkout_image1_r2] || null,
            _img4: keyMap[r.checkout_image2_r2] || null,
          }
        }
        const old = base64Map[r.id] || {}
        return {
          ...r,
          _img1: old.checkin_image1 || null,
          _img2: old.checkin_image2 || null,
          _img3: old.checkout_image1 || null,
          _img4: old.checkout_image2 || null,
        }
      })
      const dateLabel = _lastReportDateFrom === _lastReportDateTo
        ? _lastReportDateFrom
        : `${_lastReportDateFrom} → ${_lastReportDateTo}`
      const html = buildPrintHTML(enriched, dateLabel, _lastReportProvince)

            // 4. Mở cửa sổ in (native print → Save as PDF của trình duyệt, nhanh hơn html2pdf)
      progress.update('Đang mở cửa sổ in...', 90)
      const win = window.open('', '_blank', 'width=900,height=700')
      if (!win) { progress.remove(); Toast.error('Trình duyệt đã chặn popup. Vui lòng cho phép.'); return }
      win.document.write(html)
      win.document.close()
      win.focus()

      progress.update('Hoàn tất!', 100)
      await new Promise(r => setTimeout(r, 400))
      progress.remove()
      Toast.success('Đã mở cửa sổ in. Chọn Save as PDF để lưu.')
      win.onload = () => setTimeout(() => win.print(), 500)
    } catch (e) {
      progress.remove()
      Toast.error('Lỗi khi tạo PDF: ' + e.message)
    } finally {
      btn.disabled = false
      btn.innerHTML = '<i class="fas fa-file-pdf mr-1"></i>Xuất PDF'
    }

  }
  function buildPrintHTML(records, date, province) {
    // ── Helpers ──────────────────────────────────────────────────
    const dateObj = new Date(date + 'T00:00:00+07:00')
    const dowMap  = ['CHỦ NHẬT','THỨ HAI','THỨ BA','THỨ TƯ','THỨ NĂM','THỨ SÁU','THỨ BẢY']
    const dow     = dowMap[dateObj.getDay()]
    const dd      = String(dateObj.getDate()).padStart(2,'0')
    const mm      = String(dateObj.getMonth()+1).padStart(2,'0')
    const yyyy    = dateObj.getFullYear()
    const dateVN  = `${dow}, NGÀY ${dd}/${mm}/${yyyy}`

    const totalSales     = records.reduce((s, r) => s + (parseInt(r.sales_quantity) || 0), 0)
    const totalStores    = records.length  // mỗi record = 1 lượt check-in tại 1 điểm bán
    const totalStaff     = new Set(records.map(r => r.username)).size

    const provinceLabel  = province || 'TẤT CẢ KHU VỰC'

    // Ô ảnh: nếu có src thì hiện ảnh, không thì hiện placeholder
    const photoBox = (src) => src
      ? `<img src="${src}" class="photo-img" />`
      : `<div class="photo-empty"></div>`

    // ── Slide 1: Trang bìa / Tổng hợp ──────────────────────────
    const slide1 = `
<div class="slide slide-cover">
  <div class="cover-body">
    <div class="cover-title">BÁO CÁO NGHIỆM THU</div>
    <div class="cover-sub">DỰ ÁN PST</div>
    <div class="cover-region">KHU VỰC: ${provinceLabel}</div>
    <div class="cover-date">${dateVN}</div>
    <table class="cover-table">
      <thead>
        <tr>
          <th>NHÂN VIÊN</th>
          <th>ĐIỂM BÁN</th>
          <th>TỔNG BÁN (GÓI)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${totalStaff}</td>
          <td>${totalStores}</td>
          <td>${totalSales}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="slide-num">1</div>
</div>`

    // ── Slides 2+: Mỗi check-in = 1 slide ──────────────────────
    // Đánh số thứ tự điểm bán liên tục, nhóm theo nhân viên
    let slideIdx = 2
    let storeSeq = 0   // số thứ tự điểm bán liên tục toàn báo cáo

    // Nhóm records theo nhân viên để lấy số thứ tự NV
    const staffOrder = []
    const staffMap   = {}
    records.forEach(r => {
      if (!staffMap[r.username]) {
        staffOrder.push(r.username)
        staffMap[r.username] = { seq: staffOrder.length, name: r.full_name, phone: r.username }
      }
    })

    const detailSlides = records.map(r => {
      storeSeq++
      const staffSeq = staffMap[r.username]?.seq || 0
      const ci1 = r._img1 || null
      const ci2 = r._img2 || null
      const co1 = r._img3 || null
      const co2 = r._img4 || null

      const html = `
<div class="slide slide-detail">
  <!-- Header nhân viên -->
  <div class="detail-seq-badge">${staffSeq}</div>
  <div class="detail-header">
    <div class="detail-name">${r.full_name}</div>
    <div class="detail-phone">${r.username}</div>
    <div class="detail-store">Điểm bán: <strong>${r.store_name || '--'}</strong>
      <span class="detail-store-num">${storeSeq}</span>
    </div>
    <div class="detail-addr">Địa chỉ: ${r.checkin_address || '--'}</div>
    ${r.sales_quantity != null ? `<div class="detail-sales">Tổng bán: <b>${r.sales_quantity} gói</b></div>` : ''}
    ${r.notes ? `<div class="detail-notes">Ghi chú: ${r.notes}</div>` : ''}
  </div>

  <!-- Ảnh check-in / check-out: 2x2 grid -->
  <div class="photo-grid">
    <div class="photo-cell">
      <div class="photo-label ci-label">CHECK IN</div>
      <div class="photo-wrap">${photoBox(ci1)}</div>
    </div>
    <div class="photo-cell">
      <div class="photo-label ci-label">CHECK IN</div>
      <div class="photo-wrap">${photoBox(ci2)}</div>
    </div>
    <div class="photo-cell">
      <div class="photo-label co-label">CHECK OUT</div>
      <div class="photo-wrap">${photoBox(co1)}</div>
    </div>
    <div class="photo-cell">
      <div class="photo-label co-label">CHECK OUT</div>
      <div class="photo-wrap">${photoBox(co2)}</div>
    </div>
  </div>

  <div class="slide-num">${slideIdx++}</div>
</div>`
      return html
    }).join('')

    // ── CSS ──────────────────────────────────────────────────────
    const css = `
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Segoe UI','Roboto','Noto Sans','Helvetica Neue',Arial,sans-serif;background:#e8e8e8;color:#1a1a1a;}

/* ── Slide container ── */
.slide{
  width:210mm; height:297mm;       /* A4 portrait */
  background:#fff;
  position:relative;
  overflow:hidden;
  margin:0 auto 8mm;
  page-break-after:always;
  break-after:page;
  box-shadow:0 2px 12px rgba(0,0,0,.15);
}

/* ══════════════════════════════════════════
   SLIDE 1 – Trang bìa
══════════════════════════════════════════ */
.slide-cover{
  display:flex;
  flex-direction:column;
  padding:14mm 16mm 12mm;
}
.cover-body{
  flex:1;
  display:flex;flex-direction:column;justify-content:flex-start;
}
.cover-title{
  font-size:22pt;font-weight:900;color:#C00000;
  line-height:1.1;margin-bottom:2mm;margin-top:8mm;
}
.cover-sub{font-size:22pt;font-weight:900;color:#C00000;line-height:1.1;margin-bottom:2mm;}
.cover-region{font-size:22pt;font-weight:900;color:#C00000;line-height:1.1;margin-bottom:2mm;}
.cover-date{font-size:22pt;font-weight:900;color:#C00000;line-height:1.1;margin-bottom:6mm;}

.cover-table{
  width:180mm;
  border-collapse:collapse;
  font-size:12pt;
}
.cover-table th{
  background:#C00000;color:#fff;
  padding:4mm 8mm;
  text-align:center;
  font-weight:700;
  border:1px solid #a00000;
}
.cover-table td{
  padding:5mm 8mm;
  text-align:center;
  font-size:16pt;
  font-weight:700;
  border:1px solid #ddd;
  background:#fff5f5;
}

/* ══════════════════════════════════════════
   SLIDE 2+ – Chi tiết check-in
══════════════════════════════════════════ */
.slide-detail{
  padding:5mm 7mm 5mm;
  display:flex;
  flex-direction:column;
  height:100%;
}
.detail-seq-badge{
  position:absolute;
  top:5mm;left:5mm;
  width:7mm;height:7mm;
  background:#C00000;color:#fff;
  border-radius:2px;
  display:flex;align-items:center;justify-content:center;
  font-size:10pt;font-weight:900;
}
.detail-header{
  margin-left:11mm;
  margin-bottom:3mm;
  flex-shrink:0;
}
.detail-name{font-size:11pt;font-weight:900;line-height:1.2;}
.detail-phone{font-size:9pt;font-weight:700;color:#333;line-height:1.3;}
.detail-store{font-size:9pt;font-weight:700;line-height:1.3;display:flex;align-items:center;gap:4px;}
.detail-store-num{
  display:inline-flex;align-items:center;justify-content:center;
  width:5mm;height:5mm;background:#C00000;color:#fff;
  border-radius:50%;font-size:7pt;font-weight:800;margin-left:2mm;
}
.detail-addr{font-size:8pt;color:#444;line-height:1.3;}
.detail-sales{font-size:8pt;color:#c0392b;margin-top:1mm;line-height:1.4;}
.detail-notes{font-size:8pt;color:#6b7280;line-height:1.4;}

/* ── 2x2 photo grid ── */
.photo-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  grid-template-rows:1fr 1fr;
  gap:3mm;
  flex:1;
  min-height:0;
  margin-top:2mm;
}
.photo-cell{
  display:flex;
  flex-direction:column;
  min-height:0;
  overflow:hidden;
}
.photo-label{
  font-size:7pt;font-weight:800;
  padding:0.5mm 2mm;
  text-transform:uppercase;
  letter-spacing:.3px;
  flex-shrink:0;
}
.ci-label{ color:#C00000; }
.co-label{ color:#C00000; }

.photo-wrap{
  flex:1;
  min-height:0;
  overflow:hidden;
  border-radius:3px;
  background:#f9f9f9;
}
.photo-wrap .photo-img{
  width:100%;height:100%;
  object-fit:contain;
  border-radius:3px;
  border:1px solid #eee;
  display:block;
}
.photo-wrap .photo-empty{
  width:100%;height:100%;
  background:#f5f5f5;
  border:1.5px dashed #ccc;
  border-radius:3px;
}

/* ── Page number ── */
.slide-num{
  position:absolute;
  bottom:3mm;right:5mm;
  font-size:7pt;color:#888;
}

/* ── Print ── */
@media print{
  body{background:#fff;}
  @page{
    size:210mm 297mm;
    margin:0;
  }
  .slide{
    width:210mm;height:297mm;
    margin:0;
    box-shadow:none;
    page-break-after:always;
    break-after:page;
  }
}`

    return `<!DOCTYPE html><html lang="vi"><head>
<meta charset="UTF-8">
<title>Báo cáo nghiệm thu PST – ${dateVN}${province ? ' – ' + province : ''}</title>
<style>${css}</style>
</head><body>
${slide1}
${detailSlides || '<div style="text-align:center;padding:40px;color:#aaa;">Không có dữ liệu</div>'}
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
          <div><label class="block text-sm text-gray-600 mb-1">Số điện thoại <span class="text-xs text-gray-400">(dùng để đăng nhập)</span></label>
            <input type="tel" name="username" required placeholder="VD: 0901234567" inputmode="tel"
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
          <div><label class="block text-sm text-gray-600 mb-1">Ngày nhận việc <span class="text-xs text-gray-400">(không bắt buộc)</span></label>
            <input type="date" name="start_date"
              class="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500" /></div>
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

  // ── Sửa thông tin nhân viên ────────────────────
  async function showEditUser(userId) {
    try {
      const res = await API.getUserProfile(userId)
      const u = res.data
      if (!u) { Toast.error('Không tìm thấy nhân viên'); return }

      const opts = _activeProvinces.map(p =>
        `<option value="${p.name}" ${p.name === (u.province || '') ? 'selected' : ''}>${p.name}</option>`
      ).join('')

      const { overlay, close } = Modal.create(`
        <div class="p-5 max-h-[80vh] overflow-y-auto">
          <h3 class="text-lg font-bold text-gray-800 mb-1">
            <i class="fas fa-user-edit mr-2 text-blue-600"></i>Sửa thông tin nhân viên
          </h3>
          <p class="text-xs text-gray-400 mb-4">
            <span class="font-mono">@${u.username || ''}</span>
            <span class="ml-2 px-1.5 py-0.5 rounded text-xs ${u.account_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}">
              ${u.account_status === 'pending' ? 'Chờ kích hoạt' : 'Đang làm việc'}
            </span>
          </p>
          <form id="edit-user-form" class="space-y-3">
            <!-- Thông tin cơ bản -->
            <div class="bg-gray-50 rounded-xl p-3 space-y-2.5">
              <p class="text-xs font-bold text-gray-500 uppercase tracking-wide">
                <i class="fas fa-user mr-1"></i>Thông tin cơ bản
              </p>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1">Họ và tên <span class="text-red-500">*</span></label>
                <input type="text" name="full_name" value="${u.full_name || ''}" required
                  class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1">Số điện thoại</label>
                <input type="tel" name="phone" value="${u.phone || ''}" placeholder="VD: 0901234567"
                  class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1">Tỉnh/Thành làm việc</label>
                <div class="relative">
                  <select name="province"
                    class="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none">
                    <option value="">-- Chưa phân công --</option>
                    ${opts}
                  </select>
                  <i class="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1">Ngày nhận việc</label>
                <input type="date" name="start_date" value="${u.start_date || ''}"
                  class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>

            <!-- CCCD -->
            <div class="bg-gray-50 rounded-xl p-3 space-y-2.5">
              <p class="text-xs font-bold text-gray-500 uppercase tracking-wide">
                <i class="fas fa-id-card mr-1"></i>CMND/CCCD
              </p>
              <div class="grid grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">Số CCCD</label>
                  <input type="text" name="cccd_number" value="${u.cccd_number || ''}"
                    class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">Họ tên trên CCCD</label>
                  <input type="text" name="cccd_full_name" value="${u.cccd_full_name || ''}"
                    class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">Ngày sinh</label>
                  <input type="date" name="cccd_dob" value="${u.cccd_dob || ''}"
                    class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">Giới tính</label>
                  <select name="cccd_gender"
                    class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="">-- Chọn --</option>
                    <option value="Nam" ${u.cccd_gender === 'Nam' ? 'selected' : ''}>Nam</option>
                    <option value="Nữ" ${u.cccd_gender === 'Nữ' ? 'selected' : ''}>Nữ</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1">Địa chỉ thường trú</label>
                <input type="text" name="cccd_address" value="${u.cccd_address || ''}"
                  class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div class="grid grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">Ngày cấp</label>
                  <input type="date" name="cccd_issue_date" value="${u.cccd_issue_date || ''}"
                    class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">Ngày hết hạn</label>
                  <input type="date" name="cccd_expiry_date" value="${u.cccd_expiry_date || ''}"
                    class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1">Nơi cấp</label>
                <input type="text" name="cccd_issue_place" value="${u.cccd_issue_place || ''}"
                  class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>

            <!-- Ngân hàng -->
            <div class="bg-gray-50 rounded-xl p-3 space-y-2.5">
              <p class="text-xs font-bold text-gray-500 uppercase tracking-wide">
                <i class="fas fa-university mr-1"></i>Thông tin ngân hàng
              </p>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1">Tên ngân hàng</label>
                <input type="text" name="bank_name" value="${u.bank_name || ''}"
                  class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1">Số tài khoản</label>
                <input type="text" name="bank_account_number" value="${u.bank_account_number || ''}"
                  class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1">Chủ tài khoản</label>
                <input type="text" name="bank_account_name" value="${u.bank_account_name || ''}"
                  class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>

            <p id="edit-user-error" class="text-red-500 text-sm hidden"></p>
            <div class="flex gap-3 pt-1">
              <button type="button" id="edit-user-cancel" class="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium">Hủy</button>
              <button type="submit" class="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold">
                <i class="fas fa-save mr-1"></i>Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      `)

      document.getElementById('edit-user-cancel').onclick = close
      document.getElementById('edit-user-form').onsubmit = async (e) => {
        e.preventDefault()
        const fd = new FormData(e.target)
        const data = Object.fromEntries(fd.entries())
        // Loại bỏ các trường rỗng để không ghi đè dữ liệu cũ bằng chuỗi rỗng
        // Trừ các trường có thể xóa (để trống để xóa)
        const cleaned = {}
        for (const [k, v] of Object.entries(data)) {
          if (v !== '') {
            cleaned[k] = v
          } else {
            // Với các trường có thể xóa, gửi null để backend COALESCE không làm gì
            // nhưng với các trường có thể muốn xóa, ta gửi chuỗi rỗng
            cleaned[k] = null
          }
        }
        // Luôn gửi full_name
        if (!cleaned.full_name || !cleaned.full_name.trim()) {
          document.getElementById('edit-user-error').textContent = 'Vui lòng nhập họ và tên'
          document.getElementById('edit-user-error').classList.remove('hidden')
          return
        }

        try {
          await API.updateUser(userId, cleaned)
          Toast.success('Cập nhật thông tin thành công')
          close()
          const prov = document.getElementById('staff-province-filter')?.value || ''
          const search = document.getElementById('staff-search-input')?.value || ''
          await loadUsers(prov, search)
        } catch (err) {
          document.getElementById('edit-user-error').textContent = err.message
          document.getElementById('edit-user-error').classList.remove('hidden')
        }
      }
    } catch (e) {
      Toast.error(e.message || 'Không tải được thông tin nhân viên')
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
      const imgSrc = (r2k, b64) => API.imageUrl(r2k || b64)
      const imgRow = (label, r2k, b64) => {
        const src = imgSrc(r2k, b64)
        return src
        ? `<div><p class="text-xs text-gray-500 mb-1">${label}</p>
             <img src="${src}" class="w-full rounded-lg cursor-pointer" onclick="Modal.image(this.src)" /></div>`
        : ''
      }
      Modal.create(`
        <div class="p-5">
          <h3 class="text-lg font-bold text-gray-800 mb-1">${r.full_name}</h3>
          <p class="text-xs text-gray-400 font-mono mb-0.5">${r.username || ''}</p>
          <p class="text-sm text-gray-500 mb-1">${r.date}</p>
          ${r.store_name ? `<p class="text-xs text-orange-600 mb-1"><i class="fas fa-store mr-1"></i>${r.store_name}</p>` : ''}
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
              ${imgRow('Check-in 1',r.checkin_image1_r2,r.checkin_image1)}${imgRow('Check-in 2',r.checkin_image2_r2,r.checkin_image2)}
            </div>
            <div class="grid grid-cols-2 gap-2">
              ${imgRow('Check-out 1',r.checkout_image1_r2,r.checkout_image1)}${imgRow('Check-out 2',r.checkout_image2_r2,r.checkout_image2)}
            </div>
          </div>
        </div>
      `)
    } catch { Toast.error('Không tải được chi tiết') }
  }

  // ── bindEvents ────────────────────────────────
  async function bindEvents() {
    // Tab switching
    document.querySelectorAll('.admin-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(b => {
          b.classList.remove('bg-red-600','bg-gradient-to-b','from-red-600','to-red-700','text-white')
          b.classList.add('text-gray-500')
        })
        btn.classList.add('bg-red-600','text-white')
        btn.classList.remove('text-gray-500','text-indigo-600','text-emerald-600','text-blue-600')

        ;['staff','provinces','reports','products'].forEach(t => {
          document.getElementById(`admin-tab-${t}`)?.classList.add('hidden')
        })
        document.getElementById(`admin-tab-${btn.dataset.tab}`)?.classList.remove('hidden')

        // Lazy-load tabs
        if (btn.dataset.tab === 'provinces') loadProvincesTab()
        if (btn.dataset.tab === 'products') loadProductsTab()
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

    // Sản phẩm / Quà tặng buttons
    document.getElementById('btn-add-product').onclick = () => showAddProductModal()
    document.getElementById('btn-add-gift').onclick = () => showAddGiftModal()

    // Filter NV theo tỉnh + tìm kiếm
    const doFilterStaff = () => {
      const prov   = document.getElementById('staff-province-filter')?.value || ''
      const search = document.getElementById('staff-search-input')?.value || ''
      loadUsers(prov, search)
    }
    document.getElementById('btn-filter-staff').onclick = doFilterStaff
    // Enter key in search input
    document.getElementById('staff-search-input')?.addEventListener('keypress', e => {
      if (e.key === 'Enter') doFilterStaff()
    })

    // Xuất Excel nhân viên
    document.getElementById('btn-export-excel-staff').onclick = exportStaffExcel

    // Ngày báo cáo mặc định = hôm nay VN
    const today = APP_CONFIG.todayVN()
    const dateFromEl = document.getElementById('report-date-from')
    const dateToEl   = document.getElementById('report-date-to')
    if (dateFromEl) dateFromEl.value = today
    if (dateToEl) dateToEl.value = today

    // Load báo cáo
    document.getElementById('btn-load-report').onclick = () => {
      const dateFrom  = document.getElementById('report-date-from')?.value || ''
      const dateTo    = document.getElementById('report-date-to')?.value || ''
      const prov      = document.getElementById('report-province-filter')?.value || ''
      const staffCode = document.getElementById('report-staff-code')?.value || ''
      if (dateFrom || dateTo) loadReport(dateFrom, dateTo, prov, staffCode)
    }

    // Xuất Excel báo cáo (xem trước & chỉnh sửa)
    document.getElementById('btn-export-excel-report').onclick = showReportPreviewModal

    // Xuất PDF
    document.getElementById('btn-export-pdf').onclick = exportPDF

    // Load tỉnh active → populate dropdowns → rồi load NV
    await loadActiveProvinces()
    await loadUsers()
  }

  // ── Tab Sản phẩm & Quà tặng ────────────────
  async function loadProductsTab() {
    await Promise.all([loadProductsList(), loadGiftsList()])
  }

  async function loadProductsList() {
    const listEl = document.getElementById('products-list')
    if (!listEl) return
    try {
      const res = await API.getAdminProducts()
      const products = res.data || []
      if (products.length === 0) {
        listEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Chưa có sản phẩm nào</p>'
        return
      }
      listEl.innerHTML = products.map(p => {
        const safeId = p.id
        return `
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-2 border border-gray-100">
          <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <i class="fas fa-wine-bottle text-blue-500 text-xs"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm text-gray-800 truncate">${p.name}</p>
            <p class="text-xs text-gray-400">${p.unit || 'Chưa có đơn vị'} &middot; Thứ tự: ${p.sort_order || 0}
              &middot; <span class="${p.is_active ? 'text-green-500' : 'text-red-500'}">${p.is_active ? 'Hoạt động' : 'Tắt'}</span>
            </p>
          </div>
          <div class="flex gap-1.5 flex-shrink-0">
            <button data-action="edit-product" data-id="${safeId}"
              class="w-8 h-8 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs">
              <i class="fas fa-edit"></i>
            </button>
            <button data-action="del-product" data-id="${safeId}"
              class="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-xs">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>`
      }).join('')

      // Bind click events (store data in JS, not in HTML attrs)
      const _prodData = {}
      products.forEach(p => { _prodData[p.id] = p })
      listEl.querySelectorAll('[data-action="edit-product"]').forEach(btn => {
        btn.onclick = () => {
          const p = _prodData[btn.dataset.id]
          if (p) showAddProductModal(p)
        }
      })
      listEl.querySelectorAll('[data-action="del-product"]').forEach(btn => {
        btn.onclick = () => deleteProduct(btn.dataset.id)
      })
    } catch (e) {
      listEl.innerHTML = `<p class="text-red-400 text-sm text-center py-4">${e.message}</p>`
    }
  }

  async function loadGiftsList() {
    const listEl = document.getElementById('gifts-list')
    if (!listEl) return
    try {
      const res = await API.getAdminGifts()
      const gifts = res.data || []
      if (gifts.length === 0) {
        listEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Chưa có quà tặng nào</p>'
        return
      }
      listEl.innerHTML = gifts.map(g => {
        const safeId = g.id
        return `
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-2 border border-amber-100">
          <div class="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <i class="fas fa-gift text-amber-500 text-xs"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm text-gray-800 truncate">${g.name}</p>
            <p class="text-xs text-gray-400">${g.unit || 'Chưa có đơn vị'} &middot; Thứ tự: ${g.sort_order || 0}
              &middot; <span class="${g.is_active ? 'text-green-500' : 'text-red-500'}">${g.is_active ? 'Hoạt động' : 'Tắt'}</span>
            </p>
          </div>
          <div class="flex gap-1.5 flex-shrink-0">
            <button data-action="edit-gift" data-id="${safeId}"
              class="w-8 h-8 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-xs">
              <i class="fas fa-edit"></i>
            </button>
            <button data-action="del-gift" data-id="${safeId}"
              class="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-xs">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>`
      }).join('')

      const _giftData = {}
      gifts.forEach(g => { _giftData[g.id] = g })
      listEl.querySelectorAll('[data-action="edit-gift"]').forEach(btn => {
        btn.onclick = () => {
          const g = _giftData[btn.dataset.id]
          if (g) showAddGiftModal(g)
        }
      })
      listEl.querySelectorAll('[data-action="del-gift"]').forEach(btn => {
        btn.onclick = () => deleteGift(btn.dataset.id)
      })
    } catch (e) {
      listEl.innerHTML = `<p class="text-red-400 text-sm text-center py-4">${e.message}</p>`
    }
  }

  function showAddProductModal(data = {}) {
    const { close } = Modal.create(`
      <div class="p-5">
        <h3 class="text-base font-bold text-gray-800 mb-4">
          <i class="fas fa-box mr-2 text-blue-500"></i>${data.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
        </h3>
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">Tên sản phẩm <span class="text-red-500">*</span></label>
            <input type="text" id="prod-name" value="${data.name || ''}" placeholder="Ví dụ: White Horse 650ml"
              class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">Đơn vị</label>
            <input type="text" id="prod-unit" value="${data.unit || ''}" placeholder="Ví dụ: chai, thùng, lon..."
              class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">Thứ tự hiển thị</label>
            <input type="number" id="prod-order" value="${data.sort_order || 0}" min="0"
              class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>
        <p id="prod-err" class="text-red-500 text-xs mt-2 hidden"></p>
        <div class="flex gap-3 mt-4">
          <button id="prod-cancel" class="flex-1 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm">Hủy</button>
          <button id="prod-submit" class="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">
            ${data.id ? 'Cập nhật' : 'Thêm'}
          </button>
        </div>
      </div>
    `)
    document.getElementById('prod-cancel').onclick = close
    document.getElementById('prod-submit').onclick = async () => {
      const name = document.getElementById('prod-name').value.trim()
      const unit = document.getElementById('prod-unit').value.trim()
      const sort_order = parseInt(document.getElementById('prod-order').value) || 0
      const errEl = document.getElementById('prod-err')
      if (!name) { errEl.textContent = 'Vui lòng nhập tên sản phẩm'; errEl.classList.remove('hidden'); return }
      try {
        if (data.id) {
          await API.updateProduct(data.id, { name, unit, sort_order })
          Toast.success('Đã cập nhật sản phẩm')
        } else {
          await API.createProduct({ name, unit, sort_order })
          Toast.success('Đã thêm sản phẩm')
        }
        close()
        await loadProductsList()
      } catch (e) { errEl.textContent = e.message; errEl.classList.remove('hidden') }
    }
  }

  function showAddGiftModal(data = {}) {
    const { close } = Modal.create(`
      <div class="p-5">
        <h3 class="text-base font-bold text-gray-800 mb-4">
          <i class="fas fa-gift mr-2 text-amber-500"></i>${data.id ? 'Sửa quà tặng' : 'Thêm quà tặng mới'}
        </h3>
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">Tên quà tặng <span class="text-red-500">*</span></label>
            <input type="text" id="gift-name" value="${data.name || ''}" placeholder="Ví dụ: Bật lửa, Hộp diêm..."
              class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">Đơn vị</label>
            <input type="text" id="gift-unit" value="${data.unit || ''}" placeholder="Ví dụ: cái, hộp..."
              class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">Thứ tự hiển thị</label>
            <input type="number" id="gift-order" value="${data.sort_order || 0}" min="0"
              class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
        </div>
        <p id="gift-err" class="text-red-500 text-xs mt-2 hidden"></p>
        <div class="flex gap-3 mt-4">
          <button id="gift-cancel" class="flex-1 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm">Hủy</button>
          <button id="gift-submit" class="flex-1 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold">
            ${data.id ? 'Cập nhật' : 'Thêm'}
          </button>
        </div>
      </div>
    `)
    document.getElementById('gift-cancel').onclick = close
    document.getElementById('gift-submit').onclick = async () => {
      const name = document.getElementById('gift-name').value.trim()
      const unit = document.getElementById('gift-unit').value.trim()
      const sort_order = parseInt(document.getElementById('gift-order').value) || 0
      const errEl = document.getElementById('gift-err')
      if (!name) { errEl.textContent = 'Vui lòng nhập tên quà tặng'; errEl.classList.remove('hidden'); return }
      try {
        if (data.id) {
          await API.updateGift(data.id, { name, unit, sort_order })
          Toast.success('Đã cập nhật quà tặng')
        } else {
          await API.createGift({ name, unit, sort_order })
          Toast.success('Đã thêm quà tặng')
        }
        close()
        await loadGiftsList()
      } catch (e) { errEl.textContent = e.message; errEl.classList.remove('hidden') }
    }
  }

  // Public methods cho onclick buttons
  function editProduct(id, name, unit, sort_order) {
    showAddProductModal({ id, name, unit, sort_order })
  }
  function deleteProduct(id) {
    Modal.confirm('Xóa sản phẩm', 'Bạn có chắc muốn xóa sản phẩm này?', async () => {
      try {
        await API.deleteProduct(id)
        Toast.success('Đã xóa sản phẩm')
        await loadProductsList()
      } catch (e) { Toast.error(e.message) }
    }, 'Xóa', true)
  }
  function editGift(id, name, unit, sort_order) {
    showAddGiftModal({ id, name, unit, sort_order })
  }
  function deleteGift(id) {
    Modal.confirm('Xóa quà tặng', 'Bạn có chắc muốn xóa quà tặng này?', async () => {
      try {
        await API.deleteGift(id)
        Toast.success('Đã xóa quà tặng')
        await loadGiftsList()
      } catch (e) { Toast.error(e.message) }
    }, 'Xóa', true)
  }

  return {
    renderPage, bindEvents,
    showResetPassword, setUserStatus, showCheckinDetail, showEditUser,
    confirmDeleteProvince,
    editProduct, deleteProduct,
    editGift, deleteGift,
  }
})()
