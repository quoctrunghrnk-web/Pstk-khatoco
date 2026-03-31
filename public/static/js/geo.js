// =============================================
// Module: Geolocation
// Lấy vị trí GPS, reverse geocoding, hướng dẫn
// cấp lại quyền khi bị denied
// =============================================
window.Geo = (() => {
  let _lastPosition = null

  // ── Kiểm tra trạng thái permission ──────────
  async function checkPermission() {
    if (!navigator.permissions) return 'unknown'
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' })
      return result.state   // 'granted' | 'prompt' | 'denied'
    } catch {
      return 'unknown'
    }
  }

  // ── Lấy GPS thuần ───────────────────────────
  function getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Thiết bị không hỗ trợ định vị GPS'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          _lastPosition = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp
          }
          resolve(_lastPosition)
        },
        (err) => {
          let msg = 'Không thể lấy vị trí'
          if (err.code === 1) msg = 'PERMISSION_DENIED'
          if (err.code === 2) msg = 'Không tìm thấy vị trí (GPS yếu hoặc ở trong nhà)'
          if (err.code === 3) msg = 'Hết thời gian lấy vị trí, vui lòng thử lại'
          reject(new Error(msg))
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
          ...options
        }
      )
    })
  }

  // ── Reverse geocoding (Nominatim / OSM) ─────
  async function reverseGeocode(lat, lng) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=vi`,
        { headers: { 'Accept-Language': 'vi,en' } }
      )
      const data = await res.json()
      if (data.display_name) {
        const parts = data.display_name.split(',').map(s => s.trim())
        return parts.slice(0, 4).join(', ')
      }
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    }
  }

  function getLastPosition() { return _lastPosition }

  // ── Modal hướng dẫn cấp lại quyền ──────────
  // Trả về Promise:
  //   resolve('skip')  — người dùng chọn bỏ qua GPS
  //   resolve('retry') — người dùng đã bật lại và bấm Thử lại
  //   reject()         — người dùng đóng modal
  function showPermissionGuide() {
    return new Promise((resolve, reject) => {
      // Nhận diện OS để đưa hướng dẫn phù hợp
      const ua     = navigator.userAgent || ''
      const isIOS  = /iPhone|iPad|iPod/i.test(ua)
      const isAndroid = /Android/i.test(ua)

      let steps = ''
      if (isIOS) {
        steps = `
          <ol class="text-sm text-gray-600 space-y-2 text-left list-none">
            <li class="flex items-start gap-2">
              <span class="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
              <span>Mở <b>Cài đặt</b> (Settings) trên iPhone/iPad</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
              <span>Chọn <b>Quyền riêng tư &amp; Bảo mật</b> → <b>Dịch vụ vị trí</b></span>
            </li>
            <li class="flex items-start gap-2">
              <span class="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
              <span>Tìm trình duyệt đang dùng (Safari / Chrome) → chọn <b>Trong khi sử dụng</b></span>
            </li>
            <li class="flex items-start gap-2">
              <span class="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
              <span>Quay lại app và bấm <b>Thử lại</b></span>
            </li>
          </ol>`
      } else if (isAndroid) {
        steps = `
          <ol class="text-sm text-gray-600 space-y-2 text-left list-none">
            <li class="flex items-start gap-2">
              <span class="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
              <span>Nhấn vào <b>biểu tượng khoá / thông tin</b> bên trái thanh địa chỉ</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
              <span>Chọn <b>Quyền</b> (Permissions) → <b>Vị trí</b> → chuyển sang <b>Cho phép</b></span>
            </li>
            <li class="flex items-start gap-2">
              <span class="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
              <span>Tải lại trang hoặc bấm <b>Thử lại</b> bên dưới</span>
            </li>
          </ol>`
      } else {
        // Desktop / other
        steps = `
          <ol class="text-sm text-gray-600 space-y-2 text-left list-none">
            <li class="flex items-start gap-2">
              <span class="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
              <span>Nhấn vào <b>biểu tượng khoá 🔒</b> hoặc <b>ⓘ</b> trên thanh địa chỉ</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
              <span>Tìm mục <b>Vị trí</b> (Location) → chọn <b>Cho phép</b></span>
            </li>
            <li class="flex items-start gap-2">
              <span class="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
              <span>Tải lại trang hoặc bấm <b>Thử lại</b></span>
            </li>
          </ol>`
      }

      const { close } = Modal.create(`
        <div class="p-5">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <i class="fas fa-map-marker-alt text-orange-500 text-xl"></i>
            </div>
            <div>
              <h3 class="font-bold text-gray-800">Cần quyền truy cập vị trí</h3>
              <p class="text-xs text-gray-400 mt-0.5">Ảnh chấm công cần có GPS để xác thực</p>
            </div>
          </div>

          <div class="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
            <p class="text-xs font-semibold text-orange-700 mb-3 uppercase tracking-wide">
              <i class="fas fa-info-circle mr-1"></i>Cách bật lại quyền vị trí
            </p>
            ${steps}
          </div>

          <div class="space-y-2">
            <button id="gps-guide-retry"
              class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
              <i class="fas fa-redo"></i> Thử lại (đã bật quyền rồi)
            </button>
            <button id="gps-guide-skip"
              class="w-full py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50 transition-colors">
              <i class="fas fa-forward mr-1"></i> Bỏ qua GPS, chụp ảnh không có vị trí
            </button>
          </div>
          <p class="text-xs text-center text-gray-400 mt-3">
            <i class="fas fa-exclamation-triangle text-yellow-400 mr-1"></i>
            Ảnh không có GPS vẫn được lưu nhưng không có thông tin vị trí
          </p>
        </div>
      `)

      document.getElementById('gps-guide-retry').onclick = () => {
        close()
        resolve('retry')
      }
      document.getElementById('gps-guide-skip').onclick = () => {
        close()
        resolve('skip')
      }
    })
  }

  // ── getPositionWithAddress — có xử lý denied ─
  // Tự động phát hiện permission denied, hiện hướng dẫn,
  // cho phép retry nhiều lần hoặc bỏ qua GPS
  async function getPositionWithAddress() {
    // Thử lấy GPS, retry tối đa 3 lần nếu người dùng chọn retry
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const permState = await checkPermission()

        // Nếu đã biết bị denied từ đầu → hiện guide ngay
        if (permState === 'denied') {
          const choice = await showPermissionGuide()
          if (choice === 'skip') {
            return { lat: null, lng: null, address: 'Chưa xác định vị trí (không có GPS)' }
          }
          // 'retry' → lặp lại vòng for
          continue
        }

        // Thử lấy vị trí
        const pos = await getCurrentPosition()
        const address = await reverseGeocode(pos.lat, pos.lng)
        return { ...pos, address }

      } catch (e) {
        if (e.message === 'PERMISSION_DENIED') {
          // Bị từ chối khi đang hỏi, hoặc đã denied
          const choice = await showPermissionGuide()
          if (choice === 'skip') {
            return { lat: null, lng: null, address: 'Chưa xác định vị trí (không có GPS)' }
          }
          // 'retry' → lặp lại vòng for
          continue
        }
        // Lỗi khác (timeout, unavailable) → throw thẳng
        throw e
      }
    }

    // Hết 3 lần retry → fallback bỏ qua GPS
    if (window.Toast) Toast.warning('Không lấy được GPS sau nhiều lần thử')
    return { lat: null, lng: null, address: 'Chưa xác định vị trí' }
  }

  return { getCurrentPosition, reverseGeocode, getPositionWithAddress, getLastPosition, checkPermission }
})()
