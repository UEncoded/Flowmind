import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import * as SecureStore from 'expo-secure-store'
import axios from 'axios'
import type { User, UserPersona, AuthTokens } from '@flowmind/shared'

// ─── Secure storage adapter for Zustand persist ───────────
const secureStorage = {
  getItem:    (key: string) => SecureStore.getItemAsync(key),
  setItem:    (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

const API = 'https://flowmind-backend-64ix.onrender.com'

interface AuthState {
  user:         User | null
  accessToken:  string | null
  refreshToken: string | null
  isLoading:    boolean
  login:      (email: string, password: string) => Promise<void>
  signup:     (name: string, email: string, password: string, persona?: UserPersona) => Promise<void>
  logout:     () => Promise<void>
  refresh:    () => Promise<boolean>
  updateUser: (u: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null, accessToken: null, refreshToken: null, isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await axios.post(`${API}/api/auth/login`, { email, password })
          set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isLoading: false })
        } catch (e: any) {
          set({ isLoading: false })
          throw new Error(e.response?.data?.error || 'Login failed')
        }
      },

      signup: async (name, email, password, persona = 'other') => {
        set({ isLoading: true })
        try {
          const { data } = await axios.post(`${API}/api/auth/signup`, { name, email, password, persona })
          set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isLoading: false })
        } catch (e: any) {
          set({ isLoading: false })
          throw new Error(e.response?.data?.error || 'Signup failed')
        }
      },

      logout: async () => {
        const { refreshToken, accessToken } = get()
        try {
          await axios.post(`${API}/api/auth/logout`, { refreshToken }, {
            headers: { Authorization: `Bearer ${accessToken}` }
          })
        } catch { /* ignore */ }
        set({ user: null, accessToken: null, refreshToken: null })
      },

      refresh: async () => {
        const { refreshToken } = get()
        if (!refreshToken) return false
        try {
          const { data } = await axios.post<AuthTokens>(`${API}/api/auth/refresh`, { refreshToken })
          set({ accessToken: data.accessToken, refreshToken: data.refreshToken })
          return true
        } catch {
          set({ user: null, accessToken: null, refreshToken: null })
          return false
        }
      },

      updateUser: (updates) => {
        const { user } = get()
        if (user) set({ user: { ...user, ...updates } })
      },
    }),
    {
      name:    'flowmind-mobile-auth',
      storage: createJSONStorage(() => secureStorage),
      partialize: s => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }),
    }
  )
)

// Axios interceptors — same as web
axios.interceptors.request.use(config => {
  const token = useAuthStore.getState().accessToken
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
  return config
})

axios.interceptors.response.use(
  res => res,
  async err => {
    const orig = err.config
    if (err.response?.status === 401 && err.response?.data?.code === 'TOKEN_EXPIRED' && !orig._retry) {
      orig._retry = true
      const ok = await useAuthStore.getState().refresh()
      if (ok) {
        orig.headers.Authorization = `Bearer ${useAuthStore.getState().accessToken}`
        return axios(orig)
      }
    }
    return Promise.reject(err)
  }
)
