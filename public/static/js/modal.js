// =============================================
// Module: Modal
// Hiển thị hộp thoại xác nhận và nội dung
// =============================================
window.Modal = (() => {
  function create(html, opts = {}) {
    const root = document.getElementById('modal-root')
    const overlay = document.createElement('div')
    overlay.className = 'fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'

    overlay.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all scale-95 opacity-0" id="modal-inner">
        ${html}
      </div>
    `

    root.appendChild(overlay)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const inner = overlay.querySelector('#modal-inner')
        inner.classList.remove('scale-95', 'opacity-0')
      })
    })

    if (!opts.persistent) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(overlay)
      })
    }

    function close(el = overlay) {
      const inner = el.querySelector('#modal-inner')
      if (inner) {
        inner.classList.add('scale-95', 'opacity-0')
      }
      setTimeout(() => el.remove(), 200)
    }

    return { overlay, close: () => close(overlay) }
  }

  function confirm(title, message, onConfirm, confirmText = 'Xác nhận', danger = false) {
    const btnClass = danger
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white'

    const { overlay, close } = create(`
      <div class="p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-2">${title}</h3>
        <p class="text-gray-600 mb-6">${message}</p>
        <div class="flex gap-3 justify-end">
          <button id="modal-cancel" class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Hủy</button>
          <button id="modal-confirm" class="px-4 py-2 rounded-lg ${btnClass}">${confirmText}</button>
        </div>
      </div>
    `)

    overlay.querySelector('#modal-cancel').onclick = close
    overlay.querySelector('#modal-confirm').onclick = () => { close(); onConfirm() }
  }

  function image(src, caption) {
    const { close } = create(`
      <div class="relative">
        <button id="modal-img-close" class="absolute top-2 right-2 z-10 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center">
          <i class="fas fa-times text-sm"></i>
        </button>
        <img src="${src}" class="w-full rounded-2xl" />
        ${caption ? `<p class="text-center text-sm text-gray-500 py-3">${caption}</p>` : ''}
      </div>
    `)
    document.getElementById('modal-img-close').onclick = close
  }

  function alert(title, message, type = 'info') {
    const icons = { success: 'fa-check-circle text-green-500', error: 'fa-times-circle text-red-500', info: 'fa-info-circle text-blue-500', warning: 'fa-exclamation-triangle text-yellow-500' }
    const { overlay, close } = create(`
      <div class="p-6 text-center">
        <i class="fas ${icons[type] || icons.info} text-4xl mb-3"></i>
        <h3 class="text-lg font-bold text-gray-800 mb-2">${title}</h3>
        <p class="text-gray-600 mb-5">${message}</p>
        <button id="modal-ok" class="w-full py-2 bg-blue-600 text-white rounded-lg">OK</button>
      </div>
    `)
    overlay.querySelector('#modal-ok').onclick = close
  }

  return { create, confirm, image, alert }
})()
