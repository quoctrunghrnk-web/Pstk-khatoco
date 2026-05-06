// =============================================
// Module: Profile
// Xem và cập nhật thông tin cá nhân, CCCD, ngân hàng, ngày nhận việc
// =============================================
window.ProfileModule = (() => {

  let _profileData = null
  let _activeProvinces = []

  async function loadProfile() {
    const res = await API.getProfile()
    _profileData = res.data
    return _profileData
  }

  // ── Kiểm tra hồ sơ đầy đủ ────────────────────
  // Trả về mảng các trường còn thiếu
  function getMissingFields(data) {
    if (!data) return ['Chưa tải được hồ sơ']
    const missing = []
    if (!data.province)              missing.push('Khu vực làm việc')
    if (!data.phone)                 missing.push('Số điện thoại')
    if (!data.cccd_number)           missing.push('Số CCCD')
    if (!data.cccd_full_name)        missing.push('Họ tên trên CCCD')
    if (!data.cccd_dob)              missing.push('Ngày sinh')
    if (!data.cccd_address)          missing.push('Địa chỉ thường trú')
    if (!data.cccd_issue_date)       missing.push('Ngày cấp CCCD')
    if (!data.cccd_issue_place)      missing.push('Nơi cấp CCCD')
    if (!data.bank_account_number)   missing.push('Số tài khoản ngân hàng')
    if (!data.bank_name)             missing.push('Tên ngân hàng')
    if (!data.bank_account_name)     missing.push('Chủ tài khoản')
    if (!data.start_date)            missing.push('Ngày nhận việc')
    return missing
  }

  // Hàm public để checkin.js gọi
  function isProfileComplete(data) {
    return getMissingFields(data || _profileData).length === 0
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

      <!-- Content -->
      <div class="px-4 mt-4 space-y-3 max-w-lg mx-auto">

        <div id="profile-loading" class="bg-white rounded-2xl p-4 shadow flex items-center justify-center h-32">
          <i class="fas fa-spinner fa-spin text-blue-500 text-2xl"></i>
        </div>

        <div id="profile-content" class="hidden space-y-3">

          <!-- ⚠️ Banner hồ sơ chưa đầy đủ -->
          <div id="profile-incomplete-banner" class="hidden bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 shadow-md text-white">
            <div class="flex items-start gap-3">
              <div class="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <i class="fas fa-exclamation-triangle text-lg"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-sm mb-1">⚠️ Hồ sơ chưa hoàn chỉnh</p>
                <p class="text-xs text-white/90 mb-2">Cần bổ sung đầy đủ thông tin để sử dụng chức năng Check-in:</p>
                <div id="missing-fields-list" class="space-y-1"></div>
              </div>
            </div>
          </div>

          <!-- Khu vực làm việc -->
          <div id="province-card" class="bg-white rounded-2xl shadow-md border border-indigo-50 overflow-hidden">
            <div class="bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-3 flex items-center justify-between">
              <h3 class="font-bold text-white flex items-center gap-2 text-sm">
                <i class="fas fa-map-marker-alt"></i> Khu vực làm việc
                <span id="province-status-icon"></span>
              </h3>
              <button id="btn-edit-province" class="text-white/80 hover:text-white text-xs font-medium bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition-colors">
                <i class="fas fa-edit mr-1"></i>Sửa
              </button>
            </div>
            <div id="province-info" class="p-4"></div>
          </div>

          <!-- Thông tin nhận việc -->
          <div class="bg-white rounded-2xl shadow-md border border-rose-50 overflow-hidden">
            <div class="bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-3 flex items-center justify-between">
              <h3 class="font-bold text-white flex items-center gap-2 text-sm">
                <i class="fas fa-briefcase"></i> Thông tin nhận việc
                <span id="work-status-icon"></span>
              </h3>
              <button id="btn-edit-work" class="text-white/80 hover:text-white text-xs font-medium bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition-colors">
                <i class="fas fa-edit mr-1"></i>Sửa
              </button>
            </div>
            <div id="work-info" class="p-4 space-y-2"></div>
          </div>

          <!-- CCCD -->
          <div class="bg-white rounded-2xl shadow-md border border-blue-50 overflow-hidden">
            <div class="bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 flex items-center justify-between">
              <h3 class="font-bold text-white flex items-center gap-2 text-sm">
                <i class="fas fa-id-card"></i> Thông tin CCCD / CMND
                <span id="cccd-status-icon"></span>
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
                <span id="bank-status-icon"></span>
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

  // ── Row hiển thị thông tin ────────────────────
  function renderInfoRow(label, value, required = false) {
    const isEmpty = !value
    const display = isEmpty
      ? `<span class="${required ? 'text-red-400 font-semibold' : 'text-gray-300 italic'} text-xs">${required ? '⚠ Chưa cập nhật (bắt buộc)' : 'Chưa cập nhật'}</span>`
      : `<span class="text-gray-800 text-sm font-medium flex-1 break-all">${value}</span>`
    return `
    <div class="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0">
      <span class="text-blue-400 text-xs font-semibold uppercase tracking-wide w-32 flex-shrink-0 mt-0.5">
        ${label}${required ? ' <span class="text-red-400">*</span>' : ''}
      </span>
      ${display}
    </div>`
  }

  // ── Cập nhật UI sau khi load data ─────────────
  function populateProfileUI(data) {
    if (!data) return

    // Status icons: ✅ nếu đủ, ⚠️ nếu thiếu
    const ok  = `<span class="ml-1 text-xs bg-green-400/30 text-green-100 px-1.5 py-0.5 rounded-full">✓ Đầy đủ</span>`
    const bad = `<span class="ml-1 text-xs bg-red-400/30 text-red-100 px-1.5 py-0.5 rounded-full">⚠ Chưa đủ</span>`

    // Province
    const provinceOk = !!data.province
    const provinceEl = document.getElementById('province-info')
    document.getElementById('province-status-icon').innerHTML = provinceOk ? ok : bad
    if (provinceEl) {
      provinceEl.innerHTML = data.province
        ? `<div class="flex items-center gap-3 bg-indigo-50 rounded-xl px-3 py-2.5 border border-indigo-100">
             <div class="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
               <i class="fas fa-map-marker-alt text-white text-sm"></i>
             </div>
             <span class="text-indigo-800 font-bold text-sm">${data.province}</span>
           </div>`
        : `<p class="text-red-400 text-sm font-semibold text-center py-2">⚠ Chưa cập nhật — bắt buộc để check-in</p>`
    }

    // Work info (ngày nhận việc + SĐT)
    const workOk = !!(data.start_date && data.phone)
    document.getElementById('work-status-icon').innerHTML = workOk ? ok : bad
    document.getElementById('work-info').innerHTML = [
      renderInfoRow('Họ và tên', data.full_name, false),
      renderInfoRow('Số điện thoại', data.phone, true),
      renderInfoRow('Ngày nhận việc', data.start_date ? formatDateVN(data.start_date) : '', true),
    ].join('')

    // CCCD info
    const cccdFields = [data.cccd_number, data.cccd_full_name, data.cccd_dob,
      data.cccd_address, data.cccd_issue_date, data.cccd_issue_place]
    const cccdOk = cccdFields.every(Boolean)
    document.getElementById('cccd-status-icon').innerHTML = cccdOk ? ok : bad
    document.getElementById('cccd-info').innerHTML = [
      renderInfoRow('Số CCCD', data.cccd_number, true),
      renderInfoRow('Họ và tên', data.cccd_full_name, true),
      renderInfoRow('Ngày sinh', data.cccd_dob ? formatDateVN(data.cccd_dob) : '', true),
      renderInfoRow('Giới tính', data.cccd_gender, false),
      renderInfoRow('Thường trú', data.cccd_address, true),
      renderInfoRow('Ngày cấp', data.cccd_issue_date ? formatDateVN(data.cccd_issue_date) : '', true),
      renderInfoRow('Nơi cấp', data.cccd_issue_place, true),
      renderInfoRow('Hết hạn', data.cccd_expiry_date ? formatDateVN(data.cccd_expiry_date) : '', false),
    ].join('')

    // Bank info
    const bankOk = !!(data.bank_account_number && data.bank_name && data.bank_account_name)
    document.getElementById('bank-status-icon').innerHTML = bankOk ? ok : bad
    document.getElementById('bank-info').innerHTML = [
      renderInfoRow('Ngân hàng', data.bank_name, true),
      renderInfoRow('Số tài khoản', data.bank_account_number, true),
      renderInfoRow('Chủ tài khoản', data.bank_account_name, true),
    ].join('')

    // CCCD images
    const frontEl = document.getElementById('cccd-front-preview')
    const backEl  = document.getElementById('cccd-back-preview')
    const frontSrc = API.imageUrl(data.cccd_front_image_r2 || data.cccd_front_image)
    const backSrc  = API.imageUrl(data.cccd_back_image_r2 || data.cccd_back_image)
    if (frontSrc) {
      frontEl.innerHTML = `<img src="${frontSrc}" class="w-full h-full object-cover" />`
      frontEl.classList.remove('border-dashed')
    }
    if (backSrc) {
      backEl.innerHTML = `<img src="${backSrc}" class="w-full h-full object-cover" />`
      backEl.classList.remove('border-dashed')
    }

    // Banner cảnh báo thiếu hồ sơ
    const missing = getMissingFields(data)
    const bannerEl = document.getElementById('profile-incomplete-banner')
    if (missing.length > 0) {
      bannerEl.classList.remove('hidden')
      document.getElementById('missing-fields-list').innerHTML = missing.map(f =>
        `<div class="flex items-center gap-1.5 text-xs text-white/95">
           <i class="fas fa-times-circle text-red-200 flex-shrink-0"></i>
           <span>${f}</span>
         </div>`
      ).join('')
    } else {
      bannerEl.classList.add('hidden')
    }
  }

  // ── Format date YYYY-MM-DD → DD/MM/YYYY ───────
  function formatDateVN(d) {
    if (!d) return ''
    const s = String(d).slice(0, 10)
    const [y, m, dd] = s.split('-')
    if (!y || !m || !dd) return d
    return `${dd}/${m}/${y}`
  }

  // ── Modal khu vực ─────────────────────────────
  async function showEditProvinceModal(data) {
    const { close } = Modal.create(`
      <div class="p-5">
        <h3 class="text-lg font-bold text-gray-800 mb-4">
          <i class="fas fa-map-marker-alt mr-2 text-indigo-600"></i>Khu vực làm việc
        </h3>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Tỉnh/Thành phố <span class="text-red-500">*</span>
          </label>
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
    try {
      const res = await API.getActiveProvinces()
      _activeProvinces = res.data || []
    } catch { _activeProvinces = [] }

    const sel = document.getElementById('province-select')
    if (sel) {
      sel.innerHTML = _activeProvinces.length === 0
        ? '<option value="">Chưa có tỉnh/thành — liên hệ admin</option>'
        : '<option value="">-- Chọn tỉnh/thành phố --</option>' +
          _activeProvinces.map(p =>
            `<option value="${p.name}" ${p.name === (data?.province || '') ? 'selected' : ''}>${p.name}</option>`
          ).join('')
    }
    document.getElementById('province-cancel').onclick = close
    document.getElementById('province-save').onclick = async () => {
      const province = document.getElementById('province-select').value
      const errEl = document.getElementById('province-err')
      if (!province) {
        errEl.textContent = 'Vui lòng chọn tỉnh/thành phố'
        errEl.classList.remove('hidden'); return
      }
      try {
        await API.updateProfile({ ..._profileData, province })
        Toast.success('Cập nhật khu vực thành công')
        close(); await refreshProfile()
      } catch (e) { Toast.error(e.message) }
    }
  }

  // ── Modal thông tin nhận việc ─────────────────
  function showEditWorkModal(data) {
    const { close } = Modal.create(`
      <div class="p-5">
        <h3 class="text-lg font-bold text-gray-800 mb-1">
          <i class="fas fa-briefcase mr-2 text-rose-600"></i>Thông tin nhận việc
        </h3>
        <p class="text-xs text-gray-400 mb-4">Thông tin bắt buộc để sử dụng chức năng check-in</p>
        <form id="work-form" class="space-y-3">
          ${inputField('Số điện thoại <span class="text-red-500">*</span>', 'phone', data?.phone, 'tel', 'VD: 0901234567')}
          ${inputField('Ngày nhận việc <span class="text-red-500">*</span>', 'start_date', data?.start_date, 'date')}
          <p id="work-form-error" class="text-red-500 text-sm hidden"></p>
          <div class="flex gap-3 pt-2">
            <button type="button" id="work-cancel" class="flex-1 py-2.5 border rounded-xl text-gray-700">Hủy</button>
            <button type="submit" class="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-semibold">Lưu</button>
          </div>
        </form>
      </div>
    `)
    document.getElementById('work-cancel').onclick = close
    document.getElementById('work-form').onsubmit = async (e) => {
      e.preventDefault()
      const fd   = new FormData(e.target)
      const body = Object.fromEntries(fd.entries())
      const errEl = document.getElementById('work-form-error')
      if (!body.phone)       { errEl.textContent = 'Vui lòng nhập số điện thoại'; errEl.classList.remove('hidden'); return }
      if (!body.start_date)  { errEl.textContent = 'Vui lòng chọn ngày nhận việc'; errEl.classList.remove('hidden'); return }
      try {
        await API.updateProfile({ ..._profileData, ...body })
        Toast.success('Lưu thông tin nhận việc thành công')
        close(); await refreshProfile()
      } catch (err) {
        errEl.textContent = err.message; errEl.classList.remove('hidden')
      }
    }
  }

  // ── Modal CCCD ────────────────────────────────
  function showEditCCCDModal(data) {
    const { close } = Modal.create(`
      <div class="p-5">
        <h3 class="text-lg font-bold text-gray-800 mb-1">
          <i class="fas fa-id-card mr-2 text-blue-600"></i>Cập nhật CCCD / CMND
        </h3>
        <p class="text-xs text-gray-400 mb-4">Điền đúng theo thông tin trên thẻ CCCD/CMND</p>
        <form id="cccd-form" class="space-y-3">
          ${inputField('Số CCCD <span class="text-red-500">*</span>', 'cccd_number', data?.cccd_number, 'text', '12 chữ số trên CCCD')}
          ${inputField('Họ và tên (trên CCCD) <span class="text-red-500">*</span>', 'cccd_full_name', data?.cccd_full_name, 'text', 'Đúng như trên thẻ')}
          ${inputField('Ngày tháng năm sinh <span class="text-red-500">*</span>', 'cccd_dob', data?.cccd_dob, 'date')}
          ${selectField('Giới tính', 'cccd_gender', data?.cccd_gender, ['Nam', 'Nữ', 'Khác'])}
          ${inputField('Địa chỉ thường trú <span class="text-red-500">*</span>', 'cccd_address', data?.cccd_address, 'text', 'Địa chỉ đăng ký thường trú')}
          ${inputField('Ngày cấp <span class="text-red-500">*</span>', 'cccd_issue_date', data?.cccd_issue_date, 'date')}
          ${inputField('Nơi cấp CCCD <span class="text-red-500">*</span>', 'cccd_issue_place', data?.cccd_issue_place, 'text', 'VD: Cục Cảnh sát QLHC về TTXH')}
          ${inputField('Ngày hết hạn', 'cccd_expiry_date', data?.cccd_expiry_date, 'date')}
          <p id="cccd-form-error" class="text-red-500 text-sm hidden"></p>
          <div class="flex gap-3 pt-2">
            <button type="button" id="cccd-cancel" class="flex-1 py-2.5 border rounded-xl text-gray-700">Hủy</button>
            <button type="submit" class="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold">Lưu</button>
          </div>
        </form>
      </div>
    `, { persistent: false })

    document.getElementById('cccd-cancel').onclick = close
    document.getElementById('cccd-form').onsubmit = async (e) => {
      e.preventDefault()
      const fd   = new FormData(e.target)
      const body = Object.fromEntries(fd.entries())
      const errEl = document.getElementById('cccd-form-error')
      // Validate required fields
      const required = [
        ['cccd_number',     'Số CCCD'],
        ['cccd_full_name',  'Họ và tên'],
        ['cccd_dob',        'Ngày sinh'],
        ['cccd_address',    'Địa chỉ thường trú'],
        ['cccd_issue_date', 'Ngày cấp'],
        ['cccd_issue_place','Nơi cấp CCCD'],
      ]
      for (const [k, label] of required) {
        if (!body[k]?.trim()) {
          errEl.textContent = `Vui lòng nhập: ${label}`
          errEl.classList.remove('hidden'); return
        }
      }
      const merged = { ..._profileData, ...body }
      try {
        await API.updateProfile(merged)
        Toast.success('Cập nhật CCCD thành công')
        close(); await refreshProfile()
      } catch (err) {
        errEl.textContent = err.message; errEl.classList.remove('hidden')
      }
    }
  }

  // ── Modal ngân hàng ───────────────────────────
  function showEditBankModal(data) {
    const { close } = Modal.create(`
      <div class="p-5">
        <h3 class="text-lg font-bold text-gray-800 mb-1">
          <i class="fas fa-university mr-2 text-green-600"></i>Thông tin ngân hàng
        </h3>
        <p class="text-xs text-gray-400 mb-4">Thông tin tài khoản nhận lương / hoa hồng</p>
        <form id="bank-form" class="space-y-3">
          ${inputField('Tên ngân hàng <span class="text-red-500">*</span>', 'bank_name', data?.bank_name, 'text', 'VD: Vietcombank, MB Bank...')}
          ${inputField('Số tài khoản <span class="text-red-500">*</span>', 'bank_account_number', data?.bank_account_number, 'text', 'Số tài khoản ngân hàng')}
          ${inputField('Tên chủ tài khoản <span class="text-red-500">*</span>', 'bank_account_name', data?.bank_account_name, 'text', 'Tên đúng như trong tài khoản')}
          <p id="bank-form-error" class="text-red-500 text-sm hidden"></p>
          <div class="flex gap-3 pt-2">
            <button type="button" id="bank-cancel" class="flex-1 py-2.5 border rounded-xl text-gray-700">Hủy</button>
            <button type="submit" class="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-semibold">Lưu</button>
          </div>
        </form>
      </div>
    `)
    document.getElementById('bank-cancel').onclick = close
    document.getElementById('bank-form').onsubmit = async (e) => {
      e.preventDefault()
      const fd   = new FormData(e.target)
      const body = Object.fromEntries(fd.entries())
      const errEl = document.getElementById('bank-form-error')
      if (!body.bank_name?.trim())           { errEl.textContent = 'Vui lòng nhập tên ngân hàng'; errEl.classList.remove('hidden'); return }
      if (!body.bank_account_number?.trim()) { errEl.textContent = 'Vui lòng nhập số tài khoản'; errEl.classList.remove('hidden'); return }
      if (!body.bank_account_name?.trim())   { errEl.textContent = 'Vui lòng nhập tên chủ tài khoản'; errEl.classList.remove('hidden'); return }
      const merged = { ..._profileData, ...body }
      try {
        await API.updateProfile(merged)
        Toast.success('Cập nhật ngân hàng thành công')
        close(); await refreshProfile()
      } catch (err) {
        errEl.textContent = err.message; errEl.classList.remove('hidden')
      }
    }
  }

  // ── Refresh profile sau khi lưu ───────────────
  async function refreshProfile() {
    try {
      const data = await loadProfile()
      populateProfileUI(data)
    } catch {}
  }

  // ── Helper: input / select field ─────────────
  function inputField(labelHtml, name, value = '', type = 'text', placeholder = '') {
    return `<div>
      <label class="block text-sm text-gray-600 mb-1">${labelHtml}</label>
      <input type="${type}" name="${name}" value="${value || ''}"
        placeholder="${placeholder}"
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

  // ── bindEvents ────────────────────────────────
  async function bindEvents() {
    let pendingFront = null
    let pendingBack  = null

    try {
      const data = await loadProfile()
      document.getElementById('profile-loading').classList.add('hidden')
      document.getElementById('profile-content').classList.remove('hidden')
      populateProfileUI(data)
    } catch (e) {
      document.getElementById('profile-loading').innerHTML =
        `<p class="text-red-500 text-sm text-center">${e.message}</p>`
    }

    document.getElementById('btn-edit-province').onclick = () => showEditProvinceModal(_profileData)
    document.getElementById('btn-edit-work').onclick     = () => showEditWorkModal(_profileData)
    document.getElementById('btn-edit-cccd').onclick     = () => showEditCCCDModal(_profileData)
    document.getElementById('btn-edit-bank').onclick     = () => showEditBankModal(_profileData)
    document.getElementById('btn-change-password').onclick = () => Auth.showChangePasswordModal()
    document.getElementById('btn-logout').onclick = () => {
      Modal.confirm('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', () => Auth.logout(), 'Đăng xuất', true)
    }

    // CCCD image upload
    const frontEl  = document.getElementById('cccd-front-preview')
    const backEl   = document.getElementById('cccd-back-preview')
    const uploadBtn = document.getElementById('btn-upload-cccd')

    async function handleCCCDImageClick(side) {
      try {
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
    backEl.onclick  = () => handleCCCDImageClick('back')

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

  return { renderPage, bindEvents, isProfileComplete, getMissingFields, loadProfile }
})()
