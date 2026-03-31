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
        dot.className = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-blue-600 text-white'
        dot.innerHTML = '<i class="fas fa-check text-xs"></i>'
      } else if (i === n) {
        dot.className = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-blue-600 text-white ring-4 ring-blue-200'
        dot.textContent = i
      } else {
        dot.className = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-gray-200 text-gray-500'
        dot.textContent = i
      }
      if (lbl) lbl.className = i <= n ? 'text-xs mt-1 text-blue-600 font-medium' : 'text-xs mt-1 text-gray-400'
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
    const username  = val('reg-username')
    const password  = val('reg-password')
    const confirm   = val('reg-confirm')
    const full_name = val('reg-fullname')
    const phone     = val('reg-phone')

    if (!full_name)   { showError('reg-err-1', 'Vui lòng nhập họ và tên'); return false }
    if (!username)    { showError('reg-err-1', 'Vui lòng nhập tên đăng nhập'); return false }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      showError('reg-err-1', 'Tên đăng nhập chỉ gồm chữ, số, gạch dưới (3–30 ký tự)'); return false
    }
    if (!password)    { showError('reg-err-1', 'Vui lòng nhập mật khẩu'); return false }
    if (password.length < 6) { showError('reg-err-1', 'Mật khẩu ít nhất 6 ký tự'); return false }
    if (password !== confirm) { showError('reg-err-1', 'Mật khẩu xác nhận không khớp'); return false }
    if (phone && !/^[0-9+\-\s]{8,15}$/.test(phone)) {
      showError('reg-err-1', 'Số điện thoại không hợp lệ'); return false
    }
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
    <div class="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600">

      <!-- Header -->
      <div class="flex items-center px-4 pt-12 pb-4">
        <button id="btn-back-login" class="w-10 h-10 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center text-white mr-3 transition-colors">
          <i class="fas fa-arrow-left"></i>
        </button>
        <div class="flex-1">
          <h1 class="text-xl font-bold text-white">Đăng ký tài khoản</h1>
          <p class="text-blue-200 text-xs">Điền đầy đủ thông tin để đăng ký</p>
        </div>
        <img src="https://nhankiet.vn/uploads/01_Logo/Logo%20khong%20nen.jpg" alt="Nhân Kiệt"
          class="w-10 h-10 object-contain rounded-xl bg-white/15 p-0.5 flex-shrink-0" />
      </div>

      <!-- Step Indicator -->
      <div class="flex items-start justify-center gap-0 px-6 pb-6">
        ${[
          { n: 1, label: 'Tài khoản' },
          { n: 2, label: 'CCCD' },
          { n: 3, label: 'Ngân hàng' },
        ].map((s, i, arr) => `
          <div class="flex flex-col items-center">
            <div id="step-dot-${s.n}" class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
              ${s.n === 1 ? 'bg-blue-600 text-white ring-4 ring-blue-200' : 'bg-gray-200 text-gray-500'}">
              ${s.n}
            </div>
            <span id="step-lbl-${s.n}" class="text-xs mt-1 ${s.n === 1 ? 'text-blue-200 font-medium' : 'text-blue-300/60'}">${s.label}</span>
          </div>
          ${i < arr.length - 1 ? `<div class="flex-1 h-0.5 bg-white/20 mt-4 mx-1"></div>` : ''}
        `).join('')}
      </div>

      <!-- Card -->
      <div class="bg-gray-50 rounded-t-3xl min-h-screen px-4 pt-6 pb-32">

        <!-- ── Step 1: Tài khoản + Thông tin cá nhân ── -->
        <div id="reg-step-1">
          <h2 class="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span class="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
            Thông tin tài khoản
          </h2>
          <div class="space-y-3">
            <!-- Họ tên -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Họ và tên <span class="text-red-500">*</span></label>
              <div class="relative">
                <i class="fas fa-user absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input id="reg-fullname" type="text" placeholder="Nguyễn Văn A"
                  class="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>
            </div>
            <!-- Username -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập <span class="text-red-500">*</span></label>
              <div class="relative">
                <i class="fas fa-at absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input id="reg-username" type="text" placeholder="nguyenvana (chữ, số, _)"
                  class="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  autocomplete="username" autocapitalize="none" />
              </div>
            </div>
            <!-- Phone -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <div class="relative">
                <i class="fas fa-phone absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input id="reg-phone" type="tel" placeholder="0901234567"
                  class="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>
            </div>
            <!-- Tỉnh/Thành phố làm việc -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Tỉnh/Thành phố làm việc <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <i class="fas fa-map-marker-alt absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <select id="reg-province"
                  class="w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none">
                  <option value="">-- Đang tải danh sách... --</option>
                </select>
                <i class="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
              </div>
            </div>
            <!-- Password -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Mật khẩu <span class="text-red-500">*</span></label>
              <div class="relative">
                <i class="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input id="reg-password" type="password" placeholder="Ít nhất 6 ký tự"
                  class="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  autocomplete="new-password" />
              </div>
            </div>
            <!-- Confirm Password -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu <span class="text-red-500">*</span></label>
              <div class="relative">
                <i class="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input id="reg-confirm" type="password" placeholder="Nhập lại mật khẩu"
                  class="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  autocomplete="new-password" />
              </div>
            </div>
          </div>
          <p id="reg-err-1" class="text-red-500 text-sm mt-3 hidden"></p>
        </div>

        <!-- ── Step 2: CCCD ── -->
        <div id="reg-step-2" class="hidden">
          <h2 class="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span class="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">2</span>
            Thông tin CCCD / CMND
          </h2>
          <p class="text-xs text-gray-400 mb-4">Tất cả trường CCCD là tuỳ chọn, nhưng giúp admin xác thực danh tính nhanh hơn.</p>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Số CCCD/CMND</label>
              <input id="reg-cccd-number" type="text" placeholder="012345678901"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Họ và tên (theo CCCD)</label>
              <input id="reg-cccd-fullname" type="text" placeholder="NGUYEN VAN A"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                <input id="reg-cccd-dob" type="date"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                <select id="reg-cccd-gender"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">-- Chọn --</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Địa chỉ thường trú</label>
              <textarea id="reg-cccd-address" rows="2" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Ngày cấp</label>
                <input id="reg-cccd-issue" type="date"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn</label>
                <input id="reg-cccd-expiry" type="date"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>
            </div>

            <!-- CCCD Photos -->
            <div class="pt-2">
              <p class="text-sm font-medium text-gray-700 mb-3">Ảnh CCCD/CMND <span class="text-xs text-gray-400">(tuỳ chọn)</span></p>
              <div class="grid grid-cols-2 gap-3">
                <!-- Front -->
                <div>
                  <p class="text-xs text-gray-500 mb-1.5 text-center">Mặt trước</p>
                  <div id="cccd-front-preview">${emptyPhotoPlaceholder('front')}</div>
                  <button id="btn-cccd-front" type="button"
                    class="mt-2 w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs rounded-xl font-medium transition-colors border border-blue-200">
                    <i class="fas fa-camera mr-1"></i>Chụp/chọn mặt trước
                  </button>
                </div>
                <!-- Back -->
                <div>
                  <p class="text-xs text-gray-500 mb-1.5 text-center">Mặt sau</p>
                  <div id="cccd-back-preview">${emptyPhotoPlaceholder('back')}</div>
                  <button id="btn-cccd-back" type="button"
                    class="mt-2 w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs rounded-xl font-medium transition-colors border border-blue-200">
                    <i class="fas fa-camera mr-1"></i>Chụp/chọn mặt sau
                  </button>
                </div>
              </div>
            </div>
          </div>
          <p id="reg-err-2" class="text-red-500 text-sm mt-3 hidden"></p>
        </div>

        <!-- ── Step 3: Ngân hàng ── -->
        <div id="reg-step-3" class="hidden">
          <h2 class="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span class="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">3</span>
            Thông tin ngân hàng
          </h2>
          <p class="text-xs text-gray-400 mb-4">Thông tin ngân hàng để nhận lương/hoa hồng. Tất cả trường là tuỳ chọn.</p>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tên ngân hàng</label>
              <input id="reg-bank-name" type="text" placeholder="VD: Vietcombank, Techcombank..."
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Số tài khoản</label>
              <input id="reg-bank-account" type="text" placeholder="0123456789"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tên chủ tài khoản</label>
              <input id="reg-bank-holder" type="text" placeholder="NGUYEN VAN A"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
          </div>
          <p id="reg-err-3" class="text-red-500 text-sm mt-3 hidden"></p>

          <!-- Summary before submit -->
          <div class="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p class="text-sm font-semibold text-blue-800 mb-2"><i class="fas fa-info-circle mr-1"></i>Lưu ý trước khi đăng ký</p>
            <ul class="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Tài khoản sẽ ở trạng thái <b>Chờ kích hoạt</b> sau đăng ký.</li>
              <li>Bạn chưa thể sử dụng chức năng chấm công cho đến khi admin kích hoạt.</li>
              <li>Liên hệ quản trị viên để được kích hoạt tài khoản.</li>
            </ul>
          </div>
        </div>

        <!-- ── Navigation Buttons ── -->
        <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-area-bottom">
          <div class="text-center py-1 bg-gray-50 border-b border-gray-100">
            <p class="text-gray-400 text-xs">Phát triển bởi <a href="https://nhankiet.vn" class="text-blue-500 font-semibold">nhankiet.vn</a> &nbsp;·&nbsp; © 2026 Nhân Kiệt. All rights reserved.</p>
          </div>
        <div class="px-4 py-3 flex gap-3">
          <button id="reg-btn-prev" type="button"
            class="invisible flex-none w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-600 transition-colors">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button id="reg-btn-next" type="button"
            class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            Tiếp theo <i class="fas fa-chevron-right"></i>
          </button>
          <button id="reg-btn-submit" type="button"
            class="hidden flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
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
      const payload = {
        // Bước 1
        full_name:        val('reg-fullname'),
        username:         val('reg-username').toLowerCase(),
        password:         val('reg-password'),
        confirm_password: val('reg-confirm'),
        phone:            val('reg-phone') || null,
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
      <div class="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex items-center justify-center p-6">
        <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
          <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <i class="fas fa-check-circle text-4xl text-green-500"></i>
          </div>
          <h2 class="text-xl font-bold text-gray-800 mb-2">Đăng ký thành công!</h2>
          <p class="text-gray-500 text-sm mb-2">Tài khoản của bạn đang ở trạng thái <span class="font-semibold text-yellow-600">Chờ kích hoạt</span>.</p>
          <p class="text-gray-500 text-sm mb-6">Vui lòng liên hệ quản trị viên để được kích hoạt tài khoản trước khi sử dụng.</p>
          <button id="btn-go-login-success"
            class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">
            <i class="fas fa-sign-in-alt mr-2"></i>Quay về đăng nhập
          </button>
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
