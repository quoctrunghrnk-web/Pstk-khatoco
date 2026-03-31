// =============================================
// Module: Camera
// Chụp ảnh / chọn file → resize → watermark → nén
// Pipeline: resizeImage → Watermark.stamp → compressToLimit
// =============================================
window.Camera = (() => {

  // ── Resize về kích thước tối đa ─────────────
  function resizeImage(base64) {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        let w = img.naturalWidth
        let h = img.naturalHeight
        const maxW = APP_CONFIG.IMG_MAX_WIDTH
        const maxH = APP_CONFIG.IMG_MAX_HEIGHT

        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h)
          w = Math.floor(w * ratio)
          h = Math.floor(h * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width  = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', APP_CONFIG.IMG_QUALITY))
      }
      img.onerror = () => resolve(base64)
      img.src = base64
    })
  }

  // ── Nén ảnh xuống ≤ IMG_MAX_BYTES ───────────
  // Giảm dần quality, sau đó thu nhỏ kích thước nếu cần
  function compressToLimit(base64) {
    return new Promise((resolve) => {
      const maxBytes = APP_CONFIG.IMG_MAX_BYTES   // 280 * 1024
      const minQ     = APP_CONFIG.IMG_MIN_QUALITY // 0.30

      // base64 length → byte size xấp xỉ: len * 3/4
      const byteSize = (b64) => Math.floor(b64.length * 0.75)

      if (byteSize(base64) <= maxBytes) {
        resolve(base64)
        return
      }

      const img = new Image()
      img.onload = () => {
        const tryEncode = (srcImg, w, h, quality) => {
          const c = document.createElement('canvas')
          c.width = w; c.height = h
          c.getContext('2d').drawImage(srcImg, 0, 0, w, h)
          return c.toDataURL('image/jpeg', quality)
        }

        let w = img.naturalWidth
        let h = img.naturalHeight
        let result = base64

        // Bước 1: giảm quality giữ nguyên kích thước
        const qualitySteps = [0.75, 0.65, 0.55, 0.45, 0.38, minQ]
        for (const q of qualitySteps) {
          const candidate = tryEncode(img, w, h, q)
          result = candidate
          if (byteSize(candidate) <= maxBytes) {
            resolve(result)
            return
          }
        }

        // Bước 2: thu nhỏ dần kích thước 80% mỗi lần
        const scaleSteps = [0.80, 0.65, 0.50]
        for (const scale of scaleSteps) {
          const sw = Math.floor(img.naturalWidth * scale)
          const sh = Math.floor(img.naturalHeight * scale)
          const candidate = tryEncode(img, sw, sh, minQ)
          result = candidate
          if (byteSize(candidate) <= maxBytes) {
            resolve(result)
            return
          }
        }

        // Fallback: ảnh rất nhỏ 40% kích thước gốc
        const sw = Math.floor(img.naturalWidth * 0.40)
        const sh = Math.floor(img.naturalHeight * 0.40)
        resolve(tryEncode(img, sw, sh, minQ))
      }
      img.onerror = () => resolve(base64)
      img.src = base64
    })
  }

  // ── Pipeline đầy đủ: resize → watermark → nén ──
  /**
   * @param {string} base64   - ảnh thô từ FileReader
   * @param {object|null} geoInfo  - { lat, lng, address } hoặc null
   * @returns {Promise<string>} base64 đã xử lý, đã có watermark, đã nén
   */
  async function processImage(base64, geoInfo) {
    // 1. Resize
    let result = await resizeImage(base64)

    // 2. Watermark — LUÔN chèn dù không có GPS
    //    Nếu không có địa chỉ sẽ hiện "Chua xac dinh vi tri"
    if (window.Watermark) {
      result = await Watermark.stamp(result, {
        lat:     geoInfo?.lat  ?? null,
        lng:     geoInfo?.lng  ?? null,
        address: geoInfo?.address ?? null,
      })
    }

    // 3. Nén xuống giới hạn D1 (≤280KB)
    result = await compressToLimit(result)

    return result
  }

  // ── Hàm capture file / camera ────────────────
  /**
   * Mở camera hoặc gallery, trả về base64 đã xử lý
   * @param {object|null} geoInfo   - { lat, lng, address } — nên truyền vào trước
   * @param {boolean} allowGallery  - cho phép chọn từ thư viện (mặc định true)
   * @returns {Promise<string>}
   */
  function capture(geoInfo, allowGallery = true) {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type   = 'file'
      input.accept = 'image/*'
      if (!allowGallery) input.capture = 'environment'

      let handled = false

      input.onchange = async (e) => {
        handled = true
        const file = e.target.files[0]
        if (!file) { reject(new Error('Không có file được chọn')); return }

        const reader = new FileReader()
        reader.onload = async (ev) => {
          try {
            const result = await processImage(ev.target.result, geoInfo)
            resolve(result)
          } catch (err) {
            reject(err)
          }
        }
        reader.onerror = () => reject(new Error('Không thể đọc file'))
        reader.readAsDataURL(file)
      }

      // Safari iOS không fire oncancel → dùng focus fallback
      const handleFocus = () => {
        setTimeout(() => {
          if (!handled && (!input.files || input.files.length === 0)) {
            reject(new Error('cancelled'))
          }
        }, 600)
      }
      window.addEventListener('focus', handleFocus, { once: true })

      input.oncancel = () => {
        window.removeEventListener('focus', handleFocus)
        reject(new Error('cancelled'))
      }

      input.click()
    })
  }

  // ── Photo Grid ───────────────────────────────
  /**
   * Tạo grid n ô ảnh có thể chụp / xóa / readonly
   *
   * @param {HTMLElement}   container
   * @param {number}        max            - số ảnh tối đa
   * @param {object}        opts           - { allowGallery, readonly }
   * @param {function}      onChange       - callback(photos[]) khi thay đổi
   * @param {Array|null}    initialPhotos  - ảnh ban đầu (từ DB)
   * @param {function|null} getGeo         - sync/async fn() → {lat,lng,address}
   *                                         nếu null → tự lấy GPS mỗi lần chụp
   */
  function createPhotoGrid(container, max, opts = {}, onChange, initialPhotos = null, getGeo = null) {
    // Khởi tạo mảng ảnh
    let photos
    if (initialPhotos && Array.isArray(initialPhotos)) {
      // Đảm bảo độ dài đúng = max
      photos = [...initialPhotos]
      while (photos.length < max) photos.push(null)
      photos = photos.slice(0, max)
    } else {
      photos = new Array(max).fill(null)
    }

    const readonly = opts.readonly === true
    const labels   = ['Ảnh 1', 'Ảnh 2', 'Ảnh 3', 'Ảnh 4', 'Ảnh 5', 'Ảnh 6']

    function render() {
      container.innerHTML = photos.map((p, i) => `
        <div class="photo-slot relative aspect-square rounded-xl overflow-hidden
          border-2 ${p ? 'border-blue-400' : 'border-dashed border-gray-300'}
          bg-gray-100 ${!readonly && !p ? 'cursor-pointer' : ''} select-none"
          data-idx="${i}">
          ${p
            ? `<img src="${p}" class="w-full h-full object-cover pointer-events-none" />
               ${!readonly ? `
               <button class="remove-photo absolute top-1 right-1 w-7 h-7 bg-red-500
                 text-white rounded-full flex items-center justify-center shadow-md
                 active:scale-90 transition-transform z-10" data-idx="${i}">
                 <i class="fas fa-times text-xs"></i>
               </button>` : `
               <button class="view-photo absolute bottom-1 right-1 w-7 h-7 bg-black bg-opacity-50
                 text-white rounded-full flex items-center justify-center z-10" data-idx="${i}">
                 <i class="fas fa-expand text-xs"></i>
               </button>`}
              `
            : `<div class="w-full h-full flex flex-col items-center justify-center
                 text-gray-400 gap-1 pointer-events-none">
                 ${readonly
                   ? `<i class="fas fa-image text-xl"></i>
                      <span class="text-xs">${labels[i] || ('Ảnh ' + (i+1))}</span>`
                   : `<i class="fas fa-camera text-2xl"></i>
                      <span class="text-xs font-medium">${labels[i] || ('Ảnh ' + (i+1))}</span>`}
               </div>`
          }
        </div>
      `).join('')

      if (readonly) {
        // Xem ảnh toàn màn hình
        container.querySelectorAll('.view-photo').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation()
            const idx = parseInt(btn.dataset.idx)
            if (photos[idx] && window.Modal) Modal.image(photos[idx])
          })
        })
        return
      }

      // Click slot trống → chụp ảnh
      container.querySelectorAll('.photo-slot').forEach(slot => {
        const idx = parseInt(slot.dataset.idx)
        if (photos[idx]) return   // đã có ảnh → bỏ qua

        slot.addEventListener('click', async () => {
          // Loading overlay trên slot
          slot.innerHTML = `
            <div class="w-full h-full flex items-center justify-center bg-gray-100">
              <i class="fas fa-spinner fa-spin text-blue-400 text-2xl"></i>
            </div>`

          try {
            // Lấy GPS —————————————————————————————
            let geo = null
            if (typeof getGeo === 'function') {
              // getGeo có thể là sync hoặc async
              try { geo = await Promise.resolve(getGeo()) } catch {}
            } else {
              // Tự lấy GPS mỗi khi chụp (fallback)
              if (window.Geo) {
                try {
                  geo = await Geo.getPositionWithAddress()
                } catch { /* watermark hiện "Chưa xác định" */ }
              }
            }

            const base64 = await capture(geo, opts.allowGallery !== false)
            photos[idx] = base64
            render()
            if (onChange) onChange([...photos])
          } catch (e) {
            render()   // phục hồi slot
            if (e.message !== 'cancelled') {
              if (window.Toast) Toast.error('Lỗi chụp ảnh: ' + e.message)
            }
          }
        })
      })

      // Nút xóa ảnh
      container.querySelectorAll('.remove-photo').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation()
          const idx = parseInt(btn.dataset.idx)
          photos[idx] = null
          render()
          if (onChange) onChange([...photos])
        })
      })
    }

    render()

    return {
      getPhotos:  () => photos.filter(Boolean),
      getAll:     () => [...photos],
      reset:      () => { photos = new Array(max).fill(null); render() },
      setPhotos:  (newPhotos) => {
        photos = [...newPhotos]
        while (photos.length < max) photos.push(null)
        photos = photos.slice(0, max)
        render()
      },
    }
  }

  // ── captureNoWatermark ───────────────────────
  // Dùng cho ảnh CCCD: resize + nén, không chèn watermark GPS
  async function captureNoWatermark(allowGallery = true) {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type   = 'file'
      input.accept = 'image/*'
      if (!allowGallery) input.capture = 'environment'

      let handled = false

      input.onchange = async (e) => {
        handled = true
        const file = e.target.files[0]
        if (!file) { reject(new Error('Không có file được chọn')); return }

        const reader = new FileReader()
        reader.onload = async (ev) => {
          try {
            // Chỉ resize + nén, không watermark
            let result = await resizeImage(ev.target.result)
            result = await compressToLimit(result)
            resolve(result)
          } catch (err) {
            reject(err)
          }
        }
        reader.onerror = () => reject(new Error('Không thể đọc file'))
        reader.readAsDataURL(file)
      }

      const handleFocus = () => {
        setTimeout(() => {
          if (!handled && (!input.files || input.files.length === 0)) {
            reject(new Error('cancelled'))
          }
        }, 600)
      }
      window.addEventListener('focus', handleFocus, { once: true })
      input.oncancel = () => {
        window.removeEventListener('focus', handleFocus)
        reject(new Error('cancelled'))
      }

      input.click()
    })
  }

  return { capture, captureNoWatermark, processImage, resizeImage, compressToLimit, createPhotoGrid }
})()
