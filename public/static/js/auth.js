// =============================================
// Module: Auth
// Đăng nhập, đăng xuất, quản lý session
// =============================================
window.Auth = (() => {
  let _user = null

  function getUser() {
    if (_user) return _user
    try {
      const s = localStorage.getItem(APP_CONFIG.USER_KEY)
      return s ? JSON.parse(s) : null
    } catch { return null }
  }

  function setSession(token, user) {
    localStorage.setItem(APP_CONFIG.TOKEN_KEY, token)
    localStorage.setItem(APP_CONFIG.USER_KEY, JSON.stringify(user))
    _user = user
  }

  function clearSession() {
    localStorage.removeItem(APP_CONFIG.TOKEN_KEY)
    localStorage.removeItem(APP_CONFIG.USER_KEY)
    _user = null
  }

  function isLoggedIn() {
    return !!localStorage.getItem(APP_CONFIG.TOKEN_KEY)
  }

  async function login(username, password) {
    const res = await API.login(username, password)
    if (res.success && res.data.token) {
      setSession(res.data.token, res.data.user)
    }
    return res
  }

  async function logout() {
    try { await API.logout() } catch {}
    clearSession()
    window.App.navigate('login')
  }

  // ── UI Render ──────────────────────────────

  function renderLoginPage() {
    return `
    <div class="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex items-center justify-center p-4">
      <div class="w-full max-w-sm">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-2xl mb-4 backdrop-blur">
            <i class="fas fa-map-marker-alt text-4xl text-white"></i>
          </div>
          <h1 class="text-2xl font-bold text-white">Nhân Viên Thị Trường</h1>
          <p class="text-blue-200 text-sm mt-1">Vui lòng đăng nhập để tiếp tục</p>
        </div>

        <!-- Form -->
        <div class="bg-white rounded-2xl shadow-2xl p-6">
          <form id="login-form" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
              <div class="relative">
                <i class="fas fa-user absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input type="text" id="login-username" placeholder="Nhập tên đăng nhập"
                  class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  autocomplete="username" required />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <div class="relative">
                <i class="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input type="password" id="login-password" placeholder="Nhập mật khẩu"
                  class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  autocomplete="current-password" required />
              </div>
            </div>
            <button type="submit" id="login-btn"
              class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
              <i class="fas fa-sign-in-alt"></i>
              <span>Đăng nhập</span>
            </button>
          </form>
          <p id="login-error" class="text-red-500 text-sm text-center mt-3 hidden"></p>
        </div>
        <p class="text-center text-blue-200 text-sm mt-5">
          Chưa có tài khoản?
          <button id="btn-go-register" class="text-white font-semibold underline ml-1">Đăng ký ngay</button>
        </p>
        <p class="text-center text-blue-200 text-xs mt-2">v${APP_CONFIG.VERSION}</p>
      </div>
    </div>
    `
  }

  function bindLoginEvents() {
    const form = document.getElementById('login-form')
    const errEl = document.getElementById('login-error')
    const btn = document.getElementById('login-btn')

    // Link sang trang đăng ký
    const gotoRegister = document.getElementById('btn-go-register')
    if (gotoRegister) gotoRegister.onclick = () => window.App.navigate('register')

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const username = document.getElementById('login-username').value.trim()
      const password = document.getElementById('login-password').value

      btn.disabled = true
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng nhập...'
      errEl.classList.add('hidden')

      try {
        await login(username, password)
        window.App.navigate('home')
      } catch (err) {
        errEl.textContent = err.message
        errEl.classList.remove('hidden')
      } finally {
        btn.disabled = false
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Đăng nhập'
      }
    })
  }

  // Trang đổi mật khẩu (dùng trong modal)
  function showChangePasswordModal() {
    const { overlay, close } = Modal.create(`
      <div class="p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-key mr-2 text-blue-600"></i>Đổi mật khẩu</h3>
        <form id="cp-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
            <input type="password" id="cp-old" class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
            <input type="password" id="cp-new" class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
            <input type="password" id="cp-confirm" class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <p id="cp-error" class="text-red-500 text-sm hidden"></p>
          <div class="flex gap-3">
            <button type="button" id="cp-cancel" class="flex-1 py-2 border rounded-lg text-gray-700">Hủy</button>
            <button type="submit" class="flex-1 py-2 bg-blue-600 text-white rounded-lg">Lưu</button>
          </div>
        </form>
      </div>
    `)
    document.getElementById('cp-cancel').onclick = close
    document.getElementById('cp-form').onsubmit = async (e) => {
      e.preventDefault()
      const old_password = document.getElementById('cp-old').value
      const new_password = document.getElementById('cp-new').value
      const confirm = document.getElementById('cp-confirm').value
      const errEl = document.getElementById('cp-error')

      if (new_password !== confirm) {
        errEl.textContent = 'Mật khẩu xác nhận không khớp'; errEl.classList.remove('hidden'); return
      }
      try {
        await API.changePassword(old_password, new_password)
        Toast.success('Đổi mật khẩu thành công')
        close()
      } catch (err) {
        errEl.textContent = err.message; errEl.classList.remove('hidden')
      }
    }
  }

  return { getUser, isLoggedIn, login, logout, renderLoginPage, bindLoginEvents, showChangePasswordModal }
})()
