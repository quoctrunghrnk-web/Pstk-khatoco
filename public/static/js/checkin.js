// =============================================
// Module: Check-in / Check-out (Multi-store)
// =============================================
window.CheckinModule = (() => {

  let _sessions      = []      // Tất cả lượt hôm nay
  let _currentGeo    = null    // GPS
  let _products      = []      // Danh sách sản phẩm
  let _gifts         = []      // Danh sách quà tặng
  let _profileData   = null    // Dữ liệu hồ sơ nhân viên

  // ── Helpers ─────────────────────────────────
  function formatTime(isoStr) {
    return APP_CONFIG.formatTimeVN(isoStr)
  }

  function getStatusBadge(status) {
    if (status === 'checkin')
      return '<span class="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">Đang làm việc</span>'
    if (status === 'checkout')
      return '<span class="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">Đã check-out</span>'
    return '<span class="text-gray-400 text-sm">--</span>'
  }

  // ── renderPage ──────────────────────────────
  function renderPage() {
    return `
    <div class="pb-28 bg-gradient-to-b from-green-50 to-gray-50 min-h-screen">
      <!-- Header -->
      <div class="bg-white border-b border-gray-100 shadow-sm px-4 pt-safe-top sticky top-0 z-40">
        <div class="max-w-lg mx-auto flex items-center gap-3 h-14">
          <div class="w-10 h-10 bg-green-50 border-2 border-green-100 rounded-xl flex items-center
                      justify-center flex-shrink-0 shadow-sm overflow-hidden">
            <img src="https://nhankiet.vn/uploads/01_Logo/Logo%20khong%20nen.jpg" alt="NK"
              class="w-8 h-8 object-contain block"
              onerror="this.style.display='none';this.parentElement.innerHTML='<span class=\'font-bold text-green-600 text-xs\'>NK</span>'" />
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-sm font-bold text-gray-800 leading-tight">Check-in / Check-out</h2>
            <p class="text-green-600 text-xs font-medium" id="ci-date-display">Đang tải...</p>
          </div>
          <span id="ci-live-time" class="text-green-700 text-sm font-bold flex-shrink-0 bg-green-50
                px-2.5 py-1 rounded-lg border border-green-100"></span>
        </div>
      </div>
      <div class="h-1 bg-gradient-to-r from-green-500 to-emerald-400"></div>

      <div class="px-4 mt-4 space-y-3 max-w-lg mx-auto">

        <!-- Cảnh báo hồ sơ chưa đầy đủ -->
        <div id="ci-profile-warn" class="hidden"></div>

        <!-- Nút Check-in mới -->
        <div id="ci-new-btn-area">
          <div class="flex items-center justify-center h-14">
            <i class="fas fa-spinner fa-spin text-green-300 text-2xl"></i>
          </div>
        </div>

        <!-- Danh sách lượt hôm nay -->
        <div id="ci-sessions-list" class="space-y-3"></div>

        <!-- Lịch sử -->
        <div class="bg-white rounded-2xl shadow-md border border-gray-100 p-4">
          <h3 class="font-bold text-gray-700 mb-3 text-sm flex items-center gap-2">
            <span class="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
              <i class="fas fa-history text-gray-500 text-xs"></i>
            </span>Lịch sử gần đây
          </h3>
          <div id="ci-history-list" class="space-y-2">
            <p class="text-center text-gray-300 text-sm py-4">
              <i class="fas fa-spinner fa-spin"></i>
            </p>
          </div>
        </div>

        <div class="h-2"></div>
      </div>
    </div>`
  }

  // ── Lấy GPS ─────────────────────────────────
  async function fetchGeo(themeColor = 'blue') {
    const { close } = Modal.create(`
      <div class="p-6 text-center">
        <i class="fas fa-map-marker-alt text-4xl text-${themeColor}-500 mb-3 animate-bounce"></i>
        <h3 class="font-bold text-gray-800 mb-1">Đang lấy vị trí GPS...</h3>
        <p class="text-gray-400 text-sm">Vui lòng chờ</p>
      </div>
    `, { persistent: true })
    try {
      _currentGeo = await Geo.getPositionWithAddress()
    } catch (e) {
      Toast.warning('Không lấy được GPS: ' + (e.message || 'Lỗi không xác định'))
      _currentGeo = { lat: null, lng: null, address: 'Không xác định vị trí' }
    } finally {
      close()
    }
    return _currentGeo
  }

  function makeGetGeo() { return () => _currentGeo }

  // ── Render sales inputs ─────────────────────
  function renderSalesInputs(products) {
    if (!products || products.length === 0) {
      return `<p class="text-gray-400 text-sm text-center py-2">Chưa có danh sách sản phẩm</p>`
    }
    return products.map(p => `
      <div class="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
        <span class="flex-1 text-sm font-medium text-gray-700 truncate">
          <i class="fas fa-wine-bottle mr-1.5 text-blue-400 text-xs"></i>${p.name}
          ${p.unit ? `<span class="text-gray-400 text-xs">(${p.unit})</span>` : ''}
        </span>
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <button type="button" onclick="CheckinModule._decQty('sale_${p.id}')"
            class="w-7 h-7 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg font-bold text-base
                   flex items-center justify-center transition-colors">−</button>
          <input type="number" id="sale_${p.id}" value="0" min="0"
            class="w-12 text-center text-sm font-bold border border-gray-200 rounded-lg py-1 bg-white
                   focus:ring-2 focus:ring-blue-300 outline-none" />
          <button type="button" onclick="CheckinModule._incQty('sale_${p.id}')"
            class="w-7 h-7 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg font-bold text-base
                   flex items-center justify-center transition-colors">+</button>
        </div>
      </div>
    `).join('')
  }

  // ── Render gifts inputs ─────────────────────
  function renderGiftInputs(gifts) {
    if (!gifts || gifts.length === 0) {
      return `<p class="text-gray-400 text-sm text-center py-2">Chưa có danh sách quà tặng</p>`
    }
    return gifts.map(g => `
      <div class="flex items-center gap-3 bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-100">
        <span class="flex-1 text-sm font-medium text-gray-700 truncate">
          <i class="fas fa-gift mr-1.5 text-amber-500 text-xs"></i>${g.name}
          ${g.unit ? `<span class="text-gray-400 text-xs">(${g.unit})</span>` : ''}
        </span>
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <button type="button" onclick="CheckinModule._decQty('gift_${g.id}')"
            class="w-7 h-7 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg font-bold text-base
                   flex items-center justify-center transition-colors">−</button>
          <input type="number" id="gift_${g.id}" value="0" min="0"
            class="w-12 text-center text-sm font-bold border border-amber-200 rounded-lg py-1 bg-white
                   focus:ring-2 focus:ring-amber-300 outline-none" />
          <button type="button" onclick="CheckinModule._incQty('gift_${g.id}')"
            class="w-7 h-7 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg font-bold text-base
                   flex items-center justify-center transition-colors">+</button>
        </div>
      </div>
    `).join('')
  }

  // Public helpers cho +/- buttons
  function _incQty(id) {
    const el = document.getElementById(id)
    if (el) el.value = Math.max(0, parseInt(el.value || 0) + 1)
  }
  function _decQty(id) {
    const el = document.getElementById(id)
    if (el) el.value = Math.max(0, parseInt(el.value || 0) - 1)
  }

  // ── Collect sales/gifts data ─────────────────
  function collectSales(products) {
    return products.map(p => ({
      product_id: p.id,
      quantity: Math.max(0, parseInt(document.getElementById('sale_' + p.id)?.value || 0))
    }))
  }

  function collectGifts(gifts) {
    return gifts.filter(g => {
      const v = parseInt(document.getElementById('gift_' + g.id)?.value || 0)
      return v > 0
    }).map(g => ({
      gift_id: g.id,
      quantity: Math.max(0, parseInt(document.getElementById('gift_' + g.id)?.value || 0))
    }))
  }

  // ── Kiểm tra hồ sơ trước check-in ─────────────
  function checkProfileBeforeCheckin() {
    if (!_profileData) {
      // Profile chưa load được → chặn và yêu cầu cập nhật hồ sơ
      Toast.error('Không tải được hồ sơ. Vui lòng vào tab Hồ sơ để cập nhật trước khi check-in.')
      setTimeout(() => App.navigate('profile'), 1500)
      return false
    }
    const missing = ProfileModule.getMissingFields(_profileData)
    if (missing.length === 0) return true
    // Hiển thị modal thông báo và chuyển sang hồ sơ
    const { close } = Modal.create(`
      <div class="p-5 text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
        </div>
        <h3 class="text-lg font-bold text-gray-800 mb-2">Hồ sơ chưa đầy đủ</h3>
        <p class="text-sm text-gray-500 mb-4">Bạn cần bổ sung đầy đủ thông tin hồ sơ trước khi check-in.</p>
        <div class="bg-red-50 rounded-xl p-3 mb-4 text-left">
          <p class="text-xs font-semibold text-red-600 mb-2">Thiếu thông tin:</p>
          ${missing.map(f => `<div class="flex items-center gap-1.5 text-xs text-red-700"><i class="fas fa-times-circle text-red-400 flex-shrink-0"></i><span>${f}</span></div>`).join('')}
        </div>
        <div class="flex gap-3">
          <button id="ci-warn-cancel" class="flex-1 py-2.5 border rounded-xl text-gray-600 text-sm">Đóng</button>
          <button id="ci-warn-go-profile" class="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm">
            <i class="fas fa-user-edit mr-1"></i>Cập nhật hồ sơ
          </button>
        </div>
      </div>
    `)
    document.getElementById('ci-warn-cancel').onclick = close
    document.getElementById('ci-warn-go-profile').onclick = () => { close(); App.navigate('profile') }
    return false
  }

  // ── Check-in flow ────────────────────────────
  async function doCheckin() {
    console.log('[Checkin] doCheckin called, _profileData=', _profileData)
    console.log('[Checkin] missing=', _profileData ? ProfileModule.getMissingFields(_profileData) : 'NO_PROFILE')
    if (!checkProfileBeforeCheckin()) return
    await fetchGeo('blue')

    const { close: closeModal } = Modal.create(`
      <div class="p-5 max-h-[85vh] overflow-y-auto">
        <h3 class="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
          <i class="fas fa-map-marker-alt text-blue-600"></i>Check-in mới
        </h3>
        <p class="text-xs text-gray-400 mb-4">Nhập thông tin điểm bán và chụp ảnh</p>

        <!-- Điểm bán -->
        <div class="mb-4">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">
            <i class="fas fa-store mr-1 text-blue-500"></i>Tên điểm bán <span class="text-red-500">*</span>
          </label>
          <input type="text" id="ci-store-name"
            placeholder="Ví dụ: Cửa hàng ABC, Quán Bia 123..."
            class="w-full px-3 py-2.5 border border-blue-200 rounded-xl text-sm outline-none
                   focus:ring-2 focus:ring-blue-400 bg-blue-50/30" />
        </div>

        <!-- Ảnh check-in -->
        <div class="mb-4">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">
            <i class="fas fa-camera mr-1 text-blue-500"></i>Ảnh check-in <span class="text-red-500">*</span>
            <span class="text-xs text-gray-400 font-normal ml-1">(chụp đủ 2 ảnh)</span>
          </label>
          <div id="checkin-photo-grid" class="grid grid-cols-2 gap-3"></div>
        </div>

        <!-- Địa chỉ GPS -->
        <p class="text-xs text-gray-400 mb-4 flex items-start gap-1.5 bg-gray-50 rounded-xl px-3 py-2">
          <i class="fas fa-map-marker-alt text-blue-400 mt-0.5 flex-shrink-0"></i>
          <span>${_currentGeo?.address || 'Chưa xác định vị trí'}</span>
        </p>

        <p id="ci-modal-error" class="text-red-500 text-sm text-center mb-2 hidden"></p>
        <div class="flex gap-3 sticky bottom-0 bg-white pt-2 pb-1">
          <button id="ci-modal-cancel"
            class="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium">Hủy</button>
          <button id="ci-modal-submit"
            class="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm">
            <i class="fas fa-sign-in-alt mr-1"></i>Xác nhận
          </button>
        </div>
      </div>
    `, { persistent: true })

    const grid = Camera.createPhotoGrid(
      document.getElementById('checkin-photo-grid'),
      2, { allowGallery: true }, () => {}, null, makeGetGeo()
    )

    document.getElementById('ci-modal-cancel').onclick = closeModal
    document.getElementById('ci-modal-submit').onclick = async () => {
      const storeName = document.getElementById('ci-store-name')?.value.trim()
      if (!storeName) {
        const errEl = document.getElementById('ci-modal-error')
        errEl.textContent = 'Vui lòng nhập tên điểm bán'
        errEl.classList.remove('hidden')
        document.getElementById('ci-store-name')?.focus()
        return
      }
      const all = grid.getAll()
      if (!all[0] || !all[1]) {
        const errEl = document.getElementById('ci-modal-error')
        errEl.textContent = 'Vui lòng chụp đủ 2 ảnh check-in'
        errEl.classList.remove('hidden')
        return
      }
      const btn = document.getElementById('ci-modal-submit')
      btn.disabled = true
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Đang lưu...'
      try {
        await API.checkinStart({
          lat: _currentGeo?.lat,
          lng: _currentGeo?.lng,
          address: _currentGeo?.address,
          store_name: storeName,
          image1: all[0],
          image2: all[1],
        })
        Toast.success('Check-in thành công!')
        closeModal()
        await refreshToday()
      } catch (e) {
        const errEl = document.getElementById('ci-modal-error')
        errEl.textContent = e.message || 'Lỗi khi check-in'
        errEl.classList.remove('hidden')
        btn.disabled = false
        btn.innerHTML = '<i class="fas fa-sign-in-alt mr-1"></i>Xác nhận'
      }
    }
  }

  // ── Check-out flow ───────────────────────────
  async function doCheckout(sessionId) {
    await fetchGeo('purple')

    const salesHtml = renderSalesInputs(_products)
    const giftsHtml = _gifts.length > 0 ? renderGiftInputs(_gifts) : ''

    const { close: closeModal } = Modal.create(`
      <div class="p-5 max-h-[85vh] overflow-y-auto">
        <h3 class="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
          <i class="fas fa-sign-out-alt text-purple-600"></i>Check-out
        </h3>
        <p class="text-xs text-gray-400 mb-4">Nhập kết quả cửa hàng bán được và chụp ảnh</p>

        <!-- Tồn kho 3 sản phẩm -->
        <div class="mb-4">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-boxes mr-1 text-orange-500"></i>Tồn kho
            <span class="text-xs text-gray-400 font-normal ml-1">(số lượng còn lại tại điểm bán)</span>
          </label>
          <div class="space-y-2">
            <div class="flex items-center gap-3 bg-orange-50 rounded-xl px-3 py-2.5 border border-orange-100">
              <span class="flex-1 text-sm font-medium text-gray-700 truncate">
                <i class="fas fa-wine-bottle mr-1.5 text-orange-400 text-xs"></i>White Horse
                <span class="text-gray-400 text-xs">(gói)</span>
              </span>
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <button type="button" onclick="CheckinModule._decQty('stock_wh')"
                  class="w-7 h-7 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg font-bold text-base
                         flex items-center justify-center transition-colors">−</button>
                <input type="number" id="stock_wh" value="0" min="0"
                  class="w-14 text-center text-sm font-bold border border-orange-200 rounded-lg py-1 bg-white
                         focus:ring-2 focus:ring-orange-300 outline-none" />
                <button type="button" onclick="CheckinModule._incQty('stock_wh')"
                  class="w-7 h-7 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg font-bold text-base
                         flex items-center justify-center transition-colors">+</button>
              </div>
            </div>
            <div class="flex items-center gap-3 bg-orange-50 rounded-xl px-3 py-2.5 border border-orange-100">
              <span class="flex-1 text-sm font-medium text-gray-700 truncate">
                <i class="fas fa-wine-bottle mr-1.5 text-orange-400 text-xs"></i>White Horse Demi
                <span class="text-gray-400 text-xs">(gói)</span>
              </span>
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <button type="button" onclick="CheckinModule._decQty('stock_whd')"
                  class="w-7 h-7 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg font-bold text-base
                         flex items-center justify-center transition-colors">−</button>
                <input type="number" id="stock_whd" value="0" min="0"
                  class="w-14 text-center text-sm font-bold border border-orange-200 rounded-lg py-1 bg-white
                         focus:ring-2 focus:ring-orange-300 outline-none" />
                <button type="button" onclick="CheckinModule._incQty('stock_whd')"
                  class="w-7 h-7 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg font-bold text-base
                         flex items-center justify-center transition-colors">+</button>
              </div>
            </div>
            <div class="flex items-center gap-3 bg-orange-50 rounded-xl px-3 py-2.5 border border-orange-100">
              <span class="flex-1 text-sm font-medium text-gray-700 truncate">
                <i class="fas fa-wine-bottle mr-1.5 text-orange-400 text-xs"></i>Leopard
                <span class="text-gray-400 text-xs">(gói)</span>
              </span>
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <button type="button" onclick="CheckinModule._decQty('stock_lp')"
                  class="w-7 h-7 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg font-bold text-base
                         flex items-center justify-center transition-colors">−</button>
                <input type="number" id="stock_lp" value="0" min="0"
                  class="w-14 text-center text-sm font-bold border border-orange-200 rounded-lg py-1 bg-white
                         focus:ring-2 focus:ring-orange-300 outline-none" />
                <button type="button" onclick="CheckinModule._incQty('stock_lp')"
                  class="w-7 h-7 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg font-bold text-base
                         flex items-center justify-center transition-colors">+</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Doanh số sản phẩm -->
        <div class="mb-4">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-clipboard-list mr-1 text-blue-500"></i>Doanh số <span class="text-red-500">*</span>
            <span class="text-xs text-gray-400 font-normal ml-1">(có thể nhập 0 nếu chưa bán được)</span>
          </label>
          <div class="space-y-2">${salesHtml}</div>
        </div>

        <!-- Quà tặng -->
        ${giftsHtml ? `
        <div class="mb-4">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-gift mr-1 text-amber-500"></i>Quà tặng
            <span class="text-xs text-gray-400 font-normal ml-1">(không bắt buộc)</span>
          </label>
          <div class="space-y-2">${giftsHtml}</div>
        </div>` : ''}

        <!-- Ghi chú -->
        <div class="mb-4">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">
            <i class="fas fa-sticky-note mr-1 text-amber-500"></i>Ghi chú
          </label>
          <textarea id="co-notes" rows="2"
            placeholder="Nhập ghi chú (không bắt buộc)..."
            class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none
                   focus:ring-2 focus:ring-amber-400 resize-none"></textarea>
        </div>

        <!-- Ảnh check-out -->
        <div class="mb-4">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">
            <i class="fas fa-camera mr-1 text-purple-500"></i>Ảnh check-out <span class="text-red-500">*</span>
            <span class="text-xs text-gray-400 font-normal ml-1">(chụp đủ 2 ảnh)</span>
          </label>
          <div id="checkout-photo-grid" class="grid grid-cols-2 gap-3"></div>
        </div>

        <!-- Địa chỉ GPS -->
        <p class="text-xs text-gray-400 mb-4 flex items-start gap-1.5 bg-gray-50 rounded-xl px-3 py-2">
          <i class="fas fa-map-marker-alt text-purple-400 mt-0.5 flex-shrink-0"></i>
          <span>${_currentGeo?.address || 'Chưa xác định'}</span>
        </p>

        <p id="co-modal-error" class="text-red-500 text-sm text-center mb-2 hidden"></p>
        <div class="flex gap-3 sticky bottom-0 bg-white pt-2 pb-1">
          <button id="co-modal-cancel"
            class="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium">Hủy</button>
          <button id="co-modal-submit"
            class="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm">
            <i class="fas fa-sign-out-alt mr-1"></i>Xác nhận
          </button>
        </div>
      </div>
    `, { persistent: true })

    const grid = Camera.createPhotoGrid(
      document.getElementById('checkout-photo-grid'),
      2, { allowGallery: true }, () => {}, null, makeGetGeo()
    )

    document.getElementById('co-modal-cancel').onclick = closeModal
    document.getElementById('co-modal-submit').onclick = async () => {
      const all = grid.getAll()
      const errEl = document.getElementById('co-modal-error')

      // Validate ảnh
      if (!all[0] || !all[1]) {
        errEl.textContent = 'Vui lòng chụp đủ 2 ảnh check-out'
        errEl.classList.remove('hidden')
        return
      }

      // Collect sales
      const salesData = collectSales(_products)

      const giftsData = collectGifts(_gifts)
      const notes = document.getElementById('co-notes')?.value.trim() || null

      // Collect tồn kho
      const stockWh  = Math.max(0, parseInt(document.getElementById('stock_wh')?.value || 0))
      const stockWhd = Math.max(0, parseInt(document.getElementById('stock_whd')?.value || 0))
      const stockLp  = Math.max(0, parseInt(document.getElementById('stock_lp')?.value || 0))

      const btn = document.getElementById('co-modal-submit')
      btn.disabled = true
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Đang lưu...'

      try {
        // Kiểm tra ảnh check-in từ backend
        await API.checkinEnd({
          lat: _currentGeo?.lat,
          lng: _currentGeo?.lng,
          address: _currentGeo?.address,
          image1: all[0],
          image2: all[1],
          notes: notes,
          sales: salesData,
          gifts: giftsData,
          stock_white_horse: stockWh || null,
          stock_white_horse_demi: stockWhd || null,
          stock_leopard: stockLp || null,
        })
        Toast.success('Check-out thành công!')
        closeModal()
        await refreshToday()
      } catch (e) {
        errEl.textContent = e.message || 'Lỗi khi check-out'
        errEl.classList.remove('hidden')
        btn.disabled = false
        btn.innerHTML = '<i class="fas fa-sign-out-alt mr-1"></i>Xác nhận'
      }
    }
  }

  // ── Render một session card ──────────────────
  function renderSessionCard(s, idx) {
    const isActive = s.status === 'checkin'
    const borderColor = isActive ? 'border-yellow-200' : 'border-green-100'
    const headerBg    = isActive ? 'from-yellow-50 to-amber-50' : 'from-green-50 to-emerald-50'

    // Sales summary
    const salesSummary = s.sales && s.sales.length > 0
      ? s.sales.filter(x => x.quantity > 0)
          .map(x => `<span class="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">${x.product_name}: ${x.quantity}</span>`)
          .join(' ')
      : ''
    const giftSummary = s.gifts && s.gifts.length > 0
      ? s.gifts.filter(x => x.quantity > 0)
          .map(x => `<span class="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">🎁 ${x.gift_name}: ${x.quantity}</span>`)
          .join(' ')
      : ''

    return `
    <div class="bg-white rounded-2xl shadow-md border ${borderColor} overflow-hidden">
      <!-- Header session -->
      <div class="bg-gradient-to-r ${headerBg} px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 bg-white/70 rounded-lg flex items-center justify-center text-xs font-bold
                       ${isActive ? 'text-yellow-700' : 'text-green-700'}">${idx + 1}</span>
          <div>
            <p class="font-bold text-sm ${isActive ? 'text-yellow-800' : 'text-green-800'} leading-tight">
              <i class="fas fa-store mr-1 text-xs"></i>${s.store_name || 'Điểm bán'}
            </p>
            <p class="text-xs ${isActive ? 'text-yellow-600' : 'text-green-600'}">
              ${formatTime(s.checkin_time)}${s.checkout_time ? ' → ' + formatTime(s.checkout_time) : ' → ...'}
            </p>
          </div>
        </div>
        ${getStatusBadge(s.status)}
      </div>

      <div class="p-4 space-y-3">

        <!-- Địa chỉ -->
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="bg-blue-50 rounded-xl p-2 border border-blue-100">
            <p class="text-blue-400 font-semibold mb-0.5 uppercase tracking-wide text-[10px]">
              <i class="fas fa-sign-in-alt mr-0.5"></i>Check-in
            </p>
            <p class="text-blue-700 font-bold text-sm">${formatTime(s.checkin_time)}</p>
            <p class="text-blue-400 mt-0.5 line-clamp-2">${s.checkin_address || '--'}</p>
          </div>
          <div class="bg-purple-50 rounded-xl p-2 border border-purple-100">
            <p class="text-purple-400 font-semibold mb-0.5 uppercase tracking-wide text-[10px]">
              <i class="fas fa-sign-out-alt mr-0.5"></i>Check-out
            </p>
            <p class="text-purple-700 font-bold text-sm">${s.checkout_time ? formatTime(s.checkout_time) : '--:--'}</p>
            <p class="text-purple-400 mt-0.5 line-clamp-2">${s.checkout_address || '--'}</p>
          </div>
        </div>

        <!-- Sales summary (khi đã checkout) -->
        ${!isActive && (salesSummary || giftSummary) ? `
        <div class="bg-gray-50 rounded-xl px-3 py-2 space-y-1">
          ${salesSummary ? `<div class="flex flex-wrap gap-1">${salesSummary}</div>` : ''}
          ${giftSummary ? `<div class="flex flex-wrap gap-1">${giftSummary}</div>` : ''}
        </div>` : ''}

        <!-- Nút check-out -->
        ${isActive ? `
        <button onclick="CheckinModule.doCheckoutById(${s.id})"
          class="w-full py-3.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white
                 rounded-2xl font-bold text-base flex items-center justify-center gap-2
                 transition-transform shadow-lg shadow-purple-200">
          <i class="fas fa-sign-out-alt"></i><span>CHECK OUT</span>
        </button>` : ''}
      </div>
    </div>`
  }

  // ── Render tất cả sessions hôm nay ──────────
  function renderSessions(sessions) {
    const btnArea    = document.getElementById('ci-new-btn-area')
    const listEl     = document.getElementById('ci-sessions-list')
    if (!listEl || !btnArea) return

    // Kiểm tra còn lượt đang checkin chưa?
    const hasActive = sessions.some(s => s.status === 'checkin')

    // Nút check-in mới - chỉ hiện khi không có lượt đang active
    if (hasActive) {
      btnArea.innerHTML = `
        <div class="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <i class="fas fa-exclamation-circle text-yellow-500 text-xl flex-shrink-0"></i>
          <div>
            <p class="text-sm font-semibold text-yellow-800">Đang có lượt check-in chưa hoàn thành</p>
            <p class="text-xs text-yellow-600">Vui lòng check-out điểm hiện tại trước</p>
          </div>
        </div>`
    } else {
      btnArea.innerHTML = `
        <button id="btn-do-checkin"
          class="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white
                 rounded-2xl font-bold text-lg flex items-center justify-center gap-3
                 transition-transform shadow-lg shadow-blue-200">
          <i class="fas fa-map-marker-alt text-xl"></i><span>CHECK IN MỚI</span>
        </button>`
      document.getElementById('btn-do-checkin').onclick = doCheckin
    }

    // Render session cards
    if (sessions.length === 0) {
      listEl.innerHTML = `
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <i class="fas fa-inbox text-3xl text-gray-200 mb-2 block"></i>
          <p class="text-gray-400 text-sm">Chưa có lượt check-in hôm nay</p>
        </div>`
    } else {
      listEl.innerHTML = sessions.map((s, i) => renderSessionCard(s, i)).join('')
    }
  }

  // ── doCheckoutById (gọi từ nút trong card) ──
  async function doCheckoutById(sessionId) {
    // Vì backend lấy lượt đang active nhất của today, không cần truyền sessionId cụ thể
    await doCheckout(sessionId)
  }

  // ── Refresh today ────────────────────────────
  async function refreshToday() {
    try {
      const res = await API.getToday()
      _sessions = res.data || []
      renderSessions(_sessions)
    } catch (e) {
      console.error('Load today error:', e)
      const listEl = document.getElementById('ci-sessions-list')
      if (listEl) listEl.innerHTML = '<p class="text-center text-red-400 text-sm py-4">Không tải được dữ liệu</p>'
    }
  }

  // ── Load products & gifts ────────────────────
  async function loadProductsGifts() {
    try {
      const [pRes, gRes] = await Promise.all([
        API.getProducts(),
        API.getGifts(),
      ])
      _products = pRes.data || []
      _gifts    = gRes.data || []
    } catch (e) {
      console.warn('Không tải được danh sách sản phẩm/quà tặng:', e.message)
      _products = []
      _gifts    = []
    }
  }

  // ── Lịch sử ─────────────────────────────────
  async function loadHistory() {
    const listEl = document.getElementById('ci-history-list')
    if (!listEl) return
    try {
      const res = await API.getHistory(1, 10)
      const data = res.data || []
      if (data.length === 0) {
        listEl.innerHTML = `
          <p class="text-center text-gray-300 text-sm py-6">
            <i class="fas fa-inbox text-2xl mb-2 block"></i>Chưa có lịch sử
          </p>`
        return
      }
      listEl.innerHTML = data.map(r => `
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer
                    active:bg-gray-100 transition-colors"
             onclick="CheckinModule.showHistoryDetail(${r.id})">
          <div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
            ${r.status === 'checkout' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}">
            <i class="fas ${r.status === 'checkout' ? 'fa-check' : 'fa-clock'} text-sm"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-800 text-sm">${r.date}${r.store_name ? ' · ' + r.store_name : ''}</p>
            <p class="text-xs text-gray-400 mt-0.5">
              <i class="fas fa-sign-in-alt mr-1 text-blue-300"></i>${r.checkin_time ? formatTime(r.checkin_time) : '--'}
              <i class="fas fa-arrow-right mx-1 text-gray-200"></i>
              <i class="fas fa-sign-out-alt mr-1 text-purple-300"></i>${r.checkout_time ? formatTime(r.checkout_time) : '--'}
            </p>
          </div>
          <div class="text-right flex-shrink-0">
            ${r.sales_quantity != null ? `<p class="text-xs font-bold text-green-600">${r.sales_quantity} SP</p>` : ''}
            <i class="fas fa-chevron-right text-gray-200 text-xs mt-1"></i>
          </div>
        </div>
      `).join('')
    } catch {
      listEl.innerHTML = '<p class="text-center text-gray-300 text-sm py-4">Không tải được lịch sử</p>'
    }
  }

  // ── Chi tiết lịch sử ────────────────────────
  async function showHistoryDetail(id) {
    try {
      const res = await API.getCheckinDetail(id)
      const r = res.data
      if (!r) return

      const imgSrc = (r2key, b64) => API.imageUrl(r2key || b64)
      const imgThumb = (label, r2key, b64) => {
        const src = imgSrc(r2key, b64)
        return src
        ? `<div>
             <p class="text-xs text-gray-400 mb-1">${label}</p>
             <img src="${src}" class="w-full rounded-xl cursor-pointer aspect-square object-cover"
                  onclick="Modal.image('${src}')" />
           </div>`
        : `<div class="aspect-square bg-gray-50 rounded-xl border border-dashed border-gray-200
                       flex items-center justify-center">
             <p class="text-xs text-gray-300">${label}</p>
           </div>`
      }

      const salesDetail = r.sales && r.sales.length > 0
        ? r.sales.filter(s => s.quantity > 0).map(s =>
            `<div class="flex justify-between text-sm py-1 border-b border-gray-50">
               <span class="text-gray-600">${s.product_name}</span>
               <span class="font-bold text-blue-700">${s.quantity} ${s.unit || ''}</span>
             </div>`).join('')
        : '<p class="text-xs text-gray-400">Chưa nhập</p>'

      const giftsDetail = r.gifts && r.gifts.length > 0
        ? r.gifts.filter(g => g.quantity > 0).map(g =>
            `<div class="flex justify-between text-sm py-1 border-b border-gray-50">
               <span class="text-gray-600">🎁 ${g.gift_name}</span>
               <span class="font-bold text-amber-700">${g.quantity} ${g.unit || ''}</span>
             </div>`).join('')
        : ''

      Modal.create(`
        <div class="p-5 max-h-[80vh] overflow-y-auto">
          <h3 class="text-base font-bold text-gray-800 mb-1">
            <i class="fas fa-calendar-day mr-2 text-blue-500"></i>${r.date}
            ${r.store_name ? `<span class="text-sm font-normal text-gray-400 ml-1">· ${r.store_name}</span>` : ''}
          </h3>
          <p class="mb-4">${getStatusBadge(r.status)}</p>

          <div class="grid grid-cols-2 gap-2 mb-3">
            <div class="bg-blue-50 rounded-xl p-3 text-center">
              <p class="text-xs text-blue-400">Check-in</p>
              <p class="font-bold text-blue-700">${formatTime(r.checkin_time)}</p>
              <p class="text-xs text-blue-400 mt-0.5 line-clamp-2">${r.checkin_address || '--'}</p>
            </div>
            <div class="bg-purple-50 rounded-xl p-3 text-center">
              <p class="text-xs text-purple-400">Check-out</p>
              <p class="font-bold text-purple-700">${formatTime(r.checkout_time)}</p>
              <p class="text-xs text-purple-400 mt-0.5 line-clamp-2">${r.checkout_address || '--'}</p>
            </div>
          </div>

          <!-- Doanh số -->
          <div class="bg-blue-50 rounded-xl p-3 mb-3">
            <p class="text-xs font-semibold text-blue-700 mb-2 uppercase">Doanh số</p>
            ${salesDetail}
          </div>

          ${giftsDetail ? `
          <div class="bg-amber-50 rounded-xl p-3 mb-3">
            <p class="text-xs font-semibold text-amber-700 mb-2 uppercase">Quà tặng</p>
            ${giftsDetail}
          </div>` : ''}

          ${r.notes ? `
          <div class="bg-gray-50 rounded-xl px-3 py-2 mb-3">
            <p class="text-xs text-gray-400"><i class="fas fa-sticky-note mr-1"></i>${r.notes}</p>
          </div>` : ''}

          <!-- Ảnh -->
          <div class="space-y-3">
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase mb-2">Ảnh Check-in</p>
              <div class="grid grid-cols-2 gap-2">
                ${imgThumb('Ảnh 1', r.checkin_image1_r2, r.checkin_image1)}
                ${imgThumb('Ảnh 2', r.checkin_image2_r2, r.checkin_image2)}
              </div>
            </div>
            ${r.checkout_time ? `
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase mb-2">Ảnh Check-out</p>
              <div class="grid grid-cols-2 gap-2">
                ${imgThumb('Ảnh 1', r.checkout_image1_r2, r.checkout_image1)}
                ${imgThumb('Ảnh 2', r.checkout_image2_r2, r.checkout_image2)}
              </div>
            </div>` : ''}
          </div>
        </div>
      `)
    } catch {
      Toast.error('Không tải được chi tiết')
    }
  }

  // ── Đồng hồ ─────────────────────────────────
  function startLiveClock() {
    function tick() {
      const el = document.getElementById('ci-live-time')
      if (!el) return
      const now = new Date()
      const h = String(now.getHours()).padStart(2, '0')
      const m = String(now.getMinutes()).padStart(2, '0')
      const s = String(now.getSeconds()).padStart(2, '0')
      el.textContent = `${h}:${m}:${s}`
    }
    tick()
    setInterval(tick, 1000)
  }

  // ── Cập nhật banner cảnh báo hồ sơ ───────────
  function updateProfileWarnBanner() {
    const warnEl = document.getElementById('ci-profile-warn')
    if (!warnEl) return
    if (!_profileData) { warnEl.classList.add('hidden'); return }
    const missing = ProfileModule.getMissingFields(_profileData)
    if (missing.length === 0) {
      warnEl.classList.add('hidden')
    } else {
      warnEl.classList.remove('hidden')
      warnEl.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 cursor-pointer"
             onclick="App.navigate('profile')">
          <div class="flex items-start gap-3">
            <i class="fas fa-exclamation-triangle text-red-500 text-xl flex-shrink-0 mt-0.5"></i>
            <div class="flex-1">
              <p class="text-sm font-bold text-red-700">Hồ sơ chưa đầy đủ – Chưa thể check-in</p>
              <p class="text-xs text-red-500 mt-0.5">Còn thiếu: ${missing.join(', ')}</p>
              <p class="text-xs text-red-400 mt-1 flex items-center gap-1">
                <i class="fas fa-arrow-right"></i> Nhấn vào đây để cập nhật hồ sơ
              </p>
            </div>
          </div>
        </div>`
    }
  }

  // ── bindEvents ───────────────────────────────
  async function bindEvents() {
    // Hiện ngày hôm nay (giờ Việt Nam)
    const dateEl = document.getElementById('ci-date-display')
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('vi-VN', {
        weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
        timeZone: 'Asia/Ho_Chi_Minh'
      })
    }

    startLiveClock()

    // Load profile để kiểm tra hồ sơ
    try {
      _profileData = await ProfileModule.loadProfile()
      console.log('[Checkin] profileData loaded:', _profileData)
    } catch (e) {
      console.error('[Checkin] loadProfile error:', e)
      _profileData = null
    }
    updateProfileWarnBanner()

    // Load parallel
    await Promise.all([loadProductsGifts(), refreshToday()])
    await loadHistory()
  }

  return {
    renderPage,
    bindEvents,
    showHistoryDetail,
    doCheckoutById,
    _incQty,
    _decQty,
  }
})()
