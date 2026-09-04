const BASE_URL = "http://localhost:8000"

export const api = {
  signup: async (startupName, email, password) => {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startup_name: startupName, email, password })
    })
    return res.json()
  },

  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
    return res.json()
  },

  getMe: async (token) => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.json()
  },

  uploadCSV: async (token, file) => {
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch(`${BASE_URL}/metrics/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    })
    return res.json()
  },

  getDashboard: async (token) => {
    const res = await fetch(`${BASE_URL}/metrics/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.json()
  },

  getFunnel: async (token) => {
    const res = await fetch(`${BASE_URL}/metrics/funnel`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.json()
  },

  sendChatMessage: async (token, message, history) => {
    const res = await fetch(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ message, history })
    })
    return res.json()
  },

  getBenchmarks: async (token) => {
    const res = await fetch(`${BASE_URL}/benchmark`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.json()
  },

  setBenchmarks: async (token, baseline) => {
    const res = await fetch(`${BASE_URL}/benchmark/set`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(baseline)
    })
    return res.json()
  },

  runSimulation: async (token, params) => {
    const res = await fetch(`${BASE_URL}/simulation/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(params)
    })
    return res.json()
  },

  getCohorts: async (token, granularity) => {
    const res = await fetch(`${BASE_URL}/cohorts?granularity=${granularity}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.json()
  },

  sendDigestEmail: async (token) => {
    const res = await fetch(`${BASE_URL}/digest/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.json()
  },

  // --- Phase 11: Public Growth Page ---

  getPublicStatus: async (token) => {
    const res = await fetch(`${BASE_URL}/public/status`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.json()
  },

  enablePublicPage: async (token) => {
    const res = await fetch(`${BASE_URL}/public/enable`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.json()
  },

  disablePublicPage: async (token) => {
    const res = await fetch(`${BASE_URL}/public/disable`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.json()
  },

  // No auth — this is the actual public-facing endpoint PublicGrowth.tsx calls
  getPublicPage: async (publicToken) => {
    const res = await fetch(`${BASE_URL}/public/${publicToken}`)
    return res.json()
  }
}

export const saveToken = (token, startupName) => {
  localStorage.setItem("thriven_token", token)
  localStorage.setItem("thriven_startup", startupName)
}

export const getToken = () => localStorage.getItem("thriven_token")
export const getStartupName = () => localStorage.getItem("thriven_startup")
export const removeToken = () => {
  localStorage.removeItem("thriven_token")
  localStorage.removeItem("thriven_startup")
}
export const isLoggedIn = () => !!getToken()