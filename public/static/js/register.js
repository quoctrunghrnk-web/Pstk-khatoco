// =============================================
// Module: Register
// Đăng ký tài khoản nhân viên mới
// Bước 1: Tài khoản + Thông tin cá nhân
// Bước 2: CCCD (thông tin + ảnh 2 mặt)
// Bước 3: Ngân hàng
// =============================================
window.RegisterModule = (() => {

  // ── State ────────────────────────────────────
  let _step = 1
  const TOTAL_STEPS = 3
  let _cccdFront = null  // base64
  let _cccdBack  = null  // base64
  let _activeProvinces = []  // [{ id, name }] từ API

  // ── Helpers ──────────────────────────────────
  function setStep(n) {
    _step = n
    for (let i = 1; i <= TOTAL_STEPS; i++) {
      const el = document.getElementById(`reg-step-${i}`)
      if (el) el.classList.toggle('hidden', i !== n)
    }
    // Update step indicator
    for (let i = 1; i <= TOTAL_STEPS; i++) {
      const dot = document.getElementById(`step-dot-${i}`)
      const lbl = document.getElementById(`step-lbl-${i}`)
      if (!dot) continue
      if (i < n) {
        dot.className = 'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold bg-red-600 text-white shadow-lg shadow-red-200 transition-all'
        dot.innerHTML = '<i class="fas fa-check text-xs"></i>'
      } else if (i === n) {
        dot.className = 'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold bg-red-600 text-white shadow-lg shadow-red-200 ring-4 ring-red-100 transition-all'
        dot.textContent = i
      } else {
        dot.className = 'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold bg-gray-200 text-gray-400 transition-all'
        dot.textContent = i
      }
      if (lbl) lbl.className = i <= n ? 'text-xs mt-1 text-red-600 font-medium whitespace-nowrap' : 'text-xs mt-1 text-gray-400 whitespace-nowrap'
    }
    // Prev/next buttons
    const btnPrev = document.getElementById('reg-btn-prev')
    const btnNext = document.getElementById('reg-btn-next')
    const btnSubmit = document.getElementById('reg-btn-submit')
    if (btnPrev) btnPrev.classList.toggle('invisible', n === 1)
    if (btnNext) btnNext.classList.toggle('hidden', n === TOTAL_STEPS)
    if (btnSubmit) btnSubmit.classList.toggle('hidden', n !== TOTAL_STEPS)
  }

  function showError(elId, msg) {
    const el = document.getElementById(elId)
    if (!el) return
    el.textContent = msg
    el.classList.toggle('hidden', !msg)
  }

  function val(id) {
    const el = document.getElementById(id)
    return el ? el.value.trim() : ''
  }

  // ── Load active provinces từ API ─────────────
  async function loadActiveProvinces() {
    try {
      const res = await API.getActiveProvinces()
      _activeProvinces = res.data || []
    } catch {
      _activeProvinces = []
    }
    // Populate dropdown sau khi load
    const sel = document.getElementById('reg-province')
    if (!sel) return
    if (_activeProvinces.length === 0) {
      sel.innerHTML = '<option value="">-- Chưa có tỉnh/thành nào --</option>'
      return
    }
    sel.innerHTML =
      '<option value="">-- Chọn tỉnh/thành phố --</option>' +
      _activeProvinces.map(p =>
        `<option value="${p.name}">${p.name}</option>`
      ).join('')
  }

  // ── Validate from step ────────────────────────
  function validateStep1() {
    const username  = val('reg-username')   // SĐT 10 số
    const password  = val('reg-password')
    const confirm   = val('reg-confirm')
    const full_name = val('reg-fullname')

    if (!full_name)   { showError('reg-err-1', 'Vui lòng nhập họ và tên'); return false }
    if (!username)    { showError('reg-err-1', 'Vui lòng nhập số điện thoại đăng nhập'); return false }
    if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(username)) {
      showError('reg-err-1', 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 03/05/07/08/09)'); return false
    }
    if (!password)    { showError('reg-err-1', 'Vui lòng nhập mật khẩu'); return false }
    if (password.length < 6) { showError('reg-err-1', 'Mật khẩu ít nhất 6 ký tự'); return false }
    if (password !== confirm) { showError('reg-err-1', 'Mật khẩu xác nhận không khớp'); return false }
    const province = document.getElementById('reg-province')?.value
    if (!province) { showError('reg-err-1', 'Vui lòng chọn tỉnh/thành phố làm việc'); return false }
    showError('reg-err-1', '')
    return true
  }

  function validateStep2() {
    // All CCCD fields optional, but ảnh optional too
    showError('reg-err-2', '')
    return true
  }

  function validateStep3() {
    showError('reg-err-3', '')
    return true
  }

  // ── CCCD photo capture ────────────────────────
  async function captureCCCD(side) {
    const previewId = side === 'front' ? 'cccd-front-preview' : 'cccd-back-preview'
    const btnId     = side === 'front' ? 'btn-cccd-front' : 'btn-cccd-back'
    const btn       = document.getElementById(btnId)
    const preview   = document.getElementById(previewId)
    if (!btn || !preview) return

    btn.disabled = true
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Đang xử lý...'
    try {
      // captureNoWatermark: không thêm watermark vào ảnh CCCD
      const base64 = await Camera.captureNoWatermark(true)
      if (!base64) return
      if (side === 'front') _cccdFront = base64
      else                  _cccdBack  = base64

      preview.innerHTML = `
        <div class="relative">
          <img src="${base64}" class="w-full h-40 object-cover rounded-xl border-2 border-blue-400" />
          <button type="button" data-side="${side}"
            class="cccd-remove absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow">
            <i class="fas fa-times"></i>
          </button>
        </div>`
      preview.querySelectorAll('.cccd-remove').forEach(b => {
        b.onclick = () => {
          if (b.dataset.side === 'front') _cccdFront = null
          else _cccdBack = null
          preview.innerHTML = emptyPhotoPlaceholder(side)
          bindCCCDButtons()
        }
      })
    } catch (e) {
      if (e.message !== 'cancelled') Toast.error(e.message || 'Không thể chụp ảnh')
    } finally {
      btn.disabled = false
      btn.innerHTML = side === 'front'
        ? '<i class="fas fa-camera mr-1"></i>Chụp/chọn mặt trước'
        : '<i class="fas fa-camera mr-1"></i>Chụp/chọn mặt sau'
    }
  }

  function emptyPhotoPlaceholder(side) {
    return `<div class="w-full h-40 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400">
      <i class="fas fa-id-card text-3xl mb-2"></i>
      <p class="text-xs">${side === 'front' ? 'Mặt trước CCCD' : 'Mặt sau CCCD'}</p>
    </div>`
  }

  function bindCCCDButtons() {
    const btnFront = document.getElementById('btn-cccd-front')
    const btnBack  = document.getElementById('btn-cccd-back')
    if (btnFront) btnFront.onclick = () => captureCCCD('front')
    if (btnBack)  btnBack.onclick  = () => captureCCCD('back')
  }

  // ── Render ────────────────────────────────────
  function renderPage() {
    return `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-slate-200 flex flex-col">
      <!-- Top bar -->
      <div class="h-1.5 bg-gradient-to-r from-red-600 via-red-500 to-orange-400 flex-shrink-0"></div>

      <!-- Header -->
      <div class="bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
        <div class="flex items-center px-4 py-3 max-w-lg mx-auto">
          <button id="btn-back-login" class="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-600 mr-3 transition-colors flex-shrink-0">
            <i class="fas fa-arrow-left text-sm"></i>
          </button>
          <div class="flex-1">
            <h1 class="text-base font-bold text-gray-900">Đăng ký tài khoản</h1>
            <p class="text-gray-400 text-xs">Nhân Viên Khảo Sát Thị Trường · Nhân Kiệt</p>
          </div>
          <div class="bg-white rounded-xl shadow border border-gray-100 p-1 flex-shrink-0">
            <img src="https://nhankiet.vn/uploads/01_Logo/Logo%20khong%20nen.jpg" alt="Nhân Kiệt"
              class="w-9 h-9 object-contain" />
          </div>
        </div>
        <!-- Step Indicator -->
        <div class="flex items-center px-6 pb-3 max-w-lg mx-auto gap-0">
          ${[
            { n: 1, label: 'Tài khoản', icon: 'fa-user' },
            { n: 2, label: 'CCCD',      icon: 'fa-id-card' },
            { n: 3, label: 'Ngân hàng', icon: 'fa-university' },
          ].map((s, i, arr) => `
            <div class="flex flex-col items-center flex-shrink-0">
              <div id="step-dot-${s.n}" class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${s.n === 1 ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-gray-200 text-gray-400'}">
                ${s.n}
              </div>
              <span id="step-lbl-${s.n}" class="text-xs mt-1 font-medium whitespace-nowrap
                ${s.n === 1 ? 'text-red-600' : 'text-gray-400'}">${s.label}</span>
            </div>
            ${i < arr.length - 1 ? `<div class="flex-1 h-0.5 bg-gray-200 mx-2 mt-[-10px]"></div>` : ''}
          `).join('')}
        </div>
      </div>

      <!-- Scrollable content -->
      <div class="flex-1 overflow-y-auto pb-32">
        <div class="max-w-lg mx-auto px-4 pt-5 space-y-4">

          <!-- ── Step 1: Tài khoản ── -->
          <div id="reg-step-1">
            <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div class="bg-gradient-to-r from-red-600 to-red-700 px-5 py-3">
                <h2 class="text-white font-semibold text-sm flex items-center gap-2">
                  <i class="fas fa-user-circle"></i> Thông tin tài khoản
                </h2>
              </div>
              <div class="p-5 space-y-4">
                <!-- Họ tên -->
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Họ và tên <span class="text-red-500 normal-case font-normal">*</span></label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><i class="fas fa-user"></i></span>
                    <input id="reg-fullname" type="text" placeholder="Nguyễn Văn A"
                      class="w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl text-sm outline-none focus:border-red-500 bg-gray-50 focus:bg-white transition-colors font-medium" />
                  </div>
                </div>
                <!-- SĐT = username -->
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Số điện thoại <span class="text-red-500 normal-case font-normal">*</span></label>
                  <p class="text-xs text-gray-400 mb-2"><i class="fas fa-info-circle mr-1 text-blue-400"></i>Dùng số điện thoại để đăng nhập</p>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><i class="fas fa-mobile-alt"></i></span>
                    <input id="reg-username" type="tel" placeholder="0901234567"
                      class="w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl text-sm outline-none focus:border-red-500 bg-gray-50 focus:bg-white transition-colors font-medium"
                      inputmode="numeric" maxlength="10" autocomplete="tel" />
                  </div>
                </div>
                <!-- Tỉnh/Thành phố -->
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tỉnh/Thành phố làm việc <span class="text-red-500 normal-case font-normal">*</span></label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><i class="fas fa-map-marker-alt"></i></span>
                    <select id="reg-province"
                      class="w-full pl-11 pr-8 py-3.5 border-2 border-gray-200 rounded-2xl text-sm outline-none focus:border-red-500 bg-gray-50 focus:bg-white transition-colors font-medium appearance-none">
                      <option value="">-- Đang tải danh sách... --</option>
                    </select>
                    <i class="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                  </div>
                </div>
              </div>
            </div>

            <!-- Password card -->
            <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mt-4">
              <div class="bg-gradient-to-r from-slate-700 to-slate-800 px-5 py-3">
                <h2 class="text-white font-semibold text-sm flex items-center gap-2">
                  <i class="fas fa-lock"></i> Thiết lập mật khẩu
                </h2>
              </div>
              <div class="p-5 space-y-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mật khẩu <span class="text-red-500 normal-case font-normal">*</span></label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><i class="fas fa-lock"></i></span>
                    <input id="reg-password" type="password" placeholder="Ít nhất 6 ký tự"
                      class="w-full pl-11 pr-12 py-3.5 border-2 border-gray-200 rounded-2xl text-sm outline-none focus:border-red-500 bg-gray-50 focus:bg-white transition-colors font-medium"
                      autocomplete="new-password" />
                    <button type="button" id="reg-toggle-pw"
                      class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <i class="fas fa-eye"></i>
                    </button>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Xác nhận mật khẩu <span class="text-red-500 normal-case font-normal">*</span></label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><i class="fas fa-check-circle"></i></span>
                    <input id="reg-confirm" type="password" placeholder="Nhập lại mật khẩu"
                      class="w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl text-sm outline-none focus:border-red-500 bg-gray-50 focus:bg-white transition-colors font-medium"
                      autocomplete="new-password" />
                  </div>
                </div>
              </div>
            </div>
            <p id="reg-err-1" class="text-red-500 text-sm mt-3 hidden bg-red-50 rounded-xl px-4 py-2.5 border border-red-200 flex items-center gap-2"><i class="fas fa-exclamation-circle"></i><span></span></p>
          </div>

          <!-- ── Step 2: CCCD ── -->
          <div id="reg-step-2" class="hidden">
            <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div class="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-3">
                <h2 class="text-white font-semibold text-sm flex items-center gap-2">
                  <i class="fas fa-id-card"></i> Thông tin CCCD / CMND
                  <span class="ml-auto text-indigo-200 text-xs font-normal italic">Tuỳ chọn</span>
                </h2>
              </div>
              <div class="p-5 space-y-4">
                <div class="bg-indigo-50 rounded-2xl p-3 flex items-start gap-2">
                  <i class="fas fa-shield-alt text-indigo-400 mt-0.5 flex-shrink-0"></i>
                  <p class="text-xs text-indigo-600">Thông tin CCCD giúp admin xác thực danh tính và bảo vệ tài khoản của bạn.</p>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Số CCCD/CMND</label>
                  <input id="reg-cccd-number" type="text" placeholder="012345678901"
                    class="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl text-sm outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors font-medium" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Họ và tên (theo CCCD)</label>
                  <input id="reg-cccd-fullname" type="text" placeholder="NGUYEN VAN A"
                    class="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl text-sm outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors font-medium" />
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ngày sinh</label>
                    <input id="reg-cccd-dob" type="date"
                      class="w-full px-3 py-3.5 border-2 border-gray-200 rounded-2xl text-sm outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Giới tính</label>
                    <select id="reg-cccd-gender"
                      class="w-full px-3 py-3.5 border-2 border-gray-200 rounded-2xl text-sm outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors appearance-none">
                      <option value="">-- Chọn --</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Địa chỉ thường trú</label>
                  <textarea id="reg-cccd-address" rows="2" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors resize-none"></textarea>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ngày cấp</label>
                    <input id="reg-cccd-issue" type="date"
                      class="w-full px-3 py-3.5 border-2 border-gray-200 rounded-2xl text-sm outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ngày hết hạn</label>
                    <input id="reg-cccd-expiry" type="date"
                      class="w-full px-3 py-3.5 border-2 border-gray-200 rounded-2xl text-sm outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors" />
                  </div>
                </div>
                <!-- CCCD Photos -->
                <div>
                  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Ảnh CCCD/CMND <span class="text-gray-400 normal-case font-normal">(tuỳ chọn)</span></p>
                  <div class="grid grid-cols-2 gap-3">
                    <div class="bg-gray-50 rounded-2xl p-3 border-2 border-dashed border-gray-200">
                      <p class="text-xs text-gray-500 mb-2 text-center font-medium">Mặt trước</p>
                      <div id="cccd-front-preview">${emptyPhotoPlaceholder('front')}</div>
                      <button id="btn-cccd-front" type="button"
                        class="mt-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-xl font-semibold transition-colors">
                        <i class="fas fa-camera mr-1"></i>Chụp / Chọn
                      </button>
                    </div>
                    <div class="bg-gray-50 rounded-2xl p-3 border-2 border-dashed border-gray-200">
                      <p class="text-xs text-gray-500 mb-2 text-center font-medium">Mặt sau</p>
                      <div id="cccd-back-preview">${emptyPhotoPlaceholder('back')}</div>
                      <button id="btn-cccd-back" type="button"
                        class="mt-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-xl font-semibold transition-colors">
                        <i class="fas fa-camera mr-1"></i>Chụp / Chọn
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p id="reg-err-2" class="text-red-500 text-sm mt-3 hidden bg-red-50 rounded-xl px-4 py-2.5 border border-red-200"></p>
          </div>

          <!-- ── Step 3: Ngân hàng ── -->
          <div id="reg-step-3" class="hidden">
            <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div class="bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-3">
                <h2 class="text-white font-semibold text-sm flex items-center gap-2">
                  <i class="fas fa-university"></i> Thông tin ngân hàng
                  <span class="ml-auto text-emerald-200 text-xs font-normal italic">Tuỳ chọn</span>
                </h2>
              </div>
              <div class="p-5 space-y-4">
                <div class="bg-emerald-50 rounded-2xl p-3 flex items-start gap-2">
                  <i class="fas fa-info-circle text-emerald-400 mt-0.5 flex-shrink-0"></i>
                  <p class="text-xs text-emerald-700">Thông tin ngân hàng dùng để nhận lương và hoa hồng. Bạn có thể bổ sung sau trong phần hồ sơ.</p>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tên ngân hàng</label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><i class="fas fa-university text-sm"></i></span>
                    <input id="reg-bank-name" type="text" placeholder="VD: Vietcombank, Techcombank..."
                      class="w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl text-sm outline-none focus:border-emerald-500 bg-gray-50 focus:bg-white transition-colors font-medium" />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Số tài khoản</label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><i class="fas fa-hashtag text-sm"></i></span>
                    <input id="reg-bank-account" type="text" placeholder="0123456789"
                      class="w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl text-sm outline-none focus:border-emerald-500 bg-gray-50 focus:bg-white transition-colors font-medium"
                      inputmode="numeric" />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tên chủ tài khoản</label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><i class="fas fa-user text-sm"></i></span>
                    <input id="reg-bank-holder" type="text" placeholder="NGUYEN VAN A"
                      class="w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl text-sm outline-none focus:border-emerald-500 bg-gray-50 focus:bg-white transition-colors font-medium" />
                  </div>
                </div>
              </div>
            </div>
            <!-- Notice -->
            <div class="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
              <i class="fas fa-exclamation-triangle text-amber-500 mt-0.5 flex-shrink-0"></i>
              <div>
                <p class="text-sm font-semibold text-amber-800 mb-1">Lưu ý trước khi đăng ký</p>
                <ul class="text-xs text-amber-700 space-y-0.5">
                  <li>• Tài khoản sẽ ở trạng thái <b>Chờ kích hoạt</b> sau khi đăng ký.</li>
                  <li>• Liên hệ quản trị viên để được kích hoạt tài khoản.</li>
                </ul>
              </div>
            </div>
            <p id="reg-err-3" class="text-red-500 text-sm mt-3 hidden bg-red-50 rounded-xl px-4 py-2.5 border border-red-200"></p>
          </div>

        </div>
      </div>

      <!-- Bottom nav buttons -->
      <div class="fixed bottom-0 left-0 right-0 z-40 flex-shrink-0">
        <div class="bg-white border-t border-gray-200 shadow-lg">
          <div class="text-center py-1.5 bg-gray-50 border-b border-gray-100">
            <p class="text-gray-400 text-xs">Phát triển bởi <a href="https://nhankiet.vn" class="text-red-500 font-semibold">nhankiet.vn</a> &nbsp;·&nbsp; © 2026 Nhân Kiệt. All rights reserved.</p>
          </div>
          <div class="px-4 py-3 flex gap-3 max-w-lg mx-auto">
            <button id="reg-btn-prev" type="button"
              class="invisible flex-none w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center text-gray-600 transition-colors">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button id="reg-btn-next" type="button"
              class="flex-1 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-200">
              Tiếp theo &nbsp;<i class="fas fa-chevron-right"></i>
            </button>
            <button id="reg-btn-submit" type="button"
              class="hidden flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
              <i class="fas fa-paper-plane"></i> Đăng ký
            </button>
          </div>
        </div>
      </div>
    </div>
    `
  }

  // ── Submit ─────────────────────────────────────
  async function doSubmit() {
    const btn = document.getElementById('reg-btn-submit')
    btn.disabled = true
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang đăng ký...'

    try {
      const phoneNum = val('reg-username')   // username chính là SĐT
      const payload = {
        // Bước 1
        full_name:        val('reg-fullname'),
        username:         phoneNum,
        password:         val('reg-password'),
        confirm_password: val('reg-confirm'),
        phone:            phoneNum,            // phone = username = SĐT
        province:         document.getElementById('reg-province')?.value || null,
        // Bước 2
        cccd_number:      val('reg-cccd-number') || null,
        cccd_full_name:   val('reg-cccd-fullname') || null,
        cccd_dob:         val('reg-cccd-dob') || null,
        cccd_gender:      document.getElementById('reg-cccd-gender')?.value || null,
        cccd_address:     val('reg-cccd-address') || null,
        cccd_issue_date:  val('reg-cccd-issue') || null,
        cccd_expiry_date: val('reg-cccd-expiry') || null,
        cccd_front_image: _cccdFront || null,
        cccd_back_image:  _cccdBack  || null,
        // Bước 3
        bank_name:           val('reg-bank-name') || null,
        bank_account_number: val('reg-bank-account') || null,
        bank_account_name:   val('reg-bank-holder') || null,
      }

      const res = await API.register(payload)
      // Show success
      _showSuccess()
    } catch (e) {
      showError('reg-err-3', e.message || 'Đăng ký thất bại, vui lòng thử lại')
      btn.disabled = false
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Đăng ký'
    }
  }

  function _showSuccess() {
    const app = document.getElementById('app')
    app.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-slate-200 flex flex-col">
        <div class="h-1.5 bg-gradient-to-r from-red-600 via-red-500 to-orange-400"></div>
        <div class="flex-1 flex items-center justify-center p-6">
          <div class="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 max-w-sm w-full text-center">
            <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <i class="fas fa-check-circle text-4xl text-green-500"></i>
            </div>
            <div class="bg-white rounded-2xl shadow border border-gray-100 p-3 w-16 mx-auto mb-4">
              <img src="https://nhankiet.vn/uploads/01_Logo/Logo%20khong%20nen.jpg" alt="Nhân Kiệt" class="w-full h-auto object-contain" />
            </div>
            <h2 class="text-xl font-bold text-gray-800 mb-2">Đăng ký thành công!</h2>
            <p class="text-gray-500 text-sm mb-2">Tài khoản đang ở trạng thái <span class="font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">Chờ kích hoạt</span>.</p>
            <p class="text-gray-400 text-xs mb-6">Vui lòng liên hệ quản trị viên để được kích hoạt tài khoản trước khi sử dụng.</p>
            <button id="btn-go-login-success"
              class="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-200 transition-colors">
              <i class="fas fa-sign-in-alt mr-2"></i>Quay về đăng nhập
            </button>
          </div>
        </div>
      </div>`
    document.getElementById('btn-go-login-success').onclick = () => window.App.navigate('login')
  }

  // ── Bind Events ───────────────────────────────
  function bindEvents() {
    // Reset state
    _step = 1
    _cccdFront = null
    _cccdBack  = null
    _activeProvinces = []

    // Load danh sách tỉnh từ API ngay khi mở trang
    loadActiveProvinces()

    // Back to login
    const btnBack = document.getElementById('btn-back-login')
    if (btnBack) btnBack.onclick = () => window.App.navigate('login')

    // Toggle show/hide password
    const regTogglePw = document.getElementById('reg-toggle-pw')
    const regPwInput  = document.getElementById('reg-password')
    if (regTogglePw && regPwInput) {
      regTogglePw.addEventListener('click', () => {
        const show = regPwInput.type === 'password'
        regPwInput.type = show ? 'text' : 'password'
        regTogglePw.innerHTML = show ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>'
      })
    }

    // Next step
    const btnNext = document.getElementById('reg-btn-next')
    if (btnNext) btnNext.onclick = () => {
      const validators = [null, validateStep1, validateStep2, validateStep3]
      if (validators[_step] && !validators[_step]()) return
      if (_step < TOTAL_STEPS) {
        const nextStep = _step + 1
        setStep(nextStep)
        // Bind camera buttons when step 2 is shown
        if (nextStep === 2) bindCCCDButtons()
      }
    }

    // Prev step
    const btnPrev = document.getElementById('reg-btn-prev')
    if (btnPrev) btnPrev.onclick = () => {
      if (_step > 1) {
        const prevStep = _step - 1
        setStep(prevStep)
        // Re-bind camera buttons if going back to step 2
        if (prevStep === 2) bindCCCDButtons()
      }
    }

    // Submit
    const btnSubmit = document.getElementById('reg-btn-submit')
    if (btnSubmit) btnSubmit.onclick = async () => {
      if (!validateStep3()) return
      await doSubmit()
    }

    // Initialize step display
    setStep(1)
  }

  return { renderPage, bindEvents }
})()
