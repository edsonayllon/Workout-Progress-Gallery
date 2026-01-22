const API_BASE = '/api'

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`

  const config = {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
    },
  }

  // Don't set Content-Type for FormData (let browser set it with boundary)
  if (!(options.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(url, config)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

// Auth API
export const authApi = {
  getRegistrationOptions: () =>
    request('/auth/register/options', {
      method: 'POST',
    }),

  verifyRegistration: (data) =>
    request('/auth/register/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getLoginOptions: () =>
    request('/auth/login/options', {
      method: 'POST',
    }),

  verifyLogin: (data) =>
    request('/auth/login/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    request('/auth/logout', { method: 'POST' }),

  getCurrentUser: () =>
    request('/auth/me'),

  updateUser: (data) =>
    request('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}

// Photos API
export const photosApi = {
  list: () =>
    request('/photos'),

  upload: (file, date) => {
    const formData = new FormData()
    formData.append('photo', file)
    if (date) {
      formData.append('date', date)
    }
    return request('/photos', {
      method: 'POST',
      body: formData,
    })
  },

  update: (id, data) =>
    request(`/photos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`/photos/${id}`, { method: 'DELETE' }),
}
