import { create } from 'zustand'
import api from '../api/client'

interface User {
  id: number
  username: string
  email: string
}

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  checkAuth: () => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const useAuth = create<AuthStore>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  checkAuth: async () => {
    set({ isLoading: true })
    
    try {
      const token = api.getToken()
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false })
        return
      }

      const result = await api.getMe()
      if (result.success && result.data) {
        set({
          user: result.data.user,
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        api.setToken(null)
        set({ user: null, isAuthenticated: false, isLoading: false })
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  logout: () => {
    api.setToken(null)
    set({ user: null, isAuthenticated: false })
  },

  refreshUser: async () => {
    if (!api.isAuthenticated()) return
    
    const result = await api.getMe()
    if (result.success && result.data) {
      set({ user: result.data.user, isAuthenticated: true })
    }
  },
}))

if (typeof window !== 'undefined') {
  useAuth.getState().checkAuth()
}

export default useAuth
