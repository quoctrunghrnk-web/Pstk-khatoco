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

    const data = await res.json()
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
    updateActivity: (data) => request('POST', '/checkin/activity', data),
    checkinEnd: (data) => request('POST', '/checkin/end', data),
    getToday: () => request('GET', '/checkin/today'),
    getHistory: (page = 1, limit = 10) => request('GET', `/checkin/history?page=${page}&limit=${limit}`),
    getCheckinDetail: (id) => request('GET', `/checkin/${id}`),

    // Admin - Nhân viên
    getUsers: () => request('GET', '/admin/users'),
    createUser: (data) => request('POST', '/admin/users', data),
    updateUser: (id, data) => request('PUT', `/admin/users/${id}`, data),
    updateUserStatus: (id, account_status) => request('PATCH', `/admin/users/${id}/status`, { account_status }),
    deleteUser: (id) => request('DELETE', `/admin/users/${id}`),
    getUserProfile: (id) => request('GET', `/admin/users/${id}/profile`),
    resetPassword: (user_id, new_password) => request('POST', '/admin/reset-password', { user_id, new_password }),

    // Admin - Check-in / Báo cáo
    getAdminCheckins: (params = {}) => {
      const q = new URLSearchParams({ limit: '100', ...params })
      return request('GET', `/admin/checkins?${q}`)
    },
    getAdminCheckinDetail: (id) => request('GET', `/admin/checkins/${id}`),
    getAdminSummary: (params = {}) => {
      const q = new URLSearchParams(params)
      return request('GET', `/admin/reports/summary?${q}`)
    },
  }
})()
