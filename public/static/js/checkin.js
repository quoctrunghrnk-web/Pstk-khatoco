// =============================================
// Module: Check-in / Check-out
// =============================================
window.CheckinModule = (() => {

  let _todayRecord = null
  let _currentGeo = null

  function formatTime(isoStr) {
    if (!isoStr) return '--:--'
    try {
      const d = new Date(isoStr)
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })
    } catch { return '--:--' }
  }

  function formatDate(isoStr) {
    if (!isoStr) return ''
    try {
      const d = new Date(isoStr)
      return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch { return isoStr }
  }

  function getStatusBadge(status) {
    if (!status) return '<span class="text-gray-400">Chưa check-in</span>'
    if (status === 'checkin') return '<span class="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">Đang làm việc</span>'
    return '<span class="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">Đã check-out</span>'
  }

  function renderPage() {
    const now = new Date(Date.now() + 7 * 60 * 60 * 1000)
    const dateStr = now.toISOString().slice(0, 10)
    const user = Auth.getUser()

    return `
    <div class="pb-24">
      <!-- Header -->
      <div class="bg-gradient-to-br from-green-700 to-green-900 text-white px-4 pt-12 pb-20">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-xl font-bold">Check-in / Check-out</h2>
          <span id="ci-live-time" class="text-green-200 text-sm font-mono"></span>
        </div>
        <p class="text-green-200 text-sm" id="ci-date-display">Đang tải...</p>
      </div>

      <div class="px-4 -mt-12 space-y-4">
        <!-- Today status card -->
        <div class="bg-white rounded-2xl shadow-lg p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-800">Hôm nay</h3>
            <span id="ci-status-badge">...</span>
          </div>

          <!-- Time row -->
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="bg-blue-50 rounded-xl p-3 text-center">
              <p class="text-xs text-blue-600 mb-1"><i class="fas fa-sign-in-alt mr-1"></i>Check-in</p>
              <p id="ci-time-in" class="text-xl font-bold text-blue-700">--:--</p>
              <p id="ci-addr-in" class="text-xs text-blue-400 mt-1 truncate">--</p>
            </div>
            <div class="bg-purple-50 rounded-xl p-3 text-center">
              <p class="text-xs text-purple-600 mb-1"><i class="fas fa-sign-out-alt mr-1"></i>Check-out</p>
              <p id="ci-time-out" class="text-xl font-bold text-purple-700">--:--</p>
              <p id="ci-addr-out" class="text-xs text-purple-400 mt-1 truncate">--</p>
            </div>
          </div>

          <!-- Sales info (visible after checkout) -->
          <div id="ci-sales-info" class="hidden bg-green-50 rounded-xl p-3 mb-4">
            <p class="text-sm text-green-700 font-medium">
              <i class="fas fa-box mr-1"></i>Số lượng bán: <span id="ci-sales-qty" class="font-bold">0</span>
            </p>
            <p id="ci-notes-row" class="text-sm text-gray-600 mt-1 hidden">
              <i class="fas fa-sticky-note mr-1 text-gray-400"></i><span id="ci-notes-text"></span>
            </p>
          </div>

          <!-- Action buttons -->
          <div id="ci-actions" class="space-y-2">
            <div class="flex items-center justify-center h-16">
              <i class="fas fa-spinner fa-spin text-gray-400 text-2xl"></i>
            </div>
          </div>
        </div>

        <!-- Activity photos (show when checked in) -->
        <div id="ci-activity-section" class="hidden bg-white rounded-2xl shadow p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-800"><i class="fas fa-images mr-2 text-orange-500"></i>Ảnh hoạt động bán hàng</h3>
            <button id="btn-save-activity" class="text-sm bg-orange-500 text-white px-3 py-1.5 rounded-lg hidden">
              <i class="fas fa-save mr-1"></i>Lưu
            </button>
          </div>
          <div id="activity-photo-grid" class="grid grid-cols-2 gap-2"></div>
          <p class="text-xs text-gray-400 mt-2 text-center">Chụp tối đa 4 ảnh hoạt động bán hàng</p>
        </div>

        <!-- History -->
        <div class="bg-white rounded-2xl shadow p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-800"><i class="fas fa-history mr-2 text-gray-500"></i>Lịch sử</h3>
          </div>
          <div id="ci-history-list" class="space-y-2">
            <p class="text-center text-gray-400 text-sm py-4"><i class="fas fa-spinner fa-spin"></i></p>
          </div>
        </div>
      </div>
    </div>
    `
  }

  // ── Check-in flow ───────────────────────────

  async function doCheckin() {
    // Hiển thị loading + lấy GPS
    const { close } = Modal.create(`
      <div class="p-6 text-center">
        <i class="fas fa-map-marker-alt text-4xl text-blue-500 mb-3 animate-bounce"></i>
        <h3 class="font-bold text-gray-800 mb-2">Đang lấy vị trí...</h3>
        <p class="text-gray-500 text-sm">Vui lòng chờ</p>
      </div>
    `, { persistent: true })

    try {
      _currentGeo = await Geo.getPositionWithAddress()
      close()
    } catch (e) {
      close()
      Toast.warning('Không lấy được GPS: ' + e.message + '. Tiếp tục không có vị trí.')
      _currentGeo = { lat: null, lng: null, address: 'Không xác định' }
    }

    // Show photo capture modal
    let photos = [null, null]
    const { overlay, close: closeModal } = Modal.create(`
      <div class="p-5">
        <h3 class="text-lg font-bold text-gray-800 mb-1"><i class="fas fa-camera mr-2 text-blue-600"></i>Ảnh Check-in</h3>
        <p class="text-sm text-gray-500 mb-4">Chụp 2 ảnh xác nhận vị trí làm việc</p>
        <div id="checkin-photo-grid" class="grid grid-cols-2 gap-3 mb-4"></div>
        <p class="text-xs text-gray-400 mb-4 text-center">
          <i class="fas fa-map-marker-alt mr-1 text-blue-400"></i>
          ${_currentGeo.address || 'Chưa xác định vị trí'}
        </p>
        <p id="ci-modal-error" class="text-red-500 text-sm text-center mb-2 hidden"></p>
        <div class="flex gap-3">
          <button id="ci-modal-cancel" class="flex-1 py-2.5 border rounded-xl text-gray-700">Hủy</button>
          <button id="ci-modal-submit" class="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium">
            <i class="fas fa-sign-in-alt mr-1"></i>Check-in
          </button>
        </div>
      </div>
    `, { persistent: true })

    const grid = Camera.createPhotoGrid(
      document.getElementById('checkin-photo-grid'), 2,
      { geo: _currentGeo, address: _currentGeo?.address },
      (p) => { photos = p }
    )

    document.getElementById('ci-modal-cancel').onclick = closeModal
    document.getElementById('ci-modal-submit').onclick = async () => {
      const all = grid.getAll()
      if (!all[0] || !all[1]) {
        document.getElementById('ci-modal-error').textContent = 'Vui lòng chụp đủ 2 ảnh'
        document.getElementById('ci-modal-error').classList.remove('hidden')
        return
      }
      document.getElementById('ci-modal-submit').disabled = true
      document.getElementById('ci-modal-submit').innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Đang lưu...'
      try {
        await API.checkinStart({
          lat: _currentGeo?.lat, lng: _currentGeo?.lng,
          address: _currentGeo?.address,
          image1: all[0], image2: all[1]
        })
        Toast.success('Check-in thành công!')
        closeModal()
        await refreshToday()
      } catch (e) {
        Toast.error(e.message)
        document.getElementById('ci-modal-submit').disabled = false
        document.getElementById('ci-modal-submit').innerHTML = '<i class="fas fa-sign-in-alt mr-1"></i>Check-in'
      }
    }
  }

  // ── Check-out flow ──────────────────────────

  async function doCheckout() {
    // Lấy GPS
    const { close: closeGeo } = Modal.create(`
      <div class="p-6 text-center">
        <i class="fas fa-map-marker-alt text-4xl text-purple-500 mb-3 animate-bounce"></i>
        <h3 class="font-bold text-gray-800 mb-2">Đang lấy vị trí...</h3>
        <p class="text-gray-500 text-sm">Vui lòng chờ</p>
      </div>
    `, { persistent: true })

    try {
      _currentGeo = await Geo.getPositionWithAddress()
      closeGeo()
    } catch (e) {
      closeGeo()
      _currentGeo = { lat: null, lng: null, address: 'Không xác định' }
    }

    let photos = [null, null]
    const { overlay, close: closeModal } = Modal.create(`
      <div class="p-5">
        <h3 class="text-lg font-bold text-gray-800 mb-1"><i class="fas fa-camera mr-2 text-purple-600"></i>Ảnh Check-out</h3>
        <p class="text-sm text-gray-500 mb-4">Chụp 2 ảnh + nhập thông tin kết thúc</p>
        <div id="checkout-photo-grid" class="grid grid-cols-2 gap-3 mb-4"></div>
        <div class="space-y-3 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              <i class="fas fa-box mr-1 text-gray-400"></i>Số lượng bán được
            </label>
            <input type="number" id="co-sales" min="0" value="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              <i class="fas fa-sticky-note mr-1 text-gray-400"></i>Ghi chú
            </label>
            <textarea id="co-notes" rows="2" placeholder="Nhập ghi chú (không bắt buộc)"
              class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 resize-none"></textarea>
          </div>
        </div>
        <p class="text-xs text-gray-400 mb-4 text-center">
          <i class="fas fa-map-marker-alt mr-1 text-purple-400"></i>
          ${_currentGeo.address || 'Chưa xác định'}
        </p>
        <p id="co-modal-error" class="text-red-500 text-sm text-center mb-2 hidden"></p>
        <div class="flex gap-3">
          <button id="co-modal-cancel" class="flex-1 py-2.5 border rounded-xl text-gray-700">Hủy</button>
          <button id="co-modal-submit" class="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-medium">
            <i class="fas fa-sign-out-alt mr-1"></i>Check-out
          </button>
        </div>
      </div>
    `, { persistent: true })

    const grid = Camera.createPhotoGrid(
      document.getElementById('checkout-photo-grid'), 2,
      { geo: _currentGeo, address: _currentGeo?.address },
      (p) => { photos = p }
    )

    document.getElementById('co-modal-cancel').onclick = closeModal
    document.getElementById('co-modal-submit').onclick = async () => {
      const all = grid.getAll()
      if (!all[0] || !all[1]) {
        document.getElementById('co-modal-error').textContent = 'Vui lòng chụp đủ 2 ảnh'
        document.getElementById('co-modal-error').classList.remove('hidden')
        return
      }
      document.getElementById('co-modal-submit').disabled = true
      document.getElementById('co-modal-submit').innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Đang lưu...'
      try {
        await API.checkinEnd({
          lat: _currentGeo?.lat, lng: _currentGeo?.lng,
          address: _currentGeo?.address,
          image1: all[0], image2: all[1],
          sales_quantity: parseInt(document.getElementById('co-sales').value) || 0,
          notes: document.getElementById('co-notes').value.trim() || null,
        })
        Toast.success('Check-out thành công!')
        closeModal()
        await refreshToday()
      } catch (e) {
        Toast.error(e.message)
        document.getElementById('co-modal-submit').disabled = false
        document.getElementById('co-modal-submit').innerHTML = '<i class="fas fa-sign-out-alt mr-1"></i>Check-out'
      }
    }
  }

  // ── Refresh today ───────────────────────────

  async function refreshToday() {
    try {
      const res = await API.getToday()
      _todayRecord = res.data
      updateTodayUI(_todayRecord)
    } catch (e) {
      console.error('Load today error:', e)
    }
  }

  function updateTodayUI(record) {
    // Status badge
    document.getElementById('ci-status-badge').innerHTML = getStatusBadge(record?.status)

    // Times
    document.getElementById('ci-time-in').textContent = record ? formatTime(record.checkin_time) : '--:--'
    document.getElementById('ci-time-out').textContent = record?.checkout_time ? formatTime(record.checkout_time) : '--:--'
    document.getElementById('ci-addr-in').textContent = record?.checkin_address || '--'
    document.getElementById('ci-addr-out').textContent = record?.checkout_address || '--'

    // Sales info
    if (record?.status === 'checkout') {
      document.getElementById('ci-sales-info').classList.remove('hidden')
      document.getElementById('ci-sales-qty').textContent = record.sales_quantity || 0
      if (record.notes) {
        document.getElementById('ci-notes-row').classList.remove('hidden')
        document.getElementById('ci-notes-text').textContent = record.notes
      }
    }

    // Actions
    const actionsEl = document.getElementById('ci-actions')
    if (!record) {
      actionsEl.innerHTML = `
        <button id="btn-do-checkin" class="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-lg shadow-blue-200">
          <i class="fas fa-map-marker-alt text-xl"></i>
          <span>CHECK IN</span>
        </button>`
      document.getElementById('btn-do-checkin').onclick = doCheckin
    } else if (record.status === 'checkin') {
      actionsEl.innerHTML = `
        <button id="btn-do-checkout" class="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-lg shadow-purple-200">
          <i class="fas fa-sign-out-alt text-xl"></i>
          <span>CHECK OUT</span>
        </button>`
      document.getElementById('btn-do-checkout').onclick = doCheckout
    } else {
      actionsEl.innerHTML = `
        <div class="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-medium text-center">
          <i class="fas fa-check-circle mr-2 text-green-500"></i>Đã hoàn thành hôm nay
        </div>`
    }

    // Activity section
    if (record && record.status !== 'checkout') {
      document.getElementById('ci-activity-section').classList.remove('hidden')
    }

    // Pre-fill existing activity images
    if (record) {
      const grid = document.getElementById('activity-photo-grid')
      const existingImgs = [record.activity_image1, record.activity_image2, record.activity_image3, record.activity_image4]
      const hasExisting = existingImgs.some(Boolean)
      if (hasExisting && grid) {
        grid.innerHTML = existingImgs.map((img, i) => img
          ? `<div class="aspect-square rounded-xl overflow-hidden relative">
               <img src="${img}" class="w-full h-full object-cover cursor-pointer" onclick="Modal.image(this.src)" />
             </div>`
          : `<div class="aspect-square bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 text-gray-400">
               <div class="text-center"><i class="fas fa-camera text-xl mb-1"></i><p class="text-xs">Ảnh ${i+1}</p></div>
             </div>`
        ).join('')
      }
    }
  }

  async function loadHistory() {
    try {
      const res = await API.getHistory(1, 7)
      const listEl = document.getElementById('ci-history-list')
      if (!res.data || res.data.length === 0) {
        listEl.innerHTML = '<p class="text-center text-gray-400 text-sm py-4">Chưa có lịch sử</p>'
        return
      }
      listEl.innerHTML = res.data.map(r => `
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors" onclick="CheckinModule.showHistoryDetail(${r.id})">
          <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${r.status === 'checkout' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}">
            <i class="fas ${r.status === 'checkout' ? 'fa-check' : 'fa-clock'}"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-800 text-sm">${r.date}</p>
            <p class="text-xs text-gray-500 truncate">
              ${r.checkin_time ? formatTime(r.checkin_time) : '--'} → ${r.checkout_time ? formatTime(r.checkout_time) : '--'}
            </p>
          </div>
          <div class="text-right">
            ${r.sales_quantity ? `<p class="text-xs font-bold text-green-600">${r.sales_quantity} SP</p>` : ''}
            <i class="fas fa-chevron-right text-gray-300 text-xs mt-1"></i>
          </div>
        </div>
      `).join('')
    } catch {}
  }

  async function showHistoryDetail(id) {
    const res = await API.getCheckinDetail(id)
    const r = res.data
    if (!r) return

    const imgRow = (label, src) => src
      ? `<div>
           <p class="text-xs text-gray-500 mb-1">${label}</p>
           <img src="${src}" class="w-full rounded-lg cursor-pointer" onclick="Modal.image(this.src)" />
         </div>`
      : ''

    Modal.create(`
      <div class="p-5">
        <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-history mr-2"></i>${r.date}</h3>
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="bg-blue-50 rounded-lg p-2 text-center">
              <p class="text-blue-500 text-xs">Check-in</p>
              <p class="font-bold text-blue-700">${formatTime(r.checkin_time)}</p>
              <p class="text-xs text-blue-400 truncate">${r.checkin_address || '--'}</p>
            </div>
            <div class="bg-purple-50 rounded-lg p-2 text-center">
              <p class="text-purple-500 text-xs">Check-out</p>
              <p class="font-bold text-purple-700">${formatTime(r.checkout_time)}</p>
              <p class="text-xs text-purple-400 truncate">${r.checkout_address || '--'}</p>
            </div>
          </div>
          ${r.sales_quantity ? `<p class="text-sm"><b>Số lượng bán:</b> ${r.sales_quantity}</p>` : ''}
          ${r.notes ? `<p class="text-sm"><b>Ghi chú:</b> ${r.notes}</p>` : ''}
          <div class="grid grid-cols-2 gap-2">
            ${imgRow('Check-in 1', r.checkin_image1)}
            ${imgRow('Check-in 2', r.checkin_image2)}
          </div>
          <div class="grid grid-cols-2 gap-2">
            ${imgRow('Hoạt động 1', r.activity_image1)}
            ${imgRow('Hoạt động 2', r.activity_image2)}
            ${imgRow('Hoạt động 3', r.activity_image3)}
            ${imgRow('Hoạt động 4', r.activity_image4)}
          </div>
          <div class="grid grid-cols-2 gap-2">
            ${imgRow('Check-out 1', r.checkout_image1)}
            ${imgRow('Check-out 2', r.checkout_image2)}
          </div>
        </div>
      </div>
    `)
  }

  function startLiveClock() {
    function tick() {
      const el = document.getElementById('ci-live-time')
      if (!el) return
      const now = new Date(Date.now() + 7 * 60 * 60 * 1000)
      const h = String(now.getUTCHours()).padStart(2,'0')
      const m = String(now.getUTCMinutes()).padStart(2,'0')
      const s = String(now.getUTCSeconds()).padStart(2,'0')
      el.textContent = `${h}:${m}:${s}`
    }
    tick()
    return setInterval(tick, 1000)
  }

  async function bindEvents() {
    // Date display
    const dateEl = document.getElementById('ci-date-display')
    if (dateEl) {
      const now = new Date(Date.now() + 7 * 60 * 60 * 1000)
      dateEl.textContent = now.toLocaleDateString('vi-VN', {
        weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
        timeZone: 'UTC'
      })
    }

    startLiveClock()
    await refreshToday()
    await loadHistory()

    // Activity photo section
    const activityGrid = document.getElementById('activity-photo-grid')
    const saveBtn = document.getElementById('btn-save-activity')
    let activityPhotos = []

    if (activityGrid && _todayRecord && !_todayRecord.activity_image1) {
      Camera.createPhotoGrid(activityGrid, 4, {}, (photos) => {
        activityPhotos = photos
        if (saveBtn && photos.length > 0) saveBtn.classList.remove('hidden')
      })
    }

    if (saveBtn) {
      saveBtn.onclick = async () => {
        if (activityPhotos.length === 0) { Toast.warning('Chưa có ảnh nào'); return }
        saveBtn.disabled = true
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Lưu...'
        try {
          await API.updateActivity({
            image1: activityPhotos[0] || null,
            image2: activityPhotos[1] || null,
            image3: activityPhotos[2] || null,
            image4: activityPhotos[3] || null,
          })
          Toast.success('Lưu ảnh hoạt động thành công')
          saveBtn.classList.add('hidden')
        } catch (e) {
          Toast.error(e.message)
        } finally {
          saveBtn.disabled = false
          saveBtn.innerHTML = '<i class="fas fa-save mr-1"></i>Lưu'
        }
      }
    }
  }

  return { renderPage, bindEvents, showHistoryDetail }
})()
