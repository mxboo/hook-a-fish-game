const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:2567'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface User {
  id: number
  username: string
  email: string
  created_at?: string
}

interface AuthData {
  user: User
  token: string
}

interface ScoreData {
  id: number
  user_id: number
  username: string
  score: number
  fish_count: number
  duration: number
  created_at: string
}

interface LeaderboardResponse {
  leaderboard: ScoreData[]
  total: number
}

interface MyScoresResponse {
  scores: ScoreData[]
  best_score: number
  total_games: number
  rank: number
}

class ApiClient {
  private token: string | null = null

  constructor() {
    this.token = localStorage.getItem('auth_token')
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  getToken(): string | null {
    return this.token
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  getCurrentUser(): User | null {
    if (!this.token) return null
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]))
      return {
        id: payload.id,
        username: payload.username,
        email: payload.email,
      }
    } catch {
      return null
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || '请求失败',
          message: data.message,
        }
      }

      return data
    } catch (error: any) {
      return {
        success: false,
        error: '网络错误',
        message: error.message,
      }
    }
  }

  async register(username: string, password: string): Promise<ApiResponse<AuthData>> {
    const result = await this.request<AuthData>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })

    if (result.success && result.data) {
      this.setToken(result.data.token)
    }

    return result
  }

  async login(username: string, password: string): Promise<ApiResponse<AuthData>> {
    const result = await this.request<AuthData>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })

    if (result.success && result.data) {
      this.setToken(result.data.token)
    }

    return result
  }

  logout() {
    this.setToken(null)
  }

  async getMe(): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>('/api/auth/me')
  }

  async getLeaderboard(limit: number = 100): Promise<ApiResponse<LeaderboardResponse>> {
    return this.request<LeaderboardResponse>(`/api/leaderboard?limit=${limit}`)
  }

  async submitScore(score: number, fish_count: number, duration: number): Promise<ApiResponse<any>> {
    return this.request('/api/leaderboard/score', {
      method: 'POST',
      body: JSON.stringify({ score, fish_count, duration }),
    })
  }

  async getMyScores(limit: number = 10): Promise<ApiResponse<MyScoresResponse>> {
    return this.request<MyScoresResponse>(`/api/leaderboard/my-scores?limit=${limit}`)
  }

  async getMyRank(): Promise<ApiResponse<MyScoresResponse>> {
    return this.request<MyScoresResponse>('/api/leaderboard/my-rank')
  }
}

export const api = new ApiClient()
export default api
