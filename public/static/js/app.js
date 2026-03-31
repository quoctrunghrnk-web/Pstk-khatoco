// =============================================
// Module: App (Main Controller / Router)
// Điều hướng giữa các trang
// =============================================
window.App = (() => {
  let _currentPage = null

  const PAGES = {
    login: {
      render: () => Auth.renderLoginPage(),
      bind:   () => Auth.bindLoginEvents(),
      requireAuth: false,
      showNav: false,
    },
    register: {
      render: () => RegisterModule.renderPage(),
      bind:   () => RegisterModule.bindEvents(),
      requireAuth: false,
      showNav: false,
    },
    home: {
      render: () => CheckinModule.renderPage(),
      bind:   () => CheckinModule.bindEvents(),
      requireAuth: true,
      staffOnly: true,   // chỉ nhân viên
      showNav: true,
    },
    profile: {
      render: () => ProfileModule.renderPage(),
      bind:   () => ProfileModule.bindEvents(),
      requireAuth: true,
      staffOnly: true,   // chỉ nhân viên
      showNav: true,
    },
    admin: {
      render: () => AdminModule.renderPage(),
      bind:   () => AdminModule.bindEvents(),
      requireAuth: true,
      adminOnly: true,   // chỉ admin
      showNav: true,
    },
  }

  function navigate(page) {
    const config = PAGES[page]
    if (!config) { navigate(_defaultPage()); return }

    // Auth guard
    if (config.requireAuth && !Auth.isLoggedIn()) {
      render('login'); return
    }

    // Admin-only guard
    if (config.adminOnly) {
      const user = Auth.getUser()
      if (!user || user.role !== 'admin') {
        Toast.error('Không có quyền truy cập')
        navigate('home'); return
      }
    }

    // Staff-only guard (admin không vào được trang staff)
    if (config.staffOnly) {
      const user = Auth.getUser()
      if (user?.role === 'admin') {
        navigate('admin'); return
      }
    }

    _currentPage = page
    render(page)
  }

  // Trang mặc định sau login tuỳ role
  function _defaultPage() {
    const user = Auth.getUser()
    return user?.role === 'admin' ? 'admin' : 'home'
  }

  function render(page) {
    const config = PAGES[page]
    const app = document.getElementById('app')
    const loading = document.getElementById('loading-screen')

    if (loading) loading.style.display = 'none'

    app.innerHTML = config.render()

    if (config.showNav) {
      app.innerHTML += renderBottomNav(page)
    }

    if (config.bind) {
      Promise.resolve(config.bind()).catch(e => {
        console.error('bind error:', e)
        Toast.error('Lỗi tải trang: ' + e.message)
      })
    }

    if (config.showNav) {
      bindNavEvents()
    }
  }

  function renderBottomNav(activePage) {
    const user = Auth.getUser()
    let navItems = []

    if (user?.role === 'admin') {
      // Admin chỉ thấy đúng 1 tab Quản trị
      navItems = [
        { icon: 'fa-shield-alt', label: 'Quản trị', page: 'admin' },
      ]
    } else {
      // Nhân viên: Check-in + Hồ sơ
      navItems = [
        { icon: 'fa-map-marker-alt', label: 'Check-in', page: 'home' },
        { icon: 'fa-user-circle',    label: 'Hồ sơ',    page: 'profile' },
      ]
    }

    return `
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-2xl z-50 safe-area-bottom">
      <div class="flex items-stretch max-w-lg mx-auto">
        ${navItems.map(item => `
          <button class="nav-btn flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors
            ${activePage === item.page ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}"
            data-page="${item.page}">
            <i class="fas ${item.icon} text-xl"></i>
            <span class="text-xs font-medium">${item.label}</span>
            ${activePage === item.page ? '<span class="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>' : '<span class="w-1.5 h-1.5"></span>'}
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
    await new Promise(r => setTimeout(r, 700))
    if (Auth.isLoggedIn()) {
      navigate(_defaultPage())
    } else {
      navigate('login')
    }
  }

  return { navigate, init }
})()

// ── Boot ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init())
