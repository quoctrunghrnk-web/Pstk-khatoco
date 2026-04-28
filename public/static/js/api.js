// =============================================
// Module: API Client
// Tất cả gọi HTTP đến backend
// =============================================
window.API = (() => {
  const BASE = APP_CONFIG.API_BASE

  function getToken() {
    return localStorage.getItem(APP_CONFIG.TOKEN_KEY)
  }

  async function request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' }
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    })

    let data
    try {
      data = await res.json()
    } catch {
      throw new Error(res.ok ? 'Phản hồi không hợp lệ từ server' : `Lỗi server (${res.status})`)
    }
    if (!res.ok && data.message) throw new Error(data.message)
    return data
  }

  return {
    // Auth
    login: (username, password) => request('POST', '/auth/login', { username, password }),
    register: (data) => request('POST', '/auth/register', data),
    logout: () => request('POST', '/auth/logout'),
    me: () => request('GET', '/auth/me'),
    changePassword: (old_password, new_password) => request('POST', '/auth/change-password', { old_password, new_password }),

    // Profile
    getProfile: () => request('GET', '/profile'),
    updateProfile: (data) => request('PUT', '/profile', data),
    uploadCCCD: (front, back) => request('POST', '/profile/upload-cccd', { front, back }),

    // Checkin
    checkinStart: (data) => request('POST', '/checkin/start', data),
    checkinEnd: (data) => request('POST', '/checkin/end', data),
    getToday: () => request('GET', '/checkin/today'),
    getHistory: (page = 1, limit = 10) => request('GET', `/checkin/history?page=${page}&limit=${limit}`),
    getCheckinDetail: (id) => request('GET', `/checkin/${id}`),
    getProducts: () => request('GET', '/checkin/products'),
    getGifts: () => request('GET', '/checkin/gifts'),

    // Admin - Nhân viên
    // getUsers(params) hoặc getUsers() — params = { province: '...' }
    getUsers: (params = {}) => {
      const q = new URLSearchParams(params)
      const qs = q.toString()
      return request('GET', qs ? `/admin/users?${qs}` : '/admin/users')
    },
    createUser: (data) => request('POST', '/admin/users', data),
    updateUser: (id, data) => request('PUT', `/admin/users/${id}`, data),
    updateUserStatus: (id, account_status) => request('PATCH', `/admin/users/${id}/status`, { account_status }),
    deleteUser: (id) => request('DELETE', `/admin/users/${id}`),
    getUserProfile: (id) => request('GET', `/admin/users/${id}/profile`),
    resetPassword: (user_id, new_password) => request('POST', '/admin/reset-password', { user_id, new_password }),

    // Admin - Check-in / Báo cáo
    // getAdminCheckins(date, extraParams) hoặc getAdminCheckins(date)
    getAdminCheckins: (date, extraParams = {}) => {
      const q = new URLSearchParams({ limit: '200', ...extraParams })
      if (date) q.set('date', date)
      return request('GET', `/admin/checkins?${q}`)
    },
    getAdminCheckinDetail: (id) => request('GET', `/admin/checkins/${id}`),
    getAdminSummary: (params = {}) => {
      const q = new URLSearchParams(params)
      return request('GET', `/admin/reports/summary?${q}`)
    },
    getProvinces: () => request('GET', '/admin/reports/provinces'),

    // Public: danh sách tỉnh/thành hoạt động (không cần đăng nhập)
    getActiveProvinces: () => request('GET', '/provinces'),

    // Admin - Quản lý tỉnh/thành hoạt động
    addProvince: (name) => request('POST', '/admin/provinces', { name }),
    deleteProvince: (id) => request('DELETE', `/admin/provinces/${id}`),

    // Admin - Quản lý sản phẩm
    getAdminProducts: () => request('GET', '/admin/products'),
    createProduct: (data) => request('POST', '/admin/products', data),
    updateProduct: (id, data) => request('PATCH', `/admin/products/${id}`, data),
    deleteProduct: (id) => request('DELETE', `/admin/products/${id}`),

    // Admin - Quản lý quà tặng
    getAdminGifts: () => request('GET', '/admin/gifts'),
    createGift: (data) => request('POST', '/admin/gifts', data),
    updateGift: (id, data) => request('PATCH', `/admin/gifts/${id}`, data),
    deleteGift: (id) => request('DELETE', `/admin/gifts/${id}`),
  }
})()
