// =============================================
// Module: Toast Notifications
// Hiển thị thông báo tạm thời
// =============================================
window.Toast = (() => {
  function show(message, type = 'info', duration = 3000) {
    const root = document.getElementById('toast-root')
    if (!root) return

    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    }
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-times-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    }

    const toast = document.createElement('div')
    toast.className = `pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm
      ${colors[type] || colors.info} transform translate-x-full transition-transform duration-300`

    toast.innerHTML = `
      <i class="fas ${icons[type] || icons.info} flex-shrink-0"></i>
      <span>${message}</span>
    `

    root.appendChild(toast)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.remove('translate-x-full')
      })
    })

    setTimeout(() => {
      toast.classList.add('translate-x-full')
      toast.addEventListener('transitionend', () => toast.remove())
    }, duration)
  }

  return {
    success: (msg, d) => show(msg, 'success', d),
    error: (msg, d) => show(msg, 'error', d),
    warning: (msg, d) => show(msg, 'warning', d),
    info: (msg, d) => show(msg, 'info', d),
  }
})()
