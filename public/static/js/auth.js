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
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-slate-200 flex flex-col">
      <!-- Top decorative bar -->
      <div class="h-1.5 bg-gradient-to-r from-red-600 via-red-500 to-orange-400"></div>

      <div class="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div class="w-full max-w-md">

          <!-- Logo card -->
          <div class="text-center mb-8">
            <div class="inline-flex flex-col items-center">
              <div class="bg-white rounded-3xl shadow-xl p-5 mb-5 border border-gray-100">
                <img src="https://nhankiet.vn/uploads/01_Logo/Logo%20khong%20nen.jpg" alt="Nhân Kiệt"
                  class="w-24 h-24 object-contain" />
              </div>
              <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Nhân Viên Thị Trường</h1>
              <p class="text-gray-500 text-sm mt-1.5">Hệ thống quản lý chấm công & hoạt động</p>
            </div>
          </div>

          <!-- Login card -->
          <div class="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <!-- Card header -->
            <div class="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
              <h2 class="text-white font-semibold text-base flex items-center gap-2">
                <i class="fas fa-sign-in-alt"></i> Đăng nhập tài khoản
              </h2>
            </div>
            <!-- Card body -->
            <div class="p-6 sm:p-8">
              <form id="login-form" class="space-y-5">
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Số điện thoại</label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <i class="fas fa-mobile-alt text-base"></i>
                    </span>
                    <input type="tel" id="login-username" placeholder="Nhập số điện thoại (VD: 0901234567)"
                      class="w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:ring-0 outline-none text-sm font-medium transition-colors bg-gray-50 focus:bg-white"
                      autocomplete="tel" inputmode="tel" required />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mật khẩu</label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <i class="fas fa-lock text-base"></i>
                    </span>
                    <input type="password" id="login-password" placeholder="Nhập mật khẩu"
                      class="w-full pl-11 pr-12 py-3.5 border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:ring-0 outline-none text-sm font-medium transition-colors bg-gray-50 focus:bg-white"
                      autocomplete="current-password" required />
                    <button type="button" id="toggle-pw"
                      class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      <i class="fas fa-eye text-base"></i>
                    </button>
                  </div>
                </div>
                <p id="login-error" class="text-red-500 text-sm text-center hidden bg-red-50 rounded-xl px-3 py-2"></p>
                <button type="submit" id="login-btn"
                  class="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-200 text-base">
                  <i class="fas fa-sign-in-alt"></i>
                  <span>Đăng nhập</span>
                </button>
              </form>
            </div>
            <!-- Card footer -->
            <div class="border-t border-gray-100 px-6 py-4 bg-gray-50 text-center">
              <span class="text-gray-500 text-sm">Chưa có tài khoản?</span>
              <button id="btn-go-register" class="text-red-600 font-bold hover:text-red-700 ml-2 text-sm transition-colors">Đăng ký ngay →</button>
            </div>
          </div>

          <!-- Version + footer -->
          <div class="text-center mt-6 space-y-1">
            <p class="text-gray-400 text-xs">v${APP_CONFIG.VERSION}</p>
            <p class="text-gray-400 text-xs">Phát triển bởi <a href="https://nhankiet.vn" class="text-red-500 font-semibold hover:underline">nhankiet.vn</a></p>
            <p class="text-gray-400 text-xs">© 2026 Nhân Kiệt. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
    `
  }

  function bindLoginEvents() {
    const form = document.getElementById('login-form')
    const errEl = document.getElementById('login-error')
    const btn = document.getElementById('login-btn')

    // Toggle show/hide password
    const togglePw = document.getElementById('toggle-pw')
    const pwInput  = document.getElementById('login-password')
    if (togglePw && pwInput) {
      togglePw.addEventListener('click', () => {
        const show = pwInput.type === 'password'
        pwInput.type = show ? 'text' : 'password'
        togglePw.innerHTML = show ? '<i class="fas fa-eye-slash text-base"></i>' : '<i class="fas fa-eye text-base"></i>'
      })
    }

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
