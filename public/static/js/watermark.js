// =============================================
// Module: Watermark
// Chèn thời gian và địa điểm lên ảnh
// =============================================
window.Watermark = (() => {

  // Định dạng thời gian Việt Nam
  function formatDateTime(date = new Date()) {
    const d = date instanceof Date ? date : new Date()
    const pad = n => String(n).padStart(2, '0')
    const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000)
    return `${pad(vn.getUTCDate())}/${pad(vn.getUTCMonth()+1)}/${vn.getUTCFullYear()} ${pad(vn.getUTCHours())}:${pad(vn.getUTCMinutes())}:${pad(vn.getUTCSeconds())}`
  }

  /**
   * Chèn watermark lên ảnh (base64 → base64)
   * @param {string} base64 - Ảnh gốc dạng base64 (data:image/...)
   * @param {object} opts - { lat, lng, address, datetime }
   * @returns {Promise<string>} base64 có watermark
   */
  function stamp(base64, opts = {}) {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')

        // Vẽ ảnh gốc
        ctx.drawImage(img, 0, 0)

        // Thông tin watermark
        const datetime = opts.datetime || formatDateTime()
        const address = opts.address || (opts.lat && opts.lng ? `${opts.lat.toFixed(5)}, ${opts.lng.toFixed(5)}` : 'Không xác định')

        const lines = [
          `📅 ${datetime}`,
          `📍 ${address}`,
        ]

        // Tính font size theo kích thước ảnh
        const fontSize = Math.max(18, Math.floor(canvas.width / 28))
        const padding = fontSize * 0.6
        const lineHeight = fontSize * 1.5
        const boxH = lines.length * lineHeight + padding * 2
        const boxY = canvas.height - boxH - 10

        // Nền mờ
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
        ctx.beginPath()
        const radius = 10
        const bx = 10, by = boxY, bw = canvas.width - 20, bh = boxH
        ctx.moveTo(bx + radius, by)
        ctx.lineTo(bx + bw - radius, by)
        ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + radius)
        ctx.lineTo(bx + bw, by + bh - radius)
        ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - radius, by + bh)
        ctx.lineTo(bx + radius, by + bh)
        ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - radius)
        ctx.lineTo(bx, by + radius)
        ctx.quadraticCurveTo(bx, by, bx + radius, by)
        ctx.closePath()
        ctx.fill()

        // Text
        ctx.font = `bold ${fontSize}px Arial, sans-serif`
        ctx.fillStyle = '#FFFFFF'
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 4

        lines.forEach((line, i) => {
          ctx.fillText(line, bx + padding, by + padding + fontSize + i * lineHeight, bw - padding * 2)
        })

        // Logo app ở góc trên trái
        ctx.font = `bold ${Math.floor(fontSize * 0.85)}px Arial`
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.shadowBlur = 3
        ctx.fillText('📊 NVTT', 14, fontSize + 8)

        resolve(canvas.toDataURL('image/jpeg', APP_CONFIG.IMG_QUALITY))
      }
      img.onerror = () => resolve(base64)
      img.src = base64
    })
  }

  return { stamp, formatDateTime }
})()
