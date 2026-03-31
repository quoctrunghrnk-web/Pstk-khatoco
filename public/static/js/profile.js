// =============================================
// Module: Profile
// Xem và cập nhật thông tin cá nhân, CCCD, ngân hàng
// =============================================
window.ProfileModule = (() => {

  let _profileData = null
  let _activeProvinces = []  // cache danh sách tỉnh từ API

  async function loadProfile() {
    const res = await API.getProfile()
    _profileData = res.data
    return _profileData
  }

  function renderPage() {
    const user = Auth.getUser()
    return `
    <div class="pb-24 bg-gradient-to-b from-blue-50 to-gray-50 min-h-screen">
      <!-- Header -->
      <div class="bg-white border-b border-gray-100 shadow-sm px-4 sticky top-0 z-40 pt-safe-top">
        <div class="max-w-lg mx-auto flex items-center gap-3 h-14">
          <div class="w-10 h-10 bg-blue-50 border-2 border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <img src="https://nhankiet.vn/uploads/01_Logo/Logo%20khong%20nen.jpg" alt="NK"
              class="w-8 h-8 object-contain block" />
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-sm font-bold text-gray-800 truncate">${user?.full_name || 'Nhân viên'}</h2>
            <p class="text-gray-400 text-xs">@${user?.username} &nbsp;·&nbsp; <span class="text-blue-600 font-semibold">${user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</span></p>
          </div>
        </div>
      </div>
      <div class="h-1 bg-gradient-to-r from-blue-500 to-indigo-400"></div>

      <!-- Content cards -->
      <div class="px-4 mt-4 space-y-3 max-w-lg mx-auto">

        <div id="profile-loading" class="bg-white rounded-2xl p-4 shadow flex items-center justify-center h-32">
          <i class="fas fa-spinner fa-spin text-blue-500 text-2xl"></i>
        </div>

        <div id="profile-content" class="hidden space-y-3">

          <!-- Khu vực làm việc -->
          <div id="province-card" class="bg-white rounded-2xl shadow-md border border-indigo-50 overflow-hidden">
            <div class="bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-3 flex items-center justify-between">
              <h3 class="font-bold text-white flex items-center gap-2 text-sm">
                <i class="fas fa-map-marker-alt"></i> Khu vực làm việc
              </h3>
              <button id="btn-edit-province" class="text-white/80 hover:text-white text-xs font-medium bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition-colors">
                <i class="fas fa-edit mr-1"></i>Sửa
              </button>
            </div>
            <div id="province-info" class="p-4"></div>
          </div>

          <!-- CCCD -->
          <div class="bg-white rounded-2xl shadow-md border border-blue-50 overflow-hidden">
            <div class="bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 flex items-center justify-between">
              <h3 class="font-bold text-white flex items-center gap-2 text-sm">
                <i class="fas fa-id-card"></i> Thông tin CCCD
              </h3>
              <button id="btn-edit-cccd" class="text-white/80 hover:text-white text-xs font-medium bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition-colors">
                <i class="fas fa-edit mr-1"></i>Sửa
              </button>
            </div>
            <div id="cccd-info" class="p-4 space-y-2"></div>

            <!-- Ảnh CCCD -->
            <div class="px-4 pb-4">
              <p class="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
                <i class="fas fa-camera text-blue-400"></i>Ảnh CCCD
              </p>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-xs text-blue-500 font-medium mb-1 text-center">Mặt trước</p>
                  <div id="cccd-front-preview" class="aspect-[1.6] bg-blue-50 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors">
                    <div class="text-center text-blue-300">
                      <i class="fas fa-camera text-xl mb-1"></i>
                      <p class="text-xs">Chụp/Chọn ảnh</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p class="text-xs text-blue-500 font-medium mb-1 text-center">Mặt sau</p>
                  <div id="cccd-back-preview" class="aspect-[1.6] bg-blue-50 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors">
                    <div class="text-center text-blue-300">
                      <i class="fas fa-camera text-xl mb-1"></i>
                      <p class="text-xs">Chụp/Chọn ảnh</p>
                    </div>
                  </div>
                </div>
              </div>
              <button id="btn-upload-cccd" class="w-full mt-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-sm font-semibold hidden shadow-sm">
                <i class="fas fa-upload mr-1"></i> Lưu ảnh CCCD
              </button>
            </div>
          </div>

          <!-- Ngân hàng -->
          <div class="bg-white rounded-2xl shadow-md border border-emerald-50 overflow-hidden">
            <div class="bg-gradient-to-r from-emerald-500 to-green-500 px-4 py-3 flex items-center justify-between">
              <h3 class="font-bold text-white flex items-center gap-2 text-sm">
                <i class="fas fa-university"></i> Thông tin ngân hàng
              </h3>
              <button id="btn-edit-bank" class="text-white/80 hover:text-white text-xs font-medium bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition-colors">
                <i class="fas fa-edit mr-1"></i>Sửa
              </button>
            </div>
            <div id="bank-info" class="p-4 space-y-2"></div>
          </div>

          <!-- Bảo mật -->
          <div class="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div class="bg-gradient-to-r from-gray-600 to-gray-700 px-4 py-3">
              <h3 class="font-bold text-white flex items-center gap-2 text-sm">
                <i class="fas fa-shield-alt"></i> Bảo mật tài khoản
              </h3>
            </div>
            <div class="p-4 space-y-2.5">
              <button id="btn-change-password" class="w-full flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition-colors">
                <span class="text-sm font-semibold text-amber-700"><i class="fas fa-key mr-2 text-amber-500"></i>Đổi mật khẩu</span>
                <i class="fas fa-chevron-right text-amber-400 text-xs"></i>
              </button>
              <button id="btn-logout" class="w-full flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors">
                <span class="text-sm font-semibold text-red-600"><i class="fas fa-sign-out-alt mr-2"></i>Đăng xuất</span>
                <i class="fas fa-chevron-right text-red-400 text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    `
  }

  function renderInfoRow(label, value) {
    return `
    <div class="flex items-start gap-2 py-1.5 border-b border-blue-50 last:border-0">
      <span class="text-blue-400 text-xs font-semibold uppercase tracking-wide w-28 flex-shrink-0 mt-0.5">${label}</span>
      <span class="text-gray-800 text-sm font-medium flex-1 break-all">${value || '<span class="text-gray-300 italic text-xs">Chưa cập nhật</span>'}</span>
    </div>`
  }

  function populateProfileUI(data) {
    if (!data) return

    // Province info
    const provinceEl = document.getElementById('province-info')
    if (provinceEl) {
      provinceEl.innerHTML = data.province
        ? `<div class="flex items-center gap-3 bg-indigo-50 rounded-xl px-3 py-2.5 border border-indigo-100">
             <div class="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
               <i class="fas fa-map-marker-alt text-white text-sm"></i>
             </div>
             <span class="text-indigo-800 font-bold text-sm">${data.province}</span>
           </div>`
        : `<p class="text-gray-400 text-sm italic text-center py-2">Chưa cập nhật tỉnh/thành phố</p>`
    }

    // CCCD info
    document.getElementById('cccd-info').innerHTML = [
      renderInfoRow('Số CCCD', data.cccd_number),
      renderInfoRow('Họ và tên', data.cccd_full_name),
      renderInfoRow('Ngày sinh', data.cccd_dob),
      renderInfoRow('Giới tính', data.cccd_gender),
      renderInfoRow('Địa chỉ', data.cccd_address),
      renderInfoRow('Ngày cấp', data.cccd_issue_date),
      renderInfoRow('Ngày hết hạn', data.cccd_expiry_date),
      renderInfoRow('SĐT', data.phone),
    ].join('')

    // Bank info
    document.getElementById('bank-info').innerHTML = [
      renderInfoRow('Ngân hàng', data.bank_name),
      renderInfoRow('Số tài khoản', data.bank_account_number),
      renderInfoRow('Tên chủ TK', data.bank_account_name),
    ].join('')

    // CCCD images
    const frontEl = document.getElementById('cccd-front-preview')
    const backEl = document.getElementById('cccd-back-preview')
    if (data.cccd_front_image) {
      frontEl.innerHTML = `<img src="${data.cccd_front_image}" class="w-full h-full object-cover" />`
      frontEl.classList.remove('border-dashed')
    }
    if (data.cccd_back_image) {
      backEl.innerHTML = `<img src="${data.cccd_back_image}" class="w-full h-full object-cover" />`
      backEl.classList.remove('border-dashed')
    }
  }

  async function showEditProvinceModal(data) {
    // Luôn gọi API lấy danh sách mới nhất
    const { close } = Modal.create(`
      <div class="p-5">
        <h3 class="text-lg font-bold text-gray-800 mb-4">
          <i class="fas fa-map-marker-alt mr-2 text-indigo-600"></i>Khu vực làm việc
        </h3>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Tỉnh/Thành phố</label>
          <div class="relative">
            <select id="province-select"
              class="w-full pl-3 pr-8 py-2.5 border border-gray-300 rounded-xl text-sm
                     outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
              <option value="">Đang tải danh sách...</option>
            </select>
            <i class="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
          </div>
        </div>
        <p id="province-err" class="text-red-500 text-sm mb-3 hidden"></p>
        <div class="flex gap-3">
          <button id="province-cancel" class="flex-1 py-2.5 border rounded-xl text-gray-700">Hủy</button>
          <button id="province-save" class="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium">Lưu</button>
        </div>
      </div>
    `)

    // Load danh sách tỉnh sau khi modal mở
    try {
      const res = await API.getActiveProvinces()
      _activeProvinces = res.data || []
    } catch {
      _activeProvinces = []
    }
    const sel = document.getElementById('province-select')
    if (sel) {
      if (_activeProvinces.length === 0) {
        sel.innerHTML = '<option value="">Chưa có tỉnh/thành nào — liên hệ admin</option>'
      } else {
        sel.innerHTML =
          '<option value="">-- Chọn tỉnh/thành phố --</option>' +
          _activeProvinces.map(p =>
            `<option value="${p.name}" ${p.name === (data?.province || '') ? 'selected' : ''}>${p.name}</option>`
          ).join('')
      }
    }

    document.getElementById('province-cancel').onclick = close
    document.getElementById('province-save').onclick = async () => {
      const province = document.getElementById('province-select').value
      if (!province) {
        document.getElementById('province-err').textContent = 'Vui lòng chọn tỉnh/thành phố'
        document.getElementById('province-err').classList.remove('hidden')
        return
      }
      try {
        await API.updateProfile({ ..._profileData, province })
        Toast.success('Cập nhật khu vực thành công')
        close()
        await refreshProfile()
      } catch (e) {
        Toast.error(e.message)
      }
    }
  }

  function showEditCCCDModal(data) {
    const { overlay, close } = Modal.create(`
      <div class="p-5">
        <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-id-card mr-2 text-blue-600"></i>Cập nhật CCCD</h3>
        <form id="cccd-form" class="space-y-3">
          ${inputField('Số CCCD', 'cccd_number', data?.cccd_number, 'text')}
          ${inputField('Họ và tên (trên CCCD)', 'cccd_full_name', data?.cccd_full_name)}
          ${inputField('Ngày sinh', 'cccd_dob', data?.cccd_dob, 'date')}
          ${selectField('Giới tính', 'cccd_gender', data?.cccd_gender, ['Nam', 'Nữ', 'Khác'])}
          ${inputField('Địa chỉ thường trú', 'cccd_address', data?.cccd_address)}
          ${inputField('Ngày cấp', 'cccd_issue_date', data?.cccd_issue_date, 'date')}
          ${inputField('Ngày hết hạn', 'cccd_expiry_date', data?.cccd_expiry_date, 'date')}
          ${inputField('Số điện thoại', 'phone', data?.phone, 'tel')}
          <p id="cccd-form-error" class="text-red-500 text-sm hidden"></p>
          <div class="flex gap-3 pt-2">
            <button type="button" id="cccd-cancel" class="flex-1 py-2 border rounded-xl text-gray-700">Hủy</button>
            <button type="submit" class="flex-1 py-2 bg-blue-600 text-white rounded-xl font-medium">Lưu</button>
          </div>
        </form>
      </div>
    `, { persistent: false })

    document.getElementById('cccd-cancel').onclick = close
    document.getElementById('cccd-form').onsubmit = async (e) => {
      e.preventDefault()
      const fd = new FormData(e.target)
      const body = Object.fromEntries(fd.entries())
      // Gộp thêm bank data hiện tại
      const merged = { ..._profileData, ...body }
      try {
        await API.updateProfile(merged)
        Toast.success('Cập nhật thông tin thành công')
        close()
        await refreshProfile()
      } catch (err) {
        document.getElementById('cccd-form-error').textContent = err.message
        document.getElementById('cccd-form-error').classList.remove('hidden')
      }
    }
  }

  function showEditBankModal(data) {
    const { overlay, close } = Modal.create(`
      <div class="p-5">
        <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-university mr-2 text-green-600"></i>Cập nhật ngân hàng</h3>
        <form id="bank-form" class="space-y-3">
          ${inputField('Tên ngân hàng', 'bank_name', data?.bank_name)}
          ${inputField('Số tài khoản', 'bank_account_number', data?.bank_account_number)}
          ${inputField('Tên chủ tài khoản', 'bank_account_name', data?.bank_account_name)}
          <p id="bank-form-error" class="text-red-500 text-sm hidden"></p>
          <div class="flex gap-3 pt-2">
            <button type="button" id="bank-cancel" class="flex-1 py-2 border rounded-xl text-gray-700">Hủy</button>
            <button type="submit" class="flex-1 py-2 bg-green-600 text-white rounded-xl font-medium">Lưu</button>
          </div>
        </form>
      </div>
    `)
    document.getElementById('bank-cancel').onclick = close
    document.getElementById('bank-form').onsubmit = async (e) => {
      e.preventDefault()
      const fd = new FormData(e.target)
      const body = Object.fromEntries(fd.entries())
      const merged = { ..._profileData, ...body }
      try {
        await API.updateProfile(merged)
        Toast.success('Cập nhật ngân hàng thành công')
        close()
        await refreshProfile()
      } catch (err) {
        document.getElementById('bank-form-error').textContent = err.message
        document.getElementById('bank-form-error').classList.remove('hidden')
      }
    }
  }

  async function refreshProfile() {
    try {
      const data = await loadProfile()
      populateProfileUI(data)
    } catch {}
  }

  function inputField(label, name, value = '', type = 'text') {
    return `<div>
      <label class="block text-sm text-gray-600 mb-1">${label}</label>
      <input type="${type}" name="${name}" value="${value || ''}"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
    </div>`
  }
  function selectField(label, name, value = '', options = []) {
    const opts = options.map(o => `<option value="${o}" ${value === o ? 'selected' : ''}>${o}</option>`).join('')
    return `<div>
      <label class="block text-sm text-gray-600 mb-1">${label}</label>
      <select name="${name}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">-- Chọn --</option>${opts}
      </select>
    </div>`
  }

  async function bindEvents() {
    let pendingFront = null
    let pendingBack = null

    // Load data
    try {
      const data = await loadProfile()
      document.getElementById('profile-loading').classList.add('hidden')
      document.getElementById('profile-content').classList.remove('hidden')
      populateProfileUI(data)
    } catch (e) {
      document.getElementById('profile-loading').innerHTML = `<p class="text-red-500 text-sm">${e.message}</p>`
    }

    document.getElementById('btn-edit-province').onclick = () => showEditProvinceModal(_profileData)
    document.getElementById('btn-edit-cccd').onclick = () => showEditCCCDModal(_profileData)
    document.getElementById('btn-edit-bank').onclick = () => showEditBankModal(_profileData)
    document.getElementById('btn-change-password').onclick = () => Auth.showChangePasswordModal()
    document.getElementById('btn-logout').onclick = () => {
      Modal.confirm('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', () => Auth.logout(), 'Đăng xuất', true)
    }

    // CCCD image upload
    const frontEl = document.getElementById('cccd-front-preview')
    const backEl = document.getElementById('cccd-back-preview')
    const uploadBtn = document.getElementById('btn-upload-cccd')

    async function handleCCCDImageClick(side) {
      try {
        // CCCD ảnh: không cần GPS/watermark, chỉ resize + nén
        // Dùng processImage với geoInfo = null → watermark hiện "Chưa xác định"
        // Hoặc dùng capture(null, true) để bỏ qua watermark cho CCCD
        const base64 = await Camera.captureNoWatermark(true)
        if (side === 'front') {
          pendingFront = base64
          frontEl.innerHTML = `<img src="${base64}" class="w-full h-full object-cover" />`
          frontEl.classList.remove('border-dashed')
        } else {
          pendingBack = base64
          backEl.innerHTML = `<img src="${base64}" class="w-full h-full object-cover" />`
          backEl.classList.remove('border-dashed')
        }
        uploadBtn.classList.remove('hidden')
      } catch (e) {
        if (e.message !== 'cancelled') Toast.error(e.message)
      }
    }

    frontEl.onclick = () => handleCCCDImageClick('front')
    backEl.onclick = () => handleCCCDImageClick('back')

    uploadBtn.onclick = async () => {
      try {
        uploadBtn.disabled = true
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Đang lưu...'
        await API.uploadCCCD(pendingFront, pendingBack)
        Toast.success('Lưu ảnh CCCD thành công')
        uploadBtn.classList.add('hidden')
        pendingFront = null; pendingBack = null
      } catch (e) {
        Toast.error(e.message)
      } finally {
        uploadBtn.disabled = false
        uploadBtn.innerHTML = '<i class="fas fa-upload mr-1"></i> Lưu ảnh CCCD'
      }
    }
  }

  return { renderPage, bindEvents }
})()
