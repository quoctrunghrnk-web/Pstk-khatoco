// =============================================
// Module: Watermark
// Chèn thời gian + địa điểm lên ảnh
// Dùng Canvas 2D thuần - KHÔNG dùng emoji
// (emoji vỡ trên Android WebView / nhiều thiết bị)
// =============================================
window.Watermark = (() => {

  // ── Helpers ──────────────────────────────────

  // Định dạng ngày giờ VN (UTC+7)
  function formatDateTime(d) {
    const t = new Date((d ? new Date(d) : new Date()).getTime() + 7 * 60 * 60 * 1000)
    const p = n => String(n).padStart(2, '0')
    return (
      `${p(t.getUTCDate())}/${p(t.getUTCMonth()+1)}/${t.getUTCFullYear()} ` +
      `${p(t.getUTCHours())}:${p(t.getUTCMinutes())}:${p(t.getUTCSeconds())}`
    )
  }

  // Wrap text thành nhiều dòng theo maxWidth
  function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ')
    const lines = []
    let cur = ''
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w
      if (ctx.measureText(test).width > maxWidth && cur) {
        lines.push(cur)
        cur = w
      } else {
        cur = test
      }
    }
    if (cur) lines.push(cur)
    return lines.length ? lines : [text]
  }

  // Vẽ icon đồng hồ bằng Canvas (thay emoji 📅)
  function drawClockIcon(ctx, cx, cy, r, color) {
    ctx.save()
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = Math.max(1.5, r / 5)
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
    // Kim giờ
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx, cy - r * 0.55)
    ctx.stroke()
    // Kim phút
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + r * 0.45, cy)
    ctx.stroke()
    ctx.restore()
  }

  // Vẽ icon pin định vị (thay emoji 📍)
  function drawPinIcon(ctx, cx, cy, r, color) {
    ctx.save()
    ctx.fillStyle = color
    ctx.beginPath()
    // Thân tròn phía trên
    ctx.arc(cx, cy - r * 0.3, r * 0.7, Math.PI, Math.PI * 2)
    // Hai đường thẳng tạo thành đuôi nhọn
    ctx.lineTo(cx + r * 0.7, cy - r * 0.3)
    ctx.lineTo(cx, cy + r * 0.85)
    ctx.lineTo(cx - r * 0.7, cy - r * 0.3)
    ctx.closePath()
    ctx.fill()
    // Chấm trắng giữa
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.beginPath()
    ctx.arc(cx, cy - r * 0.3, r * 0.28, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // ── stamp ──────────────────────────────────
  /**
   * Chèn watermark thời gian + địa điểm lên ảnh
   * @param {string} base64  - ảnh đầu vào
   * @param {object} opts    - { lat, lng, address, datetime }
   * @returns {Promise<string>} base64 có watermark
   */
  function stamp(base64, opts = {}) {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const W = img.naturalWidth
        const H = img.naturalHeight
        const canvas = document.createElement('canvas')
        canvas.width  = W
        canvas.height = H
        const ctx = canvas.getContext('2d')

        // Vẽ ảnh gốc
        ctx.drawImage(img, 0, 0)

        // ── Tính kích thước chữ ──────────────
        const fs    = Math.max(16, Math.floor(W / 32))   // font size
        const pad   = Math.floor(fs * 0.7)                // padding box
        const iconR = Math.floor(fs * 0.42)               // bán kính icon
        const lh    = Math.floor(fs * 1.55)               // line height
        const innerW = W - pad * 2 - iconR * 2 - pad      // chiều rộng text

        ctx.font = `bold ${fs}px Arial`

        const dtText   = opts.datetime || formatDateTime()
        const addrRaw  = opts.address  ||
          (opts.lat && opts.lng
            ? `${parseFloat(opts.lat).toFixed(5)}, ${parseFloat(opts.lng).toFixed(5)}`
            : 'Khong xac dinh vi tri')

        // Wrap địa chỉ
        const addrLines = wrapText(ctx, addrRaw, innerW)
        const totalLines = 1 + addrLines.length  // 1 dòng thời gian + n dòng địa chỉ

        const boxH  = pad + totalLines * lh + pad
        const boxY  = H - boxH - Math.floor(H * 0.01)
        const boxX  = pad
        const boxW  = W - pad * 2

        // ── Nền mờ ──────────────────────────
        ctx.fillStyle = 'rgba(0,0,0,0.62)'
        const br = Math.min(12, fs * 0.6)
        ctx.beginPath()
        ctx.moveTo(boxX + br, boxY)
        ctx.lineTo(boxX + boxW - br, boxY)
        ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + br)
        ctx.lineTo(boxX + boxW, boxY + boxH - br)
        ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - br, boxY + boxH)
        ctx.lineTo(boxX + br, boxY + boxH)
        ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - br)
        ctx.lineTo(boxX, boxY + br)
        ctx.quadraticCurveTo(boxX, boxY, boxX + br, boxY)
        ctx.closePath()
        ctx.fill()

        // ── Vẽ từng dòng ────────────────────
        ctx.font        = `bold ${fs}px Arial`
        ctx.fillStyle   = '#FFFFFF'
        ctx.shadowColor = 'rgba(0,0,0,0.7)'
        ctx.shadowBlur  = 3
        ctx.textBaseline = 'middle'

        const iconColor = '#FFFFFF'
        const textX = boxX + pad + iconR * 2 + Math.floor(pad * 0.5)

        // Dòng 1: Thời gian
        const y0 = boxY + pad + lh * 0.5
        drawClockIcon(ctx, boxX + pad + iconR, y0, iconR, iconColor)
        ctx.fillText(dtText, textX, y0, innerW)

        // Dòng 2+: Địa chỉ (wrap)
        addrLines.forEach((line, i) => {
          const y = boxY + pad + lh * (1 + i) + lh * 0.5
          if (i === 0) drawPinIcon(ctx, boxX + pad + iconR, y, iconR, iconColor)
          ctx.fillText(line, textX, y, innerW)
        })

        // ── Nhãn Nhân Kiệt góc trên trái (logo + text) ──
        const labelFs = Math.max(13, Math.floor(fs * 0.75))
        const lbPad   = Math.floor(labelFs * 0.5)
        const lbH     = labelFs + lbPad * 2
        const lbX     = Math.floor(W * 0.01)
        const lbY     = Math.floor(H * 0.01)
        const logoSize = lbH                          // logo vuông bằng chiều cao badge
        const brandText = 'nhankiet.vn'
        ctx.font = `bold ${labelFs}px Arial`
        ctx.shadowBlur = 2
        const brandW  = ctx.measureText(brandText).width
        const totalBadgeW = logoSize + Math.floor(lbPad * 0.5) + brandW + lbPad * 2

        // Nền badge
        ctx.fillStyle = 'rgba(30,58,95,0.82)'
        ctx.beginPath()
        ctx.roundRect(lbX, lbY, totalBadgeW, lbH, 6)
        ctx.fill()

        // Vẽ brand text + NK badge (không dùng ảnh ngoài để tránh canvas tainted)
        const _drawBrand = () => {
          ctx.fillStyle = '#FFFFFF'
          ctx.textBaseline = 'middle'
          ctx.shadowBlur = 1
          // Vẽ chữ "NK" trong ô vuông nhỏ bên trái badge
          ctx.fillStyle = 'rgba(255,255,255,0.95)'
          ctx.font = `bold ${Math.floor(labelFs * 0.85)}px Arial`
          ctx.fillText('NK', lbX + logoSize * 0.15, lbY + lbH / 2)
          // Vẽ brand text
          ctx.font = `bold ${labelFs}px Arial`
          ctx.fillText(brandText, lbX + logoSize + Math.floor(lbPad * 0.5) + lbPad * 0.5, lbY + lbH / 2, brandW + 4)
          ctx.shadowBlur = 0
          try {
            resolve(canvas.toDataURL('image/jpeg', APP_CONFIG.IMG_QUALITY))
          } catch (e) {
            // Fallback nếu canvas bị tainted: trả về ảnh gốc không watermark
            resolve(base64)
          }
        }

        _drawBrand()
      }
      img.onerror = () => resolve(base64)
      img.src = base64
    })
  }

  return { stamp, formatDateTime }
})()
