// =============================================
// Module: App (Main Controller / Router)
// Điều hướng giữa các trang
// =============================================
window.App = (() => {
  let _currentPage = null
  let _clockInterval = null

  const PAGES = {
    login: {
      render: () => Auth.renderLoginPage(),
      bind: () => Auth.bindLoginEvents(),
      requireAuth: false,
      showNav: false,
    },
    home: {
      render: () => CheckinModule.renderPage(),
      bind: () => CheckinModule.bindEvents(),
      requireAuth: true,
      showNav: true,
    },
    profile: {
      render: () => ProfileModule.renderPage(),
      bind: () => ProfileModule.bindEvents(),
      requireAuth: true,
      showNav: true,
    },
    admin: {
      render: () => AdminModule.renderPage(),
      bind: () => AdminModule.bindEvents(),
      requireAuth: true,
      adminOnly: true,
      showNav: true,
    },
  }

  function navigate(page) {
    // Clear previous clock if any
    if (_clockInterval) { clearInterval(_clockInterval); _clockInterval = null }

    const config = PAGES[page]
    if (!config) { navigate('home'); return }

    // Auth guard
    if (config.requireAuth && !Auth.isLoggedIn()) {
      render('login')
      return
    }

    // Admin guard
    if (config.adminOnly) {
      const user = Auth.getUser()
      if (!user || user.role !== 'admin') {
        Toast.error('Không có quyền truy cập')
        navigate('home')
        return
      }
    }

    _currentPage = page
    render(page)
  }

  function render(page) {
    const config = PAGES[page]
    const app = document.getElementById('app')
    const loading = document.getElementById('loading-screen')

    // Hide loading screen
    if (loading) loading.style.display = 'none'

    // Render page
    app.innerHTML = config.render()

    // Bottom navigation
    if (config.showNav) {
      app.innerHTML += renderBottomNav(page)
    }

    // Bind events (async)
    if (config.bind) {
      Promise.resolve(config.bind()).catch(e => {
        console.error('bind error:', e)
        Toast.error('Lỗi tải trang: ' + e.message)
      })
    }

    // Bind nav events
    if (config.showNav) {
      bindNavEvents()
    }
  }

  function renderBottomNav(activePage) {
    const user = Auth.getUser()
    const navItems = [
      { id: 'home', icon: 'fa-map-marker-alt', label: 'Check-in', page: 'home' },
      { id: 'profile', icon: 'fa-user-circle', label: 'Hồ sơ', page: 'profile' },
    ]

    if (user?.role === 'admin') {
      navItems.push({ id: 'admin', icon: 'fa-shield-alt', label: 'Quản trị', page: 'admin' })
    }

    return `
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-2xl z-50 safe-area-bottom">
      <div class="flex items-stretch max-w-lg mx-auto">
        ${navItems.map(item => `
          <button class="nav-btn flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${activePage === item.page ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}"
                  data-page="${item.page}">
            <i class="fas ${item.icon} text-xl"></i>
            <span class="text-xs font-medium">${item.label}</span>
            ${activePage === item.page ? '<span class="w-1 h-1 bg-blue-600 rounded-full"></span>' : ''}
          </button>
        `).join('')}
      </div>
    </nav>`
  }

  function bindNavEvents() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.page))
    })
  }

  async function init() {
    // Show loading for 1s then redirect
    await new Promise(r => setTimeout(r, 800))

    if (Auth.isLoggedIn()) {
      navigate('home')
    } else {
      navigate('login')
    }
  }

  return { navigate, init }
})()

// ── Boot ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  App.init()
})
