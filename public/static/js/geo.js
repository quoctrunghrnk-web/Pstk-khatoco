// =============================================
// Module: Geolocation
// Lấy vị trí GPS và reverse geocoding
// =============================================
window.Geo = (() => {
  let _lastPosition = null

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
          if (err.code === 1) msg = 'Bạn cần cấp quyền truy cập vị trí'
          if (err.code === 2) msg = 'Không tìm thấy vị trí (GPS yếu)'
          if (err.code === 3) msg = 'Hết thời gian lấy vị trí'
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

  // Reverse geocoding bằng Nominatim (OpenStreetMap, miễn phí)
  async function reverseGeocode(lat, lng) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=vi`,
        { headers: { 'Accept-Language': 'vi,en' } }
      )
      const data = await res.json()
      if (data.display_name) {
        // Rút gọn địa chỉ
        const parts = data.display_name.split(',').map(s => s.trim())
        return parts.slice(0, 4).join(', ')
      }
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    }
  }

  function getLastPosition() {
    return _lastPosition
  }

  // Lấy vị trí + địa chỉ cùng lúc
  async function getPositionWithAddress() {
    const pos = await getCurrentPosition()
    const address = await reverseGeocode(pos.lat, pos.lng)
    return { ...pos, address }
  }

  return { getCurrentPosition, reverseGeocode, getPositionWithAddress, getLastPosition }
})()
