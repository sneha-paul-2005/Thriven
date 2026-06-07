const BASE_URL = "http://localhost:8000"

export const api = {
  signup: async (startupName, email, password) => {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startup_name: startupName,
        email,
        password
      })
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