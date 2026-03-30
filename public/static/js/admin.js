// =============================================
// Module: Admin Panel (Chỉ admin)
// Quản lý nhân viên + xem báo cáo check-in
// =============================================
window.AdminModule = (() => {

  function formatTime(isoStr) {
    if (!isoStr) return '--'
    try {
      return new Date(isoStr).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })
    } catch { return '--' }
  }

  function renderPage() {
    return `
    <div class="pb-24">
      <div class="bg-gradient-to-br from-red-700 to-red-900 text-white px-4 pt-12 pb-20">
        <h2 class="text-xl font-bold mb-1"><i class="fas fa-shield-alt mr-2"></i>Quản trị viên</h2>
        <p class="text-red-200 text-sm">Quản lý nhân viên và theo dõi hoạt động</p>
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
        <div id="users-list">
          <div class="flex justify-center py-8"><i class="fas fa-spinner fa-spin text-red-400 text-2xl"></i></div>
        </div>
      </div>

      <!-- Tab: Báo cáo -->
      <div id="admin-tab-reports" class="px-4 space-y-3 hidden">
        <!-- Filter -->
        <div class="bg-white rounded-2xl shadow p-4">
          <div class="flex gap-2 items-end">
            <div class="flex-1">
              <label class="block text-sm text-gray-600 mb-1">Chọn ngày</label>
              <input type="date" id="report-date" class="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <button id="btn-load-report" class="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium">
              <i class="fas fa-search"></i>
            </button>
          </div>
        </div>
        <div id="report-list">
          <p class="text-center text-gray-400 text-sm py-8">Chọn ngày để xem báo cáo</p>
        </div>
      </div>
    </div>
    `
  }

  async function loadUsers() {
    const el = document.getElementById('users-list')
    try {
      const res = await API.getUsers()
      const users = res.data || []
      if (users.length === 0) {
        el.innerHTML = '<p class="text-center text-gray-400 py-8">Chưa có nhân viên</p>'; return
      }
      el.innerHTML = users.map(u => `
        <div class="bg-white rounded-2xl shadow p-4 flex items-center gap-3">
          <div class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}">
            <i class="fas fa-user"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-800">${u.full_name}</p>
            <p class="text-sm text-gray-500">@${u.username}</p>
            <div class="flex gap-2 mt-1">
              <span class="text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}">${u.role === 'admin' ? 'Admin' : 'NV'}</span>
              <span class="text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">${u.is_active ? 'Hoạt động' : 'Vô hiệu'}</span>
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <button onclick="AdminModule.showResetPassword(${u.id}, '${u.full_name}')" class="p-2 text-yellow-600 bg-yellow-50 rounded-lg hover:bg-yellow-100" title="Reset mật khẩu">
              <i class="fas fa-key text-sm"></i>
            </button>
            <button onclick="AdminModule.toggleUser(${u.id}, ${u.is_active})" class="p-2 ${u.is_active ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-green-600 bg-green-50 hover:bg-green-100'} rounded-lg" title="${u.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}">
              <i class="fas ${u.is_active ? 'fa-ban' : 'fa-check'} text-sm"></i>
            </button>
          </div>
        </div>
      `).join('')
    } catch (e) {
      el.innerHTML = `<p class="text-center text-red-400 py-8">${e.message}</p>`
    }
  }

  async function loadReport(date) {
    const el = document.getElementById('report-list')
    el.innerHTML = '<div class="flex justify-center py-8"><i class="fas fa-spinner fa-spin text-red-400 text-2xl"></i></div>'
    try {
      const res = await API.getAdminCheckins(date)
      const records = res.data || []
      if (records.length === 0) {
        el.innerHTML = '<p class="text-center text-gray-400 py-8">Không có dữ liệu ngày này</p>'; return
      }
      el.innerHTML = records.map(r => `
        <div class="bg-white rounded-2xl shadow p-4 cursor-pointer hover:shadow-md transition-shadow" onclick="AdminModule.showCheckinDetail(${r.id})">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <i class="fas fa-user text-blue-600"></i>
            </div>
            <div class="flex-1">
              <p class="font-semibold text-gray-800">${r.full_name}</p>
              <p class="text-xs text-gray-500">@${r.username}</p>
            </div>
            <span class="text-xs px-2 py-1 rounded-full ${r.status === 'checkout' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
              ${r.status === 'checkout' ? 'Hoàn thành' : 'Đang làm'}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-2">
            <span><i class="fas fa-sign-in-alt mr-1 text-blue-400"></i>CI: ${formatTime(r.checkin_time)}</span>
            <span><i class="fas fa-sign-out-alt mr-1 text-purple-400"></i>CO: ${formatTime(r.checkout_time)}</span>
            ${r.sales_quantity ? `<span class="col-span-2"><i class="fas fa-box mr-1 text-green-400"></i>Bán: <b>${r.sales_quantity}</b> SP</span>` : ''}
          </div>
        </div>
      `).join('')
    } catch (e) {
      el.innerHTML = `<p class="text-center text-red-400 py-8">${e.message}</p>`
    }
  }

  function showAddUserModal() {
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

  function showResetPassword(userId, name) {
    const { overlay, close } = Modal.create(`
      <div class="p-5">
        <h3 class="text-lg font-bold text-gray-800 mb-2"><i class="fas fa-key mr-2 text-yellow-500"></i>Reset mật khẩu</h3>
        <p class="text-sm text-gray-500 mb-4">Nhân viên: <b>${name}</b></p>
        <input type="password" id="reset-pw-input" placeholder="Mật khẩu mới" class="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-500 mb-4" />
        <div class="flex gap-3">
          <button id="reset-pw-cancel" class="flex-1 py-2 border rounded-xl text-gray-700">Hủy</button>
          <button id="reset-pw-confirm" class="flex-1 py-2 bg-yellow-500 text-white rounded-xl font-medium">Đặt lại</button>
        </div>
      </div>
    `)
    document.getElementById('reset-pw-cancel').onclick = close
    document.getElementById('reset-pw-confirm').onclick = async () => {
      const pw = document.getElementById('reset-pw-input').value
      if (!pw || pw.length < 6) { Toast.warning('Mật khẩu ít nhất 6 ký tự'); return }
      try {
        await API.resetPassword(userId, pw)
        Toast.success('Reset mật khẩu thành công')
        close()
      } catch (e) { Toast.error(e.message) }
    }
  }

  function toggleUser(userId, isActive) {
    const action = isActive ? 'vô hiệu hóa' : 'kích hoạt'
    Modal.confirm(`Xác nhận`, `Bạn muốn ${action} tài khoản này?`, async () => {
      try {
        await API.updateUser(userId, { is_active: isActive ? 0 : 1 })
        Toast.success(`Đã ${action} tài khoản`)
        await loadUsers()
      } catch (e) { Toast.error(e.message) }
    }, 'Xác nhận', isActive)
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
        <p class="text-sm text-gray-500 mb-4">${r.date}</p>
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
          ${r.sales_quantity ? `<p class="text-sm font-medium"><i class="fas fa-box mr-1 text-green-500"></i>Bán: ${r.sales_quantity} SP</p>` : ''}
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

    // Add user
    document.getElementById('btn-add-user').onclick = showAddUserModal

    // Report date
    const today = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
    document.getElementById('report-date').value = today

    document.getElementById('btn-load-report').onclick = () => {
      const date = document.getElementById('report-date').value
      if (date) loadReport(date)
    }

    // Auto-load
    loadUsers()
  }

  return { renderPage, bindEvents, showResetPassword, toggleUser, showCheckinDetail }
})()
