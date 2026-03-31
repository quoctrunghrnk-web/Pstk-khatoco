// =============================================
// Module: Check-in / Check-out
// =============================================
window.CheckinModule = (() => {

  let _todayRecord   = null
  let _currentGeo    = null   // GPS lấy 1 lần, dùng chung cả session
  let _activityGrid  = null   // tham chiếu photo grid hoạt động
  let _activityInited = false // tránh init grid 2 lần

  // ── Helpers ─────────────────────────────────
  function formatTime(isoStr) {
    if (!isoStr) return '--:--'
    try {
      const d = new Date(isoStr)
      return d.toLocaleTimeString('vi-VN', {
        hour: '2-digit', minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh'
      })
    } catch { return '--:--' }
  }

  function getStatusBadge(status) {
    if (!status) return '<span class="text-gray-400 text-sm">Chưa check-in</span>'
    if (status === 'checkin')
      return '<span class="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">Đang làm việc</span>'
    return '<span class="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">Đã check-out</span>'
  }

  // ── renderPage ──────────────────────────────
  function renderPage() {
    return `
    <div class="pb-28">
      <!-- Header -->
      <div class="bg-gradient-to-br from-green-700 to-green-900 text-white px-4 pt-12 pb-20">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-2">
            <img src="https://nhankiet.vn/uploads/01_Logo/Logo%20khong%20nen.jpg" alt="Nhân Kiệt"
              class="w-8 h-8 object-contain rounded-lg bg-white/15 p-0.5 flex-shrink-0" />
            <h2 class="text-xl font-bold">Check-in / Check-out</h2>
          </div>
          <span id="ci-live-time" class="text-green-200 text-sm font-mono"></span>
        </div>
        <p class="text-green-200 text-sm" id="ci-date-display">Đang tải...</p>
      </div>

      <div class="px-4 -mt-12 space-y-4">

        <!-- ── Card trạng thái hôm nay ── -->
        <div class="bg-white rounded-2xl shadow-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-800">Hôm nay</h3>
            <span id="ci-status-badge">
              <i class="fas fa-spinner fa-spin text-gray-300"></i>
            </span>
          </div>

          <!-- Giờ check-in / check-out -->
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div class="bg-blue-50 rounded-xl p-3 text-center">
              <p class="text-xs text-blue-500 mb-1">
                <i class="fas fa-sign-in-alt mr-1"></i>Check-in
              </p>
              <p id="ci-time-in" class="text-2xl font-bold text-blue-700">--:--</p>
              <p id="ci-addr-in" class="text-xs text-blue-400 mt-1 line-clamp-2">--</p>
            </div>
            <div class="bg-purple-50 rounded-xl p-3 text-center">
              <p class="text-xs text-purple-500 mb-1">
                <i class="fas fa-sign-out-alt mr-1"></i>Check-out
              </p>
              <p id="ci-time-out" class="text-2xl font-bold text-purple-700">--:--</p>
              <p id="ci-addr-out" class="text-xs text-purple-400 mt-1 line-clamp-2">--</p>
            </div>
          </div>

          <!-- Nút hành động -->
          <div id="ci-actions">
            <div class="flex items-center justify-center h-14">
              <i class="fas fa-spinner fa-spin text-gray-300 text-2xl"></i>
            </div>
          </div>
        </div>

        <!-- ── Card: Số lượng bán & ghi chú ── -->
        <div id="ci-sales-card" class="hidden bg-white rounded-2xl shadow p-4">
          <h3 class="font-semibold text-gray-800 mb-3">
            <i class="fas fa-clipboard-list mr-2 text-green-500"></i>Kết quả bán hàng
          </h3>

          <!-- Form nhập khi đang check-in -->
          <div id="ci-sales-inputs" class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">
                <i class="fas fa-box mr-1 text-gray-400"></i>Số lượng bán được
              </label>
              <input type="number" id="ci-sales-qty-input" min="0" value="0"
                class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none
                       focus:ring-2 focus:ring-green-500 bg-gray-50" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">
                <i class="fas fa-sticky-note mr-1 text-gray-400"></i>Ghi chú
              </label>
              <textarea id="ci-notes-input" rows="2"
                placeholder="Nhập ghi chú (không bắt buộc)..."
                class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none
                       focus:ring-2 focus:ring-green-500 bg-gray-50 resize-none"></textarea>
            </div>
          </div>

          <!-- Hiển thị readonly sau checkout -->
          <div id="ci-sales-readonly" class="hidden space-y-2">
            <div class="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2">
              <i class="fas fa-box text-green-500"></i>
              <span class="text-sm text-gray-600">Số lượng bán:</span>
              <span id="ci-sales-qty-display" class="font-bold text-green-700 ml-auto">0</span>
            </div>
            <div id="ci-notes-readonly-row" class="hidden">
              <div class="flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <i class="fas fa-sticky-note text-gray-400 mt-0.5 flex-shrink-0"></i>
                <span id="ci-notes-display" class="text-sm text-gray-600 break-words"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Card: Ảnh hoạt động bán hàng ── -->
        <div id="ci-activity-section" class="hidden bg-white rounded-2xl shadow p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-800">
              <i class="fas fa-images mr-2 text-orange-500"></i>Ảnh hoạt động
            </h3>
            <span id="ci-activity-label" class="text-xs text-gray-400">Tối đa 4 ảnh</span>
          </div>
          <!-- Grid 4 slot ảnh — không thay thế, chỉ khởi tạo 1 lần -->
          <div id="activity-photo-grid" class="grid grid-cols-2 gap-2 mb-3"></div>
          <button id="btn-save-activity"
            class="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl
                   text-sm font-medium hidden">
            <i class="fas fa-save mr-1"></i>Lưu ảnh hoạt động
          </button>
        </div>

        <!-- ── Lịch sử ── -->
        <div class="bg-white rounded-2xl shadow p-4">
          <h3 class="font-semibold text-gray-800 mb-3">
            <i class="fas fa-history mr-2 text-gray-400"></i>Lịch sử gần đây
          </h3>
          <div id="ci-history-list" class="space-y-2">
            <p class="text-center text-gray-300 text-sm py-4">
              <i class="fas fa-spinner fa-spin"></i>
            </p>
          </div>
        </div>

      </div>
    </div>
    `
  }

  // ── Lấy GPS một lần ─────────────────────────
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
      Toast.warning('Không lấy được GPS: ' + e.message)
      _currentGeo = { lat: null, lng: null, address: 'Khong xac dinh vi tri' }
    } finally {
      close()
    }
    return _currentGeo
  }

  // GPS sync getter cho photo grid
  function makeGetGeo() {
    return () => _currentGeo
  }

  // ── Check-in flow ────────────────────────────
  async function doCheckin() {
    await fetchGeo('blue')

    const { close: closeModal } = Modal.create(`
      <div class="p-5">
        <h3 class="text-lg font-bold text-gray-800 mb-1">
          <i class="fas fa-camera mr-2 text-blue-600"></i>Ảnh Check-in
        </h3>
        <p class="text-sm text-gray-400 mb-3">Chụp 2 ảnh xác nhận vị trí</p>
        <div id="checkin-photo-grid" class="grid grid-cols-2 gap-3 mb-3"></div>
        <p class="text-xs text-gray-400 mb-4 flex items-start gap-1">
          <i class="fas fa-map-marker-alt text-blue-400 mt-0.5 flex-shrink-0"></i>
          <span>${_currentGeo.address || 'Chưa xác định vị trí'}</span>
        </p>
        <p id="ci-modal-error" class="text-red-500 text-sm text-center mb-2 hidden"></p>
        <div class="flex gap-3">
          <button id="ci-modal-cancel" class="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm">Hủy</button>
          <button id="ci-modal-submit" class="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm">
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
      const all = grid.getAll()
      if (!all[0] || !all[1]) {
        const errEl = document.getElementById('ci-modal-error')
        errEl.textContent = 'Vui lòng chụp đủ 2 ảnh'
        errEl.classList.remove('hidden')
        return
      }
      const btn = document.getElementById('ci-modal-submit')
      btn.disabled = true
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Đang lưu...'
      try {
        await API.checkinStart({
          lat: _currentGeo?.lat, lng: _currentGeo?.lng,
          address: _currentGeo?.address,
          image1: all[0], image2: all[1],
        })
        Toast.success('Check-in thành công!')
        closeModal()
        _activityInited = false   // reset để init lại grid hoạt động
        await refreshToday()
      } catch (e) {
        Toast.error(e.message)
        btn.disabled = false
        btn.innerHTML = '<i class="fas fa-sign-in-alt mr-1"></i>Xác nhận'
      }
    }
  }

  // ── Check-out flow ───────────────────────────
  async function doCheckout() {
    await fetchGeo('purple')

    const salesQty = Math.max(0, parseInt(document.getElementById('ci-sales-qty-input')?.value) || 0)
    const notes    = document.getElementById('ci-notes-input')?.value.trim() || null

    const { close: closeModal } = Modal.create(`
      <div class="p-5">
        <h3 class="text-lg font-bold text-gray-800 mb-1">
          <i class="fas fa-camera mr-2 text-purple-600"></i>Ảnh Check-out
        </h3>
        <p class="text-sm text-gray-400 mb-3">Chụp 2 ảnh xác nhận kết thúc</p>
        <div id="checkout-photo-grid" class="grid grid-cols-2 gap-3 mb-3"></div>

        <div class="bg-gray-50 rounded-xl p-3 mb-4 space-y-1">
          <p class="text-xs text-gray-600">
            <i class="fas fa-box mr-1 text-green-500"></i>
            Số lượng bán: <b class="text-gray-800">${salesQty}</b>
          </p>
          ${notes ? `<p class="text-xs text-gray-600"><i class="fas fa-sticky-note mr-1 text-gray-400"></i>${notes}</p>` : ''}
        </div>

        <p class="text-xs text-gray-400 mb-4 flex items-start gap-1">
          <i class="fas fa-map-marker-alt text-purple-400 mt-0.5 flex-shrink-0"></i>
          <span>${_currentGeo.address || 'Chưa xác định'}</span>
        </p>
        <p id="co-modal-error" class="text-red-500 text-sm text-center mb-2 hidden"></p>
        <div class="flex gap-3">
          <button id="co-modal-cancel" class="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm">Hủy</button>
          <button id="co-modal-submit" class="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-medium text-sm">
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
      if (!all[0] || !all[1]) {
        const errEl = document.getElementById('co-modal-error')
        errEl.textContent = 'Vui lòng chụp đủ 2 ảnh'
        errEl.classList.remove('hidden')
        return
      }
      const btn = document.getElementById('co-modal-submit')
      btn.disabled = true
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Đang lưu...'
      try {
        await API.checkinEnd({
          lat: _currentGeo?.lat, lng: _currentGeo?.lng,
          address: _currentGeo?.address,
          image1: all[0], image2: all[1],
          sales_quantity: salesQty,
          notes: notes,
        })
        Toast.success('Check-out thành công!')
        closeModal()
        _activityInited = false   // reset grid để render readonly
        await refreshToday()
      } catch (e) {
        Toast.error(e.message)
        btn.disabled = false
        btn.innerHTML = '<i class="fas fa-sign-out-alt mr-1"></i>Xác nhận'
      }
    }
  }

  // ── Khởi tạo activity grid ───────────────────
  // Lần đầu: tạo grid mới
  // Lần sau (đã init): chỉ cập nhật ảnh qua setPhotos()
  function initActivityGrid(existingImages, readonly) {
    const container = document.getElementById('activity-photo-grid')
    const saveBtn   = document.getElementById('btn-save-activity')
    if (!container) return

    const photos = [
      existingImages?.[0] ?? null,
      existingImages?.[1] ?? null,
      existingImages?.[2] ?? null,
      existingImages?.[3] ?? null,
    ]

    // Nếu grid đã tạo rồi và không có ảnh pending chưa lưu:
    // chỉ cập nhật ảnh từ server, không tạo lại
    if (_activityInited && _activityGrid) {
      const saveBtn = document.getElementById('btn-save-activity')
      const hasPending = saveBtn && !saveBtn.classList.contains('hidden')
      // Nếu user đang có ảnh chưa lưu (nút save đang hiện) → giữ nguyên grid
      if (!hasPending) {
        _activityGrid.setPhotos(photos)
      }
      return
    }

    _activityInited = true

    if (readonly) {
      // Sau checkout: chỉ xem
      _activityGrid = Camera.createPhotoGrid(
        container, 4, { readonly: true }, null, photos
      )
      if (saveBtn) saveBtn.classList.add('hidden')

      // Cập nhật label
      const lbl = document.getElementById('ci-activity-label')
      if (lbl) lbl.textContent = 'Đã lưu'
    } else {
      // Đang check-in: có thể thêm/xóa ảnh
      _activityGrid = Camera.createPhotoGrid(
        container, 4, { allowGallery: true },
        (_changedPhotos) => {
          if (saveBtn) saveBtn.classList.remove('hidden')
        },
        photos, makeGetGeo()
      )

      // Bind nút lưu ngay khi khởi tạo grid
      if (saveBtn) {
        saveBtn.classList.add('hidden')   // ẩn ban đầu, chỉ hiện khi có ảnh mới
        saveBtn.onclick = async () => {
          if (!_activityGrid) return
          const all = _activityGrid.getAll()
          if (!all.some(Boolean)) { Toast.warning('Chưa có ảnh nào'); return }

          saveBtn.disabled = true
          saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Đang lưu...'
          try {
            await API.updateActivity({
              image1: all[0] || null,
              image2: all[1] || null,
              image3: all[2] || null,
              image4: all[3] || null,
            })
            Toast.success('Lưu ảnh hoạt động thành công!')
            saveBtn.classList.add('hidden')
            // Cập nhật _todayRecord để setPhotos() lần sau có ảnh đúng
            if (_todayRecord) {
              _todayRecord.activity_image1 = all[0] || _todayRecord.activity_image1
              _todayRecord.activity_image2 = all[1] || _todayRecord.activity_image2
              _todayRecord.activity_image3 = all[2] || _todayRecord.activity_image3
              _todayRecord.activity_image4 = all[3] || _todayRecord.activity_image4
            }
          } catch (e) {
            Toast.error(e.message)
          } finally {
            saveBtn.disabled = false
            saveBtn.innerHTML = '<i class="fas fa-save mr-1"></i>Lưu ảnh hoạt động'
          }
        }
      }
    }
  }

  // ── Refresh today ────────────────────────────
  async function refreshToday() {
    try {
      const res = await API.getToday()
      _todayRecord = res.data
      updateTodayUI(_todayRecord)
    } catch (e) {
      console.error('Load today error:', e)
    }
  }

  // ── updateTodayUI ────────────────────────────
  function updateTodayUI(record) {
    // Badge trạng thái
    const badgeEl = document.getElementById('ci-status-badge')
    if (badgeEl) badgeEl.innerHTML = getStatusBadge(record?.status)

    // Giờ + địa chỉ
    const setEl = (id, val) => {
      const el = document.getElementById(id)
      if (el) el.textContent = val
    }
    setEl('ci-time-in',  record ? formatTime(record.checkin_time)  : '--:--')
    setEl('ci-time-out', record?.checkout_time ? formatTime(record.checkout_time) : '--:--')
    setEl('ci-addr-in',  record?.checkin_address  || '--')
    setEl('ci-addr-out', record?.checkout_address || '--')

    // ── Nút hành động ──────────────────────────
    const actionsEl = document.getElementById('ci-actions')
    if (actionsEl) {
      if (!record) {
        actionsEl.innerHTML = `
          <button id="btn-do-checkin"
            class="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white
                   rounded-2xl font-bold text-lg flex items-center justify-center gap-3
                   transition-transform shadow-lg shadow-blue-200">
            <i class="fas fa-map-marker-alt text-xl"></i><span>CHECK IN</span>
          </button>`
        document.getElementById('btn-do-checkin').onclick = doCheckin

      } else if (record.status === 'checkin') {
        actionsEl.innerHTML = `
          <button id="btn-do-checkout"
            class="w-full py-4 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white
                   rounded-2xl font-bold text-lg flex items-center justify-center gap-3
                   transition-transform shadow-lg shadow-purple-200">
            <i class="fas fa-sign-out-alt text-xl"></i><span>CHECK OUT</span>
          </button>`
        document.getElementById('btn-do-checkout').onclick = doCheckout

      } else {
        actionsEl.innerHTML = `
          <div class="w-full py-3 bg-gray-50 text-gray-500 rounded-2xl font-medium text-center text-sm">
            <i class="fas fa-check-circle mr-2 text-green-500"></i>Đã hoàn thành hôm nay
          </div>`
      }
    }

    // ── Card số lượng + ghi chú ─────────────────
    const salesCard     = document.getElementById('ci-sales-card')
    const salesInputs   = document.getElementById('ci-sales-inputs')
    const salesReadonly = document.getElementById('ci-sales-readonly')

    if (salesCard) {
      if (!record) {
        salesCard.classList.add('hidden')

      } else if (record.status === 'checkin') {
        salesCard.classList.remove('hidden')
        if (salesInputs)   salesInputs.classList.remove('hidden')
        if (salesReadonly) salesReadonly.classList.add('hidden')

        const salesInput = document.getElementById('ci-sales-qty-input')
        const notesInput = document.getElementById('ci-notes-input')
        if (salesInput) {
          salesInput.disabled = false
          salesInput.value = record.sales_quantity ?? 0
        }
        if (notesInput) {
          notesInput.disabled = false
          notesInput.value = record.notes || ''
        }

      } else {
        // Đã checkout → readonly
        salesCard.classList.remove('hidden')
        if (salesInputs)   salesInputs.classList.add('hidden')
        if (salesReadonly) salesReadonly.classList.remove('hidden')

        const qtyDisplay   = document.getElementById('ci-sales-qty-display')
        const notesDisplay = document.getElementById('ci-notes-display')
        const notesRow     = document.getElementById('ci-notes-readonly-row')

        if (qtyDisplay) qtyDisplay.textContent = record.sales_quantity ?? 0

        if (notesDisplay && notesRow) {
          if (record.notes) {
            notesDisplay.textContent = record.notes
            notesRow.classList.remove('hidden')
          } else {
            notesRow.classList.add('hidden')
          }
        }
      }
    }

    // ── Section ảnh hoạt động ──────────────────
    const activitySection = document.getElementById('ci-activity-section')
    if (activitySection) {
      if (!record) {
        activitySection.classList.add('hidden')
        _activityInited = false
        _activityGrid   = null
      } else {
        activitySection.classList.remove('hidden')

        const existingImages = [
          record.activity_image1 || null,
          record.activity_image2 || null,
          record.activity_image3 || null,
          record.activity_image4 || null,
        ]

        // initActivityGrid dùng flag _activityInited để không init lại nhiều lần
        const isReadonly = record.status === 'checkout'
        initActivityGrid(existingImages, isReadonly)
      }
    }
  }

  // ── Lịch sử ─────────────────────────────────
  async function loadHistory() {
    const listEl = document.getElementById('ci-history-list')
    if (!listEl) return
    try {
      const res = await API.getHistory(1, 7)
      if (!res.data || res.data.length === 0) {
        listEl.innerHTML = `
          <p class="text-center text-gray-300 text-sm py-6">
            <i class="fas fa-inbox text-2xl mb-2 block"></i>Chưa có lịch sử
          </p>`
        return
      }
      listEl.innerHTML = res.data.map(r => `
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer
                    active:bg-gray-100 transition-colors"
             onclick="CheckinModule.showHistoryDetail(${r.id})">
          <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
            ${r.status === 'checkout' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}">
            <i class="fas ${r.status === 'checkout' ? 'fa-check' : 'fa-clock'} text-sm"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-800 text-sm">${r.date}</p>
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

  // ── Chi tiết một ngày ────────────────────────
  async function showHistoryDetail(id) {
    try {
      const res = await API.getCheckinDetail(id)
      const r = res.data
      if (!r) return

      const imgThumb = (label, src) => src
        ? `<div>
             <p class="text-xs text-gray-400 mb-1">${label}</p>
             <img src="${src}" class="w-full rounded-xl cursor-pointer aspect-square object-cover"
                  onclick="Modal.image('${src}')" />
           </div>`
        : `<div class="aspect-square bg-gray-50 rounded-xl border border-dashed border-gray-200
                       flex items-center justify-center">
             <p class="text-xs text-gray-300">${label}</p>
           </div>`

      Modal.create(`
        <div class="p-5">
          <h3 class="text-lg font-bold text-gray-800 mb-1">
            <i class="fas fa-calendar-day mr-2 text-blue-500"></i>${r.date}
          </h3>
          <p class="text-xs text-gray-400 mb-4">${getStatusBadge(r.status)}</p>

          <div class="grid grid-cols-2 gap-2 mb-3">
            <div class="bg-blue-50 rounded-xl p-3 text-center">
              <p class="text-xs text-blue-400">Check-in</p>
              <p class="font-bold text-blue-700 text-lg">${formatTime(r.checkin_time)}</p>
              <p class="text-xs text-blue-400 mt-0.5 line-clamp-2">${r.checkin_address || '--'}</p>
            </div>
            <div class="bg-purple-50 rounded-xl p-3 text-center">
              <p class="text-xs text-purple-400">Check-out</p>
              <p class="font-bold text-purple-700 text-lg">${formatTime(r.checkout_time)}</p>
              <p class="text-xs text-purple-400 mt-0.5 line-clamp-2">${r.checkout_address || '--'}</p>
            </div>
          </div>

          <div class="bg-green-50 rounded-xl p-3 mb-3 space-y-1">
            <p class="text-sm">
              <i class="fas fa-box mr-1 text-green-500"></i>
              <span class="text-gray-600">Số lượng bán: </span>
              <b class="text-green-700">${r.sales_quantity ?? 0}</b>
            </p>
            ${r.notes ? `<p class="text-sm text-gray-600"><i class="fas fa-sticky-note mr-1 text-gray-400"></i>${r.notes}</p>` : ''}
          </div>

          <div class="space-y-3">
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase mb-2">Ảnh Check-in</p>
              <div class="grid grid-cols-2 gap-2">
                ${imgThumb('Ảnh 1', r.checkin_image1)}
                ${imgThumb('Ảnh 2', r.checkin_image2)}
              </div>
            </div>
            ${(r.activity_image1 || r.activity_image2 || r.activity_image3 || r.activity_image4) ? `
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase mb-2">Ảnh hoạt động</p>
              <div class="grid grid-cols-2 gap-2">
                ${imgThumb('HĐ 1', r.activity_image1)}
                ${imgThumb('HĐ 2', r.activity_image2)}
                ${imgThumb('HĐ 3', r.activity_image3)}
                ${imgThumb('HĐ 4', r.activity_image4)}
              </div>
            </div>` : ''}
            ${r.checkout_time ? `
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase mb-2">Ảnh Check-out</p>
              <div class="grid grid-cols-2 gap-2">
                ${imgThumb('Ảnh 1', r.checkout_image1)}
                ${imgThumb('Ảnh 2', r.checkout_image2)}
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
      const now = new Date(Date.now() + 7 * 60 * 60 * 1000)
      const h = String(now.getUTCHours()).padStart(2, '0')
      const m = String(now.getUTCMinutes()).padStart(2, '0')
      const s = String(now.getUTCSeconds()).padStart(2, '0')
      el.textContent = `${h}:${m}:${s}`
    }
    tick()
    setInterval(tick, 1000)
  }

  // ── bindEvents ───────────────────────────────
  async function bindEvents() {
    // Reset trạng thái grid khi vào trang
    _activityInited = false
    _activityGrid   = null

    // Hiện ngày hôm nay
    const dateEl = document.getElementById('ci-date-display')
    if (dateEl) {
      const now = new Date(Date.now() + 7 * 60 * 60 * 1000)
      dateEl.textContent = now.toLocaleDateString('vi-VN', {
        weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC'
      })
    }

    startLiveClock()
    await refreshToday()
    await loadHistory()
  }

  return { renderPage, bindEvents, showHistoryDetail }
})()
