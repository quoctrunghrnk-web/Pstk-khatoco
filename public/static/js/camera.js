// =============================================
// Module: Camera
// Chụp ảnh từ camera hoặc chọn file, resize + watermark
// =============================================
window.Camera = (() => {

  /**
   * Resize ảnh về kích thước tối đa
   * @param {string} base64
   * @returns {Promise<string>}
   */
  function resizeImage(base64) {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        let { naturalWidth: w, naturalHeight: h } = img
        const maxW = APP_CONFIG.IMG_MAX_WIDTH
        const maxH = APP_CONFIG.IMG_MAX_HEIGHT

        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h)
          w = Math.floor(w * ratio)
          h = Math.floor(h * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', APP_CONFIG.IMG_QUALITY))
      }
      img.onerror = () => resolve(base64)
      img.src = base64
    })
  }

  /**
   * Mở camera hoặc chọn file gallery, trả về base64 đã watermark
   * @param {object} opts - { geo: {lat,lng,address}, label, allowGallery }
   * @returns {Promise<string>}
   */
  function capture(opts = {}) {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      // Ưu tiên camera trên mobile
      if (!opts.allowGallery) {
        input.capture = 'environment'
      }

      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (!file) { reject(new Error('Không có file được chọn')); return }

        const reader = new FileReader()
        reader.onload = async (ev) => {
          try {
            let base64 = ev.target.result
            // 1. Resize
            base64 = await resizeImage(base64)
            // 2. Watermark nếu có geo info
            if (opts.geo || opts.address) {
              const geoInfo = opts.geo || {}
              base64 = await Watermark.stamp(base64, {
                lat: geoInfo.lat,
                lng: geoInfo.lng,
                address: opts.address || geoInfo.address,
              })
            }
            resolve(base64)
          } catch (err) {
            reject(err)
          }
        }
        reader.onerror = () => reject(new Error('Không thể đọc file'))
        reader.readAsDataURL(file)
      }

      input.oncancel = () => reject(new Error('cancelled'))
      input.click()
    })
  }

  /**
   * Tạo UI chụp nhiều ảnh cùng lúc (max n ảnh)
   * @param {HTMLElement} container - Phần tử chứa UI
   * @param {number} max - Số ảnh tối đa
   * @param {object} opts - Tùy chọn
   * @param {function} onChange - Callback khi danh sách ảnh thay đổi
   * @param {Array} initialPhotos - Ảnh có sẵn (optional)
   */
  function createPhotoGrid(container, max, opts = {}, onChange, initialPhotos = null) {
    let photos = initialPhotos && initialPhotos.length === max
      ? [...initialPhotos]
      : new Array(max).fill(null)

    function render() {
      container.innerHTML = photos.map((p, i) => `
        <div class="photo-slot relative aspect-square bg-gray-100 rounded-xl overflow-hidden border-2 ${p ? 'border-blue-400' : 'border-dashed border-gray-300'} cursor-pointer"
             data-idx="${i}">
          ${p
            ? `<img src="${p}" class="w-full h-full object-cover" />
               <button class="remove-photo absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow" data-idx="${i}">
                 <i class="fas fa-times"></i>
               </button>`
            : `<div class="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-1">
                 <i class="fas fa-camera text-2xl"></i>
                 <span class="text-xs">Ảnh ${i + 1}</span>
               </div>`
          }
        </div>
      `).join('')

      // Click slot trống → chụp ảnh
      container.querySelectorAll('.photo-slot').forEach(slot => {
        const idx = parseInt(slot.dataset.idx)
        if (!photos[idx]) {
          slot.addEventListener('click', async () => {
            try {
              // Lấy vị trí hiện tại
              let geoInfo = {}
              try {
                geoInfo = await Geo.getPositionWithAddress()
              } catch { /* ignore geo error */ }

              const base64 = await capture({ geo: geoInfo, address: geoInfo.address, allowGallery: true })
              photos[idx] = base64
              render()
              if (onChange) onChange(photos.filter(Boolean))
            } catch (e) {
              if (e.message !== 'cancelled') Toast.error('Không thể chụp ảnh: ' + e.message)
            }
          })
        }
      })

      // Click nút xóa
      container.querySelectorAll('.remove-photo').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation()
          const idx = parseInt(btn.dataset.idx)
          photos[idx] = null
          render()
          if (onChange) onChange(photos.filter(Boolean))
        })
      })
    }

    render()

    return {
      getPhotos: () => photos.filter(Boolean),
      getAll: () => photos,
      reset: () => { photos = new Array(max).fill(null); render() }
    }
  }

  return { capture, resizeImage, createPhotoGrid }
})()
