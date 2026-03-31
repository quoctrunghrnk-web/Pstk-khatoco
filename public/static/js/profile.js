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
    <div class="pb-24">
      <!-- Header -->
      <div class="bg-gradient-to-br from-blue-700 to-blue-900 text-white px-4 pt-12 pb-16 relative">
        <div class="flex items-center gap-3">
          <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
            <i class="fas fa-user text-2xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold">${user?.full_name || 'Nhân viên'}</h2>
            <p class="text-blue-200 text-sm">@${user?.username}</p>
            <span class="text-xs bg-white/20 px-2 py-0.5 rounded-full">${user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</span>
          </div>
        </div>
      </div>

      <!-- Content cards -->
      <div class="px-4 -mt-8 space-y-4">

        <!-- Loading skeleton -->
        <div id="profile-loading" class="bg-white rounded-2xl p-4 shadow flex items-center justify-center h-32">
          <i class="fas fa-spinner fa-spin text-blue-500 text-2xl"></i>
        </div>

        <!-- Profile content (hidden until loaded) -->
        <div id="profile-content" class="hidden space-y-4">

          <!-- CCCD -->
          <!-- Tỉnh/thành làm việc -->
          <div id="province-card" class="bg-white rounded-2xl shadow overflow-hidden">
            <div class="bg-indigo-50 px-4 py-3 flex items-center justify-between">
              <h3 class="font-semibold text-indigo-800 flex items-center gap-2">
                <i class="fas fa-map-marker-alt"></i> Khu vực làm việc
              </h3>
              <button id="btn-edit-province" class="text-indigo-600 text-sm font-medium">
                <i class="fas fa-edit"></i> Sửa
              </button>
            </div>
            <div id="province-info" class="p-4"></div>
          </div>

          <div class="bg-white rounded-2xl shadow overflow-hidden">
            <div class="bg-blue-50 px-4 py-3 flex items-center justify-between">
              <h3 class="font-semibold text-blue-800 flex items-center gap-2">
                <i class="fas fa-id-card"></i> Thông tin CCCD
              </h3>
              <button id="btn-edit-cccd" class="text-blue-600 text-sm font-medium">
                <i class="fas fa-edit"></i> Sửa
              </button>
            </div>
            <div id="cccd-info" class="p-4 space-y-2"></div>

            <!-- Ảnh CCCD -->
            <div class="px-4 pb-4">
              <p class="text-sm font-medium text-gray-600 mb-2">Ảnh CCCD</p>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-xs text-gray-500 mb-1 text-center">Mặt trước</p>
                  <div id="cccd-front-preview" class="aspect-[1.6] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                    <div class="text-center text-gray-400">
                      <i class="fas fa-camera text-xl mb-1"></i>
                      <p class="text-xs">Chụp/Chọn ảnh</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p class="text-xs text-gray-500 mb-1 text-center">Mặt sau</p>
                  <div id="cccd-back-preview" class="aspect-[1.6] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                    <div class="text-center text-gray-400">
                      <i class="fas fa-camera text-xl mb-1"></i>
                      <p class="text-xs">Chụp/Chọn ảnh</p>
                    </div>
                  </div>
                </div>
              </div>
              <button id="btn-upload-cccd" class="w-full mt-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hidden">
                <i class="fas fa-upload mr-1"></i> Lưu ảnh CCCD
              </button>
            </div>
          </div>

          <!-- Ngân hàng -->
          <div class="bg-white rounded-2xl shadow overflow-hidden">
            <div class="bg-green-50 px-4 py-3 flex items-center justify-between">
              <h3 class="font-semibold text-green-800 flex items-center gap-2">
                <i class="fas fa-university"></i> Thông tin ngân hàng
              </h3>
              <button id="btn-edit-bank" class="text-green-600 text-sm font-medium">
                <i class="fas fa-edit"></i> Sửa
              </button>
            </div>
            <div id="bank-info" class="p-4 space-y-2"></div>
          </div>

          <!-- Bảo mật -->
          <div class="bg-white rounded-2xl shadow overflow-hidden">
            <div class="px-4 py-3 bg-gray-50">
              <h3 class="font-semibold text-gray-800 flex items-center gap-2">
                <i class="fas fa-shield-alt"></i> Bảo mật
              </h3>
            </div>
            <div class="p-4 space-y-3">
              <button id="btn-change-password" class="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <span class="text-sm font-medium text-gray-700"><i class="fas fa-key mr-2 text-gray-500"></i>Đổi mật khẩu</span>
                <i class="fas fa-chevron-right text-gray-400 text-xs"></i>
              </button>
              <button id="btn-logout" class="w-full flex items-center justify-between p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                <span class="text-sm font-medium text-red-600"><i class="fas fa-sign-out-alt mr-2"></i>Đăng xuất</span>
                <i class="fas fa-chevron-right text-red-300 text-xs"></i>
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
    <div class="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span class="text-gray-500 text-sm w-32 flex-shrink-0">${label}</span>
      <span class="text-gray-800 text-sm font-medium flex-1 break-all">${value || '<span class="text-gray-300">Chưa cập nhật</span>'}</span>
    </div>`
  }

  function populateProfileUI(data) {
    if (!data) return

    // Province info
    const provinceEl = document.getElementById('province-info')
    if (provinceEl) {
      provinceEl.innerHTML = data.province
        ? `<div class="flex items-center gap-2">
             <i class="fas fa-map-marker-alt text-indigo-500"></i>
             <span class="text-gray-800 font-medium">${data.province}</span>
           </div>`
        : `<p class="text-gray-400 text-sm italic">Chưa cập nhật tỉnh/thành phố</p>`
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
