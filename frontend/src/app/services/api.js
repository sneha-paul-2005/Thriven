// Set VITE_API_URL in production (Vercel) to your Render backend URL.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

const jsonPost = (body) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body)
})

// Every logged-in request goes through here. On 401 (expired or invalid token)
// it clears the session and sends the user to /login instead of returning
// error JSON that pages might mistake for data.
const authed = async (path, token, options = {}) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` }
  })
  if (res.status === 401) {
    removeToken()
    if (window.location.pathname !== "/login") {
      window.location.href = "/login"
    }
    throw new Error("Session expired")
  }
  return res.json()
}

export const api = {
  // Public (no token): wrong credentials here must NOT trigger the redirect
  signup: async (startupName, email, password) => {
    const res = await fetch(
      `${BASE_URL}/auth/signup`,
      jsonPost({ startup_name: startupName, email, password })
    )
    return res.json()
  },

  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, jsonPost({ email, password }))
    return res.json()
  },

  getPublicPage: async (publicToken) => {
    const res = await fetch(`${BASE_URL}/public/${publicToken}`)
    return res.json()
  },

  // Authenticated
  getMe: (token) => authed("/auth/me", token),

  getProfile: (token) => authed("/profile", token),
  updateProfile: (token, fields) =>
    authed("/profile", token, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields)
    }),

  uploadCSV: (token, file) => {
    const formData = new FormData()
    formData.append("file", file)
    // No Content-Type here: the browser sets the multipart boundary itself
    return authed("/metrics/upload", token, { method: "POST", body: formData })
  },

  getDashboard: (token) => authed("/metrics/dashboard", token),
  getFunnel: (token) => authed("/metrics/funnel", token),

  sendChatMessage: (token, message, history) =>
    authed("/ai/chat", token, jsonPost({ message, history })),

  getBenchmarks: (token) => authed("/benchmark", token),
  setBenchmarks: (token, baseline) =>
    authed("/benchmark/set", token, jsonPost(baseline)),

  runSimulation: (token, params) =>
    authed("/simulation/run", token, jsonPost(params)),

  getCohorts: (token, granularity) =>
    authed(`/cohorts?granularity=${granularity}`, token),

  sendDigestEmail: (token) => authed("/digest/send", token, { method: "POST" }),

  // --- Phase 11: Public Growth Page ---
  getPublicStatus: (token) => authed("/public/status", token),
  enablePublicPage: (token) => authed("/public/enable", token, { method: "POST" }),
  disablePublicPage: (token) => authed("/public/disable", token, { method: "POST" })
}

export const saveToken = (token, startupName) => {
  localStorage.setItem("thriven_token", token)
  localStorage.setItem("thriven_startup", startupName)
}

// Updates the name shown in the top bar and tells the layout to refresh it
export const setDisplayName = (name) => {
  localStorage.setItem("thriven_startup", name)
  window.dispatchEvent(new Event("thriven-profile-updated"))
}

export const getToken = () => localStorage.getItem("thriven_token")
export const getStartupName = () => localStorage.getItem("thriven_startup")
export const removeToken = () => {
  localStorage.removeItem("thriven_token")
  localStorage.removeItem("thriven_startup")
}
export const isLoggedIn = () => !!getToken()